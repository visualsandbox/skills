---
name: vsb-video
renamed_from: video
description: >
  Generate or edit video with Visual Sandbox. Trigger when the user wants
  text-to-video, image-to-video, or motion-control video via the vsb CLI.
  Always uses async + status polling — video runs take 30s–3min. Verify slugs
  with `vsb models --modality video --json`.
---

# Video generation with vsb

> **On the MCP surface?** If the `visual-sandbox` MCP tools are in your
> tool list, use `generate` and `get_job` instead of the shell commands
> below. The model choice and the prompt craft on this page still apply.
> See [`vsb` → Two ways to run](../vsb/SKILL.md#two-ways-to-run-mcp-tools-or-the-cli).

Video runs are slow (30s–3min). **Always use `--async`**, then poll with `vsb status`. Don't block a sync `vsb run` on a 2-minute job — the CLI will sit there and re-poll, blowing your terminal session.

Agents: don't block the conversation on a running job either — start it, keep talking, check later. Put the blocking wait in a **background shell** (Claude Code: `run_in_background: true`) instead of a poll loop, so the harness notifies you when the job lands. Rules in [`vsb` → Background generations](../vsb/SKILL.md#background-generations-keep-the-conversation-free).

## The async + poll pattern

```bash
# 1. Submit
JOB=$(vsb run video/veo-3.1-fast \
  --prompt "a tiger walking through tall grass at golden hour, camera tracks alongside" \
  --aspect_ratio 16:9 \
  --duration 5 \
  --async --json | jq -r '.job_id')

echo "Job: $JOB"

# 2. Wait in a BACKGROUND shell — --result blocks until the job is terminal,
#    so the shell's exit is the "done" signal. No poll loop, no foreground sleep.
vsb status "$JOB" --result --download "./out/{request_id}.{ext}" --json > "/tmp/vsb-$JOB.json" 2>&1

# 3. On the notification, read /tmp/vsb-$JOB.json. Non-blocking peek any time:
vsb status "$JOB" --json | jq -r '.status'
```

Status can be `queued | in_progress | completed | failed | cancelled`. Open the
finished clip for the user with `open <file>` (the default player, not Preview
— Preview is for images, [vsb critical rule 12](../vsb/SKILL.md#critical-rules-read-first)).

`--download` only if the user opted into local saves — otherwise fetch with
`--result --json` alone and hand back the share page
`https://visualsandbox.com/share/<job_id>/`, never a raw CDN URL
([vsb critical rule 5](../vsb/SKILL.md#critical-rules-read-first)).

## Picking a model

Verify with `vsb models --modality video --json | jq '.models[] | {slug, category, owner}'`.

| Task | Default slug | Notes |
|------|--------------|-------|
| Cinematic text-to-video, top quality | `video/veo-3.1` | Google. ~60–180s wall time. Most expensive. Best motion + lighting. |
| Cinematic but cheaper / faster | `video/veo-3.1-fast` | Same model family, ~30–60s, ~half the cost. Default for most use. |
| Image-to-video with brush motion | `video/kling-v3-motion-control` | Kuaishou. Requires a seed image + a motion specification. Fine-grained control over what moves. |
| General-purpose, cheap | `video/seedance-2` | ByteDance. Solid quality, lower cost. |
| Same family, faster | `video/seedance-2-fast` | Lower quality but ~2× faster than `seedance-2`. |
| Cheapest Seedance, drafts and batches | `video/seedance-2.0-mini` | ByteDance. Same inputs as `seedance-2` at the lowest rate; 480p/720p only; one reference video + one reference audio. |
| Newest Seedance, many references | `video/seedance-2.5` | ByteDance. Up to 30 reference images, reference videos and audios as lists, native audio, `adaptive` aspect; 480p/720p only. |
| Everything in one endpoint, multi-shot, native audio | `video/kling-v3-omni-video` | Kuaishou. Text-to-video, start and end frames, up to 7 reference images, reference-video edit or style transfer, lip-synced audio, and up to 6 shots in one clip. 3–15s, `standard` 720p / `pro` 1080p / `4k`. Slow, about 3 minutes. |
| A portrait performs an audio file | `video/kling-avatar-v2` | Kuaishou. Audio-driven talking head. Feed one portrait plus one audio file and the face lip-syncs the whole clip. No prompt-driven motion. Output length matches the audio. `std` to iterate, `pro` for 1080p. |
| Cheapest in catalog, iterate fast | `video/p-video` | Pruna AI. Built-in `draft` toggle drops cost ~4× (~$0.005/s at 720p draft). Supports text, image, AND audio conditioning. Looser safety filter than Seedance. See [`vsb-p-video`](../vsb-p-video/SKILL.md). |

## Veo 3.1 (text-to-video, image-to-video)

```bash
# Text-to-video
JOB=$(vsb run video/veo-3.1-fast \
  --prompt "a hummingbird hovering near a red flower in slow motion, sunlight filtering through leaves" \
  --aspect_ratio 16:9 \
  --duration 5 \
  --async --json | jq -r '.job_id')

# Image-to-video — pass the still image to seed the first frame (verify the exact
# field name with `vsb schema video/<slug>`; currently `image` for veo + kling).
# IMPORTANT: always pass --aspect_ratio matching the source image. Most video
# models default to 16:9 and will silently crop/letterbox a portrait seed.
URL=$(vsb upload ./still.jpg --json | jq -r '.url')
JOB=$(vsb run video/veo-3.1-fast \
  --prompt "the woman turns her head and smiles" \
  --image "$URL" \
  --aspect_ratio 9:16 \
  --duration 5 \
  --async --json | jq -r '.job_id')
```

### Matching source aspect

When the seed comes from a sandbox node, read its aspect off the live canvas
instead of guessing — `vsb sandbox selection --json | jq -r '.nodes[0].generation.aspect_ratio'`
gives you `"9:16"`, `"16:9"`, `"1:1"`, etc. Pass that string straight into
`--aspect_ratio`. For an uploaded local file, use `sips -g pixelWidth -g pixelHeight ./still.jpg`
(macOS) or `identify -format "%wx%h" ./still.jpg` (ImageMagick) and pick the
nearest ratio in the model's `enum` (`vsb schema video/<slug> --json | jq '.inputs.aspect_ratio.enum'`).

Veo prompts work best when they describe **camera + subject + motion**. "Static
shot of a tiger" is a hint to keep the camera still; "tracking shot following
the tiger" implies movement.

## Kling motion control (image → video with directed motion)

```bash
URL=$(vsb upload ./portrait.jpg --json | jq -r '.url')
JOB=$(vsb run video/kling-v3-motion-control \
  --image "$URL" \
  --prompt "the wind blows her hair to the right" \
  --duration 5 \
  --async --json | jq -r '.job_id')
```

Run `vsb schema video/kling-v3-motion-control --json` first — it has
specific motion-control fields beyond `prompt`.

## Kling Avatar 2.0 (portrait + audio → talking head)

```bash
IMG=$(vsb upload ./host.jpg --json | jq -r '.url')
AUD=$(vsb upload ./line.mp3 --json | jq -r '.url')

JOB=$(vsb run video/kling-avatar-v2 \
  --image "$IMG" \
  --audio "$AUD" \
  --mode std \
  --async --json | jq -r '.job_id')
```

The audio drives the clip, so there is no `duration` and no `aspect_ratio`.
The output runs as long as the audio. The provider enforces the limits at
upload: the portrait is JPG or PNG under 10 MB, at least 300 px per side, with
an aspect ratio between 1:2.5 and 2.5:1; the audio is MP3, WAV, M4A, or AAC
under 5 MB. `--prompt` is optional and only nudges emotion or a small camera
move; leave it empty for a neutral read. `std` and `pro` share one engine, so
iterate on `std` and re-render the winner on `pro` with the same inputs.

Billing reserves credits for the audio's full duration up front, then refunds
the unused part when the clip finishes.

## Kling 3.0 Omni (references, reference video, multi-shot)

```bash
JOB=$(vsb run video/kling-v3-omni-video \
  --prompt "the woman in the first image walks into the cafe from the second image and orders" \
  --reference_images "[\"$URL1\",\"$URL2\"]" \
  --duration 10 \
  --mode pro \
  --generate_audio true \
  --aspect_ratio 16:9 \
  --async --json | jq -r '.job_id')
```

- Bind references by position in the prompt. Write "the first image", "the
  second image". Up to 7 references, or 4 when a reference video is attached.
- `--reference_video` has two modes. `--video_reference_type feature` rewrites
  the clip in place and keeps its motion and timing. `base` lifts the camera
  move and the look onto a new prompt-driven scene.
- Native audio turns off when a reference video is attached, because the
  reference supplies the track. `4k` does not accept a reference video.
- `--multi_prompt` scripts up to 6 shots in one clip, each with its own prompt
  and duration. Read `vsb schema video/kling-v3-omni-video --json` for its
  exact shape before you write one.
- `--generate_audio true` costs more per second than audio off. Iterate on
  `standard`, lock the take on `pro`, then re-render on `4k` unchanged.

## Cost estimation (do this BEFORE running)

```bash
vsb pricing video/veo-3.1-fast --json
# {
#   "slug": "video/veo-3.1-fast",
#   "currency": "USD",
#   "unit": "second",
#   "user_cost_estimate": 0.10,
#   ...
# }
```

Most video models are billed per *second of output*. A 5-second clip on
`veo-3.1-fast` at $0.10/s = $0.50. On `veo-3.1` standard, that doubles. Always
show the user the estimated cost before confirming.

## Cancelling

```bash
vsb status "$JOB" --cancel --json
```

Returns 1 if the job already finished. Clean exit code = clean cancel.

## Dialogue text rules (any model that speaks)

Applies to every prompt that contains spoken lines — Veo dialogue, P-Video
narration, Kling Avatar scripts, and any future speech model.

- **Never put an em dash (—) or en dash (–) in dialogue text.** Speech
  synthesis vocalizes dashes unpredictably — a dramatic pause at best,
  hallucinated words at worst (a real run turned `"Visual Sandbox —"` into
  audio that transcribes back as "Visual Sandbox 1008"). Use a comma, a
  period, or an ellipsis `...` for the same beat.
- Punctuation the models handle reliably: `, . ? ! ...`
- Keep the rule for the *dialogue string only* — dashes in the visual
  description parts of the prompt are fine.

## Common gotchas

- **Status can stay at `queued` for 30+ seconds** before flipping to `in_progress`. That's the provider queue, not your CLI hanging.
- **`progress` can be `null` even mid-run** — not all providers report it.
- **Some video models reject aspect ratios you'd expect to work.** Check `vsb schema video/<slug> --json | jq '.inputs.aspect_ratio.enum'` to see the allowed list.
- **Default aspect is 16:9 on veo + seedance.** Image-to-video runs that omit `--aspect_ratio` silently crop or letterbox a 9:16 / 1:1 seed. Always pass the aspect that matches the source image (see "Matching source aspect" above).
- **Result `urls` may be a single-element array** — extract index 0 if you need a single URL.
- **Don't poll faster than every 3–5 seconds.** The async runner backoffs internally; tight client loops just waste API quota.
