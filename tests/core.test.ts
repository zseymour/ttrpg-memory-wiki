/**
 * Write seam: operation submission. Assert on receipts, establishment order,
 * derived lifecycle standing, and explicit conflicts.
 */

import { describe, expect, test } from "bun:test";
import { assertionIdAt, grantId } from "../src/index.ts";
import { aid, assertClaim, establishAnchor, newCampaign, oid } from "./helpers.ts";

describe("acceptance and receipts", () => {
  test("accepted operations occupy successive establishment-order positions", () => {
    const c = newCampaign();
    const r1 = establishAnchor(c, "player", "npc-voss", "Maera Voss");
    const r2 = assertClaim(c, { actor: "player", stance: "establishment", subject: "npc-voss", attribute: "role", value: "harbormaster" });
    expect(r1.disposition).toBe("accepted");
    expect(r1.pos).toBe(1);
    expect(r2.pos).toBe(2);
    expect(c.head()).toBe(2);
  });

  test("resubmitting an operation id is idempotent — no double commit", () => {
    const c = newCampaign();
    establishAnchor(c, "player", "npc-voss", "Maera Voss");
    const op = { actor: "player", stance: "establishment" as const, subject: "npc-voss", attribute: "role", value: "harbormaster", operationId: "fixed-1" };
    const first = assertClaim(c, op);
    const retry = assertClaim(c, op);
    expect(first.pos).toBe(2);
    expect(retry).toEqual(first);
    expect(c.head()).toBe(2);
  });

  test("a rejected proposal never enters the log", () => {
    const c = newCampaign();
    // assert about an unestablished subject anchor
    const r = assertClaim(c, { actor: "player", stance: "establishment", subject: "ghost", attribute: "role", value: "x" });
    expect(r.disposition).toBe("rejected");
    expect(r.reason).toContain("identity");
    expect(c.head()).toBe(0);
  });
});

describe("authority", () => {
  test("a non-owner without a grant cannot establish", () => {
    const c = newCampaign("player");
    establishAnchor(c, "player", "npc-voss", "Maera Voss");
    const r = assertClaim(c, { actor: "gm", stance: "establishment", subject: "npc-voss", attribute: "role", value: "harbormaster" });
    expect(r.disposition).toBe("rejected");
    expect(r.reason).toContain("authority");
  });

  test("a grant delegates the establish act; revocation is prospective", () => {
    const c = newCampaign("player");
    const g = grantId("grant-gm");
    c.submit({ kind: "grant-authority", operationId: oid(), actor: "player", delegate: g, grantee: "gm", acts: ["establish"] });
    establishAnchor(c, "gm", "npc-voss", "Maera Voss", g);
    const under = assertClaim(c, { actor: "gm", stance: "establishment", subject: "npc-voss", attribute: "role", value: "harbormaster", grant: g });
    expect(under.disposition).toBe("accepted");

    c.submit({ kind: "revoke-authority", operationId: oid(), actor: "player", delegate: g });
    const after = assertClaim(c, { actor: "gm", stance: "establishment", subject: "npc-voss", attribute: "status", value: "alive", grant: g });
    expect(after.disposition).toBe("rejected");
    // The operation validly made under the grant retains its accepted standing.
    expect(c.state().assertions.get(assertionIdAt(3))?.standing).toBe("active");
  });

  test("safety authority is non-delegable — only the owner may set a boundary", () => {
    const c = newCampaign("player");
    const g = grantId("grant-gm");
    c.submit({ kind: "grant-authority", operationId: oid(), actor: "player", delegate: g, grantee: "gm", acts: ["establish", "maintain", "resolve"] });
    const bad = c.submit({ kind: "set-safety-boundary", operationId: oid(), actor: "gm", grant: g, boundary: { id: "b1", topic: "t" } });
    expect(bad.disposition).toBe("rejected");
    const ok = c.submit({ kind: "set-safety-boundary", operationId: oid(), actor: "player", boundary: { id: "b1", topic: "t" } });
    expect(ok.disposition).toBe("accepted");
  });
});

