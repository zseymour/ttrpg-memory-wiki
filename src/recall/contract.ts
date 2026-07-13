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

import type { AnchorId, AssertionId } from "../core/ids.ts";
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

/** The stance a lens admits, paired with an optional required holder. */
export function lensAdmits(lens: Lens, stance: Stance, holder: AnchorId | null): boolean {
  switch (lens.kind) {
    case "establishment":
      return stance === "establishment";
    case "player-awareness":
      return stance === "player-awareness";
    case "entity-belief":
      return stance === "belief" && holder === lens.holder;
    case "entity-suspicion":
      return stance === "suspicion" && holder === lens.holder;
    case "entity-awareness":
      return stance === "entity-awareness" && holder === lens.holder;
  }
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
  focal: AnchorId[];
  lenses: Lens[];
  vantage: Vantage;
  budget: Budget;
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

export interface SurfacedConflict {
  id: string;
  slot: string;
  members: AssertionId[];
}

export interface RecallResult {
  complete: boolean;
  vantage: Vantage;
  /** Active safety boundaries always represented first, within the control reserve. */
  safety: SafetyBoundary[];
  lenses: Record<string, RecallItem[]>;
  conflicts: SurfacedConflict[];
  gaps: RecallGap[];
  omissionManifest: OmissionManifest[];
  /** Spent vs. total budget, for honest work-factor inspection. */
  spent: number;
}

export type RecallOutcome =
  | { kind: "rejected"; reason: string }
  | { kind: "unavailable"; reason: string }
  | { kind: "result"; result: RecallResult };
