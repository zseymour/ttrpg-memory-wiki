/**
 * The acceptance runner: the S/M/L workload, the interleaved main campaign, the
 * auxiliary campaigns (isolation, export-replay, erasure-matrix), and catalog
 * coverage accounting.
 *
 * Performance is report-only (`workFactor`) except that infeasible requests must
 * be rejected cheaply — that is asserted as a probe, not a timing threshold.
 */

import { Campaign } from "../campaign.ts";
import { reviveExport } from "../core/export.ts";
import { project } from "../projection/project.ts";
import { applyIntake, compileEdit } from "../projection/intake.ts";
import type { CampaignState } from "../core/state.ts";
import type { Lens } from "../recall/contract.ts";
import { FAILURE_CATALOG, type CatalogId } from "./catalog.ts";
import { absentEverywhere, present, recallResult, runProbes, type Probe, type ProbeResult } from "./oracle.ts";
import { FAMILIES } from "./scenarios.ts";
import { World } from "./world.ts";

const EST: Lens = { kind: "establishment" };

export interface WorkloadPoint {
  name: "S" | "M" | "L";
  scale: number;
}

/** Declared parameterized workload: S=50, M=200, L=500 sessions. */
export const WORKLOAD: readonly WorkloadPoint[] = [
  { name: "S", scale: 50 },
  { name: "M", scale: 200 },
  { name: "L", scale: 500 },
];

export interface HarnessReport {
  scale: number;
  results: ProbeResult[];
  /** Report-only work factor: total accepted operations in the main campaign. */
  workFactor: { operations: number };
}

function signature(st: CampaignState): string {
  return [...st.assertions.values()].map((a) => `${a.id}=${a.standing}:${a.effectiveValue}`).join("|");
}

/** Build the interleaved main campaign for a scale and return its probes + world. */
export function buildMain(seed: number, scale: number): { world: World; probes: Probe[] } {
  const world = new World({ seed, scale, campaign: `main-${seed}-${scale}` });
  const probes: Probe[] = [];
  for (const family of FAMILIES) probes.push(...family(world));
  world.noise(1); // trailing adversarial mass past the last plant
  return { world, probes };
}

