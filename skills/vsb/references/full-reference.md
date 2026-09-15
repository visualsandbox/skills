# vsb CLI — full reference

Generated against vsb v0.1. The shape of every command, every flag. Use the
sibling `SKILL.md` for the short version + critical rules.

---

## Global options

These work on every command:

| Flag | Description |
|------|-------------|
| `--json` | Force JSON output to stdout. (Auto-on when piped or non-TTY.) |
| `--help` | Citty-rendered command help. With `--json` and *no* command, root prints the full machine-readable command schema. |
| `--api-key <key>` / `--api-key=<key>` | Override the configured key for one call. |

## Environment variables

| Var | Purpose |
|-----|---------|
| `VSB_API_KEY` | Bearer key (issued by `vsb setup` or the in-product CLI Tokens page). |
| `VSB_API_BASE` | Override base URL (default: `https://visualsandbox.com/api`). Useful for staging. |
| `VSB_NO_UPDATE_CHECK` | Set to `1` to disable the version probe entirely. |
| `VSB_NO_TELEMETRY` | Set to `1` to stop sending the anonymous install id (random UUID + version + platform) with the version probe. |
| `VSB_NO_AUTO_UPDATE` | Set to `1` to disable the background binary auto-update and the startup skills auto-sync (banner still prints). |
| `NO_COLOR` | Disable ANSI colors. |

`vsb setup` writes both to `~/.vsb/config.json`. The CLI also auto-loads
`.env` from the working directory unless `--no-auto-load-env` is passed to
`setup`.

---

## `vsb setup`

Configure the CLI. Interactive by default; opens a local callback server +
browser to issue a project-scoped key.

```
vsb setup                                       # interactive wizard
vsb setup --non-interactive --api-key <key>     # script-friendly
vsb setup --output-format auto|json|standard    # set the default mode
vsb setup --no-auto-load-env                    # skip dotenv on future runs
```

---

## `vsb models [query]`

Search/list the model registry.

| Flag | Type | Description |
|------|------|-------------|
| `query` | positional | Free-text search (matches name + description) |
| `--category <c>` | string | Filter by category: `image`, `video`, `audio`, `3d`, `vector`, `text`, `image-enhance` |
| `--modality <m>` | string | Filter by modality: `image`, `video`, `audio`, `text`, `3d`, `vector` |
| `--status <s>` | string | `active` (default), `deprecated`, `all` |
| `--limit <n>` | string | Max rows (default 20) |
| `--cursor <c>` | string | Pagination cursor (returned as `next_cursor`) |
| `--slug a,b,c` | string | Fetch specific slugs directly (comma-separated) |

Returns a `RegistryResponse`:

```json
{
  "total": 42,
  "next_cursor": null,
  "models": [
    {
      "slug": "nano-banana",
      "category": "image",
      "display_name": "Nano Banana",
      "description": "...",
      "owner": "Google",
      "tags": [],
      "inputs_schema": { "..." : "JSONSchema dict" },
      "ui_hints": { "labels": {}, "option_labels": {}, "hidden": [] },
      "default_cost_usd": 0.05,
      "default_cost_unit": "image"
    }
  ]
}
```

Note: `slug` is the **bare name** (`nano-banana`); to *run* the model you need
`<category>/<slug>` (`image/nano-banana`). The `category` field is right next to
the slug in every entry.

---

## `vsb schema <slug>`

Inspect inputs/outputs.

| Flag | Type | Description |
|------|------|-------------|
| `slug` | positional | `<category>/<name>`, e.g. `image/nano-banana` |
| `--format compact|openapi` | string | Default `compact` |

`compact` shape:

```json
{
  "slug": "image/nano-banana",
  "inputs": {
    "prompt": { "type": "string", "required": true, "description": "..." },
    "aspect_ratio": { "type": "string", "enum": ["1:1", "16:9", "..."], "default": "1:1" },
    "image_input": { "type": "array", "default": null, "description": "Reference images" }
  },
  "outputs": {
    "urls": { "type": "array" },
    "format": { "type": "string" }
  }
}
```

`openapi` shape returns the raw OpenAPI 3.1 spec for the endpoint.

---

## `vsb pricing <slug>`

Cost lookup for a model. **Bearer auth required** (API key.)

```json
{
  "slug": "image/nano-banana",
  "currency": "USD",
  "unit": "image",
  "user_cost_estimate": 0.04875,
  "tiers": [],
  "notes": "Per-image pricing, no resolution surcharge."
}
```

