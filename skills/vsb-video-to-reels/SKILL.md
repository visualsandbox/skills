---
name: vsb-video-to-reels
description: >
  Cut a long video into short vertical clips with the Visual Sandbox MCP
  tools: find the best moments in a podcast, an interview, a webinar or a
  talk, trim each one to 9:16, and add word-timed captions. Trigger when the
  person asks to "turn this video into reels", "make shorts from my
  podcast", "find the best clips", "clip this interview", "repurpose this
  video for TikTok", or attaches a long video and asks for short ones.
  Transcribes the video, proposes the moments, and cuts only the ones the
  person picks. Uses the MCP tools only.
license: Proprietary. See LICENSE for the terms.
---

# Long video to reels

A long video becomes 3 to 5 clips of 15 to 60 seconds, each 9:16 with
captions. The transcript finds the moments; the person picks them. Use the
MCP tools only.

## 1. Get the video and its length

- A file attached in the chat goes to `upload_media` as `file`. Use the
  `url` it returns. An upload can be up to 100 MB. Each edit takes a video
  of up to 15 minutes, and captions take up to 10 minutes.
- Ask how long the video is, if you do not know. Round up to the next whole
  minute. The transcript is priced by that length.

## 2. Transcribe it

1. Call `estimate_cost` for `audio/scribe` with `duration_seconds`. Tell the
   person the price.
2. Run `audio/scribe` with `audio` (the video URL) and `duration_seconds`.
3. Call `get_job` after `eta_seconds`. It returns the transcript as lines,
   each with its start and end second: `[12.3-18.0] The sentence.`

## 3. Propose the moments

Pick 3 to 5 moments that stand alone without the rest of the video.

- Each one starts with a strong line in its first 3 seconds: a claim, a
  question or a surprise.
- Each one ends at the end of a sentence.
- Each one is 15 to 60 seconds long.

Show a list: the start and end second, the length, and the first line of
each. Wait for the person to pick.

## 4. Cut and caption

For each moment the person picked:

1. `trim_video` with `video`, `start_seconds`, `end_seconds`,
   `aspect_ratio: "9:16"` and `fit: "crop"`. Free. Use `fit: "pad"` when two
   people sit far apart and the crop would cut one out.
2. When the trim job is completed, `add_captions` on its result URL with
   `style: "bold"`. 5 cents each; say so before the runs.

Use the same `sandbox_name` on every run, such as "Podcast ep 12 reels".

## 5. Hand it over

Call `show_media` with the caption job ids, and give the `sandbox_url`.

## Rules

- Cut nothing before the person picks the moments.
- Run captions after the trim job is completed, never at the same time.
- A failed edit costs nothing. Read the error, fix the input, run again.
