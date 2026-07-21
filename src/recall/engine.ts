/**
 * The recall engine: a lens-bound planner and a deterministic assembler.
 *
 * Planning may vary, but a validated plan + vantage + exact budget assembles
 * deterministically. The assembler owns Recall-critical closure: control/safety,
 * focal identity and lens guards, lifecycle and conflicts, then task material —
 * each represented or explicitly gapped before any enrichment could spend budget.
 * Over-budget returns the priority-ordered critical prefix with gaps and zero
 * enrichment; an infeasible mandatory reserve is rejected without full assembly.
 *
 * Enrichment is optional, fully qualified, related-identity material admitted only
 * after closure fits, through an inspectable deterministic order; it never displaces
 * recall-critical material and never affects completeness. Recall references offer
 * deeper inspection through separately budgeted child requests at the parent snapshot.
 */

import type { AnchorId, AssertionId, CampaignId } from "../core/ids.ts";
import { IDENTITY_EQUIVALENCE, isEquivalence, stanceAct, type Provenance } from "../core/operations.ts";
import { heldActs, type AssertionRecord, type CampaignState } from "../core/state.ts";
import {
  lensAdmits,
  lensKey,
  lensStance,
  type Lens,
  type RecallArtifact,
  type RecallEquivalence,
  type RecallGap,
  type RecallItem,
  type RecallOutcome,
  type RecallQualification,
  type RecallReference,
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
  /** Required paths cover the vantage or gap; enrichment paths are optional and never gap. */
  required: boolean;
  purpose: string;
}

export interface RecallPlan {
  planner: string;
  request: RecallRequest;
  /** Effective focus: explicitly named focal plus resolved selectors, de-duplicated. */
  focal: AnchorId[];
  paths: RecallPath[];
  /** Gaps for selectors that resolved to zero or many anchors; recorded at plan time. */
  selectorGaps: RecallGap[];
}

function normalizeName(s: string): string {
  return s.trim().toLowerCase().replace(/\s+/g, " ");
}

/**
 * Resolve human-facing selectors to stable referential anchors at the snapshot.
 * Matching reads only anchor labels (referential identity) — never a believed,
 * suspected, or provisional equivalence. A selector matching no anchor, or more than
 * one, yields a Recall gap and contributes no focus: never a planner-chosen entity,
 * never a fuzzy merge.
 */
function resolveSelectors(request: RecallRequest, state: CampaignState): { anchors: AnchorId[]; gaps: RecallGap[] } {
  const anchors: AnchorId[] = [];
  const gaps: RecallGap[] = [];
  for (const raw of request.selectors ?? []) {
    const name = normalizeName(raw);
    const matches: AnchorId[] = [];
    for (const [id, rec] of state.anchors) {
      if (normalizeName(rec.label) === name) matches.push(id);
    }
    if (matches.length === 1) {
      anchors.push(matches[0]!);
    } else if (matches.length === 0) {
      gaps.push({
        requirement: "recall-selector",
        lens: null,
        vantage: request.vantage,
        reason: `selector '${raw}' resolves to no referential anchor at the vantage`,
        scope: raw,
        consequence: "cannot recall material for an unresolved selector",
        remediation: "correct the selector or establish the anchor, then request by anchor id",
      });
    } else {
      gaps.push({
        requirement: "recall-selector",
        lens: null,
        vantage: request.vantage,
        reason: `selector '${raw}' is ambiguous: ${matches.length} referential anchors share this name`,
        scope: raw,
        consequence: "an ambiguous selector is never merged or resolved to a single entity",
        remediation: `disambiguate by requesting a focal anchor id directly (candidates: ${matches.join(", ")})`,
      });
    }
  }
  return { anchors, gaps };
}

/**
 * The deterministic resolved focus and selector gaps for a request at a snapshot:
 * explicitly named focal plus resolved selectors, de-duplicated in a stable order.
 * Identity resolution is not planner discretion, so plan and validatePlan share it —
 * a recorded plan whose focus or selector gaps disagree with this is tampered.
 */
