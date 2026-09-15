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
5–10s). No `--async` needed, but **still start the run in a background shell**
(Claude Code: `run_in_background: true`) so the turn stays free and parallel
variations fan out ([vsb critical rule 6](../vsb/SKILL.md#critical-rules-read-first)).

Pipe `--json` and `--download "<template>"` to capture results, then
**open every finished image in Preview** — `open -a Preview <file>` — so the
user sees the picture instead of a link
([vsb critical rule 12](../vsb/SKILL.md#critical-rules-read-first)). Download
to a scratch folder (`mktemp -d`) for that; a **project** save still needs the
opt-in from [vsb critical rule 5](../vsb/SKILL.md#critical-rules-read-first).
Hand back the share page `https://visualsandbox.com/share/<job_id>/`, never a
raw CDN URL.

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
| Cheapest text-to-image | `image/z-image-turbo` | Tongyi-MAI via PrunaAI. Cheapest image model in the catalog, 8-step, sub-second. Renders short English and Chinese text well. **Takes no reference image, so it cannot edit.** Apache 2.0 license. |
| Fast iteration that still takes references | `image/flux-2-klein-9b` | Black Forest Labs. 4-step, sub-second, one endpoint for text-to-image and edit. Up to 5 references, output up to 4 MP. **FLUX Non-Commercial License — never use it for client work or paid ad creative.** |
| Many references, product + character compositing | `image/seedream-5-pro` | ByteDance. Takes up to 10 references and holds detail at 1K or 2K. The edit-capable model with the highest reference count. Commercial use allowed. |
| Posters, packaging, real brands and places, flat price at 2K | `image/grok-imagine-image-2` | xAI. Plans typography and layout before drawing, and names real brands, cities, and landmarks straight from the prompt. **One flat price per output image, so 2K at medium quality costs the same as a 1K draft.** Takes one reference image (a single string, not an array), so it cannot composite several. Slow: ~53s at medium/2K, ~15s at low/1K. Commercial use allowed. |
| Change one region, keep every other pixel | `image/flux-fill-pro` | The only mask model in the catalog. It repaints the masked area and carries the rest of the photo through unchanged. It also outpaints. |
| 360-degree panorama | `panorama/360-panorama` | Category is `panorama`, not `image`. Fixed 3824x1920 equirectangular PNG with GPano metadata, so viewers detect it as 360 on their own. |
| Background removal | `image-enhance/recraft-remove-background` | Note: category is `image-enhance`, not `image`. |
| Upscale | `image-enhance/upscale` | Same — `image-enhance` category. |

**Tier up for detail-critical work.** The cheap defaults are for simple,
throwaway, or high-volume generations. When the task is detail-critical —
legible in-image text (signs, tattoos, posters, packaging), dense scenes with
many named elements, ad creative the user will publish, or precise multi-ref
identity edits — go straight to `image/nano-banana-pro` or `image/gpt-image-2`
(gpt-image-2 when typography legibility is the single hardest constraint;
nano-banana-pro for photoreal scenes that *contain* text or fine detail).
The ~$0.15–0.20/image premium is cheaper than three failed $0.05 retries.

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

### FLUX Fill Pro (masked edit and outpaint)

The only model that edits through a mask. Everything outside the mask survives
the run byte for byte, so use it for object removal, a product swap, new text
on a sign, or a retouch. Fields are `image` (a single string, not an array),
`mask`, and `outpaint`.

```bash
SRC=$(vsb upload ./kitchen.jpg --json | jq -r '.url')
MASK=$(vsb upload ./kitchen-mask.png --json | jq -r '.url')

vsb run image/flux-fill-pro \
  --prompt "a white marble countertop, same warm window light, same grain" \
  --image "$SRC" \
  --mask "$MASK" \
  --guidance 30 \
  --download "./out/{request_id}.png" \
  --json
```

Four rules decide the result:

- The mask is black and white, the same size as the source. White repaints,
  black keeps. The mask may instead ride in the source image's alpha channel.
- Describe what must be there, not the edit. Write "a blue knit sweater". Do
  not write "change the shirt". An empty prompt makes the model paint
  something rather than nothing.
- Mask a little wider than the object, and include its shadow and its
  reflection. The model invents a new object to explain a shadow you leave
  behind.
- High `guidance` leaves a visible seam. Lower it to about 30 for retouching
  and object removal, so the fill settles into the surrounding light and grain.

To outpaint instead, set `--outpaint` to `zoom_out_1.5x`, `zoom_out_2x`,
`make_square`, `extend_left`, `extend_right`, `extend_up`, or `extend_down`.
An `outpaint` preset makes the model ignore the mask. Output size follows the
input, so there is no aspect-ratio field and outpainting is the one case that
changes the dimensions.

### Seedream 5 Pro (up to 10 references)

```bash
vsb run image/seedream-5-pro \
  --prompt "the bottle from Image A on the marble surface from Image B, studio softbox light" \
  --image_input "[\"$URL1\",\"$URL2\"]" \
  --resolution 2K \
  --aspect_ratio 1:1 \
  --json
```

One endpoint covers generate and edit, the same as Nano Banana. Iterate at
`--resolution 1K`, then rerun the winning prompt at `2K` for print and crops.

### Grok Imagine 2.0 (layout and typography, flat price at any size)

```bash
vsb run image/grok-imagine-image-2 \
  --prompt "a vintage travel poster for Kyoto, Mount Fuji behind cherry blossoms, art deco typography reading 'KYOTO', rich flat color blocks" \
  --aspect_ratio 2:3 \
  --resolution 2K \
  --quality medium \
  --json
```

To edit, pass one reference through `--image`. The field is a **single
string**, not an array, so this model cannot composite several references.

```bash
URL=$(vsb upload ./storefront.jpg --json | jq -r '.url')
vsb run image/grok-imagine-image-2 \
  --prompt "make the sky a dramatic sunset" \
  --image "$URL" \
  --json
```

Four rules decide the result:

- **Always deliver at `--resolution 2K --quality medium`.** The price is flat
  per output image, so 2K costs the same as 1K. `low` at `1K` is only worth it
  as a speed setting: about 15 seconds against about 53 seconds.
- **Waxy, over-smoothed skin means the quality knob is wrong.** Pin medium and
  2K, then name the camera, the lens, the light direction, and the
  imperfections to keep (skin texture, stray hair, film grain).
- **Write long, specific prompts and put the style directive last.** Short
  prompts get generic results here. Name real brands, cities, and landmarks
  rather than describing them; the model knows them.
- **On an edit, describe only the change.** Re-describing the whole frame makes
  the model rewrite more than you asked. `aspect_ratio` is ignored on an edit,
  because the output keeps the shape of the source.

`aspect_ratio` also accepts `auto`, which lets the model pick the frame that
suits the prompt. `2:1` and `1:2` are in the enum and are rare elsewhere in the
catalog, so this is the model for site headers and tall mobile banners.

### Z-Image Turbo (cheapest, text-to-image only)

```bash
vsb run image/z-image-turbo \
  --prompt "a neon ramen shop sign that reads 'MIDNIGHT', wet asphalt reflection, night" \
  --aspect_ratio 3:2 \
  --output_megapixels 2 \
  --json
```

It has no reference-image field at all, so it cannot edit. Short English and
Chinese text is its strength. Quote the exact text and name the surface it
sits on. Long paragraphs break down.

### 360 Panorama

```bash
vsb run panorama/360-panorama \
  --prompt "a snowy pine forest clearing at blue hour, footprints in the snow" \
  --quality high \
  --upscale true \
  --json
```

The category is `panorama`, not `image`. Output is a fixed 3824x1920
equirectangular PNG, and `--upscale true` doubles it to 7648x3840. The file
carries GPano metadata, so Pannellum, Facebook, and VR headsets detect it as
360 without any manual tagging. Do not run it through an editor that strips
metadata.

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

`z-image-turbo`, `flux-2-klein-9b`, and `nano-banana-2` bill per output
megapixel or per resolution tier, so `user_cost_estimate` comes back `null`
and the tier table holds the numbers. Read it before you pick a size:

```bash
vsb pricing image/z-image-turbo --json | jq '.tiers'
```

## Common gotchas

- **A second edit on the same image degrades it.** Every model redraws the
  whole picture on each pass, so loss compounds. Never feed your own last
  output back in as `image_input` — grow the prompt and re-run from the
  original instead. Full workflows in
  [`vsb-image-iteration`](../vsb-image-iteration/SKILL.md).
- **`output_format` defaults to `jpg` on every image model except
  `flux-fill-pro`,** which defaults to `png` because a fill is usually the
  input to the next fill. Pass `--output_format png` whenever the output may
  become an input.

- **Input field names vary by model** — Nano Banana uses an array (currently `image_input`), most enhance models take a single string (currently `image`), GPT Image 2 has its own shape. `vsb run` pre-validates against the schema, so just `vsb schema <slug>` once and copy the exact field name.
- **`aspect_ratio: "match_input_image"` only makes sense in edit mode** (when reference images are set). For text-to-image alone it falls back to a default.
- **`output_format` defaults to `jpg`.** If you want transparent PNG (e.g. for compositing), set `--output_format png` and remember the alpha channel is only meaningful for edit/cutout flows.
- **`z-image-turbo` cannot edit.** It has no reference-image field. If the
  task attaches any image, pick another model before you write the prompt.
- **`flux-2-klein-9b` is non-commercial.** Never pick it for client work,
  paid ad creative, or anything the user will sell. Use Nano Banana,
  GPT Image 2, or Seedream 5 Pro instead.
- **`flux-fill-pro` takes `image` as a single string, plus a `mask`.** It is
  the only model with a mask. There is no brush tool in the composer yet, so
  an explicit mask arrives as a file through the CLI.
- **`grok-imagine-image-2` takes `image` as a single string too,** so it edits
  from one reference and cannot composite. Pick `seedream-5-pro` or
  `nano-banana-2-lite` when the job needs several references.
- **Don't loop `vsb run` inside a tight shell loop** — use a small batch (≤5 in parallel via `&`) to respect the provider's rate limit.
