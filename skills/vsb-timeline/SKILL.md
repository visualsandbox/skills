---
name: vsb-timeline
description: >
  Build an edit on a timeline with `vsb timeline` — lay shots end to end,
  join them with transitions, trim them, put music or a voice under them,
  and lay a logo or a title on top. The timeline is a JSON file that
  survives between commands and between sessions, so the edit can be read
  back, changed and rendered later. Trigger when the user wants to "edit
  these together", "put this on a timeline", "add music under it", "put a
  title over that shot", "make it shorter", "what is on the timeline", or
  is assembling more than two clips. Runs locally through ffmpeg: free,
  nothing uploaded. Pair with `vsb-video` for generating the shots and
  `vsb-cut` for a single named film transition.
---

# Edit on a timeline with vsb

`vsb cut` joins two clips and hands back a file. That stops working at six
shots, a music bed and a title, because nothing holds the arrangement —
so every change means rebuilding the whole chain by hand.

`vsb timeline` holds it. The edit is one JSON file, it survives between
commands, and `vsb timeline show --json` reads the whole thing back.

```bash
vsb timeline new "coffee ad" --size 1080x1920
vsb timeline add hook.mp4 --json
vsb timeline add product.mp4 --transition dissolve --json
vsb timeline add music.mp3 --at 0 --volume 0.25 --fade-out 1 --json
vsb timeline add --text "Only $9" --at 4 --duration 2 --pos bottom --json
vsb timeline show --json
vsb timeline render -o ad.mp4 --json
```

**ffmpeg must be installed.** `brew install ffmpeg` on macOS. Rendering is
one pass on the local machine: free, nothing uploaded, nothing billed. Only
the clips you generate cost money.

## The three layers

| Layer | What sits on it | Where it sits |
|---|---|---|
| `base` | The picture, shot after shot | End to end, in the order added |
| `over` | A still, a clip or a title, on top | Wherever `--at` puts it |
| `audio` | Music, a voice, an effect, underneath | Wherever `--at` puts it |

`add` picks the layer for you: **a file with no picture is audio**, **a
picture with `--at` is an overlay**, and anything else is the next shot.
`--layer base|over|audio` overrides it.

There are no gaps on the base layer. Shots run end to end, and the position
of every one is worked out, never typed. To change where a shot sits, change
its order (`--index`) or the length of the shots before it.

## Read it before you change it

Always `show` before an edit. It returns every clip with its id, where it
starts, where it ends, how long it is and how loud it is — plus warnings for
anything hanging off the end.

```bash
vsb timeline show --json
```

```json
{
  "timeline": "coffee-ad",
  "width": 1080, "height": 1920, "fps": 30,
  "duration_seconds": 7.5,
  "base": [
    { "id": "v1", "file": "hook.mp4", "start": 0, "end": 4,
      "duration": 4, "source_duration": 9.2, "volume": 1, "fit": "cover" },
    { "id": "v2", "file": "product.mp4", "start": 3.5, "end": 7.5,
      "duration": 4, "volume": 1, "transition": "dissolve",
      "transition_duration": 0.5 }
  ],
  "over": [
    { "id": "o1", "text": "Only $9", "start": 4, "end": 6, "pos": "bottom" }
  ],
  "audio": [
    { "id": "a1", "file": "music.mp3", "start": 0, "end": 7.5,
      "duration": 7.5, "volume": 0.25, "fade_out": 1 }
  ],
  "warnings": []
}
```

`source_duration` is how long the file is; `duration` is how much of it
plays. The difference is the room you have to lengthen a shot.

Without `--json` the same thing prints as a strip, which is the fastest way
to show a person what the edit looks like:

```
coffee-ad · 1080x1920 · 30fps · 7.5s · 4 clips

BASE
  v1       0 → 4      ████████████············  hook.mp4      vol 1
  v2     3.5 → 7.5    ···········█████████████  product.mp4   dissolve 0.5s · vol 1
OVER
  o1       4 → 6      ·············███████·····  "Only $9"    bottom
AUDIO
  a1       0 → 7.5    ████████████████████████  music.mp3     vol 0.25
```

## The commands

| Command | What it does |
|---|---|
| `vsb timeline new [name]` | Start a fresh timeline (`--size 1080x1920`, `--fps 30`) |
| `vsb timeline add <file...>` | Put clips, sound or a `--text` title down |
| `vsb timeline set <id>` | Change one clip already down |
| `vsb timeline rm <id...>` | Take clips off |
| `vsb timeline show` | What is on it, where, how long |
| `vsb timeline list` | Every timeline on this machine, newest first |
| `vsb timeline transitions` | The transition names a join takes |
| `vsb timeline render` | Encode it to one file |

Ids are `v1`, `o1`, `a1` by layer, and they are never reused. `set` takes
any flag `add` takes, so a trim is `vsb timeline set v1 --duration 2`.

## The flags that matter

