---
name: vsb-setup
description: >
  Get a new person started with Visual Sandbox over the MCP tools, in ChatGPT,
  Claude or any other chat client. Trigger right after the plugin is
  installed, when the person says "set up Visual Sandbox", "what can you
  make", "get started", "how does this work", or when the first tool call
  says the account is not connected. Checks the connection and the balance,
  shows what the plugin makes, and walks the person from one image to a
  first video. Uses the MCP tools only, never a shell.
license: Proprietary. See LICENSE for the terms.
---

# Get started with Visual Sandbox

Visual Sandbox runs image, video, audio, 3D and vector models on the person's
account. Each run is charged to that account. This skill takes a new person
from "installed" to a first result they like, in four steps.

Use the MCP tools only. There is no shell and no CLI on this surface.

## 1. Check the connection

Call `get_balance`.

- **It answers.** The account is connected. Go to step 2.
- **It refuses with "Authorization is required".** The plugin is not
  connected. Tell the person to open the plugin settings and press Connect,
  then sign in to Visual Sandbox. Stop until they come back.
- **It refuses with `email_unverified`.** Tell the person to open the email
  from Visual Sandbox and confirm the address. Generation is blocked until
  they do.

## 2. Say what the account can do

Read `balance_usd` from step 1.

- **Above zero.** Say the account is ready, in one sentence.
- **Zero.** Say that each run is charged to the account, and that credit is
  added on visualsandbox.com. Do not quote a price for credit, and do not
  offer to buy it. You can still show models and estimate a run.

Then name what the plugin makes, in one short list, and ask what they want:

- Product photos and ad images from a photo of the product
- Short video ads, UGC-style clips and animated photos
- Voiceovers, music and sound effects
- Logos and icons as SVG, and web pages or cards in editable layers

## 3. Make the first result an image

An image is the fastest and cheapest first run. Even when the person asks for
a video, offer to make the first frame as an image, so they approve the look
before a video run.

1. Read [`vsb-image-prompting`](../vsb-image-prompting/SKILL.md) with
   `get_skill`.
2. Call `list_models` with `modality: "image"`. Pick the model the pack
   recommends. Never use a slug from memory.
3. Call `get_model` to read its input fields.
4. Call `generate` with a `sandbox_name` of two to five words that names the
   work, such as "Candle shop launch".
5. Wait `eta_seconds`, then call `get_job`. Look at the image before you
   describe it.
6. Give the person the `share_url` and the `sandbox_url`.

If the person sent a photo, use it as a reference. Pass a public `https` URL
to `generate`, or pass a local file to `upload_media` as a base64 data URI
and use the URL it returns.

## 4. Offer one next step

Offer the one step that fits what they made:

| They made | Offer |
|-----------|-------|
| A product photo | A product photo shoot, with [`vsb-product-photoshoot`](../vsb-product-photoshoot/SKILL.md) |
| An ad image | Variations to test, with [`vsb-ad-variations`](../vsb-ad-variations/SKILL.md) |
| A person for an ad | A UGC video ad, with [`vsb-ugc-ad`](../vsb-ugc-ad/SKILL.md) |
| Any still they like | A short video of it, with [`vsb-video`](../vsb-video/SKILL.md) |
| A script | A voiceover, with [`vsb-audio`](../vsb-audio/SKILL.md) |

Before any video run, call `estimate_cost` and tell the person the price. A
video costs many times more than an image.

## Rules

- Every `generate` costs money. Never run twice to check a result you have.
  `get_job` returns the image, or four frames of a video, so you can look.
- Send the same `sandbox_name` on every `generate` in one task.
- When a run is refused for want of credit, say the balance is too low and
  that credit is added on visualsandbox.com.
