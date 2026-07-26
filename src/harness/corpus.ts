/**
 * A synthetic, versioned Source-store corpus for issue #23 acceptance probes.
 *
 * One source, `synthetic-corpus`, minted as two versions whose declared delta
 * exercises every reconciliation class exactly once: a rule carried forward
 * unchanged (`grapple`), a rule revised under the same id (`shove`), a rule
 * renamed keeping identity (`disarm` -> `disarm-maneuver`), a rule removed
 * (`trip`), and a rule added (`feint`). Content strings are distinctive so a
 * must-exclude probe can assert corpus text was never copied into a lens.
 */

import { InMemorySourceStore, type SourceFixture } from "../sources/memory.ts";

export const SYNTHETIC_CORPUS: SourceFixture = {
  "synthetic-corpus": {
    v1: {
      predecessor: null,
      rules: {
        grapple: { content: "v1 grapple text", locator: "p.10" },
        shove: { content: "v1 shove text", locator: "p.11" },
        trip: { content: "v1 trip text", locator: "p.12" },
        disarm: { content: "v1 disarm text", locator: "p.13" },
      },
    },
    v2: {
      predecessor: "v1",
      rules: {
        // carried forward unchanged: identical content and locator to v1.
        grapple: { content: "v1 grapple text", locator: "p.10" },
        // revised under the same id.
        shove: { content: "v2 shove errata", locator: "p.11" },
        // renamed from `disarm`, same content as the v1 rule.
        "disarm-maneuver": { content: "v1 disarm text", locator: "p.13" },
        // added new in v2.
        feint: { content: "v2 feint text", locator: "p.14" },
      },
      revised: ["shove"],
      removed: ["trip"],
      added: ["feint"],
      continues: { "disarm-maneuver": "disarm" },
    },
  },
};

export const syntheticStore = (): InMemorySourceStore => new InMemorySourceStore(SYNTHETIC_CORPUS);
