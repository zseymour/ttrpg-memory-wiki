/**
 * The full semantic envelope: the four memory-item roles and the epistemic
 * relations layered on them. Each test defends an acceptance criterion from the
 * originating issue and fails on the plausible shortcut it names.
 */

import { describe, expect, test } from "bun:test";
import { IDENTITY_EQUIVALENCE, operationId, type Lens, type RecallOutcome, type RecallResult } from "../src/index.ts";
import {
  aid,
  anchor,
  artifact,
  assertClaim,
  assertEquivalence,
  establishAnchor,
  establishArtifact,
  establishRuling,
  linkArtifact,
  newCampaign,
  ruling,
} from "./helpers.ts";
import type { Campaign } from "../src/index.ts";

const EST: Lens = { kind: "establishment" };

function recall(c: Campaign, focal: string[], lenses: Lens[], extra: Partial<{ ft: number; total: number; expectations: { anchor: string; attribute: string }[] }> = {}): RecallResult {
  const out: RecallOutcome = c.recall({
    situation: "test",
    audience: c.owner,
    focal: focal.map(anchor),
    lenses,
    vantage: { establishmentPos: c.head(), fictionalTime: extra.ft ?? 1000 },
    budget: { total: extra.total ?? 500 },
    expectations: extra.expectations?.map((e) => ({ anchor: anchor(e.anchor), attribute: e.attribute })),
  });
  if (out.kind !== "result") throw new Error(`recall not a result: ${JSON.stringify(out)}`);
  return out.result;
}

describe("identity equivalence (records are never merged)", () => {
  test("an established equivalence preserves both anchors and their histories", () => {
    const c = newCampaign("player");
    establishAnchor(c, "player", "masked", "The Masked Envoy");
    establishAnchor(c, "player", "duke", "Duke Alaric");
    assertClaim(c, { actor: "player", stance: "establishment", subject: "masked", attribute: "seen", value: "at the winter ball", fictionalTime: 1 });
    assertClaim(c, { actor: "player", stance: "establishment", subject: "duke", attribute: "office", value: "warden of the north", fictionalTime: 1 });
    assertEquivalence(c, { actor: "player", stance: "establishment", a: "masked", b: "duke", fictionalTime: 2 });

    const st = c.state();
    // Both anchors survive; neither record is collapsed into the other.
    expect(st.anchors.has(anchor("masked"))).toBe(true);
    expect(st.anchors.has(anchor("duke"))).toBe(true);
    // Each anchor keeps its own history, addressable independently.
    const bySubject = (subj: string) => [...st.assertions.values()].filter((a) => a.proposition.subject === anchor(subj) && a.proposition.attribute !== IDENTITY_EQUIVALENCE);
    expect(bySubject("masked").map((a) => a.effectiveValue)).toEqual(["at the winter ball"]);
    expect(bySubject("duke").map((a) => a.effectiveValue)).toEqual(["warden of the north"]);

    // Recall surfaces the equivalence for either anchor, carrying both identities.
    const rMasked = recall(c, ["masked"], [EST]);
    expect(rMasked.equivalences).toHaveLength(1);
    expect(rMasked.equivalences[0]!.identities).toEqual(["The Masked Envoy", "Duke Alaric"]);
    expect(rMasked.equivalences[0]!.qualification.standing).toBe("active");
    // Symmetric: recall on the other anchor surfaces the same equivalence.
    expect(recall(c, ["duke"], [EST]).equivalences).toHaveLength(1);
    // The equivalence never leaks into the plain establishment item bucket.
    expect(rMasked.lenses["establishment"]!.some((i) => i.qualification.attribute === IDENTITY_EQUIVALENCE)).toBe(false);
  });

  test("a belief of equivalence is a perspective and never resolves identity", () => {
    const c = newCampaign("player");
    establishAnchor(c, "player", "stranger", "The Stranger");
    establishAnchor(c, "player", "smith", "Old Smith");
    establishAnchor(c, "player", "kade", "Kade");
    assertEquivalence(c, { actor: "player", stance: "belief", holder: "kade", a: "stranger", b: "smith", fictionalTime: 1 });

    // The belief appears only under Kade's belief lens, never as established identity.
    const est = recall(c, ["stranger"], [EST]);
    expect(est.equivalences).toHaveLength(0);
    const believed = recall(c, ["stranger"], [{ kind: "entity-belief", holder: anchor("kade") }]);
    expect(believed.equivalences).toHaveLength(1);
    expect(believed.equivalences[0]!.qualification.stance).toBe("belief");
    // Records stay distinct: both anchors remain, unmerged.
    expect(c.state().anchors.size).toBe(3);
  });

  test("equivalence requires two distinct, established anchors", () => {
    const c = newCampaign("player");
    establishAnchor(c, "player", "a", "A");
    const self = assertEquivalence(c, { actor: "player", stance: "establishment", a: "a", b: "a" });
    expect(self.disposition).toBe("rejected");
    const ghost = assertEquivalence(c, { actor: "player", stance: "establishment", a: "a", b: "ghost" });
    expect(ghost.disposition).toBe("rejected");
  });
});

