/**
 * Edit intake: detect divergence, compile a bypass edit region-by-region into
 * attributed *proposed* operations, and apply them through the core.
 *
 * Byte divergence is only a trigger, never semantic evidence: a formatter pass
 * compiles to zero proposals. Each proposal carries a confidence class —
 * mechanical (auto-validatable), inferred, or ambiguous (deletion/rename, always
 * held for confirmation). Preconditions come from the projection basis, so a
 * stale edit surfaces an explicit conflict instead of overwriting.
 */

import type { Campaign } from "../campaign.ts";
import type { Receipt } from "../core/receipt.ts";
import { operationId, type AssertionId } from "../core/ids.ts";
import { normalize, pageSha, type Manifest } from "./project.ts";

export type Confidence = "mechanical" | "inferred" | "ambiguous";

export type Proposal =
  | { kind: "correct-field"; confidence: Confidence; assertion: AssertionId; attribute: string; value: string; note: string }
  | { kind: "assert-field"; confidence: Confidence; attribute: string; value: string; note: string }
  | { kind: "retract-field"; confidence: Confidence; assertion: AssertionId; attribute: string; note: string }
  | { kind: "correct-note"; confidence: Confidence; assertion: AssertionId; value: string; note: string }
  | { kind: "assert-note"; confidence: Confidence; value: string; note: string }
  | { kind: "retract-note"; confidence: Confidence; assertion: AssertionId; note: string }
  | { kind: "rename"; confidence: Confidence; value: string; note: string };

export interface IntakeResult {
  diverged: boolean;
  proposals: Proposal[];
  notes: string[];
}

interface ParsedPage {
  frontmatter: Record<string, string>;
  notes: Record<string, string>; // block id -> normalized text
  untagged: string[];
  errors: string[];
}

const RESERVED = new Set(["entity", "name", "basis"]);

function parsePage(text: string): ParsedPage {
  const errors: string[] = [];
  const lines = text.split("\n");
  const frontmatter: Record<string, string> = {};
  let i = 0;

  if (lines[0]?.trim() === "---") {
    i = 1;
    while (i < lines.length && lines[i]?.trim() !== "---") {
      const line = lines[i]!;
      const m = /^([A-Za-z_][\w-]*):\s*(.*)$/.exec(line);
      if (m) frontmatter[m[1]!] = m[2]!.trim();
      else if (line.trim()) errors.push(`unparseable frontmatter line: ${JSON.stringify(line)}`);
      i++;
    }
    if (i >= lines.length) errors.push("unterminated frontmatter");
    i++;
  } else {
    errors.push("missing frontmatter");
  }

  const notes: Record<string, string> = {};
  const untagged: string[] = [];
  let inNotes = false;
  let currentId: string | null = null;
  let buffer: string[] = [];

  const flush = () => {
    const para = normalize(buffer.join("\n"));
    if (para) {
      if (currentId === null) untagged.push(para);
      else if (currentId in notes) errors.push(`duplicate claim tag ${currentId}; later block ignored`);
      else notes[currentId] = para;
    }
    currentId = null;
    buffer = [];
  };

  for (; i < lines.length; i++) {
    const line = lines[i]!;
    if (/^##\s+Notes\s*$/.test(line)) {
      inNotes = true;
      continue;
    }
    if (!inNotes) continue;
    const tag = /^\s*<!--\s*claim:([\w-]+)\s*-->\s*$/.exec(line);
    if (tag) {
      flush();
      currentId = tag[1]!;
    } else if (!line.trim()) {
      if (buffer.length) flush();
    } else {
      buffer.push(line);
    }
  }
  flush();

  return { frontmatter, notes, untagged, errors };
}

