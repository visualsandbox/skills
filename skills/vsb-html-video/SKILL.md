---
name: vsb-html-video
description: >
  Write HTML and render it into a video or a picture with the Visual Sandbox
  MCP tools render_html_video and render_html_image: motion graphics, kinetic
  type, an animated explainer, a title card, lower thirds, a logo sting, a
  social card, a quote card or a thumbnail with exact text. Trigger when the
  person asks for "motion graphics", "kinetic typography", "an animated
  explainer", "a title card", "an intro", "a lower third", "a logo
  animation", "a social card with this text" or a design that must move.
  Covers the composition contract, the render clock, GSAP timelines, sound,
  the limits, and how to check a render. Free. Uses the MCP tools only.
license: Proprietary. See LICENSE for the terms.
---

# HTML to video

You write one HTML document. The renderer plays it in headless Chromium on a
clock that it moves frame by frame, so every frame is drawn at an exact time
and the same HTML always gives the same video. Both tools are free.

Use this pack only when the person asks for designed motion or exact text.
For filmed footage, a person or a real place, use a video model instead
([`vsb-video`](../vsb-video/SKILL.md)).

## The two tools

| Tool | Gives | Inputs |
|------|-------|--------|
| `render_html_video` | An MP4 | `html`, `width`, `height` (even, 16 to 1920), `duration` (up to 60 s), `fps` (24, 30 or 60) |
| `render_html_image` | A PNG | `html`, `width`, `height`, `time` (the moment to draw), `transparent` |

Each returns a job id. Call `show_media` with it, or `get_job` when it is
done. The result's `metrics.warnings` lists blocked requests and script
errors. Read them before you report the result.

## The composition contract

1. Set a fixed pixel size on `html` and `body`, the same as `width` and
   `height`. Use `overflow: hidden`.
2. Make every frame a function of the time alone. The renderer replaces
   `Date`, `performance.now`, `requestAnimationFrame`, `setTimeout` and
   `setInterval` with its own clock, and seeds `Math.random`. Do not read
   the real time in any other way.
3. Animate with one of these. All of them follow the render clock:
   - CSS animations and transitions.
   - The Web Animations API (`element.animate`).
   - A GSAP timeline, created paused and registered after the setup:
     `window.__timelines = { main: tl }`. The renderer seeks it to each
     frame's time.
   - `requestAnimationFrame`, with the time from its argument.
4. Never use an infinite loop that does not depend on the time, such as a
   `while` loop that waits for a load.
5. Load fonts, pictures, footage and libraries from public `https` URLs.
   A private, local or link-local address is blocked, and the block shows in
   the warnings.
6. Put footage in `<video muted playsinline src="…" data-start="2">`. The
   renderer seeks it to the frame's time minus `data-start`.
7. Add sound with `<audio src="…" data-start="0" data-duration="8"
   data-volume="0.8">`. Up to 8 tracks of up to 50 MB each. The renderer mixes
   them after the frames. A narration from `audio_elevenlabs_tts` works here.

## A skeleton

```html
<!doctype html>
<html><head><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@800&display=swap" rel="stylesheet">
<style>
  html, body { margin: 0; width: 1080px; height: 1920px; overflow: hidden; background: #0B0B0F; }
  h1 { font: 800 140px/1 Inter, sans-serif; color: #fff; position: absolute; top: 760px; left: 80px; }
</style>
<script src="https://cdn.jsdelivr.net/npm/gsap@3.12.5/dist/gsap.min.js"></script>
</head><body>
<h1 id="title">Launch day</h1>
<audio src="https://cdn.visualsandbox.com/…/voice.mp3" data-start="0.5"></audio>
<script>
  const tl = gsap.timeline({ paused: true });
  tl.from("#title", { y: 120, opacity: 0, duration: 0.8, ease: "power3.out" })
    .to("#title", { scale: 1.06, duration: 3 }, 0.8);
  window.__timelines = { main: tl };
</script>
</body></html>
```

## How to work

1. Agree the size, the length and the words with the person. Keep one idea
   for each scene, and 2 to 4 seconds for each scene.
2. Read the brand with `get_theme` when the work is for a brand. Use its
   colors and fonts in the CSS, and its logo URL in an `<img>`.
3. Render one still first with `render_html_image` at the busiest moment
   (`time`). It is fast. Fix the layout before the video.
4. Render the video. 30 fps for graphics, 24 for a film look.
5. Look at the result before you report it: `get_job` returns four frames of
   the video.

## Limits

- Up to 60 seconds, 16 to 1920 pixels on each side, 2 MB of HTML.
- Up to 50 video renders and 200 picture renders a day for each account.
- A render stops after 8 minutes. Long footage or many heavy effects take
  longer to render.

## Rules

- Write the text the person gave, word for word. Check the spelling.
- Never put a password, a key or private data in the HTML. The renderer has
  no secrets, but the HTML is kept with the job.
- A failed render costs nothing. Read the error and the warnings, fix the
  HTML, and render again.
