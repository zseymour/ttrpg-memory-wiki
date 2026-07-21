/**
 * The versioned, provider-neutral Recall contract.
 *
 * A request fixes situation, focal identities, required Epistemic lenses, a dual
 * vantage (establishment-order snapshot + fictional-time focus), and a hard,
 * representation-aware budget with mandatory reserves. A result preserves
 * separate lenses, per-item Recall qualification, conflicts, gaps, and explicit
 * complete/incomplete standing. Lens-excluded and erased material never appears
 * in items, references, omission manifests, counts, or gap wording.
 */

import type { AnchorId, ArtifactId, AssertionId, CampaignId, RulingId } from "../core/ids.ts";
import type { SafetyBoundary, Stance, Uncertainty } from "../core/operations.ts";
import type { Standing } from "../core/state.ts";

/** An epistemic compartment. Not an ACL — authority governs which may be requested. */
export type Lens =
  | { kind: "establishment" }
  | { kind: "player-awareness" }
  | { kind: "entity-belief"; holder: AnchorId }
  | { kind: "entity-suspicion"; holder: AnchorId }
  | { kind: "entity-awareness"; holder: AnchorId };

export function lensKey(lens: Lens): string {
  return "holder" in lens ? `${lens.kind}:${lens.holder}` : lens.kind;
}

/** The single stance a lens is a compartment for. Its authority governs the lens. */
export function lensStance(lens: Lens): Stance {
  switch (lens.kind) {
    case "establishment":
      return "establishment";
    case "player-awareness":
      return "player-awareness";
    case "entity-belief":
      return "belief";
    case "entity-suspicion":
      return "suspicion";
    case "entity-awareness":
      return "entity-awareness";
  }
}

/** Whether a lens admits an assertion: same compartment, and matching holder for perspective lenses. */
export function lensAdmits(lens: Lens, stance: Stance, holder: AnchorId | null): boolean {
  if (stance !== lensStance(lens)) return false;
  return !("holder" in lens) || holder === lens.holder;
}

export interface Vantage {
  /** The pinned authoritative-record snapshot; ordinary later ops do not alter it. */
  establishmentPos: number;
  /** The fictional-time focus identifying when recalled material occurs or holds. */
  fictionalTime: number | null;
}

export interface Budget {
  /** Hard total, representation-aware. Enrichment is admitted only after closure fits. */
  total: number;
}

export interface RecallRequest {
  situation: string;
  /**
   * The epistemic audience the recall is for. Authority gates which lenses this
   * consumer may request; the campaign owner holds root authority over every lens.
   * Never implicit — a request without a fixed audience has no admissible perspective.
   */
  audience: string;
  focal: AnchorId[];
  lenses: Lens[];
  /**
   * Human-facing names, aliases, or titles submitted for resolution to stable
   * referential anchors at the vantage. Resolution reads only referential identity;
   * a believed, suspected, or provisional equivalence never authorizes it. A selector
   * that matches no anchor, or more than one, produces a Recall gap — never a
   * planner-chosen entity and never a fuzzy merge.
   */
  selectors?: string[];
  /**
   * Non-authoritative play-context hints (transcript references, mentioned names,
   * task-local statements). They may guide enrichment relevance but confer no
   * standing and cannot alter identity, authority, or current state.
   */
  seeds?: string[];
  vantage: Vantage;
  budget: Budget;
  /**
   * Propositions the caller wants an explicit answer about. A focal/attribute pair
   * with no qualifying assertion recalls as Unrecorded — never as false or silent
   * absence.
   */
  expectations?: { anchor: AnchorId; attribute: string }[];
}

/** The three-valued relation between qualified fictional time and the vantage. */
export type TemporalMatch = "definitely-applicable" | "possibly-applicable" | "definitely-outside";

/** The minimum semantic envelope so recalled material cannot be misread. */
export interface RecallQualification {
  anchor: AnchorId;
  attribute: string;
  identity: string;
  standing: Standing;
  lens: string;
  stance: Stance;
  fictionalTime: number | null;
  temporalMatch: TemporalMatch;
  uncertainty: Uncertainty;
  authority: string;
  provenance: string;
  /** The preparation this establishment realized, if any (linked back to provisional material). */
  realizes?: AssertionId;
  /** Set when this item participates in an unresolved continuity conflict. */
  conflict?: string;
}

