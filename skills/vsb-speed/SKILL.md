---
name: vsb-speed
description: >
  Bend time in a clip with `vsb video speed` — slow motion, fast motion, speed
  ramp, motion blur, low shutter, freeze frame, reverse, boomerang,
  stutter, step printing, stop motion and a seamless infinite loop.
  Trigger when the user wants to "slow this down", "speed it up",
  "reverse it", "make it loop", "freeze on that", "add motion blur",
  "boomerang this", or names any time-and-motion technique. Runs locally
  through ffmpeg: free, nothing uploaded. Pair with `vsb-video` for
  generating the clip and `vsb-cut` for joining clips.
license: Proprietary. See LICENSE for the terms.
---

# Bend time with vsb

Twelve of the twenty-one techniques on
[visualsandbox.com/cinematic-techniques/time-and-motion/](https://visualsandbox.com/cinematic-techniques/time-and-motion/)
are a transform of footage you already have. This command makes those, locally,
for nothing.

```bash
vsb video speed slow-motion horse.mp4 --factor 4 --json
vsb video speed --list --json      # the twelve, and the nine that need the model
```

**ffmpeg must be installed.** `brew install ffmpeg` on macOS.

## The twelve

| Effect | What it does | The flags |
|---|---|---|
| `slow-motion` | Runs slower, detail arrives | `--factor`, `--smooth` |
| `fast-motion` | Runs faster, continuity kept | `--factor` |
| `speed-ramp` | The speed changes inside the shot | `--ramp` |
| `motion-blur` | Moving things blur along their path | `--frames` |
| `low-shutter` | A long exposure smears everything moving | `--frames` |
| `freeze-frame` | Stops dead on one frame and holds | `--at`, `--hold` |
| `reverse-motion` | Runs backward | — |
| `boomerang` | Out and back, repeating | `--loops` |
| `stutter` | Frames repeat, motion jerks | `--step` |
| `step-printing` | Stutter and trails together | `--step`, `--frames` |
| `stop-motion` | Advances in small jumps, no blur | `--step` |
| `infinite-loop` | The end matches the start | `--blend` |

## The nine it cannot make

`bullet-time`, `frozen-in-motion`, `moonwalk`, `time-lapse`,
`timelapse-landscape`, `timelapse-human`, `timelapse-glam`, `long-take` and
`one-er` need the model. Asking for one by name returns the reason and the
`vsb run video/p-video` line to use instead, so there is no flag to hunt for.

The short version: ffmpeg cannot orbit frozen action, cannot hold one figure
still while the rest of the frame moves, and cannot turn ten seconds into an
afternoon.

## `--smooth`, and what it costs

Slowing a clip stretches its timestamps, and the gap between the frames that
were really shot gets filled with repeats. That judders. `--smooth` draws the
missing frames instead, with motion interpolation:

```bash
vsb video speed slow-motion clip.mp4 --factor 4 --smooth
```

It is far better to watch and much slower to render — about twenty seconds of
work per second of 1080p source. Land the shot without it, then re-run with it
once.

## The speed ramp

`--ramp` takes seconds and the speed to reach by then. Speed 1 is life, 0.25 is
a quarter of life, 2 is double.

```bash
vsb video speed speed-ramp chase.mp4 --ramp 0:1,4:0.2,8:1
```

The speed glides between the points rather than stepping, because the clip is
sliced into quarter seconds and each slice runs at its own speed. Two
consequences worth knowing: a ramp drops the sound, because retiming audio
slice by slice turns speech into a stammer, and the extreme lands within about
a tenth of what you asked for, because no slice is centred exactly on the point
you named.

## Making a clip loop

`infinite-loop` dissolves the tail of the shot into its own opening, so the
frame the player loops back to is the frame already on screen.

```bash
vsb video speed infinite-loop sun.mp4 --blend 1
```

The clip loses the blend from its length. Keep the light and the background
constant or the seam shows anyway — that part is the prompt's job, not this
command's.

## Traps

- **`--factor` is an amount, not a speed.** `--factor 4` on slow motion is
  quarter speed. A factor of 1 or less is refused.
- **A boomerang has no sound.** Reversed audio is a noise. `reverse-motion`
  keeps it, because there the reversal is the point.
- **`reverse` holds the whole clip in memory.** Fine for ten seconds of 1080p,
  not for a long file. Trim first with `vsb video crop`.
- **`stop-motion` and `stutter` are the same engine.** The difference is the
  step and the absence of blur. Stop motion reads because nothing smears.
- **Smear before you step.** `step-printing` does this for you: the trails come
  from the motion that was really there, so averaging the held frames
  afterwards would change nothing.
- **`vsb video speed` is CLI-only.** The MCP server is hosted and cannot reach local
  files, the same as `vsb video cut`, `vsb video crop`, `vsb video subtitles` and `vsb video download`.
