/**
 * The in-memory Source store: resolve is a pure, reproducible lookup, and
 * revisions composes the corpus-declared per-version deltas transitively along
 * the predecessor chain (chained renames collapse, intermediate revisions
 * surface, add-then-remove nets out). Unknown keys and unconnected version
 * pairs are `null`, never errors.
 */

import { describe, expect, test } from "bun:test";
import { InMemorySourceStore, type SourceFixture } from "../src/sources/memory.ts";

/**
 * A three-version synthetic corpus exercising every composition rule:
 *   v1: grapple, shove, restrain, feint
 *   v2: grapple revised; shove -> push (rename); feint removed; parry added
 *   v3: push -> bull-rush (chained rename); restrain revised; parry removed
 *       (add-then-remove); disarm added
 */
const FIXTURE: SourceFixture = {
  "synthetic-corpus": {
    v1: {
      predecessor: null,
      title: "Core Rules",
      tag: "SRD-1.0",
      metadata: { edition: "1" },
      rules: {
        grapple: { content: "grab a foe", locator: "p.10", metadata: { school: "athletics" } },
        shove: { content: "push a foe", locator: "p.11" },
        restrain: { content: "hold a foe", locator: "p.12" },
        feint: { content: "fake a strike", locator: "p.13" },
      },
    },
    v2: {
      predecessor: "v1",
      title: "Core Rules",
      tag: "SRD-1.1",
      metadata: { edition: "1" },
      rules: {
        grapple: { content: "grab and hold a foe", locator: "p.10" },
        push: { content: "push a foe", locator: "p.11" },
        restrain: { content: "hold a foe", locator: "p.12" },
        parry: { content: "deflect a strike", locator: "p.14" },
      },
      revised: ["grapple"],
      removed: ["feint"],
      added: ["parry"],
      continues: { push: "shove" },
    },
    v3: {
      predecessor: "v2",
      title: "Core Rules",
      tag: "SRD-2.0",
      metadata: { edition: "2" },
      rules: {
        grapple: { content: "grab and hold a foe", locator: "p.10" },
        "bull-rush": { content: "charge a foe", locator: "p.11" },
        restrain: { content: "pin a foe", locator: "p.12" },
        disarm: { content: "knock loose a weapon", locator: "p.15" },
      },
      revised: ["restrain"],
      removed: ["parry"],
      added: ["disarm"],
      continues: { "bull-rush": "push" },
    },
  },
};

function store(): InMemorySourceStore {
  return new InMemorySourceStore(FIXTURE);
}

describe("resolve", () => {
  test("a rule resolves to identical content across repeated calls", () => {
    const s = store();
    const a = s.resolve("synthetic-corpus", "v1", "grapple");
    const b = s.resolve("synthetic-corpus", "v1", "grapple");
    expect(a).toEqual({ content: "grab a foe", locator: "p.10", metadata: { school: "athletics" } });
    expect(a).toEqual(b);
    // distinct objects (defensive copies), never the same mutable reference
    expect(a).not.toBe(b);
  });

  test("mutating a resolved result never affects a later lookup", () => {
    const s = store();
    const first = s.resolve("synthetic-corpus", "v1", "grapple");
    first!.metadata.school = "tampered";
    const second = s.resolve("synthetic-corpus", "v1", "grapple");
    expect(second!.metadata.school).toBe("athletics");
  });

  test("a rule without declared metadata resolves with an empty metadata map", () => {
    const s = store();
    expect(s.resolve("synthetic-corpus", "v1", "shove")).toEqual({ content: "push a foe", locator: "p.11", metadata: {} });
  });

  test("a bare (ruleId-less) resolve returns version-level info", () => {
    const s = store();
    expect(s.resolve("synthetic-corpus", "v1")).toEqual({ content: "Core Rules", locator: "SRD-1.0", metadata: { edition: "1" } });
  });

  test("the version key is the default locator when no tag is declared", () => {
    const s = new InMemorySourceStore({ "c": { v1: { predecessor: null, rules: {} } } });
    expect(s.resolve("c", "v1")).toEqual({ content: "", locator: "v1", metadata: {} });
  });

  test("unknown source, version, or ruleId resolves to null", () => {
    const s = store();
    expect(s.resolve("nope", "v1", "grapple")).toBeNull();
    expect(s.resolve("synthetic-corpus", "v9", "grapple")).toBeNull();
    expect(s.resolve("synthetic-corpus", "v1", "nope")).toBeNull();
  });
});

describe("revisions", () => {
  test("an adjacent step echoes its declared delta with predecessor = from", () => {
    const s = store();
    expect(s.revisions("synthetic-corpus", "v1", "v2")).toEqual({
      predecessor: "v1",
      revised: ["grapple"],
      removed: ["feint"],
      added: ["parry"],
      continues: { push: "shove" },
    });
  });

  test("deltas compose transitively across three versions", () => {
    const s = store();
    const d = s.revisions("synthetic-corpus", "v1", "v3")!;
    expect(d.predecessor).toBe("v1");
    // chained rename shove -> push -> bull-rush collapses to a single entry keyed by the v1 id
    expect(d.continues).toEqual({ "bull-rush": "shove" });
    // grapple revised in v2, restrain revised in v3: both surface once, keyed by v1 id
    expect(d.revised).toEqual(["grapple", "restrain"]);
    // feint removed in v2 survives; parry (added v2, removed v3) nets out
    expect(d.removed).toEqual(["feint"]);
    // only disarm (added v3, surviving) remains added; parry does not
    expect(d.added).toEqual(["disarm"]);
  });

  test("a rule revised in an intermediate version surfaces even if untouched later", () => {
    const s = store();
    // grapple is revised in v2 and untouched in v3, yet must appear in a v1->v3 delta
    expect(s.revisions("synthetic-corpus", "v1", "v3")!.revised).toContain("grapple");
  });

  test("a from==to query yields an empty delta", () => {
    const s = store();
    expect(s.revisions("synthetic-corpus", "v2", "v2")).toEqual({ predecessor: "v2", revised: [], removed: [], added: [], continues: {} });
  });

  test("a non-ancestor version pair returns null", () => {
    const s = store();
    // v3 is a descendant of v1, not an ancestor: no declared chain from v3 back to v1's future
    expect(s.revisions("synthetic-corpus", "v3", "v1")).toBeNull();
    expect(s.revisions("synthetic-corpus", "v2", "v1")).toBeNull();
  });

  test("unknown source or version returns null", () => {
    const s = store();
    expect(s.revisions("nope", "v1", "v3")).toBeNull();
    expect(s.revisions("synthetic-corpus", "v0", "v3")).toBeNull();
    expect(s.revisions("synthetic-corpus", "v1", "v9")).toBeNull();
  });
});
