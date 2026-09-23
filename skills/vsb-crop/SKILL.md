---
name: vsb-crop
description: >
  Trim or reframe one clip with `vsb crop` — keep a piece of the time
  (`--start`, `--duration`), crop to a shape (`--aspect 9:16`), an exact box
  (`--rect`) or closer in (`--zoom`), and scale to a platform size (`--size`).
  Trigger when the user wants to "trim this", "cut the first 5 seconds",
  "shorten the clip", "make it vertical", "crop to 9:16", "crop to square",
  "zoom in on the face", or a clip must be shorter or a different shape before
  a model run or a join. Runs locally through ffmpeg: free, nothing uploaded.
  Pair with `vsb-cut` for joining clips and `vsb-speed` for retiming.
---

# Trim and reframe with vsb

`vsb crop` keeps a piece of the time, a piece of the picture, or both, from
one clip. It runs on your machine through ffmpeg. Nothing is uploaded and
nothing is billed.

```bash
vsb crop long.mp4 --start 1.5 --duration 5 --json    # a plain trim
vsb crop wide.mp4 --aspect 9:16 --json               # 16:9 to vertical
```

**ffmpeg must be installed.** `brew install ffmpeg` on macOS.

## Trim

`--start` is where the kept piece starts, in seconds. `--duration` is how many
seconds to keep. With no `--duration`, the command keeps the rest of the clip.
With only these two flags, the picture does not change.

```bash
vsb crop clip.mp4 --duration 5                 # the first 5 seconds
vsb crop clip.mp4 --start 12 --duration 3.5    # 12 s to 15.5 s
vsb crop clip.mp4 --start 20                   # 20 s to the end
```

Trim a source before a paid run that follows its length. A Seedance edit or
restyle returns the full length of its reference video, so a 5-second test
needs a 5-second clip. See the `vsb-seedance` skill.

## Reframe

| Flag | What it does |
|---|---|
| `--aspect 9:16` | Crops to that shape and keeps as much of the picture as it can |
| `--zoom 2` | Crops in by a factor. 2 keeps the middle half in each direction |
| `--rect x,y,w,h` | An exact box in source pixels. It wins over `--aspect` and `--zoom` |
| `--gravity top` | Which part a crop keeps: `center`, `top`, `bottom`, `left`, `right`, `top-left`, `top-right`, `bottom-left`, `bottom-right`. Default: `center` |
| `--size 1080x1920` | Scales the result to fill that size |

```bash
vsb crop wide.mp4 --aspect 9:16 --size 1080x1920         # a Reel at platform size
vsb crop wide.mp4 --zoom 2 --gravity top                 # a wide becomes a medium
vsb crop wide.mp4 --rect 100,0,880,1080                  # an exact box
vsb crop wide.mp4 --aspect 1:1 --start 2 --duration 4    # reframe and trim in one pass
```

Name `--gravity` when the subject is not in the centre. It decides whether a
9:16 crop keeps the face or the empty half of the frame. If you do not know
where the subject is, look at a frame first.

## Output

The default output is `<input>-crop.mp4` next to the input. `-o` sets a
different path. `--json` returns the file, the new size, the new length,
whether the audio stayed, and `cost: 0`. `--dry-run` prints the ffmpeg command
and runs nothing.

## Traps

- **Every run re-encodes.** Each pass loses a little quality, so trim and
  reframe in one call. `--crf` sets the x264 quality: lower is better and
  larger. Default: 20.
- **Sides round to even numbers.** x264 refuses an odd width or height, so a
  box of 225 rows becomes 224.
- **`--zoom` must be above 1**, or nothing crops in.
- **`--rect` must fit inside the frame.** The command refuses a box that runs
  past the edge.
- **A `--start` past the end is refused.**
- **`vsb cut` has no plain trim.** Every `vsb cut` recipe joins something. To
  shorten one clip, use this command.
- **`vsb crop` is CLI-only.** The MCP server is hosted and cannot reach local
  files, the same as `vsb cut`, `vsb speed`, `vsb subtitles` and
  `vsb download`.