| Flag | Applies to | What it does |
|---|---|---|
| `--at <s>` | over, audio | Which second it starts on |
| `--in <s>` | any file | Where inside the source file to start playing |
| `--duration <s>` | any | How many seconds play |
| `--volume <n>` | base, audio | 0 silent, 1 as recorded, 2 double |
| `--opacity <n>` | over | 1 solid, 0.4 a watermark |
| `--fade-in`/`--fade-out <s>` | any | Ramps the sound, or the overlay's opacity |
| `--transition <name>` | base | How this shot joins the one before it |
| `--transition-duration <s>` | base | How long the join takes. Default 0.5 |
| `--fit cover\|contain` | base | Crop to fill the frame, or letterbox into it |
| `--pos <where>` | over | `center`, `top`, `bottom-left`... or `x,y` in pixels |
| `--scale <n>` | over | Overlay width as a fraction of the frame |
| `--index <n>` | base | Where in the order it goes, 1 first |

## Trimming

A shot is trimmed in place; the file is never rewritten.

```bash
vsb timeline set v1 --duration 2            # keep the first 2 seconds
vsb timeline set v1 --in 1.5 --duration 2   # keep 1.5s → 3.5s of the source
```

A trim shortens everything after it, because the shots run end to end. Read
`show` after a trim: an overlay or a music bed that used to fit may now hang
off the end, and the warnings say so.

To crop the picture rather than the time, run `vsb crop` and add the result.
A shot whose shape does not match the timeline is handled by `--fit`.

## Transitions

```bash
vsb timeline add b.mp4 --transition dissolve --transition-duration 0.4
vsb timeline set v3 --transition wipe-up
vsb timeline set v3 --transition cut          # back to a hard join
```

The names are the ones `vsb cut` uses — `dissolve`, `fade`, `wipe`,
`wipe-up`, `iris`, `whip`, `slide`, `zoom` — and any other ffmpeg xfade
shape works too. `vsb timeline transitions --json` lists them.

**A transition eats time.** Two 4s shots with a 0.5s dissolve make 7.5s, not
8s, because the second shot starts half a second early. The sound fades
across the join on its own.

## Sound

```bash
vsb timeline add music.mp3 --at 0 --volume 0.25 --fade-out 1.5
vsb timeline add vo.mp3 --at 2.5 --volume 1
vsb timeline set v1 --volume 0                # mute one shot
```

Sound layers rather than replaces: a music bed, a voice and the shots' own
audio all play together at the volumes set. Nothing is normalised, so a bed
under a voice belongs around `0.2`–`0.3`.

## Titles and overlays

```bash
vsb timeline add --text "Only $9" --at 4 --duration 2 --pos bottom
vsb timeline add --text "SALE" --at 1 --duration 3 --opacity 0.4 --font-size 120
vsb timeline add logo.png --at 0 --duration 8 --pos top-right --scale 0.15 --fade-in 0.4
```

A title is drawn straight onto the picture, in the same font `vsb subtitles`
uses, with an outline so it reads over anything. `--colour`, `--font-size`
and `--pos` shape it; `--font <path>` picks another face.

An overlay file keeps its transparency, so a PNG with an alpha channel lands
as a logo. `--opacity` makes it see-through, and a fade ramps into that
opacity rather than to solid. An overlay is silent unless `--volume` says
otherwise.

For word-by-word captions off a voice track, use `vsb subtitles` on the
rendered file instead — it transcribes and times them.

## Rendering

```bash
vsb timeline render -o ad.mp4 --json          # the real thing
vsb timeline render --preview --open          # small, fast, plays it back
```

One ffmpeg pass builds the whole thing, so no clip is re-encoded on its way
through. `--preview` renders 480px wide with a fast preset — use it to check
an arrangement before committing to a full render.

## Coming back to it

The timeline is tied to the session, the same way `vsb sandbox` is, so a new
conversation or a new terminal tab starts on its own. Everything is on disk
under `~/.vsb/timelines/`.

```bash
vsb timeline list --json                      # everything on this machine
vsb timeline show --timeline coffee-ad        # pick one back up
```

`--timeline <name>` works on every subcommand and makes that one active for
the commands that follow.

## The order of work

1. Generate the shots — `vsb run video/...`, or `vsb download` something.
2. `vsb timeline new "<what this is>"` and add them in order.
3. `vsb timeline show --json` and read it back before changing anything.
4. Trim, reorder and set transitions against the ids.
5. Lay the sound under and the titles over.
6. `vsb timeline render --preview` to check, then render for real.

## Traps

- **Read before you write.** Work against ids from `show`, never against
  remembered ones. A `rm` does not renumber, so `v2` stays `v2`.
- **A trim moves everything after it.** Check the warnings afterwards.
- **A transition shortens the film.** Do not add up the clip durations and
  expect that number.
- **The first shot sets the shape.** Frame size and rate come from the first
  clip on the base layer unless `new --size` said otherwise. Add the shot
  that defines the format first, or state it up front.
- **`--at` on a video file makes it an overlay**, not the next shot. Leave
  `--at` off to append, or pass `--layer base`.
- **Opacity is for overlays.** The picture underneath has nothing to be
  see-through over; fade it with `--transition fade` instead.
- **Rendering is free, generating is not.** Render as often as you like.
