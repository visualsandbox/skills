---
name: vsb-download
description: >
  Download a video from TikTok, Instagram, YouTube (any yt-dlp-supported
  site) via `vsb video download`, then actually understand it — tile its
  frames into one image with `vsb video frame`, read it, and reconstruct the
  dialogue from burned-in captions. Trigger when the user shares a video URL and asks
  "what is this video about", "watch this", "summarize this video",
  "download this tiktok/reel/short", or wants a local copy of a social
  video. Metadata-only lookups use `--info` (no download, no bytes).
---

# Download + understand a video with vsb

`vsb video download` wraps a pinned, SHA-256-verified `yt-dlp` (bootstrapped to
`~/.vsb/tools/` on first use — no global install needed). It downloads the
video file and prints structured metadata. It does **not** interpret the
content — that's the frame-grid pipeline below.

## Command surface

```bash
vsb video download <url> --json                 # download to cwd, default name "<title> [<id>].<ext>"
vsb video download <url> --info --json          # metadata only, nothing downloaded
vsb video download <url> -o ./clips/ --json     # trailing "/" = directory
vsb video download <url> -o ./clip.mp4 --json   # exact filename (yt-dlp template syntax allowed)
vsb video download <url> --cookies chrome --json  # login-walled posts (Instagram) — reads local browser cookies
```

- Works on any yt-dlp-supported site: TikTok, Instagram, YouTube, X, and hundreds more.
- `--cookies` takes a browser name (`chrome`, `safari`, `firefox`). Needed for
  Instagram and other login-walled posts. On macOS the first use may prompt
  for keychain access — that prompt goes to the user's screen, warn them.
- Always `--json` when an agent reads the output.

## Step 1 — metadata first, always

`--info` is free and instant. Run it before deciding to download at all:

```bash
vsb video download "$URL" --info --json
```

```json
{
  "status": "info",
  "id": "7639535671257992468",
  "title": "What do you guys think of the new studio? #djcara ...",
  "description": "full caption text with #hashtags",
  "uploader": "djcara.com",
  "duration_seconds": 9,
  "width": 576, "height": 1036,
  "source": "TikTok",
  "upload_date": "20260514",
  "view_count": 824, "like_count": 18
}
```

Often the caption + duration already answers the user's question. Only
download when you need to see the actual content. `upload_date` is
`YYYYMMDD`. `duration_seconds` drives the sampling plan below.

## Step 2 — download to scratchpad

Never download into the user's project. Use the session scratchpad (or ask
where, if the user wants to keep the file):

```bash
vsb video download "$URL" -o "$SCRATCHPAD/clip.mp4" --json
```

## Step 3 — contact sheets (see the whole video in one Read)

`vsb video frame` tiles evenly spaced frames, first to last, into one image.
Read that image. One sheet of nine frames covers a short video end to end
and costs one image read.

```bash
vsb video frame "$SCRATCHPAD/clip.mp4" --json    # 3x3 → clip-frames.jpg
```

Pick the grid from `duration_seconds`:

| Duration | Command | Sheets |
|----------|---------|--------|
| ≤ 60s | `vsb video frame clip.mp4` | 1 |
| 1–5 min | `vsb video frame clip.mp4 --grid 4x4` | 1 |
| 5 min+ | `--grid 5x5`, then a closer sheet of each part that matters | 2+ |

The JSON gives `at_seconds`, the time of every tile in reading order. Use it
to find a moment again.

Closer looks:
- One moment at full size: `vsb video frame clip.mp4 --at 4.5`.
- A few seconds in detail: trim, then tile the trim.
  `vsb video crop clip.mp4 --start 4 --duration 3 -o part.mp4`, then
  `vsb video frame part.mp4 --grid 2x2`.
- Captions too small to read? The two above are the fix. Do not raise the
  grid — more tiles make every tile smaller.

## Step 4 — dialogue via burned-in captions

TikTok / Reels / Shorts almost always burn auto-captions into the frames.
Reading the grids in order reconstructs the spoken script for free — no
transcription step. Quote it in the summary.

No burned-in captions and the audio matters? Transcribe it with
`audio/scribe` — see [`vsb-subtitles`](../vsb-subtitles/SKILL.md), "Transcribe
without burning". It is a paid run, so tell the user the price first
(`vsb pricing audio/scribe`). Never guess the dialogue from the visuals.

## Step 5 — report, then clean up

- Summarize: what happens on screen, the spoken script (from captions), the
  poster's caption/hashtags, stats (views/likes, upload date).
- The scratchpad copy dies with the session. If the user might want the
  file, ask once: keep it? where? Move it — don't re-download.

## Traps

- `--info` still hits the network (yt-dlp metadata fetch) — it just skips
  the video bytes.
- Default output template (no `-o`) writes `<title> [<id>].<ext>` into the
  **current directory** — titles contain spaces and `#hashtags`; always
  quote the resulting path, better yet always pass `-o`.
- Instagram without `--cookies` fails with a login error — that's the
  expected signal to retry with `--cookies chrome`.
- `vsb video frame` needs a local ffmpeg (`command -v ffmpeg`); the download
  itself needs only `vsb`.
- Age-gated / region-locked / private videos fail inside yt-dlp with its
  error passed through — quote it, don't retry blindly.
