/**
 * The generator World: a builder wrapping a Campaign that skeletons plant into,
 * plus the confusable adversarial-mass generator.
 *
 * Noise is confusable but *never contradictory*: every generated assertion uses a
 * unique attribute slot, so it can never collide with a planted establishment to
 * form an unintended continuity conflict. Noise lands on both focal anchors (to
 * create relevant-looking bulk that pressures the recall budget) and on separate
 * confusable-named anchors (to pressure identity separation).
 */

import { Campaign } from "../campaign.ts";
import { anchorId, campaignId, operationId, type AnchorId, type ConflictId, type GrantId, type OperationId } from "../core/ids.ts";
import { IDENTITY_EQUIVALENCE, type ConflictEffect, type EstablishmentMode, type Proposition, type Provenance, type Stance, type Uncertainty } from "../core/operations.ts";
import type { Receipt } from "../core/receipt.ts";
import { assertionIdAt, type AssertionId } from "../core/ids.ts";
import { Prng } from "./prng.ts";

const NOISE_STANCES: readonly Stance[] = ["establishment", "player-awareness", "preparation", "belief", "suspicion", "entity-awareness"];
const NOISE_NAME_BASES = ["Maera", "Mara", "Maeve", "Ilyen", "Ilya", "Kade", "Kael", "Voss", "Vross", "Corvin", "Corwin", "Selra", "Selka"];
const NOISE_ROLES = ["dockhand", "scribe", "smuggler", "clerk", "sailor", "factor", "warden", "cooper"];
const NOISE_VALUES = ["a rumor", "a ledger entry", "a debt", "a favor", "a grudge", "a cargo manifest", "a false name", "a hidden key"];

export interface WorldOptions {
  seed: number;
  /** Noise multiplier ≈ session count (S=50, M=200, L=500). */
  scale: number;
  owner?: string;
  campaign?: string;
}

export class World {
  readonly campaign: Campaign;
  readonly owner: string;
  private readonly prng: Prng;
  private readonly scale: number;
  private opSeq = 0;
  private readonly focal: AnchorId[] = [];
  private readonly noiseAnchors: AnchorId[] = [];

  constructor(opts: WorldOptions) {
    this.owner = opts.owner ?? "player";
    this.campaign = new Campaign(campaignId(opts.campaign ?? `harness-${opts.seed}-${opts.scale}`), this.owner);
    this.prng = new Prng(opts.seed);
    this.scale = opts.scale;
  }

  private oid(): OperationId {
    return operationId(`h${++this.opSeq}`);
  }

  private accept(r: Receipt): Receipt {
    if (r.disposition !== "accepted") throw new Error(`harness op rejected: ${r.reason}`);
    return r;
  }

  head(): number {
    return this.campaign.head();
  }

  /** AssertionId minted by an accepted plant receipt. */
  id(r: Receipt): AssertionId {
    if (r.pos === null) throw new Error("expected accepted receipt");
    return assertionIdAt(r.pos);
  }

  anchor(id: string, label: string): AnchorId {
    const a = anchorId(id);
    this.accept(this.campaign.submit({ kind: "establish-anchor", operationId: this.oid(), actor: this.owner, anchor: a, label }));
    this.focal.push(a);
    return a;
  }

  private assert(stance: Stance, subject: AnchorId, attribute: string, value: string, opts: { holder?: AnchorId; ft?: number | null; mode?: EstablishmentMode; uncertainty?: Uncertainty; provenance?: Provenance } = {}): Receipt {
    const proposition: Proposition = { subject, attribute, value };
    return this.accept(
      this.campaign.submit({
        kind: "assert",
        operationId: this.oid(),
        actor: this.owner,
        stance,
        proposition,
        holder: opts.holder,
        fictionalTime: opts.ft ?? null,
        mode: opts.mode,
        uncertainty: opts.uncertainty,
        provenance: opts.provenance,
      }),
    );
  }

  establishment(subject: AnchorId, attribute: string, value: string, opts: { ft?: number | null; mode?: EstablishmentMode; uncertainty?: Uncertainty; provenance?: Provenance } = {}): Receipt {
    return this.assert("establishment", subject, attribute, value, opts);
  }

  /** An establishment allowed to contradict a plant (used to plant conflicts). */
  contradiction(subject: AnchorId, attribute: string, value: string, ft: number | null): Receipt {
    return this.assert("establishment", subject, attribute, value, { ft });
  }

  playerAware(subject: AnchorId, attribute: string, value: string, ft: number | null = null): Receipt {
    return this.assert("player-awareness", subject, attribute, value, { ft });
  }

  belief(holder: AnchorId, subject: AnchorId, attribute: string, value: string, ft: number | null = null): Receipt {
    return this.assert("belief", subject, attribute, value, { holder, ft });
  }

