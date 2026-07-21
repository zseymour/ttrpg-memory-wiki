/**
 * Projection surfaces (#21): standing distinctions and shielding as pure rendering
 * choices. Established truth, preparation, and belief render as distinct regions
 * rather than one flat prose fact; unrevealed material is shielded by default and
 * revealed only on opt-in, without any change to the authoritative record.
 */

import { describe, expect, test } from "bun:test";
import { compileEdit, project, SHIELD } from "../src/index.ts";
import { anchor, assertClaim, establishAnchor, newCampaign } from "./helpers.ts";

function world() {
  const c = newCampaign("player");
  establishAnchor(c, "player", "voss", "Maera Voss");
  establishAnchor(c, "player", "harlan", "Deckhand Harlan");
  // established truth about Voss
  assertClaim(c, { actor: "player", stance: "establishment", subject: "voss", attribute: "role", value: "harbormaster" });
  assertClaim(c, { actor: "player", stance: "establishment", subject: "voss", attribute: "secret", value: "she smuggles relics" });
  // preparation (provisional, not truth)
  assertClaim(c, { actor: "player", stance: "preparation", subject: "voss", attribute: "note", value: "may betray the party in act three" });
  // a belief a fictional entity holds about Voss
  assertClaim(c, { actor: "player", stance: "belief", subject: "voss", attribute: "role", value: "honest official", holder: "harlan" });
  return c;
}

describe("shielding (#21)", () => {
  test("unrevealed established truth is shielded by default; the record is untouched", () => {
    const c = world();
    const { text, manifest } = project(c.id, c.state(), anchor("voss"));
    // no player-awareness was asserted, so both fields render shielded
    expect(text).toContain(`role: ${SHIELD}`);
    expect(text).toContain(`secret: ${SHIELD}`);
    expect(text).not.toContain("harbormaster");
    expect(text).not.toContain("she smuggles relics");
    expect(manifest.shielded.fields).toEqual(expect.arrayContaining(["role", "secret"]));
    // the record still holds the true values
    const rec = [...c.state().assertions.values()].find(
      (a) => a.stance === "establishment" && a.proposition.attribute === "role" && a.proposition.subject === anchor("voss"),
    )!;
    expect(rec.effectiveValue).toBe("harbormaster");
  });

  test("opting in reveals content without changing the record", () => {
    const c = world();
    const before = JSON.stringify(c.exportCampaign());
    const revealed = project(c.id, c.state(), anchor("voss"), { reveal: true });
    expect(revealed.text).toContain("role: harbormaster");
    expect(revealed.text).toContain("secret: she smuggles relics");
    expect(revealed.manifest.shielded.fields).toEqual([]);
    // reveal is a rendering choice: nothing in the record moved
    expect(JSON.stringify(c.exportCampaign())).toBe(before);
  });

  test("a proposition communicated to the player renders unshielded by default", () => {
    const c = world();
    assertClaim(c, { actor: "player", stance: "player-awareness", subject: "voss", attribute: "role", value: "harbormaster" });
    const { text, manifest } = project(c.id, c.state(), anchor("voss"));
    expect(text).toContain("role: harbormaster"); // revealed to the player
    expect(text).toContain(`secret: ${SHIELD}`); // never communicated → still shielded
    expect(manifest.shielded.fields).toEqual(["secret"]);
  });

  test("editing a shielded field is ignored, not compiled into an overwrite", () => {
    const c = world();
    const { text, manifest } = project(c.id, c.state(), anchor("voss"));
    const edited = text.replace(`role: ${SHIELD}`, "role: deckhand");
    const result = compileEdit(manifest, edited);
    expect(result.proposals.find((p) => p.kind === "correct-field")).toBeUndefined();
    expect(result.notes.some((n) => n.includes("shielded"))).toBe(true);
  });

  test("uncommunicated perspectival content is shielded on the default page, not leaked", () => {
    const c = world();
    // an entity is aware of the secret, but it was never communicated to the player
    assertClaim(c, { actor: "player", stance: "entity-awareness", subject: "voss", attribute: "secret", value: "she smuggles relics", holder: "harlan" });
    const { text } = project(c.id, c.state(), anchor("voss"));
    expect(text).toContain("## Awareness");
    expect(text).not.toContain("she smuggles relics"); // shielded, even via the awareness section
    // revealing shows it
    expect(project(c.id, c.state(), anchor("voss"), { reveal: true }).text).toContain("she smuggles relics");
  });
});

describe("standing distinctions (#21)", () => {
  test("preparation and belief render as distinct sections, never flattened into established truth", () => {
    const c = world();
    const { text } = project(c.id, c.state(), anchor("voss"), { reveal: true });
    expect(text).toContain("## Preparation");
    expect(text).toContain("may betray the party in act three");
    expect(text).toContain("## Beliefs");
    expect(text).toContain("### Deckhand Harlan");
    expect(text).toContain("role: honest official");
    // the belief is separated from the established role by its own heading — not merged
    const beliefIdx = text.indexOf("## Beliefs");
    const establishedIdx = text.indexOf("# Maera Voss");
    expect(establishedIdx).toBeLessThan(beliefIdx);
  });

  test("re-projecting the same state is byte-identical", () => {
    const c = world();
    const a = project(c.id, c.state(), anchor("voss"));
    const b = project(c.id, c.state(), anchor("voss"));
    expect(a.text).toBe(b.text);
    expect(a.manifest.sha).toBe(b.manifest.sha);
    // and the revealed rendering is likewise deterministic
    expect(project(c.id, c.state(), anchor("voss"), { reveal: true }).text).toBe(
      project(c.id, c.state(), anchor("voss"), { reveal: true }).text,
    );
  });
});
