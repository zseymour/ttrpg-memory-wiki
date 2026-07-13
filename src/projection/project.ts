/**
 * Projection: render an entity's established state into an editor-compatible
 * Markdown page plus a Manifest.
 *
 * The page is a Derived view, never authoritative. The Manifest records the basis
 * snapshot and per-region versions and normalized texts, so edit intake takes its
 * semantic preconditions from the projection basis and validates per region.
 * Frontmatter fields carry single-valued attributes; the Notes section carries
 * id-tagged free-text blocks. Only established truth is projected here; unrevealed
 * material is shielded by default (a pure rendering choice).
 */

import { createHash } from "node:crypto";
import type { AnchorId, AssertionId } from "../core/ids.ts";
import type { CampaignState } from "../core/state.ts";

const NOTE_ATTRIBUTE = "note";

export interface Manifest {
  campaign: string;
  anchor: AnchorId;
  basis: number;
  sha: string;
  label: string;
  /** frontmatter field (attribute) → assertion id + projected value */
  fields: Record<string, { assertion: AssertionId; value: string }>;
  /** note block id (assertion id) → normalized text */
  blocks: Record<string, string>;
}

export interface Projection {
  text: string;
  manifest: Manifest;
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

export function project(campaign: string, state: CampaignState, anchor: AnchorId): Projection {
  const label = state.anchors.get(anchor)?.label ?? String(anchor);
  const established = [...state.assertions.values()].filter(
    (a) => a.stance === "establishment" && a.standing === "active" && !a.erased && a.proposition.subject === anchor,
  );

  const fields: Manifest["fields"] = {};
  const blocks: Manifest["blocks"] = {};
  const fieldLines: string[] = [];
  const noteLines: string[] = [];

  for (const a of established) {
    if (a.proposition.attribute === NOTE_ATTRIBUTE) {
      blocks[a.id] = normalize(a.effectiveValue);
      noteLines.push(`<!-- claim:${a.id} -->`, a.effectiveValue, "");
    } else {
      fields[a.proposition.attribute] = { assertion: a.id, value: a.effectiveValue };
      fieldLines.push(`${a.proposition.attribute}: ${a.effectiveValue}`);
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
  const text = lines.join("\n");

  return {
    text,
    manifest: { campaign, anchor, basis: state.head, sha: sha(text), label, fields, blocks },
  };
}

export const pageSha = sha;
