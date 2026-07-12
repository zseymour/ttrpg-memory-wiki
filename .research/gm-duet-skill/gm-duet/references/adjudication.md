# Adjudication — When and How to Resolve Player Actions

This is the deep reference for the most important judgment you make as a GM: when does a player declaration become a die roll, and what happens with the result.

## The core procedure

When the player declares an action, run this in your head:

1. **Capture intent + approach.** What does the PC want, and how are they doing it?
   - If you only got intent ("I want past the guard"), ask: "How?" before resolving.
   - The approach matters because it shapes both odds and consequences.
   - Example: "I want past the guard" — picking the lock vs. seducing the guard vs. clubbing them all yield the same intent (past the guard) but very different consequences (silent vs. public departure vs. unconscious body).

2. **Apply the three-question test:**
   - Can it succeed? (If no → narrate why, in fiction.)
   - Can it fail? (If no → just say yes.)
   - Is failure interesting? (If no → either grant success or invent a complication.)

3. **If all three are yes:** call for a roll. Set difficulty *before* the roll, never after.

4. **Reward cleverness.** If the approach genuinely exploits a real fictional advantage:
   - Grant advantage / bonus / +1d / boost (system-dependent), OR
   - Skip the roll and grant success outright if the leverage is decisive.

5. **Resolve and translate.** Take the mechanical result and put it back in the fiction.

## DC ladders by system

### D&D 5e / 5.5e
| Difficulty | DC | Use for |
|---|---|---|
| Very easy | 5 | Tasks requiring minimal effort; auto-succeed for trained PCs |
| Easy | 10 | Simple tasks any reasonable person could attempt |
| Medium | 15 | The default — uncertain, takes real effort |
| Hard | 20 | Demanding; requires skill and focus |
| Very hard | 25 | At the edge of human ability |
| Nearly impossible | 30 | Legendary feats |

**Sly Flourish simplification:** Use only 10, 15, or 20 for 95% of rolls. Easy / Medium / Hard. Default to 15.

### Pathfinder 2e
DCs scale by level: PC level → DC ~ 14 + level + tier modifier (Trivial −2, Low 0, High +2, Severe +5, Extreme +7). Or use the simplified table:

| Level | Trivial | Low | Moderate | High | Severe | Extreme |
|---|---|---|---|---|---|---|
| 1 | 13 | 14 | 15 | 16 | 18 | 20 |
| 5 | 17 | 18 | 20 | 22 | 24 | 26 |
| 10 | 22 | 23 | 26 | 28 | 30 | 33 |
| 15 | 28 | 29 | 32 | 34 | 36 | 39 |
| 20 | 34 | 35 | 38 | 40 | 42 | 45 |

**PF2e has four degrees of success:** critical success (≥10 over DC), success, failure, critical failure (≥10 under). Most spells, attacks, and saves specify all four. Read the stat block.

### Call of Cthulhu 7e
- **Regular** difficulty = full skill value.
- **Hard** = ½ skill value.
- **Extreme** = ⅕ skill value.
- **Bonus / Penalty dice** modify the roll — keep best/worst tens die from 1d100.

### Blades in the Dark / FitD
No DCs. Set **Position** (Controlled / Risky / Desperate) and **Effect** (Limited / Standard / Great) based on fiction. Roll dice pool; highest die wins:
- 6 = full success
- 4–5 = partial / cost
- 1–3 = miss / consequence
- multiple 6s = critical

### PbtA (Apocalypse World, Dungeon World, etc.)
2d6 + stat:
- 10+ = full success
- 7–9 = partial / cost / harder choice
- 6– = miss; GM makes a hard move

No DCs to set. The mechanics handle calibration; *you* control the move that follows the result.

### Fate Core
4dF + skill vs. opposition (passive opposition like a DC, or active rolled opposition). Shifts = how much you beat by.
- Fail = succeed at major cost OR fail with minor consequence.
- Tie = succeed at minor cost OR generate a boost.
- Succeed = do it.
- Succeed with style (3+ shifts) = do it AND extra benefit.

### Burning Wheel
Roll dice pool ≥ Obstacle (Ob). Each 4-6 (B) or 3-6 (G) is a success.
- Routine: Ob 1
- Difficult: Ob 2
- Hard: Ob 3
- Tough: Ob 4
- Very Tough: Ob 5
- Heroic: Ob 6+

Note: BW uses **Let It Ride** — one roll covers the whole intent for the situation. You can't demand a re-roll until circumstances genuinely change.

### Year Zero (Forbidden Lands, Alien, etc.)
d6 dice pool: any 6 = success; multiples = stunts.

The signature mechanic is **Push**: re-roll all non-1, non-6 dice once, but pay a thematic cost (stress, decay, corruption, conditions) for the second attempt.

### Cypher System
Difficulty is rated 1–10. Target = difficulty × 3 (so D5 = TN 15 on d20). The player **reduces difficulty** through Effort, Skills, Assets, and Edge — *they* lower the target rather than adding bonuses. The GM never rolls; instead introduces **GM Intrusions** (complications) that the player can accept (gain XP) or buy off (spend XP).

## When NOT to roll

