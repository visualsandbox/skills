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
# Turn 1 — establish the original. Note the job_id it returns.
vsb run image/nano-banana-2 --json --no-sandbox \
  --output_format png --resolution 2K \
  --prompt "A man in a grey suit stands in a bright office."

# Turn 2 — the user wants a green tie. Re-run the SAME inputs with one
# sentence added. No reference image, so the picture is drawn fresh.
vsb run image/nano-banana-2 --json \
  --from-job <job_id_from_turn_1> \
  --prompt-add "He wears a dark green tie."

# Turn 3 — and a red door behind him. Stack again, from turn 2's job.
vsb run image/nano-banana-2 --json \
  --from-job <job_id_from_turn_2> \
  --prompt-add "A red door stands behind him."
```

`--from-job` copies the past run's inputs and `--prompt-add` appends to its
prompt. Explicit flags override anything inherited. Nothing is ever fed back in
as `image_input`, so there is no chain and no decay.

Doing it by hand works the same way: keep the master prompt in a file, append a
line per change, and pass the whole file each time.

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
vsb run image/nano-banana-2 --json \
  --image_input photo.png \
  --region "375,415,360,325" \
  --prompt "Change only the ceramic mug to a deep cobalt blue glazed ceramic.
Keep everything else in the image exactly the same, preserving the original
style, lighting, and composition."
```

The CLI crops the region with padding, sends **only the crop**, and pastes the
result back feathered and colour-matched. It then counts the pixels that changed
outside the region and reports the number, which must be `0`:

```json
"region": {
  "out_path": "photo-edited.png",
  "region":     { "x": 375, "y": 415, "w": 360, "h": 325 },
  "padded_box": { "x": 355, "y": 395, "w": 400, "h": 365 },
  "feather_px": 12,
  "pixels_changed_outside_region": 0,
  "colour_shift": { "r": -1.7, "g": -1.1, "b": -4.2 }
}
```

**Flags**

| Flag | Default | What it does |
|------|---------|--------------|
| `--region "x,y,w,h"` | — | The part to change. Percentages work too: `"40%,30%,25%,25%"`. |
| `--pad <px>` | 5% of the short side, 20–96 | Surrounding context included in the crop. Too little and the edit stops dead at the boundary. **The padded box is what gets pasted**, so keep it clear of anything you need untouched — a hat brim 8 px outside the region still came back redrawn. |
| `--feather <px>` | same as `--pad` | Alpha ramp on the way back. Spanning the padding means the paste is full strength inside the region and fades to nothing by the outer edge. |
| `--region-out <path>` | `<source>-edited.png` | Where the composited picture lands. |

`--image_input` may be a local file or a URL, so a sandbox node's `output_url`
works directly.

**Reading `colour_shift`:** the CLI samples the padding ring — context the model
only saw so it could match — and corrects the whole patch by the difference. A
shift of a few levels is normal and is what makes the seam disappear. A shift
near ±32 means the correction hit its clamp: the region is probably drawn
tighter than the object, so the ring caught part of the subject. Widen the
region and run again.

**Rules that make the seam invisible:**

- Expand the selection by 15–20 px before you generate.
- Feather the edge by 2–5 px on the way back.
- Keep every attempt. The best result is often a blend of two tries.
- **Prompt the change, not the scene.** "Change the wall behind her to sage
  green" beats a full re-description. A full description invites the model to
  reconsider everything.
- Expect the crop to come back slightly off in color. Correct it with a curves
  adjustment locally. Do not re-prompt for a color shift — that is another pass.

**When `--region` is the wrong tool.** It assumes the surroundings stay put: it
blends the new region against the padding ring, and the ring only works as a
reference if that ring is the same content in both pictures. Removing or moving
a whole structure breaks the assumption — take out a closet and the wall plane,
the floor line and the ceiling all shift out to the frame edges, so there is no
stable border left to blend against. Measured on exactly that edit: the colour
match hit its ±32 clamp on all three channels and the result was an obvious
rectangle. The CLI now warns when the clamp is hit.

For that kind of change, run **full-frame** with no `--region`, and accept that
everything is redrawn. Tier up to `image/nano-banana-pro` when the picture has
detail worth keeping — on a real bedroom photo it held the brick texture, the
cap logos and the lamp filament that the cheaper models softened away.

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
| `output_format` | `jpg` for text-to-image, **`png` automatically when `image_input` is set** | Visual Sandbox flips it for you on edit runs, because an edit's output is a likely input to the next edit. Pass `--output_format jpg` to override. |
| `resolution` | `1K` on `nano-banana-2`, `2K` on `nano-banana-pro` | **`2K`.** It holds up across passes. Only `nano-banana-2`, `nano-banana-pro`, and `gpt-image-2` expose it. |
| `aspect_ratio` | `match_input_image` | Leave it. Changing it forces a full re-frame. |
| Model | `nano-banana-2-lite` | **Not Lite for chained edits.** Google states Nano Banana 2 Lite is "not optimized for multiple reference inputs or multi-turn sequential editing." Use `image/nano-banana-2` or `image/nano-banana-pro`. |

A text-to-image run stays JPEG, because its output is a leaf. The moment a
reference image is attached the container switches to PNG on its own. Check the
`inputs.output_format` on the response if you want to be sure.

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
- **Feathering on its own.** It softens the boundary and does nothing about the
  interior. Measured on a real Nano Banana edit: the step at the seam was 1.2
  levels, the patch interior sat 8.9 levels bluer than the wall around it, and
  it was the interior the eye caught. The colour match is what fixes it — which
  is why `--region` does both.
- **`ffmpeg overlay` for the paste-back.** It converts the frame to YUV 4:2:0
  and back, which damages the whole picture. Measured: 324,018 pixels changed
  outside a 552x552 paste on a 1024x1024 frame. Use `--region`; if you must do
  it by hand, force `format=rgba` on both inputs and
  `overlay=...:format=rgb,format=rgb24` on the output.
- **A fresh chat or a fresh session.** Some users believe conversation history
  causes the loss. The problem also appears through the API with no history at
  all, so this is unproven. Nothing is lost by starting fresh, but do not rely
  on it as the fix.

## Pre-flight checklist

Before the **second** `vsb run` on the same picture:

1. Do I still have the original image or the original prompt? (If no — this is
   already workflow D.)
2. Does the user need the exact same frame? → `--region` (workflow C). Otherwise → `--from-job` + `--prompt-add` (workflow A).
3. Did I pass `--output_format png`? (Automatic when `image_input` is set — but confirm it in the response.)
4. Am I on `nano-banana-2` or `nano-banana-pro`, not Lite?
5. Am I about to pass my own last output as `image_input`? → stop, go to step 2.

All five ✓ → run. Any ✗ → not ready.

## Cross-links

- Prompt craft for every image model → [`vsb-image-prompting`](../vsb-image-prompting/SKILL.md)
- Model picker → [`vsb-image`](../vsb-image/SKILL.md)
- Nano Banana edit-mode quirks + variant table → [`vsb-nano-banana`](../vsb-nano-banana/SKILL.md)
- Saving a recipe so the original inputs survive → [`vsb-presets`](../vsb-presets/SKILL.md)
- Sandbox selection chain (critical rule 10) → [`vsb`](../vsb/SKILL.md)
