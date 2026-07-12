"""PROTOTYPE - throwaway TUI shell for the edit-intake loop (issue #12).

Run:  uv run prototypes/edit-intake/tui.py

Drives edit_intake.py by hand: project the page, edit the projected file in
Obsidian or any editor, then intake it here.  The vault file lives at
PROTOTYPE-vault/maera-voss.md next to this script - wipe it freely.
"""

from __future__ import annotations

import difflib
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
import edit_intake as ei

VAULT = Path(__file__).parent / "PROTOTYPE-vault"
PAGE = VAULT / "maera-voss.md"

B, D, R = "\x1b[1m", "\x1b[2m", "\x1b[0m"
RED, GRN, YEL = "\x1b[31m", "\x1b[32m", "\x1b[33m"
CONF_COLOR = {"mechanical": GRN, "inferred": YEL, "ambiguous": RED}


class App:
    def __init__(self) -> None:
        self.log = ei.seed_log()
        self.manifest: ei.Manifest | None = None
        self.intake: ei.IntakeResult | None = None
        self.dispositions: list[ei.Disposition] = []
        self.show_diff = False
        self.concurrent_i = 0
        self.msg = "seeded log; [p]roject to start the loop"

    # ------------------------------------------------------------- actions

    def project(self) -> None:
        text, self.manifest = ei.project(ei.replay(self.log))
        VAULT.mkdir(exist_ok=True)
        PAGE.write_text(text)
        self.intake, self.dispositions, self.show_diff = None, [], False
        self.msg = f"projected at basis {self.manifest.basis} -> {PAGE.relative_to(Path.cwd(), walk_up=True)}"

    def do_intake(self) -> None:
        if self.manifest is None:
            self.msg = "nothing projected yet - [p] first"
            return
        if not PAGE.exists():
            self.msg = "projected file is gone; [p] to re-project"
            return
        self.intake = ei.compile_edit(self.manifest, PAGE.read_text())
        self.dispositions = []
        n = len(self.intake.proposals)
        self.msg = "no divergence - file matches projected state" if not self.intake.diverged \
            else f"divergence detected; compiled {n} proposal(s)"

    def accept(self) -> None:
        if not self.intake or not self.intake.proposals:
            self.msg = "no pending proposals - [i]ntake first"
            return
        self.log, self.dispositions = ei.accept_proposals(
            self.log, self.intake.proposals, actor="human/bypass-edit"
        )
        self.intake = None
        ok = sum(d.accepted for d in self.dispositions)
        bad = len(self.dispositions) - ok
        self.msg = f"{ok} accepted, {bad} conflict(s); [p] to re-project"

    def concurrent(self) -> None:
        kind, payload = ei.CONCURRENT_OPS[self.concurrent_i % len(ei.CONCURRENT_OPS)]
        self.concurrent_i += 1
        self.log = ei.append(self.log, kind, payload, actor="ai-gm/core-path")
        self.msg = f"concurrent accepted op at position {self.log[-1].pos}: {kind} {payload.get('claim', 'narrative')}"

    # ------------------------------------------------------------ rendering

    def render(self) -> str:
        st = ei.replay(self.log)
        out: list[str] = []
        w = out.append

        w(f"{B}EDIT-INTAKE PROTOTYPE{R} {D}(issue #12 - throwaway){R}")
        w("")

        # log tail
        w(f"{B}LOG{R} {D}head={st.head}{R}")
        for op in self.log[-5:]:
            subj = op.payload.get("claim") or op.payload.get("name") or op.payload.get("entity") or "narrative"
            w(f"  {D}{op.pos:>3}{R} {op.kind:<17} {subj:<10} {D}{op.actor}{R}")
        w("")

        # current state
        w(f"{B}STATE{R}  {st.name} {D}({st.entity_id}, name v{st.name_version}){R}")
        for c in st.claims.values():
            flag = f"{RED}retracted{R}" if c.retracted else f"{D}v{c.version}{R}"
            label = f"[{c.field}]" if c.field else f"[{c.id}]"
            w(f"  {B}{label:<11}{R}{c.text[:66]} {flag}")
        w(f"  {B}[narrative]{R}{st.narrative[:66]}... {D}v{st.narrative_version}{R}")
        w("")

        # projection status
        w(f"{B}PROJECTION{R} {D}{PAGE.name}{R}")
        if self.manifest is None:
            w(f"  {D}not projected yet{R}")
        elif not PAGE.exists():
            w(f"  {RED}file missing{R}")
        else:
            diverged = ei._sha(PAGE.read_text()) != self.manifest.sha
            stale = self.manifest.basis < st.head
            bits = [f"basis {self.manifest.basis}"]
            bits.append(f"{RED}DIVERGED{R}" if diverged else f"{GRN}clean{R}")
            if stale:
                bits.append(f"{YEL}STALE (head is {st.head}){R}")
            w("  " + "  ".join(bits))
        w("")

        # pending proposals / dispositions
        if self.intake and self.intake.diverged:
            w(f"{B}PROPOSALS{R} {D}(pending - [a] to validate & accept){R}")
            for p in self.intake.proposals:
                self._render_proposal(w, p)
            for note in self.intake.notes:
                w(f"  {YEL}note{R} {note}")
            w("")
        if self.dispositions:
            w(f"{B}DISPOSITIONS{R}")
            for d in self.dispositions:
                mark = f"{GRN}ok{R}" if d.accepted else f"{RED}!!{R}"
                w(f"  {mark} {d.proposal.kind:<17} {d.reason[:78]}")
                if not d.accepted:
                    w(f"     {D}proposed: {str(d.proposal.payload)[:72]}{R}")
            w("")

        if self.show_diff and self.manifest and PAGE.exists():
            w(f"{B}DIFF{R} {D}projected -> file{R}")
            diff = difflib.unified_diff(
                self.manifest.text.splitlines(), PAGE.read_text().splitlines(),
                lineterm="", n=1,
            )
            for line in list(diff)[2:][:18]:
                color = GRN if line.startswith("+") else RED if line.startswith("-") else D
                w(f"  {color}{line[:78]}{R}")
            w("")

        w(f"{YEL}> {self.msg}{R}")
        w("")
        w(f"  {B}p{R} {D}project{R}   {B}i{R} {D}intake (detect+diff+compile){R}   "
          f"{B}a{R} {D}accept proposals{R}")
        w(f"  {B}x{R} {D}simulate concurrent core op{R}   {B}d{R} {D}toggle raw diff{R}   "
          f"{B}q{R} {D}quit{R}")
        w("")
        w(f"  {D}edit the file in any editor between [p] and [i]:{R} {PAGE}")
        return "\n".join(out)

    @staticmethod
    def _render_proposal(w, p: ei.Proposal) -> None:
        color = CONF_COLOR[p.confidence]
        pre = ", ".join(f"{k}={v}" for k, v in p.preconditions.items()) or "none"
        w(f"  {color}{p.confidence:<10}{R} {B}{p.kind}{R} {str(p.payload)[:60]}")
        w(f"             {D}preconditions: {pre} (basis {p.basis}){R}"
          + (f"  {YEL}{p.note}{R}" if p.note else ""))

    # ---------------------------------------------------------------- loop

    def dispatch(self, key: str) -> bool:
        if key == "q":
            return False
        {"p": self.project, "i": self.do_intake, "a": self.accept,
         "x": self.concurrent,
         "d": lambda: setattr(self, "show_diff", not self.show_diff)}.get(
            key, lambda: setattr(self, "msg", f"unknown key {key!r}"))()
        return True


def getch() -> str:
    if not sys.stdin.isatty():  # piped input (scripted smoke runs)
        ch = sys.stdin.read(1)
        return ch if ch else "q"
    import termios
    import tty
    fd = sys.stdin.fileno()
    old = termios.tcgetattr(fd)
    try:
        tty.setcbreak(fd)
        return sys.stdin.read(1)
    finally:
        termios.tcsetattr(fd, termios.TCSADRAIN, old)


def main() -> None:
    app = App()
    while True:
        print("\x1b[2J\x1b[H" + app.render(), flush=True)
        if not app.dispatch(getch().lower()):
            break


if __name__ == "__main__":
    main()
