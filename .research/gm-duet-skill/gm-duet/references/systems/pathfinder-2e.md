# Pathfinder 2e — System-Specific Guide

PF2e is mathematically tighter and more tactical than 5e. Rules matter more; eyeballing matters less.

## Resolution

**Core mechanic:** d20 + ability modifier + proficiency + item bonus + status bonus + circumstance bonus vs. DC.

**Proficiency tiers** — add level + (rank × 2):
- Untrained: +0 (just level if untrained, no proficiency added)
- Trained: +2 + level
- Expert: +4 + level
- Master: +6 + level
- Legendary: +8 + level

**Bonuses don't stack within type.** Highest item bonus, highest status, highest circumstance — ignore lower ones of the same type.

## Four degrees of success

Every check has four results:

- **Critical Success:** beat DC by 10+, OR roll a nat 20 that succeeds
- **Success:** meet or beat DC
- **Failure:** miss DC
- **Critical Failure:** miss DC by 10+, OR roll a nat 1 on a check that already failed

Most spells, attacks, saves, and skills specify all four outcomes. **Read the stat block.**

Nat 20 / nat 1 shifts the result by one degree but doesn't auto-set the outcome.

## DC by level (for setting on the fly)

PF2e DCs scale with level. Use these:

| Level | Trivial | Low | Moderate | High | Severe | Extreme |
|---|---|---|---|---|---|---|
| 1 | 13 | 14 | 15 | 16 | 18 | 20 |
| 3 | 15 | 16 | 18 | 19 | 21 | 23 |
| 5 | 17 | 18 | 20 | 22 | 24 | 26 |
| 7 | 19 | 20 | 23 | 25 | 27 | 29 |
| 10 | 22 | 23 | 26 | 28 | 30 | 33 |
| 15 | 28 | 29 | 32 | 34 | 36 | 39 |
| 20 | 34 | 35 | 38 | 40 | 42 | 45 |

**Default:** PC level Moderate (15 at lvl 1, 20 at lvl 5, etc.).

For specific tasks, see the GMC's task-DC tables. Common quick-DCs:
- "Simple lock": DC 15
- "Average lock": DC 20
- "Good lock": DC 25
- "Recall basic lore": DC 15 trained
- "Recall obscure lore": DC 25 trained

## Three-action economy

Each turn: **3 actions + 1 reaction + free actions.**

Common 1-action options:
- Strike (attack)
- Stride (move up to speed)
- Step (move 5 ft, no AoO)
- Demoralize, Feint, Trip, Grapple, Shove, Disarm
- Raise a Shield
- Cast a spell with action cost 1
- Interact (draw, drop, manipulate)
- Aid, Ready

**Multiple Attack Penalty:** second strike in turn at -5 (-4 with Agile); third at -10 (-8 with Agile). Plan turns with this in mind.

**2-action and 3-action options:** powerful spells, special activities, sustained effects. Read the action cost on each ability.

This is the tactical heart of PF2e. **Telegraph monster three-action turns** so the player can react.

## Damage and conditions

- **Critical hits:** double damage on a crit (PF2e). Includes precision damage but not extra dice from spells unless specified.
- **Critical specialization effects:** weapon group has a special crit effect (axe: damage spreads, hammer: knockdown, etc.). Apply when applicable.
- **Persistent damage:** ongoing damage of a type (bleed, fire, poison). Roll at end of turn; flat DC 15 to end (or by DC of source). Assist with appropriate action — DC drops to 10.
- **Conditions are formalized.** Read the rule. Common ones:
  - Frightened X: -X to checks and DCs; reduces by 1 each turn.
  - Sickened X: -X to checks and DCs; can spend action to make Fort save (DC 15 + condition value).
  - Stunned X: lose X actions. Deduct from 3 next turn. Reduces accordingly.
  - Slowed X: lose X actions per turn while slowed.
  - Quickened: gain 1 extra action per turn (specific use).
  - Off-guard (formerly flat-footed): -2 to AC.
  - Dying X: at 0 HP; dying value increases when damaged. Dying 4 = dead (or wounded condition pushes earlier).
  - Wounded X: increases dying value next time you go down. Recover via 10-minute treatment.

## Combat structure

**Initiative:** typically a Perception roll (or other skill if circumstance). 1d20 + Perception + level + proficiency. Some abilities use other skills (Stealth for ambush, Deception for tricking).

**Surprise:** don't use D&D-style "surprise round." Instead, the unaware side rolls Perception (or another) and is **off-guard** on round 1 if they fail.

**Movement and AoO:** by default, monsters and PCs do NOT have Attack of Opportunity unless the stat block / class grants it. Don't assume reach + melee = AoO. Check the block.

**Action: Strike:** the basic attack. Apply MAP if not the first strike of the turn.

**Action: Cast a Spell:** action cost varies. 1-action spells exist (focus spells, signature touches). 2-action is most common. 3-action spells are powerful.

