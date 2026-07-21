/**
 * Safety boundaries and Erasure (#26): erasure is destructive across the support
 * graph, in-flight recall, and the durable on-disk vault. Disclosures go with the
 * erased material; independently supported material survives with a visible
 * Provenance gap; a concurrent erasure or tightened boundary invalidates an
 * in-flight recall before disclosure; and an erasure converges across a synced
 * vault copy through ordinary file reads.
 */

import { afterAll, describe, expect, test } from "bun:test";
import { cpSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Campaign, lensKey, operationId, reviveExport, type Lens, type RecallRequest } from "../src/index.ts";
import { aid, anchor, assertClaim, establishAnchor, newCampaign } from "./helpers.ts";

const EST: Lens = { kind: "establishment" };

function requestFor(c: Campaign, focal: string): RecallRequest {
  return { situation: "probe", audience: c.owner, focal: [anchor(focal)], lenses: [EST], vantage: { establishmentPos: c.head(), fictionalTime: 1000 }, budget: { total: 100 } };
}

describe("erasure traces the claim-scoped provenance support graph", () => {
  test("disclosures are erased; independently supported material survives with a visible provenance gap", () => {
    const c = newCampaign("player");
    establishAnchor(c, "player", "voss", "Maera Voss");
    const secret = assertClaim(c, { actor: "player", stance: "establishment", subject: "voss", attribute: "trauma", value: "SECRET-CONTENT", fictionalTime: 1 });
    const disclosure = assertClaim(c, {
      actor: "player", stance: "establishment", subject: "voss", attribute: "note", value: "DISCLOSES-SECRET", fictionalTime: 1,
      provenance: { introducedBy: "player", support: [{ source: aid(secret), relation: "disclosure" }] },
    });
    const independent = assertClaim(c, {
      actor: "player", stance: "establishment", subject: "voss", attribute: "demeanor", value: "guarded at the docks", fictionalTime: 1,
      provenance: { introducedBy: "player", evidence: { locator: "obs-1", excerpt: "seen" }, support: [{ source: aid(secret), relation: "independent" }] },
    });

    c.submit({ kind: "erase", operationId: operationId("erase"), actor: "player", target: aid(secret) });

    const st = c.state();
    expect(st.assertions.get(aid(secret))!.standing).toBe("erased");
    expect(st.assertions.get(aid(disclosure))!.erased).toBe(true); // disclosure went with the secret

    const survivor = st.assertions.get(aid(independent))!;
    expect(survivor.erased).toBe(false);
    expect(survivor.standing).toBe("active");
    expect(survivor.effectiveValue).toBe("guarded at the docks");
    expect(survivor.provenance.gap).toBeDefined(); // visible provenance gap where the erased support was
    expect(survivor.provenance.support ?? []).not.toContainEqual({ source: aid(secret), relation: "independent" });

    const out = c.recall(requestFor(c, "voss"));
    if (out.kind !== "result") throw new Error("expected result");
    const items = out.result.lenses[lensKey(EST)]!;
    expect(JSON.stringify(out.result)).not.toContain("SECRET-CONTENT");
    expect(JSON.stringify(out.result)).not.toContain("DISCLOSES-SECRET");
    const demeanor = items.find((i) => i.qualification.attribute === "demeanor")!;
    expect(demeanor.value).toBe("guarded at the docks");
    expect(demeanor.qualification.provenance).toContain("gap"); // the gap is visible in recall qualification
  });

  test("an erasure in one campaign leaves a vocabulary-overlapping sibling untouched", () => {
    const a = newCampaign("player");
    establishAnchor(a, "player", "voss", "Maera Voss");
    const aSecret = assertClaim(a, { actor: "player", stance: "establishment", subject: "voss", attribute: "trauma", value: "SHARED-VOCAB", fictionalTime: 1 });

    const b = newCampaign("player");
    establishAnchor(b, "player", "voss", "Maera Voss"); // same anchor id and label
    assertClaim(b, { actor: "player", stance: "establishment", subject: "voss", attribute: "trauma", value: "SHARED-VOCAB", fictionalTime: 1 });

    a.submit({ kind: "erase", operationId: operationId("erase"), actor: "player", target: aid(aSecret) });

    expect(JSON.stringify(a.exportCampaign())).not.toContain("SHARED-VOCAB"); // gone here
    expect(JSON.stringify(b.exportCampaign())).toContain("SHARED-VOCAB"); // untouched there
  });
});

describe("in-flight recall invalidation is a present-time safety override", () => {
  test("a concurrent erasure between plan validation and disclosure invalidates before any disclosure", () => {
    const c = newCampaign("player");
    establishAnchor(c, "player", "voss", "Maera Voss");
    const secret = assertClaim(c, { actor: "player", stance: "establishment", subject: "voss", attribute: "trauma", value: "IN-FLIGHT", fictionalTime: 1 });

    const prepared = c.prepareRecall(requestFor(c, "voss"));
    if (prepared.kind !== "prepared") throw new Error("expected prepared");

    // control: with no intervening operation the same prepared recall discloses the secret
    const before = c.disclose(prepared);
    expect(before.kind).toBe("result");
    if (before.kind === "result") expect(JSON.stringify(before.result)).toContain("IN-FLIGHT");

    // a concurrent erasure lands, then disclosure of the already-validated plan is refused
    c.submit({ kind: "erase", operationId: operationId("erase"), actor: "player", target: aid(secret) });
    const after = c.disclose(prepared);
    expect(after.kind).toBe("invalidated");
    expect(JSON.stringify(after)).not.toContain("IN-FLIGHT"); // nothing disclosed
  });

  test("a concurrent tightened safety boundary likewise invalidates an in-flight recall", () => {
    const c = newCampaign("player");
    establishAnchor(c, "player", "voss", "Maera Voss");
    assertClaim(c, { actor: "player", stance: "establishment", subject: "voss", attribute: "role", value: "harbormaster", fictionalTime: 1 });

    const prepared = c.prepareRecall(requestFor(c, "voss"));
    if (prepared.kind !== "prepared") throw new Error("expected prepared");
    c.submit({ kind: "set-safety-boundary", operationId: operationId("sb"), actor: "player", boundary: { id: "b1", topic: "captivity" } });
    expect(c.disclose(prepared).kind).toBe("invalidated");
  });
});

