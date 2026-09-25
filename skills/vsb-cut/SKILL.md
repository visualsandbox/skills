---
name: vsb-cut
description: >
  Join two or more clips with a named film transition using `vsb video cut` —
  jump cut, smash cut, dissolve, wipe, iris, cross-cutting, montage,
  split screen, J-cut and L-cut, 23 in all. Trigger when the user wants
  to "cut these together", "add a transition", "join the clips",
  "make a montage", "split screen", "jump cut this", or names any film
  transition. Runs locally through ffmpeg: free, instant, nothing
  uploaded. Pair it with `vsb-video` for generating the clips first.
license: Proprietary. See LICENSE for the terms.
---

# Cut clips together with vsb

A video model gives you one clip at a time. A transition is two clips and a
join, so the order of work is: generate shot A, generate shot B, then cut.

```bash
vsb video cut dissolve ./a.mp4 ./b.mp4 --json -o ./out.mp4
```

The join runs on the local machine through ffmpeg. It costs nothing, it takes
about a second, and no file is uploaded. Only the clips you generate are
billed.

**ffmpeg must be installed.** `brew install ffmpeg` on macOS. The command says
so and stops if it is missing.

## Find the transition

```bash
vsb video cut --list --json     # all 23: slug, what it takes, what it does
```

The slug is the same one on
[visualsandbox.com/cinematic-techniques/cuts-and-transitions/](https://visualsandbox.com/cinematic-techniques/cuts-and-transitions/),
so a technique named on that page is a command here.

| Slug | Clips | What it does |
|---|---|---|
| `jump-cut` | 1 | Slices one shot so time skips, framing untouched |
| `axial-cut` | 1 | Jumps closer along the lens axis, same angle |
| `smash-cut` | 2 | Hard cut between two shots that contradict each other |
| `crash-cut` | 2 | Hard cut with no easing on either side |
| `flash-cut` | 2 | Replaces a frame or two with a second image |
| `quick-cuts` | 2+ | One short slice per shot, fast |
| `match-action` | 2 | A movement starts in one shot, finishes in the next |
| `match-cut` | 2 | Two shots linked by a shared quality |
| `graphic-match` | 2 | Two shots that share a shape |
| `match-motion` | 2 | One movement continues into another |
| `match-split` | 2 | Half of each shot meets on a seam, one frame |
| `invisible-cut` | 2 | Hides the join behind a whip or darkness |
| `dissolve` | 2 | One image fades into the next |
| `fade` | 1-2 | In and out of black or white |
| `wipe` | 2 | A hard edge travels across the frame |
| `iris` | 2 | A circle closes in or opens out |
| `transitions` | 2 | Any other shape — `--shape <name>` |
| `set-transition` | — | One model run, not a join (see below) |
| `cross-cut` | 2 | Alternates two places, both running forward |
| `montage` | 2+ | A run of short shots |
| `fragments` | 2+ | Short pieces, out of order |
| `split-screen` | 2 or 4 | Two or four images play at once |
| `l-cut-visual` | 2 | Sound leads or lags the picture |

## The flags that matter

- `--hold <s>` — seconds taken from each clip. Without it, the whole clip.
  One value covers every clip; a list gives one per clip, and `all` is the
  whole of that one: `--hold all,2`.
- `--at <s,s>` — the in-point of each clip, in order. This is how a match on
  action lines up: `--at 0,1.2` starts the second shot 1.2s in, where the
  movement is.
- `--duration <s>` — how long a shaped transition takes. Default 1.
- `--fit fill|fit` — split screen panes. `fill` crops each pane to its share of
  the frame, which is what a split screen is. `fit` letterboxes instead, and
  two 16:9 shots fitted into two half-width panes are two thin black-barred
  strips, not a split screen. Default `fill`.
- `--beat <s>` — how long one slice lasts, for the beat-based cuts.
- `--direction` — `left|right|up|down` for a wipe, `in|out` for an iris.
- `--dry-run` — prints the ffmpeg command without running it.

Always pass `--json` when an agent reads the output.

## Worked example: generate two shots, then cut

```bash
vsb run video/p-video --prompt "a woman reaches for a door handle, close on her hand" \
  --duration 5 --async --json          # → job id
vsb run video/p-video --prompt "the door swings open onto a bright street" \
  --duration 5 --async --json
# poll both with `vsb status <id> --download ./`
vsb video cut match-action ./a.mp4 ./b.mp4 --at 0,1.2 --hold 2 --json -o ./scene.mp4
```

The match is what sells the cut, and the match is in `--at`. Read both clips
before you pick the numbers — a contact sheet shows where the action lands,
and its `at_seconds` gives the time of every tile:

```bash
vsb video frame b.mp4 --grid 5x2 --json
```

## Build a scene by chaining

The output of a cut is a clip, so the next join takes it as its first input.
`--hold all,2` keeps everything cut so far and takes two seconds of the shot
arriving. Never read the running length off the last join and pass it back in
— the reported duration is rounded for display, and a rounded length is longer
than the clip it describes.

```bash
vsb video cut dissolve      ridge.mp4 sun.mp4   --hold 2.5,2.5 --duration 0.8 -o s1.mp4
vsb video cut graphic-match s1.mp4    wheel.mp4 --hold all,2                  -o s2.mp4
vsb video cut smash-cut     s2.mp4    eyes.mp4  --hold all,2.5                -o s3.mp4
vsb video cut match-cut     s3.mp4    hand.mp4  --hold all,2 --at 0,1.5       -o scene.mp4
```

Each link re-encodes, so keep a chain to a handful of joins for a finished
piece and raise `--crf` only at the end.

## Reframe first with `vsb video crop`

Clips arrive in the shape the model was asked for, which is rarely the shape
the cut needs. `vsb video crop` takes a piece of the picture and a piece of the time,
locally and for nothing.

```bash
vsb video crop wide.mp4 --aspect 9:16                      # a 16:9 take, ready for a Reel
vsb video crop wide.mp4 --aspect 9:16 --size 1080x1920     # and at the size the platform wants
vsb video crop wide.mp4 --zoom 2 --gravity top             # a wide becomes a medium
vsb video crop wide.mp4 --rect 100,0,880,1080              # an exact box in source pixels
vsb video crop long.mp4 --start 1.5 --duration 5           # a plain trim, no pixels touched
```

`--gravity` picks which part survives: center, top, bottom, left, right and the
four corners. It is the flag that decides whether a 9:16 crop keeps the face or
the empty half of the frame, so name it whenever the subject is off centre.

This is also the answer for a shot that needs shortening and nothing else.
`vsb video cut` has no plain trim, because every one of its recipes joins something.
See the `vsb-crop` skill.

## Retime with `vsb video speed`

The sibling command for the other axis. `vsb video cut` joins clips, `vsb video crop`
reframes one, `vsb video speed` bends its time — slow motion, reverse, boomerang,
freeze frame, stutter, a seamless loop. Twelve effects, all local and free.
See the `vsb-speed` skill.

## Sound

Sound is kept when every clip has some, and dropped when any clip is silent —
keeping it would slide every later clip's audio against its own picture.

`l-cut-visual` is the one that is *about* sound, so it refuses silent clips.
`--kind l` lets the outgoing sound run past the picture cut, `--kind j` starts
the incoming sound early, and `--lead <s>` is how far.

## Traps

- **`set-transition` is not a join.** The set changes around a moving camera
  inside one shot, so it is a single model run. The command says so and gives
  the prompt to use.
- **A flash is measured in frames, not seconds.** `--frames 2` is the whole
  effect. It replaces frames rather than adding them, so the shot keeps its
  length.
- **A jump cut must not change the framing.** Use `jump-cut` on one clip. Two
  angles of the same action is ordinary coverage, not a jump cut.
- **A match lives in the prompt, not in the cut.** A graphic match needs the
  shared shape at the same size and the same place in both frames, and a model
  will not do that unless the prompt puts it there. If the join reads weakly,
  re-roll one clip rather than reach for a different transition.
- **Clips of different sizes are letterboxed, never cropped.** The output takes
  the first clip's size and rate unless `--size` and `--fps` say otherwise.
- **`vsb video cut` is CLI-only.** The MCP server is hosted and cannot reach local
  files, the same as `vsb video subtitles` and `vsb video download`.
