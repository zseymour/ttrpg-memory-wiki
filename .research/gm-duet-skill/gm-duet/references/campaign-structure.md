# Campaign Structure — Long-Form Play

This reference covers the architecture of multi-session play: arcs, factions, fronts, foreshadowing, and the running of a living world.

## Three-act campaign structure

For a 10–30 session campaign, use a three-act spine:

### Act I — Setup (early sessions, ~25-30% of campaign)
- Establish the world, the PC, the inciting threat.
- Low-level confrontations that introduce stakes.
- Introduce the eventual antagonist (distantly — rumors, agents, indirect harm).
- Plant seeds for major payoffs.
- End with a clear inciting incident — the PC commits to the larger arc.

### Act II — Confrontation (middle sessions, ~50% of campaign)
- Escalate threats; the PC takes real losses.
- Antagonist becomes specifically known.
- Introduce complications: false leads, betrayals, unexpected allies, internal conflict.
- **Midpoint reversal:** the situation changes fundamentally. A truth is revealed; an ally betrays; an apparent victory is hollow; the real stakes are exposed.
- Build toward the final confrontation.

### Act III — Resolution (final sessions, ~20-25%)
- Final confrontation in sight; preparation phase.
- Costs of the final push become clear.
- The PC commits irrevocably.
- Final confrontation.
- Dénouement — what does the PC's life look like after?

**This isn't a script.** It's a shape you fit the emergent play into. Play to find out *how* the PC reaches each beat.

## The Big Bad escalation pattern

The recurring villain should follow this five-step engagement curve:

1. **Distant rumors / agents / indirect harm.** PC hears about them. Encounters their work, not them.
2. **Encounter without confrontation.** PC sees the villain but cannot engage. (Telepresence, across a chasm, behind their guard.)
3. **Limited engagement.** PC fights the villain's lieutenants. Disrupts their plans. Makes them notice.
4. **Direct skirmish.** PC fights the villain — but the villain escapes (with cost: scar, broken artifact, lost minion).
5. **Final confrontation.** Climax fight with no escape route.

Pace this across the campaign. Step 1 is Act I. Steps 2–4 are Act II. Step 5 is Act III.

## Fronts (long-form prep, PbtA-style)

A **front** is a coherent set of related threats, motivated by a fundamental scarcity or driving force, pointing toward a **dark future** if the PC doesn't intervene.

Fronts are the long-form architecture of a campaign. Maintain in `factions.md`.

### Each front has:
- **Name** — evocative title.
- **Driving force** — the scarcity or motivation that gives the threat coherence (greed, fear, hunger, ideology, vengeance).
- **2–4 threats** — specific NPCs, factions, or forces that constitute the front.
- **Dark future** — what the world looks like in 6 months / 1 year / 3 years if the PC does nothing.
- **Stakes questions** — specific things you genuinely want to find out via play. ("Will the Duke ally with the cult to save his son?" "Does the PC's old mentor actually know about the conspiracy?")
- **Optional: custom moves** — moves specific to this front's threats.

### Two scales of fronts:
- **Adventure fronts** — immediate, current arc-level. Resolve in 3–10 sessions.
- **Campaign fronts** — slow-burn, multi-arc. Resolve in 20+ sessions.

Run 1–2 adventure fronts and 1–2 campaign fronts simultaneously. They overlap and intersect.

### Example front:
```
## Front: The Rotting Crown
Driving force: Decadence and inherited rot.
Threats:
  - Duke Cassivar — drunkard noble, inherited the throne, refusing to address the plague.
  - The Brotherhood of the Last Tide — apocalyptic cult promising salvation to plague victims.
  - The Plague itself — a magical pathogen, source unknown.
Dark future:
  - 3 months: cult openly recruits in slums.
  - 6 months: Duke is deposed; cult installs puppet.
  - 1 year: cult performs the Drowning Ritual; coastal cities sink.
Stakes questions:
  - Will the PC realize the Duke is being slowly poisoned?
  - Does the cult know the plague's true source?
  - Will the PC ally with the cult, the Duke, or neither?
```

## Faction clocks (Blades-style; usable in any system)

Every active faction gets a **clock** — a circle in 4, 6, or 8 segments. Each segment represents a step toward the faction's goal.

### Clock advancement:
- **Between sessions:** advance 1–3 segments based on faction logic. Was the PC opposing them? Helping them? Ignoring them?
- **During play:** advance when an offscreen factional event would logically occur. ("The cult performs another ritual; their clock ticks.")
- **PC actions:** the PC can advance or reverse clocks through deliberate action.

### Clock visibility:
**Show the major clocks openly to the player.** They drive tension. The PC seeing "Cult Ritual: 5/8 filled" is much more motivating than the GM keeping it secret.

### Clock types:
- **Faction goal clock** — what they're trying to achieve.
- **Race clock** — PC vs. faction (whoever fills first wins).
- **Linked clocks** — one fills, another starts.
- **Countdown** — segments tick down to a hard event.

### Faction maneuvers (between-session actions for offscreen factions):
1. **Seize claim** — take a turf, asset, contract.
2. **Gather information** — surveil the PC or rivals.
3. **Weaken enemy** — sabotage a rival.
4. **Acquire asset** — gain wealth, weapons, magic, contacts.
5. **Call in favor** — leverage a relationship.
6. **Apply pressure** — coerce, threaten, blackmail.

Roll d6 (or pick) per faction between sessions to determine their actions.

## The living world test

After every session, ask: **if the PC disappeared for a month, what would change in the world?**

If the answer is "nothing" — your world isn't living. NPCs and factions need to act on their own goals, not just react to the PC.

