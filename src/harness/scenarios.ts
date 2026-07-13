/**
 * The hand-authored scenario skeleton: six families of plant→probe pairs.
 *
 * Each family plants distinctive material, interleaves scaled adversarial noise to
 * put declared establishment-order distance between plant and probe, and returns
 * binary probes evaluated at final head. The same seed and skeleton produce the
 * same campaign and the same expected results at every scale.
 *
 * Values are distinctive strings so must-exclude probes can assert the excluded-
 * everywhere predicate by substring.
 */

import { anchorId, grantId, operationId, type AnchorId } from "../core/ids.ts";
import type { Lens } from "../recall/contract.ts";
import { absentEverywhere, currentAtTime, present, recallResult, type Family, type Probe } from "./oracle.ts";
import type { CatalogId } from "./catalog.ts";
import type { World } from "./world.ts";

const EST: Lens = { kind: "establishment" };
const PLAYER: Lens = { kind: "player-awareness" };
const belief = (h: AnchorId): Lens => ({ kind: "entity-belief", holder: h });
const suspicion = (h: AnchorId): Lens => ({ kind: "entity-suspicion", holder: h });
const awareness = (h: AnchorId): Lens => ({ kind: "entity-awareness", holder: h });

function probe(family: Family, name: string, kills: CatalogId[], check: () => boolean): Probe {
  return { family, name, kills, check };
}

export function continuity(w: World): Probe[] {
  const voss = w.anchor("c-voss", "Maera Voss");
  const commit = w.establishment(voss, "commitment", "return the ledger by midwinter", { ft: 1 });
  w.noise(2);
  w.establishment(voss, "post", "harbormaster", { ft: 1 });
  w.noise(2);
  // later fictional time submitted here; an *earlier* fictional state is submitted AFTER it
  w.establishment(voss, "post", "exiled", { ft: 500 });
  w.noise(2);
  w.establishment(voss, "post", "apprentice", { ft: -100 }); // earlier ft, later submission
  const rank = w.establishment(voss, "rank", "guildmember", { ft: 1 });
  w.supersede(w.id(rank), "guildmaster", 300);
  w.noise(2);

  return [
    probe("continuity", "commitment survives across establishment-order distance", ["windowed-reconciliation"], () => {
      const r = recallResult(w.campaign, [voss], [EST]);
      return r !== null && present(r, EST, "commitment", "return the ledger by midwinter");
    }),
    probe("continuity", "earlier fictional state applies before the transition", ["timestamp-as-precedence"], () => {
      const r = recallResult(w.campaign, [voss], [EST], { ft: 10 });
      return r !== null && currentAtTime(r, EST, "post", 10) === "harbormaster";
    }),
    probe("continuity", "later fictional state applies after the transition", [], () => {
      const r = recallResult(w.campaign, [voss], [EST], { ft: 600 });
      return r !== null && currentAtTime(r, EST, "post", 600) === "exiled";
    }),
    probe("continuity", "submission order does not decide precedence", ["timestamp-as-precedence"], () => {
      const r = recallResult(w.campaign, [voss], [EST], { ft: 0 });
      // apprentice (ft -100) was submitted last but holds at ft 0
      return r !== null && currentAtTime(r, EST, "post", 0) === "apprentice";
    }),
    probe("continuity", "supersession is prospective; successor holds after its effective point", [], () => {
      const r = recallResult(w.campaign, [voss], [EST], { ft: 400 });
      return r !== null && currentAtTime(r, EST, "rank", 400) === "guildmaster";
    }),
    probe("continuity", "distant plant is still recalled at final head", ["windowed-reconciliation"], () => {
      const r = recallResult(w.campaign, [voss], [EST]);
      return r !== null && r.lenses["establishment"]!.some((i) => i.assertion === w.id(commit));
    }),
  ];
}

