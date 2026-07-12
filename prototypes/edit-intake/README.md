# PROTOTYPE — edit-intake loop for vault projections (issue #12)

Throwaway. Answers one question: **does the diff→operation edit-intake loop
hold up in practice** — can a Bypass edit to a projected Markdown page be
detected (hash against projected state), compiled region-by-region into
proposed Memory operations whose semantic preconditions come from the
projection's basis version, validated (accept or explicit conflict, never
overwrite), and re-projected?

Run:

```
uv run prototypes/edit-intake/tui.py
```

Loop: `[p]` projects `PROTOTYPE-vault/maera-voss.md` → edit it in Obsidian or
any editor → `[i]` detects divergence and compiles proposals → `[a]` validates
and accepts (or surfaces conflicts) → `[p]` re-projects. `[x]` appends a
concurrent core-path accepted operation without re-projecting, which is how
you set up the stale-edit conflict case.

- `edit_intake.py` — pure logic (log, replay, projection+manifest, region
  parser, diff→operation compiler, precondition validation). The keepable bit.
- `tui.py` — throwaway terminal shell.
- `PROTOTYPE-vault/` — scratch projection surface; wipe freely.

Findings land as a comment on issue #12; this directory is then discarded to a
throwaway branch per the prototype skill.
