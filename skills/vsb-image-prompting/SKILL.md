---
name: vsb-image-prompting
renamed_from: image-prompting
description: >
  Canonical prompt-craft skill for every image model in Visual Sandbox
  (`image/nano-banana*`, `image/gpt-image-2.5-flare`, `image/gpt-image-2`,
  `image/flux-2-klein-9b`, future
  slugs). Read before writing any `vsb run image/<slug>` prompt — text-to-image
  or edit-with-reference. Covers the universal rules, the prompt-anatomy slot
  list, the reference-image keep / ignore formula (what to take from the
  reference, what to ignore — watermarks, text overlays, original lighting,
  original background), and the "enumerate models before picking cheapest"
  rule. Model-specific quirks live in sibling skills (`vsb-nano-banana`,
  `vsb-ugc-people`).
license: Proprietary. See LICENSE for the terms.
---

# Image prompting (model-agnostic)

## Universal rules

1. **Be specific.** Concrete subject, scene, light. Not "dog in park".
2. **Positive framing.** Describe what's there, not what isn't. ("Empty street" ✓, "street with no cars" ✗.)
3. **Use photography language.** `f/1.8 shallow DoF`, `golden hour`, `Rembrandt lighting` map to real transforms.
4. **Iterate on the prompt, not on the pixels.** One change per turn — but
   grow the prompt and re-run from the original. Feeding your own last output
   back in as `image_input` compounds loss on every pass. See
   [`vsb-image-iteration`](../vsb-image-iteration/SKILL.md).

## Prompt anatomy

Pick 5–9 slots. Concreteness > coverage.

| Slot | Example |
|------|---------|
| Subject | 28yo brunette, shoulder-length wavy hair, faint freckles, pale skin |
| Wardrobe | oversized cream cable-knit sweater, gold hoop earrings, no makeup |
| Action | holding latte mug close to chest with both hands |
| Location | sunlit Brooklyn apartment corner, exposed brick, fairy lights on window frame |
| Composition | medium close-up selfie, 9:16, eyes upper third, shoulders cropped |
| Camera | Shot on iPhone 17 Pro Max main lens (~26mm equiv) |
| Lens / DoF | f/1.8 shallow DoF, slight motion blur on hand |
| Lighting | warm late-morning window backlight, soft ambient room fill |
| Color grade | neutral white balance, slightly muted, no Instagram filter |
| Materiality | ribbed ceramic mug, cable-knit cotton, raw oak windowsill |
| Mood | cozy, candid, unposed |
| Anti-AI cues | sensor grain, lens flare, asymmetric framing, hair flyaway, faint pores |

## Bad → good

**Bad** (model fills every gap with AI-glossy defaults):
> "candid iPhone selfie of brunette in cozy apartment holding latte, UGC TikTok aesthetic"

**Good** (directed):
> "Candid iPhone selfie of 28yo brunette, shoulder-length wavy hair, faint freckles. Oversized cream cable-knit sweater, ribbed ceramic mug of latte at chest. Sunlit Brooklyn apartment corner, exposed brick, fairy lights on the window frame behind. Medium close-up, 9:16, eyes upper third. Shot on iPhone 17 Pro Max (~26mm), f/1.8, slight hand motion blur. Warm window backlight, soft ambient fill. Neutral white balance, sensor grain, asymmetric framing, single hair flyaway, no makeup. Cozy, candid, unposed."

## Reference-image prompting (CRITICAL — fixes watermark/caption bleed)

When `image_input` is set, the model uses the reference as *every* signal —
subject, watermarks, captions, UI bars, original lighting, original framing
all bleed forward unless you tell it not to.

**Formula** — paste at the top of every reference-anchored prompt:

```
Use the reference image as the IDENTITY source only.
Keep: [face, hair color and length, skin tone, body proportions, age, distinctive features].
Ignore everything else from the reference — including any watermarks, text overlays, captions, logos, UI bars, original lighting, original background, and original framing.

Now place the same subject in: [fresh scene — full anatomy from above].
```

End with: `"No logos, no captions, no watermarks, clean frame."`

