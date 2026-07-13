/**
 * Campaign: the boundary object binding the authoritative operation log to the
 * write seam (submit → receipt), snapshot-bound recall, and export/replay.
 *
 * Each Campaign is a fully isolated scope: no id, fact, or embedding is shared
 * with any other instance.
 */

import { campaignId, type CampaignId, type OperationId } from "./core/ids.ts";
import type { Operation } from "./core/operations.ts";
import { apply, emptyState, replay, type Accepted, type CampaignState } from "./core/state.ts";
import { validate } from "./core/validate.ts";
import { exportCampaign, type CampaignExport } from "./core/export.ts";
import type { RecallOutcome, RecallRequest } from "./recall/contract.ts";
import { assemble, plan } from "./recall/engine.ts";

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

export class Campaign {
  readonly id: CampaignId;
  readonly owner: string;
  private readonly log: Accepted[] = [];
  private readonly receipts = new Map<OperationId, Receipt>();
  private seq = 0;
  private readonly liveState: CampaignState = emptyState();

  constructor(id: CampaignId, owner: string) {
    this.id = id;
    this.owner = owner;
  }

  /**
   * The core write API. Validates authority, preconditions, and invariants, then
   * appends an accepted operation or returns a rejection. A resubmitted
   * operationId returns the original receipt — no double commit.
   */
  submit(op: Operation): Receipt {
    const prior = this.receipts.get(op.operationId);
    if (prior) return prior;

    const rejection = validate(this.state(), op, this.owner);
    const seq = ++this.seq;
    if (rejection) {
      const receipt: Receipt = {
        operationId: op.operationId,
        disposition: "rejected",
        reason: `${rejection.code}: ${rejection.message}`,
        pos: null,
        seq,
      };
      this.receipts.set(op.operationId, receipt);
      return receipt;
    }

    const pos = this.log.length + 1;
    const entry: Accepted = { op, pos };
    this.log.push(entry);
    apply(this.liveState, entry);
    const receipt: Receipt = {
      operationId: op.operationId,
      disposition: "accepted",
      reason: `accepted at establishment position ${pos}`,
      pos,
      seq,
    };
    this.receipts.set(op.operationId, receipt);
    return receipt;
  }

  /** Current derived state at head, maintained incrementally as operations are accepted. */
  state(): CampaignState {
    return this.liveState;
  }

  /** The current head establishment-order position. */
  head(): number {
    return this.log.length;
  }

  receiptFor(operationId: OperationId): Receipt | undefined {
    return this.receipts.get(operationId);
  }

  /** Recall against a pinned snapshot. Later operations do not alter that snapshot. */
  recall(request: RecallRequest): RecallOutcome {
    const pos = request.vantage.establishmentPos;
    if (pos < 0 || pos > this.log.length) {
      return { kind: "unavailable", reason: `no trustworthy snapshot at establishment position ${pos}` };
    }
    const snapshot = pos === this.log.length ? this.liveState : replay(this.log.slice(0, pos));
    return assemble(plan(request), snapshot);
  }

  exportCampaign(): CampaignExport {
    return exportCampaign(this.id, this.owner, this.log);
  }

  /** Replay an export into a fresh, independent instance. */
  static fromExport(exp: CampaignExport): Campaign {
    const campaign = new Campaign(campaignId(exp.campaign), exp.owner);
    for (const entry of exp.log) {
      campaign.log.push(entry);
      apply(campaign.liveState, entry);
    }
    return campaign;
  }
}
