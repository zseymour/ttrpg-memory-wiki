# Knowledge-Memory Architectures for Campaign Memory

## Scope, evidence, and verdict method

This summary answers [issue #3](https://github.com/zseymour/ttrpg-memory-wiki/issues/3) inside the vocabulary and boundary of [`CONTEXT.md`](../CONTEXT.md). It compares architectures; it does **not** choose an implementation or an overall winner. “Authoritative record” means the durable source of record, not a claim that every stored proposition is **established truth**.

Evidence labels are deliberately unequal:

- **Proposal** describes an intended pattern, not verified software behavior.
- **Author/maintainer claim** is a first-party statement in a paper, blog, or README that has not been verified against implementation source.
- **Documented behavior** is stated in official product or protocol documentation.
- **Source-observed behavior** is visible in pinned source or schema.
- **Inference** is a campaign-memory consequence derived from that evidence; it is not a source claim.

The comparison uses only primary sources: authors' proposals/papers, official documentation, and pinned repository source. Benchmarks are reported as author measurements, not independently reproduced results. Each dimension receives one of four verdicts: **transfers** (the evidenced pattern directly satisfies the dimension in principle), **needs augmentation** (useful behavior exists but omits a required campaign distinction), **conflicts** (the evidenced behavior violates a requirement), or **unproven** (the source does not establish the behavior). A verdict applies only to the named dimension; none is an aggregate score.

The required dimensions are: authoritative record; claim evolution/provenance; identity/qualified relationships; linking; retrieval; maintenance/conflict handling; mediated human editing/inspectability; temporal separation; epistemic separation; safety erasure; and workload/scale.

## Cross-cutting conclusions

1. **A maintained wiki is a useful compilation surface, not by itself a trustworthy authoritative record.** Karpathy's proposal separates immutable raw sources from an LLM-maintained wiki and schema, while explicitly asking the agent to update pages as new sources arrive ([proposal](https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f)). That supports inspectable accumulation and links, but page text still collapses propositions unless claim status, authority, provenance, and evolution are represented separately. **Inference:** a page can be an authoring or recall projection without being the sole semantic unit of campaign memory.
2. **Page/file history is too coarse.** Git commits, Vercel OpenWiki page revisions, and MediaWiki revisions can show that a container changed; they do not by themselves explain which proposition was established, corrected, retracted, disputed, or merely reworded. Vercel's schema links a generated page revision to a repository revision, artifacts, and generation job ([pinned schema](https://github.com/vercel-labs/openwiki/blob/618dcaf862ede7f4e3103216f1de8e2956a84564/lib/storage.ts)); MediaWiki records revision parent, actor, timestamp, and comment ([revision schema](https://www.mediawiki.org/wiki/Manual:Revision_table)). **Inference:** claim-level lineage remains required above either mechanism.
3. **Two clocks are necessary but ordinary timestamps do not supply them.** SQL temporal facilities distinguish application-time and system-versioned time ([first-party account of SQL:2011's temporal features](https://sigmodrecord.org/publications/sigmodRecord/1209/pdfs/07.industry.kulkarni.pdf)); Graphiti models event and ingestion/transaction time ([paper](https://arxiv.org/abs/2501.13956)). This distinction is structurally relevant, but source/publication/ingest timestamps are not **fictional time**, and transaction order is not automatically **establishment order**. Fictional time can be relative or uncertain; establishment depends on narrative authority. Both require campaign semantics.
4. **Knowledge-graph edges do not establish campaign identity or relationships.** Graphiti and Mem0 extract entities and relations ([Graphiti paper](https://arxiv.org/abs/2501.13956), [Mem0 paper](https://arxiv.org/abs/2504.19413)); Datomic offers opaque entity identifiers and domain-unique lookup identities ([official identity documentation](https://docs.datomic.com/schema/identity.html)). **Inference:** opaque identity is a useful substrate, but aliases/slugs are not proof of stable **entity identity**, and an extracted edge does not encode provisional identity, actor belief, direction, qualification, or time-varying relationship history unless those are modeled explicitly.
5. **Relevance-only recall is insufficient.** The surveyed LLM-memory systems rank or traverse potentially relevant material; none documents a contract that deterministically includes all recall-critical safety constraints, current commitments, corrections/rewinds, epistemic status, and unresolved conflicts, then emits an explicit **Recall gap** when it cannot. This is **unproven**, not a negative benchmark result. Lint warnings, orphan detection, or broken-link findings are maintenance diagnostics—not Recall gaps.
6. **Conflict detection is not semantic reconciliation.** Text merge can preserve both edits while hiding incompatible propositions; an LLM choosing among operations including update and delete can silently choose one claim over another. Mem0 delegates ADD/UPDATE/DELETE/NOOP selection to its extraction/update pipeline ([paper](https://arxiv.org/abs/2504.19413)); MediaWiki detects concurrent revision conflicts ([official edit-conflict documentation](https://www.mediawiki.org/wiki/Help:Edit_conflict)). **Inference:** continuity conflicts need explicit proposition-level preservation and an authoritative resolution operation, not last-write-wins or merely a clean text merge.
7. **Audit retention conflicts with safety erasure unless an explicit destructive path reaches every copy.** Git history/revert and ordinary Datomic retraction retain prior values ([Git data model](https://git-scm.com/book/en/v2/Git-Internals-Git-Objects), [Datomic history](https://docs.datomic.com/client-tutorial/history.html)). MediaWiki RevisionDelete hides selected revision fields and can suppress them from most users, but retains them ([official RevisionDelete documentation](https://www.mediawiki.org/wiki/Help:RevisionDelete)). None is safety erasure. The authoritative record, histories, indexes, caches, embeddings, generated pages, recaps, and backups inside the defined local boundary need an erasure contract.
8. **No cited evidence proves campaign workload suitability.** Published evaluations measure conversational retrieval, latency, or memory benchmarks rather than hundreds of sessions' durable claims, revisions, links, provenance chains, rebuild cost, fictional-time uncertainty, and repeated corrections/rewinds ([Graphiti paper](https://arxiv.org/abs/2501.13956), [Mem0 paper](https://arxiv.org/abs/2504.19413)). No pass/fail threshold is inferred.

## Compact per-dimension matrix

Abbreviations: **K-wiki** = Karpathy proposal and verified descendants; **OW** = LangChain/Vercel OpenWiki lineage; **G** = Graphiti/Zep; **M0** = Mem0; **AM** = Anthropic's client-side memory tool. Detailed qualifications below control over the compact cells.

| Dimension | K-wiki | OW | G | M0 | AM |
|---|---|---|---|---|---|
| Authoritative record | needs augmentation | needs augmentation | needs augmentation | needs augmentation | needs augmentation |
| Claim evolution & provenance | needs augmentation | needs augmentation | needs augmentation | conflicts | needs augmentation |
| Identity & qualified relationships | unproven | unproven | needs augmentation | needs augmentation | unproven |
| Linking | transfers | needs augmentation | transfers | transfers | unproven |
| Recall-critical retrieval & Recall gaps | unproven | unproven | unproven | unproven | unproven |
| Maintenance & semantic conflicts | needs augmentation | needs augmentation | needs augmentation | conflicts | unproven |
| Mediated human editing & inspectability | needs augmentation | needs augmentation | unproven | unproven | needs augmentation |
| Fictional time vs establishment order | unproven | unproven | needs augmentation | unproven | unproven |
| Epistemic separation | needs augmentation | unproven | unproven | unproven | unproven |
| Safety erasure | conflicts | conflicts | unproven | unproven | unproven |
| Campaign workload & rebuild cost | unproven | unproven | unproven | unproven | unproven |

“Conflicts” for Mem0 claim evolution/maintenance is narrow: its extraction/update pipeline selects among ADD, UPDATE, DELETE, and NOOP, so an automated choice can replace a memory rather than preserve an unresolved semantic conflict; the paper does not establish campaign narrative authority ([Mem0 paper, §2.1 and Appendix B](https://arxiv.org/abs/2504.19413)). “Needs augmentation” for OpenWiki editing combines LangChain's inspectable local Markdown with the absence of a documented invariant-preserving human-edit path in either lineage. “Conflicts” for wiki safety erasure reflects retained immutable sources and Git/history copies, not ordinary deletion from a working page.

## Karpathy proposal and verified descendants

### Proposal: LLM Wiki

**Proposal.** Karpathy describes a three-part arrangement: immutable raw sources as the “source of truth,” a persistent interlinked Markdown wiki entirely written and maintained by an LLM, and a co-evolved schema/instruction layer; queries use an index-first traversal of the compiled wiki rather than repeatedly rediscovering raw documents ([gist](https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f)). The abstract proposal also describes an append-only operation log, notes that the wiki can be kept in Git as an optional tip, and sketches moderate scale as roughly 100 sources and hundreds of pages; these are proposed operating assumptions, not implementation measurements ([gist](https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f)).

**Campaign assessment.** Inspectability, source retention, links, and incremental maintenance **transfer**. The proposal **needs augmentation** for proposition-level provenance and status. Identity, qualified relationships, fictional time, establishment order, narrative authority, player awareness, continuity-conflict mediation, deterministic recall-critical inclusion, and Recall gaps are **unproven**. Because raw sources are intentionally immutable, their retention **conflicts** with safety erasure unless every affected authoritative and derived copy is destructively handled; Git history, when used, adds another retained copy.

### green-dalii/obsidian-llm-wiki

**Source-observed/documented behavior.** At commit [`0979d50`](https://github.com/green-dalii/obsidian-llm-wiki/commit/0979d50aefcc3ca20dad7dd379082572fdc3dd36), the manifest reports version `1.24.0`, and the commit metadata dates the release bump to **July 10, 2026** ([manifest](https://github.com/green-dalii/obsidian-llm-wiki/blob/0979d50aefcc3ca20dad7dd379082572fdc3dd36/manifest.json), [commit](https://github.com/green-dalii/obsidian-llm-wiki/commit/0979d50aefcc3ca20dad7dd379082572fdc3dd36)). Its README/changelog document multi-page generation, aliases/links, ingest/query/lint functions, graph retrieval, contradiction review, and per-task models ([pinned README](https://github.com/green-dalii/obsidian-llm-wiki/blob/0979d50aefcc3ca20dad7dd379082572fdc3dd36/README.md), [pinned changelog](https://github.com/green-dalii/obsidian-llm-wiki/blob/0979d50aefcc3ca20dad7dd379082572fdc3dd36/CHANGELOG.md)).

No Obsidian registry evidence was established here, so this report does **not** call the project official, registry-listed, or community-canonical. Aliases and pages improve navigation but do not prove stable entity identity. A contradiction detector or lint finding is not a continuity-conflict resolution record and is not a Recall gap. The descendant therefore **needs augmentation** for authoritative proposition operations, qualified temporal relations, authority/status, mediated writes, and deterministic recall; safety erasure and campaign scale remain **unproven** except that retained Git history is not erasure.

### Ar9av/obsidian-wiki and Astro-Han/karpathy-llm-wiki

**Documented behavior.** At commit [`2cc6426`](https://github.com/Ar9av/obsidian-wiki/tree/2cc64265e5218b646b782fca727c68a3b3b6d319), Ar9av describes a source manifest for delta ingest and inline tags distinguishing extracted, inferred, and ambiguous material ([pinned README](https://github.com/Ar9av/obsidian-wiki/blob/2cc64265e5218b646b782fca727c68a3b3b6d319/README.md)). At verified commit [`9e8c4f4`](https://github.com/Astro-Han/karpathy-llm-wiki/tree/9e8c4f44ce8d8f154494844a860cc6e9e49c8642), Astro-Han packages the proposal as an Agent Skill with `raw/`, `wiki/`, ingestion, query, cascade-update, and lint procedures ([README](https://github.com/Astro-Han/karpathy-llm-wiki/blob/9e8c4f44ce8d8f154494844a860cc6e9e49c8642/README.md), [skill](https://github.com/Astro-Han/karpathy-llm-wiki/blob/9e8c4f44ce8d8f154494844a860cc6e9e49c8642/SKILL.md)). These are verified descendants because they explicitly cite and instantiate Karpathy's proposal, not because they are endorsed implementations.

Ar9av's status tags are a useful epistemic seed (**needs augmentation**), but “extracted” does not equal established truth and ambiguity does not encode belief, suspicion, open question, preparation, or narrative authority. Visibility tags, where used, are content filters—not **player awareness**, which records what was communicated or deliberately inspected. Publication and collection timestamps are neither fictional time nor establishment order. Astro-Han's cascade and lint procedures support maintenance, but heuristic conflict findings do not establish semantic reconciliation; link/alias checks do not establish identity; lint findings are not Recall gaps. Neither source establishes safety erasure or campaign-scale performance.

## LangChain and Vercel OpenWiki lineage

These are related by product name and code-wiki purpose, but their storage/evolution behavior differs and must not be treated as one implementation.

### LangChain OpenWiki

**Documented/source-observed behavior.** LangChain's July 10 introduction describes a local-Markdown personal brain refreshed from scheduled connectors and says current retrieval operates over the filesystem wiki while better search and linking are future work ([first-party introduction](https://www.langchain.com/blog/introducing-openwiki-brains-general-purpose-wiki-memory-for-agents)). At pinned commit [`326a307`](https://github.com/langchain-ai/openwiki/tree/326a307203345128a60b92a356978c46e2992df3), the CLI generates and maintains local Markdown under `openwiki/`, gathers repository/Git evidence for updates, computes a content snapshot, and records update metadata only when generated content changes ([README](https://github.com/langchain-ai/openwiki/blob/326a307203345128a60b92a356978c46e2992df3/README.md), [workflow](https://github.com/langchain-ai/openwiki/blob/326a307203345128a60b92a356978c46e2992df3/openwiki/agent/workflow.md), [agent source](https://github.com/langchain-ai/openwiki/blob/326a307203345128a60b92a356978c46e2992df3/src/agent/index.ts)).

Local files, Git evidence, and source links **transfer** for inspectability and maintenance inputs, while inter-page linking **needs augmentation** because the first-party introduction describes better linking as future work. Generated Markdown plus Git **needs augmentation** as an authoritative record: a commit shows text evolution, not claim status or authority. The local Markdown is directly inspectable, but the pinned sources establish no mediated human-edit path that preserves campaign invariants, so that dimension **needs augmentation**. Git merges/reverts do not reconcile semantic conflicts and are not safety erasure. The pinned sources do not establish fictional-time modeling, player awareness, identity continuity, qualified relationships, deterministic recall-critical constraints, Recall gaps, or campaign workload behavior: all are **unproven**.

### Vercel Labs OpenWiki

**Documented/source-observed behavior.** At pinned commit [`618dcaf`](https://github.com/vercel-labs/openwiki/tree/618dcaf862ede7f4e3103216f1de8e2956a84564), generation is staged, pages carry source citations, deterministic quality checks run before publication, and a new repository revision is published atomically while the previous published wiki remains visible until success ([README](https://github.com/vercel-labs/openwiki/blob/618dcaf862ede7f4e3103216f1de8e2956a84564/README.md)). The storage schema has repository revisions, page revisions, generated artifacts, citations, and jobs, with a `current_revision_id` pointer for published pages ([storage source](https://github.com/vercel-labs/openwiki/blob/618dcaf862ede7f4e3103216f1de8e2956a84564/lib/storage.ts)).

Atomic publication and explicit generated lineage **transfer** as maintenance patterns. Page revision/job lineage **needs augmentation** for claim-level provenance. The source does not establish a mediated human-edit operation preserving campaign invariants, so human editing is **unproven** for this lineage; combined with LangChain's inspectable Markdown, the OpenWiki family-level dimension **needs augmentation**. Repository commit SHA and indexing timestamps are source/transaction metadata, not fictional time or establishment order. There is no evidenced epistemic separation, player awareness, semantic conflict object, Recall-gap contract, stable fictional identity, qualified relationship model, or safety-erasure cascade. Source citations support traceability but do not grant narrative authority.

## Materially distinct broader systems

### Graphiti/Zep temporal knowledge graph

**Author/maintainer claim and model.** The Zep paper describes an episode, semantic-entity, and community hierarchy; temporally aware entity/relation facts; hybrid retrieval; and two temporal dimensions for events and ingestion/transaction knowledge. It reports LongMemEval and Deep Memory Retrieval results measured by the authors ([paper](https://arxiv.org/abs/2501.13956)). Graphiti's open-source repository exposes entity edges with temporal validity/invalidation and search APIs ([repository](https://github.com/getzep/graphiti)).

**Verdicts.** Graph links and temporal fact invalidation **transfer**. The event/transaction distinction **needs augmentation**: extracted event time is not necessarily uncertain fictional time, and ingestion time does not encode narrative-authority-based establishment order. Entity extraction and edges **need augmentation** for stable identity, aliases/disguises as claims, beliefs/suspicions, and directional qualified relationship histories. Summaries and search are **unproven** for recall-critical completeness and Recall gaps. Invalidation is not demonstrated safety erasure. The paper's benchmarks do not measure campaign workloads, claim-authority fidelity, or semantic-conflict preservation.

### Mem0

**Author/maintainer claim and model.** Mem0 describes extraction followed by an update decision over candidate memories, with ADD, UPDATE, DELETE, and NOOP operations; its graph variant extracts entities and relations. The paper reports author-run accuracy, latency, and token measurements on conversational-memory benchmarks ([paper](https://arxiv.org/abs/2504.19413)); the implementation is available in the project's repository ([source](https://github.com/mem0ai/mem0)).

**Verdicts.** Selective durable-memory extraction and retrieval **transfer** as maintainer patterns, not as authoritative campaign semantics. Automated UPDATE/DELETE **conflicts** where incompatible propositions must remain an explicit continuity conflict rather than silently replacing one another; augmentation would need authority-aware operations and claim history. Entity/relation extraction **needs augmentation** for identity and qualified temporal perspective. The sources do not prove fictional time, establishment order, preparation/truth/belief separation, player awareness, Recall gaps, mediated local human editing, complete safety erasure, or campaign-scale rebuild behavior. Reported benchmark gains are not evidence for those axes.

### Anthropic memory tool (client-side)

**Documented behavior.** Anthropic documents a client-side memory tool through which Claude requests persistent file operations while the application executes the requests against storage it controls ([official memory documentation](https://platform.claude.com/docs/en/agents-and-tools/tool-use/memory-tool)). The documentation recommends that implementers impose file-size controls; it does not define service-side file or store capacity. Context editing and memory are described as separate mechanisms for managing long-running tasks ([official context-management documentation](https://platform.claude.com/docs/en/build-with-claude/context-windows)).

**Verdicts.** Client-controlled persistence and tool-mediated writes **transfer** as operational patterns. Whether the chosen backing store is directly inspectable remains **unproven**; the supplied local-filesystem helper is inspectable, but the protocol also permits databases, cloud storage, or encrypted files. Claim provenance and semantic-conflict handling are **unproven**, while mediated domain invariants **need augmentation** above the file-operation protocol. The tool does not establish a link model, campaign epistemic statuses, identity, relationships, fictional time, establishment order, or player awareness. Retrieval completeness, explicit Recall gaps, safety-erasure reach into derived context, and campaign-scale quality are **unproven**.

## Targeted non-LLM analogues

These are analogues exposing mature data/history patterns, not direct campaign-memory precedents.

### Bitemporal records — SQL temporal data

SQL:2011's identity is recorded by ISO ([catalog record](https://www.iso.org/standard/53682.html)); Kulkarni and Michels describe its application-time periods and system-versioned tables in their first-party account of the standard's temporal features ([paper](https://sigmodrecord.org/publications/sigmodRecord/1209/pdfs/07.industry.kulkarni.pdf)). Current PostgreSQL documentation separately describes range types useful for intervals but does not itself establish full campaign semantics ([PostgreSQL range documentation](https://www.postgresql.org/docs/current/rangetypes.html)). **Transfers:** keeping “when the subject is valid” separate from “when the record was known/stored,” and querying historical database states. **Needs augmentation:** fictional time may be relative, branching, or uncertain rather than a closed timestamp interval; establishment order includes authority and mode, not merely commit time. A correction differs from a state transition semantically even if both change rows. SQL does not supply continuity-conflict resolution, epistemic status, player awareness, Recall gaps, or safety erasure.

### Mature wiki revision workflow — MediaWiki

MediaWiki revisions carry parentage, actor, timestamp, comment, and deletion flags ([revision table](https://www.mediawiki.org/wiki/Manual:Revision_table)); edit conflicts are surfaced for human resolution ([edit conflicts](https://www.mediawiki.org/wiki/Help:Edit_conflict)); revision comparison and revert remain inspectable ([history help](https://www.mediawiki.org/wiki/Help:History)). **Transfers:** explicit revision identity, optimistic conflict detection, diffs, comments, and mediated human resolution. **Needs augmentation:** revisions are page-level, text merges can miss semantic incompatibility, and the model does not supply campaign epistemic or temporal distinctions. **Conflicts for erasure:** RevisionDelete hides content/user/comment fields and suppression narrows visibility, but the data is retained and potentially recoverable by privileged users ([RevisionDelete](https://www.mediawiki.org/wiki/Help:RevisionDelete)); it is hiding, not safety erasure.

### Fact-level transaction history — Datomic

Datomic represents facts as entity/attribute/value/transaction/added datoms and exposes historical/as-of views ([data model](https://docs.datomic.com/datomic-overview.html), [history](https://docs.datomic.com/client-tutorial/history.html)); entity ids are opaque and lookup identities can be domain-unique ([identity](https://docs.datomic.com/schema/identity.html)). **Transfers:** atomic fact granularity, immutable transaction ordering, inspectable assertions/retractions, as-of queries, and identity independent of display value. **Needs augmentation:** an assertion is not automatically established truth; transaction time is not establishment order; retraction does not distinguish correction, transition, and rewind; qualified relationships and epistemic statuses require domain attributes/operations. Ordinary history preserves retracted data, so it **conflicts** with safety erasure unless a separately evidenced destructive mechanism and derived-copy cascade is defined. This report makes no claim that Datomic's identity feature solves fictional aliases or disputed identity.

## Obsidian as a subsystem host

### Scope and candidate definitions

This supplement evaluates **Obsidian as the host and integration boundary**, not another LLM-wiki wrapper. The earlier Obsidian repositories were examined only as implementations or descendants of Karpathy's proposal; that does not establish what Obsidian's vault, editor, plugin API, or an external-core boundary can guarantee. This host comparison therefore supplements rather than replaces the earlier implementation analysis, uses the same evidence labels and verdict vocabulary, and selects no winner.

The candidates are deliberately bounded:

1. **Vault-native composition:** Markdown/frontmatter in the Obsidian vault is the durable record; core file/link behavior supplies editing and navigation; the only community-plugin dependency evaluated is **Dataview**, as a query/index projection. Dataview is registry-verified at pinned Obsidian registry commit [`093d18e`](https://github.com/obsidianmd/obsidian-releases/blob/093d18e7617fab30688dba90d1801c8f341da35e/community-plugins.json#L568-L574), and its pinned README says it extracts frontmatter/inline fields and supplies a query language and JavaScript API ([`5ad0994`](https://github.com/blacksmithgu/obsidian-dataview/blob/5ad0994ff384cbb797de382e7edff2388141b73a/README.md)). No semantic-search, Git, schema-menu, or sync plugin is assumed.
2. **Dedicated campaign-memory plugin:** one purpose-built Obsidian plugin owns the campaign operations and uses documented editor, vault, metadata, and plugin-storage APIs. This is a capability envelope, not evidence that such an implementation already exists.
3. **Independent core plus Obsidian adapter:** an independent campaign-memory core owns some or all domain behavior, while an Obsidian plugin and/or CLI-facing adapter projects into and accepts operations from the vault. “Independent” does not decide whether the core or vault is authoritative; that authority and reconciliation contract is part of the candidate's unresolved evidence.

### Obsidian-host candidate matrix

Every cell below is an **Inference** from the cited platform/plugin behavior, not a product benchmark or aggregate recommendation. Detailed qualifications control the cells.

| Dimension | Vault-native composition | Dedicated campaign plugin | Independent core + adapter |
|---|---|---|---|
| Authoritative record | needs augmentation | unproven | unproven |
| Claim evolution & provenance | unproven | unproven | unproven |
| Identity & qualified relationships | unproven | unproven | unproven |
| Linking | transfers | transfers | needs augmentation |
| Recall-critical retrieval & Recall gaps | unproven | unproven | unproven |
| Maintenance & semantic conflicts | needs augmentation | unproven | needs augmentation |
| Mediated human editing & inspectability | needs augmentation | needs augmentation | needs augmentation |
| Fictional time vs establishment order | unproven | unproven | unproven |
| Epistemic separation | unproven | unproven | unproven |
| Safety erasure | unproven | unproven | unproven |
| Campaign workload & rebuild cost | unproven | unproven | unproven |

The two **linking: transfers** cells cover Obsidian's core link representation and link-aware rename capability only. They depend on the user's link-update preference and, for a dedicated plugin, using `FileManager.renameFile()`; they do not establish stable entity identity or qualified relationships.

### Candidate 1 — vault-native composition

**Documented/source-observed capability.** Dataview treats vault Markdown as queryable data, extracting YAML frontmatter and inline fields ([pinned README](https://github.com/blacksmithgu/obsidian-dataview/blob/5ad0994ff384cbb797de382e7edff2388141b73a/README.md)). Its pinned source maintains in-memory indexes plus an IndexedDB cache, registers metadata/rename/delete listeners, indexes all Markdown files during initialization, and exposes a `reinitialize()` path that recreates the cache and reloads every Markdown file ([index source](https://github.com/blacksmithgu/obsidian-dataview/blob/5ad0994ff384cbb797de382e7edff2388141b73a/src/data-index/index.ts#L1-L153)). Obsidian's pinned API distinguishes raw `Vault.rename()` from `FileManager.renameFile()`, which updates links according to user preferences; only the latter establishes link-aware rename behavior ([`FileManager.renameFile`](https://github.com/obsidianmd/obsidian-api/blob/6e21f1f68d988243cd8ccd25b6417bd2adf93ee6/obsidian.d.ts#L2881-L2902), [`Vault.rename`](https://github.com/obsidianmd/obsidian-api/blob/6e21f1f68d988243cd8ccd25b6417bd2adf93ee6/obsidian.d.ts#L7450-L7458)).

**Campaign assessment (Inference).** Inspectable Markdown/frontmatter, link-aware rename through the correct API, and rebuildable query indexes **transfer** as storage/navigation/derived-view mechanisms. Frontmatter can represent and Dataview can query authored fields, but that representability does not establish proposition history, identity, qualified relationships, fictional time, establishment order, or epistemic separation; those dimensions remain **unproven**. Vault-native inspectability transfers, but direct human or external file edits do not pass through an evidenced invariant-preserving campaign operation, so mediated human editing **needs augmentation**. Dataview's index is a derived query projection; its listeners and rebuild path are not evidence of a transaction shared with the triggering vault write. Because the file layout is the durable record, decoupling the domain from Obsidian, Markdown/frontmatter shape, and plugin query semantics is also **unproven** and requires an explicit export/migration path. This composition is not treated as a coherent cross-plugin transaction model.

**Integration limit (source observation plus Inference).** The documented Obsidian write primitive `Vault.process(file, fn)` protects one named file from changing between read and write, and its callback is synchronous ([pinned developer guide](https://github.com/obsidianmd/obsidian-developer-docs/blob/2d0e942f03b23ed94ebda3c610ed074662ed63db/en/Plugins/Vault.md#L71-L92), [pinned API](https://github.com/obsidianmd/obsidian-api/blob/6e21f1f68d988243cd8ccd25b6417bd2adf93ee6/obsidian.d.ts#L7492-L7510)). The pinned API exposes file-at-a-time create/modify/process/delete/rename methods but no cross-file transaction entry point ([Vault API](https://github.com/obsidianmd/obsidian-api/blob/6e21f1f68d988243cd8ccd25b6417bd2adf93ee6/obsidian.d.ts#L7350-L7525)). **Inference:** a correction that must update several claims, links, summaries, and derived views needs an additional recovery/reconciliation protocol; neither frontmatter convention nor a collection of query features supplies one.

### Candidate 2 — dedicated campaign-memory plugin

**Documented/source-observed capability.** A plugin can register a CodeMirror 6 editor extension, persist plugin data with `loadData()`/`saveData()`, and use the vault/file-manager APIs ([pinned plugin API](https://github.com/obsidianmd/obsidian-api/blob/6e21f1f68d988243cd8ccd25b6417bd2adf93ee6/obsidian.d.ts#L4998-L5064); the official sample demonstrates the load/save pattern at [`23c165f`](https://github.com/obsidianmd/obsidian-sample-plugin/blob/23c165fd362d4049330cb3edad6a52914ff2007a/src/main.ts#L97-L107)). CodeMirror's reference says `changeFilter` can suppress transaction changes and `transactionFilter` can replace transaction specifications before application ([CodeMirror reference](https://codemirror.net/docs/ref/#state.EditorState%5EchangeFilter)). Obsidian documents single-file `Vault.process()` read-modify-write, frontmatter processing, metadata/link caches, and `FileManager.renameFile()` with preference-dependent link updates ([pinned Vault guide](https://github.com/obsidianmd/obsidian-developer-docs/blob/2d0e942f03b23ed94ebda3c610ed074662ed63db/en/Plugins/Vault.md#L22-L92), [pinned API](https://github.com/obsidianmd/obsidian-api/blob/6e21f1f68d988243cd8ccd25b6417bd2adf93ee6/obsidian.d.ts#L2877-L2954)).

**Campaign assessment (Inference).** These hooks could support domain commands, validation or rejection of in-editor transactions, stable identifiers, and materialized provenance, temporal, epistemic, and relationship fields. The APIs do **not** prove that any dedicated plugin implements those semantics, so authoritative record, claim evolution, identity, temporal/epistemic separation, semantic-conflict preservation, deterministic critical recall, and Recall gaps remain **unproven**. Core linking **transfers** only when the link-update preference is enabled and the implementation uses `FileManager.renameFile()` rather than assuming raw `Vault.rename()` updates links.

**Mediation and atomicity limit (source observation plus Inference).** CodeMirror filters govern editor transactions, while the same pinned Obsidian API separately permits vault writes and file operations; editor interception is therefore not evidence that external edits or every plugin/API write passes through the campaign command path. `saveData()` writes plugin data, but the API exposes no transaction joining that data to one or more vault files. Together with the single-file scope of `Vault.process()`, **Inference:** bypass detection, multi-file commit, crash recovery, and coordination with other writers require an explicit protocol and remain **unproven**.

### Candidate 3 — independent core plus Obsidian adapter

**Documented/source-observed capability and directionality.** The pinned API supplies two different seams. For **plugin → core**, `request()`/`requestUrl()` issue HTTP(S) requests and expose method, body, headers, and response data ([pinned request API](https://github.com/obsidianmd/obsidian-api/blob/6e21f1f68d988243cd8ccd25b6417bd2adf93ee6/obsidian.d.ts#L5427-L5485)). For **core → vault**, a plugin can register a globally named Obsidian CLI handler ([pinned CLI-handler API](https://github.com/obsidianmd/obsidian-api/blob/6e21f1f68d988243cd8ccd25b6417bd2adf93ee6/obsidian.d.ts#L5025-L5048)). **Inference:** an external core needs that bridge/CLI path to invoke vault-aware operations. These are communication mechanisms, not a shared storage or transaction protocol.

**Campaign assessment (Inference).** An independent core could own opaque identity, proposition history, authority, semantic conflicts, temporal semantics, epistemic status, retrieval contracts, and erasure orchestration while Obsidian remains an inspectable projection/editor. None of those behaviors follows from the adapter APIs, so they remain **unproven** until a named core and authority contract establish them. If both core and vault accept writes, the adapter **needs augmentation** for versioning, idempotency, conflict preservation, and replay; if the vault is only a projection, human editing **needs augmentation** with an explicit route back through core operations. Mapping core entity/claim identities to mutable files and links also keeps linking at **needs augmentation**, even though the vault side can use `FileManager.renameFile()`.

**Atomicity and availability limit (source observation plus Inference).** The API contains no transaction spanning an HTTP request, plugin `data.json`, CLI handler, and multiple vault files; its strongest documented write guarantee remains one-file `Vault.process()`. **Inference:** the adapter must define commit authority and recovery for plugin→core success followed by vault failure, vault edit followed by core rejection, duplicate delivery, and offline divergence. The sources do not establish that the official communication seams operate headlessly, offline, or equivalently on mobile, so those behaviors are **unproven**, not assumed.

### Common adversarial scenario

After a session, the GM establishes that “Captain Rook” and “Varos” are the same entity, but at an uncertain earlier fictional time; the character had a false belief that Rook was an ally. An offline mobile edit changes that relationship while a desktop correction rewinds a safety-sensitive scene, requiring the affected material to be removed and a later recall to answer only what the character now knows. The operation touches identity, qualified relationships, fictional time, establishment order, epistemic status, concurrent edits, retrieval, and erasure.

- **Vault-native composition — Inference:** frontmatter can encode each field and Dataview can query fields that were actually authored, but no cited mechanism makes the multi-file correction, link update, Dataview reindex, semantic-conflict preservation, and erasure one operation. The result is **needs augmentation** for representation/maintenance and **unproven** for correct recall and complete erasure.
- **Dedicated plugin — Inference:** editor filters and domain commands could mediate the desktop edit, and single-note `process()`/`processFrontMatter()` can protect each individual write. No source establishes cross-file commit, offline reconciliation, proposition-level conflict handling, mobile-equivalent mediation, or an erasure proof, so the scenario remains **unproven** rather than credited to the plugin concept.
- **Independent core + adapter — Inference:** the core could decide the identity, belief, rewind, and recall semantics, while the adapter projects the accepted state. The two directional seams do not establish one commit across core and vault or resolve the simultaneous offline edit; without an evidenced authority/replay contract, the projection may be stale or divergent. Recall and erasure therefore remain **unproven**.

### Evidence gaps and issue #8 handoff

- **Mobile:** official pinned guidance says Node.js and Electron APIs are unavailable on mobile and that plugins depending on them can declare themselves desktop-only ([mobile development guide](https://github.com/obsidianmd/obsidian-developer-docs/blob/2d0e942f03b23ed94ebda3c610ed074662ed63db/en/Plugins/Getting%20started/Mobile%20development.md)). It does not establish mobile correctness, performance, background behavior, or equivalent adapter availability for any candidate. Each candidate needs an actual mobile/offline test; no ecosystem percentage is inferred.
- **Local-first — Inference:** vault-file and local plugin mechanisms can support local operation, but the cited APIs do not prove that all dependencies, an independent core, or reconciliation remain available offline. Issue #8 must name the authoritative local boundary and test restart/offline behavior rather than infer “local-first” from Markdown storage alone.
- **Atomicity:** `Vault.process()` establishes only single-file read-modify-write. The pinned API's absence of a cross-file transaction is source-observed; **Inference:** multi-file and core↔vault commit/recovery semantics require candidate-specific evidence.
- **Erasure:** `Vault.delete()` is documented as completely deleting the target vault file, while `Vault.trash()` attempts system trash and may use local trash ([pinned Vault API](https://github.com/obsidianmd/obsidian-api/blob/6e21f1f68d988243cd8ccd25b6417bd2adf93ee6/obsidian.d.ts#L7435-L7449)). The sources do not establish removal from plugin data, derived indexes, File Recovery, Sync, adapters, core stores, or backups. No persistence or successful cascade is assumed; end-to-end safety erasure is **unproven** for all three candidates.
- **Rebuildability:** Dataview has an evidenced full-index reinitialization path, but no cited campaign-workload timing or correctness result. Reconstructing a dedicated plugin's domain state, an independent core, projections, identifiers, provenance, and tombstones after loss or schema evolution is **unproven**.
- **Scale:** no cited source measures the issue's workload, concurrent corrections, cross-file operations, mobile reconciliation, rebuild duration, or erasure verification. There is no invented note/proposition threshold. Issue #8 must use measured campaign-shaped workloads and report failure/recovery behavior.

**Issue #8 handoff.** Compare these candidates as separate host topologies, without treating wrapper evidence as host evidence or plugin-feature accumulation as transaction evidence. Require each candidate to state authoritative write ownership; claim-level evolution and provenance; stable entity identity and qualified relationships; linking semantics; fictional time and establishment order; epistemic separation including player awareness; human-edit mediation and bypass behavior; core↔vault protocol direction, versioning, idempotency, replay, and recovery where applicable; mobile/offline boundary; single- versus multi-file atomicity; semantic-conflict preservation; deterministic recall/Recall gaps; safety-erasure reach; rebuild procedure/cost; and domain decoupling from file layout, database, embedding model, and vendor through an explicit export/migration path. This supplement selects no topology and recommends no hybrid.

## Campaign-memory assumption failures

The comparison invalidates these architecture assumptions:

- “A current page is the truth.” A page can mix established truth, preparation, belief, suspicion, open questions, and unrevealed material.
- “Source-grounded means established.” A source can be prep, recap, player proposal, imported reference, or an unauthorized assertion; provenance and narrative authority determine the narrow supported claim.
- “Newest wins.” A later record may establish an earlier event, correct an error, describe a later state, or conflict without authority to resolve it.
- “One timestamp is enough.” Fictional time and establishment order are independent; ingestion/publication/source timestamps establish neither equivalence.
- “An alias or slug is identity.” Names change, disguises exist, and identity equivalence itself can be established, provisional, believed, or suspected.
- “An edge is a relationship.” Campaign relationships are directional, qualified, perspective-grounded, and time-varying.
- “Visibility is awareness.” Access/filter tags do not record what the human player was told or deliberately inspected; inspectability also does not grant character belief.
- “Semantic search is recall.” Relevance ranking does not guarantee mandatory safety constraints, corrections/rewinds, current commitments, conflicts, or explicit Recall gaps.
- “A clean merge means no conflict.” Textual compatibility can conceal contradictory propositions; semantic conflicts need preservation and authoritative resolution.
- “History is safety.” Git revert, retained page history, RevisionDelete, and ordinary fact retraction preserve content that a safety rewind may require to be erased.
- “Lint failure is a Recall gap.” Lint describes repository quality; a Recall gap is the retrieval contract's explicit inability to supply recall-critical information.
- “A benchmark score proves campaign scale.” Conversational QA measurements do not measure hundreds of sessions' claim evolution, links, provenance, rebuilds, or erasure cascades.

## Workload and scale: evidence and gaps

The evidence supports only architecture-specific measurements or operational behavior. Graphiti/Zep reports retrieval accuracy and latency on LongMemEval/DMR ([paper](https://arxiv.org/abs/2501.13956)); Mem0 reports accuracy, latency, and token use on its evaluated conversational tasks ([paper](https://arxiv.org/abs/2504.19413)); Anthropic documents client-controlled file operations but no service capacity measurement ([memory documentation](https://platform.claude.com/docs/en/agents-and-tools/tool-use/memory-tool)). LangChain and Vercel OpenWiki source shows incremental update inputs and atomic revision publication ([LangChain workflow](https://github.com/langchain-ai/openwiki/blob/326a307203345128a60b92a356978c46e2992df3/openwiki/agent/workflow.md), [Vercel README](https://github.com/vercel-labs/openwiki/blob/618dcaf862ede7f4e3103216f1de8e2956a84564/README.md)); neither publishes campaign-workload measurements.

The following remain explicitly **unproven** across the included systems:

- hundreds of sessions and months/years of establishment order;
- counts and growth rates for durable propositions, revisions, links, provenance references, entity aliases, relationship qualifications, and retrieval candidates;
- uncertain/relative fictional-time indexing and overlapping valid intervals;
- correction and rewind cascades through summaries, links, indexes, caches, embeddings, generated pages, and backups;
- preservation of epistemic separation through extraction, consolidation, deduplication, and rewriting;
- unresolved semantic-conflict recall under bounded context;
- deterministic inclusion of recall-critical information and explicit Recall gaps;
- rebuild duration/cost and incremental-update correctness after schema evolution;
- fact-level safety erasure and proof that erased material cannot resurface;
- the issue's campaign workload on commodity local hardware.

Later evaluation should report these dimensions as measurements, not invent thresholds in advance.

## Constraints handed to issues #5–#8

### Issue #5 — representation/schema

- Represent propositions/status/authority/provenance independently of page text; page revision metadata is insufficient.
- Keep established truth, preparation, belief, suspicion, open question, uncertainty, unrevealed material, and player awareness distinct.
- Separate stable entity identity from names/aliases and represent provisional or perspective-bound identity claims.
- Represent relationships as directional, qualified, perspective-grounded, and temporally evolving.
- Model fictional time separately from establishment order; preserve uncertainty.
- Make state transition, correction, continuity-conflict resolution, and rewind distinct operations.

### Issue #6 — write/reconciliation contracts

- Use mediated writes with inspectable operations and provenance; do not silently overwrite semantic conflicts.
- Preserve incompatible propositions until an authority-bearing resolution exists.
- Specify how human edits enforce the same invariants as maintainer writes while records remain locally inspectable/exportable.
- Define safety erasure across authoritative and derived copies; hiding, reverting, or retracting is insufficient.

### Issue #7 — recall contracts

- Recall must be situation-driven and bounded, yet deterministically include recall-critical safety constraints, corrections/rewinds, current state/commitments, epistemic status, and material conflicts.
- Return inspectable provenance and deeper references.
- Emit an explicit Recall gap when critical material cannot be supplied; never substitute lint or low relevance.
- Treat secrecy primarily as preventing epistemic leakage during retrieval/portrayal, not multiplayer access control.

### Issue #8 — architecture decision

- Evaluate candidate storage/retrieval choices against the matrix dimensions and measured campaign workload; this research names no winner and recommends no hybrid.
- Evaluate vault-native composition, a dedicated campaign-memory plugin, and an independent core plus Obsidian adapter as separate Obsidian host topologies; wrapper evidence does not discharge host-boundary evidence.
- Require evidence for authoritative write ownership, claim-level evolution and provenance, stable entity identity and qualified relationships, linking, semantic conflicts, dual temporal semantics, epistemic separation and player awareness, local inspectability/export, human-edit bypass behavior, deterministic critical recall, mobile/offline behavior, single- and multi-file atomicity, safety-erasure reach, rebuild behavior, and domain decoupling from file layout, database, embedding model, and vendor.
- For a core/adapter boundary, require protocol direction, versioning, idempotency, replay, and failure recovery; do not infer a transaction from plugin, HTTP, CLI, indexing, or sync features.
- Treat generated wikis, temporal graphs, fact stores, revision systems, and Obsidian host mechanisms as patterns with gaps, not complete campaign-memory solutions.

## Notable exclusions

- **Continuum Memory Architectures** is excluded from the detailed matrix because the available evidence is a conceptual architecture class rather than a mature authoritative-record/editing implementation ([paper](https://arxiv.org/abs/2601.09913)). Its persistence, retention, routing, temporal continuity, and consolidation vocabulary is relevant but does not materially strengthen the required provenance/authority/erasure evidence.
- **MemForest** is excluded because its principal distinction is hierarchical temporal indexing and write throughput, while the paper does not establish campaign epistemic separation, authority, erasure, or Recall gaps; its reported evaluation is not campaign workload evidence ([paper](https://arxiv.org/abs/2605.23986)).
- Generic vector databases/RAG frameworks are excluded because relevance retrieval alone does not answer the named authoritative-record, evolution, reconciliation, and temporal axes.
- Additional Obsidian/wiki wrappers are excluded from the earlier implementation matrix unless primary sources establish materially different behavior. That exclusion is **not** an evaluation of Obsidian as a subsystem host: the separate host supplement above evaluates vault-native composition, a dedicated plugin, and an independent core plus adapter. Popularity, “official,” and “community-canonical” labels remain omitted without registry/governance evidence.
- Git, MediaWiki, SQL temporal data, and Datomic are not treated as direct precedents or recommendations; only their targeted analogue patterns are used.

## Primary-source index

### Seed proposal and descendants

- Andrej Karpathy, [“LLM Wiki” proposal](https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f).
- green-dalii, [`obsidian-llm-wiki` at `0979d50`](https://github.com/green-dalii/obsidian-llm-wiki/tree/0979d50aefcc3ca20dad7dd379082572fdc3dd36): [manifest](https://github.com/green-dalii/obsidian-llm-wiki/blob/0979d50aefcc3ca20dad7dd379082572fdc3dd36/manifest.json), [README](https://github.com/green-dalii/obsidian-llm-wiki/blob/0979d50aefcc3ca20dad7dd379082572fdc3dd36/README.md), [changelog](https://github.com/green-dalii/obsidian-llm-wiki/blob/0979d50aefcc3ca20dad7dd379082572fdc3dd36/CHANGELOG.md).
- Ar9av, [`obsidian-wiki` at `2cc6426`](https://github.com/Ar9av/obsidian-wiki/tree/2cc64265e5218b646b782fca727c68a3b3b6d319): [README](https://github.com/Ar9av/obsidian-wiki/blob/2cc64265e5218b646b782fca727c68a3b3b6d319/README.md).
- Astro-Han, [`karpathy-llm-wiki` at `9e8c4f4`](https://github.com/Astro-Han/karpathy-llm-wiki/tree/9e8c4f44ce8d8f154494844a860cc6e9e49c8642): [README](https://github.com/Astro-Han/karpathy-llm-wiki/blob/9e8c4f44ce8d8f154494844a860cc6e9e49c8642/README.md) and [`SKILL.md`](https://github.com/Astro-Han/karpathy-llm-wiki/blob/9e8c4f44ce8d8f154494844a860cc6e9e49c8642/SKILL.md).

### OpenWiki

- LangChain, [`openwiki` at `326a307`](https://github.com/langchain-ai/openwiki/tree/326a307203345128a60b92a356978c46e2992df3): [README](https://github.com/langchain-ai/openwiki/blob/326a307203345128a60b92a356978c46e2992df3/README.md), [workflow](https://github.com/langchain-ai/openwiki/blob/326a307203345128a60b92a356978c46e2992df3/openwiki/agent/workflow.md), [agent source](https://github.com/langchain-ai/openwiki/blob/326a307203345128a60b92a356978c46e2992df3/src/agent/index.ts).
- Vercel Labs, [`openwiki` at `618dcaf`](https://github.com/vercel-labs/openwiki/tree/618dcaf862ede7f4e3103216f1de8e2956a84564): [README](https://github.com/vercel-labs/openwiki/blob/618dcaf862ede7f4e3103216f1de8e2956a84564/README.md), [storage source/schema](https://github.com/vercel-labs/openwiki/blob/618dcaf862ede7f4e3103216f1de8e2956a84564/lib/storage.ts).

### Broader memory systems

- Rasmussen et al., [“Zep: A Temporal Knowledge Graph Architecture for Agent Memory”](https://arxiv.org/abs/2501.13956) and [Graphiti source](https://github.com/getzep/graphiti).
- Chhikara et al., [“Mem0: Building Production-Ready AI Agents with Scalable Long-Term Memory”](https://arxiv.org/abs/2504.19413) and [Mem0 source](https://github.com/mem0ai/mem0).
- Anthropic, [client-side memory tool documentation](https://platform.claude.com/docs/en/agents-and-tools/tool-use/memory-tool) and [context-window management](https://platform.claude.com/docs/en/build-with-claude/context-windows).

### Obsidian host

- Obsidian, [`obsidian-api` at `6e21f1f`](https://github.com/obsidianmd/obsidian-api/tree/6e21f1f68d988243cd8ccd25b6417bd2adf93ee6): [`Vault`](https://github.com/obsidianmd/obsidian-api/blob/6e21f1f68d988243cd8ccd25b6417bd2adf93ee6/obsidian.d.ts#L7321-L7560), [`FileManager`](https://github.com/obsidianmd/obsidian-api/blob/6e21f1f68d988243cd8ccd25b6417bd2adf93ee6/obsidian.d.ts#L2877-L2954), [plugin storage/editor/CLI registration](https://github.com/obsidianmd/obsidian-api/blob/6e21f1f68d988243cd8ccd25b6417bd2adf93ee6/obsidian.d.ts#L4980-L5064), and [HTTP request API](https://github.com/obsidianmd/obsidian-api/blob/6e21f1f68d988243cd8ccd25b6417bd2adf93ee6/obsidian.d.ts#L5427-L5485).
- Obsidian, [`obsidian-developer-docs` at `2d0e942`](https://github.com/obsidianmd/obsidian-developer-docs/tree/2d0e942f03b23ed94ebda3c610ed074662ed63db): [vault read/modify/process guidance](https://github.com/obsidianmd/obsidian-developer-docs/blob/2d0e942f03b23ed94ebda3c610ed074662ed63db/en/Plugins/Vault.md#L22-L92) and [mobile-development constraints](https://github.com/obsidianmd/obsidian-developer-docs/blob/2d0e942f03b23ed94ebda3c610ed074662ed63db/en/Plugins/Getting%20started/Mobile%20development.md).
- Obsidian, [`obsidian-sample-plugin` at `23c165f`](https://github.com/obsidianmd/obsidian-sample-plugin/tree/23c165fd362d4049330cb3edad6a52914ff2007a): [plugin lifecycle/settings example](https://github.com/obsidianmd/obsidian-sample-plugin/blob/23c165fd362d4049330cb3edad6a52914ff2007a/src/main.ts).
- Obsidian plugin registry, [`community-plugins.json` at `093d18e`](https://github.com/obsidianmd/obsidian-releases/blob/093d18e7617fab30688dba90d1801c8f341da35e/community-plugins.json#L568-L574); blacksmithgu, [`obsidian-dataview` at `5ad0994`](https://github.com/blacksmithgu/obsidian-dataview/tree/5ad0994ff384cbb797de382e7edff2388141b73a): [README](https://github.com/blacksmithgu/obsidian-dataview/blob/5ad0994ff384cbb797de382e7edff2388141b73a/README.md) and [index lifecycle source](https://github.com/blacksmithgu/obsidian-dataview/blob/5ad0994ff384cbb797de382e7edff2388141b73a/src/data-index/index.ts).
- CodeMirror, [EditorState change and transaction filters](https://codemirror.net/docs/ref/#state.EditorState%5EchangeFilter).

### Analogues

- ISO, [ISO/IEC 9075-2:2011 catalog record](https://www.iso.org/standard/53682.html); Kulkarni and Michels, [“Temporal Features in SQL:2011”](https://sigmodrecord.org/publications/sigmodRecord/1209/pdfs/07.industry.kulkarni.pdf).
- MediaWiki, [revision table](https://www.mediawiki.org/wiki/Manual:Revision_table), [edit conflicts](https://www.mediawiki.org/wiki/Help:Edit_conflict), [history](https://www.mediawiki.org/wiki/Help:History), and [RevisionDelete](https://www.mediawiki.org/wiki/Help:RevisionDelete).
- Datomic, [architecture/data model](https://docs.datomic.com/datomic-overview.html), [history/as-of](https://docs.datomic.com/client-tutorial/history.html), and [identity](https://docs.datomic.com/schema/identity.html).
- Git, [object model](https://git-scm.com/book/en/v2/Git-Internals-Git-Objects).
