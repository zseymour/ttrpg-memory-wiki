/**
 * Acceptance harness driver: every probe must pass at every scale point, results
 * must be deterministic for a fixed seed, and every failure-catalog entry must be
 * killed by a probe or explicitly pending a named subsystem.
 */

import { describe, expect, test } from "bun:test";
import { FAILURE_CATALOG, type CatalogId } from "../src/harness/catalog.ts";
import { catalogCoverage, runHarness, WORKLOAD } from "../src/harness/run.ts";

const SEED = 0xc0ffee;

/** The catalog entries this slice's subsystems (core + recall + export) can kill. */
const EXPECTED_KILLS: CatalogId[] = [
  "last-write-wins",
  "similarity-only-recall",
  "lens-as-filter-tag",
  "mutable-status-flag",
  "timestamp-as-precedence",
  "soft-delete",
  "naive-gap-reporting",
  "windowed-reconciliation",
  "over-detection",
  "context-stuffing",
  "cross-campaign-bleed",
  "projection-as-record",
  "byte-diff-as-edit",
  "auto-accepted-intake",
  "merge-on-alias",
];

describe("acceptance harness", () => {
  for (const point of WORKLOAD) {
    test(`all probes pass at scale ${point.name} (${point.scale})`, () => {
      const report = runHarness(SEED, point.scale);
      const failed = report.results.filter((r) => !r.passed).map((r) => r.name);
      expect(failed).toEqual([]);
      expect(report.results.length).toBeGreaterThan(35);
    });
  }

  test("results are deterministic for a fixed seed", () => {
    const a = runHarness(SEED, 50).results.map((r) => `${r.name}:${r.passed}`);
    const b = runHarness(SEED, 50).results.map((r) => `${r.name}:${r.passed}`);
    expect(a).toEqual(b);
  });

  test("every failure-catalog entry is killed or explicitly pending a subsystem", () => {
    const cov = catalogCoverage(runHarness(SEED, 50).results);
    expect(cov.uncovered).toEqual([]);
    expect(cov.killed.length + cov.pending.length).toBe(FAILURE_CATALOG.length);
    for (const id of EXPECTED_KILLS) expect(cov.killed).toContain(id);
  });

  test("work factor grows with scale (report-only diagnostic)", () => {
    const small = runHarness(SEED, 50).workFactor.operations;
    const large = runHarness(SEED, 500).workFactor.operations;
    expect(large).toBeGreaterThan(small);
  });
});
