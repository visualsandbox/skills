---
name: vsb-video-to-reels
description: >
  Cut a long video into short vertical clips with the Visual Sandbox MCP
  tools: find the best passages in a podcast, an interview, a webinar or a
  talk, cut and reframe them to 9:16 in one render, and burn word-timed
  captions from the source's own transcript. Trigger when the person asks to
  "turn this video into reels", "make shorts from my podcast", "find the best
  clips", "clip this interview", "repurpose this video for TikTok", sends a
  YouTube, TikTok, Instagram or X link, or attaches a long video and asks for
  short ones. Transcribes, proposes the passages, and cuts only the ones the
  person picks. Uses the MCP tools only.
license: Proprietary. See LICENSE for the terms.
---

# Long video to reels

The transcript finds the passages, the person picks them, and one render cuts
them. You pick the moments; `cut_and_reframe_video` only cuts what it is
given. Use the MCP tools only.

## 1. Get the video

- **A public page** (YouTube, TikTok, Instagram, X): keep the link for step 2,
  and call `download_video` with it for step 4. A site can refuse the server;
  then ask the person to attach the file. Use only video the person has the
  right to use.
- **A file in the chat** goes to `upload_media` as `file`. Use the `url` it
  returns.

The source can be up to 2 hours long.

## 2. Transcribe it

- **A public page:** call `transcribe_link` with the link. A page with
  captions, such as most YouTube videos, costs nothing. A page without
  captions ends the run with no charge. Then say that Scribe charges for the
  real length, and on a yes call `transcribe_link` again with
  `use_captions: false`.
- **A file:** run `audio/scribe` with the file URL. Call `estimate_cost` with
  the length first, and say the price.

`get_job` returns the transcript as timed lines, `[12.3-18.0] The sentence.`
Keep the job id: the captions in step 4 read the words from it.

## 3. Propose the passages

A passage with a hook, the context and a payoff beats a quotable line with no
end. Default to one passage of 30 to 60 seconds; offer up to five.

- It opens with a strong line in its first 3 seconds: a claim, a question or
  a surprise.
- It ends at the end of a thought, not in the middle of a sentence.
- It stands alone. A viewer who did not see the rest understands it.
- A passage can join two or three parts of the source, in order or not, when
  the joined parts still say what the speaker meant.

Cut at a pause. A pause of 400 ms or more is a clean cut; take care between
150 and 400 ms; below 150 ms, keep more context. **Never join parts so that a
speaker seems to say something they did not say.**

Show a list: the start and end seconds of each part, the length, and the
first line. Wait for the person to pick.

## 4. Cut, reframe and caption in one run

Call `cut_and_reframe_video` once for each reel:

- `video`: the source URL from step 1.
- `segments`: the parts in the order the reel plays them, each with `start`
  and `end` in source seconds. Up to 40 parts and 5 minutes in all, each at
  least 0.15 s.
- `framing` for each part: `center_crop` for one person in the middle,
  `pad` when two people sit far apart, or `crop` with `crop_x`, `crop_y`,
  `crop_width` and `crop_height` in source pixels to follow one speaker.
- `aspect_ratio`: `9:16` by default.
- `captions`: one of the six looks of `add_captions`, with `transcript` set
  to the job id of step 2: `highlight` (large capitals, the spoken word lit
  up), `hormozi`, `beast`, `classic`, `box` or `plain`. Each look has its own
  place and number of words. Use `none` when the source already has captions
  burned in.

The cut is free. Captions from the source transcript need no second
transcription. Send the same `sandbox_name` on every run, such as
"Podcast ep 12 reels".

To change the caption look, run `cut_and_reframe_video` again with the same
parts and another look. The cut is free, and the old captions do not stay on
the new reel. The looks are in [`vsb-edit-video`](../vsb-edit-video/SKILL.md).

## 5. Hand it over

Call `show_media` with the job ids, and give the `sandbox_url`. Look at the
frames before you report a reel.

## Rules

- Cut nothing before the person picks the passages.
- One reel is one run. A complaint about one reel is not a yes for new runs
  of the others.
- A failed cut costs nothing. Read the error, fix the input, and run again.
