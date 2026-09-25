---
name: vsb-p-video-prompting
renamed_from: p-video-prompting
description: >
  Canonical prompt-craft skill for Pruna AI's P-Video family in Visual
  Sandbox: `video/p-video`, `video/p-video-2` and `video/p-video-2-pro`. Read
  before writing any `vsb run video/p-video*` prompt — text-to-video,
  image-to-video, or audio-conditioned. Covers the official
  Pruna slot formula (Subject / Action / Scene / Camera / Lighting / Style /
  Audio), the image-to-video narration pattern for talking avatars, the
  DO/DON'T list straight from Pruna's docs, and the `prompt_upsampling`
  override rule. Pairs with [`vsb-p-video`](../vsb-p-video/SKILL.md) for runtime
  (draft toggle, pricing, schema, async + poll).
license: Proprietary. See LICENSE for the terms.
---

# P-Video prompting

Prompt craft only. For runtime, pricing, draft toggle, async + poll, read
[`vsb-p-video`](../vsb-p-video/SKILL.md) first. For universal video knobs (aspect,
duration, fps), read [`vsb-video`](../vsb-video/SKILL.md).

The slot formula below carries across all three generation tiers. Three
differences matter when you write for the newer two:

- **`video/p-video-2` speaks.** Write the dialogue into the prompt, in quotation
  marks, keep `save_audio` on, and attach no audio file. It generates the speech
  with matched lip movement. `video/p-video` has no native audio at all.
- **Both newer tiers take a `last_frame_image`.** Describe the motion that has to
  land on it, not just the opening.
- **`video/p-video-2-pro` renames the knob.** Its control is `prompt_upsampler`
  with `off`, `turbo` or `max`, not the boolean `prompt_upsampling` the other two
  carry. `video/p-video-2-pro` is silent, so leave the Audio slot out of its
  prompts entirely.

## Universal rules

1. **Describe motion, not stills.** "Waves crashing against rocky shore" ✓. "A rocky shore with waves" ✗.
2. **Dynamic verbs.** running, soaring, dancing, transforming, colliding. Skip "is moving", "was walking" — passive voice flattens motion.
3. **Direct language, not commands.** "Camera slowly pans across serene lake at sunset" ✓. "Please create a video of a lake" ✗.
4. **Specify timing.** slow-mo / gradually / building to crescendo / quick burst — pacing is half the shot.
5. **Atmosphere matters.** "Misty morning with soft diffused light" reads better than "morning scene".
6. **Iterate with `draft: true`.** Don't one-shot in standard mode. Land phrasing cheap, lock with `draft: false` + same seed.

## Pruna's official prompt formula

```
[Subject] [Action] [Scene] [Camera] [Lighting] [Style] [Audio]
```

First three required. Last four optional but lift quality fast. Pruna's own basic example:

> Knitted purple prune character, reading a book, cozy room, static camera, warm natural light, documentary style, character reading aloud: "P-Video generates state-of-the-art AI video in seconds."

Same shot, advanced (richer per-slot):

> Cinematic shot of a knitted purple prune character, dancing joyfully through a large pink and purple room, camera starting in front then circling and ending behind the character showing a race car, warm golden hour lighting creating soft illumination, cinematic animation style.

## Slot cheat sheet

| Slot | What to include | Strong values |
|------|-----------------|---------------|
| **Subject** | age, gender, clothing, features, posture (human) / breed, size, color, behavior (animal) / material, dimensions, condition (object) | "28yo brunette with shoulder-length wavy hair", "knitted purple prune character with white eyes" |
| **Action** | motion verb + tempo + direction + intensity + continuity | "running gradually building to a sprint, from left to right", "wakes up, then puts on glasses, then drinks coffee" |
| **Scene** | location + spatial elements + weather/time + depth | "intimate cozy room with wooden floor and window, warm afternoon", "vast neon-lit Tokyo crosswalk at midnight, light rain" |
| **Camera** | tracking / orbital / zoom / pan / tilt / aerial / handheld + speed | "tracking shot following cyclist", "slow push-in", "orbiting circling around subject", "handheld documentary shake" |
| **Lighting** | source + quality + direction + shadows + atmosphere | "warm golden hour backlight, soft shadows", "neon magenta and cyan rim, harsh contrast", "candlelight, dramatic flicker" |
| **Style** | medium + aesthetic + mood | "photorealistic cinematic", "anime cel-shaded", "documentary style realism", "3D rendered whimsical" |
| **Audio** | dialogue / music / SFX | `character reading aloud: "..."` / `upbeat electronic music` / `footsteps, ambient room tone` |

## DO / DON'T (from Pruna docs)