describe("derived lifecycle standing", () => {
  test("retract preserves attribution and flips standing without editing a status field", () => {
    const c = newCampaign();
    establishAnchor(c, "player", "npc-voss", "Maera Voss");
    const a = assertClaim(c, { actor: "player", stance: "establishment", subject: "npc-voss", attribute: "loyalty", value: "Ashen Circle" });
    c.submit({ kind: "retract", operationId: oid(), actor: "player", target: aid(a) });
    const rec = c.state().assertions.get(aid(a))!;
    expect(rec.standing).toBe("retracted");
    expect(rec.actor).toBe("player"); // attribution preserved
  });

  test("correction suppresses the erroneous record and establishes the corrected value", () => {
    const c = newCampaign();
    establishAnchor(c, "player", "npc-voss", "Maera Voss");
    const a = assertClaim(c, { actor: "player", stance: "establishment", subject: "npc-voss", attribute: "name", value: "Mara Vos" });
    const corr = c.submit({ kind: "correct", operationId: oid(), actor: "player", target: aid(a), value: "Maera Voss" });
    const st = c.state();
    expect(st.assertions.get(aid(a))!.standing).toBe("corrected");
    const fixed = st.assertions.get(aid(corr))!;
    expect(fixed.standing).toBe("active");
    expect(fixed.effectiveValue).toBe("Maera Voss");
    expect(fixed.priorValues[0]?.value).toBe("Mara Vos"); // erroneous record stays inspectable
  });

  test("supersession is prospective and preserves the predecessor's prior validity", () => {
    const c = newCampaign();
    establishAnchor(c, "player", "npc-voss", "Maera Voss");
    const a = assertClaim(c, { actor: "player", stance: "establishment", subject: "npc-voss", attribute: "post", value: "harbormaster", fictionalTime: 1 });
    c.submit({ kind: "supersede", operationId: oid(), actor: "player", target: aid(a), value: "exile", effectiveFrom: 10 });
    expect(c.state().assertions.get(aid(a))!.standing).toBe("superseded");
  });
});

describe("continuity conflicts (no last-write-wins)", () => {
  test("two establishments at the same fictional time with different values conflict; both survive", () => {
    const c = newCampaign();
    establishAnchor(c, "player", "npc-voss", "Maera Voss");
    const a = assertClaim(c, { actor: "player", stance: "establishment", subject: "npc-voss", attribute: "fate", value: "dead", fictionalTime: 5 });
    const b = assertClaim(c, { actor: "player", stance: "establishment", subject: "npc-voss", attribute: "fate", value: "alive", fictionalTime: 5 });
    const st = c.state();
    expect(st.conflicts.size).toBe(1);
    // neither assertion was overwritten
    expect(st.assertions.get(aid(a))!.standing).toBe("active");
    expect(st.assertions.get(aid(b))!.standing).toBe("active");
  });

  test("a later fictional time is a state transition, not a conflict", () => {
    const c = newCampaign();
    establishAnchor(c, "player", "npc-voss", "Maera Voss");
    assertClaim(c, { actor: "player", stance: "establishment", subject: "npc-voss", attribute: "post", value: "harbormaster", fictionalTime: 1 });
    assertClaim(c, { actor: "player", stance: "establishment", subject: "npc-voss", attribute: "post", value: "exile", fictionalTime: 20 });
    expect(c.state().conflicts.size).toBe(0);
  });

  test("beliefs never conflict with establishment", () => {
    const c = newCampaign();
    establishAnchor(c, "player", "npc-voss", "Maera Voss");
    establishAnchor(c, "player", "npc-kade", "Ilyen Kade");
    assertClaim(c, { actor: "player", stance: "establishment", subject: "npc-voss", attribute: "fate", value: "alive", fictionalTime: 5 });
    assertClaim(c, { actor: "player", stance: "belief", holder: "npc-kade", subject: "npc-voss", attribute: "fate", value: "dead", fictionalTime: 5 });
    expect(c.state().conflicts.size).toBe(0);
  });

  test("resolve-conflict by correction keeps one side and declares the other erroneous", () => {
    const c = newCampaign();
    establishAnchor(c, "player", "npc-voss", "Maera Voss");
    const a = assertClaim(c, { actor: "player", stance: "establishment", subject: "npc-voss", attribute: "fate", value: "dead", fictionalTime: 5 });
    const b = assertClaim(c, { actor: "player", stance: "establishment", subject: "npc-voss", attribute: "fate", value: "alive", fictionalTime: 5 });
    const conflictId = [...c.state().conflicts.keys()][0]!;
    const res = c.submit({
      kind: "resolve-conflict",
      operationId: oid(),
      actor: "player",
      conflict: conflictId,
      effect: { kind: "correction", keep: aid(b) },
    });
    expect(res.disposition).toBe("accepted");
    const st = c.state();
    expect(st.conflicts.get(conflictId)!.resolvedAt).not.toBeNull();
    expect(st.assertions.get(aid(a))!.standing).toBe("corrected");
    expect(st.assertions.get(aid(b))!.standing).toBe("active");
  });
});
