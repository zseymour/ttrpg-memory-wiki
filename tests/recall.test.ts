/**
 * Recall seam: plan + assemble. Assert must-include (present with correct Recall
 * qualification or explicit gap), must-exclude (the excluded-everywhere predicate),
 * and standing/gap well-formedness.
 */

import { describe, expect, test } from "bun:test";
import { lensKey, operationId, type Lens, type RecallRequest } from "../src/index.ts";
import { anchor, assertClaim, establishAnchor, newCampaign } from "./helpers.ts";
import type { Campaign } from "../src/index.ts";

const SECRET = "Ashen Circle";

/** A campaign where Voss's true loyalty is unrevealed, her role is player-known. */
function scenario(): Campaign {
  const c = newCampaign("player");
  establishAnchor(c, "player", "npc-voss", "Maera Voss");
  establishAnchor(c, "player", "npc-kade", "Ilyen Kade");
  // established truth, never communicated to the player
  assertClaim(c, { actor: "player", stance: "establishment", subject: "npc-voss", attribute: "loyalty", value: SECRET, fictionalTime: 1 });
  assertClaim(c, { actor: "player", stance: "establishment", subject: "npc-voss", attribute: "debt", value: "owes Kade", fictionalTime: 1 });
  // what the player has been told
  assertClaim(c, { actor: "player", stance: "player-awareness", subject: "npc-voss", attribute: "role", value: "harbormaster", fictionalTime: 1 });
  // what Kade believes (wrong)
  assertClaim(c, { actor: "player", stance: "belief", holder: "npc-kade", subject: "npc-voss", attribute: "loyalty", value: "loyal to the crown", fictionalTime: 1 });
  return c;
}

function request(c: Campaign, lenses: Lens[], total = 50, fictionalTime = 10): RecallRequest {
  return { situation: "portray-entity", focal: [anchor("npc-voss")], lenses, vantage: { establishmentPos: c.head(), fictionalTime }, budget: { total } };
}

describe("recall qualification and lenses", () => {
  test("the establishment lens returns established truth with correct qualification", () => {
    const c = scenario();
    const out = c.recall(request(c, [{ kind: "establishment" }]));
    expect(out.kind).toBe("result");
    if (out.kind !== "result") return;
    const items = out.result.lenses[lensKey({ kind: "establishment" })]!;
    const loyalty = items.find((i) => i.qualification.attribute === "loyalty")!;
    expect(loyalty.value).toBe(SECRET);
    expect(loyalty.qualification.stance).toBe("establishment");
    expect(loyalty.qualification.standing).toBe("active");
    expect(loyalty.qualification.temporalMatch).toBe("definitely-applicable"); // ft 1 <= focus 10
  });

  test("epistemic separation: the belief lens reports belief, never established truth", () => {
    const c = scenario();
    const lens: Lens = { kind: "entity-belief", holder: anchor("npc-kade") };
    const out = c.recall(request(c, [lens]));
    if (out.kind !== "result") throw new Error("expected result");
    const items = out.result.lenses[lensKey(lens)]!;
    expect(items).toHaveLength(1);
    expect(items[0]!.value).toBe("loyal to the crown");
    expect(items[0]!.qualification.stance).toBe("belief");
  });

  test("unrevealed established material is excluded everywhere from the player lens", () => {
    const c = scenario();
    const out = c.recall(request(c, [{ kind: "player-awareness" }]));
    if (out.kind !== "result") throw new Error("expected result");
    const items = out.result.lenses[lensKey({ kind: "player-awareness" })]!;
    // present: what the player was told
    expect(items.map((i) => i.value)).toEqual(["harbormaster"]);
    // the excluded-everywhere predicate: the secret appears in NO part of the result
    expect(JSON.stringify(out.result)).not.toContain(SECRET);
  });

  test("temporal match is three-valued and never guesses missing precision", () => {
    const c = newCampaign("player");
    establishAnchor(c, "player", "npc-voss", "Maera Voss");
    assertClaim(c, { actor: "player", stance: "establishment", subject: "npc-voss", attribute: "a", value: "past", fictionalTime: 1 });
    assertClaim(c, { actor: "player", stance: "establishment", subject: "npc-voss", attribute: "b", value: "future", fictionalTime: 99 });
    assertClaim(c, { actor: "player", stance: "establishment", subject: "npc-voss", attribute: "c", value: "undated", fictionalTime: null });
    const out = c.recall(request(c, [{ kind: "establishment" }], 50, 10));
    if (out.kind !== "result") throw new Error("expected result");
    const byAttr = Object.fromEntries(out.result.lenses[lensKey({ kind: "establishment" })]!.map((i) => [i.qualification.attribute, i.qualification.temporalMatch]));
    expect(byAttr["a"]).toBe("definitely-applicable");
    expect(byAttr["b"]).toBe("definitely-outside");
    expect(byAttr["c"]).toBe("possibly-applicable");
  });
});

