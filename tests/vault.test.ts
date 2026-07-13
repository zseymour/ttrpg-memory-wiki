/**
 * Walking-skeleton durability (#14): the on-disk dot-folder log is the durable
 * record. A fresh process opening the same vault recalls identically, and two
 * vaults are fully isolated.
 */

import { afterAll, describe, expect, test } from "bun:test";
import { existsSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { anchorId, Campaign, lensKey, operationId, type Lens } from "../src/index.ts";

const tmps: string[] = [];
function tmpVault(): string {
  const dir = mkdtempSync(join(tmpdir(), "campaign-"));
  tmps.push(dir);
  return dir;
}
afterAll(() => {
  for (const dir of tmps) rmSync(dir, { recursive: true, force: true });
});

const EST: Lens = { kind: "establishment" };

function seed(c: Campaign) {
  c.submit({ kind: "establish-anchor", operationId: operationId("a"), actor: "player", anchor: anchorId("voss"), label: "Maera Voss" });
  c.submit({ kind: "assert", operationId: operationId("b"), actor: "player", stance: "establishment", proposition: { subject: anchorId("voss"), attribute: "role", value: "harbormaster" }, fictionalTime: 1 });
}

function recallRole(c: Campaign): string | undefined {
  const out = c.recall({ situation: "probe", focal: [anchorId("voss")], lenses: [EST], vantage: { establishmentPos: c.head(), fictionalTime: 100 }, budget: { total: 50 } });
  if (out.kind !== "result") return undefined;
  return out.result.lenses[lensKey(EST)]!.find((i) => i.qualification.attribute === "role")?.value;
}

describe("durable vault (#14)", () => {
  test("creating a campaign creates a dot-prefixed log folder", () => {
    const dir = tmpVault();
    const c = Campaign.openVault(dir, "player");
    seed(c);
    expect(existsSync(join(dir, ".memory", "log.jsonl"))).toBe(true);
    expect(existsSync(join(dir, ".memory", "campaign.json"))).toBe(true);
  });

  test("recall returns the establishment with identity, standing, and vantage", () => {
    const c = Campaign.openVault(tmpVault(), "player");
    seed(c);
    const out = c.recall({ situation: "probe", focal: [anchorId("voss")], lenses: [EST], vantage: { establishmentPos: c.head(), fictionalTime: 100 }, budget: { total: 50 } });
    if (out.kind !== "result") throw new Error("expected result");
    const item = out.result.lenses[lensKey(EST)]!.find((i) => i.qualification.attribute === "role")!;
    expect(item.value).toBe("harbormaster");
    expect(item.qualification.identity).toBe("Maera Voss");
    expect(item.qualification.standing).toBe("active");
    expect(out.result.vantage.establishmentPos).toBe(c.head());
  });

  test("restarting the process and recalling returns the same result", () => {
    const dir = tmpVault();
    const first = Campaign.openVault(dir, "player");
    seed(first);
    const headBefore = first.head();

    // a fresh Campaign over the same vault simulates a process restart
    const reopened = Campaign.openVault(dir);
    expect(reopened.head()).toBe(headBefore);
    expect(reopened.owner).toBe("player");
    expect(recallRole(reopened)).toBe("harbormaster");
  });

  test("two vaults are fully isolated", () => {
    const a = Campaign.openVault(tmpVault(), "player");
    a.submit({ kind: "establish-anchor", operationId: operationId("a1"), actor: "player", anchor: anchorId("voss"), label: "Alpha Voss" });
    a.submit({ kind: "assert", operationId: operationId("a2"), actor: "player", stance: "establishment", proposition: { subject: anchorId("voss"), attribute: "role", value: "ALPHA-ROLE" }, fictionalTime: 1 });
    const b = Campaign.openVault(tmpVault(), "player");
    b.submit({ kind: "establish-anchor", operationId: operationId("b1"), actor: "player", anchor: anchorId("voss"), label: "Beta Voss" });
    const out = b.recall({ situation: "probe", focal: [anchorId("voss")], lenses: [EST], vantage: { establishmentPos: b.head(), fictionalTime: 100 }, budget: { total: 50 } });
    if (out.kind !== "result") throw new Error("expected result");
    expect(JSON.stringify(out.result)).not.toContain("ALPHA-ROLE");
    expect(a.id).not.toBe(b.id);
  });
});
