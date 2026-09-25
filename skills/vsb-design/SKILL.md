---
name: vsb-design
description: >
  Make designs on the Visual Sandbox canvas with `vsb design` (or the
  `create_design` MCP tool): web pages, app screens, cards, posters and vector
  drawings, organized in named layers like a Figma file, and exported as HTML,
  React, SVG or PNG. Trigger when the user wants to "design a page", "mock up
  a screen", "make a landing page / hero / card", "make this UI" or
  "rebuild this page" from a screenshot, "draw a picture or an
  illustration in code", "make an SVG by drawing it", "put a design on the
  canvas", "export it to React", or points at a layer they picked on the
  canvas ("change this button"). Free: nothing is generated and nothing is
  billed.
license: Proprietary. See LICENSE for the terms.
---

# Design on the canvas

A design is **one HTML document on the canvas**, drawn at 1:1 like a frame in
Figma. A page, a screen and a card are HTML and CSS. A drawing is one `<svg>`.
**A layer is an element with a `data-name` attribute**, and the layer tree is
how those elements nest. The person sees the tree beside the canvas, hovers a
layer to outline it, and picks one to point at it.

The canvas, the HTML export and the React export are drawn by the same
browser engine from the same document, so they match pixel for pixel.

```bash
vsb design new hero.html --name "Landing hero" --width 1440 --height 900
vsb design export "Landing hero" -f png -o hero.png   # look at it, then fix it
vsb design update "Landing hero" hero.html --version 1
vsb design export "Landing hero" -f react             # landing-hero.jsx
```

## The loop

1. Write the file: `page.html`, or `drawing.js` for a drawing. Build a page
   with more than one section in sections (see below).
2. `vsb design new <file> --name "<what it is>" --width <px> --height <px>`.
3. `vsb design export <design> -f png -o check.png`, and **look at the PNG**.
   Read it with your image tool. Never report a design you have not looked at.
   Read the `warnings` the write printed too.
4. Fix what is wrong, then `vsb design update <design> <file> --version <n>`.
5. Give the person the canvas link the command printed.

`<design>` is the node uuid or the design's name. `--version` is the version
you last read. When the person changed the design since, the write is refused
with a 409: read it again (`vsb design get`) and apply your change to that.

**The person edits by hand too.** On the canvas they reorder layers inside
auto layout and by dragging rows in the layer tree, move and resize layers
(with snapping), type into text, rename and delete layers, set auto layout
and Fixed / Hug / Fill in a panel, align layers in their frame, resize the
artboard, and undo with Cmd+Z. A hand move is a `translate`, and a resize is
`width` and `height`, in the layer's `style`. Keep what they did: read the
design before you change it, and always pass `--version`.

## Build a page in sections

The canvas shows each write in less than two seconds. Put a page on it one
section at a time, so the person sees it grow and can stop you early.

1. Write the outline: the whole `<style>` block, the root, and one empty
   frame for each section, each with its `data-name`.
2. `vsb design new outline.html`, then give the person the canvas link.
3. Write the sections from top to bottom, one file each. The root element
   of the file carries the `data-name` of its section.
4. `vsb design update Home hero.html --layer Hero --version <n>` for each
   section. Each write adds one to the version.
5. Export the PNG after the last section, and look at it.

```html
<style>
  /* Every class of every section. A layer write replaces only its element,
     so this block stays as the outline wrote it. */
</style>
<div class="page" data-name="Home">
  <nav class="nav" data-name="Nav"></nav>
  <section class="hero" data-name="Hero"></section>
  <section class="features" data-name="Features"></section>
  <footer class="footer" data-name="Footer"></footer>
</div>
```

A card, a screen or a drawing is one write. Over MCP, the order is the same:
`create_design`, then `update_design` with `layer`.

## Commands

| Command | Does |
|---|---|
| `vsb design` | List the designs on this canvas |
| `vsb design new <file>` | Put a design on the canvas. `.html`, `.svg`, a `.js` drawing, or `-` for stdin |
| `vsb design layers [design]` | Print the layer tree, with each layer's index and kind. The picked layer is marked |
| `vsb design get [design]` | Print the HTML. `--layer <path>` prints one layer, `--layer picked` the one the person picked. `-o file` writes it |
| `vsb design update <design> <file>` | Replace the design. `--layer <path>` replaces one layer only |
| `vsb design move <design> --layer <path> --before\|--after\|--into <path>` | Rearrange: move one layer to another place. Nothing else is rewritten |
| `vsb design export [design] -f html\|react\|svg\|png` | Save a file. `--scale 2` for a retina PNG. PNG needs Chrome. `--layer <path>` saves one frame alone as html |
| `vsb design delete <design>` | Delete the design and its node. No undo, so name the design; it never means the picked one |