## Encounter math (use it; it's reliable here)

PF2e encounter budget is solid. Use it.

**XP budget by relative level:**
- Party Level - 4: 10 XP
- Party Level - 3: 15 XP
- Party Level - 2: 20 XP
- Party Level - 1: 30 XP
- Party Level: 40 XP
- Party Level + 1: 60 XP
- Party Level + 2: 80 XP
- Party Level + 3: 120 XP
- Party Level + 4: 160 XP

**Threat budgets (party of 4 baseline):**
- Trivial: 40 XP
- Low: 60 XP
- Moderate: 80 XP
- Severe: 120 XP
- Extreme: 160 XP

**For duet (1 PC):** divide budget by 4 (default) or use 1.5×–2× modifier on individual creature CR (e.g., a "Severe" duet encounter is one creature 2 levels above PC). Alternatively, use a sidekick at CR PC-1 and run normal-budget encounters.

## Spellcasting

- **Spell slots** by level. Most casters use spontaneous or prepared.
- **Heightening:** spells cast at higher slot levels often gain effects. Read the heightened entry.
- **Spell Attack rolls** vs. AC. **Spell DC** = 10 + spellcasting modifier + proficiency + level.
- **Save spells:** target rolls vs. spell DC. Result determines effect (four degrees).
- **Focus spells:** powerful class abilities, regenerated by Refocus (10-min activity).

## Skill actions

PF2e formalizes skill use. Many skills have specific actions:

- **Acrobatics:** Balance, Tumble Through, Maneuver in Flight.
- **Athletics:** Climb, Force Open, Grapple, High Jump, Long Jump, Shove, Swim, Trip, Disarm.
- **Diplomacy:** Make an Impression, Request, Gather Information.
- **Intimidation:** Coerce, Demoralize.
- **Stealth:** Hide, Sneak, Avoid Notice.
- **Thievery:** Disable Device, Pick a Lock, Steal, Palm an Object.
- **Society:** Recall Knowledge, Subsist, Decipher Writing.

Each has a specific DC procedure and outcome by degrees of success. Look it up; don't improvise these wholesale.

## Treat Wounds and recovery

- **Treat Wounds:** Medicine check, 10 min; restore HP based on proficiency. DC 15 (trained) heals 2d8; higher DCs heal more.
- **Daily preparations:** spell slots refresh, focus pool refills, conditions reset.
- **Resting:** 8 hours; recover Con modifier × level HP (or full HP with Treat Wounds during rest); medical attention helps.

## Subsystems

PF2e includes formal subsystems. Use them when relevant — they add structure to specific scenarios:

- **Victory Points:** abstract progress mechanic for non-combat challenges.
- **Chase:** stage-based pursuit with point pools.
- **Influence:** courtly intrigue / persuasion across multiple scenes.
- **Infiltration:** stealth missions with complications.
- **Research:** multi-session investigation.
- **Reputation:** track standing with factions.

Most can be reskinned. They're a way to convert "we negotiate/chase/sneak for hours" into structured rolls with stakes.

## Hero Points

**1 Hero Point per session, refreshing.** Spend to:
- Reroll a check (take new result).
- Avoid death when at dying X (drops to dying 0 instead of failing recovery).

In duet, **be generous with Hero Point awards** for clever play, dramatic moments. They're the system's safety net.

## What PF2e does that 5e doesn't

- Formal skill actions (above).
- Critical specialization effects.
- Tighter math (modifiers matter; the DC ladder is real).
- Three-action economy (more decisions per turn).
- Reliable encounter math.
- Structured subsystems.

What this means for the GM:
- **Read stat blocks fully** before running. Don't wing it.
- **Use the four degrees of success** explicitly. Critical results matter.
- **Telegraph 3-action turns** so the player can react.
- **Don't fudge math.** PF2e's calibration depends on numbers being honored.

## Common rulings

- **Lifting check:** Athletics; DC by weight.
- **Recall Knowledge:** Lore (relevant) or other. DC by obscurity. Critical success = bonus info; failure = wrong info.
- **Aid:** ally takes Ready action; you make a check (typically DC 15 or 20). Success grants +1; crit success +2; crit fail -1.
- **Coverage:** light cover +1 AC, standard cover +2 AC, greater cover +4 AC. Apply by line of effect.
- **Flanking:** off-guard (-2 AC) when threatened by two adjacent enemies on opposite sides.

## Running PF2e in duet

PF2e is more demanding than 5e for solo play because the math is tighter. Recommendations:

- **Use the Free Archetype rule** to give the PC extra options.
- **Introduce a sidekick at PC level - 1** to add action economy.
- **Use Hero Points liberally.**
- **Telegraph everything.** A solo PC can't afford a missed critical save.
- **Apply non-death failure states** (capture, scarring) — PF2e's death spiral (dying X) can end campaigns.
