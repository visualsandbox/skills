---
name: vsb-short-film
description: >
  Make a short film of several shots inside a chat with the Visual Sandbox
  MCP tools: a story of 15 to 60 seconds with the same character in every
  shot, joined into one video with music, a voiceover or captions. Trigger
  when the person asks to "make a short film", "turn this script into a
  video", "a story with several scenes", "a trailer", "a music video", "a
  multi-scene ad", or "an episode with my character". Plans the shots, gives
  the total price once, approves the stills before any video, then joins the
  clips. Uses the MCP tools only; for the CLI, read vsb-film.
license: Proprietary. See LICENSE for the terms.
---

# A short film

A short film is 3 to 8 shots of about 5 seconds, one character, one shape,
joined into one video. Video costs many times more than an image, so every
shot is approved as a still before it moves. Use the MCP tools only.

## 1. Get the brief

Ask only for what is missing, in three questions or less.

- **The story** in one or two sentences, or the person's script.
- **The length:** 15, 30 or 60 seconds. Default: 30.
- **The shape:** 9:16 for a phone, 16:9 for a screen. Default: 16:9.

## 2. Write the shot list

One row per shot. Show the list before you spend.

| # | What we see | Camera | Sound or line |
|---|-------------|--------|---------------|
| 1 | The robot wipes the counter at night | Wide, slow push in | Rain |

Keep one action per shot. Write spoken lines without dashes, and write
numbers as words.

## 3. Give the total price once

Call `estimate_cost` for one still, one clip of each length you plan, and
the music or voiceover. Multiply by the number of shots and give the person
one total. Wait for their yes. Spend nothing before it.

## 4. Make the character

Read [`vsb-characters`](../vsb-characters/SKILL.md) with `get_skill`. Make one
character sheet image, save it with `create_character`, and pass its pictures
as references to every still. A product or a place can be a character too.

## 5. Make and approve the stills

1. Read [`vsb-image-prompting`](../vsb-image-prompting/SKILL.md) with
   `get_skill`.
2. Make one still per shot, in the film's shape, with the character
   pictures as references. Use the same `sandbox_name` on every run, such
   as "Robot barista film".
3. Call `show_media` with all the still job ids. Change a still until the
   person approves the set.

## 6. Move each shot

1. Read [`vsb-video`](../vsb-video/SKILL.md) with `get_skill`, at "Picking a
   model" and, for spoken lines, "People who talk".
2. Run one image-to-video job per shot, with the approved still as the start
   image and 5 seconds. Pass the agreed price as `approved_cost_usd` where
   the tool asks for it.
3. Call `show_media` with every clip job id.

## 7. Join and finish

Read [`vsb-edit-video`](../vsb-edit-video/SKILL.md) with `get_skill`.

1. `join_clips` with the clips in shot order. `"cut"` for pace, `"fade"`
   for calm.
2. Music or a voiceover: make it with [`vsb-audio`](../vsb-audio/SKILL.md),
   then `add_audio`.
3. Captions last, when the film has speech: `add_captions`.
4. Call `show_media` with the final job id, and give the `sandbox_url`.

## Rules

- No video run before the stills are approved.
- Never run a clip twice to check it. Read the four frames `get_job` sends.
- A shot that fails costs nothing. Fix that shot only, then join again.
