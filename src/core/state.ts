/**
 * Derived campaign state, reconstructed purely by replaying accepted operations.
 *
 * Nothing here is authoritative or independently editable. Lifecycle standing is
 * computed, never stored as a mutable flag; continuity conflicts are surfaced
 * explicitly rather than resolved by last-write-wins; erasure removes content
 * from the record itself, not merely from a view.
 */

import {
  assertionIdAt,
  conflictIdOf,
  type AnchorId,
  type ArtifactId,
  type AssertionId,
  type ConflictId,
  type GrantId,
  type RulingId,
} from "./ids.ts";
import {
  isEquivalence,
  type Act,
  type AnchorRole,
  type ArtifactLink,
  type EstablishmentMode,
  type Operation,
  type Proposition,
  type Provenance,
  type SafetyBoundary,
  type Stance,
  type Uncertainty,
} from "./operations.ts";

/** An accepted operation and the establishment-order position it occupies. */
export interface Accepted {
  op: Operation;
  pos: number;
}

/** Deterministically derived applicability of an assertion. Never a stored flag. */
export type Standing = "active" | "corrected" | "retracted" | "superseded" | "rewound" | "erased";

export interface AssertionRecord {
  id: AssertionId;
  pos: number;
  actor: string;
  stance: Stance;
  proposition: Proposition;
  /** Perspective holder for belief/suspicion/entity-awareness; null otherwise. */
  holder: AnchorId | null;
  fictionalTime: number | null;
  mode: EstablishmentMode | null;
  uncertainty: Uncertainty;
  provenance: Provenance;
  standing: Standing;
  standingReason: string | null;
  /** Current effective value under corrections; equals proposition.value if never corrected. */
  effectiveValue: string;
  /** Prior values retained as lifecycle history (correction is inspectable). */
  priorValues: { pos: number; value: string }[];
  /** The preparation assertion this establishment realized, if any (linked back). */
  realizes: AssertionId | null;
  /** Establishments that realized this (preparation) assertion; unused detail stays provisional. */
  realizedBy: AssertionId[];
  erased: boolean;
}

export interface ContinuityConflict {
  id: ConflictId;
  slot: string;
  members: AssertionId[];
  resolvedAt: number | null;
  resolution: string | null;
}

export interface GrantRecord {
  id: GrantId;
  grantee: string;
  acts: Set<Act>;
  revoked: boolean;
}

/** A structured artifact: identity organizing related material without asserting it true. */
export interface ArtifactRecord {
  id: ArtifactId;
  pos: number;
  actor: string;
  /** The content kind, e.g. "thread" or "open-question". */
  kind: string;
  label: string;
  /** Links to organized material; a link confers no standing on its target. */
  links: ArtifactLink[];
  /** Claim-scoped provenance: who organized the artifact and its narrow support. */
  provenance: Provenance;
  standing: Standing;
  standingReason: string | null;
}

/** A normative item (campaign ruling): governs adjudication for a scope, not fictional truth. */
export interface RulingRecord {
  id: RulingId;
  pos: number;
  actor: string;
  scope: string;
  text: string;
  ruleRef: string | null;
  /** Referential anchors within the ruling's scope, for scoped recall. */
  anchors: AnchorId[];
  provenance: Provenance;
  standing: Standing;
  standingReason: string | null;
}

export interface CampaignState {
  head: number;
  anchors: Map<AnchorId, { label: string; pos: number; role: AnchorRole }>;
  /** Insertion order is establishment order. */
  assertions: Map<AssertionId, AssertionRecord>;
  conflicts: Map<ConflictId, ContinuityConflict>;
  safety: Map<string, SafetyBoundary>;
  grants: Map<GrantId, GrantRecord>;
  /** Index of active establishment assertions by slot, for O(slot) conflict detection. */
  establishmentBySlot: Map<string, Set<AssertionId>>;
  /** Structured artifacts, keyed by their stable id. */
  artifacts: Map<ArtifactId, ArtifactRecord>;
  /** Normative items (campaign rulings), keyed by their stable id. */
  rulings: Map<RulingId, RulingRecord>;
}

const slotOf = (p: Proposition): string => `${p.subject}::${p.attribute}`;

export function emptyState(): CampaignState {
  return {
    head: 0,
    anchors: new Map(),
    assertions: new Map(),
    conflicts: new Map(),
    safety: new Map(),
    grants: new Map(),
    establishmentBySlot: new Map(),
    artifacts: new Map(),
    rulings: new Map(),
  };
}