describe("budget and completeness", () => {
  test("an over-budget request returns a critical-first prefix, a gap, and incomplete standing", () => {
    const c = scenario();
    // budget covers focal identity (1) + one item, forcing task-material overflow
    const out = c.recall(request(c, [{ kind: "establishment" }], 2));
    if (out.kind !== "result") throw new Error("expected result");
    expect(out.result.complete).toBe(false);
    expect(out.result.gaps.some((g) => g.requirement === "task-material")).toBe(true);
    expect(out.result.lenses["establishment"]).toHaveLength(1); // critical prefix, not all task material
    expect(out.result.spent).toBeLessThanOrEqual(2);
  });

  test("an infeasible mandatory reserve is rejected without assembly", () => {
    const c = scenario();
    const out = c.recall(request(c, [{ kind: "establishment" }], 0));
    expect(out.kind).toBe("rejected");
  });

  test("a safety boundary is always represented before task material", () => {
    const c = scenario();
    c.submit({ kind: "set-safety-boundary", operationId: operationId("sb"), actor: "player", boundary: { id: "b1", topic: "captivity" } });
    const out = c.recall(request(c, [{ kind: "establishment" }], 2));
    if (out.kind !== "result") throw new Error("expected result");
    expect(out.result.safety.map((s) => s.id)).toContain("b1");
  });
});

describe("outcomes and vantage", () => {
  test("an unresolvable snapshot is unavailable, not a gap", () => {
    const c = scenario();
    const out = c.recall({ situation: "x", focal: [anchor("npc-voss")], lenses: [{ kind: "establishment" }], vantage: { establishmentPos: 999, fictionalTime: 0 }, budget: { total: 50 } });
    expect(out.kind).toBe("unavailable");
  });

  test("recall is pinned to its snapshot; later operations do not leak in", () => {
    const c = scenario();
    const pinnedHead = c.head();
    // a later establishment
    assertClaim(c, { actor: "player", stance: "establishment", subject: "npc-voss", attribute: "fate", value: "exiled", fictionalTime: 5 });
    const out = c.recall({ situation: "x", focal: [anchor("npc-voss")], lenses: [{ kind: "establishment" }], vantage: { establishmentPos: pinnedHead, fictionalTime: 10 }, budget: { total: 50 } });
    if (out.kind !== "result") throw new Error("expected result");
    expect(JSON.stringify(out.result)).not.toContain("exiled");
  });

  test("an unresolved continuity conflict touching the focus is surfaced", () => {
    const c = newCampaign("player");
    establishAnchor(c, "player", "npc-voss", "Maera Voss");
    assertClaim(c, { actor: "player", stance: "establishment", subject: "npc-voss", attribute: "fate", value: "dead", fictionalTime: 5 });
    assertClaim(c, { actor: "player", stance: "establishment", subject: "npc-voss", attribute: "fate", value: "alive", fictionalTime: 5 });
    const out = c.recall(request(c, [{ kind: "establishment" }], 50));
    if (out.kind !== "result") throw new Error("expected result");
    expect(out.result.conflicts).toHaveLength(1);
  });
});
