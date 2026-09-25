---
name: vsb-p-video
renamed_from: p-video
description: >
  Prompt and run Pruna AI's P-Video family well. `video/p-video` is the
  cheapest video model in Visual Sandbox, with a built-in `draft` toggle that
  drops cost ~4×, and two newer tiers sit above it. Trigger whenever the user
  is about to call `vsb run video/p-video*` or asks "cheapest video model",
  "draft video", "iterate fast", or "lots of video variations". Always ask the
  user **draft or standard** before running.
  Pairs with the parent [`vsb-video`](../vsb-video/SKILL.md) skill for the async +
  poll pattern.
license: Proprietary. See LICENSE for the terms.
---

# P-Video (Pruna AI)

Cheapest video model in the catalog. Fast iteration. Two-mode runtime via the
`draft` boolean — flip it on for previews, off when you're locking the shot.

## Which P-Video tier

Three generation tiers now share this family. Price alone no longer picks one.

| Pick | When |
|---|---|
| `video/p-video` | Bulk prompt exploration. Its draft rate is still the lowest in the whole catalog. No audio of any kind. |
| `video/p-video-2` | The clip has to talk, or needs 1080p, 48 fps, a last frame, or a run past 15s. It writes native speech with lip-sync from dialogue in the prompt, and also takes an audio track to drive motion. |
| `video/p-video-2-pro` | The best Pruna picture, and the lowest rate per second of the three at 480p. Silent: no audio in, no audio out, and 768p is the ceiling. |

Three more slugs in the family transform a clip you already have rather than
generate one, and they are covered in [`vsb-video`](../vsb-video/SKILL.md):
`video/p-video-edit`, `video/p-video-replace`, `video/p-video-animate`, plus
`video/p-video-avatar` for a photo that speaks a typed script.

Read the parent [`vsb-video`](../vsb-video/SKILL.md) skill first for the universal
async + poll + cancel pattern. This skill only adds p-video–specific behavior.

Prompt craft — slot formula, narration pattern, DO/DON'T — lives in the
sibling [`vsb-p-video-prompting`](../vsb-p-video-prompting/SKILL.md) skill. Load it
before writing any prompt.

Verify the live schema before assuming fields:

```bash
vsb schema video/p-video --json
vsb pricing video/p-video --json
```

## Always ask first: draft or standard?

Before running, ask the user which mode they want. Don't guess.

```
Draft (cheap, fast — for iteration) or standard (final-quality render)?
```

| Mode | `--draft` | 720p | 1080p | When to pick |
|------|-----------|------|-------|--------------|
| **Draft**    | `true`  | $0.00625/s | $0.0125/s | Trying out a prompt. Exploring 5–10 variations. Storyboards. Anything you'd re-run. |
| **Standard** | `false` | $0.025/s   | $0.05/s   | Locking the final shot. Delivering to client. The shot you'll post. |

A 5s 720p draft ≈ $0.03. The same shot at standard = $0.125 (4×). Use draft
to land the prompt + composition, then run **the exact same args with
`--draft false`** once to lock the final.

## Pricing reference

What you pay (verify live with `vsb pricing video/p-video --json`):

| Resolution | Mode | $/s |
|------------|------|-----|
| 720p  | draft on  | $0.00625 |
| 720p  | draft off | $0.025   |
| 1080p | draft on  | $0.0125  |
| 1080p | draft off | $0.05    |

Per-second billing. `--duration` is integer 1–10 (default 5).

## Input modes

P-Video accepts three independent conditioning signals — combine freely.

| Field | Meaning |
|-------|---------|
| `prompt` | Required. Scene + motion description. |
| `image` | Optional first-frame for image-to-video. |
| `audio` | Optional audio track — motion syncs to the sound. Useful for music videos and lip-sync-ish work. |

Pass `image` and/or `audio` only when you actually want that conditioning.
With no image, it's text-to-video. With one, it's image-to-video. With audio,
the model tries to match motion to the audio's tempo / dynamics.

Other knobs:

