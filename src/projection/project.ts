/**
 * Projection: render an anchor's memory into an editor-compatible Markdown page
 * plus a Manifest.
 *
 * The page is a Derived view, never authoritative. The Manifest records the basis
 * snapshot and per-region versions and normalized texts, so edit intake takes its
 * semantic preconditions from the projection basis and validates per region.
 *
 * Standing distinctions are preserved rather than flattened to prose facts:
 * established truth carries the frontmatter fields and Notes (the editable,
 * intake-covered regions), while Preparation, Beliefs, Suspicions, and Awareness
 * render as their own read-only sections so provisional and perspectival material
 * is never mistaken for established truth.
 *
 * Unrevealed material — established truth or preparation not communicated to the
 * player — is shielded by default: its content renders as a shield marker and the
 * region is flagged in the manifest. Opting in (`reveal`) shows it, a pure
 * rendering choice that changes nothing in the authoritative record.
 */

import { createHash } from "node:crypto";
import type { AnchorId, AssertionId } from "../core/ids.ts";
import type { Stance } from "../core/operations.ts";
import type { AssertionRecord, CampaignState } from "../core/state.ts";

export const NOTE_ATTRIBUTE = "note";

/** Rendered in place of unrevealed content. A shielded region discloses that it exists, not what it says. */
export const SHIELD = "«unrevealed»";

export interface Manifest {
  campaign: string;
  anchor: AnchorId;
  basis: number;
  sha: string;
  label: string;
  /** Whether this rendering reveals unrevealed material. */
  reveal: boolean;
  /** frontmatter field (attribute) → assertion id + projected value */
  fields: Record<string, { assertion: AssertionId; value: string }>;
  /** note block id (assertion id) → normalized text */
  blocks: Record<string, string>;
  /** Regions rendered as a shield marker rather than their content. */
  shielded: { fields: string[]; blocks: string[] };
  /**
   * Content fingerprints (sha of normalized text) of rewound establishment
   * assertions for this anchor. Rewound content must not return to play, so an
   * edit that re-adds a matching value is flagged rather than silently
   * re-established. Fingerprints, never the content, so the manifest leaks nothing.
   */
  rewound: string[];
}

export interface Projection {
  text: string;
  manifest: Manifest;
}

export interface ProjectOptions {
  /** Reveal unrevealed established truth and preparation. Default: shielded. */
  reveal?: boolean;
}

const sha = (text: string): string => createHash("sha256").update(text).digest("hex");

/** Rewrap-insensitive paragraph normalization: collapse intra-paragraph whitespace. */
export function normalize(text: string): string {
  return text
    .trim()
    .split(/\n\s*\n/)
    .map((p) => p.split(/\s+/).join(" "))
    .filter((p) => p.length > 0)
    .join("\n\n");
}

/**
 * Attribute-scoped content fingerprint: a leak-safe identity for a region's value,
 * shared by the projection (recording rewound content) and edit intake (detecting a
 * bypass edit that re-adds it). Scoped by attribute so an unrelated field sharing a
 * value is not mistaken for a resurrection.
 */
export const contentFingerprint = (attribute: string, value: string): string => sha(`${attribute}\u0000${normalize(value)}`);

const propKey = (a: AssertionRecord): string =>
  `${a.proposition.subject}::${a.proposition.attribute}::${a.effectiveValue}`;

/**
 * Propositions communicated to the player, keyed by exact proposition. A player-awareness
 * assertion marks its proposition revealed; established truth or preparation with no matching
 * player-awareness stays unrevealed and is shielded by default.
 */
function revealedPropositions(state: CampaignState): Set<string> {
  const revealed = new Set<string>();
  for (const a of state.assertions.values()) {
    if (a.stance === "player-awareness" && a.standing === "active" && !a.erased) revealed.add(propKey(a));
  }
  return revealed;
}

