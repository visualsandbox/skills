---
name: vsb-ugc-people
renamed_from: ugc-people
description: >
  Prompt AI image models to produce UGC-style photos of a single person for
  9:16 paid ad creative (TikTok, Reels, Shorts). Covers two distinct formats —
  selfie / phone-camera POV (handheld, hook shot) and locked-off talking-head
  testimonial (single frame meant to look like a real creator on a tripod).
  Trigger when the user asks for "UGC ad", "AI influencer photo", "creator
  selfie", "talking head ad frame", "ugc style", "fake iPhone photo of a
  person", or is about to run `vsb run image/<slug>` for a person shot
  intended to look like real UGC. Pairs with the `vsb-nano-banana` skill for
  prompt craft and the `vsb-image` skill for picking a model.
license: Proprietary. See LICENSE for the terms.
---

# UGC people for 9:16 ad creative

UGC ads succeed when the image **does not look AI**. Modern image models are
biased toward "professional photography" — clean studio light, smooth skin,
symmetric framing. UGC is the opposite: phone camera, imperfect, candid. Every
rule below pushes the model away from its default and toward something a real
creator would post.

Two formats, two rule sets. Pick one before you start writing the prompt.

## The two formats

| | **Selfie / phone POV** | **Talking-head testimonial** |
|---|---|---|
| Use case | Hook shot, scroll-stopper, "real moment" frame | Testimonial frame, problem/solution, single-take ad |
| Camera | Handheld, micro-jitter | Locked-off, no pan, no zoom |
| Eye line | Slightly **above** subject's eye, angled down | Subject's eye level, dead-on |
| Framing | Medium close-up to mid-shot, off-center OK | Medium close-up (chest to head), centered |
| Distinctive cues | Hand holding phone in frame, mirror, reflection | Static room, single light source, gesture script |
| Full rules | `references/selfie-pov.md` | `references/talking-head.md` |

Open the matching reference file before writing the prompt — it has the filled
template, the verbatim worked examples, and the failure modes specific to that
format.

## The slot order

Every working UGC people prompt fills these slots, in this order. Skipping a
slot lets the model default to its training median (stocky, smooth, posed).

1. **Device token** — `"shot on iPhone 15 Pro, front camera feel, not DSLR,
   not studio quality"`. See § "The iPhone token rule" below.
2. **Subject** — age range, ethnicity, build, mood. Specific: `"early-to-mid
   20s, mixed-heritage, freckles across nose, messy low bun"`. Not: `"a young
   woman"`.
3. **Wardrobe** — named items, fit, fabric: `"short-sleeve beige ribbed
   scoop-neck top"`, `"white fitted long-sleeve crop top, light blue
   leggings"`.
4. **Action** — micro-gesture, mid-action. `"tucking hair behind ear"`, `"hand
   loosely near chin"`, `"mid-laugh, phone held naturally"`. Static A-pose
   kills UGC realism.
5. **Location** — specific room, time of day, named light source: `"open
   luxury kitchen interior, polished concrete flooring, morning light from
   window camera-left"`.
6. **Lighting** — soft, natural, named. Two light sources (window + lamp) is
   a high-fidelity trick. Never `"studio lighting"`.
7. **Camera artifacts** — `"slight motion softness, mild grain, natural
   exposure, slight lens distortion from front camera, no HDR or cinematic
   color grading"`.
8. **Vibe line** — one sentence at the end: `"candid, unposed, natural
   lifestyle selfie — looks like a quick real moment, not staged or
   professionally shot."`

Then end with a negative block (see § "What to avoid").

## The iPhone token rule

The single most load-bearing line in any UGC prompt:

```
shot on iPhone 15 Pro, front camera feel, not DSLR, not studio quality
```

Why it works: every image model has been trained on millions of photos
tagged `iPhone`. The token activates the right cluster of training data
(short focal length, front-camera color science, soft auto-HDR look) and
the `not DSLR, not studio quality` half explicitly suppresses the
professional-photography cluster the model defaults to.

Variants in the wild: `"iPhone 13 front camera feel"`, `"iPhone 16 Pro
aesthetic"`, `"iPhone 17 Pro Max Simulation"`, `"matte white iPhone with the
recognizable triple-camera lens module"` (when the phone is *in* frame for a
mirror selfie). Pick a model — don't say just `"smartphone"`.

If the skill outputs only one fragment right, it must be this one.

## Anti-plastic vocabulary

Use *inline*, in the positive prompt — not just in the negatives. These cues
push the model toward textured human realism.

**Skin texture:**
`visible pores`, `peach fuzz catching the light along the jawline`,
`faint freckles across the bridge of the nose`, `subsurface scattering`,
`natural skin texture, no beauty filter`, `slight blemish on the cheek`.

**Imperfection:**
`slight motion blur`, `mild grain`, `slightly off-center framing`,
`slightly overexposed in the bright spots`, `slight lens distortion`,
`framing feels candid and handheld`.

