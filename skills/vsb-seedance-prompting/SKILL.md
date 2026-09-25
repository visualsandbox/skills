---
name: vsb-seedance-prompting
description: >
  Canonical prompt-craft skill for the ByteDance Seedance family in Visual
  Sandbox (`video/seedance-2.5`, `video/seedance-2`, `video/seedance-2-fast`,
  `video/seedance-2.0-mini`). Read before writing any `vsb run video/seedance-*`
  prompt: text-to-video, reference-to-video, first and last frame, keyframes,
  storyboard, blockout, video edit, audio edit, or video extension. Built from
  the official Seedance 2.5 and 2.0 prompt guides. Covers the prompt shape
  (summary, shot list, notes), the asset binding rule, timestamps versus shot
  numbers, camera language, action and emotion writing, sound notation,
  negative control, and the 2.0 versus 2.5 differences. Templates and worked
  examples live in [references/templates.md](references/templates.md).
  Runtime, flags and locked parameters live in
  [`vsb-seedance`](../vsb-seedance/SKILL.md).
license: Proprietary. See LICENSE for the terms.
---

# Seedance prompting

Prompt craft only. For the flags, the reference numbering, the locked aspect
and duration rules, and the price, read [`vsb-seedance`](../vsb-seedance/SKILL.md)
first. For the async + poll pattern read [`vsb-video`](../vsb-video/SKILL.md).

Treat Seedance as a visual content producer. Write the prompt as a shot list,
not as ad copy. The model splits the prompt into a spatial layer (who is in
the frame, where) and a temporal layer (what changes, in what order). Give it
both.

## The prompt shape

Four parts, in this order. Drop a part when the shot does not need it. Never
drop the summary.

1. **Asset bindings.** One line per attached asset: which asset, which
   subject, which attributes to take, which to ignore.
2. **One-sentence summary.** Subject + location + event + genre or style +
   camera.
3. **Shot list or timeline.** `Shot 1 / Shot 2` or `0-3s / 3-8s`. Each
   segment: camera, subject action and expression, position in the scene,
   sound.
4. **Notes that hold for the whole clip.** Camera angle, lighting, style,
   audio mode, constraints such as "No subtitles."

Example, text only:

> Realistic nature documentary style, natural light. Warm afternoon, a
> grassy slope in a forest, a chubby panda cub rolls down the hill.
>
> 0-3s: The cub lies on the slope and starts to roll sideways, bending the
> grass. Sunlight comes through the trees from the upper left.
> 3-8s: The cub rolls to the lower right of the frame and stops on its
> belly. It turns its round face to the camera and makes a soft hum.
>
> Low camera, slight handheld feel, follows the cub to the lower right.
> Shallow natural depth of field. Environmental audio only: wind, grass,
> the soft plop of the roll. No BGM. No subtitles.

## Asset bindings

Number assets by their position in each list: `[Image1]`, `[Video1]`,
`[Audio1]`. Bind every one in the prompt. Never rely on a name written on the
image itself; the model confuses or duplicates the character.

- **One line per subject.** "The knight is [Image1]." "The archivist is
  [Image2]." Never "Characters A and B are [Image1] and [Image2]."
- **Say what to take and what to ignore.** "Use [Image1] for the face, hair
  and apron; do not use the background." "Use [Video1] for the spell-casting
  action and the orbit camera move; do not use its character or scene."
- **Several images for one subject.** "Images 1 to 3 are one character: face
  from [Image1], wardrobe from [Image2], back view from [Image3]. One person,
  not three."
- **Pair voice with face.** "[Image1] is the host and speaks with the voice
  in [Audio1]."
- **When the asset already says it, stop describing.** "Strictly follow the
  actions and camera in [Video1], same order." Do not then narrate the raise
  of a hand and the turn; the restatement fights the clip.
- **Reference video with no role stated** lends motion, camera and pacing.
  It does not lend identity, wardrobe or the scene unless you say so.
- **Unused assets.** If an attached asset has no role, say so: "[Image4] is
  not used for people, scene, props, action or sound." Better: do not attach
  it.

Four to five assets is the sweet spot on the 2.0 family: one or two
character images, one scene image, one motion video, one audio. 2.5 holds
more, but stability drops past 8 subject images or 5 subject videos.

## Time control

2.5 reads integer-second timestamps. The 2.0 family does not; it reads shot
numbers only, and a forced timing there can break the clip. So:

