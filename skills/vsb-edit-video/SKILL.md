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

Every edit is a tool model. Run it with `generate`, like any other model,
and show it with `show_media`. Read the inputs with `get_model` first.

Use the MCP tools only.

| To | Model | Price |
|----|-------|-------|
| Join clips and pictures, with a cut or a fade | `tool/video-join` | Free |
| Add a voiceover, music or effects | `tool/video-add-audio` | Free |
| Burn captions from the speech | `tool/video-captions` | 5 cents |
| Trim, reframe to another shape, change speed | `tool/video-trim` | Free |
| Take the first, the last or one frame as a picture | `tool/video-frame` | Free |
| Place a logo or a picture on the video | `tool/video-overlay` | Free |

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
2. Join them: `tool/video-join` with `clips` in order. Use
   `transition: "fade"` for a calm piece, `"cut"` for an ad.
3. Make the voiceover with `audio/elevenlabs-tts`, then add it:
   `tool/video-add-audio` with `video_volume: 0.2`, so the clip sound sits
   under the voice.
4. Add music the same way: `loop_audio: true`, `audio_volume: 0.3`,
   `fade_out_seconds: 1.5`.
5. Add captions last, on the finished mix: `tool/video-captions`,
   `style: "bold"` for short-form video.
6. Call `show_media` with the job id of each step, or of the last step.

Captions read the speech of the video, so run them after the voiceover is
in. Run each step after the job before it is completed.

## Keep shots flowing

The last frame of one shot is the start frame of the next:
`tool/video-frame` with `position: "last"`, then pass its URL to the next
video model as the start image. Do this for shots that must continue one
movement.

## Fit one video to another platform

`tool/video-trim` with `aspect_ratio: "9:16"` crops a 16:9 video from the
centre. Use `fit: "pad"` to keep the whole frame with bars. Add
`start_seconds` and `end_seconds` to keep only the best part, and `speed` to
fit a length.

## Before you run

- Say what each step does and which job it uses, in one line each.
- Captions cost 5 cents. Say so before the run.
- A failed step costs nothing. Read the error, fix the input, run again.