export function epistemicSeparation(w: World): Probe[] {
  const voss = w.anchor("e-voss", "Maera Voss");
  const kade = w.anchor("e-kade", "Ilyen Kade");
  // established truth, never revealed to the player
  w.establishment(voss, "loyalty", "AshenCircleSecret", { ft: 1 });
  w.noise(2);
  // what the player has been told
  w.playerAware(voss, "role", "PublicHarbormaster", 1);
  w.noise(2);
  // Kade's (wrong) belief and separate suspicion and awareness
  w.belief(kade, voss, "loyalty", "KadeThinksLoyalToCrown", 1);
  w.suspicion(kade, voss, "loyalty", "KadeSuspectsSmuggling", 1);
  w.awareness(kade, voss, "sighting", "KadeSawHerAtNight", 1);
  w.noise(2);
  w.preparation(voss, "backstory", "PrepOnlyBackstory", 1);
  // two confusable same-named entities
  const corvinA = w.anchor("e-corvin-a", "Corvin Vale");
  const corvinB = w.anchor("e-corvin-b", "Corvin Vale");
  w.establishment(corvinA, "trade", "CorvinA-Blacksmith", { ft: 1 });
  w.establishment(corvinB, "trade", "CorvinB-Assassin", { ft: 1 });
  w.noise(2);
  // an ESTABLISHED equivalence between two anchors with distinct histories: records must not merge
  const envoy = w.anchor("e-envoy", "The Masked Envoy");
  const duke = w.anchor("e-duke", "Duke Alaric");
  w.establishment(envoy, "seen", "EnvoyAtTheBall", { ft: 1 });
  w.establishment(duke, "office", "DukeWardenNorth", { ft: 1 });
  w.equivalence(envoy, duke, { ft: 2 });
  // a BELIEF of equivalence between the confusable Corvins must not resolve their identity
  w.equivalence(corvinA, corvinB, { stance: "belief", holder: kade, ft: 1 });
  w.noise(2);

  return [
    probe("epistemic-separation", "belief lens reports belief, not established truth", [], () => {
      const r = recallResult(w.campaign, [voss], [belief(kade)]);
      return r !== null && present(r, belief(kade), "loyalty", "KadeThinksLoyalToCrown") && absentEverywhere(r, "AshenCircleSecret");
    }),
    probe("epistemic-separation", "unrevealed establishment is excluded everywhere from the player lens", ["lens-as-filter-tag"], () => {
      const r = recallResult(w.campaign, [voss], [PLAYER]);
      return r !== null && present(r, PLAYER, "role", "PublicHarbormaster") && absentEverywhere(r, "AshenCircleSecret");
    }),
    probe("epistemic-separation", "suspicion is separate from belief", [], () => {
      const r = recallResult(w.campaign, [voss], [suspicion(kade)]);
      return r !== null && present(r, suspicion(kade), "loyalty", "KadeSuspectsSmuggling") && absentEverywhere(r, "KadeThinksLoyalToCrown");
    }),
    probe("epistemic-separation", "entity awareness is separate from belief", [], () => {
      const r = recallResult(w.campaign, [voss], [awareness(kade)]);
      return r !== null && present(r, awareness(kade), "sighting", "KadeSawHerAtNight");
    }),
    probe("epistemic-separation", "player awareness is separate from entity awareness", [], () => {
      const r = recallResult(w.campaign, [voss], [PLAYER, awareness(kade)]);
      if (r === null) return false;
      const playerItems = r.lenses["player-awareness"]!;
      return playerItems.every((i) => i.qualification.stance === "player-awareness");
    }),
    probe("epistemic-separation", "preparation never appears in the establishment lens", [], () => {
      const r = recallResult(w.campaign, [voss], [EST]);
      return r !== null && absentEverywhere(r, "PrepOnlyBackstory");
    }),
    probe("epistemic-separation", "confusable same-named entities are not conflated", [], () => {
      const ra = recallResult(w.campaign, [corvinA], [EST]);
      const rb = recallResult(w.campaign, [corvinB], [EST]);
      if (ra === null || rb === null) return false;
      return present(ra, EST, "trade", "CorvinA-Blacksmith") && absentEverywhere(ra, "CorvinB-Assassin") && present(rb, EST, "trade", "CorvinB-Assassin") && absentEverywhere(rb, "CorvinA-Blacksmith");
    }),
    probe("epistemic-separation", "an established equivalence preserves both anchors and their distinct histories", ["merge-on-alias"], () => {
      const ra = recallResult(w.campaign, [envoy], [EST]);
      const rb = recallResult(w.campaign, [duke], [EST]);
      if (ra === null || rb === null) return false;
      const envoyOk = present(ra, EST, "seen", "EnvoyAtTheBall") && absentEverywhere(ra, "DukeWardenNorth");
      const dukeOk = present(rb, EST, "office", "DukeWardenNorth") && absentEverywhere(rb, "EnvoyAtTheBall");
      const eqSurfaced = ra.equivalences.length === 1 && ra.equivalences[0]!.identities.includes("The Masked Envoy") && ra.equivalences[0]!.identities.includes("Duke Alaric");
      return envoyOk && dukeOk && eqSurfaced;
    }),
    probe("epistemic-separation", "a belief of equivalence never resolves or merges confusable records", ["merge-on-alias"], () => {
      const est = recallResult(w.campaign, [corvinA], [EST]);
      const believed = recallResult(w.campaign, [corvinA], [belief(kade)]);
      if (est === null || believed === null) return false;
      return est.equivalences.length === 0 && believed.equivalences.length === 1 && present(est, EST, "trade", "CorvinA-Blacksmith") && absentEverywhere(est, "CorvinB-Assassin");
    }),
  ];
}

