/**
 * Memory operations: the sole authoritative write vocabulary.
 *
 * Every authoritative change is an explicit, attributed, validated operation
 * carrying its lifecycle intent. There is no editable status field and no
 * page mutation; lifecycle standing is *derived* from accepted operations.
 */

import type { AnchorId, AssertionId, ConflictId, GrantId, OperationId } from "./ids.ts";

/**
 * The attributed stance an assertion takes toward a proposition. Multiple
 * stances may qualify the same proposition without overwriting one another —
 * this is the epistemic separation every flat memory store loses.
 */
export type Stance =
  | "establishment" // established truth in the shared fiction
  | "preparation" // provisional material, not truth
  | "belief" // a fictional entity accepts it as true
  | "suspicion" // a fictional entity considers it possible
  | "entity-awareness" // a fictional entity has perceived or been told it
  | "player-awareness"; // it has been communicated to the human player

/** How an establishment entered memory. Records context without grading truth. */
export type EstablishmentMode =
  | "direct-portrayal"
  | "participant-narration"
  | "adjudication"
  | "baseline"
  | "offscreen";

/** Structured, scoped uncertainty. Absence of an assertion is Unrecorded, never false. */
export type Uncertainty =
  | { kind: "certain" }
  | { kind: "unknown" }
  | { kind: "partially-known"; note: string }
  | { kind: "unresolved"; alternatives: string[] }
  | { kind: "provisional" };

/** Claim-scoped provenance: who introduced the stance and its narrow support. */
export interface Provenance {
  introducedBy: string;
  mode?: EstablishmentMode;
  /** Bounded claim evidence: a narrow excerpt + stable locator, never a transcript. */
  evidence?: { locator: string; excerpt: string };
  /** Explicit indication that prior support is unavailable or erased. */
  gap?: string;
}

/**
 * A claim-shaped meaning. Carries no truth, perspective, or disclosure standing
 * on its own; a stance qualifies it. Modeled as a subject/attribute/value triple
 * so incompatible established values on a single-valued slot are detectable
 * without last-write-wins.
 */
export interface Proposition {
  subject: AnchorId;
  attribute: string;
  value: string;
}

/** The actual semantic effect an authorized conflict resolution declares. */
export type ConflictEffect =
  | { kind: "correction"; keep: AssertionId } // the other was an erroneous record
  | { kind: "rewind"; remove: AssertionId } // valid fiction collaboratively revised
  | { kind: "temporal-qualification"; assign: Record<string, number> } // by fictional time
  | { kind: "new-establishment"; proposition: Proposition; fictionalTime: number | null };

/** A current, player-defined content constraint applying to every recall situation. */
export interface SafetyBoundary {
  id: string;
  /** Opaque topic key. Erasure works through this without restating harmful content. */
  topic: string;
  note?: string;
}

/**
 * A semantic precondition: an explicit dependency on a Memory item's identity
 * and standing. A changed precondition yields an explicit conflict receipt
 * rather than a silent overwrite; unrelated changes revalidate cleanly.
 */
export interface Precondition {
  assertion: AssertionId;
  standing?: "active" | "corrected" | "retracted" | "superseded" | "rewound" | "erased";
}

interface OpBase {
  /** Producer-supplied. A resubmitted operationId is deduplicated via its receipt. */
  operationId: OperationId;
  /** Attribution: who proposed the operation (never grants acceptance by itself). */
  actor: string;
  /** The authority grant invoked, if the actor is not the campaign owner. */
  grant?: GrantId;
  reason?: string;
  /** Semantic preconditions validated against current state before acceptance. */
  expect?: Precondition[];
}

export type Operation =
  | (OpBase & { kind: "establish-anchor"; anchor: AnchorId; label: string })
  | (OpBase & {
      kind: "assert";
      stance: Stance;
      proposition: Proposition;
      /** The perspective holder for belief/suspicion/entity-awareness stances. */
      holder?: AnchorId;
      fictionalTime: number | null;
      mode?: EstablishmentMode;
      uncertainty?: Uncertainty;
      provenance?: Provenance;
    })
  | (OpBase & { kind: "correct"; target: AssertionId; value: string })
  | (OpBase & { kind: "retract"; target: AssertionId })
  | (OpBase & { kind: "supersede"; target: AssertionId; value: string; effectiveFrom: number | null })
  | (OpBase & { kind: "rewind"; target: AssertionId })
  | (OpBase & { kind: "erase"; target: AssertionId })
  | (OpBase & { kind: "resolve-conflict"; conflict: ConflictId; effect: ConflictEffect })
  | (OpBase & { kind: "set-safety-boundary"; boundary: SafetyBoundary; erase?: AssertionId[] })
  | (OpBase & { kind: "grant-authority"; delegate: GrantId; grantee: string; acts: Act[] })
  | (OpBase & { kind: "revoke-authority"; delegate: GrantId });

/** The semantic acts authority can be delegated for. */
export type Act =
  | "establish" // create establishment-stance assertions
  | "prepare" // create preparation-stance assertions
  | "portray" // create belief/suspicion/awareness assertions
  | "maintain" // correct/retract/supersede/rewind
  | "resolve"; // resolve continuity conflicts

/** The act an operation requires the actor to hold authority for. */
export function requiredAct(op: Operation): Act | "owner-only" | null {
  switch (op.kind) {
    case "establish-anchor":
      return "establish";
    case "assert":
      switch (op.stance) {
        case "establishment":
          return "establish";
        case "preparation":
          return "prepare";
        default:
          return "portray";
      }
    case "correct":
    case "retract":
    case "supersede":
    case "rewind":
      return "maintain";
    case "resolve-conflict":
      return "resolve";
    case "erase":
    case "set-safety-boundary":
    case "grant-authority":
    case "revoke-authority":
      return "owner-only"; // safety and delegation authority are non-delegable
  }
}
