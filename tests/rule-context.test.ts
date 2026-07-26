/**
 * Rule context: citation-driven composition, derived pin reconciliation, and
 * structural ruling conflicts. Each test defends an ADR-0009 acceptance criterion
 * and fails on the plausible shortcut it names. The fake Source store is a fake
 * against a locked interface, never an end-to-end mock: it returns fixed content
 * and fixed declared deltas so composition and reconciliation are reproducible.
 */

import { describe, expect, test } from "bun:test";
import { Campaign, anchorId, campaignId, rulingId } from "../src/index.ts";
import type { AnchorId, RulingId } from "../src/core/ids.ts";
import type { Lens, RecallOutcome, RecallResult, ResolvedRule, SourceStore, VersionRevisions } from "../src/index.ts";
import { establishAnchor, establishRuling, oid } from "./helpers.ts";

const EST: Lens = { kind: "establishment" };

/** A hand-written Source store over fixed content and fixed declared deltas. */
class FakeSourceStore implements SourceStore {
  constructor(
    private readonly rules: Record<string, ResolvedRule>,
    private readonly deltas: Record<string, VersionRevisions>,
  ) {}
  resolve(_source: string, version: string, ruleId?: string): ResolvedRule | null {
    if (ruleId === undefined) return null;
    return this.rules[`${version}#${ruleId}`] ?? null;
  }
  revisions(_source: string, fromVersion: string, toVersion: string): VersionRevisions | null {
    return this.deltas[`${fromVersion}->${toVersion}`] ?? null;
  }
}

let seq = 0;
function campaignWith(store?: SourceStore): Campaign {
  return new Campaign(campaignId(`rc-${++seq}`), "player", undefined, store);
}

function recall(c: Campaign, focal: string[]): RecallResult {
  const out: RecallOutcome = c.recall({
    situation: "portray-entity",
    audience: "player",
    focal: focal.map((f) => anchorId(f) as AnchorId),
    lenses: [EST],
    vantage: { establishmentPos: c.head(), fictionalTime: 10 },
    budget: { total: 50 },
  });
  if (out.kind !== "result") throw new Error(`recall not a result: ${JSON.stringify(out)}`);
  return out.result;
}

describe("citation-driven rule context (freeze what was ingested; pin what composes live)", () => {
  test("store-absent surfaces the frozen excerpt with a provenance gap and null content", () => {
    const c = campaignWith();
    establishAnchor(c, "player", "voss", "Voss");
    establishRuling(c, {
      actor: "player",
      id: "r1",
      scope: "grapple",
      text: "resist",
      cites: [{ source: "SRD", version: "1", ruleId: "grapple", evidence: { locator: "p.42", excerpt: "grapple text" } }],
      anchors: ["voss"],
    });

    const cite = recall(c, ["voss"]).rulings[0]!.cites[0]!;
    // Frozen evidence still composes without a store — honest degradation, no live content.
    expect(cite.excerpt).toBe("grapple text");
    expect(cite.content).toBeNull();
    expect(cite.locator).toBe("p.42");
    expect(cite.citedVersion).toBe("1");
    expect(cite.pinnedVersion).toBeNull();
    expect(cite.provenanceGap).toBe("source store absent");
    expect(cite.reconciliation).toBe("current");
  });

  test("store-present resolves pinned content live, keeps citedVersion frozen, and derives then discharges unreviewed", () => {
    const store = new FakeSourceStore(
      {
        "1#grapple": { content: "v1 grapple", locator: "p.42", metadata: {} },
        "2#grapple": { content: "v2 grapple", locator: "p.44", metadata: {} },
      },
      { "1->2": { predecessor: "1", revised: ["grapple"], removed: [], added: [], continues: {} } },
    );
    const c = campaignWith(store);
    establishAnchor(c, "player", "voss", "Voss");
    establishRuling(c, {
      actor: "player",
      id: "r1",
      scope: "grapple",
      text: "resist",
      cites: [{ source: "SRD", version: "1", ruleId: "grapple", evidence: { locator: "p.42", excerpt: "frozen excerpt" } }],
      anchors: ["voss"],
    });
    c.submit({ kind: "pin-corpus", operationId: oid(), actor: "player", source: "SRD", version: "2", effectiveFrom: null });

    const cite = recall(c, ["voss"]).rulings[0]!.cites[0]!;
    // Content is the reproducible pinned resolve (v2), never an ad-hoc "latest" fetch.
    expect(cite.content).toBe("v2 grapple");
    expect(cite.locator).toBe("p.44");
    expect(cite.pinnedVersion).toBe("2");
    // The cited version and excerpt stay frozen at authorship.
    expect(cite.citedVersion).toBe("1");
    expect(cite.excerpt).toBe("frozen excerpt");
    // The store declares grapple revised between 1 and 2, so the citation is unreviewed.
    expect(cite.reconciliation).toBe("unreviewed");

    // A reconfirm discharges reconciliation and re-freezes the cited version to the pin.
    c.submit({ kind: "reconcile-citation", operationId: oid(), actor: "player", ruling: rulingId("r1"), citation: 0, disposition: "reconfirm" });
    const after = recall(c, ["voss"]).rulings[0]!.cites[0]!;
    expect(after.reconciliation).toBe("reconfirmed");
    expect(after.citedVersion).toBe("2");
  });

  test("rule context is citation-driven: a house rule with no citations pulls no corpus content", () => {
    const store = new FakeSourceStore({ "1#grapple": { content: "must not leak", locator: "p", metadata: {} } }, {});
    const c = campaignWith(store);
    establishAnchor(c, "player", "voss", "Voss");
    establishRuling(c, { actor: "player", id: "r1", scope: "house", text: "house rule", anchors: ["voss"] });

    const r = recall(c, ["voss"]);
    expect(r.rulings).toHaveLength(1);
    // No citations means no free corpus retrieval for the focus.
    expect(r.rulings[0]!.cites).toHaveLength(0);
    expect(r.rulingConflicts).toHaveLength(0);
  });
});

