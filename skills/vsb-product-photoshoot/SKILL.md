---
name: vsb-product-photoshoot
description: >
  Make a set of product photos from one photo of the product with the Visual
  Sandbox MCP tools: hero shots, lifestyle scenes, flat lays and ad images
  that keep the product the same in every picture. Trigger when the person
  asks for "product photos", "a product shoot", "photos for my store",
  "Amazon or Shopify images", "lifestyle shots of my product", "a hero
  image", or sends a product photo and asks to make it look professional.
  Uses the MCP tools only.
license: Proprietary. See LICENSE for the terms.
---

# A product photo shoot

One photo of the product goes in. A set of pictures comes out, and the
product looks the same in all of them: the same shape, the same colour and
the same label.

Use the MCP tools only.

## 1. Get the product

- Ask for one clear photo of the product, if the person sent none. A phone
  photo on a plain table is enough.
- Pass a public `https` URL straight to `generate`. For a local file, call
  `upload_media` with a base64 data URI and use the URL it returns.
- Ask where the pictures go: a store page, an ad, or social media. That sets
  the shape: 1:1 for a store, 4:5 or 9:16 for social media, 16:9 for a
  banner.

## 2. Plan the set

Propose four shots and let the person change the list before you run:

| Shot | What it shows |
|------|---------------|
| Hero | The product alone on a clean background, with soft studio light |
| Lifestyle | The product in use, in the place a buyer uses it |
| Detail | A close view of the texture, the material or the label |
| Flat lay | The product from above, with two or three props that fit it |

## 3. Run the first shot

1. Read [`vsb-image-prompting`](../vsb-image-prompting/SKILL.md) with
   `get_skill`. Its reference section says what to keep from the photo and
   what to drop, such as the old background and the old light.
2. Call `list_models` with `modality: "image"`. Pick an edit model that takes
   a reference image. Read [`vsb-nano-banana`](../vsb-nano-banana/SKILL.md)
   when you pick a Nano Banana model.
3. Call `get_model`, then `generate` with the photo as the reference. Name
   the work with `sandbox_name`, such as "Candle product shoot".
4. Call `get_job` after `eta_seconds`. Compare the product with the photo:
   the shape, the colour and every word on the label.

Run the hero shot first and show it. Run the other shots only after the
person approves the look.

## 4. Run the rest of the set

- Use the same model and the same reference on every shot.
- Start every prompt with the same sentence that describes the product, so
  the product stays the same.
- Send the same `sandbox_name` on every call, so the set lands on one canvas.

## 5. Hand it over

Give one `share_url` for each picture and the `sandbox_url` for the set.
Offer one next step: ad variations of the hero shot with
[`vsb-ad-variations`](../vsb-ad-variations/SKILL.md), or a short video of it
with [`vsb-video`](../vsb-video/SKILL.md).

## Rules

- Never change the product. A changed label or shape is a failed shot, even
  when the picture looks good. Say so and run the shot again.
- Never add a logo, a price or a claim that the person did not give you.
- When a run is refused for want of credit, say the balance is too low, and
  follow what the server instructions say about credit.
