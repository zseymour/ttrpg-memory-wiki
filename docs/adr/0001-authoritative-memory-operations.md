# Authoritative campaign memory uses accepted operations

Campaign memory is governed by establishment-ordered, atomic, attributed Memory operations rather than mutable pages, status fields, summaries, or indexes. This preserves authority context, claim-scoped provenance, explicit lifecycle intent, conflicts, and replayable history while allowing local human editing through tools that compile edits into validated operations; derived views remain disposable and rebuildable, and explicit Erasure is the sole exception to ordinary history retention.

## Consequences

Authority grants and semantic preconditions determine acceptance; retries are idempotent and stale dependencies conflict instead of overwriting. Current Lifecycle standing and every Derived view are computed from accepted operations. Campaign exports must replay the Authoritative record without source re-extraction, while safety erasure traces semantic descendants and removes affected content from authoritative and derived representations.