describe("structural ruling conflict (cited identity + anchors, never text similarity or precedence-free selection)", () => {
  const grapple = { source: "SRD", version: "1", ruleId: "grapple", evidence: { locator: "p.42", excerpt: "e" } };

  test("two rulings citing the same identity over overlapping anchors conflict with both members and no side selected", () => {
    const c = campaignWith();
    establishAnchor(c, "player", "voss", "Voss");
    establishRuling(c, { actor: "player", id: "rA", scope: "A", text: "A", cites: [grapple], anchors: ["voss"] });
    establishRuling(c, { actor: "player", id: "rB", scope: "B", text: "B", cites: [grapple], anchors: ["voss"] });

    const r = recall(c, ["voss"]);
    expect(r.rulingConflicts).toHaveLength(1);
    const conflict = r.rulingConflicts[0]!;
    expect(conflict.ruleIdentity).toEqual({ source: "SRD", ruleId: "grapple" });
    expect(conflict.members.map(String).sort()).toEqual([rulingId("rA"), rulingId("rB")].map(String).sort());
    expect(conflict.anchors.map(String)).toContain(anchorId("voss") as unknown as string);
    // No side is dropped or selected — both rulings still surface.
    expect(r.rulings).toHaveLength(2);
  });

  test("a declared precedenceOver resolves the overlap and removes the conflict", () => {
    const c = campaignWith();
    establishAnchor(c, "player", "voss", "Voss");
    establishRuling(c, { actor: "player", id: "rA", scope: "A", text: "A", cites: [grapple], anchors: ["voss"] });
    establishRuling(c, { actor: "player", id: "rB", scope: "B", text: "B", cites: [grapple], anchors: ["voss"], precedenceOver: ["rA"] });

    const r = recall(c, ["voss"]);
    expect(r.rulingConflicts).toHaveLength(0);
    // Both rulings still surface; precedence resolves the conflict, it does not drop a side.
    expect(r.rulings).toHaveLength(2);
  });

  test("identical text but different cited identity does not conflict (structural, never text similarity)", () => {
    const c = campaignWith();
    establishAnchor(c, "player", "voss", "Voss");
    establishRuling(c, { actor: "player", id: "rA", scope: "s", text: "same text", cites: [grapple], anchors: ["voss"] });
    establishRuling(c, {
      actor: "player",
      id: "rB",
      scope: "s",
      text: "same text",
      cites: [{ source: "SRD", version: "1", ruleId: "shove", evidence: { locator: "p.9", excerpt: "e" } }],
      anchors: ["voss"],
    });

    expect(recall(c, ["voss"]).rulingConflicts).toHaveLength(0);
  });

  test("same identity but non-overlapping anchors does not conflict", () => {
    const c = campaignWith();
    establishAnchor(c, "player", "voss", "Voss");
    establishAnchor(c, "player", "kade", "Kade");
    establishRuling(c, { actor: "player", id: "rA", scope: "A", text: "A", cites: [grapple], anchors: ["voss"] });
    establishRuling(c, { actor: "player", id: "rB", scope: "B", text: "B", cites: [grapple], anchors: ["kade"] });

    // Both are applicable only if the focus touches them; recall both anchors.
    const r = recall(c, ["voss", "kade"]);
    expect(r.rulings).toHaveLength(2);
    expect(r.rulingConflicts).toHaveLength(0);
  });
});
