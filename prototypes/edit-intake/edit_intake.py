"""PROTOTYPE - throwaway code, do not ship (issue #12).

Question being prototyped: does the diff->operation edit-intake loop for
vault projections hold up in practice?  Concretely: project a page from an
establishment-ordered operation log, let a human make a Bypass edit to the
Markdown file, detect divergence by hash against the projected state, compile
the edit region-by-region into attributed *proposed* Memory operations whose
semantic preconditions are taken from the projection's basis version, validate
them (accept, or surface an explicit conflict - never overwrite), and
re-project.  Must exercise structured edits (frontmatter / ID-tagged claim
blocks), prose edits (narrative region), and stale edits (edit against an
outdated projection version).

Pure logic: no I/O, no terminal code.  The TUI shell imports this.
"""

from __future__ import annotations

import hashlib
import re
from dataclasses import dataclass, field

# ---------------------------------------------------------------- log & state


@dataclass(frozen=True)
class Op:
    pos: int  # establishment-order position
    kind: str  # establish-anchor | assert-claim | revise-claim | retract-claim | revise-narrative | revise-name
    actor: str  # attribution
    payload: dict


@dataclass
class Claim:
    id: str
    text: str
    field: str | None  # set -> renders as a frontmatter field, not a block
    established_at: int
    version: int  # pos of the last accepted op that touched this claim
    retracted: bool = False


@dataclass
class State:
    head: int = 0
    entity_id: str | None = None
    name: str | None = None
    name_version: int = 0
    claims: dict[str, Claim] = field(default_factory=dict)  # insertion-ordered
    narrative: str = ""
    narrative_version: int = 0


def replay(log: list[Op]) -> State:
    st = State()
    for op in log:
        _apply(st, op)
    return st


def _apply(st: State, op: Op) -> None:
    st.head = op.pos
    p = op.payload
    if op.kind == "establish-anchor":
        st.entity_id, st.name, st.name_version = p["entity"], p["name"], op.pos
    elif op.kind == "assert-claim":
        st.claims[p["claim"]] = Claim(
            id=p["claim"], text=p["text"], field=p.get("field"),
            established_at=op.pos, version=op.pos,
        )
    elif op.kind == "revise-claim":
        c = st.claims[p["claim"]]
        c.text, c.version = p["text"], op.pos
    elif op.kind == "retract-claim":
        c = st.claims[p["claim"]]
        c.retracted, c.version = True, op.pos
    elif op.kind == "revise-narrative":
        st.narrative, st.narrative_version = p["text"], op.pos
    elif op.kind == "revise-name":
        st.name, st.name_version = p["name"], op.pos
    else:
        raise ValueError(f"unknown op kind {op.kind!r}")


def append(log: list[Op], kind: str, payload: dict, actor: str) -> list[Op]:
    """Append one accepted operation at the next establishment-order position."""
    head = log[-1].pos if log else 0
    return log + [Op(pos=head + 1, kind=kind, actor=actor, payload=payload)]


# ----------------------------------------------------------------- projection

RESERVED_FM = ("entity", "name", "basis")


@dataclass
class Manifest:
    """Projection-time record: the semantic-precondition source for intake."""
    basis: int
    text: str
    sha: str
    name: str
    name_version: int
    entity_id: str
    fields: dict[str, str]  # frontmatter field -> claim id
    field_values: dict[str, str]  # frontmatter field -> projected value
    claim_versions: dict[str, int]  # claim id -> version at basis (all live claims)
    claim_texts: dict[str, str]  # non-field claim id -> normalized text
    narrative_version: int
    narrative_norm: str


def _sha(text: str) -> str:
    return hashlib.sha256(text.encode()).hexdigest()


def _norm(text: str) -> str:
    """Rewrap-insensitive paragraph normalization."""
    paras = [" ".join(p.split()) for p in re.split(r"\n\s*\n", text.strip())]
    return "\n\n".join(p for p in paras if p)