/** Auxiliary short campaigns for isolation, export/replay, and erasure. */
export function auxiliaryProbes(seed: number): Probe[] {
  return [
    {
      family: "epistemic-separation",
      name: "[aux] two campaigns share no id, fact, or recall surface",
      kills: ["cross-campaign-bleed"],
      check: () => {
        const a = new World({ seed, scale: 5, campaign: `iso-a-${seed}` });
        const av = a.anchor("shared", "Alpha");
        a.establishment(av, "x", "ALPHA-SECRET", { ft: 1 });
        const b = new World({ seed: seed + 1, scale: 5, campaign: `iso-b-${seed}` });
        const bv = b.anchor("shared", "Beta"); // same anchor id string
        b.establishment(bv, "x", "BETA-FACT", { ft: 1 });
        const r = recallResult(b.campaign, [bv], [EST]);
        return a.campaign.id !== b.campaign.id && r !== null && present(r, EST, "x", "BETA-FACT") && absentEverywhere(r, "ALPHA-SECRET");
      },
    },
    {
      family: "evolvability",
      name: "[aux] export/replay reproduces standing and conflicts from operations",
      kills: ["mutable-status-flag"],
      check: () => {
        const w = new World({ seed, scale: 5, campaign: `exp-${seed}` });
        const voss = w.anchor("x-voss", "Voss");
        const a = w.establishment(voss, "name", "typo", { ft: 1 });
        w.correct(w.id(a), "fixed");
        w.contradiction(voss, "fate", "p", 1);
        w.contradiction(voss, "fate", "q", 1);
        const before = signature(w.campaign.state());
        const replayed = Campaign.fromExport(reviveExport(JSON.stringify(w.campaign.exportCampaign())));
        return signature(replayed.state()) === before && replayed.state().conflicts.size === w.campaign.state().conflicts.size;
      },
    },
    {
      family: "evolvability",
      name: "[aux] erasure removes content from record, recall, and replay, tracing descendants",
      kills: ["soft-delete"],
      check: () => {
        const w = new World({ seed, scale: 5, campaign: `erase-${seed}` });
        const voss = w.anchor("z-voss", "Voss");
        const secret = w.establishment(voss, "trauma", "SENSITIVE-XYZ", { ft: 1 });
        // a descendant whose provenance evidence references the secret's assertion id
        const derived = w.establishment(voss, "note", "DERIVED-NOTE", {
          provenance: { introducedBy: "player", evidence: { locator: `derived from ${w.id(secret)}`, excerpt: "e" } },
        });
        w.erase(w.id(secret));
        const exported = JSON.stringify(w.campaign.exportCampaign());
        const r = recallResult(w.campaign, [voss], [EST]);
        const replayed = Campaign.fromExport(reviveExport(exported));
        return (
          !exported.includes("SENSITIVE-XYZ") &&
          r !== null &&
          absentEverywhere(r, "SENSITIVE-XYZ") &&
          w.campaign.state().assertions.get(w.id(derived))!.erased && // descendant traced
          replayed.state().assertions.get(w.id(secret))!.standing === "erased"
        );
      },
    },
    {
      family: "evolvability",
      name: "[aux] safety erasure works through a boundary without restating content",
      kills: ["soft-delete"],
      check: () => {
        const w = new World({ seed, scale: 5, campaign: `safety-${seed}` });
        const voss = w.anchor("s-voss", "Voss");
        const secret = w.establishment(voss, "trauma", "HARMFUL-ABC", { ft: 1 });
        w.safety("sb-1", "captivity", [w.id(secret)]);
        return !JSON.stringify(w.campaign.exportCampaign()).includes("HARMFUL-ABC") && w.campaign.state().assertions.get(w.id(secret))!.erased;
      },
    },
    {
      family: "human-editability",
      name: "[aux] the projected page is not the record until intake is accepted",
      kills: ["projection-as-record"],
      check: () => {
        const w = new World({ seed, scale: 3, campaign: `proj-${seed}` });
        const v = w.anchor("p-voss", "Voss");
        w.establishment(v, "status", "alive");
        const { text, manifest } = project(w.campaign.id, w.campaign.state(), v);
        const edited = text.replace("status: alive", "status: dead");
        compileEdit(manifest, edited); // inspecting the edit must not touch the record
        return w.campaign.state().assertions.get(manifest.fields["status"]!.assertion)!.effectiveValue === "alive";
      },
    },
    {
      family: "human-editability",
      name: "[aux] a formatter pass diverges by bytes but compiles to zero operations",
      kills: ["byte-diff-as-edit"],
      check: () => {
        const w = new World({ seed, scale: 3, campaign: `fmt-${seed}` });
        const v = w.anchor("f-voss", "Voss");
        w.establishment(v, "note", "She keeps a ledger nobody may touch.");
        const { text, manifest } = project(w.campaign.id, w.campaign.state(), v);
        const reflowed = text.replace("She keeps a ledger nobody may touch.", "She keeps a ledger\nnobody    may touch.") + "\n\n";
        const result = compileEdit(manifest, reflowed);
        return result.diverged && result.proposals.length === 0;
      },
    },
    {
      family: "human-editability",
      name: "[aux] an ambiguous deletion is held, never auto-accepted",
      kills: ["auto-accepted-intake"],
      check: () => {
        const w = new World({ seed, scale: 3, campaign: `amb-${seed}` });
        const v = w.anchor("a-voss", "Voss");
        w.establishment(v, "status", "alive");
        const { text, manifest } = project(w.campaign.id, w.campaign.state(), v);
        const edited = text.replace("status: alive\n", "");
        const dispositions = applyIntake(w.campaign, manifest, compileEdit(manifest, edited), "player");
        const held = dispositions.some((d) => d.proposal.kind === "retract-field" && d.outcome === "held");
        return held && w.campaign.state().assertions.get(manifest.fields["status"]!.assertion)!.standing === "active";
      },
    },
  ];
}

/** Run the full harness at one scale: main families + auxiliary campaigns. */
export function runHarness(seed: number, scale: number): HarnessReport {
  const { world, probes } = buildMain(seed, scale);
  const all = [...probes, ...auxiliaryProbes(seed)];
  return { scale, results: runProbes(all), workFactor: { operations: world.head() } };
}

export interface CatalogCoverage {
  killed: CatalogId[];
  pending: CatalogId[];
  /** Catalog entries neither killed by a passing probe nor marked pending. */
  uncovered: CatalogId[];
}

/** Cross-check probe kills against the catalog. Every entry must be killed or pending. */
export function catalogCoverage(results: readonly ProbeResult[]): CatalogCoverage {
  const killed = new Set<CatalogId>();
  for (const r of results) {
    if (!r.passed) continue;
    for (const k of r.kills) killed.add(k);
  }
  const pending: CatalogId[] = [];
  const uncovered: CatalogId[] = [];
  for (const entry of FAILURE_CATALOG) {
    if (killed.has(entry.id)) continue;
    if (entry.pendingSubsystem) pending.push(entry.id);
    else uncovered.push(entry.id);
  }
  return { killed: [...killed], pending, uncovered };
}