function resolveFocus(request: RecallRequest, state: CampaignState): { focal: AnchorId[]; selectorGaps: RecallGap[] } {
  const { anchors: resolved, gaps } = resolveSelectors(request, state);
  const focal: AnchorId[] = [];
  const seen = new Set<string>();
  for (const f of [...request.focal, ...resolved]) {
    if (seen.has(f)) continue;
    seen.add(f);
    focal.push(f);
  }
  return { focal, selectorGaps: gaps };
}

/**
 * Lens-bound planning. Reads only referential identity (anchor labels) to resolve
 * selectors — never assertion content, so it cannot be omniscient-then-filtered. The
 * plan is deterministic in its inputs and, once validated, assembles deterministically.
 */
export function plan(request: RecallRequest, state: CampaignState, planner = "default"): RecallPlan {
  const { focal, selectorGaps } = resolveFocus(request, state);
  const paths: RecallPath[] = [];
  for (const f of focal) {
    for (const lens of request.lenses) {
      const key = lensKey(lens);
      // Per focus × lens: a required task-material path and an optional enrichment path.
      // Enrichment is nominated deterministically, admitted only after closure fits.
      paths.push({ focal: f, lens, required: true, purpose: `task material for ${f} under ${key}` });
      paths.push({ focal: f, lens, required: false, purpose: `related-identity enrichment for ${f} under ${key}` });
    }
  }
  return { planner, request, focal, paths, selectorGaps };
}

/**
 * Validate a plan before deterministic assembly. Planning may vary in which paths it
 * emits, but focus and selector gaps are deterministic identity resolution, not planner
 * discretion: re-derive them from the request and snapshot so a recorded plan cannot
 * inject an unrequested focus or drop a selector gap. A plan also may not reference a
 * lens outside the request. Returns a rejection reason, or null.
 */
export function validatePlan(plan: RecallPlan, state: CampaignState): string | null {
  const req = plan.request;
  const { focal, selectorGaps } = resolveFocus(req, state);
  if (plan.focal.length !== focal.length || plan.focal.some((f, i) => f !== focal[i])) {
    return "plan focus does not match the request's resolved referential anchors";
  }
  if (JSON.stringify(plan.selectorGaps) !== JSON.stringify(selectorGaps)) {
    return "plan selector gaps do not match deterministic selector resolution";
  }
  const requestedLenses = new Set(req.lenses.map(lensKey));
  const planFocal = new Set<string>(plan.focal);
  for (const path of plan.paths) {
    if (!requestedLenses.has(lensKey(path.lens))) return `plan references lens '${lensKey(path.lens)}' not in the request`;
    if (!planFocal.has(path.focal)) return `plan references focal '${path.focal}' not in the plan focus`;
  }
  return null;
}

/**
 * Reject a request naming a lens outside its audience's authority, before any planning
 * or assembly. A lens is admissible to whoever holds the act that governs its stance;
 * the campaign owner holds root authority over every lens. Gating a lens away is an
 * invalid request — never a silently empty compartment. `state` is the campaign's
 * current state: authorization is evaluated at request time, independent of the vantage
 * that pins which content is visible. Returns a rejection reason, or null.
 */