describe("event anchor (existence establishes no occurrence)", () => {
  test("creating an event anchor establishes nothing; occurrence and participants are separate assertions", () => {
    const c = newCampaign("player");
    establishAnchor(c, "player", "duel", "The Duel at Dawn", undefined, "event");
    establishAnchor(c, "player", "voss", "Voss");
    expect(c.state().anchors.get(anchor("duel"))!.role).toBe("event");

    // The bare event anchor yields no established occurrence.
    expect(recall(c, ["duel"], [EST]).lenses["establishment"]).toHaveLength(0);

    // Occurrence and a participant are separate, independently qualified assertions.
    assertClaim(c, { actor: "player", stance: "establishment", subject: "duel", attribute: "occurrence", value: "took place", fictionalTime: 5 });
    assertClaim(c, { actor: "player", stance: "establishment", subject: "duel", attribute: "participant", value: "Voss", fictionalTime: 5 });
    const r = recall(c, ["duel"], [EST]);
    const attrs = r.lenses["establishment"]!.map((i) => i.qualification.attribute).sort();
    expect(attrs).toEqual(["occurrence", "participant"]);
  });
});

describe("preparation realizes into a separately authorized establishment", () => {
  test("realization links back to the preparation; unused detail stays provisional", () => {
    const c = newCampaign("player");
    establishAnchor(c, "player", "cult", "The Ashen Circle");
    const prep = aid(assertClaim(c, { actor: "player", stance: "preparation", subject: "cult", attribute: "motive", value: "seeks the drowned crown; led by a spurned heir; meets at the old lighthouse", fictionalTime: 1 }));
    const unused = aid(assertClaim(c, { actor: "player", stance: "preparation", subject: "cult", attribute: "backup-hook", value: "a traitor in the guard", fictionalTime: 1 }));

    // Play realizes only the narrow part that occurred, as its own establishment.
    const realized = assertClaim(c, { actor: "player", stance: "establishment", subject: "cult", attribute: "motive", value: "seeks the drowned crown", fictionalTime: 5, realizes: prep });
    expect(realized.disposition).toBe("accepted");

    const st = c.state();
    // Preparation is untouched and still provisional; unused detail likewise.
    expect(st.assertions.get(prep)!.stance).toBe("preparation");
    expect(st.assertions.get(prep)!.standing).toBe("active");
    expect(st.assertions.get(prep)!.realizedBy).toEqual([aid(realized)]);
    expect(st.assertions.get(unused)!.stance).toBe("preparation");

    // The establishment is linked back and excluded-from-preparation lens hygiene holds.
    const r = recall(c, ["cult"], [EST]);
    const item = r.lenses["establishment"]!.find((i) => i.qualification.attribute === "motive");
    expect(item!.value).toBe("seeks the drowned crown");
    expect(item!.qualification.realizes).toBe(prep);
    // Preparation never appears as established truth.
    expect(JSON.stringify(r.lenses["establishment"])).not.toContain("old lighthouse");
    expect(JSON.stringify(r.lenses["establishment"])).not.toContain("a traitor in the guard");
  });

  test("only an establishment may realize, and only a preparation is realizable", () => {
    const c = newCampaign("player");
    establishAnchor(c, "player", "e", "E");
    const est = aid(assertClaim(c, { actor: "player", stance: "establishment", subject: "e", attribute: "x", value: "v", fictionalTime: 1 }));
    // realizing a non-preparation target is rejected
    const badTarget = assertClaim(c, { actor: "player", stance: "establishment", subject: "e", attribute: "y", value: "w", realizes: est });
    expect(badTarget.disposition).toBe("rejected");
    // a non-establishment stance may not realize
    const prep = aid(assertClaim(c, { actor: "player", stance: "preparation", subject: "e", attribute: "z", value: "p" }));
    const badStance = assertClaim(c, { actor: "player", stance: "belief", holder: "e", subject: "e", attribute: "z", value: "p", realizes: prep });
    expect(badStance.disposition).toBe("rejected");
  });
});