def project(st: State) -> tuple[str, Manifest]:
    live = [c for c in st.claims.values() if not c.retracted]
    fields = {c.field: c.id for c in live if c.field}
    field_values = {c.field: c.text for c in live if c.field}
    blocks = [c for c in live if not c.field]

    lines = ["---", f"entity: {st.entity_id}", f"name: {st.name}"]
    lines += [f"{f}: {v}" for f, v in field_values.items()]
    lines += [f"basis: {st.head}", "---", "", f"# {st.name}", "", "## Claims", ""]
    for c in blocks:
        lines += [f"<!-- claim:{c.id} -->", c.text, ""]
    lines += ["## Narrative", "", "<!-- narrative -->", st.narrative, ""]
    text = "\n".join(lines)

    return text, Manifest(
        basis=st.head, text=text, sha=_sha(text),
        name=st.name or "", name_version=st.name_version,
        entity_id=st.entity_id or "",
        fields=fields, field_values=field_values,
        claim_versions={c.id: c.version for c in live},
        claim_texts={c.id: _norm(c.text) for c in blocks},
        narrative_version=st.narrative_version,
        narrative_norm=_norm(st.narrative),
    )


# -------------------------------------------------------------------- parsing


@dataclass
class Parsed:
    frontmatter: dict[str, str]
    tagged: dict[str, str]  # claim id -> normalized paragraph
    untagged: list[str]  # normalized paragraphs under ## Claims with no tag
    narrative_norm: str
    errors: list[str]


def parse_page(text: str) -> Parsed:
    errors: list[str] = []
    lines = text.splitlines()
    fm: dict[str, str] = {}
    body_start = 0

    if lines and lines[0].strip() == "---":
        i = 1
        while i < len(lines) and lines[i].strip() != "---":
            m = re.match(r"([A-Za-z_][\w-]*):\s*(.*)", lines[i])
            if m:
                fm[m.group(1)] = m.group(2).strip()
            elif lines[i].strip():
                errors.append(f"unparseable frontmatter line: {lines[i]!r}")
            i += 1
        if i >= len(lines):
            errors.append("unterminated frontmatter")
        body_start = i + 1
    else:
        errors.append("missing frontmatter")

    body = lines[body_start:]
    claims_lines: list[str] = []
    narrative_lines: list[str] = []
    section = None
    for line in body:
        if re.match(r"##\s+Claims\s*$", line):
            section = "claims"
        elif re.match(r"##\s+Narrative\s*$", line):
            section = "narrative"
        elif section == "claims":
            claims_lines.append(line)
        elif section == "narrative":
            narrative_lines.append(line)

    tagged: dict[str, str] = {}
    untagged: list[str] = []
    cur_id: str | None = None
    cur: list[str] = []

    def flush() -> None:
        nonlocal cur_id, cur
        para = _norm("\n".join(cur))
        if para:
            if cur_id is None:
                untagged.append(para)
            elif cur_id in tagged:
                errors.append(f"duplicate claim tag {cur_id!r}; later block ignored")
            else:
                tagged[cur_id] = para
        cur_id, cur = None, []

    for line in claims_lines:
        m = re.match(r"\s*<!--\s*claim:([\w-]+)\s*-->\s*$", line)
        if m:
            flush()
            cur_id = m.group(1)
        elif not line.strip():
            if cur:  # blank between a tag and its paragraph must not detach the tag
                flush()
        else:
            cur.append(line)
    flush()

    narrative = "\n".join(
        l for l in narrative_lines if not re.match(r"\s*<!--\s*narrative\s*-->\s*$", l)
    )
    return Parsed(fm, tagged, untagged, _norm(narrative), errors)


# ------------------------------------------------------------------ compiling


@dataclass
class Proposal:
    kind: str  # assert-claim | revise-claim | retract-claim | revise-narrative | revise-name
    payload: dict
    preconditions: dict  # semantic preconditions taken from the projection basis
    basis: int
    confidence: str  # mechanical | inferred | ambiguous
    note: str = ""


