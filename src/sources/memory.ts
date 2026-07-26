/**
 * An in-memory `SourceStore` built from a declarative fixture. It exists so the
 * harness (and tests) can stand up a synthetic, versioned corpus without any
 * ingestion pipeline: the fixture spells out every minted version, its rules,
 * and its declared delta vs its immediate predecessor, and this store answers
 * the two bibliographic questions purely from that data. It is read-only and
 * never mutates the fixture it was given.
 */

import type { ResolvedRule, SourceStore, VersionRevisions } from "./store.ts";

/** A single rule element as declared in one version of a source. */
export interface FixtureRule {
  content: string;
  /** Opaque human-facing pointer (e.g. "p.42"); retained only as claim evidence. */
  locator: string;
  metadata?: Record<string, string>;
}

/**
 * One minted version of a source: its declared predecessor, the full set of
 * `rules` it mints, optional version-level presentation, and its delta vs its
 * immediate predecessor. Deltas are expressed in the natural namespace: `added`,
 * `revised`, and the keys of `continues` use this version's ruleIds, while
 * `removed` and the values of `continues` use the predecessor's ruleIds.
 */
export interface FixtureVersion {
  /** The immediate predecessor version tag; null only for the first minted version. */
  predecessor: string | null;
  /** Version-level title, surfaced as `content` on a bare (ruleId-less) resolve. */
  title?: string;
  /** Version-level opaque locator; defaults to the version key itself. */
  tag?: string;
  /** Version-level metadata, surfaced on a bare resolve. */
  metadata?: Record<string, string>;
  /** Every rule element minted in this version, keyed by ruleId. */
  rules: Record<string, FixtureRule>;
  /** ruleIds (this version's ids) whose content changed under the same id. */
  revised?: string[];
  /** ruleIds (the predecessor's ids) that no longer exist in this version. */
  removed?: string[];
  /** ruleIds new in this version. */
  added?: string[];
  /** Renames: this-version ruleId -> predecessor ruleId. */
  continues?: Record<string, string>;
}

/** A synthetic corpus: source namespace -> version tag -> version declaration. */
export type SourceFixture = Record<string, Record<string, FixtureVersion>>;

/** What we know about one tracked rule as we walk the predecessor chain. */
interface Tracked {
  /** The rule's id in the `from` version, or null if it was added within the chain. */
  fromId: string | null;
  /** Whether its content changed at any step along the chain. */
  revised: boolean;
}

export class InMemorySourceStore implements SourceStore {
  constructor(private readonly fixture: SourceFixture) {}

  resolve(source: string, version: string, ruleId?: string): ResolvedRule | null {
    const v = this.fixture[source]?.[version];
    if (v === undefined) return null;

    if (ruleId !== undefined) {
      const rule = v.rules[ruleId];
      if (rule === undefined) return null;
      return { content: rule.content, locator: rule.locator, metadata: { ...(rule.metadata ?? {}) } };
    }

    return { content: v.title ?? "", locator: v.tag ?? version, metadata: { ...(v.metadata ?? {}) } };
  }

  revisions(source: string, fromVersion: string, toVersion: string): VersionRevisions | null {
    const versions = this.fixture[source];
    if (versions === undefined) return null;
    const fromEntry = versions[fromVersion];
    if (fromEntry === undefined || versions[toVersion] === undefined) return null;

    // Walk the predecessor chain from `to` back to `from`, collecting the delta
    // step contributed by each version after `from`. A broken chain (null or
    // unknown predecessor reached before `from`) means `from` is not an ancestor.
    const steps: FixtureVersion[] = [];
    let cur = toVersion;
    while (cur !== fromVersion) {
      const entry: FixtureVersion | undefined = versions[cur];
      if (entry === undefined) return null;
      const pred = entry.predecessor;
      if (pred === null || versions[pred] === undefined) return null;
      steps.push(entry);
      cur = pred;
    }
    steps.reverse(); // earliest step first

    // Track every rule that exists in `from` by its `from`-version identity.
    let current = new Map<string, Tracked>();
    for (const ruleId of Object.keys(fromEntry.rules)) {
      current.set(ruleId, { fromId: ruleId, revised: false });
    }

    const removed = new Set<string>();

    for (const delta of steps) {
      const renameSources = new Set(Object.values(delta.continues ?? {}));
      const next = new Map<string, Tracked>();

      // Drop removed rules; a rule that existed in `from` surfaces as removed,
      // one added within the chain and then dropped nets out.
      const dropped = new Set(delta.removed ?? []);
      for (const id of dropped) {
        const info = current.get(id);
        if (info?.fromId != null) removed.add(info.fromId);
      }

      // Carry over unchanged rules under their existing ids.
      for (const [id, info] of current) {
        if (dropped.has(id) || renameSources.has(id)) continue;
        next.set(id, info);
      }

      // Apply renames: the predecessor's rule becomes a new id, keeping identity.
      for (const [newId, predId] of Object.entries(delta.continues ?? {})) {
        const info = current.get(predId) ?? { fromId: null, revised: false };
        next.set(newId, { fromId: info.fromId, revised: info.revised });
      }

      // Introduce rules added in this step (no `from`-version identity).
      for (const id of delta.added ?? []) {
        next.set(id, { fromId: null, revised: false });
      }

      // Mark content revisions (keyed by this version's ids, post-rename).
      for (const id of delta.revised ?? []) {
        const info = next.get(id);
        if (info !== undefined) info.revised = true;
      }

      current = next;
    }

    const revised: string[] = [];
    const added: string[] = [];
    const continues: Record<string, string> = {};
    for (const [toId, info] of current) {
      if (info.fromId === null) {
        added.push(toId);
        continue;
      }
      if (toId !== info.fromId) continues[toId] = info.fromId;
      if (info.revised) revised.push(info.fromId);
    }

    return {
      predecessor: fromVersion,
      revised: revised.sort(),
      removed: [...removed].sort(),
      added: added.sort(),
      continues,
    };
  }
}
