/**
 * Vault materialization: render the whole campaign to on-disk Markdown — one page
 * per referential anchor plus a derived index — inside the vault folder.
 *
 * Pages and the index are Derived views, rebuildable from the log and never
 * authoritative. Materialization is a clean rebuild: existing derived surfaces are
 * removed first, so deleting every page and index and re-materializing restores
 * byte-identical content. Files are plain Markdown in the vault root, so a synced
 * copy is fully readable with no core running (the mobile-read story).
 */

import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import type { AnchorId } from "../core/ids.ts";
import type { AnchorRole } from "../core/operations.ts";
import type { CampaignState } from "../core/state.ts";
import { project, type ProjectOptions } from "./project.ts";

const PAGES_DIR = "pages";
const INDEX_FILE = "Index.md";

/** Fixed role order so the index is deterministic regardless of establishment interleaving. */
const ROLE_ORDER: AnchorRole[] = ["entity", "group", "place", "object", "event"];

export interface Materialization {
  /** Vault-relative paths written, in write order. */
  files: string[];
}

/**
 * Render every anchor to `pages/<anchor>.md` and a derived `Index.md`, replacing
 * any prior derived surfaces. Pure function of the log at head, so re-materializing
 * the same state is byte-identical and a delete-all rebuild converges.
 */
export function materialize(root: string, campaign: string, state: CampaignState, opts: ProjectOptions = {}): Materialization {
  const pagesDir = join(root, PAGES_DIR);
  // Derived surfaces are rebuildable; start from empty so removed anchors leave no stale page.
  rmSync(pagesDir, { recursive: true, force: true });
  rmSync(join(root, INDEX_FILE), { force: true });
  mkdirSync(pagesDir, { recursive: true });

  const files: string[] = [];
  for (const anchor of state.anchors.keys()) {
    const { text } = project(campaign, state, anchor, opts);
    const rel = join(PAGES_DIR, `${anchor}.md`);
    writeFileSync(join(root, rel), text);
    files.push(rel);
  }

  writeFileSync(join(root, INDEX_FILE), renderIndex(campaign, state));
  files.push(INDEX_FILE);
  return { files };
}

/** A derived, rebuildable index: entities grouped by role, each linking to its page. */
function renderIndex(campaign: string, state: CampaignState): string {
  const byRole = new Map<AnchorRole, { anchor: AnchorId; label: string }[]>();
  for (const [anchor, meta] of state.anchors) {
    const bucket = byRole.get(meta.role);
    const entry = { anchor, label: meta.label };
    if (bucket) bucket.push(entry);
    else byRole.set(meta.role, [entry]);
  }

  const lines = ["---", `campaign: ${campaign}`, `basis: ${state.head}`, "---", "", `# ${campaign} — Index`, ""];
  for (const role of ROLE_ORDER) {
    const entries = byRole.get(role);
    if (!entries || entries.length === 0) continue;
    lines.push(`## ${role}`, "");
    for (const { anchor, label } of entries) lines.push(`- [${label}](${PAGES_DIR}/${anchor}.md)`);
    lines.push("");
  }
  return lines.join("\n");
}
