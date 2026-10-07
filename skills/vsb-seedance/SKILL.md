---
name: vsb-seedance
description: >
  Run the ByteDance Seedance family in Visual Sandbox well: `video/seedance-2.5`
  (up to 30 reference images, reference video and audio lists), `video/seedance-2`
  (1080p and 4K), `video/seedance-2-fast`, and `video/seedance-2.0-mini`.
  Trigger whenever the user is about to call `vsb run video/seedance-*`, names
  Seedance, or asks for reference-driven video: a cast held across shots, a
  motion copied from a clip, a voice from an audio file, a first and last frame,
  a video edit, or a video extension. Covers the flags, the reference numbering,
  the locked aspect and duration rules per task, the price jump for a reference
  video, and the safety filter. Prompt craft lives in
  [`vsb-seedance-prompting`](../vsb-seedance-prompting/SKILL.md). Pairs with
  [`vsb-video`](../vsb-video/SKILL.md) for the async + poll pattern.
license: Proprietary. See LICENSE for the terms.
---

# Seedance (ByteDance)

Four slugs share one input shape. Read the parent
[`vsb-video`](../vsb-video/SKILL.md) first for async + poll + cancel. Read
[`vsb-seedance-prompting`](../vsb-seedance-prompting/SKILL.md) before you write
the prompt. This page only adds what is specific to Seedance.

Verify the live schema and price before you assume anything:

```bash
vsb schema video/seedance-2.5 --json
vsb pricing video/seedance-2.5 --json
```

## Pick a tier

| Slug | Pick it for | Resolution | Duration | Aspect |
|------|-------------|------------|----------|--------|
| `video/seedance-2.5` | Hero shots, many references, native audio, clips up to 30 s. The slowest model in the catalog: about 4 minutes for a short clip, longer for a long one. | 480p, 720p | -1, 4 to 30 | 16:9, 4:3, 1:1, 3:4, 9:16, 21:9, adaptive |
| `video/seedance-2` | 1080p or 4K output | 480p to 4K | -1, 4 to 15 | adds 9:21 |
| `video/seedance-2-fast` | Same inputs as `seedance-2`, faster and cheaper, 720p cap | 480p, 720p | -1, 4 to 15 | adds 9:21 |
| `video/seedance-2.0-mini` | Drafts and batches at the lowest rate. One reference video and one reference audio only. No adaptive. | 480p, 720p | 4 to 12 | no adaptive |

Iterate on Mini or Fast. Finish the chosen shot on 2.5, or on 2 when the
delivery needs 1080p or 4K.

## Inputs

Every tier takes the same fields:

| Field | What it is |
|-------|------------|
| `prompt` | Required. Put spoken lines in double quotes. |
| `image` | First frame. Pins the opening picture. |
| `last_frame_image` | Last frame. Needs `image`. Same aspect as `image`. |
| `reference_images` | JSON list of URLs. 2.5 takes up to 30, the 2.0 family fewer. Cast, wardrobe, product, set, style. |
| `reference_videos` | JSON list of URLs. Motion, camera, pacing, the clip to edit or extend. Raises the price. |
| `reference_audios` | JSON list of URLs. Voice timbre, dialogue, music, ambience. |
| `generate_audio` | Default `true`. Turn off for a silent shot. |
| `aspect_ratio`, `resolution`, `duration`, `seed` | Per tier, see the table above. |

Lists go in as JSON strings. Upload local files first; `vsb upload` accepts
image, video and audio.

```bash
CAST=$(vsb upload ./cast.jpg --json | jq -r '.url')
SET=$(vsb upload ./set.jpg --json | jq -r '.url')
MOVE=$(vsb upload ./move.mp4 --json | jq -r '.url')

JOB=$(vsb run video/seedance-2.5 \
  --prompt "$(cat prompt.txt)" \
  --reference_images "[\"$CAST\",\"$SET\"]" \
  --reference_videos "[\"$MOVE\"]" \
  --aspect_ratio 16:9 \
  --resolution 720p \
  --duration 8 \
  --async --json | jq -r '.job_id')
```

## Reference numbering

The prompt binds each asset by its position in its list. The first URL in
`reference_images` is `[Image1]`, the second is `[Image2]`. The first URL in
`reference_videos` is `[Video1]`. The first URL in `reference_audios` is
`[Audio1]`. Each list counts on its own.

`image` and `last_frame_image` are not in those lists. Do not number them.
The model pins them as the first and last frame from the field alone.

