---
name: vsb-design
description: >
  Make designs on the Visual Sandbox canvas with `vsb design` (or the
  `create_design` MCP tool): web pages, app screens, cards, posters and vector
  drawings, organized in named layers like a Figma file, and exported as HTML,
  React, SVG or PNG. Trigger when the user wants to "design a page", "mock up
  a screen", "make a landing page / hero / card", "draw a picture or an
  illustration in code", "make an SVG by drawing it", "put a design on the
  canvas", "export it to React", or points at a layer they picked on the
  canvas ("change this button"). Free: nothing is generated and nothing is
  billed.
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

1. Write the file: `page.html`, or `drawing.js` for a drawing.
2. `vsb design new <file> --name "<what it is>" --width <px> --height <px>`.
3. `vsb design export <design> -f png -o check.png`, and **look at the PNG**.
   Read it with your image tool. Never report a design you have not looked at.
4. Fix what is wrong, then `vsb design update <design> <file> --version <n>`.
5. Give the person the canvas link the command printed.

`<design>` is the node uuid or the design's name. `--version` is the version
you last read. When the person changed the design since, the write is refused
with a 409: read it again (`vsb design get`) and apply your change to that.

**The person edits by hand too.** On the canvas they move and resize layers,
type into text, rename and delete layers, and resize the artboard. A move is
a `translate`, and a resize is `width` and `height`, in the layer's `style`.
Keep what they did: read the design before you change it, and always pass
`--version`.

## Commands

| Command | Does |
|---|---|
| `vsb design` | List the designs on this canvas |
| `vsb design new <file>` | Put a design on the canvas. `.html`, `.svg`, a `.js` drawing, or `-` for stdin |
| `vsb design layers <design>` | Print the layer tree, with each layer's index and kind |
| `vsb design get <design>` | Print the HTML. `--layer <path>` prints one layer. `-o file` writes it |
| `vsb design update <design> <file>` | Replace the design. `--layer <path>` replaces one layer only |
| `vsb design export <design> -f html\|react\|svg\|png` | Save a file. `--scale 2` for a retina PNG. PNG needs Chrome |

A layer is found by its index (`12`), its path (`Hero/Body/CTAs`), the end of
its path (`Body/CTAs`), or its name (`CTAs`). Two layers with the same name is
an error that lists both: pass the index or a longer path.

## Layers: name what a person would point at

The layer tree is how the person reads your design and how they tell you what
to change, so name it the way a designer names a Figma file.

- **Name every frame, text, button, image and icon** a person could point at.
  Leave out wrappers that only do layout, and every `<span>` inside a line.
- **Nest the names the way the design is built:** `Hero` holds `Nav` and
  `Body`, `Body` holds `Copy` and `IDE`, `Copy` holds `Headline` and `CTAs`.
- **Use short nouns in title case:** `Headline`, `Primary`, `Logos`, `Price`.
  Name by role, not by look: `Primary`, not `Orange button`.
- A page has 20 to 60 layers. A card has 5 to 15.

The kind comes from the element: an element with its own words is `text`, an
`<img>` is `image`, an SVG shape is `vector`, an SVG `<g>` is `group`, and
anything else that holds layers is `frame`.

## Write the HTML so it draws the same everywhere

- **Send the body, not a page:** a `<style>` block, then one root element the
  size of the artboard. `vsb` wraps it in the page. A full page also works.
- **Style the root element, not `body`.** The React export has no `<body>`,
  so a `body { }` rule does not reach it.
- **Set `font-family` on the root.** Load web fonts with an `@import` from
  Google Fonts as the first line of the `<style>` block.
- **Use `px` at the artboard size.** Set `box-sizing: border-box` on the root
  and its descendants. Use flexbox and grid; the browser does the geometry.
- **Classes in the `<style>` block, not Tailwind.** Nothing runs in a design,
  so Tailwind classes resolve to nothing.
- **No scripts, no forms, no event handlers.** Nothing runs; the export drops them.
- **Images by `https` URL.** Generate a picture with `vsb run` first, then put
  its URL in an `<img>` layer. A logo or an icon can be an inline `<svg>`.

Common artboards: 1440 × 900 (desktop hero), 1440 × 3200 (desktop page),
390 × 844 (phone screen), 1080 × 1080 (square post), 1080 × 1350 (portrait post).

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

```bash
vsb sandbox selection --json
```

`layer` holds the layer they picked inside the selected design, with its
`path`. "Make this bigger" means that layer: `vsb design get <node> --layer
<path>`, change it, and update that layer only.

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

Over MCP, the tools are `create_design`, `get_design`, `update_design` and
`export_design`; `export_design` has no `png`.