- **2.5:** `0-3s ... 3-8s ... 8-12s`, or `[1s-4s]`, or a time point ("at the
  5-second mark, quick left wipe"), or relative time ("after 3 seconds,
  everyone shakes their head").
- **2.0, 2-fast, Mini:** `Shot 1 / Shot 2 / Shot 3`. Let the model pace it.

Keep the timeline continuous. `0-3s ... 5-6s` leaves a hole the model fills
on its own. Give each second-range one state change. Too little content and
the model improvises. Too much and it cuts or drops plot. Never use
timestamps for high-frequency motion such as "shakes head three times a
second".

## Camera

Plain terms work: extreme wide, wide, medium, medium close-up, close-up;
push in, pull out, pan, track, follow, orbit, tilt up, handheld; low angle,
overhead, first person. Named techniques work too: one-shot long take, dolly
zoom, FPV, bullet time, speed ramp.

- **One camera move per shot.** Push, pan and track in one shot makes the
  picture unstable.
- **Name the subject the move centres on**, where it starts and where it
  ends. "The camera orbits the girl from her left to behind the airplane."
- **Expand a rare term into its visible result.** "Rack focus: the sharp
  foreground trees blur while the woman in the background becomes sharp."
- **Transitions need a time and a method.** "At the 5-second mark, cut left
  with a wipe and a short dissolve."
- **Avoid "drone" and "FPV" in the prompt on Visual Sandbox.** The safety
  filter refuses them. Write "aerial flythrough".

## Action and expression

- **General first, detail for the memorable beat.** "Several sets of
  high-knee raises and a somersault" beats a list of every rep. Write exact
  detail only for the one or two actions the shot is about.
- **Body part + range + speed.** "Slowly raises the right hand", "quickly
  turns the head", "pushes hard off the ground".
- **Slow, small, continuous beats big and fast.** Sprints, big jumps and
  violent rolls break more often than a walk, a lean or a turn.
- **Link actions.** "Uses the momentum of the turn to raise a hand."
- **Emotion as visible behaviour,** not as a label. Not "very sad" but
  "lowers the head, shoulders tremble, eyes redden, fingers clutch the hem".
  Pick two or three cues, not all of them.
- **Cause before reaction.** Show the trigger, then the face. Do not cut to
  the reaction close-up before the audience saw what caused it.
- **Spatial relations against fixed objects.** "Inside the counter, facing
  out", not "on the left of the screen".

## Sound and dialogue

Seedance generates audio with the picture. Say what you want or you get the
model's guess.

- **Dialogue in double quotes,** one speaker per line: `The man stops and
  says: "Remember this moment."` Mark the language when it is not obvious:
  `says in Japanese "こんにちは"`. Keep one language per clip.
- **No dashes inside the quotes.** Speech synthesis mangles them. Comma,
  period or `...` instead. Rule in [`vsb-video`](../vsb-video/SKILL.md).
- **Other speakers keep their mouths closed** while one talks. Say it.
- **Name the sources:** "Environmental audio only: wind, footsteps." "Soft
  piano in the background." "A bell rings in the distance."
- **The BytePlus markers** are optional structure the model also reads:
  `()` music, `<>` sound effect, `{}` dialogue, `【】` subtitle. If you use
  `<>` for effects, do not also wrap names in angle brackets.
- **Reference audio** gives timbre, accent, pace and emotion by default. If
  the written line and the recording differ, the written line wins unless
  you say "use the dialogue in [Audio1]".

## Negative control

Negatives work for two things only: subtitles and audio. Everything else,
write the positive.

- "No subtitles." "Do not add any text or subtitles." Portrait clips grow
  subtitles more than landscape.
- "No BGM; environmental and action sounds only." "No audio."
- "No watermark. No logo." when a reference carries one.
- Style drifts toward the reference. A realistic photo plus an anime request
  needs "2D Japanese anime style" stated, or convert the reference first.

## Task recipes

Each task has a template in [references/templates.md](references/templates.md).
The rules that matter most:

- **Reference to video.** Bindings, then summary, then shots. Adaptive
  aspect when the references should set the shape.
- **First and last frame.** Pin them with the fields, not the prompt. Then
  one continuous action that starts at the first frame and arrives at the
  last.
- **Keyframes.** Several stills as `reference_images`, first sentence "Use
  Images 1 to N in order as keyframes." The picture follows them closely.
- **Storyboard grid.** One image with up to 15 line-art panels. Bind it as
  "shot order and rough composition; do not adopt the sketch style or the
  text". The video follows it loosely. Need strict? Use keyframes.
- **Blockout (3D clay model video).** Coarse geometry gives camera, blocking
  and timing. Map each blob to a subject: "the red model in [Video1] is the
  man from [Image1]". Fine blockout: "Render [Video1]", keep structure,
  replace materials, scene and style.
- **Edit.** Name the one master video and the edit verb. Scope it: what
  changes, from A to B, when. Close the scope: "Except for the objects named
  above, every visible person, prop and background element in [Video1]
  remains unchanged." For a moving object, "inherits the same timing, path,
  speed and occlusion as the original".
- **Audio edit.** Same master rule. "Change only the man's line to 'Do not
  come here', American accent; keep every other sound, the lip timing and
  all visuals."
- **Extend.** "Extend [Video1] forward" or "backward". Describe the boundary
  frame first: pose, props, camera, light, audio state. Then the new event.
  The subject stays one continuous object; no duplicate, no swap. Backward:
  end the new segment on the source's first frame and keep later props out.
- **One-click reel.** Many stills, "turn all images into a short vlog,
  live-photo motion only, do not alter the images".
- **Seamless transition.** Two clips: describe the camera move that carries
  [Video1] into [Video2] and what morphs during it.

## 2.0 versus 2.5

| | 2.0 family | 2.5 |
|---|---|---|
| Timing | Shot numbers only | Integer-second timestamps |
| Character sheets | One headshot + one full body; multi-view reads as several people | Multi-view fine up to 5 subjects |
| Face drift fix | Separate headshot, large face, listed first | Same, less needed |
| Reference count | 4 to 5 assets | Up to 50, stable to about 8 images |
| Aspect | Fixed enums | Adaptive follows the assets |

## Pre-flight checklist

Before `vsb run video/seedance-*`:

1. Every attached asset has one binding line with take and ignore?
2. Summary sentence names subject, place, event, style, camera?
3. Shots use timestamps on 2.5, shot numbers on 2.0?
4. One camera move per shot, with a named subject?
5. Actions are body part + range + speed, emotions are visible cues?
6. Dialogue in double quotes, no dashes inside, one language?
7. "No subtitles." present when subtitles are unwanted? Audio mode named?
8. Edit or extend prompt names the master video and its verb, and closes
   the scope?
9. No "drone" or "FPV" wording?
10. Nothing about aspect, resolution or total duration in the prompt? Those
    are flags.

All yes: run. Any no: not ready.
