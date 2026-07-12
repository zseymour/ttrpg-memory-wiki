# D&D 5e / 5.5e — System-Specific Guide

## Resolution

**Core mechanic:** d20 + ability modifier + proficiency (if applicable) vs. DC.

**DC ladder:**
| Difficulty | DC |
|---|---|
| Very easy | 5 |
| Easy | 10 |
| Medium | 15 |
| Hard | 20 |
| Very hard | 25 |
| Nearly impossible | 30 |

**Default to 10/15/20.** Use 15 unless reason to deviate. Set DC before the roll.

**Advantage / disadvantage:** roll 2d20, take higher / lower. Stack at most ±1; multiple sources don't compound. If both apply, they cancel. Grant generously for clever play.

**Critical:** nat 20 on attacks always hits and crits (double damage dice). Nat 1 on attacks always misses. Skill checks: no auto-success/auto-fail unless house-ruled.

**Saving throws:** d20 + ability modifier + proficiency (if proficient in that save). Don't forget proficiency on saves matching class proficiencies.

## Combat

**Initiative:** d20 + Dex modifier. Track explicitly. Ties broken by Dex score, then PC over NPC, then GM call.

**Action economy per turn:**
- Action (attack, cast spell, dash, dodge, help, hide, ready, search, etc.)
- Bonus action (only if a feature grants one — not free)
- Movement (up to speed; can split before/after action)
- Reaction (one per round, off-turn)
- Free interaction (open door, draw weapon — one per turn unless using item-use action)
- Object interaction (one free per turn — drawing a different weapon, drinking a potion uses an action)

**Attack roll:** d20 + ability modifier + proficiency vs. AC.
**Damage:** weapon dice + ability modifier (Str for melee, Dex for finesse/ranged) + bonuses.

**Spell attacks:** d20 + spellcasting ability + proficiency vs. AC.
**Spell saves:** target rolls vs. DC = 8 + spellcasting ability + proficiency.

**Concentration:** caster makes Con save when damaged, DC = max(10, half damage taken). Failure ends the spell.

**Death saves:** at 0 HP, on each turn make a d20 roll. ≥10 = success. <10 = failure. Three successes = stable. Three failures = dead. Nat 20 = pop back at 1 HP. Nat 1 = two failures.

**Healing:** any healing brings PC from 0 to that amount. Stable PC at 0 HP wakes after 1d4 hours at 1 HP.

## Conditions (memorize the common ones)

- **Blinded:** auto-fail sight checks; attacks against have advantage; attacks made have disadvantage.
- **Charmed:** can't attack the charmer; charmer has advantage on social interactions.
- **Frightened:** disadvantage on checks/attacks while source visible; can't move closer to source.
- **Grappled:** speed becomes 0; ends if grappler is incapacitated.
- **Incapacitated:** can't take actions or reactions.
- **Invisible:** attacks against have disadvantage; attacks made have advantage; heavily obscured for hiding.
- **Paralyzed:** incapacitated; can't move/speak; auto-fail Str/Dex saves; attacks against have advantage; melee hits crit.
- **Poisoned:** disadvantage on attacks and ability checks.
- **Prone:** crawl-only; melee attacks against have advantage; ranged attacks against have disadvantage.
- **Restrained:** speed 0; attacks against have advantage; attacks made have disadvantage; Dex saves disadvantaged.
- **Stunned:** incapacitated; can't move; auto-fail Str/Dex saves; attacks against have advantage.
- **Unconscious:** prone + incapacitated; auto-fail Str/Dex saves; attacks against have advantage; melee hits crit.
- **Exhaustion:** stacks 1-6. 1=dis on checks, 2=speed half, 3=dis on attacks/saves, 4=HP max half, 5=speed 0, 6=dead.

## The Three Pillars

5e is built on three pillars; balance them. In duet especially:

1. **Combat** — tactical resolution. Tend to over-emphasize.
2. **Exploration** — travel, environment, dungeon-crawling. Often under-used.
3. **Social** — NPC interaction. Use reaction rolls when disposition isn't pre-set.

Most 5e campaigns drift combat-heavy. Deliberately frame exploration scenes (travel, environmental challenge, mystery) and social scenes (negotiation, faction politics, romance).

## The adventuring day

Class balance assumes 6–8 medium-hard encounters between long rests. Solo PCs can't sustain this — apply duet combat dials (`references/duet-deep-dive.md`).

