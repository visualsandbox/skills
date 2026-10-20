---
name: vsb-ugc-ad
description: >
  Make a creator-style UGC video ad for a product with the Visual Sandbox MCP
  tools: a vertical 9:16 clip of one person who shows, uses or talks about
  the product, for TikTok, Instagram Reels or YouTube Shorts. Trigger when
  the person asks for a "UGC ad", "creator ad", "testimonial video",
  "unboxing video", "talking head ad", "TikTok ad for my product" or "a
  person holding my product". Plans a script, approves the first frame as an
  image, then animates it with speech. Uses the MCP tools only.
license: Proprietary. See LICENSE for the terms.
---

# A UGC video ad

A UGC ad looks like a real person filmed it on a phone. One person, one
product, one message, 9:16, 5 to 15 seconds. The person talks to the camera,
or shows the product while a voice talks.

Use the MCP tools only. Video is the expensive part, so this skill makes the
look right as a still image first, and spends on video once.

## 1. Get the brief

Ask only for what is missing. Never ask more than three questions.

- **The product.** A photo is best. Pass a public `https` URL. Give a photo
  attached in the chat, or a local file, to `upload_media` first.
- **The hook.** The one thing the ad must say, such as "it fixed my skin in
  a week".
- **The format.** Pick one: a talking head, a selfie walk-and-talk, an
  unboxing, or a before-and-after. When the person does not say, use a
  talking head.

## 2. Write the script

Write 2 to 4 short lines that one person can say in the clip length. About
2.5 words fit in one second.

- Line 1 is the hook. It names the problem or the result.
- The middle line shows the product in use.
- The last line tells the viewer what to do.

Do not use dashes in the spoken lines. A speech model reads a dash badly.
Write numbers as words. Show the script to the person before you spend.

## 3. Make the first frame as an image

1. Read [`vsb-ugc-people`](../vsb-ugc-people/SKILL.md) with `get_skill`. It
   has the two UGC formats, the slot order and the words that stop a face
   from looking plastic.
2. Call `list_models` with `modality: "image"` and pick the model that pack
   recommends. Call `get_model` for its fields.
3. Call `generate` at 9:16 with the product photo as a reference. Name the
   work with `sandbox_name`, such as "Serum UGC ad", and send that same name
   on every later call.
4. Call `get_job` after `eta_seconds` and look at the frame. Check the hands,
   the label on the product and the face.
5. Show the frame. Change it until the person approves it.

## 4. Animate it with speech

1. Read [`vsb-video`](../vsb-video/SKILL.md) with `get_skill`, at the section
   "People who talk". It says which model speaks in one pass and which needs
   a voice track first.
2. Call `list_models` with `modality: "video"`. Pick an image-to-video model
   that speaks, from that section.
3. Call `get_model`, then `estimate_cost`. Tell the person the price and wait
   for a yes.
4. Call `generate` with the approved frame's URL as the start image and the
   script as the spoken line.
5. Call `get_job` after `eta_seconds`. A video takes one to three minutes.
   `get_job` returns four frames, so check them before you report.

When the person wants one voice across several clips, make the voiceover
first with [`vsb-audio`](../vsb-audio/SKILL.md) and follow the lip-sync path
in `vsb-video`.

## 5. Hand it over

Give the person the `share_url` of the video and the `sandbox_url` of the
canvas. Offer one next step: a second hook on the same frame, which costs one
video run and no new image.

## Rules

- One approved frame before any video run. A video costs many times more
  than an image.
- Never run a video twice to check it. Read the four frames `get_job` sends.
- Keep the product label sharp. If the model changes the label, say so and
  offer a new frame, not a new video.
- When a run is refused for want of credit, say the balance is too low, and
  follow what the server instructions say about credit.
