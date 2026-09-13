---
name: vsb-presets
renamed_from: presets
description: >
  Run, save, override, and share reproducible Visual Sandbox configurations
  as presets. A preset bundles a model + inputs + reference assets — re-runs
  reproduce the same kind of output. Trigger when the user mentions "preset",
  "saved config", a `visualsandbox.com/p/<uuid>/` share URL, or wants to
  re-run the same recipe across many inputs.
---

# Visual Sandbox presets

> **On the MCP surface?** If the `visual-sandbox` MCP tools are in your
> tool list, use `generate` and `get_job` instead of the shell commands
> below. The model choice and the prompt craft on this page still apply.
> See [`vsb` → Two ways to run](../vsb/SKILL.md#two-ways-to-run-mcp-tools-or-the-cli).

A preset is `{surface, model_slug, title, description, inputs, refs[],
examples[]}` saved server-side. Anyone with the share URL can `vsb presets
get <uuid>` and re-run it. Same `preset_id` + same overridden inputs → the
same kind of output (subject to model determinism).

## The six subcommands

```bash
vsb presets list [--limit <n>] [--json]                       # your presets
vsb presets get <uuid> [--json]                                # full detail
vsb presets run <uuid> [--input k=v]... [--inputs-json '{}'] [--async] [--json]
vsb presets create --from <preset.json> [--json]              # PresetIn shape
vsb presets update <uuid> [--from <patch.json>] [--title <t>] [--description <d>] [--json]
vsb presets delete <uuid> [--json]
```

## List and inspect

```bash
vsb presets list --limit 5 --json | jq '.[] | {uuid, surface, model_slug, title}'
```

`get` returns the full preset including refs (file fields like image_url,
audio_url that were saved with the preset) and `examples` (output URLs from
prior runs):

```bash
vsb presets get 8a7f...uuid --json
# {
#   "uuid": "8a7f...",
#   "surface": "imagine",
#   "model_slug": "nano-banana",
#   "title": "Calico cat by window",
#   "description": "...",
#   "inputs": { "prompt": "...", "aspect_ratio": "16:9", ... },
#   "refs": [
#     { "field_key": "image_input", "array_index": 0, "url": "https://cdn..." }
#   ],
#   "examples": [{ "url": "https://cdn.../out.jpg", "mime_type": "image/jpeg", ... }]
# }
```

## Re-run a preset (the most common case)

The simplest form just re-runs with the saved inputs:

```bash
vsb presets run 8a7f...uuid --json
# → submits + returns { status: "submitted", job_id, slug, hint }
```

Then poll with `vsb status <job_id> --result --download "./out/{request_id}.{ext}" --json` — `--download` only if the user opted into local saves; otherwise drop it and hand back the share page `https://visualsandbox.com/share/<job_id>/` ([vsb critical rule 5](../vsb/SKILL.md#critical-rules-read-first)).

`vsb presets run` always submits async — it doesn't block. This keeps it
behaviorally identical for fast image and slow video presets.

## Override inputs

Two override modes:

### `--input key=value` (repeatable, layers on top of saved inputs)

```bash
vsb presets run 8a7f...uuid \
  --input prompt="a tabby cat instead" \
  --input aspect_ratio=1:1 \
  --json
```

Values run through `parseValue`, so numbers/booleans/JSON literals coerce
correctly. `--input n=4` becomes `{n: 4}` not `{n: "4"}`.

### `--inputs-json '{...}'` (full replacement, escape hatch)

```bash
vsb presets run 8a7f...uuid \
  --inputs-json '{"prompt":"a husky","seed":42,"aspect_ratio":"3:2"}' \
  --json
```

This **replaces** the saved inputs entirely — useful when you need a
nested/array field that's awkward to express with `--input`. Saved `refs`
still hydrate any missing file fields.

### Refs (file fields) hydration

If a preset has a saved `image_url` ref and your overrides don't set
`image_url`, the saved URL fills in automatically. To replace it, pass your
own:

```bash
NEW_URL=$(vsb upload ./different-photo.jpg --json | jq -r '.url')
vsb presets run 8a7f...uuid --input image_url="$NEW_URL" --json
```

## Create a preset (from JSON)

`PresetIn` shape:

```json
{
  "surface": "imagine",
  "model_slug": "nano-banana",
  "title": "Calico cat",
  "description": "Sunlit kitchen vibe",
  "inputs": { "prompt": "a calico cat in a kitchen", "aspect_ratio": "16:9" },
  "image_refs": [
    { "field_key": "image_input", "array_index": 0, "url": "https://cdn.../ref.jpg" }
  ],
  "example_urls": [{ "url": "https://cdn.../prior_output.jpg" }]
}
```

```bash
vsb presets create --from ./my-preset.json --json
# → returns { status: "created", uuid, share_url: "https://visualsandbox.com/p/<uuid>/" }
```

`surface` is `imagine` for image presets, `video` for video presets (`flow`
presets also carry `steps` + `user_fields` — superadmin builder feature; see
below). The backend resolves the actual `<category>/<slug>` for `vsb run` via
the registry — you only need to specify `surface + model_slug` here.

## Flow presets (surface=flow)

Multi-step chains run client-side on `/p/<uuid>/`. `steps` is an ordered list
(step N's output feeds step N+1's image slot); `model_slug` at the top level
mirrors step 1's slug. Step shape:

```json
{
  "model_slug": "seedance-2",
  "category": "video",
  "prompt": "@motion",
  "image_source": "ask_user",
  "image_label": "Your drone shot",
  "settings": { "resolution": "__user__", "duration": 5 }
}
```

- `image_source`: `none | ask_user | upload | previous_step`. `ask_user` =
  the runner uploads their own image (first step only; later steps must be
  `previous_step`). A video model CAN be step 1 — the user's image becomes
  the first frame (image-to-video).
- `settings` hold **raw** schema values (not display strings). The
  `"__user__"` sentinel exposes that setting as a picker on the run page;
  when the user doesn't touch it, the model's schema default applies.
- `user_fields` are the @token inputs referenced in prompts:

```json
{ "name": "@motion", "kind": "text", "label": "Motion prompt",
  "required": true, "default": "Cinematic aerial flythrough…" }
```

- `required` optional; absent = required.
- `default` (text fields only) **prefills the run-page input — the user can
  edit or replace it**. This is how a preset ships a prefilled-but-editable
  prompt: make the step's whole `prompt` just `"@motion"` and put the full
  author text in the field's `default`. Defaults longer than ~60 chars render
  as a textarea on the run page.
- Image fields (`"kind": "image"`) render an upload square; their URL rides
  the model's reference-image slot, not the prompt.

Trap: ByteDance seedance's safety filter (E005) flags "drone"/"FPV" wording
in prompts — write "aerial flythrough" instead.

## Update in place (keeps the uuid + share URL)

Never delete + recreate to change a preset — that churns the share URL.
`update` PATCHes any subset of fields:

```bash
# Quick edits
vsb presets update 8a7f...uuid --title "New title" --json
vsb presets update 8a7f...uuid --description "New description" --json

# Anything else via a partial PresetPatchIn JSON file:
# { title?, description?, inputs?, steps?, user_fields?, example_urls? }
vsb presets update 8a7f...uuid --from ./patch.json --json
# → returns { status: "updated", uuid, share_url } — same uuid as before
```

- Flags layer on top of `--from` (flag wins on conflict).
- `example_urls` **replaces** all existing examples (send the full list).
- `steps`/`user_fields` are flow-surface only; the API 422s them elsewhere.
- 404 → exit code 1 with a clean "Preset not found: <uuid>" message.

## Delete

```bash
vsb presets delete 8a7f...uuid --json
# 404 → exit code 1 with a clean "Preset not found: <uuid>" message
```

## Share URLs

`https://visualsandbox.com/p/<uuid>/` is the public share link returned by
`create`. It's also accepted by humans in the browser. The CLI doesn't have a
"share" subcommand — just print the URL.

## Common gotchas

- **`vsb presets run` is always async.** Treat it like `vsb run --async` — get a `job_id`, then `vsb status`.
- **Refs ≠ inputs.** Refs are file URLs saved with the preset. They auto-hydrate fields that you don't override. They never appear in `--input` output and they're not in the `inputs` dict you'd pass to `--inputs-json`.
- **`--inputs-json` is destructive.** It wipes saved `inputs` (but not `refs`). Use sparingly — `--input k=v` (repeatable) is the safer override.
- **Model deprecation breaks presets.** If a preset's `model_slug` is missing from the live registry, `vsb presets run` returns a clean error: "The preset may reference a deprecated or missing model." There's no auto-migration in v0.1.
