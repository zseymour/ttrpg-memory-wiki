/**
 * Acceptance validation: authority, semantic preconditions, and invariants.
 *
 * A proposal is accepted only when the actor holds applicable delegated authority
 * for the act, its declared preconditions still hold, and campaign invariants
 * pass. Model confidence is never an input. Failures become explicit rejection
 * receipts or surfaced conflicts — never silent overwrites.
 */

import { requiredAct, type Operation } from "./operations.ts";
import { grantedActs, type CampaignState } from "./state.ts";

export interface Rejection {
  code: string;
  message: string;
}

/** Returns a Rejection if the proposal must not be accepted, else null. */
export function validate(st: CampaignState, op: Operation, owner: string): Rejection | null {
  const authErr = checkAuthority(st, op, owner);
  if (authErr) return authErr;

  const preErr = checkPreconditions(st, op);
  if (preErr) return preErr;

  return checkInvariants(st, op);
}

function checkAuthority(st: CampaignState, op: Operation, owner: string): Rejection | null {
  const act = requiredAct(op);
  if (act === null) return null;
  if (op.actor === owner) return null; // campaign owner holds root authority

  if (act === "owner-only") {
    return {
      code: "authority",
      message: `${op.kind} requires non-delegable owner authority; actor ${op.actor} is not the owner`,
    };
  }
  if (!grantedActs(st, op.grant).has(act)) {
    return {
      code: "authority",
      message: `actor ${op.actor} lacks an active grant for act '${act}'`,
    };
  }
  return null;
}

function checkPreconditions(st: CampaignState, op: Operation): Rejection | null {
  for (const pre of op.expect ?? []) {
    const a = st.assertions.get(pre.assertion);
    if (!a) {
      return { code: "precondition", message: `precondition failed: ${pre.assertion} does not exist` };
    }
    if (pre.standing && a.standing !== pre.standing) {
      return {
        code: "conflict",
        message: `precondition failed: ${pre.assertion} standing is '${a.standing}', expected '${pre.standing}'`,
      };
    }
  }
  return null;
}

function checkInvariants(st: CampaignState, op: Operation): Rejection | null {
  switch (op.kind) {
    case "assert": {
      if (!st.anchors.has(op.proposition.subject)) {
        return {
          code: "identity",
          message: `subject anchor ${op.proposition.subject} is not established`,
        };
      }
      const perspectival = op.stance === "belief" || op.stance === "suspicion" || op.stance === "entity-awareness";
      if (perspectival && !op.holder) {
        return { code: "epistemic", message: `${op.stance} requires an explicit perspective holder` };
      }
      if (perspectival && op.holder && !st.anchors.has(op.holder)) {
        return { code: "identity", message: `holder anchor ${op.holder} is not established` };
      }
      return null;
    }
    case "correct":
    case "retract":
    case "supersede":
    case "rewind":
    case "erase": {
      const target = st.assertions.get(op.target);
      if (!target) return { code: "identity", message: `target ${op.target} does not exist` };
      if (target.standing === "erased") {
        return { code: "lifecycle", message: `target ${op.target} is erased` };
      }
      return null;
    }
    case "resolve-conflict": {
      const conflict = st.conflicts.get(op.conflict);
      if (!conflict) return { code: "identity", message: `conflict ${op.conflict} does not exist` };
      if (conflict.resolvedAt !== null) {
        return { code: "lifecycle", message: `conflict ${op.conflict} is already resolved` };
      }
      return null;
    }
    default:
      return null;
  }
}
