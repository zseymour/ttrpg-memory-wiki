# TTRPG Campaign Memory

The domain of durable knowledge an AI game master needs to maintain coherent duet play across turns and sessions.

## Language

**Campaign memory**:
The durable, inspectable body of play history, current fictional and mechanical state, entities and relationships, rules references and campaign rulings, perspectives, unrevealed material, preparation, open threads, uncertainty, and provenance for one campaign.
_Avoid_: Game state, agent memory, campaign wiki

**Authoritative record**:
The logical body of durable records whose accepted operations govern campaign memory, independently of how those records are physically stored. Pages, indexes, embeddings, recaps, and other projections are not authoritative unless explicitly included in that boundary.
_Avoid_: Single source file, current page, canonical truth

**Campaign export**:
A self-contained representation of one campaign's Authoritative record sufficient to replay accepted operations and reproduce item identity, Lifecycle standing, authority context, conflicts, uncertainty, provenance, and permitted erasure markers. Derived views and optional source archives are not required to restore authoritative meaning.
_Avoid_: Current-state snapshot, index backup, source re-extraction

**Memory operation**:
An explicit, attributed proposal or accepted change to campaign memory whose semantic intent and lifecycle effect are validated before it enters the authoritative record. Human-facing tools may compile direct edits into memory operations, but raw mutation never silently changes authoritative standing.
_Avoid_: File edit, unvalidated mutation, implicit update

**Accepted operation**:
A Memory operation committed after the originating act and recording procedure satisfy their delegated authority, its meaning is unambiguous enough to preserve narrowly, and campaign-memory invariants validate. All item-level effects enter one establishment-order position or none do; model confidence alone cannot grant acceptance, and authority gaps, material ambiguity, or unresolved conflicts remain explicit.
_Avoid_: Human-approved fact, confidence threshold, inferred authority

**Operation receipt**:
A non-authoritative record that a proposed Memory operation was accepted or rejected, preserving enough identity, attribution, disposition, reason, and timing to make retries and authority decisions inspectable. Rejected payload retention is governed separately, and neither rejection receipts nor rejected content may enter campaign recall.
_Avoid_: Rejected Memory item, permanent rejected payload, recall candidate

**Semantic precondition**:
An explicit assumption about the identity, version, standing, or relationship of Memory items on which a proposed operation depends. A changed precondition causes revalidation or an explicit conflict rather than silent overwrite, while unrelated changes need not invalidate the proposal.
_Avoid_: Whole-campaign lock, timestamp precedence, implicit assumption

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
The campaign-wide order in which accepted operations establish, revise, or retract propositions, independently of when their subjects occur in fictional time. Every accepted operation occupies one position so history can be replayed without using wall-clock timestamps as semantic precedence.
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

**Lifecycle standing**:
The deterministic view of a Memory item's applicability at an establishment-order position, derived from its accepted creation and lifecycle operations. It is not an independently editable status; changing standing requires another explicit authorized operation.
_Avoid_: Mutable status flag, latest serialized value, co-authoritative snapshot

**Lifecycle history**:
The establishment-ordered chain of accepted operations and prior Lifecycle standings for campaign memory. Ordinary correction, retraction, supersession, and rewind preserve it for inspection and replay; only explicit Erasure may remove protected content from it.
_Avoid_: Fictional history, mutable audit note, current-state snapshot

**Correction**:
The replacement of a record or contribution that was erroneous relative to what its authorized act established and therefore should not be treated as fictional history. A faithful record of fiction the participants later choose to revise requires Rewind; corrected content remains inspectable as lifecycle history unless Erasure also applies.
_Avoid_: State transition

**Retraction**:
The attributed contributor's withdrawal of its own assertion or proposal without asserting the proposition's negation or declaring the contribution erroneous. A different authority changing the contribution's standing is a separate lifecycle act and must preserve the original attribution.
_Avoid_: Delete, correction, authority override

**Supersession**:
The explicit prospective replacement of a Memory item by another item serving the same continuing role or governed scope from a stated effective point. It preserves the predecessor's prior validity and cannot resolve conflicting established history merely because one assertion is newer.
_Avoid_: Latest write wins, correction, state transition

**Rewind**:
The deliberate removal or replacement of content that was validly established but the participants now revise through collaboration or a safety tool. Rewound content must not return to play and may require Erasure rather than ordinary lifecycle-history retention.
_Avoid_: State transition, ordinary correction

