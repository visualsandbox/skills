---
name: vsb-nano-banana
renamed_from: nano-banana
description: >
  Prompt the Nano Banana family (Google's Gemini Image — `image/nano-banana-2-lite`,
  `image/nano-banana`, `image/nano-banana-2`, `image/nano-banana-pro`) well. Trigger whenever the
  user is about to call `vsb run image/nano-banana*` or asks how to phrase a
  prompt for these models — covers the variant picker, edit-mode rules, text
  rendering, multi-reference blending, and the things this family gets
  wrong. For the universal prompt-anatomy rules and reference-image
  subject-anchor pattern, read [`vsb-image-prompting`](../vsb-image-prompting/SKILL.md)
  first — this skill only adds nano-banana-specific quirks on top.
---

# Prompting Nano Banana

**Read [`vsb-image-prompting`](../vsb-image-prompting/SKILL.md) first.** It covers the
four universal rules, the full prompt-anatomy slot list, the
reference-image keep/ignore pattern, and the vocabulary banks — those apply
to every image model. This skill only adds Nano Banana–specific behavior
that diverges from the trunk.

Nano Banana is built on Gemini 3 — it reasons over the prompt before
drawing, so the natural-language scene-description approach in
[`vsb-image-prompting`](../vsb-image-prompting/SKILL.md) works especially well here.
The same endpoint handles text-to-image AND edits: pass `image_input` (an
array) to switch into edit mode.

Verify the live schema first: `vsb schema image/nano-banana --json`.

## Picking a variant

| Slug | When to use |
|------|-------------|
| `image/nano-banana-2-lite` | **Default.** Lightweight Nano Banana 2 — same low cost as the original (~$0.05/image, ~5s) but on the newer NB2 architecture. Great for iterating and everyday text-to-image + image edits. No `resolution` or web-search knobs. |
| `image/nano-banana` | The original Gemini 3 model. Same ~$0.05/image. Fall back here if a `nano-banana-2-lite` result looks off. Best with 1–3 reference images. |
| `image/nano-banana-2` | Full NB2 — adds `resolution` (up to 4K) and web-search grounding. Use when stills aren't crisp enough or you need higher fidelity. |
| `image/nano-banana-pro` | 4K-capable, sharpest text + typography, best for posters, infographics, packaging mockups, editorial work, and multi-reference character blending (up to 14 refs). Slowest + priciest of the three. |

All three share the same `image_input` array, `aspect_ratio` enum, and
`output_format` enum. Confirm with `vsb schema` before assuming.

## Image edits (`image_input` set)

> ⚠️ **Editing the same picture a second time degrades it.** The model never
> edits — it redraws the whole image from scratch on every pass, so error
> compounds. Before a second edit on one image, read
> [`vsb-image-iteration`](../vsb-image-iteration/SKILL.md). Also pass
> `--output_format png` on any output you may feed back in; the default is
> `jpg` and its compression stacks on every pass.

When `image_input` is non-empty, the model is editing — the prompt should
lead with the change and be explicit about what stays the same. The
universal subject-anchor pattern (in
[`vsb-image-prompting`](../vsb-image-prompting/SKILL.md)) is the floor; Nano Banana
takes especially well to plain-English edit instructions on top.

**Good:** `"Change the man's tie to dark green. Keep the rest of the photo,
lighting, and composition exactly as they are."`

**Bad:** `"man with green tie"` (loses every other detail).

Edit patterns Nano Banana handles cleanly:

- **Add / remove / swap:** `"Remove the car in the background."`
  `"Replace the coffee mug with a vintage typewriter."`
- **Restyle:** `"Restyle as a 1990s film photograph — kodak gold, slight
  grain, warm cast."` `"Convert to ink-on-paper line art."`
- **Reframe / re-angle:** `"Re-render this scene from a low angle, keeping
  the same subject and lighting."`
- **Weather / time-of-day:** `"Same scene but at golden hour with backlit
  rim light."`
- **Product extraction:** `"Extract the mug and place it on a clean white
  studio backdrop with a soft shadow."`

For the `aspect_ratio` field, `match_input_image` only makes sense in edit
mode — it keeps the first reference's dimensions.

## Text rendering (Nano Banana's standout strength)

Nano Banana is one of the few image models that renders legible text. Pro
is the sharpest of the three.

- **Quote the exact words.** `"The headline 'URBAN EXPLORER' rendered in
  bold, white, sans-serif font at the top of the poster."`
- **Describe the font.** Style words work (`bold`, `cursive`, `serif`,
  `monospace`, `neon signage`), and named fonts work surprisingly often
  (`Century Gothic`, `Helvetica`-style).
- **Localize.** Write the prompt in any language and pass the target text
  in quotes. For exotic scripts give the model the literal characters —
  don't ask it to translate.