describe("structured artifact (organizes without conferring truth)", () => {
  test("a thread links related material and is recalled without asserting its links true", () => {
    const c = newCampaign("player");
    establishAnchor(c, "player", "voss", "Voss");
    const susp = aid(assertClaim(c, { actor: "player", stance: "suspicion", holder: "voss", subject: "voss", attribute: "fate", value: "may be a traitor", fictionalTime: 1 }));
    establishArtifact(c, { actor: "player", id: "thread-1", kind: "thread", label: "Who betrayed the harbor?", links: [{ role: "entity", target: anchor("voss") }, { role: "assertion", target: susp }] });
    linkArtifact(c, { actor: "player", id: "thread-1", link: { role: "question", target: anchor("voss") } });

    const r = recall(c, ["voss"], [EST]);
    expect(r.artifacts).toHaveLength(1);
    expect(r.artifacts[0]!.kind).toBe("thread");
    expect(r.artifacts[0]!.links).toHaveLength(3);
    // The artifact carries its own compact provenance (envelope parity).
    expect(r.artifacts[0]!.provenance).toBe("player");
    // Linking a suspicion into a thread does not make it established truth.
    expect(r.lenses["establishment"]).toHaveLength(0);

    // Retraction withdraws the artifact from recall without editing a status field.
    c.submit({ kind: "retract", operationId: operationId("rt-1"), actor: "player", target: artifact("thread-1") });
    expect(c.state().artifacts.get(artifact("thread-1"))!.standing).toBe("retracted");
    expect(recall(c, ["voss"], [EST]).artifacts).toHaveLength(0);
  });

  test("structured-artifact creation requires the organize act when delegated", () => {
    const c = newCampaign("player");
    establishAnchor(c, "player", "voss", "Voss");
    const noGrant = c.submit({ kind: "establish-artifact", operationId: operationId("a-1"), actor: "gm", artifact: artifact("t"), artifactKind: "thread", label: "L" });
    expect(noGrant.disposition).toBe("rejected");
  });
});

describe("normative item (campaign ruling, distinct from fictional truth)", () => {
  test("a ruling is surfaced as rule context, never as established fiction", () => {
    const c = newCampaign("player");
    establishAnchor(c, "player", "voss", "Voss");
    establishRuling(c, { actor: "player", id: "ruling-1", scope: "grappling Voss", text: "Voss always resists the first grapple with advantage.", ruleRef: "SRD:grapple", anchors: ["voss"] });

    const r = recall(c, ["voss"], [EST]);
    expect(r.rulings).toHaveLength(1);
    expect(r.rulings[0]!.scope).toBe("grappling Voss");
    expect(r.rulings[0]!.ruleRef).toBe("SRD:grapple");
    // The ruling text is not established fictional truth.
    expect(r.lenses["establishment"]).toHaveLength(0);
  });

  test("a ruling requires non-empty scope and text", () => {
    const c = newCampaign("player");
    const empty = c.submit({ kind: "establish-ruling", operationId: operationId("r-1"), actor: "player", ruling: ruling("x"), scope: "", text: "" });
    expect(empty.disposition).toBe("rejected");
  });
});

describe("unrecorded (absence is never false)", () => {
  test("an expectation with no assertion recalls as Unrecorded, not as a value", () => {
    const c = newCampaign("player");
    establishAnchor(c, "player", "voss", "Voss");
    assertClaim(c, { actor: "player", stance: "establishment", subject: "voss", attribute: "post", value: "harbormaster", fictionalTime: 1 });

    const r = recall(c, ["voss"], [EST], { expectations: [{ anchor: "voss", attribute: "alive" }, { anchor: "voss", attribute: "post" }] });
    // "alive" is unrecorded; "post" is recorded so it is not reported unrecorded.
    expect(r.unrecorded).toHaveLength(1);
    expect(r.unrecorded[0]!.attribute).toBe("alive");
    expect(r.unrecorded[0]!.uncertainty.kind).toBe("unrecorded");
    expect(r.unrecorded.some((u) => u.attribute === "post")).toBe(false);
    // Unrecorded is not surfaced as a false or empty value in the lens bucket.
    expect(r.lenses["establishment"]!.some((i) => i.qualification.attribute === "alive")).toBe(false);
  });

  test("an expectation on an unestablished anchor is an unresolved selector gap, not Unrecorded", () => {
    const c = newCampaign("player");
    establishAnchor(c, "player", "voss", "Voss");
    const r = recall(c, ["voss"], [EST], { expectations: [{ anchor: "ghost", attribute: "alive" }] });
    // A never-established anchor cannot be answered Unrecorded — it is a selector gap.
    expect(r.unrecorded).toHaveLength(0);
    expect(r.gaps.some((g) => g.requirement === "recall-selector" && g.scope.includes("ghost"))).toBe(true);
    expect(r.complete).toBe(false);
  });
});
