# Vault sync and erasure: keeping erasure destructive

The campaign vault is an ordinary folder. The core owns the Authoritative record (the operation log under `.memory/`) and renders the Projection surfaces (the Markdown pages and `Index.md`) beside it. When you accept an Erasure — an erase request, or a Safety boundary that names affected content — the core makes it destructive **within that folder**: it rewrites its own log in place to a compacted form with the erased content gone, re-projects the pages, and purges stale derived pages. Ordinary file sync (Syncthing, Dropbox, iCloud Drive, etc.) then carries the compacted log and rebuilt pages to your other devices, which converge to the same erased-content-free state with no core running on the reading device.

Erasure is destructive **only inside that local boundary**. Anything that copied the vault's bytes *before* the Erasure, into a store the core cannot reach, still holds the original content until you clear it there. These external stores are your responsibility. Configure them up front, before you rely on Erasure for safety.

## External exclusions to configure

### 1. Sync-provider version history / file versioning

Most sync tools keep old versions of changed files, which defeats an in-place rewrite.

- **Dropbox**: version history and Rewind retain prior file contents — disable extended version history for the vault (or delete the versions after an Erasure); on personal tiers, purge the affected file versions.
- **iCloud Drive**: keeps file versions — remove older versions for the erased files.
- **Syncthing**: if File Versioning is enabled, erased content is copied into `.stversions/` — set versioning to *None* for the vault folder, or clear `.stversions/` after an Erasure.
- Any other provider: turn off per-file version retention for the vault, or purge retained versions.

### 2. OS backups

Whole-disk or folder backups snapshot the vault on a schedule.

- **macOS Time Machine**: add the vault to the exclusion list (System Settings → General → Time Machine → Options), or delete the affected backups.
- **Windows File History / restore points**: exclude the vault folder, or remove affected history.
- **Linux**: exclude the vault from Timeshift / Déjà Dup; prune ZFS/btrfs snapshots that captured it.

### 3. Git history (if the vault is under version control)

Erased content persists in commits, the reflog, tags, stashes, and every remote or fork.

- Prefer **not committing the vault** at all (add it to `.gitignore`), so no erased content ever enters history.
- If it is already tracked, a plain new commit does **not** remove the old content — rewrite history (`git filter-repo` or BFG), force-push all refs, expire the reflog (`git reflog expire --expire=now --all && git gc --prune=now`), and remember that every clone, fork, and remote must be rewritten or discarded too.

### 4. Editor recovery snapshots, swap/backup files, and trash

Editors and the OS keep their own recovery copies outside the core's control.

- **Obsidian**: workspace caches and file-recovery snapshots under `.obsidian/` retain deleted content — disable or clear File Recovery for the vault.
- **Vim**: swap (`.swp`) and backup (`~`) files — disable or clear them for the vault path.
- **VS Code**: Local History retains prior contents — clear it for the affected files.
- **OS Trash / Recycle Bin**: emptying a page into the trash is not deletion — empty it after an Erasure.

## After an Erasure

Verify convergence on each synced device: the compacted `.memory/` log and the rebuilt pages should contain no erased content. Then confirm the four external stores above hold no lingering copy for the erased vault. The core guarantees destruction inside the local boundary; everything beyond it is outside the core's reach and is yours to configure.
