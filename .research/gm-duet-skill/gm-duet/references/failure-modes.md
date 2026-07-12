# Failure Modes — Diagnostics and Fixes

The recurring patterns that ruin games, and the specific corrections to apply when you catch them in yourself.

## How to use this file

Run a self-check periodically — every few sessions, or whenever something feels off. For each failure mode, the diagnostic tells you how to spot it; the fix tells you how to recover.

---

## 1. Railroading

**Diagnostic:** Player choices don't change outcomes. The same scene plays out regardless of what the PC does. You find yourself thinking "no, that won't work because then they wouldn't get to the part I prepped."

**Symptoms:**
- Player tries clever solutions; you find reasons they fail.
- Multiple PC paths lead to the same scene with no real difference.
- You feel attached to a specific narrative outcome.
- The PC's choices feel inconsequential to the player.

**Fix:**
- Prep situations, not plots. Stat the antagonist, the location, the faction's goal. Don't script "and then they go to the temple."
- Use node-based design: 3+ leads from every node, multiple ways into every scene.
- Let the player off the rails. If they're going somewhere unexpected, deploy your secrets and NPCs there instead.
- Ask: "What's the situation, and what does each faction do based on what the PC does?"

**Quick correction during play:** When you catch yourself blocking a clever solution, stop. Say yes (or yes-but). Adjust the prep around the new direction.

---

## 2. Yes-anding into incoherence

**Diagnostic:** You said yes so often the world contradicts itself. The player asks "is there a tavern?" — you say yes. They ask "is the duke here?" — yes. They ask "is the duke at war with the next kingdom?" — yes. Three sessions later, the duke is allied with that kingdom; the world has broken.

**Symptoms:**
- World facts contradict each other across sessions.
- NPCs behave inconsistently with their established traits.
- Threats lose stakes because the player can always negotiate them away.
- You feel like the world has no rules.

**Fix:**
- Use "yes, but" and "no, but" liberally. Pure "yes" is rare.
- Maintain `campaign-state.md` and `rulings.md` rigorously. Lock answers.
- Read state files before sessions. Confirm against them, not against memory.
- When in doubt, the world's rules win over politeness. The duke isn't suddenly merciful because the player wants him to be.

**Quick correction during play:** When the player asks something and you feel the urge to say yes, pause. Ask: "Is this consistent with what I've established?" If unclear, say "let me think about that" and check `campaign-state.md`.

---

## 3. NPC voice collapse

**Diagnostic:** All NPCs sound the same. The player can't tell them apart. You catch yourself reusing the same phrases across characters.

**Symptoms:**
- Player asks "wait, who said that?"
- NPCs blur together in the player's memory.
- You're using the same speech patterns regardless of NPC.
- You forget who has which voice.

**Fix:**
- Each NPC gets ONE distinguishing voice lever (cadence, pitch, vocabulary, tic, posture). Track in `npcs.md`.
- Never duplicate the same lever in the same arc.
- Before voicing a returning NPC, check `npcs.md` for their voice tag.
- If you can't sustain a voice, give the NPC a signature *phrase* or *tic* instead — it's a voice marker without requiring vocal performance.

**Quick correction during play:** If you catch yourself voicing two NPCs the same, immediately add a distinguishing tic to one of them and update `npcs.md`.

---

## 4. Continuity drift

**Diagnostic:** You forget prior events. NPCs behave inconsistently across sessions. The player corrects you.

**Symptoms:**
- "Wait, didn't I already kill that NPC?"
- "I thought we agreed the duke had a son, not a daughter."
- "The captain knows about the cult; why is he asking me?"
- You contradict your own earlier statements.

**Fix:**
- Read all state files at session start. Even if you "remember," confirm against the files.
- Never invent contradictions. If the player corrects you, accept the correction as canon.
- Update files at session end, religiously. `timeline.md` and `last-session-recap.md` are non-negotiable.
- Maintain a who-knows-what matrix for important secrets.

**Quick correction during play:** When you catch a contradiction, say "you're right, let me reconsider." Don't try to retcon the player's correct memory.

---

## 5. Rules / math errors

**Diagnostic:** Wrong stat blocks, wrong DCs, miscounted dice, forgotten conditions, applied damage incorrectly.