/** Replay accepted operations into derived state. Pure and deterministic. */
export function replay(log: readonly Accepted[]): CampaignState {
  const st = emptyState();
  for (const entry of log) apply(st, entry);
  return st;
}

export function apply(st: CampaignState, { op, pos }: Accepted): void {
  st.head = pos;
  switch (op.kind) {
    case "establish-anchor":
      st.anchors.set(op.anchor, { label: op.label, pos, role: op.role ?? "entity" });
      return;
    case "assert": {
      const rec = addAssertion(st, pos, op.actor, op.stance, op.proposition, {
        holder: op.holder ?? null,
        fictionalTime: op.fictionalTime,
        mode: op.mode,
        uncertainty: op.uncertainty ?? { kind: "certain" },
        provenance: op.provenance ?? { introducedBy: op.actor },
        realizes: op.realizes,
      });
      // Realization links the new establishment back to the preparation it realized;
      // the preparation is untouched, so unused prepared detail stays provisional.
      if (op.realizes) st.assertions.get(op.realizes)?.realizedBy.push(rec.id);
      return;
    }
    case "correct": {
      const target = st.assertions.get(op.target);
      if (!target) return;
      deactivate(st, target, "corrected", `superseded by correction at ${pos}`);
      // The corrected (right) value enters as a fresh active establishment,
      // preserving the erroneous record as inspectable lifecycle history.
      const rec = addAssertion(st, pos, op.actor, target.stance, { ...target.proposition, value: op.value }, {
        holder: target.holder,
        fictionalTime: target.fictionalTime,
        mode: target.mode ?? undefined,
        uncertainty: { kind: "certain" },
        provenance: { introducedBy: op.actor, gap: undefined },
      });
      rec.priorValues.push({ pos: target.pos, value: target.effectiveValue });
      return;
    }
    case "retract": {
      // A retraction may withdraw an assertion, a structured artifact, or a ruling.
      const item = retractableAt(st, op.target);
      if (!item) return;
      if ("stance" in item) {
        deactivate(st, item, "retracted", `retracted by ${op.actor} at ${pos}`);
      } else {
        item.standing = "retracted";
        item.standingReason = `retracted by ${op.actor} at ${pos}`;
      }
      return;
    }
    case "supersede": {
      const target = st.assertions.get(op.target);
      if (!target) return;
      deactivate(st, target, "superseded", `superseded at ${pos}, effective from ${op.effectiveFrom}`);
      addAssertion(st, pos, op.actor, target.stance, { ...target.proposition, value: op.value }, {
        holder: target.holder,
        fictionalTime: op.effectiveFrom,
        mode: target.mode ?? undefined,
        uncertainty: { kind: "certain" },
        provenance: { introducedBy: op.actor },
      });
      return;
    }
    case "rewind": {
      const target = st.assertions.get(op.target);
      if (!target) return;
      deactivate(st, target, "rewound", `rewound at ${pos}; must not return to play`);
      return;
    }
    case "erase": {
      eraseWithDescendants(st, op.target, pos, "erased");
      return;
    }
    case "resolve-conflict": {
      const conflict = st.conflicts.get(op.conflict);
      if (!conflict) return;
      applyResolution(st, conflict, op, pos);
      return;
    }
    case "set-safety-boundary": {
      st.safety.set(op.boundary.id, op.boundary);
      for (const t of op.erase ?? []) eraseWithDescendants(st, t, pos, `safety:${op.boundary.topic}`);
      return;
    }
    case "grant-authority": {
      st.grants.set(op.delegate, {
        id: op.delegate,
        grantee: op.grantee,
        acts: new Set(op.acts),
        revoked: false,
      });
      return;
    }
    case "revoke-authority": {
      const g = st.grants.get(op.delegate);
      if (g) g.revoked = true;
      return;
    }
    case "establish-artifact": {
      st.artifacts.set(op.artifact, {
        id: op.artifact,
        pos,
        actor: op.actor,
        kind: op.artifactKind,
        label: op.label,
        links: [...(op.links ?? [])],
        provenance: op.provenance ?? { introducedBy: op.actor },
        standing: "active",
        standingReason: null,
      });
      return;
    }
    case "link-artifact": {
      st.artifacts.get(op.artifact)?.links.push(op.link);
      return;
    }
    case "establish-ruling": {
      st.rulings.set(op.ruling, {
        id: op.ruling,
        pos,
        actor: op.actor,
        scope: op.scope,
        text: op.text,
        ruleRef: op.ruleRef ?? null,
        anchors: [...(op.anchors ?? [])],
        provenance: op.provenance ?? { introducedBy: op.actor },
        standing: "active",
        standingReason: null,
      });
      return;
    }
  }
}

