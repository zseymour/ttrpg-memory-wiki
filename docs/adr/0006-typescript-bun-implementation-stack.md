# The memory subsystem is implemented in TypeScript on Bun

The campaign memory subsystem is implemented in TypeScript and run on Bun (test runner, TypeScript execution, and package management), targeting a local-first, single-user deployment. The core is a plain in-process library over an append-only operation log persisted as JSONL inside a dot-prefixed folder in the campaign vault; no database or service is required.

## Consequences

Bun provides native TypeScript execution and a built-in test runner, so the acceptance harness and unit suites run without a separate compiler or transpile step; `tsc --noEmit` under a strict `tsconfig` remains the type gate. Branded identifier types give compile-time isolation of anchor, assertion, operation, and campaign ids at zero runtime cost, and erase cleanly across JSON export/replay. The durable record is ordinary text (one accepted operation per line) that a synced copy can read anywhere with no core running, honoring the local-first, vendor-free, mobile-readable requirements. Rejected alternatives: a runtime-agnostic Node build (extra toolchain for transpile and test with no local-first benefit) and an embedded database (opaque binary record, breaks the plain-vault projection and export story).