**Hair:**
`slightly grown-out roots`, `natural baby hairs visible at the hairline`,
`messy unstyled strands`, `slightly frizzy`.

**Micro-expression:**
`caught laughing at something real`, `mouth slightly open mid-sentence`,
`small natural smile, not posed`, `relaxed brows`, `neutral, slightly serious
expression`.

## What to avoid

Words that drag the model toward stock-photo / glamour-magazine output. Do
**not** put these in the positive prompt — modern image models pattern-match
on language regardless of sign.

- `professional photography`, `studio lighting`, `8K masterpiece`,
  `hyperdetailed`, `sharp focus`, `cinematic` (unless you genuinely want
  cinematic)
- `beautiful`, `perfect`, `flawless`, `stunning` — bias toward glamour
- `model`, `supermodel`, `actress`, `influencer` as the *only* subject
  descriptor — biases toward posed studio energy. Replace with a concrete
  demographic.
- Pro camera brand names: `Hasselblad`, `Sony A7`, `shot on RED`
- `HDR`, `color graded`, `cinematic color grading`

Append a negative block at the end of every UGC prompt. Standard template:

```
Negatives: professional photography, studio lighting, sharp focus,
airbrushed skin, perfect composition, cinematic, 8k, masterpiece,
plastic skin, over-smoothed texture, distorted hands, extra fingers,
warped iPhone shape, harsh flash, harsh studio lighting, glamour
magazine aesthetic, oversaturated colors, mannequin face,
AI-perfect frozen expression, watermarks, captions, on-screen text.
```

For multi-shot work, also add: `face drift between shots, altered eye
shape, altered freckle placement, hair change, outfit change`.

## Model picker

Verify the live catalog: `vsb models --modality image --json | jq '.models[]
| {slug, category, owner}'`.

| Need | Default slug | Why |
|------|--------------|-----|
| Raw UGC realism, single shot | `image/gpt-image-2` | OpenAI. Current operator favourite for photoreal humans. Accepts negative-energy prompts ("failed candid shot") well. Weaker text rendering. Tiered cost — `Low quality` ≈ $0.006, `High quality` ≈ $0.21. |
| Multi-shot character consistency, text/product label legibility | `image/nano-banana-pro` | Google. Strongest prompt adherence + text. Polished-AI baseline — needs explicit anti-plastic cues. Tiered cost — 1K/2K ≈ $0.15, 4K ≈ $0.30. |
| Quick, cheap, good enough | `image/nano-banana` | Same family, fastest + cheapest among nano-banana tier. Flat ≈ $0.05. |
| Cheapest UGC-viable, gen + edit | `image/flux-2-klein-9b` | Black Forest Labs. Flat ≈ $0.02 gen / $0.04 edit-with-ref. Identity holds well across a single edit cycle. Best test-bench default; bump to nano-banana-pro if you need multi-shot consistency. |

For Midjourney and Higgsfield-style preset notes, see
`references/model-notes.md`.

Always verify the live schema: `vsb schema image/<slug> --json`. Read
per-slug help with `vsb run image/<slug> --help` — it surfaces array-typed
inputs (e.g. `image_input: array<string>`) and string-enum quirks
(`output_megapixels: '1'` is a string Literal, not the int 1).

**Reference-image CLI shape.** `--image_input` is array-typed. Pass either
repeated (`--image_input a --image_input b`) or as a JSON-array string
(`--image_input '["a","b"]'`). A single bare `--image_input <path>` is
auto-wrapped, but multi-ref calls need the repeated or JSON form.

## Quick start

A minimal selfie-POV run:

```bash
vsb run image/nano-banana-pro \
  --prompt "Shot on iPhone 15 Pro, front camera feel, not DSLR, not studio
quality. Mid-20s mixed-heritage woman, natural skin texture with visible pores
across the T-zone and faint freckles across the bridge of the nose, messy low
bun with baby hairs at the hairline. Short-sleeve oversized cream sweater.
Mid-action: tucking hair behind her ear with her left hand while looking
softly toward the lens, mouth slightly open mid-sentence. Open kitchen
interior, polished concrete floor, morning light from a window camera-left,
warm lamp on a shelf behind her adding a soft glow. Slight motion softness,
mild grain, slight lens distortion from front camera, slightly overexposed
on the window side, no HDR or cinematic color grading. Candid, unposed,
natural lifestyle selfie — looks like a quick real moment, not staged or
professionally shot. Negatives: professional photography, studio lighting,
plastic skin, airbrushed, glamour magazine, perfect composition, 8k,
masterpiece, distorted hands, extra fingers, harsh flash, mannequin face,
AI-perfect frozen expression, watermarks, captions." \
  --aspect_ratio 9:16 \
  --output_format jpg \
  --download "./out/{request_id}.{ext}" \
  --json
```

Open `references/selfie-pov.md` for the full filled template and three
verbatim worked examples. For testimonial-frame work, open
`references/talking-head.md`.
