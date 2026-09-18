---
name: vsb-vector
description: >
  Make, edit and animate SVG files with Visual Sandbox. Trigger when the
  user asks for an SVG, a vector, a logo, an icon, an animated logo or
  loading state, a cut file (Cricut, laser, CNC, embroidery), or wants to
  "vectorize" a raster image via the vsb CLI. `vector/quiver-arrow-2` is
  the default: it writes an SVG from a prompt, vectorizes a raster, edits
  an SVG you already have, and animates one into a loop. For a detailed
  illustration, generate a flat raster with an image model first and
  trace it with `vector/recraft-vectorize`. Always ask the user how many
  colours the SVG must have before you run anything.
---

# Vector generation with vsb

> **On the MCP surface?** If the `visual-sandbox` MCP tools are in your
> tool list, use `generate` and `get_job` instead of the shell commands
> below. The route choice and the prompt craft on this page still apply.
> See [`vsb` → Two ways to run](../vsb/SKILL.md#two-ways-to-run-mcp-tools-or-the-cli).

Four live models. Verify with `vsb models --modality vector --json` before
you trust this table.

| Slug | Input | Cost | Good for |
|------|-------|------|----------|
| `vector/quiver-arrow-2` | prompt, or prompt + images, or image only, or `svg` (+ prompt) | ~$0.07 an icon, ~$0.60 a dense illustration, ~$0.03 an edit or an animation | **The default.** Icons, glyphs, monoline marks, simple logos. The only family that edits and animates an SVG you already have. |
| `vector/quiver-arrow-2-telos` | same as Arrow 2 | ~$0.10 an icon, ~$0.90 a dense illustration, ~$0.04 an edit or an animation | Arrow 2 plus a frontier reasoning model. A diagram whose logic must hold, an infographic from real figures, a mark that must obey a page of brand rules. Reads about eight times as much brief. |
| `vector/quiver-arrow-1.1` | prompt, or prompt + reference images, or image only | $0.25 a generate, $0.19 a vectorize, flat | Only when a dense illustration must land on a known flat price. Cannot edit and cannot animate. |
| `vector/recraft-vectorize` | one raster image | ~$0.02 per SVG | Tracing any raster into editable paths. The second half of the illustration route. |

**The Arrow 2 family is token-billed**, so the price moves with how much
drawing the model does. `vsb pricing` shows a ceiling, and the user is
charged for what the model actually produced, never more than the quote.
Arrow 1.1 is the only flat price in the table.

**Do not pick Telos for an icon.** It draws the same shapes as Arrow 2 and
costs half again as much. Pick it when the thinking is the hard part.

Start every run in a **background shell** (Claude Code: `run_in_background:
true`). All four models are sync. Recraft finishes in seconds; the Arrow 2
family takes about a minute, and Telos longer. Rules in
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
| The user has an SVG and wants it changed ("recolour it", "thicken the strokes", "add a badge") | **D. Edit an SVG** |
| The user wants a logo, a loader or a mark to move | **E. Animate an SVG** |

Only the colour question applies to routes A, B and C. Routes D and E
start from an SVG, so its palette is already decided.

Quiver is not the default for a picture. It draws clean icons and falls
apart on detail: a busy illustration comes back simplified, with merged
shapes and dropped elements. That is the case for route B.

## Route A: Quiver direct

```bash
vsb run vector/quiver-arrow-2 \
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
  Quiver is several times the price of Recraft for that job).
- `--reasoning_effort` takes `low`, `medium`, `high`, `xhigh`. Leave it
  alone for a single glyph. Raise it when the layout is the hard part.
  Higher effort spends more tokens, so it costs more.
- Arrow 2 rejects `temperature`, `top_p` and `presence_penalty`. Those
  were Arrow 1.x knobs. `reasoning_effort` replaced them.
- Swap in `vector/quiver-arrow-2-telos` when the brief is long or its
  logic has to hold. Paste the whole brand guide or data table in rather
  than summarising it; reading it is what you are paying for.

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

## Route D: edit an SVG that already exists

`svg` plus a prompt edits. The Arrow 2 family only; Arrow 1.1 and Recraft
have no `svg` field at all.

```bash
SVG=$(vsb run vector/quiver-arrow-2 --prompt "..." --json | jq -r '.result.urls[0]')

vsb run vector/quiver-arrow-2 \
  --svg "$SVG" \
  --prompt "Make the star rounded and fill it #FFD700. Leave everything else as it is." \
  --json
```

- `--svg` takes a URL, a data URI, or raw markup. A sandbox node works:
  pass its `output_urls[0]`.
- Name what changes and say the rest stays. The model reads the real
  paths, so an unmentioned shape survives the edit.
- The edits endpoint reads at most 200,000 characters of markup and takes
  at most 4 reference images. Generate takes 16. A traced photo usually
  blows the character cap; edit the source raster instead.
- An edit is the cheapest thing the family does. Iterating on one mark
  beats regenerating it.

## Route E: animate an SVG

`svg` with **no** prompt animates. The output is a looping SVG with the
loop written into the file, so it plays in a browser with no JavaScript
player and no video file.

```bash
vsb run vector/quiver-arrow-2 --svg "$SVG" --json

# Steer what moves. --operation animate is required here:
vsb run vector/quiver-arrow-2 \
  --svg "$SVG" \
  --prompt "Spin the outer ring clockwise, forever. Hold the wordmark still." \
  --operation animate \
  --json
```

- Careful: a prompt plus `svg` and nothing else **edits**, it does not
  animate. `--operation animate` is what makes the prompt steer a loop.
- Animate a tidy SVG. A mark Arrow 2 drew animates reliably; a traced
  photo or a file with no grouping gives the model nothing to grab.
- Good jobs: a logo reveal in a site header, a loading bar, an empty
  state, an icon micro-cue, a product illustration that needs some life.
- The file is a few kilobytes and needs no player, which is the whole
  reason to reach for this over a hand-built animation.

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
- An animated SVG from route E is still one `.svg`. It loops in a
  browser and in Figma, but a cutter reads only the shapes.

## Cost estimation

```bash
vsb pricing vector/quiver-arrow-2 --json
vsb pricing vector/quiver-arrow-2-telos --json
vsb pricing vector/quiver-arrow-1.1 --json
vsb pricing vector/recraft-vectorize --json
vsb pricing image/nano-banana-2 --json
```

The Arrow 2 family quotes a ceiling, not a fixed price. The bill lands at
what the model actually drew, and never above the quote.

Route B is usually cheaper than route A for a detailed picture: one raster
plus one trace costs less than one dense Quiver SVG. For a plain icon,
route A on Arrow 2 is the cheaper of the two.

## Common gotchas

- **Recraft's field is `image`, a single string.** Quiver's is `images`,
  a list. Run `vsb schema vector/<slug> --json` before you guess.
- **`svg` plus a prompt edits. `svg` alone animates.** Pass a prompt when
  you meant to animate and you get an edit back. Force it with
  `--operation animate`, `edit`, `generate` or `vectorize`.
- **Only the Arrow 2 family has an `svg` field.** Arrow 1.1 and Recraft
  cannot edit and cannot animate. Check the slug before you promise it.
- **The slug has the category in it.** `vector/recraft-vectorize`, not
  `image-enhance/recraft-vectorize`.
- **Assume text comes out as paths, not `<text>`.** These models draw
  letters as shapes. Open the file before you promise editable type.
- **Gradients become colour bands.** Ask for solid fills in the raster
  prompt, or accept the bands.
- **Photos trace into thousands of paths.** Route C on a photo gives a
  stylized trace, not a clean logo. Regenerate as a flat raster instead.
