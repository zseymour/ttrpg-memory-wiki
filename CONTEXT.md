# TTRPG Campaign Memory

The domain of durable knowledge an AI game master needs to maintain coherent duet play across turns and sessions.

## Language

**Campaign memory**:
The durable, inspectable body of play history, current fictional and mechanical state, entities and relationships, rules references and campaign rulings, perspectives, unrevealed material, preparation, open threads, uncertainty, and provenance for one campaign.
_Avoid_: Game state, agent memory, campaign wiki

**Authoritative record**:
The logical body of durable records whose accepted operations govern campaign memory, independently of how those records are physically stored. Pages, indexes, embeddings, recaps, and other projections are not authoritative unless explicitly included in that boundary.
_Avoid_: Single source file, current page, canonical truth

**Memory item**:
An independently addressable unit in the authoritative record with an explicit semantic role, a fixed semantic envelope, and extensible typed content. A memory item may be a referential anchor, an assertion, a structured artifact, or a normative item; content kinds cannot redefine or bypass applicable identity, epistemic, authority, temporal, uncertainty, provenance, or lifecycle semantics.
_Avoid_: Page, document, undifferentiated fact

**Content kind**:
An extensible, typed shape for campaign-, ruleset-, or framework-specific information that declares an existing semantic role and which core semantic axes apply. Content kinds may add fields, relations, and validation but cannot introduce a competing truth, authority, time, uncertainty, provenance, or lifecycle model.
_Avoid_: New semantic role, universal schema field, untyped extension

**Referential anchor**:
A stable subject of reference that carries no proposition merely by existing. Names, attributes, equivalences, and existence within the fiction require separate assertions rather than inhering in the anchor.
_Avoid_: Entity fact, canonical record, asserted existence

**Proposition**:
A claim-shaped meaning that can be referenced independently while carrying no truth, perspective, or disclosure standing on its own. The same proposition may be established, prepared, believed, suspected, or made known through separate qualified relations.
_Avoid_: Fact, assertion, sentence

**Assertion**:
An attributed, provenance-bearing stance toward a proposition, such as establishment, preparation, belief, or suspicion. Multiple assertions may qualify the same proposition without overwriting one another.
_Avoid_: Proposition, exclusive status, page metadata

**Structured artifact**:
A memory item whose identity and lifecycle organize related domain material without asserting that every linked proposition is true. Threads and open questions are structured artifacts rather than containers that confer standing on their contents.
_Avoid_: Page, assertion bundle, truth container

**Normative item**:
A memory item that governs adjudication for a defined scope rather than describing what is true in the fiction. Campaign rulings are normative items; their authority and provenance remain explicit.
_Avoid_: Established truth, system rule copy, mechanical state

**Memory subsystem**:
The boundary responsible for representing, validating, storing, reconciling explicit operations on, and retrieving campaign memory, including assembling bounded context for an AI game master. Agentic decisions about what play establishes, preparation, maintenance, and user experience are outside this boundary except as consumers or producers of memory contracts.
_Avoid_: GM agent, campaign manager, wiki

**Memory requirement**:
A behavioral capability campaign memory must provide so an AI game master can conduct coherent long-running play. GM procedures supply motivating scenarios; file boundaries, document formats, indexes, and read or update workflows are storage proposals rather than memory requirements.
_Avoid_: Template field, file requirement, storage requirement

**Preparation**:
Provisional material created to help future play produce coherent, satisfying developments; it is not truth. When play realizes prepared material, a separately authorized assertion establishes only what occurred and links to the preparation, while unused details retain their provisional standing.
_Avoid_: Canon, established fact

**Established truth**:
The narrowest proposition required by the shared fiction or an adjudicated outcome. Private explanations, motives, and causes remain preparation while multiple explanations still fit what play has established.
_Avoid_: GM intention, prepared fact, possible explanation

**Belief**:
A proposition a particular fictional entity accepts as true, whether or not it is established truth.
_Avoid_: Fact, knowledge

**Suspicion**:
A proposition a particular fictional entity considers possible without accepting it as true.
_Avoid_: Belief, fact

**Open question**:
A question deliberately left unresolved among multiple possibilities compatible with established truth.
_Avoid_: Secret, missing fact

**Entity awareness**:
What a fictional entity capable of perspective has perceived or been told, independently of whether it believes the proposition or whether the proposition is established truth.
_Avoid_: Knowledge, belief, player awareness

**Player awareness**:
What has been communicated to or deliberately inspected by the human player, independently of what the player character believes or suspects.
_Avoid_: PC knowledge, player-accessible information

**Unrevealed material**:
Established truth or preparation that has not been communicated through play. It may remain inspectable without granting awareness to the player character.
_Avoid_: Secret, GM-only status, inaccessible information, PC knowledge

