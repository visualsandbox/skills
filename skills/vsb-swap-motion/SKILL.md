---
name: vsb-swap-motion
description: >
  Put a different person or character into an existing video, or make a
  photo move the way a person moves in another video, with the Visual
  Sandbox MCP tools: P-Video Replace swaps the subject, Kling 3.0 Motion
  Control and P-Video Animate copy a motion onto a photo, and Kling 3.0 Omni
  restyles or edits a reference video. Trigger when the person asks to
  "swap the person in this video", "put me in this clip", "replace the
  actor", "make my character do this dance", "copy this motion", "motion
  transfer", "restyle this video" or "change what is in this video".
  Consent first, a still check before the paid run. Uses the MCP tools only.
license: Proprietary. See LICENSE for the terms.
---

# Swap a character, copy a motion

Three jobs, three model families. Read each model's form in its tool before
the first run; the field names below are the ones to look for.

| The person wants | Tool | Inputs |
|------------------|------|--------|
| A new person in their video, with its motion and sound | `video_p_video_replace` | `video` (the source), `images` (1 to 3 photos of the new person), `instruction_prompt`, `resolution` |
| A photo that moves like a person in another video | `video_kling_v3_motion_control` | `image` (the character), `video` (the driving motion, 3 to 30 s), `prompt` |
| The same, at a lower price | `video_p_video_animate` | `image`, `video`, `instruction_prompt`, `resolution` |
| A video restyled, or edited in place | `video_kling_v3_omni_video` | `reference_video`, `video_reference_type` (`base` edits it, `feature` takes only its camera and style), `reference_images`, `prompt` |

## Before any run

1. **Consent.** Put a real person into a video only when that person agreed
   to it. Ask when you are not sure. Never put a real person into a scene
   that harms or mocks them.
2. **The rights to the source.** The source video must be the person's own,
   or one they have the right to use.
3. **Get the files.** A file attached in the chat goes to `upload_media` as
   `file`. A public video page goes to `download_video`. Use the URLs they
   return.
4. **Check the price.** P-Video Replace and Animate reserve 30 seconds of
   output and refund the rest; Motion Control reserves its longest length.
   Call `estimate_cost`, and say the price.

## Check the look first

A swap fails when the new person's photos do not match the source's light
and angle.

1. Take a frame of the source with `extract_frame`.
2. Make one still of the new person in that frame with an image model and the
   frame as a reference ([`vsb-image`](../vsb-image/SKILL.md)). It costs a few
   cents.
3. Show the still. When the person agrees, use it as one of the `images`, or
   as the `image` for a motion copy.

## Write the instruction

Name each person by what the camera sees, in one line each:

- "The woman on the left in the black top becomes the person in the photos."
- "The dancer keeps every step; the character's outfit stays as in the photo."

Keep the scene, the camera and the sound unless the person asks to change
them.

## Run, then hand over

1. Run the tool once. In Review mode the run waits for the person's press:
   show the card or give the review link, and wait.
2. Call `show_media` with the job id in ChatGPT, or `get_job` when the
   job is done.
3. Look at the frames. Say what is wrong before you offer another take.