describe("erasure converges across a synced vault copy through ordinary file reads", () => {
  const tmps: string[] = [];
  const tmpVault = (prefix: string): string => {
    const dir = mkdtempSync(join(tmpdir(), prefix));
    tmps.push(dir);
    return dir;
  };
  afterAll(() => {
    for (const dir of tmps) rmSync(dir, { recursive: true, force: true });
  });

  test("erasure compacts the on-disk log, re-projects pages, and a synced copy replays clean", () => {
    const dir = tmpVault("vault-erase-");
    const c = Campaign.openVault(dir, "player");
    establishAnchor(c, "player", "voss", "Maera Voss");
    const secret = assertClaim(c, { actor: "player", stance: "establishment", subject: "voss", attribute: "trauma", value: "LOG-SECRET", fictionalTime: 1 });
    // a revealed disclosure that surfaces on the page, so re-projection must purge it
    const disclosure = assertClaim(c, {
      actor: "player", stance: "establishment", subject: "voss", attribute: "note", value: "REVEALED-DISCLOSURE", fictionalTime: 1,
      provenance: { introducedBy: "player", support: [{ source: aid(secret), relation: "disclosure" }] },
    });
    // an independent observation that must survive re-projection
    assertClaim(c, {
      actor: "player", stance: "establishment", subject: "voss", attribute: "sighting", value: "seen at the wharf", fictionalTime: 1,
      provenance: { introducedBy: "player", support: [{ source: aid(secret), relation: "independent" }] },
    });
    c.materialize({ reveal: true });

    const logPath = join(dir, ".memory", "log.jsonl");
    expect(readFileSync(logPath, "utf8")).toContain("LOG-SECRET"); // present before erasure

    c.submit({ kind: "erase", operationId: operationId("erase"), actor: "player", target: aid(secret) });

    // durable log compacted in place
    const log = readFileSync(logPath, "utf8");
    expect(log).not.toContain("LOG-SECRET");
    expect(log).not.toContain("REVEALED-DISCLOSURE");
    // pages re-projected: erased/disclosing content purged, independent observation kept
    const page = readFileSync(join(dir, "pages", "voss.md"), "utf8");
    expect(page).not.toContain("LOG-SECRET");
    expect(page).not.toContain("REVEALED-DISCLOSURE");
    expect(page).toContain("seen at the wharf");

    // simulate ordinary file sync: copy the whole vault folder to a second device
    const synced = tmpVault("vault-synced-");
    cpSync(dir, synced, { recursive: true });

    // the synced copy replays clean with no core-side memory of the erased content
    const replayed = Campaign.openVault(synced, "player");
    expect(JSON.stringify(replayed.exportCampaign())).not.toContain("LOG-SECRET");
    expect(JSON.stringify(replayed.exportCampaign())).not.toContain("REVEALED-DISCLOSURE");
    // state convergence, not just content absence: the erased target and its disclosure
    // descendant replay from the compacted log as erased tombstones, not active blanks
    expect(replayed.state().assertions.get(aid(secret))!.standing).toBe("erased");
    expect(replayed.state().assertions.get(aid(disclosure))!.erased).toBe(true);
    const out = replayed.recall(requestFor(replayed, "voss"));
    if (out.kind === "result") expect(JSON.stringify(out.result)).not.toContain("LOG-SECRET");
    // the readable pages on the synced copy also carry no erased content
    expect(readFileSync(join(synced, "pages", "voss.md"), "utf8")).not.toContain("LOG-SECRET");
    expect(readFileSync(join(synced, "Index.md"), "utf8")).not.toContain("LOG-SECRET");
  });

  test("a reopened vault re-projects pages on erasure even without an in-session materialize", () => {
    const dir = tmpVault("vault-reopen-");
    const first = Campaign.openVault(dir, "player");
    establishAnchor(first, "player", "voss", "Maera Voss");
    const secret = assertClaim(first, { actor: "player", stance: "establishment", subject: "voss", attribute: "trauma", value: "REOPEN-SECRET", fictionalTime: 1 });
    first.materialize({ reveal: true });
    expect(readFileSync(join(dir, "pages", "voss.md"), "utf8")).toContain("REOPEN-SECRET");

    // a fresh session reopens the same vault: pages already exist, so an erasure must re-project them
    const reopened = Campaign.openVault(dir, "player");
    reopened.submit({ kind: "erase", operationId: operationId("erase-reopen"), actor: "player", target: aid(secret) });

    expect(readFileSync(join(dir, ".memory", "log.jsonl"), "utf8")).not.toContain("REOPEN-SECRET");
    expect(readFileSync(join(dir, "pages", "voss.md"), "utf8")).not.toContain("REOPEN-SECRET");
  });
});