Write the binding in the prompt for every asset you attach. An asset with no
line in the prompt is a gamble on what the model takes from it.

## Locked parameters per task

The task decides which flags you still control. Get this wrong and the run
comes back cropped, stretched, or the wrong length.

| Task | How to run it | Aspect | Duration |
|------|---------------|--------|----------|
| Text or reference to video | prompt, optional reference lists | Free | Free |
| First frame, or first and last frame | `--image`, optional `--last_frame_image` | `adaptive`. The first frame sets the shape. Both frames must share one aspect or the last frame stretches. | Free |
| Edit a video | the clip in `reference_videos`, an edit verb in the prompt: add, remove, replace, modify, change to | `adaptive` | `-1`. The output matches the source length. Not on Mini, which has no `-1`. |
| Extend a video | the clip in `reference_videos`, an extend verb in the prompt: extend forward, extend backward, continue | `adaptive` | The length of the new segment. The output is the new segment only; join it to the source in an editor. |

A reference video with no edit or extend verb is a reference task. The model
takes motion, camera or pacing from it and generates a new picture at the
aspect and duration you set.

## Price

Billed per second of output. Two things move the rate: resolution, and
whether `reference_videos` is set. On 2.5 a reference video roughly
quadruples the per-second price. Read the live table, then tell the user the
number before you run:

```bash
vsb pricing video/seedance-2.5 --json
```

Start at 480p and 5 seconds while the prompt is still moving. Raise
resolution and duration once the take reads right, with the same `--seed`.

`-1` (Auto) is quoted at 30 seconds up front, because the model picks the
length and the credit gate cannot know it. The bill is repriced to the
delivered length when the clip lands. Tell the user the quote is a ceiling.

## Worked examples

All examples use `--async` and the poll pattern from
[`vsb-video`](../vsb-video/SKILL.md).

### First and last frame

```bash
A=$(vsb upload ./start.jpg --json | jq -r '.url')
B=$(vsb upload ./end.jpg --json | jq -r '.url')
JOB=$(vsb run video/seedance-2.5 \
  --prompt "The decorator rotates the turntable and pipes cream along both tiers, then moves both hands away from the cake." \
  --image "$A" --last_frame_image "$B" \
  --aspect_ratio adaptive --duration 6 \
  --async --json | jq -r '.job_id')
```

### Lip-sync a portrait to a recording

