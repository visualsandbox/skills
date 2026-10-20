---
name: vsb-characters
description: >
  Keep one person, mascot or product the same in every picture and video
  with Visual Sandbox characters. Make a character sheet, save it with
  create_character, give it a voice, and pass its pictures to every later
  shot. Trigger when the person asks for "the same character", "a recurring
  host", "an AI influencer", "a mascot", "consistent faces", "a cast for my
  film", or names a character they made before. Uses the MCP tools, or
  `vsb characters` in the CLI.
license: Proprietary. See LICENSE for the terms.
---

# Characters

A model forgets a face between two runs. A character is what you give it
each time: the same reference pictures, the same description and the same
voice. Saving it is free.

## Make a character

1. **Ask what must not change.** Face, age, hair, build, skin, clothes, and
   the style (photo, 3D, cartoon). Write it down in two or three lines.
2. **Make the sheet.** Generate pictures of the character on a plain light
   background, in even light: a front view, a three-quarter view and a full
   body. Use one image model for all of them and read `vsb-image-prompting`
   first. For a real product, start from its photo.
3. **Show the sheet and get a yes.** Remake a view that drifted before you
   save.
4. **Save it.** `create_character` with the name, the description and the
   URLs of the pictures (up to 8). Links that are not on Visual Sandbox are
   copied, so they last.
5. **Give it a voice, if it speaks.** Pick a stock voice with `list_voices`,
   or design one with `audio/elevenlabs-voice-design`. Save its id with
   `update_character`.

## Use a character

1. `get_character` with its name.
2. Pass its `reference_urls` to the model's reference input, as `get_model`
   names it.
3. Put the description in the prompt, then say what is new in this shot:
   the place, the action, the camera.
4. For speech, pass the `voice_id` to `audio/elevenlabs-tts`: as `voice` for
   a stock voice, as `my_voice` for one the person designed.

For two characters in one shot, pass the pictures of both and name each one
in the prompt: "the woman from the first pictures, the dog from the last".

## Look after the cast

- `list_characters` shows every character on the account. Check it when the
  person names someone, before you make a new one.
- Replace a weak reference with `update_character`. The new set replaces
  the old one.
- `delete_character` removes the character, not its pictures.
- Never make a character of a real person without their consent.
