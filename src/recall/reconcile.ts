/**
 * Corpus reconciliation: deriving a citation's live standing and previewing what a
 * re-pin would affect. Reconciliation status is structural and derived — it reads
 * the Source store's declared revisions plus the operation log, never a stored flag
 * (ADR-0009). Store-absent, the live *unreviewed* caveat is silently omitted:
 * honest degradation, since deep corpus content is equally unavailable.
 */

import type { RulingId } from "../core/ids.ts";
import { citationDisposition, pinnedVersion, type CampaignState, type RulingRecord } from "../core/state.ts";
import type { SourceStore } from "../sources/store.ts";
import type { RecallCitation } from "./contract.ts";

const DISPOSITION_STATUS = {
  reconfirm: "reconfirmed",
  revise: "revised",
  retire: "retired",
} as const satisfies Record<string, RecallCitation["reconciliation"]>;

/** What a re-pin would affect: a frozen citation whose rule the delta touches, with the reason. */
export interface RepinImpact {
  ruling: RulingId;
  citation: number;
  source: string;
  ruleId: string;
  citedVersion: string;
  candidateVersion: string;
  reason: "revised" | "removed" | "renamed";
}

/**
 * How the declared delta from `fromVersion` to `toVersion` touches a frozen `ruleId`:
 * revised or removed under the same id, or carried forward under a rename (the frozen
 * predecessor id appears as a `continues` value). `null` when untouched or undeclared.
 */
function revisionReason(
  sourceStore: SourceStore,
  source: string,
  fromVersion: string,
  toVersion: string,
  ruleId: string,
): RepinImpact["reason"] | null {
  if (fromVersion === toVersion) return null;
  const delta = sourceStore.revisions(source, fromVersion, toVersion);
  if (!delta) return null;
  if (delta.revised.includes(ruleId)) return "revised";
  if (delta.removed.includes(ruleId)) return "removed";
  if (Object.values(delta.continues).includes(ruleId)) return "renamed";
  return null;
}

/**
 * Compose one frozen citation live at recall. `citedVersion`/`excerpt` stay frozen at
 * authorship; `content`/`locator` resolve through the pinned version when a store is
 * present and the source pinned, else degrade with a `provenanceGap` and frozen locator.
 * The `reconciliation` standing is derived from recorded dispositions and the store's
 * declared revisions, never a stored flag. Shared by the engine and `previewRepin`.
 */
export function citationReconciliation(
  state: CampaignState,
  sourceStore: SourceStore | undefined,
  ruling: RulingRecord,
  index: number,
): RecallCitation {
  const cite = ruling.cites[index]!;
  const pinned = pinnedVersion(state, cite.source);

  let content: string | null = null;
  let locator = cite.evidence.locator;
  let provenanceGap: string | undefined;
  if (sourceStore && pinned !== null) {
    const resolved = sourceStore.resolve(cite.source, pinned, cite.ruleId);
    if (resolved) {
      content = resolved.content;
      locator = resolved.locator;
    } else {
      provenanceGap = `pinned version ${pinned} of ${cite.source} does not resolve ${cite.ruleId}`;
    }
  } else {
    provenanceGap = sourceStore ? "source unpinned" : "source store absent";
  }

  return {
    source: cite.source,
    ruleId: cite.ruleId,
    citedVersion: cite.version,
    pinnedVersion: pinned,
    content,
    locator,
    excerpt: cite.evidence.excerpt,
    reconciliation: reconciliationStatus(state, sourceStore, ruling.id, index, pinned),
    provenanceGap,
  };
}

/**
 * A recorded disposition since the current pin discharges the citation (reconfirmed /
 * revised / retired). Otherwise a citation frozen at the pinned version, unpinned, or
 * with no store is *current*; a store-declared revision between the cited and pinned
 * versions with no discharge is *unreviewed*.
 */
function reconciliationStatus(
  state: CampaignState,
  sourceStore: SourceStore | undefined,
  ruling: RulingId,
  index: number,
  pinned: string | null,
): RecallCitation["reconciliation"] {
  const cite = state.rulings.get(ruling)!.cites[index]!;
  const disposition = citationDisposition(state, ruling, index);
  const pinPos = state.pins.get(cite.source)?.pos ?? null;
  // A disposition discharges only if it was recorded at or after the current pin; a
  // later re-pin re-opens reconciliation.
  if (disposition && (pinPos === null || disposition.pos >= pinPos)) {
    return DISPOSITION_STATUS[disposition.disposition];
  }
  if (pinned === null || cite.version === pinned || !sourceStore) return "current";
  return revisionReason(sourceStore, cite.source, cite.version, pinned, cite.ruleId) !== null ? "unreviewed" : "current";
}

/**
 * Read-only reconciliation query: the frozen citations a re-pin of `source` to
 * `candidateVersion` would affect, with the reason. Not an operation — the review it
 * prompts is submitted as explicit `pin-corpus` / `reconcile-citation` ops. Returns
 * `[]` when no Source store is present, since the delta is undefinable without it.
 */
export function previewRepin(
  state: CampaignState,
  sourceStore: SourceStore | undefined,
  source: string,
  candidateVersion: string,
): RepinImpact[] {
  if (!sourceStore) return [];
  const impacts: RepinImpact[] = [];
  for (const ruling of state.rulings.values()) {
    if (ruling.standing !== "active") continue;
    ruling.cites.forEach((cite, citation) => {
      if (cite.source !== source) return;
      const reason = revisionReason(sourceStore, source, cite.version, candidateVersion, cite.ruleId);
      if (!reason) return;
      impacts.push({
        ruling: ruling.id,
        citation,
        source,
        ruleId: cite.ruleId,
        citedVersion: cite.version,
        candidateVersion,
        reason,
      });
    });
  }
  return impacts;
}