export function contradictionRecovery(w: World): Probe[] {
  const voss = w.anchor("k-voss", "Maera Voss");
  // an UNRESOLVED conflict: two establishments, same slot, same fictional time
  const dead = w.contradiction(voss, "fate", "DeadInTheHarbor", 5);
  const alive = w.contradiction(voss, "fate", "AliveInHiding", 5);
  w.noise(2);
  // a conflict resolved by correction during planting
  const rumorA = w.contradiction(voss, "origin", "BornInSaltmere", 1);
  const rumorB = w.contradiction(voss, "origin", "BornAbroad", 1);
  const originConflict = w.conflictId("k-voss::origin")!;
  w.resolve(originConflict, { kind: "correction", keep: w.id(rumorA) });
  w.noise(2);
  // a conflict resolved by rewind during planting
  const curseA = w.contradiction(voss, "curse", "CurseIsReal", 1);
  w.contradiction(voss, "curse", "CurseIsFake", 1);
  const curseConflict = w.conflictId("k-voss::curse")!;
  w.resolve(curseConflict, { kind: "rewind", remove: w.id(curseA) });
  w.noise(2);
  // a conflict resolved by a new establishment during planting
  w.contradiction(voss, "allegiance", "OldGuard", 1);
  w.contradiction(voss, "allegiance", "NewGuard", 1);
  const allegianceConflict = w.conflictId("k-voss::allegiance")!;
  w.resolve(allegianceConflict, { kind: "new-establishment", proposition: { subject: voss, attribute: "allegiance", value: "NeutralAfterAll" }, fictionalTime: 1 });
  w.noise(2);
  // an unrelated later change that must NOT be read as a conflict
  const kade = w.anchor("k-kade", "Ilyen Kade");
  w.establishment(kade, "post", "smuggler", { ft: 1 });
  w.establishment(kade, "post", "informant", { ft: 90 }); // later ft => transition, not conflict
  w.noise(2);

  return [
    probe("contradiction-recovery", "incompatible establishments surface as an explicit conflict", ["last-write-wins"], () => {
      const r = recallResult(w.campaign, [voss], [EST]);
      return r !== null && r.conflicts.some((c) => c.slot === "k-voss::fate");
    }),
    probe("contradiction-recovery", "both sides of a conflict are preserved, neither overwritten", ["last-write-wins"], () => {
      const st = w.campaign.state();
      return st.assertions.get(w.id(dead))!.standing === "active" && st.assertions.get(w.id(alive))!.standing === "active";
    }),
    probe("contradiction-recovery", "resolution by correction keeps one side, declares the other erroneous", [], () => {
      const st = w.campaign.state();
      return st.assertions.get(w.id(rumorB))!.standing === "corrected" && st.assertions.get(w.id(rumorA))!.standing === "active" && st.conflicts.get(originConflict)!.resolvedAt !== null;
    }),
    probe("contradiction-recovery", "resolution by rewind removes a side that must never return", [], () => {
      const r = recallResult(w.campaign, [voss], [EST]);
      return w.campaign.state().assertions.get(w.id(curseA))!.standing === "rewound" && r !== null && absentEverywhere(r, "CurseIsReal");
    }),
    probe("contradiction-recovery", "resolution by new establishment supersedes both sides", [], () => {
      const r = recallResult(w.campaign, [voss], [EST]);
      return r !== null && present(r, EST, "allegiance", "NeutralAfterAll") && absentEverywhere(r, "OldGuard");
    }),
    probe("contradiction-recovery", "an unrelated state transition is not flagged as a conflict", ["over-detection"], () => {
      return !hasConflictOnSlot(w, "k-kade::post");
    }),
  ];
}