@dataclass
class IntakeResult:
    diverged: bool
    proposals: list[Proposal]
    notes: list[str]


def compile_edit(manifest: Manifest, edited_text: str) -> IntakeResult:
    """Diff a bypass-edited page against its projection manifest, region by
    region, and compile proposed operations.  Never mutates anything."""
    if _sha(edited_text) == manifest.sha:
        return IntakeResult(False, [], [])

    parsed = parse_page(edited_text)
    notes = list(parsed.errors)
    props: list[Proposal] = []
    basis = manifest.basis

    declared = parsed.frontmatter.get("basis")
    if declared != str(manifest.basis):
        notes.append(
            f"page declares basis {declared!r}, projection manifest says {manifest.basis};"
            " preconditions taken from the manifest"
        )

    if (eid := parsed.frontmatter.get("entity")) and eid != manifest.entity_id:
        notes.append(f"entity id edited ({manifest.entity_id!r} -> {eid!r}): identity is not editable; ignored")

    if (name := parsed.frontmatter.get("name")) and name != manifest.name:
        props.append(Proposal(
            kind="revise-name", payload={"name": name},
            preconditions={"name_version": manifest.name_version}, basis=basis,
            confidence="ambiguous",
            note="rename vs distinct-entity cannot be told apart from a diff",
        ))

    # frontmatter field claims
    for f, cid in manifest.fields.items():
        if f not in parsed.frontmatter:
            props.append(Proposal(
                kind="retract-claim", payload={"claim": cid},
                preconditions={"claim": cid, "version": manifest.claim_versions[cid]},
                basis=basis, confidence="ambiguous",
                note=f"frontmatter field {f!r} removed: retraction or accident?",
            ))
        elif parsed.frontmatter[f] != manifest.field_values[f]:
            props.append(Proposal(
                kind="revise-claim",
                payload={"claim": cid, "text": parsed.frontmatter[f], "field": f},
                preconditions={"claim": cid, "version": manifest.claim_versions[cid]},
                basis=basis, confidence="mechanical",
            ))
    for key, val in parsed.frontmatter.items():
        if key not in RESERVED_FM and key not in manifest.fields:
            props.append(Proposal(
                kind="assert-claim", payload={"text": val, "field": key},
                preconditions={}, basis=basis, confidence="inferred",
                note=f"new frontmatter field {key!r}",
            ))

    # tagged claim blocks
    for cid, projected in manifest.claim_texts.items():
        if cid not in parsed.tagged:
            props.append(Proposal(
                kind="retract-claim", payload={"claim": cid},
                preconditions={"claim": cid, "version": manifest.claim_versions[cid]},
                basis=basis, confidence="ambiguous",
                note=f"claim block {cid!r} missing: retraction or accidental deletion?",
            ))
        elif parsed.tagged[cid] != projected:
            props.append(Proposal(
                kind="revise-claim", payload={"claim": cid, "text": parsed.tagged[cid]},
                preconditions={"claim": cid, "version": manifest.claim_versions[cid]},
                basis=basis, confidence="mechanical",
            ))
    for cid, para in parsed.tagged.items():
        if cid not in manifest.claim_texts:
            props.append(Proposal(
                kind="assert-claim", payload={"text": para},
                preconditions={}, basis=basis, confidence="inferred",
                note=f"block carries unknown claim id {cid!r}; compiled as a new claim",
            ))
    for para in parsed.untagged:
        props.append(Proposal(
            kind="assert-claim", payload={"text": para},
            preconditions={}, basis=basis, confidence="inferred",
            note="untagged paragraph under ## Claims",
        ))

    # narrative region
    if parsed.narrative_norm != manifest.narrative_norm:
        props.append(Proposal(
            kind="revise-narrative", payload={"text": parsed.narrative_norm},
            preconditions={"narrative_version": manifest.narrative_version},
            basis=basis, confidence="mechanical",
        ))

    if not props and not notes:
        notes.append("bytes diverged but no region-level change (formatting-only edit)")
    return IntakeResult(True, props, notes)


