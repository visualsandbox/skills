---
name: vsb-audio
renamed_from: audio
description: >
  Generate sound effects (and, in v0.2, speech + music) via Visual Sandbox.
  Trigger when the user wants short SFX, ambient audio, or voice generation
  via the vsb CLI. Async — use `vsb run audio/<slug> --async` then poll with
  `vsb status`.
---

# Audio generation with vsb

> **On the MCP surface?** If the `visual-sandbox` MCP tools are in your
> tool list, use `generate` and `get_job` instead of the shell commands
> below. The model choice and the prompt craft on this page still apply.
> See [`vsb` → Two ways to run](../vsb/SKILL.md#two-ways-to-run-mcp-tools-or-the-cli).

Audio runs are async. Submit with `--async`, poll with `vsb status`. Most
sound-effect generations finish in 5–30 seconds.

## What's live in v0.1

| Task | Slug | Notes |
|------|------|-------|
| Sound effects (1–22s clips) | `audio/elevenlabs-sound-fx` | ElevenLabs. Prompt-driven. Best for foley, ambient, transitions, UI sounds. |

(Verify the live catalog with `vsb models --modality audio --json` before
trusting this list — TTS and music models are tracked for v0.2.)

## ElevenLabs Sound FX

```bash
JOB=$(vsb run audio/elevenlabs-sound-fx \
  --text "footsteps on wet pavement at night, slow walk, distant traffic" \
  --duration_seconds 8 \
  --async --json | jq -r '.job_id')

# Poll
while true; do
  S=$(vsb status "$JOB" --json | jq -r '.status')
  echo "$S"
  [[ "$S" == "completed" || "$S" == "failed" || "$S" == "cancelled" ]] && break
  sleep 3
done

vsb status "$JOB" --result --download "./out/{request_id}.mp3" --json
```

`--download` only if the user opted into local saves — otherwise fetch with
`--result --json` alone and hand back the share page
`https://visualsandbox.com/share/<job_id>/`, never a raw CDN URL
([vsb critical rule 5](../vsb/SKILL.md#critical-rules-read-first)).

Run `vsb schema audio/elevenlabs-sound-fx --json` to see the exact field
names — the `text` and `duration_seconds` keys above are subject to schema
changes.

## Prompt patterns for SFX

ElevenLabs SFX is **descriptive**, not generative-music. It works best with
clear sensory descriptions:

- Good: "heavy wooden door creaking open, then slamming shut"
- Good: "thunder rumbling in the distance, light rain on a tin roof"
- Bad: "scary music" → use a music model in v0.2 instead
- Bad: "happy" → too abstract, the model won't know what *sounds* happy

Specify **duration** explicitly when you can — generic SFX defaults to short
clips (~3s) and may truncate.

## Cost estimation

```bash
vsb pricing audio/elevenlabs-sound-fx --json
```

ElevenLabs SFX is billed per second of output. An 8-second clip at the
typical rate is fractions of a cent.

## Common gotchas

- **`text` (not `prompt`)** — ElevenLabs uses the `text` field name. Run
  `vsb schema` to confirm before guessing.
- **Output is `.mp3`** by default — set the download template extension
  accordingly: `--download "./out/{request_id}.mp3"`.
- **Duration caps at 22 seconds.** Longer requests get clipped server-side.
- **TTS / music models are not yet exposed in v0.1.** Don't promise the user
  speech generation through `vsb` until they show up in
  `vsb models --modality audio --json`.
- **No em/en dashes (— –) in any text a model will speak.** Speech synthesis
  vocalizes dashes unpredictably (odd pauses, hallucinated words). Use a
  comma, period, or `...` — full rule in the dialogue section of
  [`vsb-video`](../vsb-video/SKILL.md).
