---
name: vsb-edit-video
description: >
  Edit video with the Visual Sandbox MCP tools, on the server, with nothing
  to install: join clips into one video, add a voiceover or music, burn
  word-timed captions, trim and reframe to 9:16, take a frame, place a logo.
  Trigger when the person asks to "put these clips together", "make a reel",
  "add music", "add a voiceover", "add captions or subtitles", "cut it to 15
  seconds", "make it vertical", "add my logo", or to finish a video made of
  several generated shots. Uses the MCP tools only.
license: Proprietary. See LICENSE for the terms.
---

# Edit a video

Every edit is its own tool. It returns a job id, like `generate`; show the
result with `show_media`. Each edit is also a tool model that `generate` and
`vsb run` can run.

Use the MCP tools only.

| To | Tool | Model | Price |
|----|------|-------|-------|
| Join clips and pictures, with a cut or a fade | `join_clips` | `tool/video-join` | Free |
| Add a voiceover, music or effects | `add_audio` | `tool/video-add-audio` | Free |
| Burn captions from the speech | `add_captions` | `tool/video-captions` | 5 cents |
| Trim, reframe to another shape, change speed | `trim_video` | `tool/video-trim` | Free |
| Take the first, the last or one frame as a picture | `extract_frame` | `tool/video-frame` | Free |
| Place a logo or a picture on the video | `add_logo` | `tool/video-overlay` | Free |

The free tools allow 200 runs a day. Each input can be up to 15 minutes.
Captions take a video of up to 10 minutes.

## Inputs

- Pass every video, picture and sound as a URL: a `result.urls` entry of an
  earlier job, a URL from `upload_media`, or any public `https` URL.
- A file attached in the chat goes to `upload_media` as `file` first.
- Pass the same `sandbox_name` as the rest of the task, so the edit lands on
  the same canvas.

## Make a reel from generated shots

1. Generate the shots. Give all of them the same shape, for example 9:16.
2. Join them: `join_clips` with `clips` in order. Use
   `transition: "fade"` for a calm piece, `"cut"` for an ad.
3. Make the voiceover with `audio/elevenlabs-tts`, then add it:
   `add_audio` with `video_volume: 0.2`, so the clip sound sits
   under the voice.
4. Add music the same way: `loop_audio: true`, `audio_volume: 0.3`,
   `fade_out_seconds: 1.5`.
5. Add captions last, on the finished mix: `add_captions`,
   `style: "bold"` for short-form video.
6. Call `show_media` with the job id of each step, or of the last step.

Captions read the speech of the video, so run them after the voiceover is
in. Run each step after the job before it is completed.

## Keep shots flowing

The last frame of one shot is the start frame of the next:
`extract_frame` with `position: "last"`, then pass its URL to the next
video model as the start image. Do this for shots that must continue one
movement.

## Fit one video to another platform

`trim_video` with `aspect_ratio: "9:16"` crops a 16:9 video from the
centre. Use `fit: "pad"` to keep the whole frame with bars. Add
`start_seconds` and `end_seconds` to keep only the best part, and `speed` to
fit a length.

## Before you run

- Say what each step does and which job it uses, in one line each.
- Captions cost 5 cents. Say so before the run.
- A failed step costs nothing. Read the error, fix the input, run again.
