---
name: vsb-vector
description: >
  Make SVG files with Visual Sandbox. Trigger when the user asks for an
  SVG, a vector, a logo, an icon, a cut file (Cricut, laser, CNC,
  embroidery), or wants to "vectorize" a raster image via the vsb CLI.
  Two routes: `vector/quiver-arrow-1.1` writes an SVG straight from a
  prompt and is best for icons and simple marks; for a detailed
  illustration, generate a flat raster with an image model first and
  trace it with `vector/recraft-vectorize`. Always ask the user how many
  colours the SVG must have before you run anything.
---

# Vector generation with vsb

> **On the MCP surface?** If the `visual-sandbox` MCP tools are in your
> tool list, use `generate` and `get_job` instead of the shell commands
> below. The route choice and the prompt craft on this page still apply.
> See [`vsb` → Two ways to run](../vsb/SKILL.md#two-ways-to-run-mcp-tools-or-the-cli).

Two live models. Verify with `vsb models --modality vector --json` before
you trust this table.

| Slug | Input | Cost | Good for |
|------|-------|------|----------|
| `vector/quiver-arrow-1.1` | prompt, or prompt + reference images, or image only | ~$0.25 per SVG | Icons, glyphs, monoline marks, simple logos. Few shapes, few colours. |
| `vector/recraft-vectorize` | one raster image | ~$0.01 per SVG | Tracing any raster into editable paths. The second half of the illustration route. |

Start every run in a **background shell** (Claude Code: `run_in_background:
true`). Both models are sync and finish in seconds. Rules in
[`vsb` → Background generations](../vsb/SKILL.md#background-generations-keep-the-conversation-free).

## Ask first, then route

Ask these two questions in one message before any run:

1. **How many colours?** One, two to three, four to six, or full colour.
2. **Background?** Transparent, or a solid colour.

If the user says "whatever", use four to six colours on a white
background and say so.

Then pick the route:

| The request is | Route |
|----------------|-------|
| An icon, a glyph, a monoline mark, a simple logo, one to three colours | **A. Quiver direct** |
| A scene, a character, a mascot, a poster, shading, four or more colours, or "detailed" | **B. Raster first, then vectorize** |
| The user already has a raster (PNG, JPG, a sandbox node) | **C. Vectorize only** |

Quiver is not the default. It draws clean icons and falls apart on
detail: a busy illustration comes back simplified, with merged shapes
and dropped elements. That is the case for route B.

## Route A: Quiver direct

```bash
vsb run vector/quiver-arrow-1.1 \
  --prompt "A paper plane icon. Flat geometric style, thick uniform 2px strokes, rounded joins. Exactly 2 colours: navy #1B2A49 and white. No gradients, no shading, no text. Centred, transparent background." \
  --json
```

Prompt order: subject, style, palette, background. Say the colour count
as a number and name the colours. Words that keep the output simple:
flat, minimal, geometric, line art, monoline, single colour, thick
stroke.

- One mark per generation. For an icon set, run once per icon with the
  same style sentence, so the set reads as a family.
- `images` is a list. Prompt + images = style or structure reference.
  Images with an empty prompt = vectorize the first image (route C, but
  Quiver is twenty times the price of Recraft for that job).

## Route B: raster first, then vectorize

Recraft traces what it sees, so the palette and the background are set
in the raster prompt. Read
[`vsb-image-prompting`](../vsb-image-prompting/SKILL.md) before you
write it.

```bash
# 1. Flat raster. PNG is mandatory: JPG artifacts trace into hundreds of stray paths.
RASTER=$(vsb run image/nano-banana-2 \
  --prompt "Flat vector illustration of a fox reading a book under a tree. Exactly 5 colours: burnt orange #E0642B, cream #F6EFE3, forest green #2F5D3A, dark brown #3B2A1A, sky blue #BFD8E6. Solid fills only. No gradients, no shading, no texture, no outlines, no noise. Clean hard edges. Subject centred with margin. Plain white background. No text, no watermark." \
  --aspect_ratio 1:1 --output_format png --json | jq -r '.result.urls[0]')

# 2. Trace it.
vsb run vector/recraft-vectorize --image "$RASTER" --json
```

- **Transparent background wanted?** Run
  `image-enhance/recraft-remove-background --image "$RASTER"` between
  step 1 and step 2, and trace its output instead. PNG transparency
  survives the trace.
- `image/nano-banana-2-lite` is fine for a draft. Use `image/nano-banana-2`
  for the final, since every edge becomes a path.
- Keep the raster square unless the user asked for another shape.
- This is one chain, not two. Do not feed the SVG, or the traced raster,
  back into an image model. Change the prompt and rerun step 1 instead.

## Route C: vectorize only

```bash
URL=$(vsb upload ./logo.png --json | jq -r '.url')
vsb run vector/recraft-vectorize --image "$URL" --json
```

For a node on the canvas, take `output_urls[0]` from
`vsb sandbox selection --json` as the `--image` value.

## Hold the colour count

Recraft has no palette setting. Check the SVG, then fix the raster if it
is over.

```bash
# Distinct fills in the SVG. Download to a scratch dir; this is a check, not a user save.
vsb run vector/recraft-vectorize --image "$RASTER" \
  --download "/tmp/vsb-vector/{request_id}.svg" --json > /tmp/vsb-vector/run.json
grep -o 'fill="[^"]*"' /tmp/vsb-vector/*.svg | sort -u | wc -l
```

If the count is over the target, or the SVG is bloated with near-duplicate
tints, posterize the raster and trace again. The retrace costs one cent.

```bash
magick /tmp/vsb-vector/raster.png -colors 5 +dither /tmp/vsb-vector/raster-5.png
URL=$(vsb upload /tmp/vsb-vector/raster-5.png --json | jq -r '.url')
vsb run vector/recraft-vectorize --image "$URL" --json
```

`magick` is ImageMagick. If it is missing, tighten the raster prompt
("exactly N colours, no anti-aliasing, hard edges") and rerun step 1.

## Deliver

- Output is `.svg`. Download template: `--download "./out/{request_id}.svg"`.
- `--download` only if the user opted into local saves. Otherwise hand
  back the share page `https://visualsandbox.com/share/<job_id>/`
  ([vsb critical rule 5](../vsb/SKILL.md#critical-rules-read-first)).
- The SVG has real paths. It opens in Illustrator, Figma, and Inkscape,
  and it drops into Cricut, Glowforge, and LightBurn.

## Cost estimation

```bash
vsb pricing vector/quiver-arrow-1.1 --json
vsb pricing vector/recraft-vectorize --json
vsb pricing image/nano-banana-2 --json
```

Route B is usually cheaper than route A: one raster plus one trace
costs less than one Quiver SVG.

## Common gotchas

- **Recraft's field is `image`, a single string.** Quiver's is `images`,
  a list. Run `vsb schema vector/<slug> --json` before you guess.
- **The slug has the category in it.** `vector/recraft-vectorize`, not
  `image-enhance/recraft-vectorize`.
- **Text in the SVG comes out as paths, not `<text>`.** Both models
  draw letters as shapes. Warn the user if they need editable type.
- **Gradients become colour bands.** Ask for solid fills in the raster
  prompt, or accept the bands.
- **Photos trace into thousands of paths.** Route C on a photo gives a
  stylized trace, not a clean logo. Regenerate as a flat raster instead.
