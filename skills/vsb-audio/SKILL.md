---
name: vsb-audio
renamed_from: audio
description: >
  Generate sound effects and full music tracks via Visual Sandbox.
  Trigger when the user wants short SFX, ambient audio, background
  music, a soundtrack, or voice generation via the vsb CLI. SFX runs
  are quick; music scales with track length. Submit with `--async`
  then poll with `vsb status` for anything long.
---

# Audio generation with vsb

> **On the MCP surface?** If the `visual-sandbox` MCP tools are in your
> tool list, use `generate` and `get_job` instead of the shell commands
> below. The model choice and the prompt craft on this page still apply.
> See [`vsb` → Two ways to run](../vsb/SKILL.md#two-ways-to-run-mcp-tools-or-the-cli).

Two live models: sound effects and music. Short SFX finishes in
5–30 seconds (sync is fine); music can take longer — prefer `--async`
+ `vsb status` for tracks over ~60s.

Start every run in a **background shell** (Claude Code: `run_in_background:
true`) so the turn stays free, and put the blocking `--result` wait there too —
the shell's exit is the "done" signal, no poll loop needed. Rules in
[`vsb` → Background generations](../vsb/SKILL.md#background-generations-keep-the-conversation-free).

## What's live

| Task | Slug | Notes |
|------|------|-------|
| Sound effects (0.5–30s clips) | `audio/elevenlabs-sound-fx` | ElevenLabs. Foley, ambient, transitions, UI sounds. Loop mode for tiling beds. |
| Music (10s–5min tracks) | `audio/eleven-music` | ElevenLabs music_v2. Full structured tracks, vocals (model-written or your own lyrics) or instrumental. 48 kHz MP3. |
| Full song or instrumental from a style description | `audio/minimax-music-2.6` | MiniMax. One flat price per track whatever the length, so long songs are cheapest here. Own lyrics with section tags, auto-written lyrics, or instrumental. It honours a stated key and BPM. You cannot set the length: expect two to four minutes. |
| Re-sing a song you already have in a new style | `audio/minimax-music-cover` | MiniMax. The only model that takes a recording as input. Anchors on the melody and swaps the voice, instruments and arrangement, with optional replacement lyrics. The source needs audible singing, and the melody can still drift, so listen before you use it. |
| Speech-to-text | `audio/scribe` | Transcription, not generation — see [`vsb-subtitles`](../vsb-subtitles/SKILL.md). |

(Verify the live catalog with `vsb models --modality audio --json` before
trusting this list — TTS is still tracked for a future release.)

## ElevenLabs Sound FX

```bash
vsb run audio/elevenlabs-sound-fx \
  --prompt "footsteps on wet pavement at night, slow walk, distant traffic" \
  --duration_seconds 10 --json
```

- `duration_seconds` is a preset: `auto`, `2`, `5`, `10`, `15`, `20`, `30`.
  `auto` lets the model pick — good for one-shots.
- `prompt_influence`: `loose` / `balanced` / `strict`.
- `loop true` produces clips that tile cleanly (beds, rain, room tone).

### Prompt patterns for SFX

Descriptive, sensory, concrete:

- Good: "heavy wooden door creaking open, then slamming shut"
- Good: "thunder rumbling in the distance, light rain on a tin roof"
- Bad: "scary music" → that's `audio/eleven-music`
- Bad: "happy" → too abstract, the model won't know what *sounds* happy

## Eleven Music

```bash
vsb run audio/eleven-music \
  --prompt "Minimal modern electronic promo track. Warm analog synth pads, soft four-on-the-floor kick, sparse bell melody. Clean, premium, optimistic. 100 BPM." \
  --duration_seconds 30 --instrumental true --json
```

- `duration_seconds`: 10–300 (default 30). The exact length is pinned in
  the request, so the price shown at submit is exact and the track comes
  back at precisely that length — match it to your edit.
- `instrumental true` forces no vocals — the right call for background
  beds under dialogue or voiceover. Omit it and the model writes and
  performs vocals fitting the prompt (multilingual).
- **Brief it like a composer**: genre, mood, instrumentation, tempo/key
  ("100 BPM in A minor"). Use-case framing also works ("ad for a sneaker
  brand", "peaceful meditation bed").
- **Don't name artists or songs** — the provider rejects prompts that
  reference copyrighted music. The error includes a suggested rewrite;
  use it.
- `lyrics`: your own words, sung verbatim. See the next section.
- Licensing: commercial use OK (ads, social, podcasts, apps, games).
  NOT covered: releasing tracks on Spotify/Apple Music or offline
  TV/radio/film broadcast. Mention this if the user plans distribution.

### Your own lyrics

Pass `--lyrics` and the model sings those words instead of writing its
own. One line per row; blank lines separate sections. Section tags in
square brackets are optional and honoured: `[Verse 1]`, `[Chorus]`,
`[Bridge]`. Inline directions in curly braces are not sung: `{guitar solo}`.

```bash
vsb run audio/eleven-music \
  --prompt "Upbeat acoustic pop, female vocals, bright and simple, 120 BPM." \
  --duration_seconds 60 \
  --lyrics "$(cat lyrics.txt)" --json
```

`lyrics.txt`:

```text
[Verse 1]
Sandbox in the morning light
Every pixel feels just right

[Chorus]
Visual Sandbox, run it now
One click and we show you how
```

- The `prompt` still sets the style: genre, mood, vocals, tempo. Keep the
  words in `lyrics`, not in the prompt.
- Lyrics can be in any language. The style prompt should stay in English.
- Under the hood the server asks ElevenLabs for a composition plan with
  your lines, checks every line survived, pins the section lengths to
  `duration_seconds`, then composes. The price is unchanged: by track
  length only.
- `--lyrics` and `--instrumental true` together are rejected. Pick one.
- Size the track to the words: about 4 sung lines per 20 seconds. The
  planner adds an intro and outro around your sections.
- Max 3000 characters of lyrics.

### Async + poll (tracks over ~60s)

```bash
JOB=$(vsb run audio/eleven-music --prompt "..." --duration_seconds 120 \
  --instrumental true --async --json | jq -r '.job_id')
vsb status "$JOB" --json | jq -r '.status'   # non-blocking peek

# Blocking wait — run this one in a BACKGROUND shell; it notifies on completion.
vsb status "$JOB" --result --download "./out/{request_id}.mp3" --json > "/tmp/vsb-$JOB.json"
```

Play the finished track for the user with `open <file>` (the default player).

`--download` only if the user opted into local saves — otherwise fetch with
`--result --json` alone and hand back the share page
`https://visualsandbox.com/share/<job_id>/`, never a raw CDN URL
([vsb critical rule 5](../vsb/SKILL.md#critical-rules-read-first)).

## Cost estimation

```bash
vsb pricing audio/elevenlabs-sound-fx --json   # per clip
vsb pricing audio/eleven-music --json          # per minute of music
```

Music is billed by track length, prorated per second — a 30s bed costs a
few cents, a 5-minute song under a dollar.

## Common gotchas

- **Field is `prompt`** on both models. Run `vsb schema audio/<slug> --json`
  to confirm before guessing flags.
- **Lyrics go in `--lyrics`, not in the prompt.** Words inside the prompt
  are treated as style hints and may be paraphrased; `--lyrics` is sung
  verbatim.
- **Output is `.mp3`** — set the download template extension accordingly:
  `--download "./out/{request_id}.mp3"`.
- **SFX duration caps at 30 seconds**; anything longer is a music job.
- **Music duration must fit the edit** — the model fills exactly the
  seconds you ask for; a 16s video wants a 16s track, not a trimmed 30s one.
- **No em/en dashes (— –) in any text a model will speak or sing.** Speech
  synthesis vocalizes dashes unpredictably (odd pauses, hallucinated
  words). Use a comma, period, or `...` — full rule in the dialogue section
  of [`vsb-video`](../vsb-video/SKILL.md).
