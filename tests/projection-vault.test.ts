/**
 * On-disk projection surfaces (#21): the campaign materializes to plain Markdown
 * pages and a derived index in the vault. Materialization is deterministic and a
 * pure function of the log — re-materializing is byte-identical, deleting every
 * derived surface and rebuilding converges, and the files are readable with no
 * core running (the mobile-read story).
 */

import { afterAll, describe, expect, test } from "bun:test";
import { cpSync, existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { anchorId, Campaign, operationId, SHIELD } from "../src/index.ts";

const tmps: string[] = [];
function tmpVault(): string {
  const dir = mkdtempSync(join(tmpdir(), "vault-proj-"));
  tmps.push(dir);
  return dir;
}
afterAll(() => {
  for (const dir of tmps) rmSync(dir, { recursive: true, force: true });
});

function seed(c: Campaign) {
  c.submit({ kind: "establish-anchor", operationId: operationId("a"), actor: "player", anchor: anchorId("voss"), label: "Maera Voss", role: "entity" });
  c.submit({ kind: "establish-anchor", operationId: operationId("b"), actor: "player", anchor: anchorId("harbor"), label: "Tidewater Harbor", role: "place" });
  c.submit({ kind: "assert", operationId: operationId("c"), actor: "player", stance: "establishment", proposition: { subject: anchorId("voss"), attribute: "role", value: "harbormaster" }, fictionalTime: 1 });
  c.submit({ kind: "assert", operationId: operationId("d"), actor: "player", stance: "player-awareness", proposition: { subject: anchorId("voss"), attribute: "role", value: "harbormaster" }, fictionalTime: 1 });
  c.submit({ kind: "assert", operationId: operationId("e"), actor: "player", stance: "establishment", proposition: { subject: anchorId("voss"), attribute: "secret", value: "smuggles relics" }, fictionalTime: 1 });
}

describe("on-disk projection surfaces (#21)", () => {
  test("materialize writes one page per anchor plus a derived index", () => {
    const dir = tmpVault();
    const c = Campaign.openVault(dir, "player");
    seed(c);
    const { files } = c.materialize();

    expect(existsSync(join(dir, "pages", "voss.md"))).toBe(true);
    expect(existsSync(join(dir, "pages", "harbor.md"))).toBe(true);
    expect(existsSync(join(dir, "Index.md"))).toBe(true);
    expect(files).toContain("Index.md");

    const index = readFileSync(join(dir, "Index.md"), "utf8");
    expect(index).toContain("## entity");
    expect(index).toContain("## place");
    expect(index).toContain("[Maera Voss](pages/voss.md)");
  });

  test("re-materializing the same state is byte-identical", () => {
    const dir = tmpVault();
    const c = Campaign.openVault(dir, "player");
    seed(c);
    c.materialize();
    const first = readFileSync(join(dir, "pages", "voss.md"), "utf8");
    const firstIndex = readFileSync(join(dir, "Index.md"), "utf8");

    c.materialize();
    expect(readFileSync(join(dir, "pages", "voss.md"), "utf8")).toBe(first);
    expect(readFileSync(join(dir, "Index.md"), "utf8")).toBe(firstIndex);
  });

  test("deleting all pages and the index and rebuilding from the log restores identical content", () => {
    const dir = tmpVault();
    const c = Campaign.openVault(dir, "player");
    seed(c);
    c.materialize();
    const before = new Map<string, string>();
    for (const f of readdirSync(join(dir, "pages"))) before.set(f, readFileSync(join(dir, "pages", f), "utf8"));
    before.set("Index.md", readFileSync(join(dir, "Index.md"), "utf8"));

    rmSync(join(dir, "pages"), { recursive: true, force: true });
    rmSync(join(dir, "Index.md"), { force: true });

    // rebuild from a fresh process (log alone), no in-memory carryover
    Campaign.openVault(dir).materialize();
    for (const [f, content] of before) {
      const path = f === "Index.md" ? join(dir, f) : join(dir, "pages", f);
      expect(readFileSync(path, "utf8")).toBe(content);
    }
  });

  test("unrevealed material is shielded on disk by default; reveal opts in without touching the log", () => {
    const dir = tmpVault();
    const c = Campaign.openVault(dir, "player");
    seed(c);
    const logBefore = readFileSync(join(dir, ".memory", "log.jsonl"), "utf8");

    c.materialize();
    const shielded = readFileSync(join(dir, "pages", "voss.md"), "utf8");
    expect(shielded).toContain("role: harbormaster"); // communicated to the player
    expect(shielded).toContain(`secret: ${SHIELD}`); // never communicated → shielded
    expect(shielded).not.toContain("smuggles relics");

    c.materialize({ reveal: true });
    const revealed = readFileSync(join(dir, "pages", "voss.md"), "utf8");
    expect(revealed).toContain("secret: smuggles relics");

    // reveal is a rendering choice: the authoritative log is unchanged
    expect(readFileSync(join(dir, ".memory", "log.jsonl"), "utf8")).toBe(logBefore);
  });

  test("mobile story: a synced copy is readable with no core", () => {
    const dir = tmpVault();
    const c = Campaign.openVault(dir, "player");
    seed(c);
    c.materialize();

    // simulate a synced device: copy only the readable vault files, no dot-folder, no core
    const synced = tmpVault();
    mkdirSync(join(synced, "pages"), { recursive: true });
    cpSync(join(dir, "pages"), join(synced, "pages"), { recursive: true });
    cpSync(join(dir, "Index.md"), join(synced, "Index.md"));

    // no Campaign instance is constructed against the synced copy; plain file reads suffice
    expect(existsSync(join(synced, ".memory"))).toBe(false);
    const page = readFileSync(join(synced, "pages", "voss.md"), "utf8");
    expect(page).toContain("# Maera Voss");
    expect(page).toContain("role: harbormaster");
    expect(readFileSync(join(synced, "Index.md"), "utf8")).toContain("[Maera Voss](pages/voss.md)");
  });
});
