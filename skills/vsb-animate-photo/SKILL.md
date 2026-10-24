---
name: vsb-animate-photo
description: >
  Turn one photo into a short video clip with the Visual Sandbox MCP tools:
  a product shot that moves, a portrait that comes alive, a still that gets
  a slow camera move. Trigger when the person asks to "animate this photo",
  "make this picture move", "turn my product photo into a video", "add
  motion", "image to video", or attaches a picture and asks for a clip.
  Keeps the subject unchanged, asks for the price first, and shows the clip
  in a card. Uses the MCP tools only.
license: Proprietary. See LICENSE for the terms.
---

# Animate a photo

One photo becomes one clip of about 5 seconds. The subject stays the same.
Only the motion is new. Use the MCP tools only.

## 1. Get the photo and the motion

- A photo attached in the chat goes to `upload_media` as `file`. Use the
  `url` it returns. A public `https` link can go in directly.
- Ask what moves, in one question, only if the person did not say. Offer
  two choices: a slow camera move, or one small action of the subject.
- Keep the shape of the photo. A tall photo makes a 9:16 clip, a wide photo
  makes a 16:9 clip.

## 2. Pick the model

Read [`vsb-video`](../vsb-video/SKILL.md) with `get_skill`, at "Picking a
model". Then use this short rule:

- **A first try, or a product shot:** `video/p-video` or `video/p-video-2`
  with the photo as `image`. Fast and low in cost.
- **People, hands, or a hard motion:** `video/seedance-2.0-mini` with the
  photo as `image`. It holds faces and hands better.
- **Speech:** this is not the right skill. Read `vsb-talking-avatar`.

## 3. Write the prompt

Describe only the motion and the camera. The photo already holds the look.

- Name one motion: "steam rises from the cup", "she turns her head and
  smiles", "the camera pushes in slowly".
- Add what must not change: "The product keeps its exact shape, colour and
  label."
- Leave out new objects, new text and scene changes. They make the model
  redraw the photo.

## 4. Price, run, show

1. Call `estimate_cost` with the model and the inputs. Tell the person the
   price and wait for their yes.
2. Run the model with the photo `url`, the prompt, the aspect ratio and a
   duration of 5. Pass the agreed price as `approved_cost_usd` where the
   tool asks for it. Name the work with `sandbox_name`.
3. Call `show_media` with the job id at once. The card shows the percent and
   then plays the clip.
4. When the person wants to judge it yourself, call `get_job` after
   `eta_seconds`. It returns four frames of the clip.

## Rules

- One clip per request unless the person asks for more.
- When the label or the face changes, say so. Offer a second run with a
  smaller motion, not a longer clip.
- To make it vertical later, or to add music, read `vsb-edit-video`.
