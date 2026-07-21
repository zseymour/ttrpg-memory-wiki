/**
 * Campaign export and replay.
 *
 * Export serializes the authoritative operation log so replay into a fresh
 * instance reproduces identity, standing, authority context, conflicts,
 * uncertainty, and provenance with no Source store and no source re-extraction.
 * Alongside the log it carries the accepted receipts — non-authoritative, but
 * needed so replay reproduces each disposition at its establishment-order
 * position. Erased content is compacted out of the exported log entirely; a
 * redacted-but-present tombstone preserves continuity without the content.
 */

import type { Operation } from "./operations.ts";
import type { Receipt } from "./receipt.ts";
import { replay, type Accepted } from "./state.ts";

export interface CampaignExport {
  version: 1;
  campaign: string;
  owner: string;
  log: Accepted[];
  /**
   * Accepted receipts in establishment order, one per log entry. Non-authoritative,
   * but exported so replay reproduces each receipt — including seq gaps left by
   * rejected operations, which the log alone cannot reconstruct. Receipts carry no
   * originating content, so erasure never redacts them.
   */
  receipts: Receipt[];
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
    case "assert": {
      // Keep the non-revealing derivation links (opaque ids, no content) so a replayed
      // compacted log can still trace disclosure descendants and re-erase them to tombstones.
      const support = op.provenance?.support;
      return {
        ...op,
        proposition: { ...op.proposition, value: "" },
        provenance: support ? { introducedBy: "-", support } : undefined,
        uncertainty: undefined,
      };
    }
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

/**
 * Compact a log for erasure: entries at erased positions keep their operation
 * structure (so replay preserves standing, order, and continuity tombstones) but
 * shed every value-bearing field. Reused for both Campaign export and the durable
 * on-disk log rewrite, so both converge to the same erased-content-free record.
 */
export function compactErased(log: readonly Accepted[]): Accepted[] {
  const erased = erasedPositions(log);
  return log.map((entry) => (erased.has(entry.pos) ? { pos: entry.pos, op: redact(entry.op) } : entry));
}

/** Serialize a campaign's authoritative record, compacting out erased content. */
export function exportCampaign(
  campaign: string,
  owner: string,
  log: readonly Accepted[],
  receipts: readonly Receipt[],
): CampaignExport {
  const compacted = compactErased(log);
  return { version: 1, campaign, owner, log: compacted, receipts: [...receipts] };
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
