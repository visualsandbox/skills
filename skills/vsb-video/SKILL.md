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

Agents: don't block the conversation on a running job either — start it, keep talking, check later. Rules in [`vsb` → Background generations](../vsb/SKILL.md#background-generations-keep-the-conversation-free).

## The async + poll pattern

```bash
# 1. Submit
JOB=$(vsb run video/veo-3.1-fast \
  --prompt "a tiger walking through tall grass at golden hour, camera tracks alongside" \
  --aspect_ratio 16:9 \
  --duration 5 \
  --async --json | jq -r '.job_id')

echo "Job: $JOB"

# 2. Poll. status can be queued | in_progress | completed | failed | cancelled.
while true; do
  S=$(vsb status "$JOB" --json | jq -r '.status')
  echo "$S"
  [[ "$S" == "completed" || "$S" == "failed" || "$S" == "cancelled" ]] && break
  sleep 5
done

# 3. Fetch result + download in one call
vsb status "$JOB" --result --download "./out/{request_id}.{ext}" --json
```

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