# ----------------------------------------------------- validation & acceptance


@dataclass
class Disposition:
    proposal: Proposal
    accepted: bool
    reason: str  # conflict/acceptance explanation
    op: Op | None = None


def _next_claim_id(st: State) -> str:
    ns = [int(m.group(1)) for cid in st.claims if (m := re.match(r"c(\d+)$", cid))]
    return f"c{max(ns, default=0) + 1}"


def _validate(st: State, p: Proposal) -> str | None:
    """None -> valid; str -> conflict reason."""
    pre = p.preconditions
    if "claim" in pre:
        c = st.claims.get(pre["claim"])
        if c is None:
            return f"claim {pre['claim']!r} does not exist"
        if c.retracted:
            return f"claim {c.id!r} was retracted at position {c.version}"
        if c.version != pre["version"]:
            return (
                f"claim {c.id!r} revised at position {c.version} "
                f"(edit based on version {pre['version']}); current text: {c.text!r}"
            )
    if "narrative_version" in pre and st.narrative_version != pre["narrative_version"]:
        return (
            f"narrative revised at position {st.narrative_version} "
            f"(edit based on version {pre['narrative_version']})"
        )
    if "name_version" in pre and st.name_version != pre["name_version"]:
        return f"name revised at position {st.name_version} (edit based on version {pre['name_version']})"
    return None


def accept_proposals(
    log: list[Op], proposals: list[Proposal], actor: str
) -> tuple[list[Op], list[Disposition]]:
    """Validate each proposal against the evolving current state.  Valid ->
    accepted operation appended in establishment order; precondition failure ->
    explicit conflict, the file's version never overwrites."""
    dispositions: list[Disposition] = []
    for p in proposals:
        st = replay(log)
        reason = _validate(st, p)
        if reason is not None:
            dispositions.append(Disposition(p, False, f"CONFLICT: {reason}"))
            continue
        payload = dict(p.payload)
        if p.kind == "assert-claim":
            payload["claim"] = _next_claim_id(st)
        log = append(log, p.kind, payload, actor)
        dispositions.append(Disposition(p, True, f"accepted at position {log[-1].pos}", log[-1]))
    return log, dispositions


# ----------------------------------------------------------------------- seed


def seed_log() -> list[Op]:
    log: list[Op] = []
    log = append(log, "establish-anchor", {"entity": "e1", "name": "Maera Voss"}, "gm")
    log = append(log, "assert-claim", {"claim": "c1", "field": "status", "text": "alive"}, "gm")
    log = append(log, "assert-claim", {"claim": "c2", "field": "location", "text": "Saltmere docks"}, "gm")
    log = append(log, "assert-claim", {"claim": "c3", "text": "Maera is the harbormaster of Saltmere."}, "gm")
    log = append(log, "assert-claim", {"claim": "c4", "text": "Maera secretly reports to the Ashen Circle."}, "gm")
    log = append(log, "assert-claim", {"claim": "c5", "text": "Maera owes an old debt to the smuggler Ilyen Kade."}, "gm")
    log = append(log, "revise-narrative", {"text": (
        "Maera runs the harbor office with brisk, unsentimental efficiency. "
        "She keeps a ledger nobody else may touch and pays the dock boys in "
        "exact coin. Sailors say she never forgets a hull or a debt."
    )}, "gm")
    return log


CONCURRENT_OPS: list[tuple[str, dict]] = [
    # canned "core-path" accepted operations, used to make a projection stale
    ("revise-claim", {"claim": "c4", "text": "Maera has broken with the Ashen Circle."}),
    ("revise-claim", {"claim": "c1", "field": "status", "text": "missing"}),
    ("revise-narrative", {"text": (
        "The harbor office stands locked. Maera's ledger is gone from its "
        "drawer, and the dock boys have not been paid this week."
    )}),
]
