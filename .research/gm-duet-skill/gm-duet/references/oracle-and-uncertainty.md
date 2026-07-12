# Oracle and Uncertainty — Internal Procedures for "I Don't Know"

When the player asks something you genuinely don't know, you don't have to invent randomly. Solo RPGs have systematized this — borrow their architecture.

## The basic Yes/No oracle

When the player asks a yes/no question about the world that you haven't pre-determined ("Is there a tavern in this town?" "Does the duke have a son?"), use the six-tier oracle internally:

| Result | Meaning |
|---|---|
| **Yes, and** | Better than expected — yes plus an extra benefit |
| **Yes** | Straightforward yes |
| **Yes, but** | Yes with a complication |
| **No, but** | No with a silver lining |
| **No** | Straightforward no |
| **No, and** | Worse than expected — no plus an extra problem |

### Choosing the result:

Default to whichever fits the established fiction. When the question is genuinely 50/50, weight toward what makes the story interesting and consistent.

If you want randomness (helpful when you're tempted to bias toward your preferences):

**Method 1 — Likelihood-weighted d20:**
| Likelihood | Yes if d20 ≥ |
|---|---|
| Almost certain | 3 |
| Likely | 7 |
| 50/50 | 11 |
| Unlikely | 15 |
| Almost impossible | 19 |

Roll under 4 = exceptional yes (+ "and"). Roll over 17 = exceptional no (+ "and"). Hit the threshold exactly = "but."

**Method 2 — d6 oracle (faster, lighter):**
- 1: No, and
- 2: No
- 3: No, but
- 4: Yes, but
- 5: Yes
- 6: Yes, and

Apply -1/+1 modifier for unlikely/likely.

### Lock the answer

Once you've decided, **write it in `campaign-state.md`** so you don't contradict yourself later. The player asked once; if they ask again or someone else mentions it, the answer is the same.

## Themed oracles

For richer prompts beyond yes/no, use themed tables. Roll or pick when stuck.

### NPC disposition (when meeting a stranger)
2d6, modified by approach:
- 2: Hostile
- 3-5: Unfriendly
- 6-8: Neutral / cautious
- 9-11: Friendly
- 12: Helpful

### NPC goal (random NPC needs a motivation)
d12:
1. Wealth — wants money or possessions.
2. Power — wants influence, position, control.
3. Knowledge — wants information, secrets, lore.
4. Love — wants affection, family, connection.
5. Revenge — wants to harm someone specific.
6. Survival — wants safety, stability.
7. Glory — wants reputation, fame.
8. Justice — wants wrongs righted.
9. Faith — wants to serve a deity or ideology.
10. Freedom — wants escape from a situation or person.
11. Atonement — wants to make amends for past wrongs.
12. Mystery — has a secret motivation; roll twice or invent.

### Plot twist prompt (when stuck on what happens next)
d12:
1. An ally is revealed to be working against the PC.
2. An enemy offers an unexpected truce.
3. A presumed-dead NPC returns.
4. A long-buried secret about the PC's past surfaces.
5. A neutral party takes a side.
6. A resource the PC was relying on is taken away.
7. The real motivation behind the antagonist is exposed — and complicates moral judgment.
8. Time pressure: a deadline appears.
9. An unexpected source offers help (with strings).
10. A familiar face appears in an impossible place.
11. A previously hidden faction reveals itself.
12. The PC's actions had unintended consequences they're now confronting.

### Location flavor (when the PC enters a place you didn't prep)
d8 sensory anchor:
1. Bright/sunny/clear.
2. Dim/shadowed/overcast.
3. Hot/dry/dusty.
4. Cold/wet/frozen.
5. Crowded/loud/chaotic.
6. Empty/silent/abandoned.
7. Beautiful/well-kept/proud.
8. Decayed/neglected/forgotten.

d8 distinguishing feature:
1. A central object or structure (statue, well, tree, altar).
2. An unusual smell or sound.
3. A person doing something unexpected.
4. Evidence of a recent event (blood, scorch, footprints).
5. An unsettling absence (no birds, no wind, no people).
6. A piece of architecture or signage that hints at history.
7. A change in temperature or atmosphere.
8. Something obviously wrong or out of place.

Combine: roll both, weave into a description.

### "What goes wrong" oracle (for failure complications)
d10:
1. An ally is hurt or compromised.
2. A resource is lost or damaged.
3. The PC is seen by someone who shouldn't see them.
4. An alarm or warning is raised.
5. The wrong person learns of the PC's actions.
6. A complication delays the PC critically.
7. A trap, hazard, or environmental danger triggers.
8. A faction takes notice and reacts.
9. The PC's reputation suffers.
10. The PC owes someone, now.

## Scene mechanics (Mythic-style)

When you're starting a scene and not sure if it goes as expected:

1. **State the expected scene** in your head. ("The PC arrives at the duke's manor for the audience.")
2. **Roll vs. Chaos Factor** (1–9, default 5):
   - **Roll under CF on d10** — the scene is altered or interrupted.
   - **Even result** — the scene is *altered* (different than expected, but related).
   - **Odd result** — the scene is *interrupted* (something unexpected derails it; roll a random event).

### Chaos Factor
A 1–9 dial representing how chaotic / unpredictable the world is right now.
- **Default: 5.**
- **Increase (+1)** when the PC is winning, in control, or things are going their way. The world pushes back.
- **Decrease (−1)** when the PC is losing, struggling, or out of control. The world settles.
- **Keep within 1–9.**

This naturally creates rising-and-falling tension: when the PC is on top, more weird things happen; when they're suffering, the world calms briefly.

### Random events

When triggered (Mythic uses doubles AND the single digit ≤ Chaos Factor), roll on a random event table:

**Event focus** (d10):
1. Remote event (somewhere offscreen)
2. Faction action
3. NPC action (recurring NPC)
4. NPC negative (an NPC opposes the PC)
5. NPC positive (an NPC helps the PC)
6. Move toward a thread (a current goal advances)
7. Move away from a thread (a current goal is hindered)
8. Close a thread (resolve a hanging plot thread)
9. New thread (introduce a new plot thread)
10. PC negative (something happens to the PC)

Combine with a meaning prompt (two evocative words) and interpret.

## Meaning tables (for interpretation)

When you need a prompt to interpret, roll two d100 entries from this kind of table:

**Action** (d100): a verb. Burn, bury, claim, conceal, deceive, demand, deny, desire, destroy, doubt, dream, escape, exhaust, extort, fail, fight, flee, follow, gather, give, gossip, govern, harm, heal, help, hide, hunt, ignore, imitate, imprison, inspire, invite, judge, lead, leave, lose, manipulate, meet, neglect, negotiate, observe, offer, open, oppress, overcome, pause, persuade, pity, plan, please, plot, possess, postpone, praise, prepare, present, preserve, pretend, promise, propose, protect, prove, provide, pursue, push, quarrel, question, race, reach, react, receive, recover, refuse, regret, reject, release, remember, remove, repair, replace, reply, request, rescue, resist, respect, return, reveal, ride, ruin, sabotage, save, search, seduce, seek, sell, serve, share, shelter, shield, sicken, signal, silence, slay, sleep, smell, sneak, solve, sound, spend, spread, stalk, start, steal, stop, struggle, suffer, support, surrender, surround, suspect, swear, take, talk, teach, threaten, throw, transform, transport, trap, travel, treat, tremble, trick, trust, try, turn, understand, undo, unify, unite, urge, use, vow, wait, walk, warn, watch, weaken, weep, win, wish, withdraw, work, wound, write.

**Subject / Theme** (d100): a noun. Accident, advice, alliance, ambush, ancestor, anger, animal, answer, arrival, art, attention, beauty, belief, betrayal, birth, body, book, business, calm, captive, ceremony, change, chaos, child, choice, claim, comfort, competition, confidence, conflict, control, courage, craft, crime, crowd, danger, darkness, death, debt, deception, decision, defense, despair, destiny, disease, disguise, doom, doubt, dream, duty, election, emotion, energy, escape, evidence, evil, exchange, expectation, fame, family, fate, fear, feast, feeling, festival, fire, forgiveness, freedom, friendship, future, gift, glory, goal, gold, good, government, greed, grief, group, guilt, harm, hatred, heart, history, home, honor, hope, hunger, idea, illness, illusion, image, information, inheritance, innocence, intrigue, invention, jealousy, journey, joy, judgment, justice, knowledge, labor, language, law, leader, lie, life, light, loss, love, loyalty, luck, machine, marriage, memory, message, mission, mistake, money, mountain, mystery, name, nature, news, night, oath, object, omen, opportunity, opposition, order, pain, party, passage, past, path, peace, people, place, plan, pleasure, plot, poverty, power, prayer, prediction, pride, prison, problem, promise, prophecy, protection, pursuit, quest, question, race, rain, reality, rebirth, refuge, rejection, relic, relief, religion, request, rescue, research, resource, respect, responsibility, retreat, revenge, riches, river, road, ritual, rivalry, romance, ruler, sacrifice, safety, scandal, scheme, secret, separation, service, shame, shelter, shock, shortage, sign, silence, sin, skill, sleep, society, soldier, solitude, solution, sorrow, soul, spell, spirit, stranger, strength, success, suffering, suspicion, sword, symbol, talent, task, teacher, technology, temptation, test, theft, thirst, threat, time, tool, trade, tragedy, transformation, trap, treasure, treaty, trick, trust, truth, union, vehicle, vengeance, victory, vision, voice, vow, wandering, war, warning, water, weakness, wealth, weapon, weather, will, wisdom, witness, wonder, work, world, wound, youth.

**Combine:** roll both, interpret freely. "Burn / Mystery" → a clue is destroyed. "Surrender / Loyalty" → an ally pledges service. "Reveal / Inheritance" → the duke's heir is exposed.

These prompts are for *your* interpretation — they break creative blocks. Don't use them as random oracle answers given verbatim to the player.

## Threads and characters tracking

In long-form play, maintain two short lists for oracle reference:

### Active threads
A list of current plot threads, each as a one-line goal:
- "Find the duke's missing brother."
- "Investigate the cult's connection to the plague."
- "Repair the relationship with the PC's exiled mentor."

When a random event hits "move toward a thread" or "new thread," consult this list.

### Active characters
A list of recurring NPCs the player has met, with a one-line summary:
- "Captain Thane — duke's bodyguard, hides his brother is alive."
- "Mira — barmaid, double agent for the cult."
- "Elder Voss — PC's former mentor, exiled, knows the plague's origin."

When a random event hits "NPC action," roll on this list.

These are extracted from `npcs.md` and `campaign-state.md`. Keep them lightweight.

## Scene complication injection

When a scene is going too smoothly and you want to inject pressure without artificial difficulty:

- **A new arrival.** Someone unexpected enters.
- **A revelation.** Something the PC was missing comes to light.
- **A complication.** A small thing breaks, fails, or escalates.
- **An interruption.** Something offscreen intrudes (a faction acts, a clock ticks).
- **A choice.** Two desirable things become incompatible.

Use sparingly — over-complicating is its own failure mode. But occasional injection prevents stagnant scenes.

## When to stop using oracles

Oracles are tools for breaking blocks, not crutches. Use them when:
- You genuinely don't know the answer.
- You're tempted to bias toward your preferences.
- You're stuck and need a prompt.

Don't use them when:
- The fiction has a clear answer (the duke obviously has guards; don't roll for it).
- The player has earned a specific outcome (don't randomize their reward).
- The narrative needs a specific beat (the climax shouldn't depend on a random table).

The oracle is your tool. The fiction is sovereign.
