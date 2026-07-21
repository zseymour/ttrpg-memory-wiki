/**
 * The 22-entry failure catalog. Every plausible shortcut implementation the spec
 * names must be killed by at least one probe. Entries whose killing subsystem is
 * not yet built are marked `pendingSubsystem` so coverage accounting stays honest:
 * an entry is either killed by a probe or explicitly pending a named slice.
 */

export type CatalogId =
  | "last-write-wins"
  | "similarity-only-recall"
  | "lens-as-filter-tag"
  | "mutable-status-flag"
  | "timestamp-as-precedence"
  | "container-provenance"
  | "soft-delete"
  | "import-as-truth"
  | "merge-on-alias"
  | "summary-drift"
  | "naive-gap-reporting"
  | "live-rules-lookup"
  | "in-place-schema-migration"
  | "windowed-reconciliation"
  | "over-detection"
  | "projection-as-record"
  | "byte-diff-as-edit"
  | "auto-accepted-intake"
  | "context-stuffing"
  | "cross-campaign-bleed"
  | "eager-cache-retention"
  | "rewound-return";

export interface CatalogEntry {
  id: CatalogId;
  description: string;
  /** Set when the killing subsystem is not yet built in this slice. */
  pendingSubsystem?: string;
}

export const FAILURE_CATALOG: readonly CatalogEntry[] = [
  { id: "last-write-wins", description: "a newer establishment silently overwrites an incompatible one" },
  { id: "similarity-only-recall", description: "relevance ranking displaces recall-critical material" },
  { id: "lens-as-filter-tag", description: "a lens is a display filter, not a real compartment" },
  { id: "mutable-status-flag", description: "lifecycle standing is an editable field, not derived" },
  { id: "timestamp-as-precedence", description: "wall-clock or submission time decides truth precedence" },
  { id: "container-provenance", description: "provenance attaches to a page, not claim-scoped" },
  { id: "soft-delete", description: "erasure hides content instead of removing it" },
  { id: "import-as-truth", description: "importing a source establishes its content as truth", pendingSubsystem: "source import" },
  { id: "merge-on-alias", description: "a shared name or asserted equivalence merges two distinct entities" },
  { id: "summary-drift", description: "an edited recap silently becomes authoritative", pendingSubsystem: "recap / derived-view adoption" },
  { id: "naive-gap-reporting", description: "a gap reveals the excluded or erased material it reports" },
  { id: "live-rules-lookup", description: "rules resolved by unreproducible live lookup", pendingSubsystem: "source store" },
  { id: "in-place-schema-migration", description: "a content-kind change rewrites historical semantics", pendingSubsystem: "content-kind adapters" },
  { id: "windowed-reconciliation", description: "conflict detection only scans a recent window" },
  { id: "over-detection", description: "unrelated or state-transition changes are flagged as conflicts" },
  { id: "projection-as-record", description: "the projected page is treated as authoritative" },
  { id: "byte-diff-as-edit", description: "a byte diff is treated as semantic evidence" },
  { id: "auto-accepted-intake", description: "ambiguous edits are auto-accepted without confirmation" },
  { id: "context-stuffing", description: "over-budget recall dumps relevance instead of a critical prefix" },
  { id: "cross-campaign-bleed", description: "ids, facts, or embeddings leak between campaigns" },
  { id: "eager-cache-retention", description: "erased/tightened material survives in retained recall" },
  { id: "rewound-return", description: "rewound content silently returns to play via a bypass edit" },
];
