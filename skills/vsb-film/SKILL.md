---
name: vsb-film
description: >
  Make a short AI film end to end with Visual Sandbox: script, shot list,
  character and location sheets, start frames, one video per shot, dialogue,
  music and sound effects, edit, captions. Trigger when the user wants a
  short film, a story with several shots, a scene with the same character in
  every shot, a trailer, a music video, or "make a film / episode / series"
  with the vsb CLI. Gives the phases in order with the exact commands, a
  shot-list template, the budget step, and which model to use for which shot.
  Model craft lives in the sibling packs it links to.
license: Proprietary. See LICENSE for the terms.
---

# Make a short film with vsb

> **On the MCP surface?** Generate with `generate` and `get_job`, and price
> with `estimate_cost`. The edit commands (`vsb video timeline`, `crop`,
> `frame`, `subtitles`) run on the local machine and are CLI only. See
> [`vsb` → Two ways to run](../vsb/SKILL.md#two-ways-to-run-mcp-tools-or-the-cli).

A model makes one clip at a time and forgets the last one. This page is the
order of work that keeps the face, the place, the light and the voice the same
from shot to shot.

Each phase writes one file that the next phase reads. Keep the files on the
canvas with `vsb sandbox docs write`, so a later session finds them:
`FILM.md` (script and look), `CHARACTER.md` (cast and places, with image
URLs), `SHOTS.md` (the shot list).

## Rules before the first run

1. **Price the whole film and get a yes.** One shot is cheap. Forty shots with
   three takes each is not. See phase 3.
2. **Make one pilot shot through the full chain** (picture, voice, lips, mix)
   before the batch. Show it to the user.
3. **Ask before `--ai_character true`.** The flag is the user's promise that
   the person is AI-made and that they hold the rights. Never set it for a
   real person.
4. **Run every generation in a background shell with `--async`.** Rules in
   [`vsb` → Background generations](../vsb/SKILL.md#background-generations-keep-the-conversation-free).
5. **Look at every clip before you use it:** `vsb video frame <url> --json`.
   A completed job can still hold a frozen subject or a new face.

## Phase 1: Script

Name the canvas first: `vsb sandbox name "<film title>"`.

Write the script as beats. A beat is one thing that happens. For a first
film, keep it to 30 to 90 seconds, one or two characters, and two or three
places. Write each line of dialogue word for word, with who says it. Count
the words: about 2.5 spoken words take one second.

Write the **look** in one paragraph: genre, period, palette, light, lens,
film stock or grain. This paragraph goes into every image and video prompt,
word for word. Save script and look as `FILM.md`.

## Phase 2: Shot list

Break each beat into shots. The rules that keep a model on track:

- **One action and one camera move per shot.** Two actions in one prompt
  give a blend of both, or the model drops one.
- **Plan 4 to 8 seconds per shot.** Action breaks after about 5 to 8 s and
  lip sync drifts past about 8 s of speech. A long beat is two shots.
- **Add one second of handle** at the start and the end. The edit trims it.
- **Write what the body does**, not the feeling: "her jaw tightens", not
  "she is angry". Say how many people are in frame.
- **Cover the important beats** with a wide, a medium and a close shot. For
  a dialogue, plan an over-the-shoulder pair, one speaker per shot. Add
  inserts (hands, an object, a door). An insert hides a bad cut and costs
  little, because it has no face.
- **Show the cause before the reaction.** First the thing, then the face.
- **Pick the model per shot** from the table in phase 5, not per film.

Save the list as `SHOTS.md`. Template:

```yaml
film: "Night Shift"
aspect: "16:9"                  # one aspect for the whole film
look: "1970s roadside diner at night, 35mm film, sodium orange and teal, soft grain, shallow depth of field"
cast:
  mara: { face: <url>, body: <url>, words: "woman, late 20s, dark wavy shoulder-length hair, navy work jacket" }
places:
  diner: { plate: <url>, words: "empty diner, red vinyl booths, rain on the windows, neon sign outside" }
shots:
  - id: s01
    beat: "Mara comes in out of the rain"
    size: wide                  # wide | medium | close | insert
    camera: "static, eye level"
    action: "she pushes the door open and stops inside"
    seconds: 5
    model: video/seedance-2.5
    line: null                  # or { who: mara, text: "Still open?" }
    sound: "rain, door bell. No BGM. No subtitles."
    takes: 2
    keep: null                  # job_id of the kept take
```

## Phase 3: Budget

Read the rate, then price the batch. Both calls are free.

```bash
vsb pricing video/seedance-2.5 --json        # rate per second, per tier
vsb estimate video/seedance-2.5 --prompt "x" --resolution 480p --duration 5 --count 24 --json
```

Pass `--prompt`, or `vsb estimate` returns `"incomplete": true`. It prices
one model per call: run it once for each model in the shot list.

The film costs: shots × takes × seconds × rate, plus the drafts, the voice
lines, the music, the sound effects and the upscale. Count two to three takes
for a shot with a face, one for an insert, and more for a hard shot. Say the
total, with the draft and the finish cost apart, and wait for a yes.

## Phase 4: Cast and places

Read [`vsb-image-prompting`](../vsb-image-prompting/SKILL.md) before the first
image prompt. Use one image model for all sheets: `image/nano-banana-pro` or
`image/gpt-image-2.5-flare`. Pass `--output_format png`.

- **A character** is two images: a front head-and-shoulders portrait on a plain
  background, then a full-body shot made from the portrait (portrait in
  `--image_input`) in the film's wardrobe. Recipe and command:
  [`vsb-seedance` → One realistic AI character across shots](../vsb-seedance/SKILL.md#one-realistic-ai-character-across-shots).
- **A place** is one empty plate: the set in a wide shot, in the film's light,
  with no people and no text.
- **Words.** Write one fixed description for each character and each place.
  Paste it unchanged into every prompt: one new adjective makes a new person.
  Name a character by how it looks, not by its name.

Get each result with `vsb status <id> --result --json | jq -r '.result.urls[0]'`
and write the URLs into `CHARACTER.md`. Every later run uses these URLs, never
a new portrait.

## Phase 5: Start frames and video per shot

Pick the model for each shot. Then follow its row: some take a start frame,
some take references, and Seedance cannot take both.

| Shot | Model | How it holds the look |
|------|-------|-----------------------|
| The AI character, no line or a line in a new voice | `video/seedance-2.5`, `--ai_character true` | Face and body URLs in `--reference_images`. No `--image`: with the flag on, a first frame guides the face only, and a first frame excludes every reference list |
| A line of dialogue, a new voice per clip is fine | `video/veo-3.1`, `--generate_audio true` | Start frame in `--image`, `--aspect_ratio` the same as the frame |
| A character who keeps one voice in every shot | `audio/elevenlabs-tts`, then `video/p-video-2 --image --audio` | Start frame in `--image`, one designed voice |
| A place, an object, hands, no face | `video/seedance-2.5` or `video/p-video-2` | Start frame in `--image` |
| One long unbroken shot, silent | `video/wan-3` | Start frame in `--image`, up to 30 s |
| Several shots of one scene in one clip | `video/kling-v3-omni-video --multi_prompt` | Up to 7 `--reference_images` |

For the sound path of each speaking shot, read
[`vsb-video` → People who talk](../vsb-video/SKILL.md#people-who-talk-pick-the-sound-path-before-you-spend)
before you spend.

**Make a start frame** with `image/nano-banana-pro`: the character sheets and
the place plate in `--image_input`, the shot's framing, action pose and the
look paragraph in the prompt, `--aspect_ratio` the film's aspect. Look at it.
A bad still makes a bad clip, and a still costs much less than a clip.

**Cut the animatic before any video.** Put the approved stills on a timeline
for the length of each shot, with the draft voice lines under them
(`vsb video timeline add s01.png --duration 5`). Watch it. Fix the pacing now,
when a change costs nothing. Get the user's yes on stills and animatic.

**Continuous action across a cut** (she reaches the door, then opens it): take
the last frame of the kept take and use it as the next shot's start frame.
If the clip glitches at the end, take a frame a little earlier (`--at 4.6`).

```bash
vsb video frame "$CLIP_URL" --at end -o s04-last.png --json
NEXT=$(vsb upload ./s04-last.png --json | jq -r '.url')
```

**Draft, then finish.** Iterate on the cheap setting: `--resolution 480p` and
5 s on Seedance, `--draft true` on P-Video. Pass a fixed `--seed` (Seedance,
Veo, P-Video, Wan), then render the kept take again at 720p with the same
seed and prompt. Prompt craft per model:
[`vsb-seedance-prompting`](../vsb-seedance-prompting/SKILL.md),
[`vsb-p-video-prompting`](../vsb-p-video-prompting/SKILL.md),
[`vsb-video`](../vsb-video/SKILL.md).

```bash
JOB=$(vsb run video/seedance-2.5 \
  --prompt "Use [Image1] for the woman's face and hair, and [Image2] for her body and outfit. <look paragraph>. <place words>. Wide shot, static camera at eye level: she pushes the diner door open and stops inside. Rain and a door bell. No BGM. No subtitles." \
  --reference_images "[\"$FACE\",\"$BODY\"]" --ai_character true \
  --resolution 480p --duration 5 --aspect_ratio 16:9 --seed 41 \
  --async --json | jq -r '.job_id')
vsb status "$JOB" --result --json > "/tmp/vsb-$JOB.json"   # background shell
jq -r '.result.urls[0]' "/tmp/vsb-$JOB.json"
```

Write the `job_id` of each kept take into `keep` in `SHOTS.md`.

## Phase 6: Sound

Keep three kinds of sound apart. Each has its own source.

- **Dialogue.** On the Path B shots, make the lines first: the line sets the
  clip length on `p-video-2`. Use one designed voice per character
  (`audio/elevenlabs-voice-design`, then `vsb voices rename`) and speak every
  line with `--my_voice <name>`. Details in [`vsb-audio`](../vsb-audio/SKILL.md).
- **Effects and room tone.** `audio/elevenlabs-sound-fx`. Name the sources
  ("rain on glass, a fridge hum"). `--loop true` gives a bed that tiles under
  a whole scene. A clip from a model that writes its own audio already has
  effects. Keep them, or mute the shot in the timeline.
- **Music last.** Make it after the edit is locked, at the length that
  `vsb video timeline show --json` reports in `duration_seconds`.
  `audio/eleven-music --instrumental true --duration_seconds <n>` gives a bed
  of that exact length.

When music goes under the film, every video prompt says "No BGM." A clip with
its own music under a second music bed sounds wrong and cannot be fixed.
Check that each clip has an audio stream, as
[`vsb-video` → Before you spend](../vsb-video/SKILL.md#before-you-spend) shows.

## Phase 7: Edit

Upscale each kept take before the edit, not the finished film:
`video/video-upscale` accepts a source of 60 s at 720p, 30 s at 1080p and
10 s at 4K. Then build the film on a timeline
([`vsb-timeline`](../vsb-timeline/SKILL.md)):

```bash
vsb video timeline new "night shift" --size 1920x1080
for f in s01 s02 s03 s04 s05; do vsb video timeline add "$f.mp4" --json; done
vsb video timeline set v2 --in 0.4 --duration 3.2          # trim dead frames
vsb video timeline set v5 --transition dissolve            # a jump in time only
vsb video timeline add room-tone.mp3 --at 0 --volume 0.4
vsb video timeline add mara-line-03.mp3 --at 11.2
vsb video timeline add music.mp3 --at 0 --volume 0:0,2:0.25,40:0.25,44:0 --ease in-out
vsb video timeline add --text "NIGHT SHIFT" --at 0 --duration 3 --pos center
vsb video timeline render --preview --open
vsb video timeline render -o night-shift.mp4 --json
```

- **Cut on action.** Trim each shot to start just before its action and end
  just after it. Generated clips often hold a still second at each end.
- **Hard cuts by default.** Use a dissolve or a fade only for a jump in time
  or place. [`vsb-cut`](../vsb-cut/SKILL.md) names the 23 transitions.
- **Music under dialogue at 0.2 to 0.3.** Nothing is normalised.
- **A closer angle for free:** `vsb video crop --zoom` on a wide take
  ([`vsb-crop`](../vsb-crop/SKILL.md)). Slow motion: [`vsb-speed`](../vsb-speed/SKILL.md).

## Phase 8: Captions

Burn captions only when the film has dialogue and will play muted:

```bash
vsb video subtitles night-shift.mp4 --preset box --json
```

The transcript is saved next to the output. Fix a misheard name in it and
burn again with `--transcript`, at no cost. Details in
[`vsb-subtitles`](../vsb-subtitles/SKILL.md).

## Traps

- **The flag is tested on Seedance 2.5.** The schema of `2`, `2-fast` and
  `2.0-mini` also takes it. Test one clip there before you plan a batch on it.
- **Aspect drift.** Every start frame, every clip and the timeline use one
  aspect. Most video models default to 16:9 and crop a portrait frame.
- **Seedance adds subtitles uninvited.** End each prompt with "No subtitles."
- **The bill grows with retakes.** Read `vsb balance --json` after each
  scene and compare the spend with the budget from phase 3.