export function validateLensAuthority(request: RecallRequest, state: CampaignState, owner: string): string | null {
  if (request.audience === owner) return null;
  const held = heldActs(state, request.audience);
  for (const lens of request.lenses) {
    if (!held.has(stanceAct(lensStance(lens)))) {
      return `lens '${lensKey(lens)}' is outside the authority of audience '${request.audience}'`;
    }
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
 * Anchors co-organized with `focal` by an active structured artifact (a thread or
 * open question). Artifacts organize related-but-distinct material and confer no
 * standing, so this relatedness graph never merges identities — an identity
 * equivalence, by contrast, surfaces its own envelope and a follow-able reference,
 * never a silent content bleed. Focal anchors are excluded: their own material is
 * required task material, not enrichment.
 */
function relatedByArtifact(state: CampaignState, focal: AnchorId, focalSet: Set<AnchorId>): Set<AnchorId> {
  const out = new Set<AnchorId>();
  for (const art of state.artifacts.values()) {
    if (art.standing !== "active") continue;
    const members = art.links.map((l) => {
      const t = l.target as AnchorId | AssertionId;
      return state.anchors.has(t as AnchorId) ? (t as AnchorId) : (state.assertions.get(t as AssertionId)?.proposition.subject ?? null);
    });
    if (!members.includes(focal)) continue;
    for (const m of members) {
      if (m === null || m === focal || focalSet.has(m)) continue;
      out.add(m);
    }
  }
  return out;
}

/**
 * Assemble a validated plan against a snapshot state. `state` must already be the
 * derived state at the plan's vantage snapshot; Campaign binds that snapshot.
 * `campaign` binds the references so a child request can be checked against it.
 */
export function assemble(plan: RecallPlan, state: CampaignState, campaign: CampaignId): RecallOutcome {
  const req = plan.request;
  const invalid = validatePlan(plan, state);
  if (invalid) return { kind: "rejected", reason: `invalid plan: ${invalid}` };
  const safety = [...state.safety.values()];
  const mandatoryReserve = safety.length + plan.focal.length;
  if (req.budget.total < mandatoryReserve) {
    return {
      kind: "rejected",
      reason: `mandatory reserve (${mandatoryReserve}: ${safety.length} safety + ${plan.focal.length} focal) exceeds budget ${req.budget.total}`,
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
    enrichment: [],
    references: [],
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

  // Selector resolution failures are recorded at plan time; an unresolved or ambiguous
  // selector is a gap in the focus, never a planner-chosen merge.
  for (const g of plan.selectorGaps) gap(g);

  // Tier 0 — control and safety boundaries (mandatory, within reserve).
  for (const b of safety) {
    result.safety.push(b);
    spent++;
  }

  // Tier 1 — focal identity and lens guards.
  for (const focal of plan.focal) {
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
  const focalSet = new Set(plan.focal);
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

  // Tier 3 — task material, per required path, deterministic by establishment order.
  for (const path of plan.paths) {
    if (!path.required) continue;
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
  // are never merged: each anchor keeps its own identity and history. Each surfaced
  // equivalence also yields a Recall reference to inspect the paired identity deeper.
  const refSeen = new Set<string>();
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
    for (const target of [other, subj]) {
      if (focalSet.has(target)) continue;
      const rk = `${target}::${lensKey(lens)}`;
      if (refSeen.has(rk)) continue;
      refSeen.add(rk);
      result.references.push({ campaign, vantage: req.vantage, lens, target, operation: "portray-entity" });
    }
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

  // Enrichment tier — admitted only when recall-critical closure is complete. It is
  // fully qualified, never displaces critical material, and never affects completeness.
  // Each enrichment path emits an omission manifest accounting for its bounded space
  // over lens-admissible candidates only, so no manifest enumerates excluded or erased
  // material. When closure is incomplete, zero enrichment is admitted and none is reported.
  if (result.complete) {
    const enriched = new Set<AssertionId>();
    for (const path of plan.paths) {
      if (path.required) continue;
      const related = relatedByArtifact(state, path.focal, focalSet);
      const candidates: AssertionRecord[] = [];
      for (const a of state.assertions.values()) {
        if (!related.has(a.proposition.subject)) continue;
        if (isEquivalence(a.proposition)) continue;
        if (!recallable(a, path.lens)) continue;
        if (enriched.has(a.id)) continue;
        candidates.push(a);
      }
      let included = 0;
      for (const a of candidates) {
        if (spent >= req.budget.total) break;
        result.enrichment.push({
          assertion: a.id,
          value: a.effectiveValue,
          qualification: qualify(state, a, path.lens, req.vantage),
        } satisfies RecallItem);
        enriched.add(a.id);
        included++;
        spent++;
      }
      // Only an actually-nominated space is worth an omission manifest; a path with no
      // candidates bounded nothing to report.
      if (candidates.length > 0) {
        result.omissionManifest.push({
          path: path.purpose,
          considered: candidates.length,
          included,
          cutoff: included < candidates.length ? "budget-exhausted" : "fully-included",
        });
      }
    }
  }

  result.spent = spent;
  return result.gaps.length > 0 || !result.complete
    ? { kind: "result", result: { ...result, complete: false } }
    : { kind: "result", result };
}
