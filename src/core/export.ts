/**
 * Campaign export and replay.
 *
 * Export serializes the authoritative operation log — and only that — so replay
 * into a fresh instance reproduces identity, standing, authority context,
 * conflicts, uncertainty, and provenance with no Source store and no source
 * re-extraction. Erased content is compacted out of the exported log entirely;
 * a redacted-but-present tombstone preserves continuity without the content.
 */

import type { Operation } from "./operations.ts";
import { replay, type Accepted } from "./state.ts";

export interface CampaignExport {
  version: 1;
  campaign: string;
  owner: string;
  log: Accepted[];
}

/** Positions whose originating content must be redacted from the export. */
function erasedPositions(log: readonly Accepted[]): Set<number> {
  const st = replay(log);
  const positions = new Set<number>();
  for (const a of st.assertions.values()) if (a.erased) positions.add(a.pos);
  return positions;
}

/** Blank every value-bearing field of an operation, preserving its structure. */
function redact(op: Operation): Operation {
  switch (op.kind) {
    case "assert":
      return { ...op, proposition: { ...op.proposition, value: "" }, provenance: undefined, uncertainty: undefined };
    case "correct":
    case "supersede":
      return { ...op, value: "" };
    case "resolve-conflict":
      if (op.effect.kind === "new-establishment") {
        return { ...op, effect: { ...op.effect, proposition: { ...op.effect.proposition, value: "" } } };
      }
      return op;
    default:
      return op;
  }
}

/** Serialize a campaign's authoritative record, compacting out erased content. */
export function exportCampaign(campaign: string, owner: string, log: readonly Accepted[]): CampaignExport {
  const erased = erasedPositions(log);
  const compacted = log.map((entry) =>
    erased.has(entry.pos) ? { pos: entry.pos, op: redact(entry.op) } : entry,
  );
  return { version: 1, campaign, owner, log: compacted };
}

/**
 * Parse a serialized export. Branded ids are compile-time only, so JSON round-trip
 * of the plain strings is faithful; the assertion restores the static type.
 *
 * TODO(hardening): validate with a schema parser once export format versioning is
 * settled — this is an external-input boundary.
 */
export function reviveExport(json: string): CampaignExport {
  return JSON.parse(json) as CampaignExport;
}
