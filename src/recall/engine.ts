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

import type { AnchorId, AssertionId } from "../core/ids.ts";
import { IDENTITY_EQUIVALENCE, isEquivalence, type Provenance } from "../core/operations.ts";
import type { AssertionRecord, CampaignState } from "../core/state.ts";
import {
  lensAdmits,
  lensKey,
  type Lens,
  type RecallArtifact,
  type RecallEquivalence,
  type RecallGap,
  type RecallItem,
  type RecallOutcome,
  type RecallQualification,
  type RecallRequest,
  type RecallResult,
  type RecallRuling,
  type RecallUnrecorded,
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

/**
 * Validate a plan against its own request before deterministic assembly. A plan may
 * vary, but it may not reference a lens or focal identity outside the request, nor
 * weaken the request's mandatory closure. Returns a rejection reason, or null.
 */
export function validatePlan(plan: RecallPlan): string | null {
  const req = plan.request;
  const requestedLenses = new Set(req.lenses.map(lensKey));
  const requestedFocal = new Set<string>(req.focal);
  for (const path of plan.paths) {
    if (!requestedLenses.has(lensKey(path.lens))) return `plan references lens '${lensKey(path.lens)}' not in the request`;
    if (!requestedFocal.has(path.focal)) return `plan references focal '${path.focal}' not in the request`;
  }
  return null;
}

function temporalMatch(itemTime: number | null, focus: number | null): TemporalMatch {
  if (itemTime === null || focus === null) return "possibly-applicable";
  return itemTime <= focus ? "definitely-applicable" : "definitely-outside";
}

/** Compact inline provenance: a gap marker, an attributed evidence locator, or the introducer. */
function formatProvenance(prov: Provenance): string {
  return prov.gap
    ? `gap: ${prov.gap}`
    : prov.evidence
      ? `${prov.introducedBy} @ ${prov.evidence.locator}`
      : prov.introducedBy;
}

function qualify(state: CampaignState, a: AssertionRecord, lens: Lens, vantage: Vantage): RecallQualification {
  const anchor = state.anchors.get(a.proposition.subject);
  const inConflict = [...state.conflicts.values()].some(
    (c) => c.resolvedAt === null && c.members.includes(a.id),
  );
  const prov = formatProvenance(a.provenance);
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
    ...(a.realizes ? { realizes: a.realizes } : {}),
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
  const invalid = validatePlan(plan);
  if (invalid) return { kind: "rejected", reason: `invalid plan: ${invalid}` };
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
    equivalences: [],
    artifacts: [],
    rulings: [],
    unrecorded: [],
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
      // Identity equivalences carry the whole envelope in their own section, never as
      // an attribute/value item that could read as a plain claim about the subject.
      if (isEquivalence(a.proposition)) continue;
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

  // Tier 3 (identity) — equivalences touching the focus, per admitting lens. Records
  // are never merged: each anchor keeps its own identity and history.
  for (const a of state.assertions.values()) {
    if (!isEquivalence(a.proposition)) continue;
    if (a.standing !== "active" || a.erased) continue;
    const subj = a.proposition.subject;
    const other = a.proposition.value as AnchorId;
    if (!focalSet.has(subj) && !focalSet.has(other)) continue;
    const lens = req.lenses.find((l) => lensAdmits(l, a.stance, a.holder));
    if (!lens) continue;
    if (spent >= req.budget.total) {
      gap({
        requirement: "identity-equivalence",
        lens: lensKey(lens),
        vantage: req.vantage,
        reason: "an identity equivalence touching the focus did not fit the budget",
        scope: `${subj} ${IDENTITY_EQUIVALENCE} ${other}`,
        consequence: "an established or perspectival identity link was not surfaced",
        remediation: "raise the recall budget",
      });
      continue;
    }
    result.equivalences.push({
      assertion: a.id,
      anchors: [subj, other],
      identities: [state.anchors.get(subj)?.label ?? String(subj), state.anchors.get(other)?.label ?? String(other)],
      qualification: qualify(state, a, lens, req.vantage),
    } satisfies RecallEquivalence);
    spent++;
  }

  // Tier 3 (answers) — explicit Unrecorded for requested expectations with no
  // qualifying assertion. Absence is Unrecorded, never false and never silent.
  for (const exp of req.expectations ?? []) {
    if (!state.anchors.has(exp.anchor)) {
      // An expectation naming an unestablished anchor is an unresolved selector, not an
      // Unrecorded answer: Unrecorded is scoped to a proposition about an existing subject.
      gap({
        requirement: "recall-selector",
        lens: null,
        vantage: req.vantage,
        reason: `expectation names anchor ${exp.anchor}, which is not established at the vantage`,
        scope: `${exp.anchor} / ${exp.attribute}`,
        consequence: "an unresolved selector cannot be answered Unrecorded",
        remediation: "establish the anchor or correct the selector",
      });
      continue;
    }
    for (const lens of req.lenses) {
      const answered = [...state.assertions.values()].some(
        (a) => a.proposition.subject === exp.anchor && a.proposition.attribute === exp.attribute && recallable(a, lens),
      );
      if (answered) continue;
      if (spent >= req.budget.total) {
        gap({
          requirement: "unrecorded",
          lens: lensKey(lens),
          vantage: req.vantage,
          reason: "an unrecorded expectation did not fit the budget",
          scope: `${exp.anchor} / ${exp.attribute}`,
          consequence: "explicit Unrecorded answer was not surfaced",
          remediation: "raise the recall budget",
        });
        continue;
      }
      result.unrecorded.push({ anchor: exp.anchor, attribute: exp.attribute, lens: lensKey(lens), uncertainty: { kind: "unrecorded" } } satisfies RecallUnrecorded);
      spent++;
    }
  }

  // Tier 4 — structured artifacts organizing focal material. A link confers no standing.
  for (const art of state.artifacts.values()) {
    if (art.standing !== "active") continue;
    const touchesFocus = art.links.some((l) => {
      if (focalSet.has(l.target as AnchorId)) return true;
      const linked = state.assertions.get(l.target as AssertionId);
      return linked ? focalSet.has(linked.proposition.subject) : false;
    });
    if (!touchesFocus) continue;
    if (spent >= req.budget.total) {
      gap({
        requirement: "structured-artifact",
        lens: null,
        vantage: req.vantage,
        reason: "a structured artifact touching the focus did not fit the budget",
        scope: String(art.id),
        consequence: "an organizing artifact was not surfaced",
        remediation: "raise the recall budget",
      });
      continue;
    }
    result.artifacts.push({
      id: art.id,
      kind: art.kind,
      label: art.label,
      links: art.links.map((l) => ({ role: l.role, target: String(l.target) })),
      standing: art.standing,
      authority: art.actor,
      provenance: formatProvenance(art.provenance),
    } satisfies RecallArtifact);
    spent++;
  }

  // Tier 5 — rule context: applicable campaign rulings for the focus, never fictional truth.
  for (const rul of state.rulings.values()) {
    if (rul.standing !== "active") continue;
    if (!rul.anchors.some((a) => focalSet.has(a))) continue;
    if (spent >= req.budget.total) {
      gap({
        requirement: "rule-context",
        lens: null,
        vantage: req.vantage,
        reason: "a campaign ruling for the focus did not fit the budget",
        scope: rul.scope,
        consequence: "an applicable ruling was not surfaced",
        remediation: "raise the recall budget",
      });
      continue;
    }
    result.rulings.push({
      id: rul.id,
      scope: rul.scope,
      text: rul.text,
      ruleRef: rul.ruleRef,
      standing: rul.standing,
      authority: rul.actor,
      provenance: formatProvenance(rul.provenance),
    } satisfies RecallRuling);
    spent++;
  }

  // Enrichment tier is admitted only when closure is complete. No enrichment
  // source exists in this core; an incomplete result therefore carries none.
  result.spent = spent;
  return result.gaps.length > 0 || !result.complete
    ? { kind: "result", result: { ...result, complete: false } }
    : { kind: "result", result };
}
