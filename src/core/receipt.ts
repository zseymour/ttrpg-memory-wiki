/**
 * The write-seam disposition record. A receipt reports whether a proposal was
 * accepted or rejected and, when accepted, the establishment-order position it
 * occupies. It is non-authoritative — never an input to precedence — but is
 * reproduced across export/replay so idempotent retry and position lookup behave
 * identically in a replayed or reopened instance.
 */

import type { OperationId } from "./ids.ts";

/** A non-authoritative record of a proposal's disposition, enabling idempotent retry. */
export interface Receipt {
  operationId: OperationId;
  disposition: "accepted" | "rejected";
  reason: string;
  /** Establishment-order position for accepted operations; null when rejected. */
  pos: number | null;
  /** Monotonic receipt sequence: non-authoritative timing, never used as precedence. */
  seq: number;
}

/** The receipt for an operation accepted at an establishment-order position. */
export function acceptedReceipt(operationId: OperationId, pos: number, seq: number): Receipt {
  return {
    operationId,
    disposition: "accepted",
    reason: `accepted at establishment position ${pos}`,
    pos,
    seq,
  };
}
