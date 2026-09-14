---
name: vsb-image-iteration
description: >
  Change an image more than once without it falling apart. Read this before the
  SECOND `vsb run` on the same picture — before chaining a sandbox node's
  `output_url` into the next run's `image_input`, before "now make the shirt
  blue too", and before any loop that feeds an output back in as an input.
  Covers generation loss (why every image model degrades on repeated edits), the
  four workflows that prevent it (prompt stacking, contact sheet, crop and
  composite, noise repair), and the `output_format` / `resolution` settings that
  decide the outcome. For writing the prompt itself, read
  [`vsb-image-prompting`](../vsb-image-prompting/SKILL.md) first.
---

# Iterating on an image without degrading it

## The one thing to know

**No image model edits an image. It reads the image and draws a new one that
copies it.** Every "edit" is a full redraw from scratch.

So each pass adds error on top of the last pass. After two edits you see it.
After ten, the parts you never touched are unusable. Users call it
*generation loss*, or "a photocopy of a photocopy".

This is not a Nano Banana bug. It happens on `image/nano-banana*`,
`image/gpt-image-2`, `image/seedream-5-pro`, and `image/flux-2-*`. It happens
through the API, not only in a chat interface. It cannot be prompted away.

**What it looks like:** grain and noise creep in, edges go soft, colors drift,
JPEG blocks and banding appear, faces slowly stop being the same face.