Cost units in v0.1: `image`, `second`, `svg`, `audio`, `model`, `video` (no `per_*` prefix). Some models with variable output use `tiers` (e.g. seconds-based for video).

---

## `vsb run <slug> [--<input> <value>...]`

Execute a model. The CLI walks `argv` collecting every `--<key> <value>` and
`--<key>=<value>` pair into a Pydantic input dict, then POSTs to
`/api/v1/<category>/<name>/`.

| Flag | Description |
|------|-------------|
| `slug` | `<category>/<name>` |
| `--<input> <value>` | Repeat once per model input. Values coerced via `parseValue` — numbers, booleans, JSON literals all work. |
| `--<input>=<value>` | Equivalent equals form. |
| `--async` | Submit + return `{job_id}` without polling |
| `--download [template]` | Save result media after completion. Template tokens: `{request_id}`, `{index}`, `{ext}`. Default: `./{request_id}_{index}.{ext}` |
| `--sandbox-name "<title>"` | Name this session's canvas after the work. Applies only while the canvas is still unnamed. |
| `--sandbox-uuid <uuid>` | Put this run on a specific canvas instead of this session's |
| `--sandbox <uuid\|name>` | Same, by name or uuid prefix |
| `--no-sandbox` | Keep this run off the canvas. It still lands in the library. |

Reserved (NOT forwarded as inputs): `--async`, `--json`, `--help`, `--download`, `--logs`, `--api-key`, `--sandbox-name`, `--sandbox-uuid`, `--no-sandbox`.

Sync return on success:

```json
{
  "status": "completed",
  "slug": "image/nano-banana",
  "job_id": "8f3...",
  "cost": 0.04875,
  "result": { "urls": [...], "format": "jpg", ... },
  "downloaded_files": ["./out/8f3..._0.jpg"]
}
```

Async return:

```json
{
  "status": "submitted",
  "job_id": "8f3...",
  "slug": "image/nano-banana",
  "hint": "vsb status 8f3..."
}
```

---

## `vsb status <job_id>`

Poll a job. By default returns `JobOut` as-is.

| Flag | Description |
|------|-------------|
| `jobId` | positional |
| `--result` | Include the full `result` blob (urls, cost, dimensions). Implied by `--download`. |
| `--cancel` | POST to `/v1/jobs/<id>/cancel/`. Returns the cancelled job; exits 1 with a clear message if it had already finished (409). |
| `--download [template]` | Download result media when status is `completed`. Same templating as `vsb run`. |

`JobOut`:

```json
{
  "job_id": "...",
  "category": "video",
  "slug": "veo-3.1-fast",
  "status": "queued | in_progress | completed | failed | cancelled",
  "progress": 42,
  "created_at": "...",
  "completed_at": "...",
  "eta_seconds": 48.5,
  "elapsed_seconds": 12.3,
  "share_url": "https://visualsandbox.com/share/<job_id>/",
  "result": null | { "urls": [...], "format": "mp4", "cost": 0.45, "predict_time": 32.1, "width": 1920, "height": 1080 },
  "error": null | { "code": "...", "message": "...", "retry_after": null, "details": null },
  "metadata": { "external_id": "...", "provider": "fal", "queued_at": "...", "started_at": "...", "cancelled_at": null },
  "parent_uuid": null
}
```

`eta_seconds` is how long this model typically takes end to end (per-model
running average on the server); `elapsed_seconds` is how long the job has been
running. Both are `null` once the job is terminal. Remaining ≈
`eta_seconds - elapsed_seconds` — use it to pick a sensible poll sleep instead
of a blind fixed interval. `share_url` is the public result page — the link to
show the user (raw CDN urls are for chaining inputs only).

---

## `vsb jobs`

List your recent jobs, newest first. Wraps `GET /v1/jobs/`
(cursor-paginated). This is how you find jobs when the `job_id` wasn't
captured — after a session restart, or to sweep everything still running.

| Flag | Description |
|------|-------------|
| `--pending` | Only jobs still running (queued/processing). Client-side filter; `next_cursor` pages the unfiltered stream. |
| `--status <s>` | Exact status filter (server-side): `queued`, `processing`, `completed`, `failed`, `cancelled` |
| `--category <c>` | Filter by category (`image`, `video`, ...) |
| `--slug <s>` | Filter by model slug |
| `--limit <n>` | Max results, 1-200 (default 20) |
| `--cursor <c>` | Pagination cursor from a prior page |