interface AssertionInit {
  holder: AnchorId | null;
  fictionalTime: number | null;
  mode: EstablishmentMode | undefined;
  uncertainty: Uncertainty;
  provenance: Provenance;
  realizes?: AssertionId;
}

/** Move an assertion out of active standing, updating the establishment slot index. */
function deactivate(st: CampaignState, rec: AssertionRecord, standing: Standing, reason: string): void {
  rec.standing = standing;
  rec.standingReason = reason;
  if (rec.stance === "establishment") st.establishmentBySlot.get(slotOf(rec.proposition))?.delete(rec.id);
}

function addAssertion(
  st: CampaignState,
  pos: number,
  actor: string,
  stance: Stance,
  proposition: Proposition,
  init: AssertionInit,
): AssertionRecord {
  const rec: AssertionRecord = {
    id: assertionIdAt(pos),
    pos,
    actor,
    stance,
    proposition,
    holder: init.holder,
    fictionalTime: init.fictionalTime,
    mode: init.mode ?? null,
    uncertainty: init.uncertainty,
    provenance: init.provenance,
    standing: "active",
    standingReason: null,
    effectiveValue: proposition.value,
    priorValues: [],
    realizes: init.realizes ?? null,
    realizedBy: [],
    erased: false,
  };
  st.assertions.set(rec.id, rec);
  // Identity-equivalence assertions are multi-valued (an anchor may be equivalent to
  // several) and symmetric, so they are never single-valued continuity conflicts.
  if (stance === "establishment" && !isEquivalence(proposition)) {
    const slot = slotOf(proposition);
    let active = st.establishmentBySlot.get(slot);
    if (!active) {
      active = new Set();
      st.establishmentBySlot.set(slot, active);
    }
    detectConflicts(st, rec, slot, active);
    active.add(rec.id);
  }
  return rec;
}

/**
 * Continuity conflict = two active *establishment* assertions on one single-valued
 * slot claiming the same fictional time with different values. A later fictional
 * time is a State transition, not a conflict; beliefs/suspicions never conflict.
 * `active` holds only the currently-active establishment ids on the slot.
 */
function detectConflicts(st: CampaignState, rec: AssertionRecord, slot: string, active: Set<AssertionId>): void {
  for (const otherId of active) {
    const other = st.assertions.get(otherId);
    if (!other) continue;
    if (other.fictionalTime !== rec.fictionalTime) continue; // distinct time => transition
    if (other.effectiveValue === rec.effectiveValue) continue;
    const id = conflictIdOf(other.pos, rec.pos);
    const existing = st.conflicts.get(id);
    if (existing) {
      if (!existing.members.includes(rec.id)) existing.members.push(rec.id);
    } else {
      st.conflicts.set(id, { id, slot, members: [other.id, rec.id], resolvedAt: null, resolution: null });
    }
  }
}

function applyResolution(
  st: CampaignState,
  conflict: ContinuityConflict,
  op: Extract<Operation, { kind: "resolve-conflict" }>,
  pos: number,
): void {
  const effect = op.effect;
  switch (effect.kind) {
    case "correction": {
      for (const id of conflict.members) {
        if (id === effect.keep) continue;
        const a = st.assertions.get(id);
        if (a) deactivate(st, a, "corrected", `declared erroneous record by conflict resolution at ${pos}`);
      }
      conflict.resolution = `correction: kept ${effect.keep}`;
      break;
    }
    case "rewind": {
      const a = st.assertions.get(effect.remove);
      if (a) deactivate(st, a, "rewound", `rewound by conflict resolution at ${pos}`);
      conflict.resolution = `rewind: removed ${effect.remove}`;
      break;
    }
    case "temporal-qualification": {
      for (const [id, ft] of Object.entries(effect.assign)) {
        const a = st.assertions.get(id as AssertionId);
        if (a) a.fictionalTime = ft;
      }
      conflict.resolution = "temporal-qualification";
      break;
    }
    case "new-establishment": {
      for (const id of conflict.members) {
        const a = st.assertions.get(id);
        if (a && a.standing === "active") deactivate(st, a, "superseded", `superseded by new establishment at ${pos}`);
      }
      addAssertion(st, pos, op.actor, "establishment", effect.proposition, {
        holder: null,
        fictionalTime: effect.fictionalTime,
        mode: "adjudication",
        uncertainty: { kind: "certain" },
        provenance: { introducedBy: op.actor },
      });
      conflict.resolution = "new-establishment";
      break;
    }
  }
  conflict.resolvedAt = pos;
}