/** Diff a bypass-edited page against its manifest. Never mutates anything. */
export function compileEdit(manifest: Manifest, editedText: string): IntakeResult {
  if (pageSha(editedText) === manifest.sha) return { diverged: false, proposals: [], notes: [] };

  const parsed = parsePage(editedText);
  const notes = [...parsed.errors];
  const proposals: Proposal[] = [];

  if (parsed.frontmatter["basis"] !== undefined && parsed.frontmatter["basis"] !== String(manifest.basis)) {
    notes.push(`page declares basis ${parsed.frontmatter["basis"]}, manifest basis is ${manifest.basis}; preconditions taken from the manifest`);
  }
  if (parsed.frontmatter["entity"] && parsed.frontmatter["entity"] !== String(manifest.anchor)) {
    notes.push(`entity id edited; identity is not editable via projection, ignored`);
  }
  if (parsed.frontmatter["name"] && parsed.frontmatter["name"] !== manifest.label) {
    proposals.push({ kind: "rename", confidence: "ambiguous", value: parsed.frontmatter["name"], note: "rename vs distinct-entity cannot be told from a diff" });
  }

  // frontmatter field regions
  for (const [attribute, { assertion, value }] of Object.entries(manifest.fields)) {
    if (!(attribute in parsed.frontmatter)) {
      proposals.push({ kind: "retract-field", confidence: "ambiguous", assertion, attribute, note: `field ${attribute} removed: retraction or accident?` });
    } else if (parsed.frontmatter[attribute] !== value) {
      proposals.push({ kind: "correct-field", confidence: "mechanical", assertion, attribute, value: parsed.frontmatter[attribute]!, note: "" });
    }
  }
  for (const [key, value] of Object.entries(parsed.frontmatter)) {
    if (!RESERVED.has(key) && !(key in manifest.fields)) {
      proposals.push({ kind: "assert-field", confidence: "inferred", attribute: key, value, note: `new frontmatter field ${key}` });
    }
  }

  // note block regions
  for (const [id, projected] of Object.entries(manifest.blocks)) {
    if (!(id in parsed.notes)) {
      proposals.push({ kind: "retract-note", confidence: "ambiguous", assertion: id as AssertionId, note: `note block ${id} missing: retraction or accidental deletion?` });
    } else if (parsed.notes[id] !== projected) {
      proposals.push({ kind: "correct-note", confidence: "mechanical", assertion: id as AssertionId, value: parsed.notes[id]!, note: "" });
    }
  }
  for (const para of parsed.untagged) {
    proposals.push({ kind: "assert-note", confidence: "inferred", value: para, note: "untagged paragraph under ## Notes" });
  }

  if (proposals.length === 0 && notes.length === 0) {
    notes.push("bytes diverged but no region-level change (formatting-only edit)");
  }
  return { diverged: true, proposals, notes };
}

export interface Disposition {
  proposal: Proposal;
  outcome: "accepted" | "rejected" | "held";
  reason: string;
  receipt?: Receipt;
}

/**
 * Apply compiled proposals through the core. Ambiguous proposals are held for
 * confirmation; the rest submit with preconditions taken from the projection
 * basis, so a stale edit conflicts rather than overwriting.
 */
export function applyIntake(campaign: Campaign, manifest: Manifest, result: IntakeResult, actor: string): Disposition[] {
  const dispositions: Disposition[] = [];
  let seq = 0;
  const oid = () => operationId(`intake-${manifest.basis}-${++seq}`);

  for (const proposal of result.proposals) {
    if (proposal.confidence === "ambiguous") {
      dispositions.push({ proposal, outcome: "held", reason: "ambiguous edit held for human confirmation" });
      continue;
    }
    let receipt: Receipt;
    switch (proposal.kind) {
      case "correct-field":
      case "correct-note":
        receipt = campaign.submit({ kind: "correct", operationId: oid(), actor, target: proposal.assertion, value: proposal.value, expect: [{ assertion: proposal.assertion, standing: "active" }] });
        break;
      case "assert-field":
        receipt = campaign.submit({ kind: "assert", operationId: oid(), actor, stance: "establishment", proposition: { subject: manifest.anchor, attribute: proposal.attribute, value: proposal.value }, fictionalTime: null, mode: "participant-narration" });
        break;
      case "assert-note":
        receipt = campaign.submit({ kind: "assert", operationId: oid(), actor, stance: "establishment", proposition: { subject: manifest.anchor, attribute: "note", value: proposal.value }, fictionalTime: null, mode: "participant-narration" });
        break;
      default:
        dispositions.push({ proposal, outcome: "held", reason: "not auto-applicable" });
        continue;
    }
    dispositions.push({ proposal, outcome: receipt.disposition, reason: receipt.reason, receipt });
  }
  return dispositions;
}
