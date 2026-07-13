/**
 * Failure-catalog kill coverage.
 *
 * Each test targets one named entry from the spec's 21-entry catalog and fails
 * if a plausible shortcut implementation (last-write-wins, soft delete, a lens
 * used as a filter tag, context stuffing, …) were used. This tracer bullet kills
 * 8 of 21; the remaining entries are covered as their subsystems land.
 */

import { describe, expect, test } from "bun:test";
import { Campaign, lensKey, operationId, reviveExport } from "../src/index.ts";
import { aid, anchor, assertClaim, establishAnchor, newCampaign } from "./helpers.ts";

describe("failure catalog", () => {
  test("[last-write-wins] a contradicting establishment does not overwrite; it conflicts", () => {
    const c = newCampaign("player");
    establishAnchor(c, "player", "e", "Entity");
    const a = assertClaim(c, { actor: "player", stance: "establishment", subject: "e", attribute: "x", value: "first", fictionalTime: 1 });
    const b = assertClaim(c, { actor: "player", stance: "establishment", subject: "e", attribute: "x", value: "second", fictionalTime: 1 });
    const st = c.state();
    expect(st.conflicts.size).toBe(1);
    expect(st.assertions.get(aid(a))!.effectiveValue).toBe("first"); // not clobbered
    expect(st.assertions.get(aid(b))!.effectiveValue).toBe("second");
  });

  test("[mutable-status-flag] standing is derived; the record stores operations, not statuses", () => {
    const c = newCampaign("player");
    establishAnchor(c, "player", "e", "Entity");
    const a = assertClaim(c, { actor: "player", stance: "establishment", subject: "e", attribute: "x", value: "v" });
    // the authoritative record is operations only — there is no standing field to edit
    const exportedBeforeRetract = JSON.stringify(c.exportCampaign());
    expect(exportedBeforeRetract).not.toContain("standing");
    // changing standing requires an explicit lifecycle operation
    expect(c.state().assertions.get(aid(a))!.standing).toBe("active");
    c.submit({ kind: "retract", operationId: operationId("r"), actor: "player", target: aid(a) });
    expect(c.state().assertions.get(aid(a))!.standing).toBe("retracted");
    // replaying the pre-retract record still derives "active": the log is truth
    const replayed = Campaign.fromExport(reviveExport(exportedBeforeRetract));
    expect(replayed.state().assertions.get(aid(a))!.standing).toBe("active");
  });

  test("[soft-delete] erasure removes content from the exported record, not just a view", () => {
    const c = newCampaign("player");
    establishAnchor(c, "player", "e", "Entity");
    const s = assertClaim(c, { actor: "player", stance: "establishment", subject: "e", attribute: "x", value: "REMOVE-ME" });
    c.submit({ kind: "erase", operationId: operationId("er"), actor: "player", target: aid(s) });
    expect(JSON.stringify(c.exportCampaign())).not.toContain("REMOVE-ME");
  });

  test("[lens-as-filter-tag] a lens is a compartment: excluded material leaks nowhere", () => {
    const c = newCampaign("player");
    establishAnchor(c, "player", "e", "Entity");
    assertClaim(c, { actor: "player", stance: "establishment", subject: "e", attribute: "secret", value: "HIDDEN" });
    assertClaim(c, { actor: "player", stance: "player-awareness", subject: "e", attribute: "public", value: "known" });
    const out = c.recall({ situation: "x", focal: [anchor("e")], lenses: [{ kind: "player-awareness" }], vantage: { establishmentPos: c.head(), fictionalTime: 10 }, budget: { total: 50 } });
    if (out.kind !== "result") throw new Error("expected result");
    expect(JSON.stringify(out.result)).not.toContain("HIDDEN");
  });

  test("[timestamp-as-precedence] fictional-time transitions never conflict; establishment order governs", () => {
    const c = newCampaign("player");
    establishAnchor(c, "player", "e", "Entity");
    // submit the later fictional state FIRST, then the earlier — order of submission must not matter
    assertClaim(c, { actor: "player", stance: "establishment", subject: "e", attribute: "loc", value: "north", fictionalTime: 20 });
    assertClaim(c, { actor: "player", stance: "establishment", subject: "e", attribute: "loc", value: "south", fictionalTime: 5 });
    expect(c.state().conflicts.size).toBe(0); // distinct fictional times => transitions, not a conflict
  });

  test("[context-stuffing] over-budget recall returns a critical prefix with gaps, not a relevance dump", () => {
    const c = newCampaign("player");
    establishAnchor(c, "player", "e", "Entity");
    for (let i = 0; i < 10; i++) {
      assertClaim(c, { actor: "player", stance: "establishment", subject: "e", attribute: `a${i}`, value: `v${i}` });
    }
    const out = c.recall({ situation: "x", focal: [anchor("e")], lenses: [{ kind: "establishment" }], vantage: { establishmentPos: c.head(), fictionalTime: 10 }, budget: { total: 4 } });
    if (out.kind !== "result") throw new Error("expected result");
    expect(out.result.complete).toBe(false);
    expect(out.result.spent).toBeLessThanOrEqual(4);
    expect(out.result.gaps.length).toBeGreaterThan(0);
    expect(out.result.lenses[lensKey({ kind: "establishment" })]!.length).toBeLessThan(10);
  });

  test("[cross-campaign-bleed] two campaigns share no id, fact, or recall surface", () => {
    const a = newCampaign("player");
    establishAnchor(a, "player", "e", "Alpha Secret Entity");
    assertClaim(a, { actor: "player", stance: "establishment", subject: "e", attribute: "x", value: "ALPHA-ONLY" });
    const b = newCampaign("player");
    establishAnchor(b, "player", "e", "Beta Entity"); // same anchor id string
    const out = b.recall({ situation: "x", focal: [anchor("e")], lenses: [{ kind: "establishment" }], vantage: { establishmentPos: b.head(), fictionalTime: 10 }, budget: { total: 50 } });
    if (out.kind !== "result") throw new Error("expected result");
    expect(JSON.stringify(out.result)).not.toContain("ALPHA-ONLY");
    expect(a.id).not.toBe(b.id);
  });

  test("[naive-gap-reporting] a gap never names lens-excluded or erased material", () => {
    const c = newCampaign("player");
    establishAnchor(c, "player", "e", "Entity");
    assertClaim(c, { actor: "player", stance: "establishment", subject: "e", attribute: "secret", value: "LEAK" });
    // request the player lens with a tight budget so gaps are produced
    const out = c.recall({ situation: "x", focal: [anchor("e")], lenses: [{ kind: "player-awareness" }], vantage: { establishmentPos: c.head(), fictionalTime: 10 }, budget: { total: 1 } });
    if (out.kind !== "result") throw new Error("expected result");
    for (const g of out.result.gaps) expect(JSON.stringify(g)).not.toContain("LEAK");
  });
});