  suspicion(holder: AnchorId, subject: AnchorId, attribute: string, value: string, ft: number | null = null): Receipt {
    return this.assert("suspicion", subject, attribute, value, { holder, ft });
  }

  awareness(holder: AnchorId, subject: AnchorId, attribute: string, value: string, ft: number | null = null): Receipt {
    return this.assert("entity-awareness", subject, attribute, value, { holder, ft });
  }

  preparation(subject: AnchorId, attribute: string, value: string, ft: number | null = null): Receipt {
    return this.assert("preparation", subject, attribute, value, { ft });
  }

  /** Assert that two anchors denote the same entity. Never merges records. */
  equivalence(a: AnchorId, b: AnchorId, opts: { stance?: Stance; holder?: AnchorId; ft?: number } = {}): Receipt {
    return this.assert(opts.stance ?? "establishment", a, IDENTITY_EQUIVALENCE, b, { holder: opts.holder, ft: opts.ft ?? 1 });
  }

  correct(target: AssertionId, value: string): Receipt {
    return this.accept(this.campaign.submit({ kind: "correct", operationId: this.oid(), actor: this.owner, target, value }));
  }

  supersede(target: AssertionId, value: string, effectiveFrom: number | null): Receipt {
    return this.accept(this.campaign.submit({ kind: "supersede", operationId: this.oid(), actor: this.owner, target, value, effectiveFrom }));
  }

  retract(target: AssertionId): Receipt {
    return this.accept(this.campaign.submit({ kind: "retract", operationId: this.oid(), actor: this.owner, target }));
  }

  rewind(target: AssertionId): Receipt {
    return this.accept(this.campaign.submit({ kind: "rewind", operationId: this.oid(), actor: this.owner, target }));
  }

  erase(target: AssertionId): Receipt {
    return this.accept(this.campaign.submit({ kind: "erase", operationId: this.oid(), actor: this.owner, target }));
  }

  safety(id: string, topic: string, erase: AssertionId[] = []): Receipt {
    return this.accept(this.campaign.submit({ kind: "set-safety-boundary", operationId: this.oid(), actor: this.owner, boundary: { id, topic }, erase }));
  }

  /** The id of the first unresolved continuity conflict on a slot, or null. */
  conflictId(slot: string): ConflictId | null {
    for (const c of this.campaign.state().conflicts.values()) {
      if (c.slot === slot && c.resolvedAt === null) return c.id;
    }
    return null;
  }

  resolve(conflict: ConflictId, effect: ConflictEffect): Receipt {
    return this.accept(this.campaign.submit({ kind: "resolve-conflict", operationId: this.oid(), actor: this.owner, conflict, effect }));
  }

  grant(delegate: GrantId, grantee: string, acts: ("establish" | "prepare" | "portray" | "maintain" | "resolve")[]): void {
    this.accept(this.campaign.submit({ kind: "grant-authority", operationId: this.oid(), actor: this.owner, delegate, grantee, acts }));
  }

  private ensureNoiseAnchor(): AnchorId {
    // grow the confusable-entity pool as the campaign scales
    const want = Math.max(3, Math.floor(this.scale / 10));
    while (this.noiseAnchors.length < want) {
      const n = this.noiseAnchors.length;
      const label = `${this.prng.pick(NOISE_NAME_BASES)} ${this.prng.pick(NOISE_NAME_BASES)}`;
      const a = anchorId(`noise-${n}`);
      this.accept(this.campaign.submit({ kind: "establish-anchor", operationId: this.oid(), actor: this.owner, anchor: a, label }));
      this.noiseAnchors.push(a);
    }
    return this.prng.pick(this.noiseAnchors);
  }

  /**
   * Inject `weight × scale` confusable, non-contradictory operations. Each uses a
   * unique attribute slot, so no generated pair can form a continuity conflict.
   */
  noise(weight: number): void {
    const count = weight * this.scale;
    for (let i = 0; i < count; i++) {
      this.ensureNoiseAnchor();
      const onFocal = this.focal.length > 0 && this.prng.next() < 0.5;
      const subject = onFocal ? this.prng.pick(this.focal) : this.prng.pick(this.noiseAnchors);
      const stance = this.prng.pick(NOISE_STANCES);
      const attribute = `bg-${this.prng.pick(NOISE_ROLES)}-${this.opSeq}`; // unique => never contradictory
      const value = this.prng.pick(NOISE_VALUES);
      const ft = this.prng.int(1000);
      if (stance === "belief" || stance === "suspicion" || stance === "entity-awareness") {
        this.assert(stance, subject, attribute, value, { holder: this.prng.pick(this.noiseAnchors), ft });
      } else {
        this.assert(stance, subject, attribute, value, { ft });
      }
    }
  }
}
