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
import { compactErased, exportCampaign, type CampaignExport } from "./core/export.ts";
import { FileVault, type VaultStore } from "./core/vault.ts";
import { lensKey, type ChildRecallRequest, type RecallOutcome, type RecallReference, type RecallRequest } from "./recall/contract.ts";
import { assemble, plan, validateLensAuthority, validatePlan, type RecallPlan } from "./recall/engine.ts";
import { previewRepin, type RepinImpact } from "./recall/reconcile.ts";
import type { SourceStore } from "./sources/store.ts";
import { materialize, projectionExists, type Materialization } from "./projection/materialize.ts";
import type { ProjectOptions } from "./projection/project.ts";

/**
 * A recall that has passed authority gating and plan validation against an immutable
 * snapshot pinned at its vantage, awaiting disclosure. `safetyBasis` is the head at
 * validation; a later Erasure or tightened Safety boundary invalidates it on disclose.
 */
export type PreparedRecall =
  | { kind: "rejected"; reason: string }
  | { kind: "unavailable"; reason: string }
  | { kind: "prepared"; plan: RecallPlan; snapshot: CampaignState; safetyBasis: number };

export class Campaign {
  readonly id: CampaignId;
  readonly owner: string;
  private readonly log: Accepted[] = [];
  private readonly receipts = new Map<OperationId, Receipt>();
  private seq = 0;
  private readonly liveState: CampaignState = emptyState();
  private readonly store: VaultStore | undefined;
  private readonly sourceStore: SourceStore | undefined;
  // Track whether derived pages exist on disk, so an Erasure re-projects (purging
  // stale content) rather than creating pages the campaign never materialized.
  private materialized = false;
  private lastMaterializeOpts: ProjectOptions = {};

  constructor(id: CampaignId, owner: string, store?: VaultStore, sourceStore?: SourceStore) {
    this.id = id;
    this.owner = owner;
    this.store = store;
    this.sourceStore = sourceStore;
    // A reopened vault persists only the log; reconstruct each accepted receipt so
    // position lookup and export behave identically to the originating instance.
    for (const entry of store?.loadLog() ?? []) {
      this.log.push(entry);
      apply(this.liveState, entry);
      this.receipts.set(entry.op.operationId, acceptedReceipt(entry.op.operationId, entry.pos, ++this.seq));
    }
    // Derived pages left by a prior session must be re-projected on Erasure, so a
    // reopened vault that already has them is treated as materialized.
    if (store && projectionExists(store.root)) this.materialized = true;
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
    // A destructive Erasure must reach the durable record and derived surfaces, not
    // just the in-memory state, so a synced copy converges to erased-content-free files.
    const erases = op.kind === "erase" || (op.kind === "set-safety-boundary" && (op.erase?.length ?? 0) > 0);
    if (this.store && erases) this.convergeErasure();
    const receipt = acceptedReceipt(op.operationId, pos, seq);
    this.receipts.set(op.operationId, receipt);
    return receipt;
  }

  /**
   * Make an accepted Erasure destructive on disk: compact erased content out of the
   * durable log and, if pages were materialized, re-project them so the Derived views
   * and index carry no erased content. A synced copy then converges through file sync.
   */
  private convergeErasure(): void {
    if (!this.store) return;
    this.store.rewriteLog(compactErased(this.log));
    if (this.materialized) this.materialize(this.lastMaterializeOpts);
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
    const gate = this.authorizeRecall(request);
    if ("kind" in gate) return gate;
    const snapshot = gate.pos === this.log.length ? this.liveState : replay(this.log.slice(0, gate.pos));
    return assemble(plan(request, snapshot), snapshot, this.id, this.sourceStore);
  }

  /**
   * Gate a recall request: a trustworthy snapshot must exist at the vantage, and the
   * audience's *current* authority governs which lenses it may request even when the
   * vantage pins content to an older snapshot. Shared by the atomic and two-phase paths
   * so their bounds check and authority semantics cannot drift.
   */
  private authorizeRecall(request: RecallRequest): { pos: number } | { kind: "rejected" | "unavailable"; reason: string } {
    const pos = request.vantage.establishmentPos;
    if (pos < 0 || pos > this.log.length) {
      return { kind: "unavailable", reason: `no trustworthy snapshot at establishment position ${pos}` };
    }
    const denied = validateLensAuthority(request, this.liveState, this.owner);
    if (denied) return { kind: "rejected", reason: denied };
    return { pos };
  }

  /**
   * Begin a two-phase recall: gate authority, plan, and validate the plan against an
   * immutable snapshot pinned at the vantage, recording the safety basis (the head at
   * validation). The returned prepared recall is disclosed with `disclose`.
   */
  prepareRecall(request: RecallRequest): PreparedRecall {
    const gate = this.authorizeRecall(request);
    if ("kind" in gate) return gate;
    // Pin an immutable snapshot: a prepared plan must not drift if the log advances.
    const snapshot = replay(this.log.slice(0, gate.pos));
    const p = plan(request, snapshot);
    const invalid = validatePlan(p, snapshot);
    if (invalid) return { kind: "rejected", reason: invalid };
    return { kind: "prepared", plan: p, snapshot, safetyBasis: this.log.length };
  }

  /**
   * Disclose a prepared recall. A newly accepted Erasure or tightened Safety boundary
   * since the prepared safety basis is a present-time override that invalidates the
   * in-flight recall before any material is disclosed — never a partial disclosure.
   */
  disclose(prepared: Extract<PreparedRecall, { kind: "prepared" }>): RecallOutcome {
    // Any set-safety-boundary counts: a boundary is a present-time constraint on every
    // recall situation, so it can invalidate a prepared plan even when it carries no
    // erasure (there is no boundary-loosening operation, so every set is a tightening).
    const intervening = this.log
      .slice(prepared.safetyBasis)
      .some((e) => e.op.kind === "erase" || e.op.kind === "set-safety-boundary");
    if (intervening) {
      return { kind: "invalidated", reason: "a concurrent erasure or tightened safety boundary invalidated this recall before disclosure" };
    }
    return assemble(prepared.plan, prepared.snapshot, this.id, this.sourceStore);
  }

  /**
   * Preview what re-pinning `source` to `candidateVersion` would affect: the frozen
   * citations the store's declared revisions touch, prompting review. Read-only — not
   * an operation; the review is submitted as explicit pin-corpus / reconcile-citation.
   * Returns [] when no Source store is present, since the delta is undefinable without it.
   */
  previewRepin(source: string, candidateVersion: string): RepinImpact[] {
    return previewRepin(this.liveState, this.sourceStore, source, candidateVersion);
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

  /**
   * Render the campaign to on-disk Markdown pages and a derived index inside the
   * vault, so a synced copy is readable with no core. Requires a vault-backed
   * campaign; the pages are Derived views, rebuildable from the log.
   */
  materialize(opts: ProjectOptions = {}): Materialization {
    if (!this.store) throw new Error("materialize requires a vault-backed campaign");
    this.materialized = true;
    this.lastMaterializeOpts = opts;
    return materialize(this.store.root, this.id, this.liveState, opts);
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