export function evolvability(w: World): Probe[] {
  const voss = w.anchor("v-voss", "Maera Voss");
  const nameErr = w.establishment(voss, "name", "MaraVosTypo", { ft: 1 });
  const fixed = w.correct(w.id(nameErr), "MaeraVossCorrect");
  w.noise(2);
  const secret = w.establishment(voss, "plan", "PlanToBeRevised", { ft: 1 });
  const rewound = w.establishment(voss, "plan", "PlanRewoundOut", { ft: 1 });
  w.rewind(w.id(rewound));
  w.noise(2);
  const withdrawn = w.establishment(voss, "claim", "ClaimToRetract", { ft: 1 });
  w.retract(w.id(withdrawn));
  w.noise(2);
  const prep = w.preparation(voss, "twist", "PreparedTwist", 1);
  w.noise(2);

  return [
    probe("evolvability", "a correction produces the corrected effective value", [], () => {
      const st = w.campaign.state();
      return st.assertions.get(w.id(fixed))!.effectiveValue === "MaeraVossCorrect" && st.assertions.get(w.id(nameErr))!.standing === "corrected";
    }),
    probe("evolvability", "a correction keeps the erroneous record as lifecycle history", [], () => {
      return w.campaign.state().assertions.get(w.id(fixed))!.priorValues.some((p) => p.value === "MaraVosTypo");
    }),
    probe("evolvability", "rewound content never returns to play", [], () => {
      const r = recallResult(w.campaign, [voss], [EST]);
      return w.campaign.state().assertions.get(w.id(rewound))!.standing === "rewound" && r !== null && absentEverywhere(r, "PlanRewoundOut");
    }),
    probe("evolvability", "retraction flips standing and preserves attribution", [], () => {
      const rec = w.campaign.state().assertions.get(w.id(withdrawn))!;
      return rec.standing === "retracted" && rec.actor === w.owner;
    }),
    probe("evolvability", "a surviving establishment beside a rewind stays active", [], () => {
      return w.campaign.state().assertions.get(w.id(secret))!.standing === "active";
    }),
    probe("evolvability", "preparation stays provisional and out of established truth", [], () => {
      const r = recallResult(w.campaign, [voss], [EST]);
      return r !== null && absentEverywhere(r, "PreparedTwist") && w.campaign.state().assertions.get(w.id(prep))!.stance === "preparation";
    }),
    probe("evolvability", "corrected meaning is effective for ordinary recall", [], () => {
      const r = recallResult(w.campaign, [voss], [EST]);
      return r !== null && present(r, EST, "name", "MaeraVossCorrect") && absentEverywhere(r, "MaraVosTypo");
    }),
  ];
}

export function humanEditability(w: World): Probe[] {
  const voss = w.anchor("h-voss", "Maera Voss");
  const g = grantId("h-grant-gm");
  w.grant(g, "gm", ["establish", "maintain"]);
  // an edit landing as an attributed, validated operation by a delegated actor
  const gmEdit = w.campaign.submit({
    kind: "assert",
    operationId: operationId("h-gm-1"),
    actor: "gm",
    grant: g,
    stance: "establishment",
    proposition: { subject: voss, attribute: "note", value: "GmAuthoredNote" },
    fictionalTime: 1,
  });
  w.noise(2);
  // a claim edited against a stale basis must conflict, not overwrite
  const basis = w.establishment(voss, "status", "StatusOriginal", { ft: 1 });
  w.correct(w.id(basis), "StatusCorrectedOnce"); // basis is now 'corrected'
  w.noise(2);

  return [
    probe("human-editability", "an accepted edit lands as an attributed, validated operation", [], () => {
      if (gmEdit.disposition !== "accepted") return false;
      const r = recallResult(w.campaign, [voss], [EST]);
      const item = r?.lenses["establishment"]!.find((i) => i.value === "GmAuthoredNote");
      return item !== undefined && item.qualification.authority.includes("gm");
    }),
    probe("human-editability", "a stale-basis edit surfaces an explicit conflict, never overwriting", [], () => {
      const stale = w.campaign.submit({
        kind: "correct",
        operationId: operationId("h-stale-1"),
        actor: w.owner,
        target: w.id(basis),
        value: "StaleOverwriteAttempt",
        expect: [{ assertion: w.id(basis), standing: "active" }],
      });
      const r = recallResult(w.campaign, [voss], [EST]);
      return stale.disposition === "rejected" && stale.reason.includes("conflict") && r !== null && absentEverywhere(r, "StaleOverwriteAttempt");
    }),
    probe("human-editability", "a rejected proposal never enters recall", [], () => {
      const bad = w.campaign.submit({
        kind: "assert",
        operationId: operationId("h-bad-1"),
        actor: "gm",
        grant: g,
        stance: "establishment",
        proposition: { subject: anchorId("h-ghost"), attribute: "x", value: "RejectedGhostClaim" },
        fictionalTime: 1,
      });
      const r = recallResult(w.campaign, [voss], [EST]);
      return bad.disposition === "rejected" && r !== null && absentEverywhere(r, "RejectedGhostClaim");
    }),
  ];
}