| Situation | Action |
|---|---|
| Auto-success (skilled PC, easy task, plenty of time) | Just say yes |
| Auto-failure (impossible given fiction) | Say no, give fictional reason |
| No interesting consequence to failure | Say yes, OR invent a consequence |
| Player has earned this through prior smart play | Say yes |
| Player has exploited a real fictional advantage | Say yes, or grant advantage |
| Player wants to do something boring (climb a ladder, open an unlocked door) | Just describe it happening |
| Investigation: clue is critical to plot | Just give it; gate interpretation, not facts |

## When you MUST roll

- The PC is opposed by something with stats and stakes.
- The outcome is genuinely uncertain.
- Failure produces interesting fiction.
- The player has accepted a known risk (exploring deeper, accepting a devil's bargain, etc.).

## The fail-forward menu

Default to one of these on failure unless the situation truly resolves with "no, nothing happens":

| Option | Description | Example |
|---|---|---|
| **Succeed at a cost** | Get what you wanted, lose something else | Pick the lock — but the picks snap; you can't repeat |
| **Game complication** | Mechanical consequence | Take damage; lose a resource; spell slot burns; ammo runs out |
| **Story complication** | Fictional consequence | Alarm raised; NPC offended; faction notices |
| **Stakes rise** | A clock ticks; time advances | Pursuit gains ground; ritual completes a step |
| **Charge for success** | Make it, but lose what got you there | Reach the ledge — drop your torch into the abyss |
| **Worse position** | Future actions get harder | Now hanging by one hand; now visible from above |
| **Information gained, action failed** | Learn something despite failing | The trap snaps but you see the mechanism |

**Never** end with: "you fail. Nothing happens." That's a failure of GM imagination, not a fair outcome.

## Special adjudication patterns

### Opposed rolls
Both sides roll. Higher beats lower. Most systems use this for:
- PC vs. NPC contests (Athletics vs. Athletics for a shove).
- Stealth vs. Perception.
- Persuasion vs. Insight (or just narrate; not all social rolls need opposition).

In PbtA: only the player rolls; the GM doesn't.

### Group rolls
Half or more of the group must succeed. **Largely irrelevant in duet** — the PC is the group.

### Help / aid actions
- 5e: ally grants advantage if they reasonably could help.
- BW: helping pool adds dice up to a cap.
- Blades: assist for +1d at cost of stress.
- PbtA: "Aid or Interfere" move; success grants +1 forward.

In duet, the sidekick NPC may aid the PC. Default: aid grants advantage / +1 die. Don't let the sidekick *replace* the PC's roll.

### Pushed rolls (CoC, Year Zero)
After a failed roll, the PC may try again at greater cost. Pushed failures are *severe* — sanity loss, stress increase, harm. Always describe a fictional reason for the re-attempt.

### Critical success / failure
- 5e: nat 20 always crits on attack rolls; nat 1 always misses. Skill checks: house rule (default = no auto-success/failure on skills).
- PF2e: meet the DC by 10+ = critical success; miss by 10+ = critical failure. Apply the four-degree result.
- Blades: multiple 6s = critical (extra effect / position improvement).
- BW: open-ended sixes (rerolls cascading on 6s) — apply per BITs/Artha rules.
- PbtA: 12+ on 2d6 = critical, often with bonus mechanic.

### Set-up rolls
Player invests an action to make a future action easier. Always allow this — it rewards thinking. Set-up rolls grant advantage, +1 forward, or a "boost" aspect to the follow-up.

### Hidden information rolls
Sometimes a roll determines whether the PC notices something they don't know to look for. Two valid approaches:
1. **Roll openly, narrate honestly:** "You roll a 12 on Perception. You notice the bookshelf is uneven."
2. **Roll secretly, narrate result:** "Roll me a Perception. ... [you roll, you see the result] You notice the bookshelf is uneven." — or "You see nothing unusual."

Either is fine for *information*. Never roll secretly for the *outcome of declared player action*. That's fudging-by-another-name.

## The fudging discipline (extended)

The temptation to fudge always comes from the same impulse: "this result will ruin the scene." Resist it. The right response is one of:

1. **Don't have called for the roll.** If the result of "1" or "20" would be unbearable, the roll was a mistake. Narrate the outcome instead.
2. **Pre-tune.** Adjust monster HP, encounter strength, or DCs *before* the roll lands.
3. **Use the system's built-in safety nets:** Inspiration, Hero Points, Resistance Rolls, Bennies, Fate Points, Defy Death, Pulled Punches. These are fudge-substitutes the system permits.
4. **Let it land. Trust the dice.** A "ruined" scene is often actually a more interesting scene. The dragon kills the PC's mentor in one round? Now the PC has a dead mentor and a vendetta. That's better than the planned outcome.

The deal you make with the player when you call for a roll is: *I will abide by this result.* Honor it. Public dice are the safer default.

## What to do when math goes wrong

You will, occasionally, miscount. When you catch yourself:

- **If the player hasn't acted on the wrong number yet:** quietly correct ("sorry, that should have been 14, not 12"). The integrity of the system matters more than the pretense of perfection.
- **If they have acted on it:** finish the moment, then correct on the next decision point. Don't rewind unless the error materially changed an outcome.
- **If you used a wrong stat block / wrong rule:** acknowledge it, decide whether to ret-con or let it stand, and append to `rulings.md`. Future encounters use the corrected version.

The player does not need you to be infallible. They need you to be honest.
