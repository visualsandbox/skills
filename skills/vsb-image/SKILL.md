---
name: vsb-image
renamed_from: image
description: >
  Pick the right Visual Sandbox model for any image task and prompt it well.
  Trigger when the user wants to generate, edit, restyle, upscale, or remove
  the background from images via the vsb CLI. All execution goes through
  `vsb run image/<slug>` — sync, ~5–10s for the standard models. Always
  verify slugs with `vsb models --modality image --json` first.
---

# Image generation with vsb

> **On the MCP surface?** If the `visual-sandbox` MCP tools are in your
> tool list, use `generate` and `get_job` instead of the shell commands
> below. The model choice and the prompt craft on this page still apply.
> See [`vsb` → Two ways to run](../vsb/SKILL.md#two-ways-to-run-mcp-tools-or-the-cli).

Image runs are sync — `vsb run image/<slug>` blocks until done (typically
5–10s). No `--async` needed. Pipe `--json` and `--download "<template>"` to
capture results. `--download` only if the user opted into local saves —
otherwise hand back the share page `https://visualsandbox.com/share/<job_id>/`,
never a raw CDN URL ([vsb critical rule 5](../vsb/SKILL.md#critical-rules-read-first)).

> **Before writing any image prompt, read
> [`vsb-image-prompting`](../vsb-image-prompting/SKILL.md).** It covers the universal
> rules, the prompt-anatomy slot list, the reference-image keep/ignore
> pattern (what to take from an attached image and what to ignore — without
> this, watermarks and text overlays leak into outputs), and the camera /
> lens / lighting / grade vocabulary banks. This skill only covers
> *picking* a model — the prompt-craft itself lives in `image-prompting`,
> with model-specific quirks in [`vsb-nano-banana`](../vsb-nano-banana/SKILL.md) and
> [`vsb-ugc-people`](../vsb-ugc-people/SKILL.md).

## Picking a model

Verify the live catalog with `vsb models --modality image --json | jq '.models[] | {slug, category, owner}'`.

| Task | Default slug | Why |
|------|--------------|-----|
| Fast text-to-image / edit | `image/nano-banana-2-lite` | Google. Default. Cheapest (~$0.05/image), fastest, ~5s, on the newer NB2 architecture. Handles both text-to-image AND image edits — the same endpoint switches modes when a reference image array is non-empty. |
| Same cost, original model | `image/nano-banana` | The original Gemini 3 model at the same ~$0.05/image. Fall back here if a lite result looks off. |
| Higher quality / 4K / web-grounded | `image/nano-banana-2` | Full NB2 — adds `resolution` (up to 4K) and web-search grounding. |
| Top-tier Google output | `image/nano-banana-pro` | Most expensive of the family, sharpest detail. |
| Photoreal / text rendering / multi-ref edit | `image/gpt-image-2` | OpenAI. Best for legible typography, posters, product mockups. Slower + pricier than Nano Banana. |
| Background removal | `image-enhance/recraft-remove-background` | Note: category is `image-enhance`, not `image`. |
| Upscale | `image-enhance/upscale` | Same — `image-enhance` category. |

## Prompt patterns

### Nano Banana family (text-to-image)

```bash
vsb run image/nano-banana \
  --prompt "a calico cat curled on a sunlit windowsill, soft morning light, shallow depth of field" \
  --aspect_ratio 16:9 \
  --output_format jpg \
  --download "./out/{request_id}.{ext}" \
  --json
```

Nano Banana likes concrete nouns + lighting + camera language. Aspect ratios
(`1:1`, `16:9`, `3:2`, `4:3`, `5:4`, `4:5`, `3:4`, `2:3`, `9:16`, `21:9`) are
strict enums — use `vsb schema image/nano-banana --json` to confirm before
passing.

### Nano Banana (image edit — multi-ref)

```bash
URL1=$(vsb upload ./photo.jpg --json | jq -r '.url')
URL2=$(vsb upload ./reference.jpg --json | jq -r '.url')

vsb run image/nano-banana \
  --prompt "Use Image A (cat photo) as the IDENTITY source — keep the cat's fur pattern, eye color, and proportions exactly. Use Image B (windowsill photo) as the BACKGROUND source — match the location and ambient light, but ignore any other subjects in it. Render: the cat from Image A curled up on the windowsill from Image B, matching the windowsill's ambient lighting. No logos, no captions, no watermarks." \
  --image_input "[\"$URL1\",\"$URL2\"]" \
  --aspect_ratio match_input_image \
  --download "./out/" \
  --json
```

Naming each reference (`Image A`, `Image B`) and giving it a role
(`IDENTITY source`, `BACKGROUND source`) is the universal multi-ref rule —
see [`vsb-image-prompting`](../vsb-image-prompting/SKILL.md) §Multi-reference for
the full template.

Pass JSON-array inputs as a literal — `parseValue` auto-coerces. The exact
field name (e.g. `image_input`) is whatever `vsb schema image/nano-banana
--json` returns; never guess. `vsb run` pre-validates flags against the
schema and rejects unknown keys with a "Did you mean…?" hint before any
charge is incurred.

`aspect_ratio: "match_input_image"` keeps the dimensions of the first
reference.

You can pass server-side paths directly too — any `/media/predictions/...`
URL from a prior `vsb run` works without re-uploading.

### GPT Image 2 (typography, posters, mockups)

```bash
vsb run image/gpt-image-2 \
  --prompt "minimal poster: bold serif headline 'NORTHWIND' on a kraft paper background, registration marks in the corners" \
  --quality high \
  --aspect_ratio 3:4 \
  --output_format png \
  --download "./out/{request_id}.png" \
  --json
```

GPT Image 2 specifically excels when you need **legible, multi-line text** baked
into the image. Quality enum is `auto|low|medium|high`. `n` (1–4) gives
multiple variants in one call.

### Background removal

```bash
URL=$(vsb upload ./product-photo.jpg --json | jq -r '.url')
vsb run image-enhance/recraft-remove-background \
  --image "$URL" \
  --download "./out/cutout.png" \
  --json
```

Note the category is `image-enhance`, not `image`, and `recraft-remove-background`
+ `upscale` both take a single string field (currently `image`) — different from
Nano Banana's array. Always run `vsb schema image-enhance/<slug> --json` first
to confirm field names; the CLI rejects unknown flags with a "Did you mean…?"
hint before submitting.

## Cost estimation

```bash
vsb pricing image/nano-banana --json | jq '.user_cost_estimate'
# 0.04875 → roughly 5 cents per image
```

Nano Banana family is cents-per-image. GPT Image 2 is ~$0.05–0.20 depending on
quality. Background removal and upscale are sub-cent.

## Common gotchas

- **Input field names vary by model** — Nano Banana uses an array (currently `image_input`), most enhance models take a single string (currently `image`), GPT Image 2 has its own shape. `vsb run` pre-validates against the schema, so just `vsb schema <slug>` once and copy the exact field name.
- **`aspect_ratio: "match_input_image"` only makes sense in edit mode** (when reference images are set). For text-to-image alone it falls back to a default.
- **`output_format` defaults to `jpg`.** If you want transparent PNG (e.g. for compositing), set `--output_format png` and remember the alpha channel is only meaningful for edit/cutout flows.
- **Don't loop `vsb run` inside a tight shell loop** — use a small batch (≤5 in parallel via `&`) to respect the provider's rate limit.