A photoreal face is refused unless the person is an AI-made character and you
pass `--ai_character true` (see Gotchas). For a real person, use
the paths in [`vsb-video` → People who talk](../vsb-video/SKILL.md#people-who-talk-pick-the-sound-path-before-you-spend).

```bash
FACE=$(vsb upload ./host.jpg --json | jq -r '.url')
LINE=$(vsb upload ./line.mp3 --json | jq -r '.url')
JOB=$(vsb run video/seedance-2.5 \
  --prompt "Use [Image1] for the host's face, hair and jacket; do not use the image background. Use [Audio1] as the spoken line; do not generate new dialogue. Locked-off medium shot, no camera movement. The host looks into the camera and delivers [Audio1] with small natural gestures." \
  --reference_images "[\"$FACE\"]" --reference_audios "[\"$LINE\"]" \
  --aspect_ratio 9:16 --duration 8 \
  --async --json | jq -r '.job_id')
```

### One realistic AI character across shots

Seedance refuses a photoreal face unless `--ai_character true` is on. Use this
recipe only for a character that an image model made. Ask the user to confirm
that the person is AI-made and that they hold the rights, before the first
run. Never use it with a photo of a real person.

1. Make the face. Load [`vsb-image-prompting`](../vsb-image-prompting/SKILL.md)
   first. A front-facing head-and-shoulders portrait, even light, plain
   background.
2. Make a full-body shot of the same character from the face, in the outfit
   the scenes need. Put the face in `--image_input`.
3. Run Seedance with both images as references and the flag on. Do not set
   `--image`: with the flag on, a first frame guides the face only.
4. For the next shot, keep the same two references and the same words for the
   character. Change only the action, the place and the camera.

```bash
FACE=$(vsb run image/gpt-image-2.5-flare --quality high --aspect_ratio 3:4 \
  --prompt "Photorealistic studio portrait of a woman in her late twenties, shoulder-length dark wavy hair, natural skin texture, navy t-shirt, front-facing head and shoulders, soft even light, plain light-grey background." \
  --json | jq -r '.result.urls[0]')
BODY=$(vsb run image/gpt-image-2.5-flare --quality high --aspect_ratio 9:16 \
  --image_input "[\"$FACE\"]" \
  --prompt "The same woman from the reference, full body, standing, front view, navy t-shirt, mid-blue jeans, white sneakers, plain light-grey background, photorealistic studio photo." \
  --json | jq -r '.result.urls[0]')
JOB=$(vsb run video/seedance-2.5 \
  --prompt "Use [Image1] for the woman's face and hair, and [Image2] for her body and outfit. She walks toward the camera on a sunny city street and smiles. Tracking shot at eye level." \
  --reference_images "[\"$FACE\", \"$BODY\"]" --ai_character true \
  --resolution 480p --duration 5 --aspect_ratio 16:9 \
  --async --json | jq -r '.job_id')
```

What the tests showed (2026-10-07, Seedance 2.5): without the flag, the
portrait and every character sheet with a face were refused on both
providers. A sheet with no face passed, but the model made up a new face. With
the flag, the portrait passed as a reference and as a start frame, and the
face matched in every frame.

### Edit a clip

```bash
CLIP=$(vsb upload ./ad.mp4 --json | jq -r '.url')
JAR=$(vsb upload ./cream.jpg --json | jq -r '.url')
JOB=$(vsb run video/seedance-2.5 \
  --prompt "Edit [Video1]: replace the perfume bottle with the face cream jar from [Image1]. Keep all original motion, camera work, lighting and audio. Except for the jar, every visible person, prop and background element in [Video1] remains unchanged." \
  --reference_videos "[\"$CLIP\"]" --reference_images "[\"$JAR\"]" \
  --aspect_ratio adaptive --duration -1 \
  --async --json | jq -r '.job_id')
```

### Extend a clip forward

```bash
JOB=$(vsb run video/seedance-2.5 \
  --prompt "Extend [Video1] forward. The first frame of the new segment continues from the last frame of [Video1]: same bee, same flower, same camera height, same light. Then the bee lifts off and the camera follows it to a second flower of the same kind." \
  --reference_videos "[\"$CLIP\"]" \
  --aspect_ratio adaptive --duration 5 \
  --async --json | jq -r '.job_id')
```

## Gotchas

- **Safety filter (E005).** Seedance refuses "drone" and "FPV" wording; write
  "aerial flythrough". On `"Your input was flagged by the model's safety
  filter"`, retry the same inputs on `video/p-video` before you rewrite the
  prompt.
- **Photoreal faces are refused, unless `--ai_character true`.** ByteDance's
  real-face detector rejects any `image` or reference with a photoreal face,
  AI-generated faces included: "flagged as sensitive" on Replicate, "may
  contain real person" on Cloudflare. Character sheets with a face are refused
  too. A still with no face passes, but the model then invents the face.
  `--ai_character true` sends the images through ByteDance's virtual avatar
  library on Cloudflare, and a realistic AI face then passes and stays the
  same. It is a promise that every person in the images is AI-made and that
  the user holds the rights: never set it for a photo of a real person, and
  ask the user before you set it. With it on, `image` guides the face only and
  does not fix the opening shot, and Seedance 2.0 and 2.0 Fast cap at
  12 s. For
  people who talk, read [`vsb-video` → People who talk](../vsb-video/SKILL.md#people-who-talk-pick-the-sound-path-before-you-spend).
- **A first frame excludes every reference list (E006).** `image` and
  `last_frame_image` cannot go with `reference_images`, `reference_videos` or
  `reference_audios`. Pick one mode.
- **`reference_audios` needs a reference image or video.** It takes up to 10
  clips and 30 s in total on 2.5, and 3 clips and 15 s on 2.0. It is the
  lip-sync input, so it works only in reference mode.
- **`use_virtual_avatar`** on the Cloudflare copy of Seedance is the input
  behind `--ai_character`. Use the flag; there is no second input to set.
- **Subtitles appear uninvited,** more often in portrait. Add "No subtitles."
  to every prompt that does not want them. Strip text from reference assets
  first.
- **Multi-view character sheets** are fine on 2.5 and harmful on the 2.0
  family, where the model reads the views as several people. On 2.0 send one
  headshot plus one full-body photo.
- **Join seams on extensions.** Expect a small jump at the join. Trim about
  6 frames off the end of the source and 1 frame off the start of the new
  segment when you cut them together.
- **`adaptive` is not on Mini.** Match the source aspect by hand there.
- **The wait is real.** 2.5 runs about four minutes for a short clip and
  longer at 12 s. Say so before the user starts to watch the spinner.