**Fictional time**:
When an event occurs or a state holds within the campaign world. Fictional time may be exact, relative, or uncertain.
_Avoid_: Session order, recording time

**Establishment order**:
The order in which play establishes, revises, or retracts propositions, independently of when their subjects occur in fictional time.
_Avoid_: Fictional chronology

**Establishment mode**:
The provenance qualification describing how an assertion entered campaign memory, such as direct portrayal, participant narration, adjudication, baseline establishment, or authorized offscreen narration. It preserves establishment context without creating grades of established truth or granting authority by itself.
_Avoid_: Observed truth, evidentiary tier, session history

**Current established state**:
The established propositions that hold at the campaign's present fictional time. It is a temporal view that preserves earlier established states at their respective fictional times rather than replacing them.
_Avoid_: Current canon, mutable truth snapshot, latest record

**State transition**:
A change within the fiction from one established state to another. Earlier and later states remain true at their respective fictional times.
_Avoid_: Correction, rewind

**Correction**:
The replacement of an erroneous proposition that should not be treated as part of fictional history.
_Avoid_: State transition

**Rewind**:
The deliberate removal or replacement of previously established content through collaborative revision or a safety tool. Rewound content must not return to play and may require erasure rather than retention.
_Avoid_: State transition, ordinary correction

**Offscreen advancement**:
The preparation activity that decides how the world changes outside portrayed scenes. A campaign-memory consumer performs offscreen advancement; the memory subsystem preserves, surfaces, and records its inputs and results.
_Avoid_: Automatic clock advancement, memory maintenance

**Provenance**:
The claim-scoped support graph for an assertion or campaign ruling, including who or what introduced it, its authority and establishment context, the narrow claims and sources that support it, and any derivation links. A source supports only the attributed claim and does not confer established standing by itself.
_Avoid_: Container history, single origin field, optional annotation, truth by source, full transcript

**Baseline establishment**:
The explicit introduction of a campaign premise as established truth during campaign initialization or session zero. Material imported at the same time remains preparation, perspective, or rules material unless its producer designates it as baseline establishment.
_Avoid_: Preparation import, implicit truth by import

**System corpus**:
The complete game-reference knowledge available to the game master, including rules, playbooks, equipment, abilities, stat blocks, bestiaries, and procedures. It is managed outside campaign memory but composed with campaign memory for play.
_Avoid_: Campaign memory, campaign rulings

**Campaign ruling**:
An authorized normative memory item that interprets, supplements, or creates an exception to the system corpus for a defined campaign scope. It remains distinct from established fictional truth and mechanical state, and preserves the rule reference and provenance that explain its authority.
_Avoid_: System rule copy, established truth, mechanical state

**Recall situation**:
A concrete GM activity that requires a bounded projection of campaign memory, such as resuming a scene, voicing an NPC, adjudicating under precedent, advancing time, preparing play, or resolving a contradiction.
_Avoid_: File read, global memory dump

**Bounded context**:
The smallest inspectable projection that preserves the continuity, constraints, uncertainty, and provenance relevant to a recall situation, with references available for deeper inspection.
_Avoid_: Complete campaign memory, summary without provenance

**Recall-critical information**:
Information that a recall situation cannot safely omit, including applicable safety constraints, corrections and rewinds, relevant current state and prior commitments, epistemic status, and material uncertainty or contradiction.
_Avoid_: Optional enrichment, relevance hint

**Recall gap**:
An explicit indication that recall-critical information cannot be supplied within the available context or confidence, preventing a consumer from treating an incomplete result as authoritative.
_Avoid_: Confident omission, empty result

**Safety boundary**:
A current player-defined constraint on content or portrayal that applies to every recall situation. Safety boundaries override preparation, historical completeness, and provenance retention; an erasure request removes the affected content rather than preserving a hidden copy.
_Avoid_: Preference, historical setting, optional filter

**Continuity conflict**:
Two or more incompatible propositions claiming established standing about campaign history or state without an authoritative resolution. Incompatible preparation, beliefs, or suspicions may coexist without becoming a continuity conflict; campaign memory preserves and explains competing established truths until play resolves them.
_Avoid_: Correction, open question, automatic last-write-wins

**Narrative authority**:
The standing or situational permission for a participant or procedure to establish particular parts of the fiction. A contribution's authority context distinguishes establishment from proposal, belief, suspicion, or question.
_Avoid_: Speaker identity, unrestricted co-authorship

**Entity identity**:
The continuity of a fictional person, group, place, object, or other subject independently of its names, titles, disguises, and roles. Established equivalence is distinct from provisional links and actor beliefs or suspicions about identity.
_Avoid_: Display name, unique name, record merge

**Identity equivalence**:
An established proposition that two or more referential anchors denote the same fictional entity while preserving each anchor and its historical references. A belief or suspicion of equivalence remains a perspective rather than resolving entity identity.
_Avoid_: Record merge, alias match, provisional link

