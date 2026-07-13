/**
 * Projection / edit-intake, exercised through real page text and asserted through
 * the write seam: round-trip convergence, formatter zero-ops, projection-as-record,
 * ambiguous-held gating, and stale-basis conflict.
 */

import { describe, expect, test } from "bun:test";
import { operationId } from "../src/index.ts";
import { applyIntake, compileEdit } from "../src/projection/intake.ts";
import { project } from "../src/projection/project.ts";
import { anchor, assertClaim, establishAnchor, newCampaign } from "./helpers.ts";

function scenario() {
  const c = newCampaign("player");
  establishAnchor(c, "player", "voss", "Maera Voss");
  assertClaim(c, { actor: "player", stance: "establishment", subject: "voss", attribute: "status", value: "alive" });
  assertClaim(c, { actor: "player", stance: "establishment", subject: "voss", attribute: "note", value: "Maera runs the harbor office with brisk efficiency." });
  const { text, manifest } = project(c.id, c.state(), anchor("voss"));
  return { c, text, manifest };
}

describe("projection round-trip", () => {
  test("re-projecting an unedited page compiles to zero proposals", () => {
    const { text, manifest } = scenario();
    const result = compileEdit(manifest, text);
    expect(result.diverged).toBe(false);
    expect(result.proposals).toEqual([]);
  });

  test("a formatter pass (reflow + blank lines) compiles to zero proposals", () => {
    const { text, manifest } = scenario();
    // reflow the note and pad blank lines — bytes diverge, semantics do not
    const reflowed = text.replace("Maera runs the harbor office with brisk efficiency.", "Maera runs the harbor\noffice with brisk    efficiency.") + "\n\n";
    const result = compileEdit(manifest, reflowed);
    expect(result.diverged).toBe(true); // byte divergence is a trigger only
    expect(result.proposals).toEqual([]); // ...never semantic evidence
    expect(result.notes.some((n) => n.includes("formatting-only"))).toBe(true);
  });
});

describe("edit intake gating", () => {
  test("the projected page is not the record: editing text changes nothing until intake is accepted", () => {
    const { c, text, manifest } = scenario();
    const edited = text.replace("status: alive", "status: missing");
    // the page string changed, but the authoritative record has not
    expect(c.state().assertions.get(manifest.fields["status"]!.assertion)!.effectiveValue).toBe("alive");
    const result = compileEdit(manifest, edited);
    applyIntake(c, manifest, result, "player");
    // only after accepted intake does the record reflect it, as a correction
    expect(c.state().assertions.get(manifest.fields["status"]!.assertion)!.standing).toBe("corrected");
    const { manifest: after } = project(c.id, c.state(), anchor("voss"));
    expect(after.fields["status"]!.value).toBe("missing");
  });

  test("a mechanical field edit auto-validates; an ambiguous deletion is held", () => {
    const { c, text, manifest } = scenario();
    const noteId = Object.keys(manifest.blocks)[0]!;
    // change a field (mechanical) AND delete the note block (ambiguous)
    let edited = text.replace("status: alive", "status: wounded");
    edited = edited.replace(new RegExp(`<!-- claim:${noteId} -->\\nMaera[^\\n]*\\n`), "");
    const result = compileEdit(manifest, edited);
    const dispositions = applyIntake(c, manifest, result, "player");
    const field = dispositions.find((d) => d.proposal.kind === "correct-field")!;
    const del = dispositions.find((d) => d.proposal.kind === "retract-note")!;
    expect(field.outcome).toBe("accepted"); // mechanical
    expect(del.outcome).toBe("held"); // ambiguous deletion, never auto-accepted
  });

  test("a new untagged paragraph is compiled as an inferred assertion", () => {
    const { c, text, manifest } = scenario();
    const edited = text + "\nA sailor claims she keeps a ledger nobody may touch.\n";
    const result = compileEdit(manifest, edited);
    const proposal = result.proposals.find((p) => p.kind === "assert-note");
    expect(proposal?.confidence).toBe("inferred");
    const dispositions = applyIntake(c, manifest, result, "player");
    expect(dispositions.find((d) => d.proposal.kind === "assert-note")!.outcome).toBe("accepted");
  });
});

describe("stale-basis intake", () => {
  test("an edit against a stale projection surfaces a conflict, never an overwrite", () => {
    const { c, text, manifest } = scenario();
    // a concurrent core-path change lands after the page was projected
    c.submit({ kind: "correct", operationId: operationId("stale-core"), actor: "player", target: manifest.fields["status"]!.assertion, value: "recovering" });
    const edited = text.replace("status: alive", "status: fled");
    const result = compileEdit(manifest, edited);
    const dispositions = applyIntake(c, manifest, result, "player");
    const field = dispositions.find((d) => d.proposal.kind === "correct-field")!;
    expect(field.outcome).toBe("rejected");
    expect(field.reason).toContain("conflict");
    // the stale value never entered the record
    const { manifest: after } = project(c.id, c.state(), anchor("voss"));
    expect(JSON.stringify(after)).not.toContain("fled");
  });
});