export function boundedRelevantRecall(w: World): Probe[] {
  const voss = w.anchor("b-voss", "Maera Voss");
  // a recall-critical correction with LOW lexical similarity to any query term
  const err = w.establishment(voss, "allegiance", "zzz-old-allegiance", { ft: 1 });
  w.correct(w.id(err), "zzz-corrected-allegiance");
  w.playerAware(voss, "public", "PublicKnown", 1);
  w.establishment(voss, "hidden", "HiddenFromPlayerLeak", { ft: 1 });
  // a genuine safety boundary
  w.noise(2);
  // bulk relevant-looking establishment material on the focus
  for (let i = 0; i < 12; i++) w.establishment(voss, `filler-${i}`, `filler-value-${i}`, { ft: 1 });
  w.noise(2);
  w.safety("b-safety", "captivity");
  w.noise(2);
  const pinnedHead = w.head();
  // a later establishment that a pinned snapshot must not see
  w.establishment(voss, "future", "PostPinFuture", { ft: 1 });
  w.noise(2);

  return [
    probe("bounded-relevant-recall", "over-budget recall returns a critical prefix and a gap, not a dump", ["context-stuffing"], () => {
      const out = w.campaign.recall({ situation: "probe", focal: [voss], lenses: [EST], vantage: { establishmentPos: w.head(), fictionalTime: 1000 }, budget: { total: 4 } });
      if (out.kind !== "result") return false;
      return !out.result.complete && out.result.spent <= 4 && out.result.gaps.length > 0;
    }),
    probe("bounded-relevant-recall", "an infeasible mandatory reserve is rejected without assembly", [], () => {
      const out = w.campaign.recall({ situation: "probe", focal: [voss], lenses: [EST], vantage: { establishmentPos: w.head(), fictionalTime: 1000 }, budget: { total: 0 } });
      return out.kind === "rejected";
    }),
    probe("bounded-relevant-recall", "a safety boundary is represented before task material", [], () => {
      const out = w.campaign.recall({ situation: "probe", focal: [voss], lenses: [EST], vantage: { establishmentPos: w.head(), fictionalTime: 1000 }, budget: { total: 2 } });
      return out.kind === "result" && out.result.safety.some((s) => s.id === "b-safety");
    }),
    probe("bounded-relevant-recall", "recall-critical material survives a tight budget over relevant bulk", ["similarity-only-recall"], () => {
      // even at a small budget, the corrected effective allegiance must be present and the old one absent
      const r = recallResult(w.campaign, [voss], [EST], { total: 8 });
      return r !== null && present(r, EST, "allegiance", "zzz-corrected-allegiance") && absentEverywhere(r, "zzz-old-allegiance");
    }),
    probe("bounded-relevant-recall", "recall is pinned to its snapshot; later ops do not leak in", [], () => {
      const r = recallResult(w.campaign, [voss], [EST], { pos: pinnedHead });
      return r !== null && absentEverywhere(r, "PostPinFuture");
    }),
    probe("bounded-relevant-recall", "a gap never names lens-excluded or erased material", ["naive-gap-reporting"], () => {
      // reserve (safety + focal) fits, but the player item is omitted, producing a gap;
      // the gap must never name the hidden establishment excluded from this lens
      const out = w.campaign.recall({ situation: "probe", focal: [voss], lenses: [PLAYER], vantage: { establishmentPos: w.head(), fictionalTime: 1000 }, budget: { total: 2 } });
      if (out.kind !== "result") return false;
      return out.result.gaps.length > 0 && out.result.gaps.every((gp) => !JSON.stringify(gp).includes("HiddenFromPlayerLeak"));
    }),
    probe("bounded-relevant-recall", "an incomplete result carries zero enrichment", [], () => {
      const out = w.campaign.recall({ situation: "probe", focal: [voss], lenses: [EST], vantage: { establishmentPos: w.head(), fictionalTime: 1000 }, budget: { total: 3 } });
      return out.kind === "result" && !out.result.complete && out.result.omissionManifest.length === 0;
    }),
  ];
}

// --- shared probe utilities (used across families) ---

function hasConflictOnSlot(w: World, slot: string): boolean {
  for (const c of w.campaign.state().conflicts.values()) if (c.slot === slot) return true;
  return false;
}

export const FAMILIES: ((w: World) => Probe[])[] = [
  continuity,
  epistemicSeparation,
  contradictionRecovery,
  evolvability,
  humanEditability,
  boundedRelevantRecall,
];
