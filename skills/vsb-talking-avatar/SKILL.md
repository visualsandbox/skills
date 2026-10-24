---
name: vsb-talking-avatar
description: >
  Make a talking video from one photo and a script with the Visual Sandbox
  MCP tools: a presenter, a spokesperson, an AI avatar or a person who reads
  a line, with the lips in time with the words. Trigger when the person asks
  to "make this photo talk", "create my avatar", "a talking head", "an AI
  spokesperson", "a presenter video", "lip sync this picture", or "make me
  say this". Picks a stock voice, an ElevenLabs voice or the person's cloned
  voice, asks for the price first, and shows the video in a card. Uses the
  MCP tools only.
license: Proprietary. See LICENSE for the terms.
---

# A talking avatar

One photo and one script make one talking video. The length of the video is
the length of the speech. Use the MCP tools only.

## 1. Get the photo and the words

- **The photo:** one face, looking at the camera, in good light. A photo
  attached in the chat goes to `upload_media` as `file`.
- **Consent:** use a photo of the person who asks, of a made-up character,
  or of somebody who gave permission. Do not make a real person say words
  they did not agree to.
- **The script:** about 2.5 words fit in one second. Write it without
  dashes, and write numbers as words. Show the script before you spend.

## 2. Pick the voice

| The person wants | Do this |
|------------------|---------|
| Any good voice | `video/p-video-avatar` with `voice_script` and a `voice` from its list |
| A natural ElevenLabs voice | `list_voices`, then `audio/elevenlabs-tts` with `voice` |
| Their own voice | Read `vsb-clone-voice`, then `audio/elevenlabs-tts` with `my_voice` |

For the second and the third row, make the speech first. Its result URL is
the `audio` of the video run.

## 3. Pick the video model

- **`video/p-video-avatar`:** the default. It takes `voice_script` and a
  stock `voice`, or an `audio` track. Use `video_prompt` for how the person
  moves, such as "nods and smiles while talking".
- **`video/kling-avatar-v2`:** for a sharper, more expressive face. It needs
  an `audio` track of 5 MB or less. `mode: "std"` first, `"pro"` for a final
  cut.

Read [`vsb-video`](../vsb-video/SKILL.md) with `get_skill`, at "People who
talk", when the person wants a full scene and not only a face.

## 4. Price, run, show

1. Call `estimate_cost`. Tell the person the price and wait for their yes.
2. Run the speech first, if the voice needs it. Then run the video model
   with the photo and the speech. In Review mode, a run of 10 cents or
   more waits for the person's press of Generate: show the card with
   `show_media`, or give the review link. Never press it for them.
3. Call `show_media` with the job ids. Give the `sandbox_url`.

## Rules

- One video per script. Change the script, not the model, when a word
  sounds wrong.
- For captions or a vertical cut, read `vsb-edit-video`.
