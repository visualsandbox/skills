---
name: vsb-cut
description: >
  Join two or more clips with a named film transition using `vsb cut` —
  jump cut, smash cut, dissolve, wipe, iris, cross-cutting, montage,
  split screen, J-cut and L-cut, 23 in all. Trigger when the user wants
  to "cut these together", "add a transition", "join the clips",
  "make a montage", "split screen", "jump cut this", or names any film
  transition. Runs locally through ffmpeg: free, instant, nothing
  uploaded. Pair it with `vsb-video` for generating the clips first.
---

# Cut clips together with vsb

A video model gives you one clip at a time. A transition is two clips and a
join, so the order of work is: generate shot A, generate shot B, then cut.

```bash
vsb cut dissolve ./a.mp4 ./b.mp4 --json -o ./out.mp4
```

The join runs on the local machine through ffmpeg. It costs nothing, it takes
about a second, and no file is uploaded. Only the clips you generate are
billed.

**ffmpeg must be installed.** `brew install ffmpeg` on macOS. The command says
so and stops if it is missing.

## Find the transition

```bash
vsb cut --list --json     # all 23: slug, what it takes, what it does
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
- `--at <s,s>` — the in-point of each clip, in order. This is how a match on
  action lines up: `--at 0,1.2` starts the second shot 1.2s in, where the
  movement is.
- `--duration <s>` — how long a shaped transition takes. Default 1.
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
vsb cut match-action ./a.mp4 ./b.mp4 --at 0,1.2 --hold 2 --json -o ./scene.mp4
```

The match is what sells the cut, and the match is in `--at`. Read both clips
before you pick the numbers — a frame grid shows where the action lands:

```bash
ffmpeg -i b.mp4 -vf "select='not(mod(n\,12))',scale=320:-1,tile=5x2" -frames:v 1 grid.png
```

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
- **Clips of different sizes are letterboxed, never cropped.** The output takes
  the first clip's size and rate unless `--size` and `--fps` say otherwise.
- **`vsb cut` is CLI-only.** The MCP server is hosted and cannot reach local
  files, the same as `vsb subtitles` and `vsb download`.