JSON shape: `{ "items": [JobOut, ...], "next_cursor": "..." }` — same `JobOut`
as `vsb status`, so pending rows carry `eta_seconds` + `elapsed_seconds`.

```bash
vsb jobs --pending --json          # everything still cooking, with ETAs
vsb jobs --status failed --limit 5 # recent failures
```

---

## `vsb upload <path-or-url>`

Upload a local file or remote URL to Visual Sandbox storage. Returns the
hosted CDN URL — pass that as an input to subsequent `vsb run` calls.

```json
{
  "status": "uploaded",
  "url": "https://cdn.visualsandbox.com/.../file.jpg",
  "asset_id": "uuid",
  "mime": "image/jpeg",
  "bytes": 234567,
  "filename": "photo.jpg",
  "source": "user_upload",
  "created_at": "..."
}
```

Allowed types: `image/*`, `video/*`, `audio/*`, `model/gltf*`. Anything else → 400.

---

## `vsb download <url>`

Download a video from TikTok, Instagram, YouTube — any yt-dlp-supported
site — to a local file. Wraps a pinned, SHA-256-verified `yt-dlp`
bootstrapped to `~/.vsb/tools/` on first use. No auth required. See the
`vsb-download` skill for the full understand-the-video pipeline (frame
grids, caption reading).

| Flag | Purpose |
|------|---------|
| `-o, --output <path>` | Output path. Trailing `/` = directory; otherwise a yt-dlp filename template. Default: `<title> [<id>].<ext>` in cwd |
| `--info` | Print metadata JSON only — nothing downloaded |
| `--cookies <browser>` | Read cookies from a local browser profile (`chrome`, `safari`, `firefox`). Needed for Instagram and other login-walled posts; may prompt for keychain access on macOS |

`--info` returns `{id, title, description, uploader, duration_seconds,
width, height, source, url, upload_date (YYYYMMDD), view_count,
like_count}`. A download returns the same plus `"status": "downloaded"`
and `file` (resolved local path).

---

## `vsb presets`

Five subcommands. See the `vsb-presets` skill for the deep dive.

| Command | Purpose |
|---------|---------|
| `vsb presets list [--limit <n>]` | List your presets |
| `vsb presets get <uuid>` | Full preset (inputs, refs, examples) |
| `vsb presets run <uuid> [--input k=v]... [--inputs-json '{...}'] [--async]` | Re-run a preset, optionally overriding inputs |
| `vsb presets create --from <preset.json>` | Create from a `PresetIn` JSON file |
| `vsb presets delete <uuid>` | Delete (returns exit 1 + clean message on 404) |

Override semantics for `run`:
- Base = `preset.inputs`
- `--input key=value` (repeatable) merges on top
- `--inputs-json '{...}'` *replaces* base entirely (escape hatch)
- `preset.refs` (file fields) hydrate any missing keys

---

## `vsb sandbox`

Work with the canvases this account owns. Every session opens its own canvas —
a new terminal tab, or a new Claude Code conversation, gets a new one.

| Command | Purpose |
|---------|---------|
| `vsb sandbox name "<title>"` | Name this session's canvas after the work it holds |
| `vsb sandbox current` | Which canvas this session writes to, and its link |
| `vsb sandbox list [--archived]` | Every canvas, most recently used first |
| `vsb sandbox use <uuid\|name>` | Point this session at an existing canvas |
| `vsb sandbox new [name]` | Start a fresh canvas and bind this session to it |
| `vsb sandbox open [target]` | Print the link and open it in a browser (`--print` to skip the browser) |
| `vsb sandbox selection` | What the user has selected on the canvas right now |
| `vsb sandbox nodes` | Every node on the canvas (`--full`, `--limit N`, `--kind`) |
| `vsb sandbox node <uuid>` | Full detail for one node |

### Naming

A canvas starts as "Untitled Sandbox". Three things can name it, in order of
strength:

1. `vsb sandbox name "<title>"` — always wins, at any time.
2. `--sandbox-name "<title>"` on a run — lands only while the name is still a
   placeholder.
3. The run's prompt — the fallback when nothing sent a title. It is a chopped
   prompt, not a description of the work, so prefer 1 or 2.

An automatic name never overwrites a name that is already set.

```bash
vsb sandbox name "Coffee brand UGC ads" --json
# → {"uuid":"...","name":"Coffee brand UGC ads","url":"https://visualsandbox.com/sandbox/.../"}
```

Add `--sandbox-uuid <uuid>` to rename a canvas other than this session's.

