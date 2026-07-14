/**
 * The predicate oracle: binary must-include / must-exclude predicates over
 * inspectable recall results, plus probe execution.
 *
 * Predicates are binary at every scale. Must-include means present with correct
 * Recall qualification (or an explicit gap); must-exclude means the excluded-
 * everywhere predicate — the string appears in no item, reference, manifest, or
 * gap wording. No recall@k thresholds: losing recall-critical material is never
 * acceptable, so a threshold would concede the wrong thing.
 */

import type { Campaign } from "../campaign.ts";
import type { AnchorId } from "../core/ids.ts";
import { lensKey, type Lens, type RecallResult } from "../recall/contract.ts";
import type { CatalogId } from "./catalog.ts";

export type Family =
  | "continuity"
  | "epistemic-separation"
  | "evolvability"
  | "contradiction-recovery"
  | "human-editability"
  | "bounded-relevant-recall";

export interface Probe {
  family: Family;
  name: string;
  kills: CatalogId[];
  /** Evaluated at final head; closes over the built world and plant handles. */
  check: () => boolean;
}

export interface ProbeResult {
  family: Family;
  name: string;
  passed: boolean;
  kills: CatalogId[];
}

export interface RecallOpts {
  total?: number;
  ft?: number;
  pos?: number;
}

/** Run a recall and return the result, or null if it was rejected/unavailable. */
export function recallResult(c: Campaign, focal: AnchorId[], lenses: Lens[], opts: RecallOpts = {}): RecallResult | null {
  const out = c.recall({
    situation: "probe",
    audience: c.owner,
    focal,
    lenses,
    vantage: { establishmentPos: opts.pos ?? c.head(), fictionalTime: opts.ft ?? 1_000_000 },
    budget: { total: opts.total ?? 5000 },
  });
  return out.kind === "result" ? out.result : null;
}

/** Must-include: an item with the value is present in the lens with correct qualification. */
export function present(result: RecallResult, lens: Lens, attribute: string, value: string): boolean {
  const items = result.lenses[lensKey(lens)] ?? [];
  return items.some(
    (i) =>
      i.qualification.attribute === attribute &&
      i.value === value &&
      i.qualification.lens === lensKey(lens) &&
      i.qualification.standing === "active",
  );
}

/** The excluded-everywhere predicate: `needle` appears in no part of the result. */
export function absentEverywhere(result: RecallResult, needle: string): boolean {
  return !JSON.stringify(result).includes(needle);
}

/**
 * The established value in force at fictional time `ft`: among active establishment
 * items on the slot whose fictional time is at or before `ft`, the one with the
 * greatest fictional time. Submission order is irrelevant — establishment order
 * and fictional time are the only governing orders.
 */
export function currentAtTime(result: RecallResult, lens: Lens, attribute: string, ft: number): string | null {
  const items = (result.lenses[lensKey(lens)] ?? [])
    .filter((i) => i.qualification.attribute === attribute && i.qualification.fictionalTime !== null && i.qualification.fictionalTime <= ft)
    .sort((a, b) => (a.qualification.fictionalTime ?? 0) - (b.qualification.fictionalTime ?? 0));
  return items.length > 0 ? items[items.length - 1]!.value : null;
}

export function runProbes(probes: readonly Probe[]): ProbeResult[] {
  return probes.map((p) => {
    let passed: boolean;
    try {
      passed = p.check();
    } catch {
      passed = false;
    }
    return { family: p.family, name: p.name, passed, kills: p.kills };
  });
}