**Event**:
A referential anchor for a possible or actual occurrence whose existence does not establish that the occurrence happened. Occurrence, fictional time, participants, causes, consequences, and perspectives remain independently qualified assertions.
_Avoid_: Session entry, established occurrence, assertion bundle

**Relationship**:
The assembled, time-sensitive view of independently qualified assertions, interactions, and commitments among entities, including each actor's potentially asymmetric perspective. A named bond such as a marriage, oath, or treaty may have its own identity, while labels such as ally or rival remain summaries rather than complete relationship facts.
_Avoid_: Undirected status, single disposition label

**Thread**:
An explicit structured artifact for an unresolved matter created or made materially salient through play, linking the questions, assertions, entities, events, and preparation relevant to its future development. Unused hooks, planned payoffs, and insignificant unknowns do not become Threads merely by being unresolved.
_Avoid_: Plot, unused hook, all GM preparation

**Clue**:
A detail capable of informing an investigative question or supporting one or more possible conclusions. Its investigative role is independent of whether it is prepared, available, discovered, interpreted, unavailable, redeployable, or discarded.
_Avoid_: Conclusion, established truth, only discovered evidence

**Investigative question**:
An unresolved question pursued through clues. Its resolution mode is fixed when an established answer already exists, emergent when an authorized procedure will establish the answer, or hybrid when established constraints bound an otherwise open answer.
_Avoid_: Clue, automatically fixed solution

**Play context**:
The active conversation and immediate transcript that drive current play and may contain substantially more evocative and incidental detail than campaign memory preserves.
_Avoid_: Campaign memory, permanent transcript archive

**Durable information**:
Information preserved beyond the current play context because future consequence, continuity, perspective, player salience, preparation dependencies, or explicit promotion may make it relevant again.
_Avoid_: Every narrated detail, plot-only fact

**Player guidance**:
Player input that shapes play as a safety boundary, explicit preference, current wish, observed affinity, or shared campaign premise. Guidance is durable only while future decisions depend on it; safety boundaries remain mandatory while active.
_Avoid_: Uniform preference, every session-zero answer

**GM framework**:
An optional preparation or reasoning vocabulary such as Fronts, clocks, secret lists, node graphs, or campaign acts. Campaign memory may preserve framework-native artifacts without making the framework a universal domain requirement.
_Avoid_: Required memory primitive, universal campaign structure

**Memory failure**:
A failure caused by campaign memory being unable to preserve, distinguish, reconcile, or retrieve durable campaign information. Poor narration, pacing, adjudication, encounter design, or agency remains a GM failure even when better recall could help.
_Avoid_: Every GM failure, undesired story outcome

**Mechanical state**:
Campaign-specific instances and transitions governed by the system corpus, including character configuration, resources, inventory, conditions, progression, and active effects. Their general definitions and rules remain in the system corpus.
_Avoid_: Complete rules text, rules adjudication

**Uncertainty**:
Durable, scoped qualification of what campaign memory does not establish exactly, distinguished as unknown, partially known, unresolved, disputed, unrecorded, or provisional. Known bounds and alternatives remain explicit; model or retrieval confidence is operational metadata rather than a degree of established truth.
_Avoid_: Generic confidence score, guessed precision, generic unknown, probability on established truth

**Unrecorded**:
The uncertainty standing where campaign memory contains no qualifying assertion for a proposition and therefore establishes neither the proposition nor its negation. Negative conclusions require explicit assertions unless a content kind declares an exhaustive domain for the relevant scope and fictional time.
_Avoid_: False, empty means none, implicit negation

**Recap**:
An attributed, consumer-generated view of campaign memory for orientation or reflection. Its emphasis may evidence salience or perspective, but generating and tuning recap prose is outside the memory subsystem.
_Avoid_: Authoritative history, memory update workflow

**Memory maintainer**:
An autonomous or human-directed consumer that interprets and transforms campaign memory through read-write contracts, such as by extracting durable information or performing semantic compaction. It may ship with the memory service while remaining semantically distinct from the memory subsystem.
_Avoid_: Memory subsystem, physical storage optimization

**Duet play**:
A tabletop roleplaying arrangement with one human player and one AI game master.
_Avoid_: Solo play, multiplayer play

**Representative fixture**:
A bounded ruleset or authored-source example selected to expose materially different campaign-memory adapter requirements. It tests the system-agnostic boundary without promising complete ruleset support or prescribing a universal schema.
_Avoid_: Supported ruleset, reference implementation, universal example

**Authored source**:
Inspectable rules, scenarios, preparation, or participant-authored material created outside play and offered for reference or campaign use. Authorship and publication authority do not by themselves establish campaign truth.
_Avoid_: Source document, imported truth, campaign history
