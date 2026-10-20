---
name: vsb-ad-variations
description: >
  Make several versions of one image ad to test against each other with the
  Visual Sandbox MCP tools: the same product and offer, with a different
  hook, scene, person or layout in each version. Trigger when the person
  asks for "ad variations", "versions to A/B test", "more creatives",
  "different hooks", "5 ads for Meta", "new angles for this ad" or sends one
  ad and asks for more like it. Changes one thing per version, so a test
  says which thing worked. Uses the MCP tools only.
license: Proprietary. See LICENSE for the terms.
---

# Ad variations to test

An ad test only teaches something when each version changes one thing. This
skill takes one ad, or one product, and makes 3 to 6 versions that differ in
one named way.

Use the MCP tools only.

## 1. Get the base

- **An ad they already have.** Use it as the reference image. Pass a public
  `https` URL. Give an ad attached in the chat, or a local file, to
  `upload_media` first.
- **Only a product.** Make the base ad first with
  [`vsb-product-photoshoot`](../vsb-product-photoshoot/SKILL.md), then come
  back here.

Ask where the ads run. Use 4:5 for a Meta feed, 9:16 for Stories, Reels and
TikTok, and 1:1 when they do not know.

## 2. Pick the one thing that changes

Propose one axis and let the person pick:

| Axis | The versions differ in |
|------|------------------------|
| Hook | The headline on the ad. The picture stays the same |
| Scene | The place: a kitchen, an office, outdoors, a studio |
| Person | Who holds or uses the product |
| Angle | The reason to buy: price, speed, quality, a feeling |
| Layout | Where the product, the headline and the space sit |

Write the versions as a short table first: the version number and the one
thing that changes. Show it before you spend.

## 3. Make the versions

1. Read [`vsb-image-prompting`](../vsb-image-prompting/SKILL.md) with
   `get_skill`. When the ad has text, read
   [`vsb-nano-banana`](../vsb-nano-banana/SKILL.md) too: it has the rules
   for words that render cleanly.
2. Call `list_models` with `modality: "image"` and `get_model` for the model
   you pick. Use the same model for every version.
3. Write one base prompt. For each version, change only the part for the
   axis. Keep every other word the same.
4. Call `generate` once for each version, with the same reference and the
   same `sandbox_name`, such as "Serum ad test".
5. Call `get_job` for each one after `eta_seconds`. Check every word on each
   ad. A misspelled headline is a failed version.

## 4. Hand them over

List the versions in the order of the table, each with its `share_url` and
the one thing it changes. Give the `sandbox_url` of the canvas, where they
sit side by side. Offer one next step: a short video of the version the
person likes, with [`vsb-video`](../vsb-video/SKILL.md).

## Rules

- One axis for each set. Two changes in one version make the test useless.
- Never invent a claim, a price, a discount or a review for the ad. Use only
  the words the person gave you.
- Call `estimate_cost` before a set of more than six versions, and say the
  total.
- When a run is refused for want of credit, say the balance is too low, and
  follow what the server instructions say about credit.
