/**
 * The campaign vault: a directory whose dot-prefixed subfolder holds the
 * establishment-ordered operation log as the durable authoritative record.
 *
 * The log is append-only JSONL — one accepted operation per line, in
 * establishment order — so a process restart reloads it by replay. The vault is
 * an ordinary folder (record, and later projections/backup/sync/export all live
 * under it); no database, so a synced copy is readable anywhere.
 */

import { appendFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { basename, join } from "node:path";
import { campaignId, type CampaignId } from "./ids.ts";
import type { Accepted } from "./state.ts";

const DOT_FOLDER = ".memory";
const LOG_FILE = "log.jsonl";
const MANIFEST_FILE = "campaign.json";

/** The persistence boundary for a campaign's authoritative log. */
export interface VaultStore {
  readonly id: CampaignId;
  readonly owner: string;
  /** The vault folder: the authoritative log lives in its dot-folder; projections live in the root. */
  readonly root: string;
  loadLog(): Accepted[];
  append(entry: Accepted): void;
}

interface VaultManifest {
  campaign: string;
  owner: string;
}

export class FileVault implements VaultStore {
  readonly id: CampaignId;
  readonly owner: string;
  readonly root: string;
  private readonly logPath: string;

  private constructor(id: CampaignId, owner: string, root: string, logPath: string) {
    this.id = id;
    this.owner = owner;
    this.root = root;
    this.logPath = logPath;
  }

  /** Open an existing vault, or create one (with its dot-folder) if absent. */
  static open(vaultPath: string, owner = "player"): FileVault {
    const dir = join(vaultPath, DOT_FOLDER);
    const manifestPath = join(dir, MANIFEST_FILE);
    const logPath = join(dir, LOG_FILE);

    if (existsSync(manifestPath)) {
      const manifest = JSON.parse(readFileSync(manifestPath, "utf8")) as VaultManifest;
      return new FileVault(campaignId(manifest.campaign), manifest.owner, vaultPath, logPath);
    }

    mkdirSync(dir, { recursive: true });
    const id = campaignId(basename(vaultPath));
    const manifest: VaultManifest = { campaign: id, owner };
    writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
    writeFileSync(logPath, "");
    return new FileVault(id, owner, vaultPath, logPath);
  }

  loadLog(): Accepted[] {
    if (!existsSync(this.logPath)) return [];
    return readFileSync(this.logPath, "utf8")
      .split("\n")
      .filter((line) => line.trim().length > 0)
      .map((line) => JSON.parse(line) as Accepted);
  }

  /** Append one accepted operation as a durable JSONL line, in establishment order. */
  append(entry: Accepted): void {
    appendFileSync(this.logPath, `${JSON.stringify(entry)}\n`);
  }
}