- `aspect_ratio`: `16:9, 9:16, 4:3, 3:4, 3:2, 2:3, 1:1` (default `16:9`).
  Match the source image when seeding — most video models silently crop
  mismatched aspects (see parent [`vsb-video`](../vsb-video/SKILL.md) skill).
- `resolution`: `720p | 1080p` (default `720p`).
- `fps`: `24 | 48` (default `24`). Bump to 48 only for high-motion shots
  that need slow-mo or smooth pans — 24fps is the default cinematic feel.
- `prompt_upsampling`: bool, default `true`. Let the model rewrite the
  prompt internally for better adherence. Leave on unless you have a very
  specific phrasing you need preserved verbatim.
- `seed`: optional int, for reproducibility across runs.

## Why pick p-video over seedance / veo / kling

- **Cheapest path to a watchable video** — draft 720p at $0.005/s is ~16×
  cheaper than veo-3.1, ~5× cheaper than seedance-2.
- **Looser content moderation than ByteDance** — observed in practice:
  prompts / images that trip Seedance's safety filter (anything human-subject
  + selfie-style) often go through on p-video. If a Seedance run returns
  `"Your input was flagged by the model's safety filter"`, re-try the same
  inputs on p-video before rewriting the prompt.
- **Direct draft/standard toggle in one slug** — no need to swap models
  between fast and final passes; same UUID, same schema, just flip the
  bool.

Reach for veo-3.1 when you need top-tier motion + lighting realism, kling
for brush-style motion control, seedance for ByteDance's particular video
aesthetic.

## Worked examples

All examples use `--async` + status poll — video runs take 30s–3min. See
[`vsb-video`](../vsb-video/SKILL.md) for the polling helper.

### Text-to-video, draft (iteration)

```bash
JOB=$(vsb run video/p-video \
  --prompt "A street vendor in Bangkok grilling skewers under a neon sign, smoke curling up, slow camera push-in" \
  --aspect_ratio 16:9 \
  --resolution 720p \
  --duration 5 \
  --draft true \
  --async --json | jq -r '.job_id')
```

### Same shot, locked in (standard)

```bash
JOB=$(vsb run video/p-video \
  --prompt "A street vendor in Bangkok grilling skewers under a neon sign, smoke curling up, slow camera push-in" \
  --aspect_ratio 16:9 \
  --resolution 720p \
  --duration 5 \
  --draft false \
  --async --json | jq -r '.job_id')
```

Identical args, only `--draft` flipped. Use the same `--seed` across both
runs if you want the standard render to match the draft composition.

### Image-to-video (first-frame seed)

```bash
URL=$(vsb upload ./still.jpg --json | jq -r '.url')
JOB=$(vsb run video/p-video \
  --prompt "She holds the phone steady, mouths a few words, free hand finishes tucking hair behind ear" \
  --image "$URL" \
  --aspect_ratio 9:16 \
  --resolution 720p \
  --duration 4 \
  --draft true \
  --async --json | jq -r '.job_id')
```

Always pass `--aspect_ratio` matching the source image. P-Video defaults
to `16:9` and will crop a 9:16 selfie if you forget.

### Audio-conditioned (motion to sound)

```bash
URL=$(vsb upload ./still.jpg --json | jq -r '.url')
AUDIO=$(vsb upload ./beat.mp3 --json | jq -r '.url')
JOB=$(vsb run video/p-video \
  --prompt "Subject dances in place, gentle body sway, head bobs to the beat" \
  --image "$URL" \
  --audio "$AUDIO" \
  --aspect_ratio 9:16 \
  --duration 6 \
  --draft true \
  --async --json | jq -r '.job_id')
```

## Quirks

- **`default_cost_unit` reports `"image"` in the registry** — ignore it.
  P-Video bills per *second*, like every other video model. Trust the
  pricing tiers, not the unit field.
- **`prompt_upsampling: true` is the default** — if a prompt you wrote is
  being ignored or rewritten, pass `--prompt_upsampling false` to force
  literal interpretation.
- **`duration` is integer, not float.** Enum is `1..10`.
- **`fps: 48` is for slow-mo / smooth motion only.** Most UGC and
  cinematic work stays at 24.
