/**
 * The recall engine: a lens-bound planner and a deterministic assembler.
 *
 * Planning may vary, but a validated plan + vantage + exact budget assembles
 * deterministically. The assembler owns Recall-critical closure: control/safety,
 * focal identity and lens guards, lifecycle and conflicts, then task material —
 * each represented or explicitly gapped before any enrichment could spend budget.
 * Over-budget returns the priority-ordered critical prefix with gaps and zero
 * enrichment; an infeasible mandatory reserve is rejected without full assembly.
 */

import type { AnchorId } from "../core/ids.ts";
import type { AssertionRecord, CampaignState } from "../core/state.ts";
import {
  lensAdmits,
  lensKey,
  type Lens,
  type RecallGap,
  type RecallItem,
  type RecallOutcome,
  type RecallQualification,
  type RecallRequest,
  type RecallResult,
  type TemporalMatch,
  type Vantage,
} from "./contract.ts";

export interface RecallPath {
  focal: AnchorId;
  lens: Lens;
  required: boolean;
  purpose: string;
}

export interface RecallPlan {
  planner: string;
  request: RecallRequest;
  paths: RecallPath[];
}

/**
 * Lens-bound planning. Deterministic here (focal × lens), but only the *plan* is
 * produced — no content is exposed to planning, so it cannot be omniscient-then-filtered.
 */
export function plan(request: RecallRequest, planner = "default"): RecallPlan {
  const paths: RecallPath[] = [];
  for (const focal of request.focal) {
    for (const lens of request.lenses) {
      paths.push({ focal, lens, required: true, purpose: `task material for ${focal} under ${lensKey(lens)}` });
    }
  }
  return { planner, request, paths };
}

function temporalMatch(itemTime: number | null, focus: number | null): TemporalMatch {
  if (itemTime === null || focus === null) return "possibly-applicable";
  return itemTime <= focus ? "definitely-applicable" : "definitely-outside";
}

function qualify(state: CampaignState, a: AssertionRecord, lens: Lens, vantage: Vantage): RecallQualification {
  const anchor = state.anchors.get(a.proposition.subject);
  const inConflict = [...state.conflicts.values()].some(
    (c) => c.resolvedAt === null && c.members.includes(a.id),
  );
  const prov = a.provenance.gap
    ? `gap: ${a.provenance.gap}`
    : a.provenance.evidence
      ? `${a.provenance.introducedBy} @ ${a.provenance.evidence.locator}`
      : a.provenance.introducedBy;
  return {
    anchor: a.proposition.subject,
    attribute: a.proposition.attribute,
    identity: anchor?.label ?? String(a.proposition.subject),
    standing: a.standing,
    lens: lensKey(lens),
    stance: a.stance,
    fictionalTime: a.fictionalTime,
    temporalMatch: temporalMatch(a.fictionalTime, vantage.fictionalTime),
    uncertainty: a.uncertainty,
    authority: a.mode ? `${a.actor} (${a.mode})` : a.actor,
    provenance: prov,
    ...(inConflict ? { conflict: "unresolved continuity conflict" } : {}),
  };
}

/** An assertion is recallable in a lens only if active, un-erased, and lens-admitted. */
function recallable(a: AssertionRecord, lens: Lens): boolean {
  if (a.standing !== "active" || a.erased) return false;
  return lensAdmits(lens, a.stance, a.holder);
}

/**
 * Assemble a validated plan against a snapshot state. `state` must already be the
 * derived state at the plan's vantage snapshot; Campaign binds that snapshot.
 */
export function assemble(plan: RecallPlan, state: CampaignState): RecallOutcome {
  const req = plan.request;
  const safety = [...state.safety.values()];
  const mandatoryReserve = safety.length + req.focal.length;
  if (req.budget.total < mandatoryReserve) {
    return {
      kind: "rejected",
      reason: `mandatory reserve (${mandatoryReserve}: ${safety.length} safety + ${req.focal.length} focal) exceeds budget ${req.budget.total}`,
    };
  }

  const result: RecallResult = {
    complete: true,
    vantage: req.vantage,
    safety: [],
    lenses: {},
    conflicts: [],
    gaps: [],
    omissionManifest: [],
    spent: 0,
  };
  for (const lens of req.lenses) result.lenses[lensKey(lens)] = [];

  let spent = 0;
  const gap = (g: RecallGap) => {
    result.complete = false;
    result.gaps.push(g);
  };

  // Tier 0 — control and safety boundaries (mandatory, within reserve).
  for (const b of safety) {
    result.safety.push(b);
    spent++;
  }

  // Tier 1 — focal identity and lens guards.
  for (const focal of req.focal) {
    if (!state.anchors.has(focal)) {
      gap({
        requirement: "focal-identity",
        lens: null,
        vantage: req.vantage,
        reason: `focal anchor ${focal} is not established at the vantage snapshot`,
        scope: String(focal),
        consequence: "cannot recall material for an unestablished focus",
        remediation: "establish the anchor or correct the selector",
      });
      continue;
    }
    spent++;
  }

  // Tier 2 — applicable lifecycle effects and material conflicts touching the focus.
  const focalSet = new Set(req.focal);
  for (const c of state.conflicts.values()) {
    if (c.resolvedAt !== null) continue;
    const touchesFocus = c.members.some((id) => {
      const a = state.assertions.get(id);
      return a && focalSet.has(a.proposition.subject);
    });
    if (!touchesFocus) continue;
    if (spent >= req.budget.total) {
      gap({
        requirement: "continuity-conflict",
        lens: null,
        vantage: req.vantage,
        reason: "an unresolved continuity conflict did not fit the budget",
        scope: c.slot,
        consequence: "competing established claims not surfaced",
        remediation: "raise the recall budget",
      });
      continue;
    }
    result.conflicts.push({ id: c.id, slot: c.slot, members: [...c.members] });
    spent++;
  }

  // Tier 3 — task material, per lens, deterministic by establishment order.
  for (const path of plan.paths) {
    const key = lensKey(path.lens);
    const bucket = result.lenses[key];
    if (!bucket) continue;
    const candidates: AssertionRecord[] = [];
    for (const a of state.assertions.values()) {
      if (a.proposition.subject !== path.focal) continue;
      if (!recallable(a, path.lens)) continue;
      candidates.push(a);
    }
    let omitted = 0;
    for (const a of candidates) {
      if (spent >= req.budget.total) {
        omitted++;
        continue;
      }
      bucket.push({
        assertion: a.id,
        value: a.effectiveValue,
        qualification: qualify(state, a, path.lens, req.vantage),
      } satisfies RecallItem);
      spent++;
    }
    if (omitted > 0) {
      gap({
        requirement: "task-material",
        lens: key,
        vantage: req.vantage,
        reason: `${omitted} in-lens item(s) for ${path.focal} did not fit the budget`,
        scope: `${path.focal} / ${key}`,
        consequence: "task material incomplete for this lens",
        remediation: "raise the recall budget or narrow the focus",
      });
    }
  }

  // Enrichment tier is admitted only when closure is complete. No enrichment
  // source exists in this core; an incomplete result therefore carries none.
  result.spent = spent;
  return result.gaps.length > 0 || !result.complete
    ? { kind: "result", result: { ...result, complete: false } }
    : { kind: "result", result };
}