| ✅ DO | ❌ DON'T |
|------|---------|
| Descriptive, direct: "Camera slowly panning across a serene lake at sunset" | Command style: "Please create a video of a lake at sunset" |
| Motion focus: "Waves crashing against rocky shore with dramatic motion" | Static description: "A rocky shore with waves" |
| Specific timing: "Slow motion of water droplets splashing" | Ignore pacing: "Water splashing" |
| Include camera: "Tracking shot following the cyclist down the winding road" | Omit camera: "Cyclist on a road" |
| Dynamic verbs: running, flying, swimming, dancing | Passive: "A person who is moving" |
| Temporal: "Gradually, slowly, quickly, building to crescendo" | Ambiguous: "Scene changes" |
| Atmospheric: "Misty morning with soft diffused light" | Bare: "Morning scene" |

## Image-to-video — narration pattern for talking avatars

P-Video's strongest use case is image-to-video with audio. Pruna's own demos
follow this exact shape:

```
[Subject motion]. [Optional camera]. [Voice descriptor] says: "[Quoted dialogue]".
```

Real examples from Pruna's site:

> The woman in the photo moves naturally. She says: "Find the house that's perfect for you, and your family."

> The camera pans from left to right. A heavy, deep male voice says: "Motorcycles! Faster than ever before!"

> The man says: "You! Join the fight!" and he points to the screen.

Pattern parts:
- **Explicit motion** — "moves naturally", "looks at camera", "points to the screen". Don't assume the model fills idle frames; tell it.
- **Optional camera move** — "camera pans left to right", "slow push-in".
- **Voice descriptor** (optional) — "heavy deep male voice", "soft feminine voice", "kid's voice". Drives audio synthesis tone.
- **Quoted dialogue** — exact double-quoted string. Drives lip-sync. Never
  use em/en dashes (— –) inside it: speech synthesis vocalizes them as odd
  pauses or hallucinated words. Use a comma, period, or `...` instead (see
  the dialogue text rules in [`vsb-video`](../vsb-video/SKILL.md)).

## Audio block — three modes

P-Video's `audio` slot in the prompt drives native audio generation. Three patterns:

```
character reading aloud: "P-Video generates ten seconds of video in ten seconds for only ten cents."
```
```
upbeat electronic music, 120 BPM, building to drop
```
```
footsteps on wet pavement, distant traffic, ambient room tone
```

For premium dialogue / music, generate externally and pass via `--audio <url>` instead — P-Video's SFX synthesis is weak; the audio-input path is the workaround Pruna's docs explicitly recommend.

## prompt_upsampling — when to turn off

Default `prompt_upsampling: true`. The model rewrites your prompt internally for stronger adherence. Helpful for short prompts; harmful when:

- Lip-sync requires verbatim phrasing ("X says: '...'") — upsampling can rewrite the quoted line.
- Brand names / product names / unusual proper nouns — get paraphrased away.
- You spent five drafts dialing in a sentence and want it preserved.

`--prompt_upsampling false` to force literal interpretation.

## Bad → good

**Bad** (passive, no camera, no atmosphere):
> "person walks in city, talks to camera"

**Good** (slot formula filled):
> Young man in dark gray hoodie walking briskly down a rain-slick Tokyo alley at night, looking over his shoulder twice then directly into the camera. Camera tracks behind him at chest height, gentle handheld sway. Neon magenta and cyan reflections on wet asphalt, harsh rim light from a vending machine. Cinematic documentary style, slight film grain. Subject says: "I'm telling you — they're already here."

## Iteration discipline

Don't burn standard credits on prompt exploration. Cheap loop:

1. `draft: true`, short `duration: 3` — test motion idea, scene composition, camera move.
2. Vary one slot per turn. Compound edits drift like image models, only worse.
3. When the draft reads right, lock the `seed`.
4. Re-run **identical args** with `draft: false` and full `duration` for final.

A 5s 720p draft = $0.025. Standard = $0.10. Affording 10–15 draft variations costs less than two standard runs.

## Cross-links

- Runtime, draft toggle, pricing, schema → [`vsb-p-video`](../vsb-p-video/SKILL.md)
- Universal video patterns (async + poll, aspect-ratio cropping) → [`vsb-video`](../vsb-video/SKILL.md)
- For text-only video (no audio), other models may fit better — model picker is in [`vsb-video`](../vsb-video/SKILL.md)

## Pre-flight checklist

Before `vsb run video/p-video`:

1. Subject, action, scene all named? (Required three.)
2. Action uses a dynamic verb, not passive voice?
3. Camera move stated (even "static camera")?
4. For talking avatar: image attached + `aspect_ratio` matches image + quoted dialogue + voice descriptor?
5. `draft: true` for first 3+ runs?
6. `prompt_upsampling: false` if the dialogue must stay verbatim?
7. No em/en dashes inside the quoted dialogue? (Speech synthesis mangles them.)

All ✓ → run. Any ✗ → not ready.
