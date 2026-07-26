/**
 * The Source store: the versioned, read-only home of citable outside-of-play
 * material. It is campaign-blind and lives outside the authoritative record —
 * it answers only two bibliographic questions and never knows about campaigns,
 * citations, rulings, or reviews. Campaign memory holds only Corpus pins,
 * version-frozen citations, and Campaign rulings; Rule context composes pinned
 * material at recall by resolving through this store, without copying.
 *
 * The store is an optional deep layer: a `Campaign` may be constructed without
 * one, and `resolve`/`revisions` returning `null` is normal, never an error.
 * Export and replay never depend on it.
 */

/** The stable, version-independent identity of a rule element in a corpus namespace. */
export interface RuleIdentity {
  /** The bibliographic identity / namespace, e.g. "synthetic-corpus". */
  source: string;
  /** The corpus-assigned stable id within the namespace, e.g. "grapple". Never a page number. */
  ruleId: string;
}

/** Resolved content for a `(source, version, ruleId)` key. */
export interface ResolvedRule {
  content: string;
  /** Opaque human-facing pointer (e.g. "p.42"); retained only as claim evidence, never keyed on. */
  locator: string;
  metadata: Record<string, string>;
}

/**
 * The corpus-declared delta describing what changed going from `predecessor`
 * to some later version. Continuity is the carried-forward id itself: a ruleId
 * absent from every field is unchanged and still continuous. `revised` and
 * `removed` are kept distinct because they drive different reconciliation
 * dispositions (a revised rule can be reconfirmed/revised; a removed rule
 * pushes toward retire). `continues` maps a renamed id in the later version to
 * its id in `predecessor`.
 */
export interface VersionRevisions {
  /** The version this delta is relative to; null only for the first minted version. */
  predecessor: string | null;
  /** ruleIds whose content changed under the same id. */
  revised: string[];
  /** ruleIds that no longer exist in the later version. */
  removed: string[];
  /** ruleIds new in the later version; never touches existing citations. */
  added: string[];
  /** Renames: laterRuleId -> predecessorRuleId. */
  continues: Record<string, string>;
}

export interface SourceStore {
  /**
   * Content for a version. With `ruleId`, resolves that rule element; without it,
   * source-version-level metadata. Returns `null` when the source, version, or
   * rule is not minted in this store instance. Immutable: a minted version
   * resolves to identical content indefinitely; re-processing mints a new version.
   */
  resolve(source: string, version: string, ruleId?: string): ResolvedRule | null;

  /**
   * The declared delta going from `fromVersion` to `toVersion`, composed
   * transitively across the declared predecessor chain (so a v1->v3 query sees a
   * rule revised in v2 even if untouched in v3, and chained renames compose into
   * a single `continues` entry). `predecessor` in the result echoes `fromVersion`.
   * Returns `null` when either version is unknown or no declared chain connects them.
   * The store never infers continuity beyond what the corpus declared.
   */
  revisions(source: string, fromVersion: string, toVersion: string): VersionRevisions | null;
}
