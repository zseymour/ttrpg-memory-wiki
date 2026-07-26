/**
 * Test builders. Keep op construction terse without hiding the semantics under test.
 */

import { Campaign, anchorId, artifactId, assertionIdAt, campaignId, operationId, rulingId, IDENTITY_EQUIVALENCE } from "../src/index.ts";
import type { AnchorId, ArtifactId, AssertionId, GrantId, RulingId } from "../src/core/ids.ts";
import type { AnchorRole, ArtifactLink, Citation, EstablishmentMode, Provenance, Stance, Uncertainty } from "../src/core/operations.ts";
import type { Receipt } from "../src/index.ts";

/** The AssertionId minted by an accepted operation. Throws on a rejected receipt. */
export function aid(r: Receipt): AssertionId {
  if (r.pos === null) throw new Error(`expected accepted receipt, got: ${r.reason}`);
  return assertionIdAt(r.pos);
}

let counter = 0;
/** A fresh, unique operation id. Tests needing idempotency pass an explicit id. */
export const oid = () => operationId(`op-${++counter}`);

export function newCampaign(owner = "player"): Campaign {
  return new Campaign(campaignId(`camp-${++counter}`), owner);
}

export function establishAnchor(c: Campaign, actor: string, id: string, label: string, grant?: GrantId, role?: AnchorRole) {
  return c.submit({ kind: "establish-anchor", operationId: oid(), actor, grant, anchor: anchorId(id), label, role });
}

interface AssertOpts {
  actor: string;
  stance: Stance;
  subject: string;
  attribute: string;
  value: string;
  holder?: string;
  fictionalTime?: number | null;
  mode?: EstablishmentMode;
  uncertainty?: Uncertainty;
  provenance?: Provenance;
  grant?: GrantId;
  operationId?: string;
  realizes?: AssertionId;
}

export function assertClaim(c: Campaign, o: AssertOpts) {
  return c.submit({
    kind: "assert",
    operationId: o.operationId ? operationId(o.operationId) : oid(),
    actor: o.actor,
    grant: o.grant,
    stance: o.stance,
    proposition: { subject: anchorId(o.subject) as AnchorId, attribute: o.attribute, value: o.value },
    holder: o.holder ? (anchorId(o.holder) as AnchorId) : undefined,
    fictionalTime: o.fictionalTime ?? null,
    mode: o.mode,
    uncertainty: o.uncertainty,
    provenance: o.provenance,
    realizes: o.realizes,
  });
}

export const anchor = (id: string): AnchorId => anchorId(id) as AnchorId;

/** Establish (or perspectivally claim) that two anchors denote the same entity. Never merges. */
export function assertEquivalence(
  c: Campaign,
  o: { actor: string; stance: Stance; a: string; b: string; holder?: string; fictionalTime?: number | null; grant?: GrantId },
) {
  return c.submit({
    kind: "assert",
    operationId: oid(),
    actor: o.actor,
    grant: o.grant,
    stance: o.stance,
    proposition: { subject: anchorId(o.a) as AnchorId, attribute: IDENTITY_EQUIVALENCE, value: o.b },
    holder: o.holder ? (anchorId(o.holder) as AnchorId) : undefined,
    fictionalTime: o.fictionalTime ?? null,
  });
}

export function establishArtifact(
  c: Campaign,
  o: { actor: string; id: string; kind: string; label: string; links?: ArtifactLink[]; grant?: GrantId },
) {
  return c.submit({ kind: "establish-artifact", operationId: oid(), actor: o.actor, grant: o.grant, artifact: artifactId(o.id), artifactKind: o.kind, label: o.label, links: o.links });
}

export function linkArtifact(c: Campaign, o: { actor: string; id: string; link: ArtifactLink; grant?: GrantId }) {
  return c.submit({ kind: "link-artifact", operationId: oid(), actor: o.actor, grant: o.grant, artifact: artifactId(o.id), link: o.link });
}

export function establishRuling(
  c: Campaign,
  o: { actor: string; id: string; scope: string; text: string; cites?: Citation[]; precedenceOver?: string[]; anchors?: string[]; grant?: GrantId },
) {
  return c.submit({ kind: "establish-ruling", operationId: oid(), actor: o.actor, grant: o.grant, ruling: rulingId(o.id), scope: o.scope, text: o.text, cites: o.cites, precedenceOver: o.precedenceOver?.map((r) => rulingId(r) as RulingId), anchors: o.anchors?.map((a) => anchorId(a) as AnchorId) });
}

export const artifact = (id: string): ArtifactId => artifactId(id) as ArtifactId;
export const ruling = (id: string): RulingId => rulingId(id) as RulingId;
