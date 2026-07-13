/**
 * Export/replay seam. Replaying an export into a fresh instance reproduces
 * identity, standing, and conflicts identically; erased content is absent from
 * the exported record entirely (not merely hidden).
 */

import { describe, expect, test } from "bun:test";
import { Campaign, lensKey, operationId, reviveExport } from "../src/index.ts";
import type { CampaignState } from "../src/index.ts";
import { aid, anchor, assertClaim, assertEquivalence, establishAnchor, establishArtifact, establishRuling, newCampaign } from "./helpers.ts";

function standings(st: CampaignState): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [id, a] of st.assertions) out[id] = `${a.standing}:${a.effectiveValue}`;
  return out;
}

function roundTrip(c: Campaign): Campaign {
  return Campaign.fromExport(reviveExport(JSON.stringify(c.exportCampaign())));
}

describe("replay reproduces authoritative meaning", () => {
  test("standing, values, and conflicts survive an export/replay round-trip", () => {
    const c = newCampaign("player");
    establishAnchor(c, "player", "npc-voss", "Maera Voss");
    const a = assertClaim(c, { actor: "player", stance: "establishment", subject: "npc-voss", attribute: "name", value: "Mara Vos" });
    c.submit({ kind: "correct", operationId: operationId("fix"), actor: "player", target: aid(a), value: "Maera Voss" });
    assertClaim(c, { actor: "player", stance: "establishment", subject: "npc-voss", attribute: "fate", value: "dead", fictionalTime: 5 });
    assertClaim(c, { actor: "player", stance: "establishment", subject: "npc-voss", attribute: "fate", value: "alive", fictionalTime: 5 });

    const replayed = roundTrip(c);
    expect(standings(replayed.state())).toEqual(standings(c.state()));
    expect(replayed.state().conflicts.size).toBe(c.state().conflicts.size);
    expect(replayed.head()).toBe(c.head());
  });

  test("the four semantic roles and their relations survive an export/replay round-trip", () => {
    const c = newCampaign("player");
    establishAnchor(c, "player", "envoy", "The Masked Envoy");
    establishAnchor(c, "player", "duke", "Duke Alaric");
    establishAnchor(c, "player", "duel", "The Duel", undefined, "event");
    const prep = aid(assertClaim(c, { actor: "player", stance: "preparation", subject: "envoy", attribute: "plan", value: "will unmask at the duel", fictionalTime: 1 }));
    assertClaim(c, { actor: "player", stance: "establishment", subject: "envoy", attribute: "plan", value: "unmasked", fictionalTime: 5, realizes: prep });
    assertEquivalence(c, { actor: "player", stance: "establishment", a: "envoy", b: "duke", fictionalTime: 6 });
    establishArtifact(c, { actor: "player", id: "thread", kind: "thread", label: "The unmasking", links: [{ role: "entity", target: anchor("envoy") }] });
    establishRuling(c, { actor: "player", id: "r1", scope: "duels", text: "First blood ends the duel.", anchors: [anchor("duel")] });

    const replayed = roundTrip(c);
    const rst = replayed.state();
    expect(rst.anchors.get(anchor("duel"))!.role).toBe("event");
    expect(rst.assertions.get(prep)!.realizedBy).toHaveLength(1);
    expect(rst.artifacts.size).toBe(c.state().artifacts.size);
    expect(rst.rulings.size).toBe(c.state().rulings.size);
    // recall envelope reproduces identity equivalence, artifact, and ruling
    const out = replayed.recall({ situation: "x", focal: [anchor("envoy"), anchor("duel")], lenses: [{ kind: "establishment" }], vantage: { establishmentPos: replayed.head(), fictionalTime: 10 }, budget: { total: 50 } });
    if (out.kind !== "result") throw new Error("expected result");
    expect(out.result.equivalences).toHaveLength(1);
    expect(out.result.artifacts).toHaveLength(1);
    expect(out.result.rulings).toHaveLength(1);
  });
});

describe("erasure removes content from the record itself", () => {
  test("erased content is absent from the exported log and unrecoverable on replay", () => {
    const c = newCampaign("player");
    establishAnchor(c, "player", "npc-voss", "Maera Voss");
    const secret = assertClaim(c, { actor: "player", stance: "establishment", subject: "npc-voss", attribute: "trauma", value: "SENSITIVE-CONTENT", fictionalTime: 1 });
    c.submit({ kind: "erase", operationId: operationId("erase-1"), actor: "player", target: aid(secret) });

    const json = JSON.stringify(c.exportCampaign());
    expect(json).not.toContain("SENSITIVE-CONTENT"); // gone from the authoritative record

    const replayed = roundTrip(c);
    const rec = replayed.state().assertions.get(aid(secret))!;
    expect(rec.standing).toBe("erased"); // continuity tombstone remains
    expect(rec.effectiveValue).toBe(""); // content does not resurface

    const out = replayed.recall({ situation: "x", focal: [anchor("npc-voss")], lenses: [{ kind: "establishment" }], vantage: { establishmentPos: replayed.head(), fictionalTime: 10 }, budget: { total: 50 } });
    if (out.kind !== "result") throw new Error("expected result");
    expect(out.result.lenses[lensKey({ kind: "establishment" })]).toHaveLength(0);
    expect(JSON.stringify(out.result)).not.toContain("SENSITIVE-CONTENT");
  });

  test("safety erasure works through a boundary without restating the content", () => {
    const c = newCampaign("player");
    establishAnchor(c, "player", "npc-voss", "Maera Voss");
    const secret = assertClaim(c, { actor: "player", stance: "establishment", subject: "npc-voss", attribute: "trauma", value: "HARMFUL", fictionalTime: 1 });
    // the player sets a boundary and names the affected assertion — no restatement of content
    const r = c.submit({ kind: "set-safety-boundary", operationId: operationId("sb"), actor: "player", boundary: { id: "b1", topic: "captivity" }, erase: [aid(secret)] });
    expect(r.disposition).toBe("accepted");
    expect(JSON.stringify(c.exportCampaign())).not.toContain("HARMFUL");
    expect(c.state().assertions.get(aid(secret))!.erased).toBe(true);
  });
});
