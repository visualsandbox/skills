# Drawing with code

A drawing is Canvas 2D code that `vsb` records as SVG. You write geometry with
math, and the SVG keeps every shape as a vector. This page says what works,
what does not, and how to make it look drawn by a hand, not by a machine.

## The file

```js
// cat.js
export const width = 1080, height = 1080, name = "Cat plate";

export default function draw(g, { layer }) {
  layer("Wall", wall);
  layer("Cat", () => {
    layer("Body", body);
    layer("Head", head);
  });
  layer("Label", label);
}
```

- `width`, `height` and `name` are optional. The size defaults to 1080 × 1080.
  `--width`, `--height` and `--name` on the command win over them.
- `draw` may be `async`. It may import other files beside it.
- The same function draws on a real `<canvas>` if you pass a 2D context and a
  `layer` that runs `g.save(); fn(); g.restore()`.

## Calls that work

Paths (`beginPath`, `moveTo`, `lineTo`, `quadraticCurveTo`, `bezierCurveTo`,
`arc`, `arcTo`, `rect`, `ellipse`, `closePath`), `fill`, `stroke`, `clip`,
`fillRect`, `strokeRect`, `clearRect`, `fillText`, `strokeText`, `save`,
`restore`, `translate`, `rotate`, `scale`, `transform`, `setTransform`,
`createLinearGradient`, `createRadialGradient`, `setLineDash`, and the style
properties (`fillStyle`, `strokeStyle`, `lineWidth`, `lineCap`, `lineJoin`,
`globalAlpha`, `font`, `textAlign`, `textBaseline`).

## Calls that do not

| Call | Why | Instead |
|---|---|---|
| `getImageData`, `putImageData`, `createImageData` | An SVG has no pixels. Refused with an error | Draw texture as shapes: dots, short strokes |
| `globalCompositeOperation` | Not recorded | Draw in order: back first, front last |
| `filter`, `shadowBlur`, `shadowColor` | Not drawn | Draw the shadow as a shape with alpha |
| `measureText` | Gives an estimate only | Place text by hand, or avoid layouts that need exact widths |
| `drawImage` | There is no image or canvas to draw from here | Draw the shapes, or put the picture in an HTML design as an `<img>` layer |

## Craft: make it look drawn

These come from drawings that worked (`~/Playground/fruit-fly-plate/STYLE.md`
has the full style of one).

- **Compute the geometry.** Build each shape as a list of points: an ellipse
  with a small wobble in its radius, a band of varying width along a line, a
  closed shape through six key points rounded with a few passes of Chaikin's
  corner cutting. Then draw the points with `quadraticCurveTo` through the
  midpoints. Never guess coordinates for an organic shape.
- **Two random sources, both seeded** (mulberry32). One places things and
  never changes; one shakes the lines. Reset both at the start of `draw`, so
  every run makes the same drawing and the same SVG.
- **An ink line is two strokes:** the full width, then a thin pass at 45 % of
  the width with twice the shake. The width looks uneven, like a pen.
- **Shade with hatching, not gradients.** A tone function gives the darkness
  at each point from the light direction. Each hatch layer draws only where
  the tone passes its threshold, and turns about 60° from the last, so dark
  areas cross-hatch.
- **Texture with many short strokes** in two or three tints that follow the
  form: fur along its flow, juice sacs out from a centre.
- **Draw back to front:** background, cast shadow, far parts, body, near
  parts, face, construction lines, paper specks.
- **One layer per part** a person would point at: `Head`, `Tail`, `Yarn`.

## Keep the file small

A drawing with fur and hatching is about 1.2 MB. The limit is 8 MB.

- `vsb` rounds path numbers to 0.01 px, which halves the file.
- **Put many strokes in one path:** `beginPath()`, a hundred `moveTo` and
  `lineTo` pairs, one `stroke()`. One path per tint, not one per stroke.
- Clip once around a group of strokes, not once per stroke.

## Look at it

```bash
vsb design new cat.js
vsb design export "Cat plate" -f png -o cat.png   # then read cat.png
```

Fix what reads wrong at full size and at a quarter size, then
`vsb design update "Cat plate" cat.js --version <n>`.