**Erasure**:
The exceptional destructive removal of affected content from the authoritative record and every retained or rebuildable derivative within the defined local boundary. It traces semantic descendants, removes or rewrites disclosures, preserves independently supported material with explicit provenance gaps, and leaves only non-revealing continuity markers where needed; safety and privacy override ordinary history retention.
_Avoid_: Retraction, hidden copy, soft delete

**Offscreen advancement**:
The preparation activity that decides how the world changes outside portrayed scenes. A campaign-memory consumer performs offscreen advancement; the memory subsystem preserves, surfaces, and records its inputs and results.
_Avoid_: Automatic clock advancement, memory maintenance

**Provenance**:
The claim-scoped support graph for an assertion or campaign ruling, including who or what introduced it, its authority and establishment context, narrow supporting claims or sources, and derivation links. Sources confer no standing by themselves, and correcting provenance requires an accepted operation that revalidates the affected standing and semantic descendants.
_Avoid_: Container history, single origin field, optional annotation, truth by source, full transcript

**Claim evidence**:
The narrow source excerpt or structured play contribution retained to make a consequential assertion or ruling inspectable, together with a stable source reference and attribution context. A complete transcript or source archive may exist separately by campaign policy but is neither required campaign memory nor authoritative.
_Avoid_: Full transcript provenance, source-free extraction, authoritative quotation

**Provenance gap**:
An explicit indication that some prior support for an assertion or ruling is unavailable or erased. It neither fabricates replacement support nor automatically removes independently established standing, but it must remain visible during inspection and reconciliation.
_Avoid_: Recall gap, broken link, inferred evidence

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

**Safety authority**:
The human player's non-delegable standing to set Safety boundaries and require safety rewind or Erasure without AI-GM approval or veto. A procedure may request only the minimum clarification needed to identify affected content and cannot require harmful material to be restated.
_Avoid_: Configurable veto, shared approval, ordinary narrative authority

**Continuity conflict**:
Two or more incompatible propositions claiming established standing about campaign history or state without an authoritative resolution. Incompatible preparation, beliefs, or suspicions may coexist without becoming a continuity conflict; campaign memory preserves and explains competing established truths until an explicit authorized resolution.
_Avoid_: Correction, open question, automatic last-write-wins

**Reconciliation**:
The authority-aware evaluation of new or conflicting contributions against accepted campaign memory. It preserves material conflict and proposes explicit lifecycle alternatives rather than inferring revision intent from recency, source class, or model confidence.
_Avoid_: Automatic merge, source precedence, conflict suppression

**Conflict resolution**:
An authorized operation that resolves a Continuity conflict by declaring its actual semantic effect, such as Correction, Rewind, temporal or identity qualification, or new establishment. Selecting a winner without accounting for the other assertions and their history is not a resolution.
_Avoid_: Winner flag, conflict dismissal, latest claim wins

**Narrative authority**:
The standing or situational permission for a participant or procedure to establish particular parts of the fiction. A contribution's authority context distinguishes establishment from proposal, belief, suspicion, or question.
_Avoid_: Speaker identity, unrestricted co-authorship

**Campaign authority**:
The root standing held by the human campaign owner, who may delegate bounded narrative or maintenance authority to participants and procedures. A contribution validly made within delegated authority retains its standing until an explicit lifecycle operation changes it.
_Avoid_: Human approval of every contribution, unrestricted AI authority, preference as revision

**Authority grant**:
An explicit, scoped delegation of Campaign authority to a participant or procedure for defined semantic acts. Its acceptance-time context remains part of provenance; later revocation is prospective and cannot silently invalidate operations validly accepted under the grant.
_Avoid_: Role name as permission, current-policy reinterpretation, retroactive revocation

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
An attributed, consumer-generated view of campaign memory for orientation or reflection. Its emphasis may evidence salience or perspective, but saving, approving, or editing its prose cannot confer authoritative standing on its claims.
_Avoid_: Authoritative history, assertion bundle, memory update workflow

**Derived view**:
A non-authoritative representation computed from accepted campaign memory for recall, navigation, or presentation, with enough source and version context to expose provenance and staleness. It may be discarded and rebuilt; adopting any claim it introduces requires a separate Memory operation.
_Avoid_: Authoritative copy, promoted summary, independent truth

**Memory producer**:
A participant, tool, or procedure configured to submit attributed Memory operations without thereby gaining authority to have them accepted. Authored sources supply evidence through a producer but never act, execute embedded instructions, or grant themselves standing.
_Avoid_: Source as actor, proposer as authority, untrusted instruction

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
