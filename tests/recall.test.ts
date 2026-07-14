/**
 * Recall seam: plan + assemble. Assert must-include (present with correct Recall
 * qualification or explicit gap), must-exclude (the excluded-everywhere predicate),
 * and standing/gap well-formedness.
 */

import { describe, expect, test } from "bun:test";
import { assemble, grantId, lensKey, operationId, plan, type Lens, type RecallRequest } from "../src/index.ts";
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
  return { situation: "portray-entity", audience: c.owner, focal: [anchor("npc-voss")], lenses, vantage: { establishmentPos: c.head(), fictionalTime }, budget: { total } };
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
    const out = c.recall({ situation: "x", audience: c.owner, focal: [anchor("npc-voss")], lenses: [{ kind: "establishment" }], vantage: { establishmentPos: 999, fictionalTime: 0 }, budget: { total: 50 } });
    expect(out.kind).toBe("unavailable");
  });

  test("recall is pinned to its snapshot; later operations do not leak in", () => {
    const c = scenario();
    const pinnedHead = c.head();
    // a later establishment
    assertClaim(c, { actor: "player", stance: "establishment", subject: "npc-voss", attribute: "fate", value: "exiled", fictionalTime: 5 });
    const out = c.recall({ situation: "x", audience: c.owner, focal: [anchor("npc-voss")], lenses: [{ kind: "establishment" }], vantage: { establishmentPos: pinnedHead, fictionalTime: 10 }, budget: { total: 50 } });
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

  test("assemble rejects a plan that references a lens outside its request", () => {
    const c = scenario();
    const req = request(c, [{ kind: "establishment" }]);
    const p = plan(req);
    const tampered = { ...p, paths: [...p.paths, { focal: anchor("npc-voss"), lens: { kind: "player-awareness" } as Lens, required: true, purpose: "x" }] };
    const out = assemble(tampered, c.state());
    expect(out.kind).toBe("rejected");
    if (out.kind === "rejected") expect(out.reason).toContain("invalid plan");
  });
});

describe("lens authority gating", () => {
  // portray governs the perspective lenses (player-awareness, belief, suspicion, entity-awareness);
  // establish governs the establishment lens. A delegate holds only what its grant names.
  function grantPortray(c: Campaign, grantee: string): void {
    c.submit({ kind: "grant-authority", operationId: operationId(`grant-${grantee}`), actor: c.owner, delegate: grantId(`g-${grantee}`), grantee, acts: ["portray"] });
  }
  function req(c: Campaign, audience: string, lenses: Lens[]): RecallRequest {
    return { situation: "gate", audience, focal: [anchor("npc-voss")], lenses, vantage: { establishmentPos: c.head(), fictionalTime: 10 }, budget: { total: 50 } };
  }

  test("the owner holds root authority over every lens", () => {
    const c = scenario();
    const out = c.recall(req(c, c.owner, [{ kind: "establishment" }, { kind: "player-awareness" }, { kind: "entity-belief", holder: anchor("npc-kade") }]));
    expect(out.kind).toBe("result");
  });

  test("a delegate may request a lens its grant authorizes", () => {
    const c = scenario();
    grantPortray(c, "envoy");
    const out = c.recall(req(c, "envoy", [{ kind: "entity-belief", holder: anchor("npc-kade") }]));
    expect(out.kind).toBe("result");
  });

  test("requesting a lens outside the audience's authority is rejected as invalid, never served empty", () => {
    const c = scenario();
    grantPortray(c, "envoy"); // portray does not govern the establishment lens
    const out = c.recall(req(c, "envoy", [{ kind: "establishment" }]));
    expect(out.kind).toBe("rejected");
    if (out.kind !== "rejected") return;
    expect(out.reason).toContain("establishment");
    expect(out.reason).toContain("envoy");
  });

  test("an ungranted audience cannot request any lens", () => {
    const c = scenario();
    const out = c.recall(req(c, "stranger", [{ kind: "entity-belief", holder: anchor("npc-kade") }]));
    expect(out.kind).toBe("rejected");
  });

  test("one inadmissible lens rejects the whole batch, even alongside admissible ones", () => {
    const c = scenario();
    grantPortray(c, "envoy");
    const out = c.recall(req(c, "envoy", [{ kind: "player-awareness" }, { kind: "establishment" }]));
    expect(out.kind).toBe("rejected");
  });

  test("a revoked grant withdraws lens admissibility", () => {
    const c = scenario();
    const g = grantId("g-envoy");
    c.submit({ kind: "grant-authority", operationId: operationId("grant"), actor: c.owner, delegate: g, grantee: "envoy", acts: ["portray"] });
    expect(c.recall(req(c, "envoy", [{ kind: "player-awareness" }])).kind).toBe("result");
    c.submit({ kind: "revoke-authority", operationId: operationId("revoke"), actor: c.owner, delegate: g });
    expect(c.recall(req(c, "envoy", [{ kind: "player-awareness" }])).kind).toBe("rejected");
  });

  test("current authority gates the request even when the vantage pins a pre-revocation snapshot", () => {
    const c = scenario();
    const g = grantId("g-envoy");
    c.submit({ kind: "grant-authority", operationId: operationId("grant"), actor: c.owner, delegate: g, grantee: "envoy", acts: ["portray"] });
    const pinned = c.head(); // snapshot where the grant is still active
    expect(c.recall(req(c, "envoy", [{ kind: "player-awareness" }])).kind).toBe("result");
    c.submit({ kind: "revoke-authority", operationId: operationId("revoke"), actor: c.owner, delegate: g });
    // pinning the old vantage must not resurrect access: authorization is present-time
    const out = c.recall({ situation: "gate", audience: "envoy", focal: [anchor("npc-voss")], lenses: [{ kind: "player-awareness" }], vantage: { establishmentPos: pinned, fictionalTime: 10 }, budget: { total: 50 } });
    expect(out.kind).toBe("rejected");
  });
});