(Negative framing — "don't add a watermark" — doesn't work. Stating the desired clean state does.)

**Multi-reference** — name each, give it a role:
```
Use Image A as the IDENTITY source — keep face, hair, skin.
Use Image B as the STYLE source — match color grade, grain, lighting, but ignore its subject.
Use Image C as the BACKGROUND source — match environment, ignore people / text.
```

Pro tier of nano-banana takes up to 14 refs. Standard models: 1–3.

## Picking the model — enumerate, never assume

"Cheapest" / "fastest" / "best for X" are comparative claims. They need
**data**, not memory. Prices change weekly. Memorized prices go stale.

```bash
vsb models --modality image --json \
  | jq -r '.models[] | "\(.category)/\(.slug)"' \
  | while read s; do
      printf "%-50s " "$s"
      vsb pricing "$s" --json 2>/dev/null \
        | jq -r '.user_cost_estimate // "tiered(\(.tiers | length // 0))"'
    done | sort -k2 -n
```

Models with `user_cost_estimate: null` are **tiered** (cost depends on
quality/resolution input, e.g. `nano-banana-pro`, `gpt-image-2.5-flare`,
`gpt-image-2`). Don't drop
them — inspect `vsb pricing <slug> --json` to read the tier table and pick
the cheapest tier you can live with.

Cheapest row wins **only when the user asked for cheapest and the task is
simple**. Detail-critical work — legible in-image text (signs, tattoos,
posters, packaging), dense multi-element scenes, publishable ad creative,
precise multi-ref identity edits — skips the cheap rows entirely: go to
`image/nano-banana-pro` or `image/gpt-image-2.5-flare` (Flare at `xhigh` or
`max` when typography legibility is the single hardest constraint;
nano-banana-pro for photoreal scenes containing text or fine detail). One
premium run beats three cheap retries.

Then verify the pick supports refs:

```bash
vsb schema image/<slug> --json | jq '.inputs.image_input'
```

`null` → no reference editing. Bump up the ladder until you find one.

**CLI quirk — array inputs.** `image_input` is `array<string>`. Pass either
as repeated flags (`--image_input a --image_input b`) or as a JSON-array
string (`--image_input '["a","b"]'`). The CLI auto-wraps a single bare
string, but mixed forms with other agents may emit a single bare value —
use `vsb run <slug> --help` to confirm the array shape before composing
the command.

(Future: `vsb pricing --modality image --all` should ship as a built-in — see vsb CLI backlog.)

## Vocabulary banks (one-liners)

- **Cameras:** `Shot on iPhone 17 Pro Max` (UGC) · `Shot on Fujifilm X-T5, 35mm` (editorial) · `disposable film camera with flash` (raw nostalgic) · `RED cinema camera` (filmic) · `CCTV, fisheye` (found-footage)
- **Lenses / DoF:** `f/1.8 shallow DoF` · `wide-angle 24mm` · `macro` · `tilt-shift` · `telephoto 85mm compression` · `phone main lens ~26mm` (UGC default)
- **Lighting:** `three-point softbox` · `Rembrandt` · `rim-lit from behind, soft fill` · `golden hour backlight` · `blue hour ambient` · `neon magenta + cyan rim` · `harsh midday top-light` · `on-camera flash, slight overexposure` · `warm tungsten mixed with daylight window`
- **Color grades:** `muted teal-and-orange Hollywood grade` · `bleach-bypass, low-sat high-contrast` · `kodachrome warm cast` · `cool monochrome` · `neutral white balance, no filter` (UGC default — say it explicitly)
- **Materiality:** name fabrics + finishes. `chunky oatmeal wool scarf` > `scarf`. `brushed aluminum laptop` > `laptop`.
- **Anti-AI cues** (use 3–4 for UGC, skip for studio/commercial): `sensor grain` · `minor lens flare` · `asymmetric framing` · `single hair flyaway` · `faint pore detail` · `micro motion blur on hand` (selfie = handheld) · `no makeup` · `slight jpeg compression` · `no Instagram filter`

## Cross-links

- Model picker → [`vsb-image`](../vsb-image/SKILL.md)
- Nano Banana quirks (text rendering, 14-ref blend, known limits) → [`vsb-nano-banana`](../vsb-nano-banana/SKILL.md)
- UGC format (selfie POV / talking-head) → [`vsb-ugc-people`](../vsb-ugc-people/SKILL.md)
- Editing the same image twice or more → [`vsb-image-iteration`](../vsb-image-iteration/SKILL.md)
- Selection-chain + sandbox patterns → [`vsb`](../vsb/SKILL.md)

## Pre-flight checklist

Before `vsb run`:

1. Subject named (age / hair / skin / build)?
2. Camera + lens + light + grade picked?
3. Reference attached → keep/ignore preamble + clean-frame end line?
4. User said "cheapest"/"fastest" → enumerated, not assumed?

All four ✓ → run. Any ✗ → not ready.
