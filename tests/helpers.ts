/**
 * Test builders. Keep op construction terse without hiding the semantics under test.
 */

import { Campaign, anchorId, assertionIdAt, campaignId, operationId } from "../src/index.ts";
import type { AnchorId, AssertionId, GrantId } from "../src/core/ids.ts";
import type { EstablishmentMode, Provenance, Stance, Uncertainty } from "../src/core/operations.ts";
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

export function establishAnchor(c: Campaign, actor: string, id: string, label: string, grant?: GrantId) {
  return c.submit({ kind: "establish-anchor", operationId: oid(), actor, grant, anchor: anchorId(id), label });
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
  });
}

export const anchor = (id: string): AnchorId => anchorId(id) as AnchorId;
