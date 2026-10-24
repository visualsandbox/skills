---
name: vsb-short-film
description: >
  Make a short film of several shots inside a chat with the Visual Sandbox
  MCP tools: a story of 15 to 60 seconds with the same character in every
  shot, kept as a film project between chats, joined into one cut with a
  narration and a music bed. Trigger when the person asks to "make a short
  film", "turn this script into a video", "a story with several scenes", "a
  trailer", "a music video", "a multi-scene ad", "an episode with my
  character", or "continue my film". Plans the shots, gives the total price
  once, approves the keyframes before any video, then assembles the cut.
  Uses the MCP tools only; for the CLI, read vsb-film.
license: Proprietary. See LICENSE for the terms.
---

# A short film

A short film is 3 to 8 shots of about 5 seconds, one character, one shape. A
**film project** keeps the brief, the script, the shot list and where each
shot stands, so the work goes on in a later chat. Video costs many times more
than an image, so every shot is approved as a keyframe before it moves.

## 0. Find or start the film

Call `list_film_projects`. When the person continues a film, `get_film_project`
returns everything, and you go on from its `stage`. Otherwise ask for the
brief (step 1), then call `create_film_project` with the `name`, the `brief`,
the `aspect_ratio`, `target_seconds` and the `characters`. It opens the
film's canvas and writes the plan there as `FILM.md`. **Send its
`sandbox_uuid` with every run of the film.**

## 1. Get the brief

Ask only for what is missing, in three questions or less.

- **The story** in one or two sentences, or the person's script.
- **The length:** 15, 30 or 60 seconds. Default: 30.
- **The shape:** 9:16 for a phone, 16:9 for a screen. Default: 16:9.

## 2. Write the script and the shot list

One row for each shot, one action for each shot. Write spoken lines without
dashes, and write numbers as words.

Save them with `update_film_project`: `script`, and `shots` with an `id`
(`shot-1`), a `title`, the `script` line and the `prompt`. When the person
approves them, set `stage: "script_ok"`.

## 3. Give the total price once

Call `estimate_cost` for one keyframe, one clip of each length you plan, and
the narration. Multiply by the number of shots and give one total. Wait for
the person's yes. Spend nothing before it.

## 4. Make the character

Read [`vsb-characters`](../vsb-characters/SKILL.md). Make one character sheet,
save it with `create_character`, and pass its pictures as references to every
keyframe. A product or a place can be a character too.

## 5. One keyframe for each shot

1. Read [`vsb-image-prompting`](../vsb-image-prompting/SKILL.md).
2. Make one keyframe for each shot, at the film's shape, with the character
   pictures as references. Say first how many images that is.
3. Call `show_media` with the keyframe job ids. Change a keyframe until the
   person approves the set.
4. Record each approved keyframe with `update_film_project`, `patch_shots`:
   `storyboard_url` and `approved: true`. Then `stage: "storyboard_ok"`.

## 6. Move each shot

1. Read [`vsb-video`](../vsb-video/SKILL.md) at "Picking a model" and, for
   spoken lines, "People who talk".
2. Run one image-to-video job for each shot, with its keyframe as the first
   frame. In Review mode each run waits for the person's press: show the card
   or give the review link.
3. Record each job at once with `patch_shots`: `job_id`. The shot's
   `clip_url` fills in by itself when the job is done.

## 7. Narration, music and the cut

1. A narration: speak the film's script with `audio_elevenlabs_tts`, in the
   character's voice when it has one. Save it with `narration_url`.
2. A music bed (optional): make one with [`vsb-audio`](../vsb-audio/SKILL.md)
   and save it with `music_url`.
3. Call `assemble_film`. It joins every shot in order and lays the sound:
   `audio_mode: "narration"` replaces the shots' sound with the narration,
   `"mix"` lays it over, `"shots"` keeps the shots' own sound. The music
   drops while the narration speaks. `transition`: `cut` for pace, `fade` for
   calm. Free.
4. Call `show_media` with its job id. Set `stage: "preview_ok"`. After the
   person's last changes, set `stage: "final"`.
5. Captions, when the film has speech: `add_captions` on the cut.

## Rules

- No video run before the keyframes are approved.
- Move the `stage` on only when the person approved that step.
- Never run a clip twice to check it. Read the four frames `get_job` sends.
- A shot that fails costs nothing. Fix that shot only, then assemble again.
