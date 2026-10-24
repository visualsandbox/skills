---
name: vsb-clone-voice
description: >
  Clone a voice from a recording with the Visual Sandbox MCP tools, then
  read any script in it: a voiceover, an ad, a narration or a talking
  avatar in the person's own voice. Trigger when the person asks to "clone
  my voice", "use my voice", "make it sound like me", "voice cloning",
  "narrate this in my voice", or attaches a voice recording and asks to
  reuse it. Checks consent, makes the clone once, and reads scripts in it
  after that. Uses the MCP tools only.
license: Proprietary. See LICENSE for the terms.
---

# Clone a voice

Make the clone once. After that, every script reads in that voice. Use the
MCP tools only.

## 1. Check consent first

Clone only the voice of the person who asks, or a voice whose speaker gave
permission. Ask in one line when it is not clear. Set `confirm_rights: true`
only after the person confirms it. Never clone a public figure.

## 2. Get the recording

- One speaker, clear speech, no music. One to two minutes gives the best
  clone. A phone recording is good enough.
- A file attached in the chat goes to `upload_media` as `file`. Use the
  `url` it returns.
- Set `remove_background_noise: true` only for a noisy recording. It can
  lower the quality of a clean one.

## 3. Make the clone

1. Call `estimate_cost` for `audio/elevenlabs-voice-clone`. Tell the person
   the price and wait for their yes.
2. Run it with `audio` (the recording URL), `confirm_rights: true`, and a
   short `prompt` that the clone reads back as a sample. The voice stays
   usable later: Visual Sandbox keeps the recording, and a later run clones
   the voice again when it needs to. An account can clone 3 times a day.
3. Call `show_media` with the job id, so the person hears the sample.

## 4. Read a script in the voice

1. Call `list_voices`. The new voice is in the list of voices the person
   made. Use its name or id.
2. Run `audio/elevenlabs-tts` with `prompt` (the script) and `my_voice`.
   `mode: "v4"` is the most natural.
3. Write the script without dashes, and write numbers as words.

To put the voice on a face, read `vsb-talking-avatar`. To put it on a video,
read `vsb-edit-video` and use `add_audio`.

## In ChatGPT: the Voice Studio card

On an account that may clone a voice, `voice_studio` with no job id opens
a card that records the person, or takes a saved recording. They tick the
consent box, and the card sends you the recording's URL. Run the clone
with that URL and `confirm_rights: true`, then call `voice_studio` with
the clone's job id so they hear it and save it to a character.

## Rules

- One clone per voice. Reuse it with `my_voice`; do not clone again.
- When the sample sounds wrong, ask for a cleaner or a longer recording.