/**
 * Erasure: destructive content removal that traces the claim-scoped Provenance
 * support graph. The erased assertion stays addressable as a non-revealing
 * tombstone so continuity holds, but its content is gone from state (and, via log
 * compaction and export, from the record). A descendant linked by a "disclosure"
 * relation reveals the erased content and is erased with it; an independently
 * supported descendant survives with a visible Provenance gap where the erased
 * support was, keeping its standing.
 */
function eraseWithDescendants(st: CampaignState, target: AssertionId, pos: number, reason: string): void {
  const erased = new Set<AssertionId>();
  const stack: AssertionId[] = [target];
  while (stack.length) {
    const id = stack.pop()!;
    if (erased.has(id)) continue;
    erased.add(id);
    const a = st.assertions.get(id);
    if (!a) continue;
    if (a.stance === "establishment") st.establishmentBySlot.get(slotOf(a.proposition))?.delete(a.id);
    a.standing = "erased";
    a.standingReason = `${reason} at ${pos}`;
    a.erased = true;
    a.effectiveValue = "";
    a.proposition = { ...a.proposition, value: "" };
    a.priorValues = [];
    a.provenance = { introducedBy: "-", gap: "erased" };
    // A disclosure descendant reveals this content, so it is erased with it.
    for (const desc of st.assertions.values()) {
      if (desc.erased) continue;
      if ((desc.provenance.support ?? []).some((s) => s.relation === "disclosure" && s.source === id)) stack.push(desc.id);
    }
  }
  // Independently supported material survives: drop the erased support links and
  // leave a visible Provenance gap in their place, never fabricating replacement.
  for (const a of st.assertions.values()) {
    if (a.erased || !a.provenance.support) continue;
    const kept = a.provenance.support.filter((s) => !erased.has(s.source));
    if (kept.length === a.provenance.support.length) continue;
    a.provenance = {
      ...a.provenance,
      support: kept.length ? kept : undefined,
      gap: a.provenance.gap ?? "erased support removed; independently supported",
    };
  }
  // A conflict whose members are no longer both active establishments is no longer
  // a live continuity conflict: erasing a side resolves it rather than leaving a
  // stale conflict that references erased material.
  for (const c of st.conflicts.values()) {
    if (c.resolvedAt !== null) continue;
    const live = c.members.filter((m) => st.assertions.get(m)?.standing === "active");
    if (live.length < 2) {
      c.resolvedAt = pos;
      c.resolution = "resolved by erasure of a conflicting member";
    }
  }
}

/** Active grant acts held by an actor, for authority validation. */
export function grantedActs(st: CampaignState, grant: GrantId | undefined): Set<Act> {
  if (!grant) return new Set();
  const g = st.grants.get(grant);
  if (!g || g.revoked) return new Set();
  return g.acts;
}

/** Every act an actor holds across their active grants, for read-side authority checks. */
export function heldActs(st: CampaignState, actor: string): Set<Act> {
  const acts = new Set<Act>();
  for (const g of st.grants.values()) {
    if (g.revoked || g.grantee !== actor) continue;
    for (const act of g.acts) acts.add(act);
  }
  return acts;
}

/**
 * Resolve a retract target across the three retractable stores (assertion, artifact,
 * ruling). Their id spaces are disjoint, so at most one store holds the target; a
 * single lookup keeps validation and application from drifting.
 */
export function retractableAt(
  st: CampaignState,
  target: AssertionId | ArtifactId | RulingId,
): AssertionRecord | ArtifactRecord | RulingRecord | undefined {
  return (
    st.assertions.get(target as AssertionId) ??
    st.artifacts.get(target as ArtifactId) ??
    st.rulings.get(target as RulingId)
  );
}