export interface RecallItem {
  assertion: AssertionId;
  value: string;
  qualification: RecallQualification;
}

/** An explicit, non-revealing indication that recall-critical info cannot be supplied. */
export interface RecallGap {
  requirement: string;
  lens: string | null;
  vantage: Vantage;
  reason: string;
  scope: string;
  consequence: string;
  remediation: string;
}

/** Non-authoritative evidence of how an enrichment candidate space was bounded. */
export interface OmissionManifest {
  path: string;
  considered: number;
  included: number;
  cutoff: string;
}

/**
 * A typed route for deeper inspection, bound to its campaign, vantage, lens, and
 * target, followed through a separately budgeted child request. It retains the
 * parent snapshot rather than following latest; a child may narrow but not silently
 * broaden, and moving to a newer vantage requires an explicit rebase.
 */
export interface RecallReference {
  campaign: CampaignId;
  /** The parent snapshot, retained by a child request unless an explicit rebase moves it. */
  vantage: Vantage;
  /** The epistemic lens this reference was surfaced under; a child may not broaden it. */
  lens: Lens;
  /** The referential anchor a child request inspects more deeply. */
  target: AnchorId;
  /** The permitted child situation (e.g. portray-entity). */
  operation: string;
}

/** A separately budgeted follow of a Recall reference. Narrows inherited constraints, never broadens. */
export interface ChildRecallRequest {
  audience: string;
  situation?: string;
  /** Must be a subset of the reference target; defaults to it. Broadening is rejected. */
  focal?: AnchorId[];
  /** Must be a subset of the reference lens; defaults to it. Broadening is rejected. */
  lenses?: Lens[];
  /** Independently allocated; the parent budget is not shared. */
  budget: Budget;
  expectations?: { anchor: AnchorId; attribute: string }[];
  seeds?: string[];
  /** An explicit move to a newer vantage. Absent, the parent snapshot is retained. */
  rebase?: Vantage;
}

export interface SurfacedConflict {
  id: string;
  slot: string;
  members: AssertionId[];
}

/** An established or perspectival claim that two anchors denote the same entity. Never merges records. */
export interface RecallEquivalence {
  assertion: AssertionId;
  anchors: [AnchorId, AnchorId];
  identities: [string, string];
  qualification: RecallQualification;
}

/** A structured artifact surfaced for organization; its links confer no standing. */
export interface RecallArtifact {
  id: ArtifactId;
  kind: string;
  label: string;
  links: { role: string; target: string }[];
  standing: Standing;
  authority: string;
  /** Compact claim-scoped provenance for the artifact itself (not its linked targets). */
  provenance: string;
}

/** A normative campaign ruling surfaced as rule context, distinct from fictional truth. */
export interface RecallRuling {
  id: RulingId;
  scope: string;
  text: string;
  ruleRef: string | null;
  standing: Standing;
  authority: string;
  provenance: string;
}

/** An explicit Unrecorded answer: memory holds no qualifying assertion for this slot. */
export interface RecallUnrecorded {
  anchor: AnchorId;
  attribute: string;
  lens: string;
  uncertainty: Uncertainty;
}

export interface RecallResult {
  complete: boolean;
  vantage: Vantage;
  /** Active safety boundaries always represented first, within the control reserve. */
  safety: SafetyBoundary[];
  lenses: Record<string, RecallItem[]>;
  conflicts: SurfacedConflict[];
  /** Established/believed/suspected identity equivalences touching the focus. */
  equivalences: RecallEquivalence[];
  /** Structured artifacts (threads, open questions) organizing focal material. */
  artifacts: RecallArtifact[];
  /** Applicable campaign rulings (rule context) for the focus. */
  rulings: RecallRuling[];
  /** Explicit Unrecorded answers for requested expectations with no qualifying assertion. */
  unrecorded: RecallUnrecorded[];
  /** Fully qualified enrichment, admitted only after closure fits; never affects completeness. */
  enrichment: RecallItem[];
  /** Typed routes for deeper inspection via separately budgeted child requests. */
  references: RecallReference[];
  gaps: RecallGap[];
  omissionManifest: OmissionManifest[];
  /** Spent vs. total budget, for honest work-factor inspection. */
  spent: number;
}

export type RecallOutcome =
  | { kind: "rejected"; reason: string }
  | { kind: "unavailable"; reason: string }
  | { kind: "result"; result: RecallResult };