- **Text-first hack for tricky layouts.** Two-step: first ask Nano Banana
  (chat-style) for the literal text content, then run a generation request
  that quotes that text. Improves accuracy on long strings.

## Multi-reference character consistency

The universal subject-anchor pattern (in
[`vsb-image-prompting`](../vsb-image-prompting/SKILL.md)) tells you *how* to phrase
"keep the subject, ignore the rest". Nano Banana adds two specifics on top:

- **Name each character / object in the prompt.** The model uses the name
  as an anchor across edits. `"Marigold the calico cat"` survives across
  follow-up edits better than `"the cat"`.
- **Use a reference pack.** Multiple angles of the same subject (front,
  profile, three-quarter) help the model triangulate identity. Pro takes
  up to **14 references** per prompt; standard nano-banana is best with
  **1–3**. For more than 3 references, switch to Pro.

## Multi-subject anatomy lock

Multi-person scenes hallucinate extra hands/arms when limb count is left
implicit. Budget every visible limb: state the exact total ("visible
hands: 2"), name whose and where each is, then declare the remaining arms
out of frame or hidden behind a torso. Same rule applies to feet on
full-body shots.

## What this family gets wrong (known limits)

Adds to the model-agnostic failure modes in
[`vsb-image-prompting`](../vsb-image-prompting/SKILL.md):

- **Tiny / dense text.** Long paragraphs at small size will hallucinate
  glyphs. Pro is best; even Pro isn't perfect.
- **Factual diagrams.** Anatomy, scientific cross-sections, and
  infographics may be confidently wrong. Verify any data-driven visual
  yourself.
- **Multilingual grammar.** Non-English text may have small grammatical
  slips or cultural mismatches. Provide the literal target string in
  quotes when accuracy matters.

## Worked examples

### Photoreal portrait (text-to-image)

```bash
vsb run image/nano-banana \
  --prompt "A 28-year-old florist standing in her shop doorway at golden hour. She wears a denim apron over a cream linen shirt. Shot on Fujifilm X-T5, 35mm, f/1.8 shallow depth of field. Warm rim light from the right, soft fill from the open window. Photoreal, cinematic muted teal-and-orange grading, slight sensor grain." \
  --aspect_ratio 4:5 \
  --output_format jpg \
  --download "./out/{request_id}.jpg" \
  --json
```

### Edit with reference (`image_input`)

```bash
URL=$(vsb upload ./product.jpg --json | jq -r '.url')
vsb run image/nano-banana \
  --prompt "Use the reference image as the PRODUCT source only. Keep the mug's pattern, colour, handle shape, and reflections exactly as they are. Ignore everything else from the reference — including any watermarks, text overlays, original background, and original lighting.

Now place this mug on a sunny tropical beach with sand and ocean waves in the background. Photoreal, natural midday daylight, soft shadow on the sand. No logos, no captions, no watermarks." \
  --image_input "[\"$URL\"]" \
  --aspect_ratio match_input_image \
  --download "./out/" \
  --json
```

### Poster with crisp typography (Pro)

```bash
vsb run image/nano-banana-pro \
  --prompt "A minimal travel poster. Composition: 9:16 vertical, full-bleed. Background: silhouette of a mountain range at dusk, indigo-to-magenta sky. Foreground typography: the word 'PATAGONIA' rendered in bold, white, condensed sans-serif font, baseline aligned at the bottom third. Subline reads 'Edge of the World' in a smaller serif italic directly underneath. Cinematic, slight film grain." \
  --aspect_ratio 9:16 \
  --output_format png \
  --download "./out/poster.png" \
  --json
```

### Multi-reference character blend (Pro shines here)

```bash
A=$(vsb upload ./pose.jpg --json | jq -r '.url')
B=$(vsb upload ./style.jpg --json | jq -r '.url')
C=$(vsb upload ./background.jpg --json | jq -r '.url')
vsb run image/nano-banana-pro \
  --prompt "Render a single image. Use Image A as the IDENTITY source — keep the subject's face, hair, skin tone, and body proportions exactly. Use Image B as the STYLE source — match its color grade, grain, and lighting feel, but ignore its subject. Use Image C as the BACKGROUND source — match the environment, but ignore any people or text in it. Cinematic, high-detail, no watermarks, no captions." \
  --image_input "[\"$A\",\"$B\",\"$C\"]" \
  --aspect_ratio match_input_image \
  --json
```

## Sources

- Google DeepMind — Gemini Image prompt guide: <https://deepmind.google/models/gemini-image/prompt-guide/>
- Google Cloud — Ultimate prompting guide for Nano Banana (2026-03): <https://cloud.google.com/blog/products/ai-machine-learning/ultimate-prompting-guide-for-nano-banana>
- Google blog — 7 tips for Nano Banana Pro: <https://blog.google/products-and-platforms/products/gemini/prompting-tips-nano-banana-pro/>