For duet specifically: 2–3 encounters per session is plenty. Use **gritty realism** rest variant if you want fewer rests: short rest = 8 hours, long rest = 7 days.

## Inspiration / Heroic Inspiration (5.5e)

A token granted for good roleplay, clever play, or BIT-engagement. Spend for advantage on a roll. **Award liberally** in duet — it's the system's safety net.

In 5.5e: Heroic Inspiration is the default; player may have one at a time; use freely.

## Bounded Accuracy reminder

5e's math is "bounded" — high-level enemies aren't unhittable by low-level PCs. A Goblin attacks at +4. A Pit Fiend attacks at +14. An ancient red dragon's AC is 22. Don't over-stack modifiers; the system is calibrated for narrow numbers.

## Encounter math (use cautiously)

The DMG XP-budget math is unreliable past tier 1. Use Sly Flourish's heuristic for 5e:

**Lazy Encounter Benchmark:**
- Sum total monster HP × average damage. If less than party total HP × ~1.5, it's easy.
- For duet: use ~25-50% of standard CR-budget recommendations.

**Rule of thumb for one PC:**
- Easy: 1 enemy CR ≤ ¼ PC level.
- Medium: 1 enemy CR ≤ ½ PC level.
- Hard: 1 enemy CR ≈ PC level (apply action-oriented adjustments).
- Deadly: 1 enemy CR > PC level (telegraph; offer escape route).

## Action-oriented bosses for duet

Standard stat blocks underperform against solo bosses. Apply Colville-style:
1. Double or triple HP.
2. Add 2+ reactions.
3. Add 3 villain actions (one per round on init 20).
4. Optional legendary resistance (1–3/day).

See `references/encounters.md` for full procedure.

## Skill list quick reference

**Strength:** Athletics.
**Dexterity:** Acrobatics, Sleight of Hand, Stealth.
**Constitution:** (no skills; saves only).
**Intelligence:** Arcana, History, Investigation, Nature, Religion.
**Wisdom:** Animal Handling, Insight, Medicine, Perception, Survival.
**Charisma:** Deception, Intimidation, Performance, Persuasion.

When the player describes an action, identify the most fitting skill. Don't quibble — if Persuasion or Deception both fit, let the player pick.

## Spellcasting cheat-sheet

**Spell slots:** consumed when casting at that level or higher. Recover on long rest (most classes) or short rest (Warlocks). Track explicitly.

**Concentration:** only one concentration spell at a time. New concentration spell ends old one.

**Ritual casting:** some spells can be cast as 10-minute rituals without consuming a slot, if class allows.

**Counterspell:** reaction; opposed Arcana check (or auto-success if cast at higher level than target). DC = 10 + spell level.

## Common rules calls

**Stealth:** PC rolls Stealth vs. passive Perception of all enemies in the area. Hidden until they act or break line of sight.

**Tracking:** Survival check; DC depends on terrain, weather, time elapsed. Default 10 (clear/recent), 15 (dim/older), 20 (faded/obscured).

**Lockpicking:** Sleight of Hand vs. DC set by lock quality (10/15/20/25). Failure can break tools (fail-forward). Time taken is a fictional consideration.

**Falling damage:** 1d6 per 10 feet, up to 20d6.

**Suffocation:** can hold breath for 1 + Con modifier minutes (min 30 sec). Then 0 HP at end of that window.

**Drowning:** like suffocation but in water; usually combined with movement loss.

**Long rest:** 8 hours; restores HP, half Hit Dice, all spell slots, most class features. Once per 24 hours.

**Short rest:** 1 hour; spend Hit Dice for healing; restores some class features.

## Variant rules to consider

- **Flanking:** ±2 or advantage. Speeds combat but encourages "everyone wants flank." Use selectively in duet.
- **Healing potions as bonus action:** speeds combat, more PC survivability. Recommended for duet.
- **Slow Natural Healing:** no HP from long rest unless using Hit Dice. Makes resting more impactful.
- **Gritty Realism:** short rest = 8 hours, long rest = 7 days. Makes resources matter.
- **Action options (DMG):** climb onto bigger creature, disarm, mark, overrun, shove aside, tumble. Add tactical depth.

Discuss at session zero which variants you're using.

## When in doubt

Rule fast, log it in `rulings.md`, move on. The default 5e advice "rule consistent and quick" trumps "rule technically correct." Don't slow play for niche corner cases.
