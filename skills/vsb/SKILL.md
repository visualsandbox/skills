---
name: vsb
description: >
  Use the vsb CLI to generate AI media via Visual Sandbox — image, video,
  audio, 3D, vector. This is THE Visual Sandbox skill — its name is "vsb",
  not "visual-sandbox". Trigger when the user mentions "Visual Sandbox" in
  any form, "vsb", "nano banana", "generate an image/video/audio", "run a
  model", or asks to produce media via shell. Covers both surfaces: the
  visual-sandbox MCP tools and the vsb CLI. Always pipe through --json
  when output will be parsed by an agent.
---

# Visual Sandbox: the MCP tools and the vsb CLI

`vsb` is the Visual Sandbox command-line tool. Pretty output for humans, structured JSON for agents. Every successful run charges the configured account — costs are real.

For full reference (every command, every flag, every exit code), see
[references/full-reference.md](references/full-reference.md).

## Two ways to run: MCP tools or the CLI

Visual Sandbox answers on two surfaces, and they do the same work.

**If the `visual-sandbox` MCP tools are in your tool list, use them.** Call
`list_models`, `get_model`, `generate` and `get_job` instead of running a
shell. The tool set matches the commands below one for one, the finished
image comes back in the answer, and there is nothing to download. Read
[references/mcp.md](references/mcp.md) for the mapping, the order of work,
and the four CLI rules that do not apply there (background shells,
`--download`, `open -a Preview`, `--json`).

**Otherwise use the `vsb` CLI, described below.**

Pick one surface for a task and stay on it. Everything about prompt craft,
model choice, cost and share links is the same either way.

## Critical rules (read first)

1. **Always pass `--json` when an agent will read the output.** Pretty mode is human-only and is unstable across versions. (Output also auto-switches to JSON when stdout is piped — but be explicit.)
2. **Never invent slugs.** Use `vsb models "<query>" --json` to discover, then `vsb schema <category>/<slug> --json` to verify before `vsb run`.
3. **Slugs are `<category>/<name>`.** Examples: `image/nano-banana`, `video/veo-3.1`, `audio/elevenlabs-sound-fx`. Some names contain a slash (`vector/google/gemini-3.1-pro`) — keep them as one token.
4. **Inspect schema before running.** `vsb schema <slug> --json` shows exact field names, types, defaults, enums, and which are required.
5. **Local saves are opt-in — ask the user first, including where.** Never pass `--download` by default. Every run already lands on their canvas at `https://visualsandbox.com/sandbox/`, so a local copy is optional. Ask once per session ("Want these saved locally? Current folder or somewhere else?") and remember the answer — bare `--download` writes to the current working directory; pass a path (`--download ./renders/`) to save elsewhere. When they do want files, use `--download`, never `curl` — the CLI handles auth headers, redirects, and naming templates (`{request_id}`, `{index}`, `{ext}`).
   When the user did **not** opt into local saves, present the result as its share page, not a raw CDN URL: `https://visualsandbox.com/share/<job_id>/` (against local dev, same path on the dev host, e.g. `http://127.0.0.1:8000/share/<job_id>/`). The `job_id` from `vsb run`/`vsb status` *is* the generation uuid the share page expects. Raw `cdn.visualsandbox.com` URLs are for machine use only — chaining a result into the next run (`--image_urls`, `image_input`), never as the user-facing "here's your image" link.