`[design]` may be left out on the commands that read: it is then the design
the person picked or selected on the canvas.

A layer is found by its index (`12`), its path (`Hero/Body/CTAs`), the end of
its path (`Body/CTAs`), or its name (`CTAs`). Two layers with the same name is
an error that lists both: pass the index or a longer path.

## Layers: every part a person can see

The layer tree is how the person reads your design and how they tell you what
to change, so name it the way a designer names a Figma file.

- **Every part a person can see is its own layer:** each shape, each line,
  each dot, each icon, each piece of text. Three tick marks are three layers,
  not one layer that holds three unnamed `<i>` elements.
- **A shape with words in it is two layers:** the shape, and a text layer
  inside it. Write `<a data-name="Primary"><span data-name="Text">Buy</span></a>`,
  not `<a data-name="Primary">Buy</a>`. The same goes for a key and its
  legend, a pill and its label, a keycap and its letter.
- **Never draw with `::before` or `::after`.** A pseudo-element is not a
  layer, so the person cannot pick it. Draw the part as an element.
- Leave a name off only a wrapper that does layout and draws nothing, and a
  run of words inside one line (an `<em>` in a headline).
- **Nest the names the way the design is built:** `Hero` holds `Nav` and
  `Body`, `Body` holds `Copy` and `IDE`, `Copy` holds `Headline` and `CTAs`.
- **Use short nouns in title case:** `Headline`, `Primary`, `Logos`, `Price`.
  Name by role, not by look: `Primary`, not `Orange button`.
- A landing page has 100 layers or more. That is correct.

**Every write answers with `warnings`:** each part that is drawn but is not a
layer. Name each one and update the design before you report it.

The kind comes from the element: an element with its own words is `text`, an
`<img>` is `image`, an SVG shape is `vector`, an SVG `<g>` is `group`, and
anything else that holds layers is `frame`.

## Auto layout: build every frame with flexbox

The canvas reads flexbox and grid as auto layout, the way Figma does. The
person resizes a button and expects its label to stay in the middle, so lay
the design out with flexbox, not with coordinates.

- **The page is a column, and each row is a row.** The root is
  `display: flex; flex-direction: column`. A nav with centred links is a
  three-column grid: `grid-template-columns: 1fr auto 1fr`.
- **A button centres what is in it:** `display: flex; align-items: center;
  justify-content: center`. The same goes for a badge, a key and a tag.
- **A box with words in it hugs them:** size a button, a badge, a tag or a
  card with `padding`, never a px `width`. The layout panel shows it as Hug,
  and it grows and shrinks with its text. Give a px size only to a part
  whose size is fixed by what it shows: a keycap, an icon, an artboard.
- **A part with a face inside it pads the face.** For a keycap, write
  `display: flex; padding: 3px 26px 40px 11px` on the cap and `flex: 1` on
  the face, not `position: absolute` on the face.
- **Space siblings with `gap`.** Use a margin only where one distance is
  different from the others.
- **Use `position: absolute` only for a part that floats free:** a sticker, a
  tilted illustration, a decoration that overlaps other parts. To nudge a
  part in a row, use `translate`, the same as a hand move on the canvas.

## Write the HTML so it draws the same everywhere

- **Send the body, not a page:** a `<style>` block, then one root element the
  size of the artboard. `vsb` wraps it in the page. A full page also works.
- **Style the root element, not `body`.** The React export has no `<body>`,
  so a `body { }` rule does not reach it.
- **Set `font-family` on the root.** Load web fonts with an `@import` from
  Google Fonts as the first line of the `<style>` block.
- **Use `px` at the artboard size.** Set `box-sizing: border-box` on the root
  and its descendants.
- **Classes in the `<style>` block, not Tailwind.** Nothing runs in a design,
  so Tailwind classes resolve to nothing.
- **No scripts, no forms, no event handlers.** Nothing runs; the export drops them.
- **Images by `https` URL.** Generate a picture with `vsb run` first, then put
  its URL in an `<img>` layer. A logo or an icon can be an inline `<svg>`: name each shape in it.

Common artboards: 1440 × 900 (desktop hero), 1440 × 3200 (desktop page),
390 × 844 (phone screen), 1080 × 1080 (square post), 1080 × 1350 (portrait post).

## Auto layout: Figma's words in CSS

Auto layout is flexbox. The person's layout panel writes exactly this, so
write the same when they ask in Figma's words:

| They say | Write |
|---|---|
| Auto layout, horizontal / vertical | `display: flex; flex-direction: row` / `column` |
| Wrap | `flex-wrap: wrap` |
| Spacing between items | `gap: 16px` |
| Padding | `padding: 24px 32px` |
| Align (the 3 × 3 grid) | `justify-content` along the flow, `align-items` across it |
| Space between | `justify-content: space-between` |
| Hug contents | `width: fit-content`, and `flex: none` along a flex parent's flow |
| Fill container | along the parent's flow `flex: 1 1 0; min-width: 0`; across it `align-self: stretch`; with no auto layout `width: 100%` |
| Fixed width | `width: 240px`, and `flex: none` along the flow |
| Align left / centre / right in the frame | the frame's alignment; or `align-self` across the flow, `margin: auto` along it |
| Absolute position | avoid it: it is a `translate` in code. Change the layout instead |

Build every page from auto layout frames, not from offsets: then the
person's drags reorder the layers, the export reads like hand-written CSS,
and nothing breaks when a text grows. A `translate` on a layer is a hand
move the person made; keep it unless they ask.

## Change one layer

Read the layer, change it, and write back only it. The rest of the document
stays byte for byte, and a big design does not travel twice.

```bash
vsb design get "Landing hero" --layer CTAs -o ctas.html
# edit ctas.html — keep data-name="CTAs" on its root element
vsb design update "Landing hero" ctas.html --layer CTAs --version 4
```

The file replaces the whole layer element, the tag with its `data-name`
included. To add a layer, replace its parent. To delete one, replace it with
an empty file.

## What the person picked

The person picks a frame on the canvas: a double-click on it, or a click on
its row in the layer tree. "Make this bigger", "change this", "move this
under the headline" mean that frame.

```bash
vsb design get --layer picked -o part.html   # the picked frame, from the selected design
# prints: Wrote part.html  layer Hero/Body/CTAs, v7
vsb design update <design> part.html --layer Hero/Body/CTAs --version 7
```

Read with `picked`, then **write to the path the read printed, never to
`picked`**: the person may pick another frame while you work, and a write to
`picked` would land on it. The server refuses `picked` in a write.
`vsb sandbox selection --json` shows the same pick as `layer`.

## Rearrange

Move a layer to another place without rewriting its parent:

```bash
vsb design move Home --layer Hero/Logos --before Hero/CTAs --version 7
vsb design move Home --layer Footer/Links --into Hero/Nav --version 8
```

`--before` and `--after` put it beside another layer; `--into` puts it last
inside one. Only the layer's place in the HTML changes, so in a flex or grid
box the layout reflows around it. A layer cannot move into itself.

## Drawings

A `.js` file is a drawing. Its default export gets a Canvas 2D context, and
`vsb` records every call as SVG, so the result is a vector file that you can
also draw on a `<canvas>`. The file runs on your machine; nothing runs on the
server.

```js
export const width = 1080, height = 1080, name = "Cat plate";
export default function draw(g, { layer }) {
  layer("Background", () => { g.fillStyle = "#e7c9a2"; g.fillRect(0, 0, width, height); });
  layer("Cat", () => { layer("Head", drawHead); layer("Body", drawBody); });
}
```

`layer(name, fn)` wraps what `fn` draws in `<g data-name>`: a layer on the
canvas. Read [references/drawing.md](references/drawing.md) before the first
drawing. It has the calls that work, the ones that are refused, and the craft
that makes a code drawing look drawn by hand.

**Pick the tool by the job.** A page or a screen is HTML: the browser lays it
out. An illustration with many organic shapes is a `.js` drawing: math makes
the geometry. An icon or a logo is a hand-written `<svg>`, or a vector model
(see `vsb-vector`). Never type long SVG path data by hand for organic shapes;
compute it.

## Exports

| Format | What it is |
|---|---|
| `html` | The page exactly as the canvas draws it. Open it in a browser |
| `react` | One component in a `.jsx` file. The same pixels at the same size |
| `svg` | The drawing, when the design is one `<svg>` element |
| `png` | A screenshot through the local Chrome. `--scale 2` doubles the pixels |

`--layer <path>` (or `--layer picked`) saves one frame alone as an html
page: the hero, the nav, one card. The frame keeps the styles, fonts and
CSS variables it gets from the frames above it, and its place in its
parent (margin, translate, offsets) goes. Take a frame this way when the
person wants one part of a design as code.

Over MCP, the tools are `create_design`, `get_design` (`layer: "picked"`
reads the pick), `update_design`, `move_layer`, `export_design` and
`delete_design`;
`export_design` has no `png`, and takes `layer` for one frame.