### What a living world looks like:
- The Duke holds his ball whether or not the PC attends.
- The cult performs its ritual on the new moon, regardless of whether the PC investigates.
- The PC's old friend gets married; the PC may or may not be invited.
- The plague spreads; another district falls quarantined.
- A war starts in a neighboring kingdom.

Update `timeline.md` with these offscreen events. The PC will hear about them through NPCs, news, rumors, and consequences.

## Foreshadowing and payoff

The most satisfying campaigns plant seeds early and pay them off late.

### Plant seeds via:
- **Background NPCs who become important.** The bartender mentioned in session 1 turns out to be the cult's spymaster in session 12.
- **Throwaway lore.** The PC overhears a phrase ("the Drowning Hour") that becomes critical later.
- **Visible objects.** A statue, a scar, a tattoo. Mentioned early; recontextualized later.
- **The PC's choices.** Decisions made early constrain options later.

### Payoff rules:
- **Earn it.** Don't have a planted seed pay off arbitrarily; tie it to PC choice or investigation.
- **Don't over-pay.** Not every seed needs to flower. Some are just texture.
- **Keep a payoff list.** In `campaign-state.md`, track planted hooks not yet paid off.

```
## Payoff list
- The barkeep's missing son (planted s2; not paid)
- The phrase "Drowning Hour" (planted s4; partially paid s9)
- The scar on the duke's hand (planted s1; not paid)
- The PC's mother's locket (planted s0; teased s7)
```

## Player Belief / Drive / Bond engagement

If the system has Beliefs (Burning Wheel), Bonds (PbtA, Dungeon World), Drives (Dragon Age), or Goals (any narrative system), **challenge them every session.**

Every session, look at the PC's BIT-equivalent. Construct at least one situation that puts pressure on it.

- Belief: "I will protect my sister at any cost." → Sister is captured by the faction the PC most needs to ally with.
- Drive: "Avenge my master." → A path opens that requires the PC to spare the master's killer.
- Bond: "I owe my life to the captain." → Captain orders the PC to do something the PC believes is wrong.

Pressure on the BIT is the engine of character development. **Reward** the player for engaging — Inspiration, Hero Points, Artha, Fate Points, Bennies, whatever the system uses.

If the player isn't earning these tokens, prompt them to rewrite their BITs. Stale BITs make stale play.

## Session-to-session continuity

### Every session ends with:

1. **Update `timeline.md`** with key events. Date, location, action, consequences.
2. **Update `npcs.md`** — status changes, new info, last interaction.
3. **Update `factions.md`** — clock states, goals, PC standing.
4. **Update `secrets.md`** — clues found, clues missed, new secrets to add.
5. **Update `rulings.md`** if any new rulings were made.
6. **Update `last-session-recap.md`** for next session's opening.
7. **Advance offscreen factions** 1–3 clock segments.
8. **Identify candidate strong start** for next session.

### Every session begins with:

1. **Read all state files.** Even if you "remember," confirm against the files.
2. **Deliver the recap.** Pull from `last-session-recap.md`. Player corrects/adds — their version is canon.
3. **Strong start.** Drop into action.

## Pacing across the campaign

Avoid these patterns:

- **Same-pitch every session.** Vary intensity. After a brutal session, give a quiet one. After a quiet stretch, raise the stakes.
- **All combat / all roleplay.** Mix the three pillars: combat, exploration, social. Even narrative-heavy duet benefits from occasional action.
- **Endless escalation.** The PC needs breathing room. Downtime, training, quiet character moments. Escalation without rest exhausts.
- **Stakes treadmill.** Don't always raise the stakes. Sometimes shift them sideways — a smaller, more intimate threat after a world-ending one.

## Downtime

Downtime is structurally important. Use it for:
- Healing, recovery, gear maintenance.
- Training (if the system has skills/abilities to train).
- Relationship-building with NPCs.
- Investigations the PC didn't make time for in-action.
- Faction politicking.
- The PC pursuing personal goals.

### Downtime structure (Blades-influenced):
- 2–4 actions per downtime.
- Each action is a single roll or short scene.
- Examples: long-term project, indulge vice, gather info, work a contact, train.

Update `factions.md` clocks for offscreen events during downtime. The world doesn't stop while the PC rests.

## Calendar tracking

Keep an in-game calendar in `campaign-state.md`. Track:
- Date.
- Day of the week (if relevant).
- Season, weather (for travel/exploration).
- Upcoming scheduled events (festivals, deadlines, faction milestones).

This is what makes downtime, faction clocks, and deadlines real. If the cult performs the ritual on the new moon and you're tracking the calendar, that's a real countdown — not a vague threat.

## The campaign Bible

Maintain a single document (or section of `campaign-state.md`) containing:

- **Setting bible:** key facts about the world that don't change. Geography, factions, magic rules, history.
- **Named NPCs:** even minor ones, alphabetized.
- **House rules:** any deviations from the published system.
- **Themes:** what the campaign is about, thematically. ("This is a campaign about the costs of loyalty.")
- **Off-limits / boundaries:** lines and veils.

Reference this when adding new content to ensure consistency.

## When the campaign should end

Most campaigns end when they should — Act III concludes. But some signs to watch for:

- **The PC's BIT has resolved.** Their main arc is complete.
- **The campaign front's dark future has either come to pass or been averted.**
- **The player is signaling fatigue or readiness for something new.**
- **You've been improvising for several sessions without strong direction.**

Don't drag a campaign past its natural ending. A dénouement session, then start something new (possibly with the same character, a sequel, or a new game entirely).

## Starting a sequel campaign

If the PC continues into a new arc:
- New campaign front; old fronts referenced as history.
- Time-skip is fine — months or years can pass between campaigns.
- The PC's earned reputation, contacts, and resources carry forward.
- The world has changed. NPCs have moved on (some dead, some elsewhere).
- New stakes, new themes.