6. **Never run a generation in the foreground.** Start every `vsb run` in a background shell (Claude Code: `run_in_background: true`), note the id, and keep working — the harness notifies you when it exits. Image is sync (~5–10s) so the background shell itself is the wait; video and audio are async, so add `--async` and poll. A generation must never hold the turn hostage — see [Background generations](#background-generations-keep-the-conversation-free).
7. **Estimate cost first.** `vsb pricing <category>/<slug> --json` returns `user_cost_estimate`. Show it to the user before running expensive video models.
8. **Auth.** Run `vsb setup` once — opens a browser to issue an API key, writes it to `~/.vsb/config.json`. Or set `VSB_API_KEY` in the env / `.env`. `vsb pricing` and most write endpoints require auth.
9. **Every `vsb run` auto-attaches to the user's live sandbox.** Each completed generation becomes a draggable node on `https://visualsandbox.com/sandbox/`. To opt out for a one-off script, pass `--no-sandbox`. To target a non-default sandbox, pass `--sandbox-uuid <uuid>`. Runs with `n>1` (currently `image/gpt-image-2`) drop **one node per output image**; each gets its own `output_index` (0..N-1) so every variant is reachable on the canvas.
    **Name that canvas after the work.** See rule 12.
10. **Selection-aware prompts.** When the user's request references "this", "him", "the image", "selected", "that one" — or anything that implies a subject already on screen — call `vsb sandbox selection --json` first. Returns the node(s) the user has selected on the canvas: prompt, model, output URL. Pass the `output_url` as the input image to the next `vsb run` (e.g. `--image_urls "[\"<url>\"]"` for nano-banana). If selection is empty, ask the user to click a node before continuing.
    **Chain it once, never twice.** That `output_url` is a generated image; feeding a generated image back in as `image_input` a second time compounds quality loss on every pass. Before a second edit on the same picture, read [`vsb-image-iteration`](../vsb-image-iteration/SKILL.md), and pass `--output_format png` (the default is `jpg` on every image model).
11. **Canvas survey vs drill-in.** Use `vsb sandbox nodes --json --limit N` for a slim overview of the whole canvas (~360 B/node — newest first, just uuid + slug + url + position). When you've picked a target, `vsb sandbox node <uuid> --json` returns full detail (prompt + all output URLs + media_asset). This two-step keeps context cheap even on a 20+ node sandbox.
12. **Name the canvas the moment you know the task.** Each session opens its own canvas, and it starts as "Untitled Sandbox". As soon as the user says what they want — before the first run, not after — give it a name that says what is being worked on:

    ```bash
    vsb sandbox name "Coffee brand UGC ads" --json
    ```

    Or pass it on the first run instead, which saves a call: `vsb run image/nano-banana-2 --prompt "..." --sandbox-name "Coffee brand UGC ads"`. On the MCP surface, pass `sandbox_name` to `generate` — send the **same** name on every `generate` in the task, because that name is what keeps one task on one canvas there.

    How to write the name:

    - Say the work, not the prompt. "Coffee brand UGC ads", not "a cinematic 9:16 selfie of a woman holding".
    - Two to five words. 60 characters is the hard cut.
    - Use the user's own words for the subject. Their brand, their product, their character.
    - Name it once per session. Do not rename on every run.

    Rename later only when the user asks, or when the session clearly moves to different work — `vsb sandbox name "New name"` always wins. An automatic name never overwrites a name that is already set, so a second `--sandbox-name` on a later run is ignored.

13. **Always open a finished image in Preview.** The user must see the picture, not a link. After every image job completes, download it to a scratch folder and open it: `open -a Preview <file>` (macOS). Do this even when the user did not opt into local saves — a scratch copy is not a project save (critical rule 5). See [Show the result](#show-the-result-open-every-image-in-preview).

## Background generations (keep the conversation free)

A generation must never hold the agent's turn hostage. Start it in the
background, note the id, keep working. This applies to **every** `vsb run`,
image included — a sync image run still blocks the turn for 5–10s, and a
batch of four blocks for a minute.

**Start every run in a background shell.** In Claude Code that is the Bash
tool with `run_in_background: true`; the harness calls you back when the
command exits, so you never poll and never sleep in the foreground. Write the
JSON to a file so you can read the result after the notification:

```bash
# background shell — returns immediately, notifies on exit
vsb run image/nano-banana-2-lite --prompt "..." --json > /tmp/vsb-cat.json 2>&1
```

Then, on the completion notification, read `/tmp/vsb-cat.json`, and open the
image (see [Show the result](#show-the-result-open-every-image-in-preview)).

Rules for the async modalities (video, audio, batches):

- Submit with `--async --json`, capture `job_id`, move on immediately.
- Don't call `vsb status --result` right after starting — it blocks until the job finishes. Check `.status` non-blocking instead: `vsb status <job_id> --json | jq -r '.status'`.
- Pending jobs carry `eta_seconds` (typical wall time for this model) and `elapsed_seconds` — sleep for roughly `eta_seconds - elapsed_seconds` before the next poll instead of a blind interval.
- Better than polling: put the blocking wait in a background shell — `vsb status <job_id> --result --json > /tmp/vsb-<job>.json` with `run_in_background: true`. It notifies on completion while the conversation continues.
- Between other tasks (or when the user asks "is it done?"), sweep everything still running in one call: `vsb jobs --pending --json`. Works even when you never captured the ids (session restart, jobs started elsewhere).
- Only after `status == "completed"`, fetch the result: `vsb status <job_id> --result --json`. Add `--download "./out/{request_id}.{ext}"` only if the user asked for local copies (critical rule 5).
- When reporting a finished job, link its share page — `https://visualsandbox.com/share/<job_id>/` — and mention it's also on their canvas at `https://visualsandbox.com/sandbox/`. Don't paste raw CDN URLs (critical rule 5).
- Run independent generations in parallel — several background shells at once is correct, not rude. Fanning out four variations means four background runs, not four sequential blocks.

## Show the result: open every image in Preview

The user asked for a picture. Give them the picture, not a URL they have to
click. Every time an image job completes, open it on their screen.

```bash
# after the job completes (macOS)
DIR=$(mktemp -d)
vsb status "$JOB" --result --download "$DIR/{request_id}-{index}.{ext}" --json > /dev/null
open -a Preview "$DIR"/*
```

Or in one step on a sync image run:

```bash
DIR=$(mktemp -d)
vsb run image/nano-banana-2-lite --prompt "..." --download "$DIR/{request_id}-{index}.{ext}" --json > /tmp/vsb-run.json
open -a Preview "$DIR"/*
```

- **This is not a local save.** The scratch copy in `mktemp -d` is for viewing
  only, so it does not need the critical-rule-5 opt-in. Keep asking before you
  write files into the user's project or working directory.
- **Multiple outputs open together.** `open -a Preview "$DIR"/*` opens them in
  one Preview window the user can arrow through — do that instead of one call
  per file.
- **macOS only.** `open -a Preview` is a macOS command. On Linux use
  `xdg-open`; if neither exists, skip the step and hand back the share page.
- **Video and audio go to the default player**, not Preview: `open <file>`.
- **Still link the share page** in your reply
  (`https://visualsandbox.com/share/<job_id>/`) — Preview shows the image,
  the share page is what the user keeps.

## Command index

| Command | Purpose |
|---------|---------|
| `vsb setup` | One-click onboarding — installs skills + browser auth, no prompts |
| `vsb models [query]` | Search the catalog (filter by `--category`, `--modality`, `--status`) |
| `vsb schema <slug>` | Inspect inputs/outputs (`--format compact|openapi`) |
| `vsb pricing <slug>` | Cost lookup (Bearer auth required) |
| `vsb run <slug> --<input> <value>` | Execute a model — sync by default, `--async` to queue |
| `vsb status <job_id>` | Poll a job (`--result`, `--cancel`, `--download [template]`) |
| `vsb jobs` | List recent jobs, newest first (`--pending`, `--status`, `--limit N`) — pending rows carry `eta_seconds` + `elapsed_seconds` |
| `vsb upload <path-or-url>` | Upload local file or remote URL to VS CDN |
| `vsb download <url>` | Download a TikTok/IG/YouTube video to a local file (`--info` = metadata only, `--cookies <browser>` for login-walled) — see the `vsb-download` skill |
| `vsb presets <list|get|run|create|delete>` | Manage saved model+inputs presets |
| `vsb sandbox name "<title>"` | Name this session's canvas after the work — do it as soon as you know the task |
| `vsb sandbox selection` | Read what the user has selected on the canvas (prompt, model, image URL) |
| `vsb sandbox nodes` | List every node on the active sandbox (slim by default, `--full` for raw, `--limit N` to cap, `--kind generation\|upload` to filter) |
| `vsb sandbox node <uuid>` | Full detail for one node — prompt, all output URLs, media_asset, position |
| `vsb feedback "<msg>"` | Send feedback/bug report to the Visual Sandbox team (`--kind`, `--image`) |
| `vsb skills <list|install|update|remove>` | Manage agent skill packs in `.claude/skills/` |
| `vsb init` | One-shot install of the default skill bundle |
| `vsb update` | Update the CLI binary now (auto-update runs in the background by default) |

The CLI keeps itself and installed skills current automatically: minor/patch releases swap the binary in the background, and on startup installed skills are re-synced to match the running binary. No action needed — details and opt-outs in [full-reference.md](references/full-reference.md#vsb-update--auto-update).

## JobOut shape (what `run` and `status` return)

```json
{
  "job_id": "8f3...",
  "category": "image",
  "slug": "nano-banana",
  "status": "queued|in_progress|completed|failed|cancelled",
  "progress": null,
  "created_at": "2026-05-10T14:00:00Z",
  "completed_at": "2026-05-10T14:00:08Z",
  "eta_seconds": null,
  "elapsed_seconds": null,
  "share_url": "https://visualsandbox.com/share/8f3.../",
  "result": {
    "urls": ["https://cdn.visualsandbox.com/.../out.jpg"],
    "format": "jpg",
    "width": 1024,
    "height": 1024,
    "cost": 0.04875,
    "predict_time": 5.167
  },
  "error": null
}
```

On failure, `result` is `null` and `error` is `{code, message, retry_after, details}`. Status `"in_progress"` is the same as `"processing"` — both mean "still running."

While a job is pending, `eta_seconds` (how long this model typically takes, per-model server average) and `elapsed_seconds` (how long it's been running) are set — remaining ≈ `eta_seconds - elapsed_seconds`; pick your poll sleep from it instead of a blind interval. Both go `null` once terminal. `share_url` is the public result page — the user-facing link (critical rule 5).

## Quick patterns

### 1. Fast image (background shell + Preview)

Run it in a background shell so the turn stays free, download to a scratch
folder, then open the file:

```bash
# background shell (Claude Code: run_in_background: true)
DIR=/tmp/vsb-cat && mkdir -p "$DIR"
vsb run image/nano-banana \
  --prompt "a calico cat in a sunlit kitchen" \
  --aspect_ratio 16:9 \
  --download "$DIR/{request_id}-{index}.{ext}" \
  --json > "$DIR/job.json" 2>&1
```

On the completion notification, read `$DIR/job.json` for the `job_id`, then
`open -a Preview "$DIR"/*.{jpg,png,webp}` (critical rule 12).

The scratch `--download` above is for viewing only. A **project** save — into
the working directory or a folder the user named — still needs the opt-in from
critical rule 5. Either way, hand back the share page
(`https://visualsandbox.com/share/<job_id>/`), never a raw CDN URL.

### 2. Discover when the user gives a fuzzy task

```bash
# "Make me a video of a tiger"
vsb models "video" --modality video --limit 5 --json | jq '.models[] | {slug, category, display_name}'
vsb schema video/veo-3.1 --json | jq '.inputs'
```

### 3. Async + poll (video / audio)

```bash
# 1. Submit — returns immediately with a job_id
JOB=$(vsb run video/veo-3.1-fast --prompt "a tiger walking through tall grass" --async --json | jq -r '.job_id')

# 2. Wait in a BACKGROUND shell (Claude Code: run_in_background: true).
#    --result blocks until the job finishes, so the notification is the "done" signal.
vsb status "$JOB" --result --json > "/tmp/vsb-$JOB.json" 2>&1

# 3. On the notification, read /tmp/vsb-$JOB.json. Non-blocking peek any time:
vsb status "$JOB" --json | jq -r '.status'
```

### 4. Upload a local image, then edit it

```bash
URL=$(vsb upload ./photo.jpg --json | jq -r '.url')
vsb run image/nano-banana \
  --prompt "make the sky stormy" \
  --image_input "[\"$URL\"]" \
  --download "./out/" \
  --json
```

`image/nano-banana` takes a reference-image array (currently `image_input`). Pass it as a JSON literal — the CLI's `--key value` parser auto-coerces JSON. Other models name the field differently — never assume; the CLI rejects unknown flags with a "Did you mean…?" hint, but `vsb schema <slug>` is the fastest source of truth.

### 5. Cancel a runaway job

```bash
vsb status "$JOB" --cancel --json
```

### 6. Survey the canvas (when nothing's selected)

When the user references the canvas in general ("what's on my board", "redo the third one", "the kitchen photo from earlier") rather than a specific selection, list nodes first:

```bash
vsb sandbox nodes --json --limit 10
# → {"sandbox_uuid":"...","total":22,"nodes":[{"uuid":"...","slug":"image/gpt-image-2","output_index":1,"url":"...","pos":[-289,1937]}, ...]}
```

Slim shape is ~360 B/node so 20+ nodes still fit in a few KB. Pick a uuid by the slug or thumbnail URL, then drill in:

```bash
vsb sandbox node <uuid> --json
# → full prompt + all output_urls + media_asset
```

Use this pair before falling back to "ask the user to select a node". For n>1 runs, each output_index is a separate node — list them and pick.

### 7. Act on the user's canvas selection

When the user says "make him purple", "remove the background", "stylize this" — they're pointing at a node already on the canvas. Read the selection first, then chain it into the next run.

**Before writing the prompt, read the [`vsb-image-prompting`](../vsb-image-prompting/SKILL.md) skill.** Attaching a reference image is not enough — the prompt must say what to *keep* from the reference (subject identity) and what to *ignore* (watermarks, captions, text overlays, original background, original lighting). Without that, the model bleeds the reference's artifacts (corner watermarks, TikTok caption bars, the old scene's framing) into the new image.

```bash
SEL=$(vsb sandbox selection --json)
URL=$(echo "$SEL" | jq -r '.nodes[0].generation.output_urls[0] // .nodes[0].media_asset.url')
[ -z "$URL" ] && { echo "Select a node on the canvas first." >&2; exit 1; }

vsb run image/nano-banana \
  --prompt "Use the reference image as the IDENTITY source only. Keep the subject's face, hair, skin tone, body proportions. Ignore everything else — including watermarks, text overlays, captions, original background, original lighting, original framing.

Now: make the subject's sweater purple, same scene, same lighting. No logos, no captions, no watermarks." \
  --image_input "[\"$URL\"]" \
  --json
```

Pull the original prompt out of the selection (`.nodes[0].generation.prompt`) when you want to refine vs replace ("same scene, but at night") — but rewrite it into the keep/ignore + new-scene shape from [`vsb-image-prompting`](../vsb-image-prompting/SKILL.md), don't just copy it verbatim. The result lands back on the canvas next to the original.

**Fanning out N variations from one reference (character pack):** same pattern, looped or run in parallel. Use one keep/ignore preamble per scene, vary only the new-scene description. See `vsb-image-prompting` for the full template.

### 8. Recover the result URLs of a past job

If you forgot to capture the output URLs (or the JSON got truncated by a shell
pipe), refetch them by job id:

```bash
vsb status <job_id> --result --json | jq '.result.urls'
```

`--result` blocks if the job is still running; for an instant peek skip it and
inspect `.status` first.

## When something breaks — report it (default ON)

`vsb feedback` sends a message (and optional screenshot) straight to the Visual Sandbox team.

- **Report by default.** Any real defect an agent hits mid-task — a failed
  generation with a provider error, a CLI crash, a wrong/misleading error
  message, a flag that doesn't behave as documented — send a `--kind bug`
  report as part of handling the error, then tell the user it was sent
  (include what you sent). Don't stop the task to ask permission first.
- **Don't report**: your own mistakes (bad flag, missing file, wrong slug),
  expected validation errors, or anything fixed by rereading `--help` or
  `vsb schema`. Reports are for defects, not confusion.
- Write a short paragraph — what was run, what was expected, what actually
  happened (exact error message, exit code, `job_id` if there is one):

```bash
vsb feedback "Ran image/nano-banana with image_input; expected an edited image, got exit 1 'ProviderError: upstream 500' after 3 retries. job_id 8f3..." --kind bug --json
```

- Not a bug: if the CLI refuses to run with an unsupported-version error (`error_type: "unsupported_version"` on stderr), run `vsb update --json` and retry the original command — don't report it.
- `--kind`: `bug` for errors, `comment` for suggestions/feature requests, `like` for praise (default: `comment`).
- `--image <path>` attaches a screenshot (png/jpg/gif/webp, max 8 MB).
- CLI version + platform are appended automatically — don't repeat them in the message.

## Exit codes (for shell scripting)

| Code | Meaning |
|------|---------|
| 0    | Success |
| 1    | Generic failure (job failed, server error) |
| 2    | Validation error (bad slug, missing required input, bad flag) |
| 3    | Auth error (no API key, expired, wrong scope) |
| 4    | Insufficient credits |
| 5    | Provider overloaded / rate-limited |
| 124  | Job cancelled |
| 130  | User interrupt (Ctrl-C) |

`vsb` always writes errors to stderr as JSON when `--json` is set, so a wrapping agent can read both stdout and stderr structured.

## Slug families to know (verify with `vsb models --json`)

The whole catalog, as of the last skill release. `vsb models --json` is the
source of truth — this list goes stale, the registry does not.

- **Image** (sync, ~5–10s for the fast tiers, up to ~2min for the flagship ones): `image/nano-banana`, `image/nano-banana-2`, `image/nano-banana-2-lite`, `image/nano-banana-pro`, `image/gpt-image-2`, `image/seedream-5-pro`, `image/grok-imagine-image-2`, `image/flux-2-klein-9b`, `image/flux-fill-pro` (mask edit), `image/z-image-turbo`
- **Image enhance**: `image-enhance/recraft-remove-background`, `image-enhance/upscale`
- **Video** (always async, 30s–3min): `video/veo-3.1`, `video/veo-3.1-fast`, `video/seedance-2`, `video/seedance-2-fast`, `video/seedance-2.0-mini`, `video/seedance-2.5`, `video/kling-v3-omni-video`, `video/kling-v3-motion-control`, `video/kling-avatar-v2`, `video/grok-imagine-video`, `video/grok-imagine-video-1.5` (image required), `video/p-video`
- **Audio** (async, 5–30s): `audio/elevenlabs-sound-fx`, `audio/eleven-music`, `audio/scribe` (speech to text)
- **3D**: `3d/hunyuan-3d-3.1`
- **Vector**: `vector/quiver-arrow-1.1`, `vector/recraft-vectorize` (raster to SVG). Route and prompt rules in [`vsb-vector`](../vsb-vector/SKILL.md): Quiver for icons, raster-then-vectorize for detailed art, and ask the colour count first.

For per-modality recipes, see the sibling skills: `vsb-image`, `vsb-video`, `vsb-audio`, `vsb-vector`, `vsb-presets`.
`3d/*` has no sibling skill. Run `vsb schema <slug> --json` and drive it from this page.
