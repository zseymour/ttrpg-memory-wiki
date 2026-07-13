/**
 * Campaign memory subsystem — public surface.
 *
 * The boundary that represents, validates, stores, and retrieves campaign memory
 * for long-running duet play, delivered as an establishment-ordered operation log
 * inside an editor-compatible vault. This module re-exports the core write seam,
 * the recall contract, and export/replay.
 */

export { Campaign, type Receipt } from "./campaign.ts";
export * from "./core/ids.ts";
export * from "./core/operations.ts";
export {
  replay,
  type Accepted,
  type AssertionRecord,
  type CampaignState,
  type ContinuityConflict,
  type GrantRecord,
  type Standing,
} from "./core/state.ts";
export { validate, type Rejection } from "./core/validate.ts";
export { exportCampaign, reviveExport, type CampaignExport } from "./core/export.ts";
export * from "./recall/contract.ts";
export { assemble, plan, type RecallPath, type RecallPlan } from "./recall/engine.ts";
