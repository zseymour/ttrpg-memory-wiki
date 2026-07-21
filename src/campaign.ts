/**
 * Campaign: the boundary object binding the authoritative operation log to the
 * write seam (submit → receipt), snapshot-bound recall, and export/replay.
 *
 * Each Campaign is a fully isolated scope: no id, fact, or embedding is shared
 * with any other instance.
 */

import { campaignId, type CampaignId, type OperationId } from "./core/ids.ts";
import type { Operation } from "./core/operations.ts";
import { acceptedReceipt, type Receipt } from "./core/receipt.ts";
import { apply, emptyState, replay, type Accepted, type CampaignState } from "./core/state.ts";
import { validate } from "./core/validate.ts";
import { exportCampaign, type CampaignExport } from "./core/export.ts";
import { FileVault, type VaultStore } from "./core/vault.ts";
import { lensKey, type ChildRecallRequest, type RecallOutcome, type RecallReference, type RecallRequest } from "./recall/contract.ts";
import { assemble, plan, validateLensAuthority } from "./recall/engine.ts";

export class Campaign {
  readonly id: CampaignId;
  readonly owner: string;
  private readonly log: Accepted[] = [];
  private readonly receipts = new Map<OperationId, Receipt>();
  private seq = 0;
  private readonly liveState: CampaignState = emptyState();
  private readonly store: VaultStore | undefined;

  constructor(id: CampaignId, owner: string, store?: VaultStore) {
    this.id = id;
    this.owner = owner;
    this.store = store;
    // A reopened vault persists only the log; reconstruct each accepted receipt so
    // position lookup and export behave identically to the originating instance.
    for (const entry of store?.loadLog() ?? []) {
      this.log.push(entry);
      apply(this.liveState, entry);
      this.receipts.set(entry.op.operationId, acceptedReceipt(entry.op.operationId, entry.pos, ++this.seq));
    }
  }

  /** Open (or create) a campaign backed by a durable on-disk vault. */
  static openVault(vaultPath: string, owner?: string): Campaign {
    const vault = FileVault.open(vaultPath, owner);
    return new Campaign(vault.id, vault.owner, vault);
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
    this.store?.append(entry); // durable, in establishment order
    const receipt = acceptedReceipt(op.operationId, pos, seq);
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
    // Authorization is a present-time gate: the audience's *current* authority governs
    // which lenses it may request, even when the vantage pins content to an older snapshot.
    const denied = validateLensAuthority(request, this.liveState, this.owner);
    if (denied) return { kind: "rejected", reason: denied };
    const snapshot = pos === this.log.length ? this.liveState : replay(this.log.slice(0, pos));
    return assemble(plan(request, snapshot), snapshot, this.id);
  }

  /**
   * Follow a Recall reference through a separately budgeted child request. The child
   * retains the parent snapshot — an explicit rebase is required to move to a newer
   * vantage — and may narrow but never silently broaden the reference's focal or lens.
   * The child audience is re-gated for authority like any other request.
   */
  follow(reference: RecallReference, child: ChildRecallRequest): RecallOutcome {
    if (reference.campaign !== this.id) {
      return { kind: "rejected", reason: "recall reference is bound to a different campaign" };
    }
    const focal = child.focal ?? [reference.target];
    if (!focal.every((f) => f === reference.target)) {
      return { kind: "rejected", reason: "child request broadens focal beyond the reference target" };
    }
    const lenses = child.lenses ?? [reference.lens];
    const referenceLens = lensKey(reference.lens);
    if (!lenses.every((l) => lensKey(l) === referenceLens)) {
      return { kind: "rejected", reason: "child request broadens the lens beyond the reference" };
    }
    // The permitted operation is one of the reference's bound dimensions: a child may
    // reuse it but not silently swap it for another situation.
    if (child.situation !== undefined && child.situation !== reference.operation) {
      return { kind: "rejected", reason: "child request broadens the permitted operation of the reference" };
    }
    // Expectations are scoped to the target: probing another anchor's recorded/Unrecorded
    // status would silently widen the reference beyond its target.
    if ((child.expectations ?? []).some((e) => e.anchor !== reference.target)) {
      return { kind: "rejected", reason: "child request broadens beyond the reference target via expectations" };
    }
    let vantage = reference.vantage;
    if (child.rebase) {
      if (child.rebase.establishmentPos < reference.vantage.establishmentPos) {
        return { kind: "rejected", reason: "an explicit rebase must target a newer vantage, not an older snapshot" };
      }
      vantage = child.rebase;
    }
    return this.recall({
      situation: child.situation ?? reference.operation,
      audience: child.audience,
      focal,
      lenses,
      vantage,
      budget: child.budget,
      expectations: child.expectations,
      seeds: child.seeds,
    });
  }

  exportCampaign(): CampaignExport {
    const receipts = this.log.map((entry) => this.receipts.get(entry.op.operationId)!);
    return exportCampaign(this.id, this.owner, this.log, receipts);
  }

  /** Replay an export into a fresh, independent instance. */
  static fromExport(exp: CampaignExport): Campaign {
    const campaign = new Campaign(campaignId(exp.campaign), exp.owner);
    for (const entry of exp.log) {
      campaign.log.push(entry);
      apply(campaign.liveState, entry);
    }
    for (const receipt of exp.receipts) {
      campaign.receipts.set(receipt.operationId, receipt);
      if (receipt.seq > campaign.seq) campaign.seq = receipt.seq;
    }
    return campaign;
  }
}
