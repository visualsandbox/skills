---
name: vsb-setup
description: >
  Get a new person started with Visual Sandbox over the MCP tools, in ChatGPT,
  Claude or any other chat client, one step per message. Trigger right after
  the plugin is installed, when the person says "set up Visual Sandbox",
  "what can you make", "get started", "how does this work", or when the first
  tool call says the account is not connected. Checks the connection, turns
  the person's photos, product, logo or website into saved anchors, makes one
  preview keyframe, a first 5-second video and three voice takes, then opens
  the canvas. Every step is optional. Uses the MCP tools only, never a shell.
license: Proprietary. See LICENSE for the terms.
---

# Get started with Visual Sandbox

Visual Sandbox runs image, video, audio, 3D and vector models on the person's
account. Each run is charged to that account. This skill takes a new person
from "installed" to a first video they like.

**One step for each message.** Do one step, show the result, and ask one
question. Every step is optional: when the person wants to skip one, skip it.
Use the MCP tools only. There is no shell and no CLI on this surface.

## 1. Check the connection

Call `get_balance`.

- **It answers.** The account is connected. Go on.
- **It refuses with "Authorization is required".** Tell the person to open
  the plugin settings, press Connect and sign in to Visual Sandbox. Stop until
  they come back.
- **It refuses with `email_unverified`.** Tell the person to confirm the
  address from the Visual Sandbox email. Generation waits until they do.

When `balance_usd` is zero, say that runs are charged to the account and that
credit is added on visualsandbox.com. Do not quote a price for credit, and do
not offer to buy it.

## 2. Ask what to make first

Say in one sentence what the plugin makes: videos, ads, voiceovers, product
photos, music, logos and pages. Then ask what they want to make first, and
ask for what they have:

- a photo of themselves or of a person in the work,
- a product photo,
- a logo or a website,
- a script or an idea.

## 3. Turn their files into anchors

An anchor is saved once and used in every later run. Make only the ones that
the work needs.

- **A file in the chat** goes to `upload_media` as `file`. In ChatGPT, when
  nothing is attached, `import_media` opens a card where they pick a file.
- **A person or a mascot:** a character sheet, then `create_character`. See
  [`vsb-characters`](../vsb-characters/SKILL.md).
- **A website or a logo:** a brand theme with `extract_theme`, checked by the
  person before it is saved. See
  [`vsb-library-themes`](../vsb-library-themes/SKILL.md).
- **A product photo:** name it with `update_asset`, such as `acme-mug`, so
  later runs find it.

## 4. One preview keyframe

Make one image at the shape of the video they want (9:16 for Reels and
TikTok, 16:9 for YouTube). It is the first frame of the video. Read
[`vsb-image-prompting`](../vsb-image-prompting/SKILL.md) before the prompt.
Use the anchors as references.

Show it and ask: "Is this the look?" Change it until they agree. Make no
video before they agree.

## 5. A first 5-second video

1. Pick the cheapest video model that takes a first frame. Call
   `estimate_cost` and say the price.
2. Run it with the approved keyframe as the first frame, 5 seconds, at the
   keyframe's shape. Read [`vsb-video`](../vsb-video/SKILL.md) for the model.
3. In Review mode a run of 10 cents or more waits for the person's press of
   Generate: show the card, or give the review link. Never press for them.

## 6. Three voices, while the video renders

Ask whether the work needs a voice. When it does:

1. Run `audio_elevenlabs_voice_design` with a description of the voice,
   `auditions: 3`, and a sample line of 100 to 400 characters in the
   person's own words. That costs a few cents.
2. In ChatGPT, call `voice_studio` with the job id. The person hears the
   three takes and saves one to a character. Elsewhere, give the share link
   and ask which take they like.

## 7. Offer what is still missing

Offer one of these, the one that fits the work:

- their own likeness, from a photo of them,
- their own voice, cloned with their consent
  ([`vsb-clone-voice`](../vsb-clone-voice/SKILL.md)),
- a brand theme, when the work is for a brand.

## 8. Open the canvas

Give the `sandbox_url`. Every result is on that canvas. Then suggest two or
three next prompts that build on what they made, such as "Make this into a
10-second ad with a voiceover" or "Cut three vertical clips from my podcast".

## Rules

- Every run costs money. Never run twice to check a result you have:
  `get_job` returns the image, or four frames of a video.
- One request is one paid attempt. Ask before another take.
- Send the same `sandbox_name` on every run in the setup.
- When a run is refused for want of credit, say the balance is too low, and
  follow the server instructions about credit.