export function project(campaign: string, state: CampaignState, anchor: AnchorId, opts: ProjectOptions = {}): Projection {
  const reveal = opts.reveal ?? false;
  const label = state.anchors.get(anchor)?.label ?? String(anchor);
  // On the reveal path shielding never fires, so skip the campaign-wide awareness scan.
  const revealed = reveal ? new Set<string>() : revealedPropositions(state);

  const active = [...state.assertions.values()].filter(
    (a) => a.standing === "active" && !a.erased && a.proposition.subject === anchor,
  );
  const byStance = (stance: Stance) => active.filter((a) => a.stance === stance);

  // Disclosure standing: a region is shielded when its proposition was never communicated
  // to the player and reveal was not requested. Applies to every stance — established truth,
  // preparation, and perspectival content alike — so no uncommunicated content leaks onto the
  // default page while the standing sections still preserve the distinctions.
  const shieldable = (a: AssertionRecord) => !reveal && !revealed.has(propKey(a));

  const fields: Manifest["fields"] = {};
  const blocks: Manifest["blocks"] = {};
  const shielded: Manifest["shielded"] = { fields: [], blocks: [] };
  const fieldLines: string[] = [];
  const noteLines: string[] = [];

  for (const a of byStance("establishment")) {
    const value = shieldable(a) ? SHIELD : a.effectiveValue;
    if (a.proposition.attribute === NOTE_ATTRIBUTE) {
      blocks[a.id] = normalize(value);
      if (shieldable(a)) shielded.blocks.push(a.id);
      noteLines.push(`<!-- claim:${a.id} -->`, value, "");
    } else {
      fields[a.proposition.attribute] = { assertion: a.id, value };
      if (shieldable(a)) shielded.fields.push(a.proposition.attribute);
      fieldLines.push(`${a.proposition.attribute}: ${value}`);
    }
  }

  const lines = [
    "---",
    `entity: ${anchor}`,
    `name: ${label}`,
    ...fieldLines,
    `basis: ${state.head}`,
    "---",
    "",
    `# ${label}`,
    "",
    "## Notes",
    "",
    ...noteLines,
  ];

  // Preparation: provisional material, shieldable, rendered distinct from established truth.
  const prep = byStance("preparation");
  if (prep.length > 0) {
    lines.push("## Preparation", "");
    for (const a of prep) lines.push(`- ${renderClaim(a, shieldable(a))}`);
    lines.push("");
  }

  // Perspectival stances: what a fictional entity believes, suspects, or is aware of.
  // Rendered under their own heading so they are never mistaken for established truth,
  // and shielded on the same disclosure rule so uncommunicated content never leaks.
  lines.push(...perspectiveSection(state, "Beliefs", byStance("belief"), shieldable));
  lines.push(...perspectiveSection(state, "Suspicions", byStance("suspicion"), shieldable));
  lines.push(...perspectiveSection(state, "Awareness", byStance("entity-awareness"), shieldable));

  // Rewound establishment content for this anchor, fingerprinted so intake can flag an
  // edit that re-adds it. Rewind keeps the value intact (unlike erase), so the fingerprint
  // is meaningful; only the fingerprint is retained, never the content itself.
  const rewound = [...state.assertions.values()]
    .filter((a) => a.stance === "establishment" && a.standing === "rewound" && a.proposition.subject === anchor)
    .map((a) => contentFingerprint(a.proposition.attribute, a.effectiveValue));

  const text = lines.join("\n");

  return {
    text,
    manifest: { campaign, anchor, basis: state.head, sha: sha(text), label, reveal, fields, blocks, shielded, rewound },
  };
}

function renderClaim(a: AssertionRecord, hidden: boolean): string {
  const value = hidden ? SHIELD : a.effectiveValue;
  return a.proposition.attribute === NOTE_ATTRIBUTE ? value : `${a.proposition.attribute}: ${value}`;
}

/** Render a perspectival stance grouped by holder, in establishment order. */
function perspectiveSection(
  state: CampaignState,
  title: string,
  list: AssertionRecord[],
  shieldable: (a: AssertionRecord) => boolean,
): string[] {
  if (list.length === 0) return [];
  const byHolder = new Map<AnchorId | null, AssertionRecord[]>();
  for (const a of list) {
    const bucket = byHolder.get(a.holder);
    if (bucket) bucket.push(a);
    else byHolder.set(a.holder, [a]);
  }
  const out = [`## ${title}`, ""];
  for (const [holder, items] of byHolder) {
    const holderLabel = holder ? (state.anchors.get(holder)?.label ?? holder) : "unattributed";
    out.push(`### ${holderLabel}`, "");
    for (const a of items) out.push(`- ${renderClaim(a, shieldable(a))}`);
    out.push("");
  }
  return out;
}

export const pageSha = sha;
