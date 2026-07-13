/**
 * Branded identifier types.
 *
 * Identifiers that must survive export/replay are derived deterministically from
 * establishment order, never from wall-clock time or random bytes, so replaying
 * the authoritative record into a fresh instance reproduces identical ids.
 */

declare const brand: unique symbol;
type Brand<T, B extends string> = T & { readonly [brand]: B };

/** A single campaign's isolation scope. No id, fact, or embedding crosses it. */
export type CampaignId = Brand<string, "Campaign">;

/** A referential anchor: a stable subject of reference (entity, place, event). */
export type AnchorId = Brand<string, "Anchor">;

/** One attributed assertion. Derived from establishment order for replayability. */
export type AssertionId = Brand<string, "Assertion">;

/** A producer-supplied proposal id, used for idempotent retry via receipts. */
export type OperationId = Brand<string, "Operation">;

/** An authority grant delegating scoped acts to a participant or procedure. */
export type GrantId = Brand<string, "Grant">;

/** A surfaced continuity conflict awaiting authorized resolution. */
export type ConflictId = Brand<string, "Conflict">;

export const campaignId = (s: string): CampaignId => s as CampaignId;
export const anchorId = (s: string): AnchorId => s as AnchorId;
export const operationId = (s: string): OperationId => s as OperationId;
export const grantId = (s: string): GrantId => s as GrantId;

/** Assertion id for the operation accepted at establishment-order position `pos`. */
export const assertionIdAt = (pos: number): AssertionId => `a${pos}` as AssertionId;

/** Conflict id derived from the two establishment-order positions in tension. */
export const conflictIdOf = (a: number, b: number): ConflictId =>
  `k${Math.min(a, b)}-${Math.max(a, b)}` as ConflictId;
