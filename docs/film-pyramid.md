# The film pyramid

A plan for the skills that sit **above** the model. Nothing here is built yet.
This file holds the shape and the reasoning so the build does not drift.

## The gap

Every skill in this repository today answers the same question: *how do I run
this model well?* `vsb-video` covers the runtime, `vsb-p-video-prompting`
covers one model's slot order, `vsb-image-prompting` covers prompt craft.

None of them answers the question that comes first: *what am I making, and what
should the shot be?* An agent handed "make me a video about X" has no path from
that sentence to a prompt. It invents one, and it invents a different one every
time.

The pyramid is that path. Each tier turns a loose input into a firmer one, and
hands it down.

## The shape

```
                        ┌──────────────┐
                        │   vsb-film   │  "I want to make a video"
                        │ trunk + flow │  picks the path, names the steps
                        └──────┬───────┘
   TIER 1 · WHAT IS IT ────────┼──────────────────────────────────────
                        ┌──────▼───────┐  seed → premise, format,
                        │ vsb-concept  │  length, platform
                        └──────┬───────┘
   TIER 2 · HOW IT LOOKS ──────┼──────────────────────────────────────
                        ┌──────▼───────┐  genre · palette · lighting
                        │vsb-direction │  lens language · pace
                        └──────┬───────┘  = the look bible, written once
   TIER 3 · HOW IT RUNS ───────┼──────────────────────────────────────
                        ┌──────▼───────┐  beats → shot list → cut plan
                        │ vsb-sequence │  reads: editing (23)
                        └──────┬───────┘
   TIER 4 · THE SHOT ──────────┼──────────────────────────────────────
                        ┌──────▼───────┐  one shot → one prompt
                        │   vsb-shot   │
                        └──────┬───────┘
     reads: movement 86 · effects 57 · viral 44 · lighting 41 · composition 32
            genre 27 · framing 25 · time 21 · angles 19 · color 19 · lenses 17
            atmosphere 13
   TIER 5 · RUN IT (exists today) ─────────────────────────────────────
     vsb-video · vsb-image · vsb-audio · vsb-p-video-prompting · vsb-ugc-people
   TIER 6 · CUT IT ────────────┼──────────────────────────────────────
                        ┌──────▼───────┐  joins runs, continuity, sound
                        │ vsb-assemble │
                        └──────────────┘
```

## What each tier owns

| Tier | Skill | Takes | Gives |
|---|---|---|---|
| 0 | `vsb-film` | a request in any shape | the named flow to follow |
| 1 | `vsb-concept` | a seed, a brief, or nothing | premise, format, length, platform |
| 2 | `vsb-direction` | the premise | the look bible |
| 3 | `vsb-sequence` | the look bible | beat list, shot list, cut plan |
| 4 | `vsb-shot` | one line of the shot list | one finished prompt |
| 5 | existing packs | the prompt | the media |
| 6 | `vsb-assemble` | the runs | the finished cut |

**One tier never reaches past the next one.** `vsb-shot` reads the look bible
and its own line of the shot list, and nothing else. That is what keeps the
context small enough to work at shot forty.

## The flows

The trunk does not run every tier every time. It picks a path and says which
steps to skip. The flow is the answer to "which direction do I take".

| Flow | Path |
|---|---|
| Short film | concept → direction → sequence → shot → video → assemble |
| Ad or UGC | concept → direction → shot → ugc-people → image or video |
| Music video | concept → direction → sequence (beat-synced) → shot → assemble |
| Single shot or loop | shot → video |
| From a reference | direction (read it backwards) → shot |

The ad flow skips tier 3 on purpose. A hook and one talking shot need no cut
plan, and forcing one wastes the run.

## What makes it trickle

Three rules, and three is the whole mechanism.

1. **Every skill ends with one `Next` block.** It names the child skill and
   says when to skip it. An agent that finishes a tier always knows where it is.
2. **Every tier writes one artifact the next tier reads.** The premise, then
   the look bible, then the shot list, then the prompts. The handoff is a file,
   not a memory.
3. **The look bible is quoted into every shot prompt.** It is written once at
   tier 2 and pasted at tier 4, forty times if there are forty shots.

Rule 3 is the keystone. Forty prompts written independently drift apart by
shot ten. Forty prompts that all carry the same look bible do not.

## Six skills, not twenty-one

The obvious build is one skill per technique category: thirteen siblings named
`vsb-shot-movement`, `vsb-shot-lighting` and so on. Do not do that.

- **The descriptions collide.** A dozen skills whose descriptions all say
  "camera", "shot" and "lighting" give the runtime no way to pick one.
- **It costs context for nothing.** Writing a single prompt would load twelve
  packs to use one.

Instead the thirteen categories are `references/*.md` inside `vsb-shot`, read
on demand. One skill decides which category a shot needs, then reads that one
file. This is the ordinary progressive-disclosure pattern the other packs use.

That leaves six new skills: `vsb-film`, `vsb-concept`, `vsb-direction`,
`vsb-sequence`, `vsb-shot`, `vsb-assemble`.

## Continuity is a tier 2 problem

The same face and the same room, shot to shot, is the hardest part of AI video,
and it fits nowhere in the tier list above. Put it in `vsb-direction`, as a
locked block of the look bible:

- the character, described once, in words every prompt repeats
- the place, described once, the same way
- the reference image, if there is one, reused as the anchor on every run

Then rule 3 carries it for free. Continuity handled at tier 4 is forty separate
decisions, and they will not agree.

## Where the shot content comes from

The thirteen reference files are a build step, not new writing. The workspace
already holds all of it:

- `docs/cinematic-techniques/GUIDE.md` — our own guidance on all 424 shots:
  what each does, the prompt wording, what to ban, and the trap. It splits
  cleanly on its thirteen category headings.
- `docs/cinematic-techniques/README.md` — the factual index: names, aliases,
  the shot each one is mistaken for, the reference clips, the film examples.
- `docs/cinematic-techniques/techniques.json` — the same as data.

`vsb-shot/references/<category>.md` is a slice of `GUIDE.md`. When the guide
changes, the slices rebuild.

## Open questions

- Does `vsb-assemble` overlap `vsb-motion` enough to merge them?
- Does `vsb-sequence` write a real edit decision list, or prose a human reads?
- Should the look bible be a file on disk or a sandbox the agent writes to?