**Symptoms:**
- Player catches you with a wrong number.
- You realize after a session that the monster's HP was off.
- A condition was applied wrong (frightened doesn't do that).
- You forgot a creature's resistance/vulnerability.

**Fix:**
- Slow down. Read the stat block before running the NPC. Don't run from memory.
- Compute step-by-step and show the math. "AC 16, you rolled 14 + 3 = 17, hits. Damage: 1d8+3, you rolled 5+3 = 8."
- For complex creatures, prep a quick-reference card — key actions, DCs, conditions.
- When you catch an error, acknowledge and correct. Don't pretend.

**Quick correction during play:** "Sorry, I miscounted — that should have been 14, not 12." Move on. The player would rather you be honest than infallible.

---

## 6. Always letting the player succeed

**Diagnostic:** No real losses. The PC always finds a way. Tension flatlines.

**Symptoms:**
- The player has not lost anything significant in many sessions.
- Failures get retroactively softened.
- Threats turn out to be paper tigers.
- The player feels the outcome is never in doubt.

**Fix:**
- Honor failure. When the dice say miss, miss.
- Use the fail-forward menu (`adjudication.md`). Failure produces complication, cost, or escalation — not "nothing happens" and not "well actually it works."
- Let consequences land. NPCs the PC cared about can die. The plan can fall apart. The relic can be lost.
- Test: when did the PC last lose something they wanted? If you can't remember, you've been soft-pedaling.

**Quick correction during play:** Pick one consequence from the fail-forward menu and apply it firmly. If the PC missed, something bad happens. Now.

---

## 7. Fudging dice

**Diagnostic:** You're silently changing results. A monster's HP shifts mid-fight. A roll's outcome is ignored.

**Symptoms:**
- You're rolling in secret to "preserve drama."
- You're nudging HP up or down based on the situation.
- You're treating the dice as suggestions, not verdicts.
- The player hasn't lost anything in a while (see #6).

**Fix:**
- Don't fudge. Period.
- Pre-tune before the roll: set HP, DCs, encounter strength based on what you want. Then commit.
- If you couldn't accept the result, you shouldn't have called for the roll.
- Roll openly when possible. The transparency is the discipline.

**Quick correction during play:** If you catch yourself about to fudge, stop. Take the result. The "ruined" scene is almost always a more interesting scene than the planned one. The dragon kills the mentor in one round? Now you have a dead mentor and a vendetta.

---

## 8. Killer-GM gotcha

**Diagnostic:** Surprise lethality with no warning. Save-or-die without telegraphing. The PC dies and the player has no recourse.

**Symptoms:**
- The PC dies and the player can't point to the moment they could have made a different choice.
- Traps spring without environmental cues.
- Monsters appear with no telegraphing.
- The fairness test fails.

**Fix:**
- Three signposts before any major threat. Distant rumor, environmental evidence, immediate sensory cue.
- Telegraph monster abilities in the round before they fire.
- Use non-death failure states for solo PCs.
- Apply the fairness test: could the player have chosen differently with the information they had?

**Quick correction during play:** If a deadly threat is about to land with insufficient warning, retroactively add a signpost. "Wait — you actually noticed a faint smell of sulfur as you entered." The player gets one round of reaction time.

---

## 9. GM monologuing

**Diagnostic:** You're describing for paragraphs. The player is checking out.

**Symptoms:**
- Player's responses are short and disengaged.
- You're describing rooms in detail before the player has expressed interest.
- You're explaining lore the player didn't ask about.
- Your descriptions are 5+ sentences.

**Fix:**
- Three Detail Rule. Stop at three.
- Lead with one striking image; let questions pull more out of you.
- Cut to "What do you do?" frequently.
- For lore: drop hints, not lectures. Let the player ask.

**Quick correction during play:** When you catch yourself describing for a third sentence about a non-critical thing, stop. Ask "What do you do?" Let the player engage.

---

## 10. GM as protagonist

**Diagnostic:** NPCs solve problems. The PC reacts. You're more invested in the NPCs than the PC.

**Symptoms:**
- Recap is dominated by NPC actions, not PC actions.
- NPCs frequently swoop in to save the PC.
- The PC feels like a sidekick to the GM's story.
- You're spending more time on NPC personalities than on PC stakes.

**Fix:**
- The PC is the protagonist. Always.
- NPCs set up; the PC swings.
- In duet, run the companion AFTER the PC, never before. The companion never solves the problem.
- Test: in the last 3 scenes, who made the decisive action? It should be the PC.

**Quick correction during play:** If you find yourself about to have an NPC solve the current problem, stop. Either let the PC find their own way, or have the NPC offer information/support but require the PC to act on it.

---

## 11. Refusing clever solutions

**Diagnostic:** "That's not how I planned it." The player tries something creative; you find a reason it fails.

**Symptoms:**
- You're attached to a specific solution path.
- Player creativity is met with "no" or "you'd need to roll for that, oh you failed."
- The player stops trying creative solutions.

**Fix:**
- Reward cleverness. If the approach genuinely exploits a real fictional advantage, grant advantage or auto-succeed.
- Your prep is a starting point, not a ceiling. Adjust to clever play.
- Ask: would this work if a real person tried it? If yes, let it work.
- "How does the world react to this clever move?" is a better question than "how do I prevent this?"

**Quick correction during play:** When you catch yourself wanting to block a clever solution, ask "what's the version of this where it works?" Run that version.

---

## 12. Plot armor / deus ex machina

**Diagnostic:** NPCs always rescue the PC at low HP. Convenient solutions appear when the situation gets hard. The PC never really loses.

**Symptoms:**
- The PC is always rescued just in time.
- Required NPCs always survive their fights regardless of the dice.
- Lost items always turn out to be findable.
- Defeated villains turn up alive without explanation.

**Fix:**
- Same as fudging. Let consequences land.
- If a rescue happens, it must be set up in advance — the NPC was nearby for a reason; the relic was in a place that could be retrieved.
- The PC earns survival through choices and luck. Doesn't get it for free.

**Quick correction during play:** If you're about to deus-ex-machina a save, stop. Either let the PC lose (with a non-death consequence — see "soft-pedaling" below), or set up the rescue with proper foreshadowing in retrospect.

---

## 13. Soft-pedaling failure

**Diagnostic:** Pulling punches. Failure becomes "well, almost" instead of real loss. The player wins at every turn.

**Symptoms:**
- Failures don't actually hurt.
- The PC's resources are never depleted.
- Plans always work, just sometimes with minor inconvenience.
- The player isn't tense in dramatic scenes.

**Fix:**
- Be a fan of the character, not a doormat.
- The story wants struggle. Let things go wrong.
- Use the fail-forward menu: real cost, real complication, real escalation.
- Apply morale rolls, reaction rolls, faction clocks — let the world push back actively.

**Quick correction during play:** Pick the meanest reasonable consequence from the fail-forward menu and apply it. The player will respect you for it.

---

## 14. Inconsistent rulings

**Diagnostic:** The same situation produces different outcomes across sessions. The player notices.

**Symptoms:**
- "But last time you said X worked this way."
- You can't remember how you ruled on something before.
- The system feels arbitrary.

**Fix:**
- Maintain `rulings.md`. When you make a ruling that will recur, write it down immediately.
- Read `rulings.md` at session start.
- When you catch an inconsistency, acknowledge it. Pick the better ruling and announce it as the new precedent.

**Quick correction during play:** "You're right, I ruled differently last time. Let me think about which version is the right one going forward." Pick. Update `rulings.md`.

---

## 15. Over-prep

**Diagnostic:** You spend hours prepping detailed material the PC never engages with. Burnout. Attached to specific outcomes because of the prep investment.

**Symptoms:**
- You're prepping more than 1 hour for every hour of play.
- You feel resentful when the PC doesn't engage with prepped content.
- You're scripting NPCs' dialogue or pre-writing scenes in detail.
- You dread prep.

**Fix:**
- Lazy DM 8 steps. Strong start + 10 secrets + 3 locations is enough.
- Prep tools, not contingencies. Stat the antagonist; outline the situation; deploy as needed.
- Hold prep loosely. The PC is going to surprise you.
- Reuse prep across sessions. Unused secrets carry forward.

**Quick correction:** Cut your next session's prep to 30 minutes. Run with what you have. You'll discover most prep is unnecessary.

---

## 16. Under-prep

**Diagnostic:** You're stalling. Inventing on the fly with visible effort. Contradicting yourself.

**Symptoms:**
- Long pauses while you think.
- "Uh, sure, the duke is... okay, his name is..."
- World facts you invent contradict earlier facts.
- You're avoiding running scenes you don't know how to handle.

**Fix:**
- Minimum viable: Strong Start + 10 Secrets + 3 Fantastic Locations. Always have these.
- Read `references/scene-craft.md` and `references/encounters.md` before sessions for techniques.
- Use oracle tables (`references/oracle-and-uncertainty.md`) for moments of "I don't know."
- Develop a stable of NPC voices, location templates, encounter shapes you can deploy without prep.

**Quick correction during play:** When you stall, say "let me think about that." Take the moment. Consult oracle / state files. Don't fake confidence.

---

## 17. Treating the player as audience

**Diagnostic:** You're performing for the player rather than collaborating with them. The player feels like a spectator.

**Symptoms:**
- Long monologues from NPCs the PC didn't ask to hear.
- World-building lore dumps.
- You're invested in your prose, not the player's choices.
- The player's questions feel like interruptions to your flow.

**Fix:**
- Address the character; ask questions; use the answers.
- The player is your co-author, not your audience.
- Test: who has done more imaginative work in this scene — you or the player?
- Cut your descriptions in half. Let the player ask for more if they want it.

**Quick correction during play:** Stop describing. Ask "What do you do?" or a question that invites the player to fill a blank.

---

## The omnibus self-check

After every session, ask yourself:

1. Did the PC's choices change outcomes? (Railroading)
2. Was the world internally consistent? (Yes-anding / continuity)
3. Did NPCs feel distinct? (Voice collapse)
4. Did I update state files? (Continuity)
5. Did I get rules / math right? (Errors)
6. Did the PC face real challenges and real losses? (Soft-pedaling)
7. Did I roll openly and abide by results? (Fudging)
8. Was failure telegraphed? (Killer-GM)
9. Were my descriptions tight? (Monologuing)
10. Was the PC the protagonist? (GM as protagonist)
11. Did clever play get rewarded? (Refusing cleverness)
12. Were rescues earned? (Plot armor)
13. Were rulings consistent? (Inconsistent rulings)
14. Was prep appropriate? (Over/under-prep)
15. Was the player co-authoring? (Audience treatment)

If you can check 12+ of these honestly, you ran a good session. Below 10, focus on the failures next time.
