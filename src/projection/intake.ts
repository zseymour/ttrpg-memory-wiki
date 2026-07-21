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
import type { AssertionRecord, CampaignState } from "../core/state.ts";
import { contentFingerprint, NOTE_ATTRIBUTE, normalize, pageSha, project, SHIELD, type Manifest } from "./project.ts";

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
    // Standing sections (Preparation, Beliefs, …) follow Notes and are read-only:
    // a new heading closes the editable Notes region rather than being slurped into it.
    if (inNotes && /^##\s+/.test(line)) {
      flush();
      inNotes = false;
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
  // A value whose fingerprint matches rewound establishment content is a resurrection:
  // rewound content must not silently return to play, so re-adding it is held, not dropped.
  const resurrects = (attribute: string, value: string) => manifest.rewound.includes(contentFingerprint(attribute, value));

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
    if (manifest.shielded.fields.includes(attribute)) {
      // A shielded field renders a marker, not its content; an edit to the marker
      // has nothing to correct against. Reveal the page to edit it.
      if (parsed.frontmatter[attribute] !== value) notes.push(`field ${attribute} is shielded; edit ignored (reveal to edit)`);
      continue;
    }
    if (!(attribute in parsed.frontmatter)) {
      proposals.push({ kind: "retract-field", confidence: "ambiguous", assertion, attribute, note: `field ${attribute} removed: retraction or accident?` });
    } else if (parsed.frontmatter[attribute] !== value) {
      const edited = parsed.frontmatter[attribute]!;
      if (resurrects(attribute, edited)) {
        proposals.push({ kind: "correct-field", confidence: "ambiguous", assertion, attribute, value: edited, note: `field ${attribute} corrected to rewound content (must not return to play); held for confirmation` });
      } else {
        proposals.push({ kind: "correct-field", confidence: "mechanical", assertion, attribute, value: edited, note: "" });
      }
    }
  }
  for (const [key, value] of Object.entries(parsed.frontmatter)) {
    if (!RESERVED.has(key) && !(key in manifest.fields)) {
      if (resurrects(key, value)) {
        proposals.push({ kind: "assert-field", confidence: "ambiguous", attribute: key, value, note: `field ${key} re-adds rewound content (must not return to play); held for confirmation` });
      } else {
        proposals.push({ kind: "assert-field", confidence: "inferred", attribute: key, value, note: `new frontmatter field ${key}` });
      }
    }
  }

  // note block regions
  for (const [id, projected] of Object.entries(manifest.blocks)) {
    if (manifest.shielded.blocks.includes(id)) {
      if (parsed.notes[id] !== projected) notes.push(`note block ${id} is shielded; edit ignored (reveal to edit)`);
      continue;
    }
    if (!(id in parsed.notes)) {
      proposals.push({ kind: "retract-note", confidence: "ambiguous", assertion: id as AssertionId, note: `note block ${id} missing: retraction or accidental deletion?` });
    } else if (parsed.notes[id] !== projected) {
      const edited = parsed.notes[id]!;
      if (resurrects(NOTE_ATTRIBUTE, edited)) {
        proposals.push({ kind: "correct-note", confidence: "ambiguous", assertion: id as AssertionId, value: edited, note: "note corrected to rewound content (must not return to play); held for confirmation" });
      } else {
        proposals.push({ kind: "correct-note", confidence: "mechanical", assertion: id as AssertionId, value: edited, note: "" });
      }
    }
  }
  for (const para of parsed.untagged) {
    if (resurrects(NOTE_ATTRIBUTE, para)) {
      proposals.push({ kind: "assert-note", confidence: "ambiguous", value: para, note: "paragraph re-adds rewound content (must not return to play); held for confirmation" });
    } else {
      proposals.push({ kind: "assert-note", confidence: "inferred", value: para, note: "untagged paragraph under ## Notes" });
    }
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
    let reason = receipt.reason;
    if (receipt.disposition === "rejected" && (proposal.kind === "correct-field" || proposal.kind === "correct-note")) {
      // Name both positions: what the edit proposes and what the record now holds. The
      // current value is read leak-safely — a region shielded since basis is named as the
      // shield marker, never its content, so the conflict message discloses nothing.
      const current = currentPosition(campaign, manifest, proposal);
      reason = `conflict: this edit proposes ${JSON.stringify(proposal.value)}, but the record moved past projection basis ${manifest.basis} and now holds ${JSON.stringify(current)}; reproject and re-apply to reconcile (${receipt.reason})`;
    }
    dispositions.push({ proposal, outcome: receipt.disposition, reason, receipt });
  }
  return dispositions;
}

/**
 * The record's current value for a corrected region, for the second half of a
 * stale-basis conflict message. Reprojected with the basis's reveal setting and
 * read through that projection, so a region shielded since basis is named as the
 * shield marker rather than leaking its content.
 */
function currentPosition(
  campaign: Campaign,
  manifest: Manifest,
  proposal: Extract<Proposal, { kind: "correct-field" | "correct-note" }>,
): string {
  const state = campaign.state();
  const { manifest: now } = project(manifest.campaign, state, manifest.anchor, { reveal: manifest.reveal });
  if (proposal.kind === "correct-field") {
    if (now.shielded.fields.includes(proposal.attribute)) return SHIELD;
    return now.fields[proposal.attribute]?.value ?? "(no longer recorded)";
  }
  const succ = activeSuccessor(state, proposal.assertion);
  if (!succ) return "(no longer recorded)";
  if (now.shielded.blocks.includes(succ.id)) return SHIELD;
  return now.blocks[succ.id] ?? SHIELD;
}

/**
 * Follow the correction chain forward from a deactivated assertion to its active
 * successor. A correction records the predecessor's position in the successor's
 * priorValues, so the link survives the id change a correction introduces.
 */
function activeSuccessor(state: CampaignState, id: AssertionId): AssertionRecord | undefined {
  let cur = state.assertions.get(id);
  const seen = new Set<AssertionId>();
  while (cur && cur.standing !== "active") {
    if (seen.has(cur.id)) return undefined;
    seen.add(cur.id);
    const pos = cur.pos;
    cur = [...state.assertions.values()].find((a) => a.priorValues.some((pv) => pv.pos === pos));
  }
  return cur?.standing === "active" ? cur : undefined;
}
