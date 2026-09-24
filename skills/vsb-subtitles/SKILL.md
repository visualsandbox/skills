---
name: vsb-subtitles
description: >
  Add TikTok/CapCut-style word-by-word captions to any video with
  `vsb video subtitles` — transcribes via Visual Sandbox's `audio/scribe`
  (ElevenLabs Scribe, word-level timestamps), builds .ass subtitles in
  one of five caption styles (TikTok word-by-word, MrBeast, highlight,
  Hormozi, or a rounded box), and burns them in with local ffmpeg.
  Trigger when the user says "add subtitles", "add captions", "caption
  this video", "burn subs", asks for a caption style, or wants a
  transcript of a video with timestamps. Accepts a local file or a
  TikTok/Instagram/YouTube URL.
---

# Subtitle a video with vsb

One command does the whole pipeline: download (if URL) → probe duration →
extract audio → transcribe via `audio/scribe` → build kinetic captions →
burn with ffmpeg. Requires local `ffmpeg` (the transcription itself is the
only paid step).

## Command surface

```bash
vsb video subtitles ./clip.mp4 --json                 # local file → ./clip-subtitled.mp4
vsb video subtitles "https://www.tiktok.com/@user/video/123" --json
vsb video subtitles ./clip.mp4 --preset beast --json  # MrBeast-style captions
vsb video subtitles ./clip.mp4 --preset box --json    # white text on a rounded dark box
vsb video subtitles ./clip.mp4 --preset box --words 1 --json  # one word per box
vsb video subtitles ./clip.mp4 -o ./out.mp4 --language en --json
vsb video subtitles ./clip.mp4 --font "Montserrat ExtraBold" --font-size 42 --json
vsb video subtitles ./clip.mp4 --no-uppercase --json  # keep original casing
```

- Output lands next to the input as `<name>-subtitled.mp4` unless `-o` is set.
- The full transcript (word timestamps included) is saved alongside as
  `<output>.transcript.json` — use it for summaries, translations, or
  re-styling without paying for a second transcription.
- `--language` takes an ISO-639-1 code; omit to auto-detect.
- Always `--json` when an agent reads the output.

## Fix mishears, re-burn free

`--transcript <file>` reuses a saved transcript instead of transcribing —
no API call, no cost. The workflow for correcting ASR mistakes (brand
names, homophones like "paid"/"pay"):

```bash
vsb video subtitles ./clip.mp4 --json                          # first pass, pays ~1¢
# edit clip-subtitled.transcript.json: fix the "text" of wrong words,
# delete hallucinated ones — KEEP the start/end timestamps
vsb video subtitles ./clip.mp4 --transcript ./fixed.json --json  # re-burn, free
```

Same flag also covers restyling passes (`--font-size`, `--no-uppercase`)
without paying twice.

## Cost

Transcription is billed per hour of audio (`audio/scribe`), so a typical
short-form clip costs about a cent. `vsb pricing audio/scribe` shows the
current rate; the JSON output reports the exact `cost` charged.

## Caption styles

`--preset` picks the caption style. The default is `classic`.

| Preset | Look | Reveal | Casing |
|---|---|---|---|
| `classic` | TikTok auto-caption: bold sans, white, soft dark shadow, lower third | Words fade in one at a time and stay until the clause ends | ALL CAPS |
| `beast` | MrBeast: Komika Axis, fat black outline, heavy shadow, mid-screen | Chunks of 2–3 words pop in with a bounce | ALL CAPS |
| `highlight` | Montserrat Black, thick black outline | The full phrase shows; the spoken word turns yellow | ALL CAPS |
| `hormozi` | Anton, condensed caps | The full phrase shows; the spoken word cycles green, yellow, red | ALL CAPS |
| `box` | Instagram / YouTube: white bold Arial on a see-through dark box with rounded corners | The full phrase shows at once | Original casing |

A caption ends at the end of a sentence, at a speech pause longer than
0.8 s, or when it fills two lines. `--words <n>` also caps the words in
one caption. `--words 1` shows one word at a time, and `box` then draws a
small rounded box around each word.

The timing comes from the transcript. Scribe returns a start and an end
time for every word, so each caption shows while its words are spoken.
There is no JSON to write. `--transcript` only reuses or corrects a
transcript that a first run saved.

The `box` style fits each box to its text. The command first renders every
caption once, off screen, and measures the text block that libass (the
subtitle renderer in ffmpeg) lays out. Then it draws each box that size,
with the same padding on all captions. A two-line caption splits into two
lines of near-equal length, so the box stays neat.

`--font` / `--font-size` override the preset's defaults. `--uppercase` /
`--no-uppercase` override the preset's casing. Fonts load from the system
or from `~/.vsb/fonts` (drop .ttf files there — no install needed); libass
silently falls back to a default sans when a font is missing, so captions
never fail on fonts. `beast` needs Komika Axis in `~/.vsb/fonts` for the
authentic look.

Cheap style comparison: burn each preset once with `--transcript` reuse —
one paid transcription, N free re-burns.

## Transcribe without burning

Need only the transcript (subtitles for something else, a summary, search)?
Call the model directly and skip the render:

```bash
vsb run audio/scribe --audio ./clip.mp3 --duration_seconds 54 --json
```

`duration_seconds` is required — it sets the exact price up front. Probe it
first: `ffprobe -v error -show_entries format=duration -of csv=p=0 file`.
The result URL is a JSON file with `text` plus per-word `start`/`end`
timestamps (and `speaker_id` per word with `--diarize true`).

## Traps

- The input needs an audible speech track; music-only videos return few or
  no words and the command errors with "No speech detected".
- Videos that already have captions burned in get a second layer — there is
  no way to remove baked-in captions. Prefer a clean source export.
- `ffmpeg`/`ffprobe` must be on PATH (`brew install ffmpeg`); only the
  yt-dlp download path is auto-bootstrapped.
