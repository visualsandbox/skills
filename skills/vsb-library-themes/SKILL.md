---
name: vsb-library-themes
description: >
  Keep a brand and its media in Visual Sandbox with the MCP tools: read a
  brand's colors, fonts, logo and tone from its website into a saved theme,
  apply the theme to every later prompt, and find, name and tag results in
  the person's library so they can be used again. Trigger when the person
  says "use my brand", "set up my brand", "match our website", "our colors",
  "our logo", "find the picture we made last week", "use the approved
  keyframe", "name this", "tag these" or gives a website for branded work.
  Saves only values the person confirmed. Uses the MCP tools only.
license: Proprietary. See LICENSE for the terms.
---

# Brand themes and the library

A **theme** keeps a brand once: its colors, fonts, logos, notes and
reference pictures. The **library** is every result and upload on the
account, the same rows the person sees on visualsandbox.com. Both are free.

## Set up a brand

1. Ask for the website, or for the colors, fonts and logo.
2. Call `extract_theme` with the website. It reads the site on the server
   and proposes colors with roles, fonts, logos and the site's own
   description. It saves nothing.
3. Show the proposal to the person before you save it:
   - **In ChatGPT,** call `edit_theme` with the name and the proposal as
     `draft`. The card shows the swatches, fonts and logos. The person fixes
     what is wrong and presses Save. Do not call `update_theme` for it.
   - **Elsewhere,** list the colors (hex and role), the fonts and the logo,
     and ask what to change. Then call `update_theme` with the agreed values.
4. Never invent a brand value. A value that you guess is a proposal until the
   person agrees to it.

### The theme's shape

- Colors: `hex`, `name`, and a `role`: `primary`, `secondary`, `accent`,
  `bg`, `fg` or `muted`.
- Fonts: `name`, `source` (`google` or `custom`) and a `role`: `heading`,
  `body`, `mono` or `accent`.
- Logos: `url`, `name`, `variant` (`light`, `dark`, `mono` or `color`) and
  `has_background`.
- `notes`: the audience, the tone, the look, and what to do and never do.
- `images`: reference pictures. The first one is the thumbnail.

`update_theme` replaces each field it is given and keeps the rest. A new
`colors`, `fonts` or `logos` list replaces the whole list. The first theme on
an account is its default; `set_default` changes that.

## Apply a theme

Before any branded image, video, design or HTML render:

1. Call `get_theme` (no name gives the default theme).
2. Put the look into the prompt in words: the main colors by name and hex,
   the mood from `notes`, and every "never" rule.
3. Pass a logo or a reference picture as a reference image when the model
   takes one. Say in the prompt what to keep from it and what to ignore.
4. In HTML ([`vsb-html-video`](../vsb-html-video/SKILL.md)) and designs
   ([`vsb-design`](../vsb-design/SKILL.md)), use the hex values and the
   font names exactly.

## Find and name media

- `search_assets` finds results and uploads by words (`query`), `tags`,
  exact `name`, `type` (`image`, `video`, `audio`, `3d`, `vector`, `text`)
  and `source` (`generated` or `uploaded`). Each asset carries a `url` to
  pass to the next run.
- `update_asset` gives an asset a `name`, `tags` and a `description`. It
  takes the asset's id, its name or its file URL.

How to name:

- A name is a unique slug: `acme-launch-hero`, `acme-launch-hero-v2`.
- A derivative keeps the name and adds a suffix: `-cutout`, `-vertical`,
  `-upscaled`. The original stays.
- Keep tags few and stable: the brand (`acme`), the campaign
  (`launch-2026`), the kind (`logo`, `keyframe`) and the state (`approved`).
- `tags` replaces the whole list, so send the tags to keep as well.

Name a result when the person approves it, so a later chat finds it with
`search_assets` instead of a new paid run.