---

## `vsb feedback <message>`

Send feedback or a bug report to the Visual Sandbox team. Bearer auth required. Form-encoded POST to `/api/v1/feedback/`; lands in the team's Discord with `vsb-cli v<version> (<platform>-<arch>)` as the source tag.

| Flag | Description |
|------|-------------|
| `--kind <kind>` | `comment` (default), `bug`, or `like` |
| `--image <path>` | Attach a screenshot — png/jpg/gif/webp, max 8 MB |

```bash
vsb feedback "schema for video/seedance-2 lists a flag run rejects" --kind bug --image ./error.png --json
# → {"status":"sent","kind":"bug","message":"..."}
```

Exit 3 without an API key, exit 2 on invalid `--kind` or missing image file.

---

## `vsb skills`

| Command | Purpose |
|---------|---------|
| `vsb skills list [query]` | List bundled skills, optionally filter by query |
| `vsb skills install <name> [--force]` | Copy SKILL.md + references into `./.claude/skills/<name>/` |
| `vsb skills update [name]` | Re-copy any skill whose bundled sha256 differs from installed |
| `vsb skills remove <name>` | Delete from `.claude/skills/<name>/` and the manifest |

A manifest tracks installs at `./.agents/skills/.installed.json` (sha256 per file) so `update` is precise.

v0.1 only writes to `.claude/skills/`. Cursor + AGENTS.md targets land in v0.2.

## `vsb update` + auto-update

The skill packs inside a binary are pinned. `cli/skills-ref.json` names the exact `vsb-skills` commit that was baked, and the build checks out that commit rather than whatever `main` holds when it runs. Changing a skill therefore takes two pushes, in order: push `vsb-skills`, then run `bun run gen` in the CLI repo and push the updated pin. Skip the order and `bun run gen` warns that the commit is not on the remote yet.

`vsb update` downloads the latest GitHub release and atomically swaps the compiled binary in place. Dev installs (running under Bun) auto-update too: a background `git pull --ff-only && bun install && bun run gen` fires when the checkout is on `main` with no modified tracked files; a dirty tree or non-main branch falls back to a printed manual command.

Auto-update is **on by default** and needs no action:

- Every command fires a 1.5s-bounded version probe (cached 15 min in `~/.vsb/config.json`), so releases reach installs within minutes.
- Newer minor/patch → a detached child downloads + swaps the binary in the background; the next `vsb` run is the new version. Logs to `~/.vsb/auto-update.log`. Spawns are throttled to one per 10 minutes.
- Major bumps never auto-land — they wait for an explicit `vsb update`.
- Below the server's `min_supported` floor the CLI refuses to run (structured JSON error on stderr in `--json` mode).
- **Skills auto-sync**: on startup the CLI diffs installed skills in `~/.claude/skills/` and the project root against the embedded bundle (sha256, local-only, silent) and re-copies stale ones — installed skills always match the binary version.
- Opt-outs: `VSB_NO_AUTO_UPDATE=1` (binary swap + skills sync), `VSB_NO_UPDATE_CHECK=1` (probe entirely). **Unset means on** — only the exact string `1` turns either off, so `0` and `false` leave auto-update running.

### Is it working?

`vsb version` answers it in one line, without reading any config by hand:

```
vsb 0.2.32
auto-update: on · checked 3m ago · last update 2d ago (0.2.30 → 0.2.32)
```

- `off (VSB_NO_AUTO_UPDATE=1 is set)` names the variable that decided, so it can be found and removed.
- `off (source checkout, working tree has local changes)` is the dev-install case — commit or stash, then it pulls again.
- `never updated itself` means the updater has never swapped this binary. On a machine that sits idle between releases that is normal: the probe only fires when a `vsb` command runs, so a box nobody touched for a month stays on its old version until the next command.
- `--json` carries the same facts as an `auto_update` object (`enabled`, `reason`, `last_checked_at`, `last_update`).

Every live probe writes a line to `~/.vsb/auto-update.log`, including `check: already current`. A silent log therefore means the check is not running at all, rather than running and finding nothing. The file is trimmed to its newest 200 lines.

---

## `vsb init`

One-shot install of the default skill bundle (`vsb`, `vsb-presets`, `vsb-image`, `vsb-image-prompting`, `vsb-video`, `vsb-p-video`, `vsb-audio`) into the current project. Equivalent to running `vsb skills install` for each.

| Flag | Description |
|------|-------------|
| `--force` | Reinstall even if a skill is already present |