> **The trap in this CLI.** [`vsb` critical rule 10](../vsb/SKILL.md#critical-rules-read-first)
> tells you to pass a selected node's `output_url` into the next run's
> `image_input`. That is correct for the FIRST edit. Do it twice in a row and
> you have built the photocopy loop. Read the decision table below before the
> second one.

## Pick a workflow

| You want | Use | Quality cost |
|----------|-----|--------------|
| Several changes to one picture | **A — prompt stacking** | None. Always one pass. |
| Many frames of the same subject / scene | **B — contact sheet** | None. One pass for all frames. |
| One small change, rest must stay untouched | **C — crop and composite** | None outside the crop. |
| An image that is already damaged | **D — noise repair** | Recovers some. Not all. |

Workflows A and C are the only two that actually solve the problem. B avoids it
by never chaining. D is a rescue for work you cannot redo.

---

## Workflow A — prompt stacking (the default)

**Never edit the edit. Grow the prompt and re-run from the original.**

Keep two things in a scratch file: the original image (or the original
text-to-image prompt) and a master prompt. For each new change, append one
sentence to the master prompt, then run again from the original source.

```bash
# Turn 1 — establish the original. Keep this file.
vsb run image/nano-banana-2 --json \
  --prompt "$(cat master.txt)" \
  --output_format png --resolution 2K

# Turn 2 — the user wants a green tie. Grow the prompt, re-run from scratch.
echo "The man wears a dark green tie." >> master.txt
vsb run image/nano-banana-2 --json \
  --prompt "$(cat master.txt)" \
  --output_format png --resolution 2K

# Turn 3 — and now a red door behind him. Grow again, run again.
echo "A red door stands behind him." >> master.txt
vsb run image/nano-banana-2 --json \
  --prompt "$(cat master.txt)" \
  --output_format png --resolution 2K
```

When the original is a photo the user supplied, the same rule applies — the
`image_input` always points at **their** file, never at your last output.

**Cost:** a full generation per change, same as an edit. Nano Banana 2 Lite is
about $0.05. You pay the same either way, so there is no reason to chain.

**Trade-off:** the composition moves between runs, because each run is a new
draw. When the user needs the exact same frame and only one element changed,
use workflow C instead.

> ⚠️ This corrects rule 4 in [`vsb-image-prompting`](../vsb-image-prompting/SKILL.md)
> ("Iterate, don't one-shot. One change per turn."). One change per turn is
> right. Feeding the previous output back in is not. Iterate on the **prompt**,
> not on the **pixels**.

## Workflow B — contact sheet (one pass, many frames)

When the user needs the same character or product in several shots, ask for a
grid in a single generation. One pass means one draw, so every frame shares
exactly the same face, wardrobe, light, and grade. No chaining, no drift.

```bash
vsb run image/nano-banana-pro --json --output_format png --resolution 4K \
  --aspect_ratio 3:2 \
  --prompt "One 2x3 contact sheet image, 6 frames.
All wardrobe, styling, hair, makeup, lighting, environment, and color grade
must remain 100% unchanged across all frames.
Each frame shows a resting point after a camera move. Describe only the final
camera position and what the subject does, never the motion.
Frame 1: eye-level medium shot, three-quarter turn.
Frame 2: high-angle three-quarter frame, diagonal downward, reveals wardrobe from above.
Frame 3: low-angle oblique full-body frame, elongates the silhouette.
Frame 4: side-on compression frame, long lens.
Frame 5: over-the-shoulder frame, subject in the near third.
Frame 6: extreme detail frame of one wardrobe detail, from an unusual angle.
Keep exact garment type, silhouette, material, color, texture, stitching,
accessories, closures, jewelry, shoes, hair, and makeup in every frame."
```

Then split the grid. Two ways, both fine:

- **Local crop** (free, exact) — splits a 2x3 sheet into six tiles:
  ```bash
  for r in 0 1; do for c in 0 1 2; do
    ffmpeg -y -i sheet.png -vf "crop=iw/3:ih/2:iw/3*$c:ih/2*$r,format=rgb24" \
      -frames:v 1 -update 1 "frame_${r}${c}.png"
  done; done
  ```
- **Model extract** (costs a run, upscales at the same time):
  `"Isolate and amplify the key frame in row 1 column 1. Keep all details of
  the image in this keyframe exactly the same, do not change the pose or any
  details of the model."`

Use the local crop by default. The model extract is a second pass, so it is a
second chance to degrade.

**Best fit:** keyframes for image-to-video, character sheets, product angles,
storyboards, ad variations.

## Workflow C — crop and composite (surgical)

**Change one region. Keep every other pixel bit-identical.**

This is what professional retouchers do. The model only ever sees the crop, so
loss cannot spread into the rest of the picture.

1. **Crop the region**, with padding around it. Padding matters — a tight crop
   produces an edit that does not know what it sits next to, and the seam shows.
   Add 15–20 px.
2. **Run the model on the crop only.**
3. **Paste the result back** onto the original with a feathered mask (2–5 px).

```bash
# 1. Crop a 512x512 region at (320,180), with 20px of padding on every side.
#    Crop origin moves back by the padding; width and height grow by twice it.
ffmpeg -y -i original.png -vf "crop=552:552:300:160" -frames:v 1 -update 1 crop.png

# 2. Edit the crop, not the picture.
vsb run image/nano-banana-2 --json --output_format png \
  --image_input '["crop.png"]' \
  --aspect_ratio match_input_image \
  --download ./ \
  --prompt "Change the wall behind her to sage green. Keep everything else in
the image exactly the same, preserving the original style, lighting, and
composition."

# 3. Composite it back with a feathered edge. The format=rgba / format=rgb24
#    pair is NOT optional — see the warning below.
ffmpeg -y -i original.png -i edited-crop.png -filter_complex \
"color=black:s=552x552,format=gray,drawbox=x=6:y=6:w=540:h=540:color=white:t=fill,boxblur=4[m];\
[1]format=rgba[c];[c][m]alphamerge[fg];\
[0]format=rgba[bg];[bg][fg]overlay=300:160:format=rgb,format=rgb24" \
  -frames:v 1 -update 1 final.png
```

> ⚠️ **Always force the pixel format on an ffmpeg composite.** Without
> `format=rgba` on both inputs and `overlay=...:format=rgb,format=rgb24` on the
> output, ffmpeg converts the frame to YUV 4:2:0 and back. That subsamples the
> chroma of the **whole picture**, so the paste-back step quietly damages every
> pixel it was supposed to protect — which is the exact failure this workflow
> exists to prevent.
>
> Measured on a 1024x1024 test frame with a 552x552 paste: the naive
> `overlay=300:160` changed **324,018 pixels outside the region**. The command
> above changed **0**.
>
> Verify it yourself on any composite:
> ```bash
> ffmpeg -v quiet -i final.png -f rawvideo -pix_fmt rgb24 - | cmp - \
>   <(ffmpeg -v quiet -i original.png -f rawvideo -pix_fmt rgb24 -) | head -1
> # The first differing byte must fall inside the pasted box.
> ```

**Rules that make the seam invisible:**

- Expand the selection by 15–20 px before you generate.
- Feather the edge by 2–5 px on the way back.
- Keep every attempt. The best result is often a blend of two tries.
- **Prompt the change, not the scene.** "Change the wall behind her to sage
  green" beats a full re-description. A full description invites the model to
  reconsider everything.
- Expect the crop to come back slightly off in color. Correct it with a curves
  adjustment locally. Do not re-prompt for a color shift — that is another pass.

**Best fit:** a fix on a picture the user already approved, product retouching,
removing one object, a text or sign correction, any change the user calls small.

## Workflow D — noise repair (rescue an image that is already damaged)

Use this only when the damage exists and the original is gone.

Add monochrome Gaussian noise to the image **before** you upload it. The noise
breaks up the JPEG blocks and the color banding. The model must then clean the
noise, so it rebuilds real detail instead of copying the damage.

```bash
# Add grain locally. More damage needs more noise; do not bury fine detail.
ffmpeg -y -i damaged.png -vf "noise=alls=18:allf=t+u" noisy.png

vsb run image/nano-banana-pro --json --output_format png --resolution 4K \
  --image_input '["noisy.png"]' \
  --prompt "Upscale the image, reconstruct it with no noise and a high amount
of detail, maintain its style."
```

Run it again with a different noise level if the first result is wrong. This
recovers sharpness and gradients. It does not recover detail the model never
drew.

An alternative rescue: `image-enhance/upscale`. Check the catalog first with
`vsb models --modality image --json`.

---

## Settings that decide the outcome

| Setting | Default in Visual Sandbox | What to use when iterating |
|---------|---------------------------|----------------------------|
| `output_format` | `jpg` on **every** image model | **`png`.** JPEG re-compresses on every pass and that damage compounds. This is the single cheapest fix. |
| `resolution` | `1K` on `nano-banana-2`, `2K` on `nano-banana-pro` | **`2K`.** It holds up across passes. Only `nano-banana-2`, `nano-banana-pro`, and `gpt-image-2` expose it. |
| `aspect_ratio` | `match_input_image` | Leave it. Changing it forces a full re-frame. |
| Model | `nano-banana-2-lite` | **Not Lite for chained edits.** Google states Nano Banana 2 Lite is "not optimized for multiple reference inputs or multi-turn sequential editing." Use `image/nano-banana-2` or `image/nano-banana-pro`. |

**Always pass `--output_format png` when the output may become an input.** The
CLI default is `jpg` for every model, which is right for a one-shot render and
wrong for anything you plan to edit.

```bash
vsb schema image/nano-banana-2 --json | jq '.inputs | {output_format, resolution}'
```

## Prompt templates

**The preserve template** (Google's own semantic-mask wording — use it on every
edit run):

```
Using the provided image, change only the [specific element] to [new element].
Keep everything else in the image exactly the same, preserving the original
style, lighting, and composition.
```

**Name three things, never two.** An implied region causes a full redraw:

1. Which region changes. Describe it as if you were drawing a mask.
2. What the change is.
3. What the result must look like.

**Use positive phrasing.** "An empty, deserted street with no signs of traffic"
works. "A street with no cars" gives you cars. The model reads the noun, not
the "not". This is the same rule as
[`vsb-image-prompting`](../vsb-image-prompting/SKILL.md) rule 2.

## What does not work

- **Quality tags.** "8k", "high resolution", "keep the same quality",
  "maintain sharpness" do nothing on this model class. Users test them
  constantly and report no effect.
- **Asking the model to fix its own damage.** A fresh run that says "fix the
  pixelation" returns the same bad result. Use workflow D instead.
- **Long negative commands.** Repeating "do not change the background" five
  ways does not help and often makes it worse.
- **A fresh chat or a fresh session.** Some users believe conversation history
  causes the loss. The problem also appears through the API with no history at
  all, so this is unproven. Nothing is lost by starting fresh, but do not rely
  on it as the fix.

## Pre-flight checklist

Before the **second** `vsb run` on the same picture:

1. Do I still have the original image or the original prompt? (If no — this is
   already workflow D.)
2. Does the user need the exact same frame? → workflow C. Otherwise → workflow A.
3. Did I pass `--output_format png`?
4. Am I on `nano-banana-2` or `nano-banana-pro`, not Lite?
5. Am I about to pass my own last output as `image_input`? → stop, go to step 2.

All five ✓ → run. Any ✗ → not ready.

## Cross-links

- Prompt craft for every image model → [`vsb-image-prompting`](../vsb-image-prompting/SKILL.md)
- Model picker → [`vsb-image`](../vsb-image/SKILL.md)
- Nano Banana edit-mode quirks + variant table → [`vsb-nano-banana`](../vsb-nano-banana/SKILL.md)
- Saving a recipe so the original inputs survive → [`vsb-presets`](../vsb-presets/SKILL.md)
- Sandbox selection chain (critical rule 10) → [`vsb`](../vsb/SKILL.md)
