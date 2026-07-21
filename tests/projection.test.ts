/**
 * Projection / edit-intake, exercised through real page text and asserted through
 * the write seam: round-trip convergence, formatter zero-ops, projection-as-record,
 * ambiguous-held gating, and stale-basis conflict.
 */

import { describe, expect, test } from "bun:test";
import { operationId } from "../src/index.ts";
import { applyIntake, compileEdit } from "../src/projection/intake.ts";
import { project, SHIELD } from "../src/projection/project.ts";
import { aid, anchor, assertClaim, establishAnchor, newCampaign } from "./helpers.ts";

function scenario() {
  const c = newCampaign("player");
  establishAnchor(c, "player", "voss", "Maera Voss");
  assertClaim(c, { actor: "player", stance: "establishment", subject: "voss", attribute: "status", value: "alive" });
  assertClaim(c, { actor: "player", stance: "establishment", subject: "voss", attribute: "note", value: "Maera runs the harbor office with brisk efficiency." });
  const { text, manifest } = project(c.id, c.state(), anchor("voss"), { reveal: true });
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
    const { manifest: after } = project(c.id, c.state(), anchor("voss"), { reveal: true });
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
    // names both positions explicitly: the edit's value and the record's current value
    expect(field.reason).toContain("fled");
    expect(field.reason).toContain("recovering");
    // the stale value never entered the record
    const { manifest: after } = project(c.id, c.state(), anchor("voss"), { reveal: true });
    expect(JSON.stringify(after)).not.toContain("fled");
  });

  test("a stale region conflicts while an independent region in the same batch still lands", () => {
    const { c, text, manifest } = scenario();
    // a concurrent correction bumps only the status field's version
    c.submit({ kind: "correct", operationId: operationId("stale-core-2"), actor: "player", target: manifest.fields["status"]!.assertion, value: "recovering" });
    // one batch edits both the stale field and an independent note block
    let edited = text.replace("status: alive", "status: fled");
    edited = edited.replace("Maera runs the harbor office with brisk efficiency.", "Maera runs the customs house with brisk efficiency.");
    const dispositions = applyIntake(c, manifest, compileEdit(manifest, edited), "player");
    expect(dispositions.find((d) => d.proposal.kind === "correct-field")!.outcome).toBe("rejected");
    // the independent note edit is not held hostage by the field conflict
    const note = dispositions.find((d) => d.proposal.kind === "correct-note")!;
    expect(note.outcome).toBe("accepted");
    const { text: afterText } = project(c.id, c.state(), anchor("voss"), { reveal: true });
    expect(afterText).toContain("customs house");
    expect(afterText).not.toContain("harbor office");
  });
});

describe("rewound resurrection", () => {
  test("re-adding rewound content is a flagged proposal, never a silent re-establishment", () => {
    const c = newCampaign("player");
    establishAnchor(c, "player", "voss", "Maera Voss");
    const note = assertClaim(c, { actor: "player", stance: "establishment", subject: "voss", attribute: "note", value: "Maera secretly commands the harbor guard." });
    // rewind removes it from play: it must not return
    c.submit({ kind: "rewind", operationId: operationId("rw"), actor: "player", target: aid(note) });
    const { text, manifest } = project(c.id, c.state(), anchor("voss"), { reveal: true });
    // the rewound note is gone from the projected page but fingerprinted in the manifest
    expect(text).not.toContain("harbor guard");
    expect(manifest.rewound.length).toBe(1);
    // a player re-types the rewound content as a new paragraph
    const edited = text + "\nMaera secretly commands the harbor guard.\n";
    const result = compileEdit(manifest, edited);
    const proposal = result.proposals.find((p) => p.kind === "assert-note")!;
    expect(proposal.confidence).toBe("ambiguous"); // flagged, not inferred
    const dispositions = applyIntake(c, manifest, result, "player");
    expect(dispositions.find((d) => d.proposal.kind === "assert-note")!.outcome).toBe("held");
    // nothing re-entered active play
    const active = [...c.state().assertions.values()].filter((a) => a.standing === "active" && a.effectiveValue.includes("harbor guard"));
    expect(active).toEqual([]);
  });

  test("correcting a live region back to rewound content is held, never auto-applied", () => {
    const c = newCampaign("player");
    establishAnchor(c, "player", "voss", "Maera Voss");
    const fled = assertClaim(c, { actor: "player", stance: "establishment", subject: "voss", attribute: "status", value: "fled" });
    c.submit({ kind: "rewind", operationId: operationId("rw2"), actor: "player", target: aid(fled) });
    // a fresh, live value fills the vacated slot; the page shows it
    assertClaim(c, { actor: "player", stance: "establishment", subject: "voss", attribute: "status", value: "alive" });
    const { text, manifest } = project(c.id, c.state(), anchor("voss"), { reveal: true });
    // the player edits the live field back to the rewound value
    const edited = text.replace("status: alive", "status: fled");
    const result = compileEdit(manifest, edited);
    const proposal = result.proposals.find((p) => p.kind === "correct-field")!;
    expect(proposal.confidence).toBe("ambiguous"); // a correction to rewound content is not mechanical
    const dispositions = applyIntake(c, manifest, result, "player");
    expect(dispositions.find((d) => d.proposal.kind === "correct-field")!.outcome).toBe("held");
    // the rewound value never returned to active play
    const { manifest: after } = project(c.id, c.state(), anchor("voss"), { reveal: true });
    expect(after.fields["status"]!.value).toBe("alive");
  });

  test("re-adding non-rewound content stays an ordinary inferred assertion", () => {
    const { c, text, manifest } = scenario();
    const edited = text + "\nA sailor claims she keeps a ledger nobody may touch.\n";
    const proposal = compileEdit(manifest, edited).proposals.find((p) => p.kind === "assert-note")!;
    expect(proposal.confidence).toBe("inferred");
  });
});

describe("shielded-region edit leak-safety", () => {
  test("editing a shielded region compiles to no proposal and leaks nothing", () => {
    const c = newCampaign("player");
    establishAnchor(c, "player", "voss", "Maera Voss");
    // established truth never communicated to the player: shielded on the default page
    assertClaim(c, { actor: "player", stance: "establishment", subject: "voss", attribute: "hideout", value: "the Blackreach vault" });
    const { text, manifest } = project(c.id, c.state(), anchor("voss")); // reveal: false
    expect(text).toContain(SHIELD);
    expect(text).not.toContain("Blackreach");
    expect(manifest.shielded.fields).toContain("hideout");
    // the player edits the shield marker itself
    const edited = text.replace(`hideout: ${SHIELD}`, "hideout: somewhere by the docks");
    const result = compileEdit(manifest, edited);
    // nothing is proposed against a region whose content the editor never saw
    expect(result.proposals).toEqual([]);
    // neither the compiled result nor the applied dispositions disclose the content
    expect(JSON.stringify(result)).not.toContain("Blackreach");
    const dispositions = applyIntake(c, manifest, result, "player");
    expect(dispositions).toEqual([]);
    expect(JSON.stringify(dispositions)).not.toContain("Blackreach");
  });
});
