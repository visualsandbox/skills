# Seedance prompt templates

One template per task. Replace every `<placeholder>`. Keep only the sections
the shot needs. The worked examples are condensed from the official Seedance
2.5 guide and the BytePlus `sd25-pe` optimizer skill. Asset numbers count by
position in each list: `[Image1]`, `[Video1]`, `[Audio1]`.

Do not write aspect ratio, resolution or total duration into the prompt.
Those are flags; see [`vsb-seedance`](../../vsb-seedance/SKILL.md).

## Text to video

```text
<Subject> <does the main action> in <scene>.
The picture is <style or mood>.
The camera <shot size, position, one move>.
The sound is <dialogue, ambience, effects, music>.
```

Example:

```text
A young ceramicist shapes clay on a wheel in a studio at dawn, holding the spinning clay with both hands until it forms a narrow-necked vase.
Soft morning light through the window on the left keeps the wooden table and the clay in warm natural tones.
The camera starts in a medium shot on the hands, then slowly pushes in toward the mouth of the vase.
The sound keeps the low hum of the wheel, palms on wet clay, and distant birdsong. No subtitles.
```

## Reference to video

```text
Goal: generate <video type or core event>. The subject is <subject>, the event is <summary>.

[Image1] is <subject>'s <appearance, wardrobe, structure, material>; do not use <background, other people>.
[Video1] is used for <action, camera move, pacing>; do not use <its identity, wardrobe, scene>.
[Audio1] is <speaker>'s <voice, dialogue, music, ambience>.
[Image2] is not used for people, scene, props, action or sound.

<Subject A> is [Image1] and always keeps <fixed features>.
<Subject A> and <Subject B> are <spatial or prop relationship>.

At the start: <state of people, props, scene>.
Main event: <continuous action>.
At the end: <positions, prop ownership, final picture>.

Keep <identities and count, wardrobe, prop ownership, spatial directions, sound> stable.
```

Example:

```text
Goal: generate a video of an old wooden chair being repaired. A carpenter inspects the loose backrest, applies wood glue and secures the joint. At the end the chair is stable.

[Image1] is the carpenter's face, short hair and dark blue work apron; do not use the image background.
[Image2] is the chair's curved backrest, dark wood grain and worn areas; do not use the person in the image.
[Video1] is used for the hand movements when applying glue and pressing the joint; do not use its character, clothing or workbench.

The carpenter always wears the dark blue apron from [Image1]. There is one chair, from [Image2], throughout. The tools stay on the right side of the table.

At the start the chair is centred on the table and the backrest joint is loose. The carpenter inspects the joint, applies glue, and presses the backrest into place with both hands. At the end the carpenter releases the chair and the backrest holds.

Keep the carpenter's identity and apron, the chair's structure and count, the tool positions and the room's orientation stable.
```

## Many subjects, several scenes

Group by type, then activate per scene. Never a range mapping.

```text
Characters:
<A> is [Image1]; use only face, hair and wardrobe.
<B> is [Image2]; use only face, hair and wardrobe.
Do not swap their looks, wardrobe, actions, positions or lines.

Props:
<Prop> is [Image3] and belongs only to <A>.

Scenes:
<Scene 1> is [Image4]; use only space, materials and light.
<Scene 2> is [Image5]; use only space, materials and light.

Action and sound:
[Video1] is <A>'s <action or camera move>; do not use its people or scene.
[Audio1] is <B>'s voice and lines.

Stage 1 | <Scene 1>: <who and what is in play>. <One event>. At the end: <visible state>.
Stage 2 | <Scene 2>: <who and what is in play>. <One event>. At the end: <visible state>.

Keep both identities and wardrobe, the prop's count and owner, each scene's orientation, and who speaks consistent.
```

## First and last frame

Pin the frames with `--image` and `--last_frame_image`, aspect `adaptive`.
The prompt then owns the motion between them.

```text
[Image1] is <subject>'s <face, wardrobe>; it does not change the first or last frame composition.

The shot starts from the first frame: <composition, subject position, prop state, camera>.
<One continuous action>.
It arrives at the last frame: <composition, subject position, prop state, camera>.
Keep <identity, prop structure and owner, scene layout, camera direction> continuous from first to last.
```

Example:

```text
The shot starts from the first frame: the baking station, the decorator at the turntable, the undecorated cake, a frontal medium shot.
The decorator rotates the turntable, pipes even cream along both tiers, then places the blueberries one by one.
Finally both hands move away from the cake and the shot arrives at the last frame: the decorated cake centred on the turntable, hands clear, same frontal medium shot.
Keep the decorator's identity and white uniform, the two-tier cake, the tool positions and the camera direction continuous.
```

## Keyframes in order

Several stills as `reference_images`. The picture follows them closely.

```text
Use Images 1 to N in order as keyframes.
[Image1] is the first state: <composition, positions, props, camera>.
[Image2] is the second state: <visible state at the end of stage one>.
[ImageN] is the last state: <composition, positions, props, camera>.
The shot passes through those states in order with continuous action between them.
Keep <identities, prop structure, scene layout, light, camera axis> continuous.
```

Example (from the guide):

```text
Use Images 1 to 7 in order as keyframes. In a sea of clouds and mountains, blue-and-pink long-tailed spirit fish soar through the air. The camera slowly moves toward an ancient town built into the mountainside, focusing on the pagoda at the top. The scene enters an elegant Chinese-style hall, where the spirit fish flies in through the window, lands in the round pool at the centre, and swims. Finally the view cuts to a dark temple, where an old monk with a white beard stands with his back to the camera, gazing at a huge framed painting of the hall and the fish. New Chinese ukiyo-e illustration style.
```

## Storyboard grid

One image, up to 15 line-art panels, no text on it. The video follows the
plot loosely; use keyframes when it must follow closely.

```text
[Image1] is an <N>-panel storyboard: read <left to right, top to bottom>; take the shot order and rough composition; do not take the sketch style, the notes or the placeholder figures.
[Image2] is <A>'s <face and wardrobe>.
[Image3] is <scene or prop>'s <structure, material, light>.

<Overall style line.>

Shot 1: [<shot size, camera>] <who, where, what>. <Sound.>
Shot 2: [<shot size, camera>] <who, where, what>. <Sound.>
...
Shot N: <closing action and final picture>.
```

Example (from the guide, shortened):

```text
Visual style: realistic domestic short drama, Arri Alexa Mini LF look, 35 mm, cinematic realistic light, indoor night with snow outside the window, film grain, real skin texture, subtle micro-expressions, no beautification.
Assets: storyboard [Image1], bedroom [Image2], Li Tian [Image3], Li Qian [Image4], the book "Happy Times" [Image5].
Shot 1: [Wide, locked-off, eye level] Snowy night. A man stands sideways at the floor-to-ceiling window, hands in pockets, watching the snow. A young girl stands beside him, watching him quietly.
Shot 2: [Medium, over the shoulder] The girl's back in the foreground. The man turns his head and looks gently at her. She bows her head in silence.
Shot 3: [Medium close-up, diagonal] The man holds out the book. The girl raises both hands to receive it.
Shot 4: [Close-up on the girl, centred] She clutches the book to her chest. Her eyes redden and tears roll down.
Shot 5: [Close-up on the man, oblique] A faint smile, melancholy in the eyes.
Shot 6: [Wide, locked-off] The girl turns and walks out of frame. The man stays alone at the window, staring into the snow. No subtitles.
```

A concept storyboard needs less: "Build a complete story from the storyboard
order, using the shots coherently."

## Blockout video (3D clay model)

Coarse blockout gives camera, blocking and timing; map every blob.

```text
[Video1] is a coarse blockout. Use it only for <action paths, blocking, camera position and moves, cuts, light changes, rhythm>; do not use its look, materials or scene.
The <red model> in [Video1] is <A> from [Image1].
The <green model> in [Video1] is <B> from [Image2].
[Image3] is the <scene>.

<Subject> completes <the event> in <the scene>.
Keep the blocking, camera moves, cuts and rhythm of [Video1].
Final look: <characters, scene, materials, style>. Sound: <dialogue, ambience, effects>.
```

Fine blockout keeps structure and gets re-rendered:

```text
Render [Video1]. Keep its subject structure, actions, layout, camera position, moves and cuts; do not keep the grey materials, blank background or any trajectory lines, axes or camera cones.
[Image1] is the character's <appearance, material, colour>.
[Image2] is the scene's <space, materials, light, style>.
Render the subject in [Video1] as <final subject> and the scene as <final scene>. No BGM; environmental and action sounds only.
```

Example (from the guide):

```text
Render [Video1]. No BGM; generate only environmental and action sounds.
The background is a nighttime cyberpunk city in deep blue and purple, dense skyscrapers, huge holographic billboards and neon between the buildings, a few flying vehicles with faint lights and subtle mechanical sounds. The character is a small raccoon in a black stealth suit, mostly a silhouette, cautious quiet footsteps, moving across a rooftop.
```

## Edit a video

One master. Scope in, scope out, timeline inheritance.

```text
Edit [Video1]: change only <original object or region> to <target>.
[Video1] is the only master and keeps the scene, camera position and moves, action paths, occlusions and event order.
[Image1] is the target's <appearance, structure, material>; do not use <its background, people, composition>.
Change only <objects and regions>. There is exactly <count> <target> throughout. Do not change <what must stay>.
Except for the objects named above, every visible person, prop and background element in [Video1] remains unchanged and is not replaced or removed.
<Target> inherits the timing, duration, path, speed, occlusions and exit of <original> at every appearance. All other actions, camera moves, cuts and event order stay as in [Video1].
```

Example:

```text
Edit [Video1]: replace only the red bicycle and its rider passing in front of the bench with the dark-grey electric patrol vehicle from [Image1].
[Video1] is the only master and keeps the park road, the two people on the bench, the camera, the rider's motion slot, the occlusions and the event order.
[Image1] is only the vehicle's body, colour and clear windshield; do not use its background or driver.
Remove the red bicycle and rider. There is exactly one patrol vehicle throughout. The two people, the trees, the road and the background stay as in [Video1].
The vehicle fills the rider's motion slot with the same timing, path, speed and occlusions. The bicycle and rider no longer appear.
```

Partial edit with time: "From 4-6 seconds in [Video1], change the man's
action from drinking coffee to mopping the floor. Leave the rest unchanged."

Visual edit from the guide, no reference image:

```text
Keep the composition, camera position, light and performance rhythm of [Video1]. Change only the lead's appearance and expression: she ages naturally from her twenties to about sixty. The restraint in her eyes softens, tears slide past the corners, the mouth lifts until she smiles through tears. One continuous shot, no jump cuts, no flicker. Her features age without drifting or changing identity.
```

## Audio edit

```text
Edit [Video1]: change only <speaker or sound type> in <the whole clip or a time range>.
[Video1] is the only master and keeps the visuals, actions, lip timing, shots, cut rhythm, all other audio and event order.
[Audio1] is <speaker>'s <voice, line, ambience, effect, music>; do not use <other audio>.
Change only <speaker, sound type, time range>.
Keep every other line, the lip timing, the ambience, the action sounds, the visuals and the cuts of [Video1] unchanged.
```

Examples: "Only edit the man's line in [Video1]: change it to 'Do not come
over here', American accent." "Remove the background music from [Video1];
keep dialogue, lip sync, ambience, action sounds and all visuals."
"Translate the dialogue in [Video1] into Chinese, no subtitles, adjust the
lip movement to the translated speech, keep everything else unchanged."

## Extend a video

Forward:

```text
[Video1] is the source to extend forward.
[Image1] is <new subject>'s <face, wardrobe>; do not use its background.

Extend [Video1] forward. The first frame of the new segment continues from the last frame of [Video1]: same <pose and facing>, <prop positions>, <background and layout>, <camera position and framing>, <light>, <audio state>, <motion trend>. The other assets do not replace this boundary frame.
Then <new action, event, shot or sound>. At the end: <visible state>.
Keep <identity and wardrobe>, <key props>, <layout>, <camera axis>, <ambience> continuous.
The subject stays one continuous object, never duplicated, split or swapped; body structure and part counts stay stable.
```

Backward:

```text
[Video1] is the source to extend backward.
Extend [Video1] backward. Before the source begins, <preceding action, event, shot, sound>.
The last frame of the new segment joins the first frame of [Video1]: same <pose and facing>, <props>, <layout>, <camera>, <light>, <audio state>, <motion trend>.
Keep <identity, props, layout, camera axis, ambience> continuous. The subject stays one continuous object.
Characters, props or effects that belong only to later parts of [Video1] do not appear early.
```

Example (from the guide):

```text
Extend [Video1] by 5 seconds. A bee flies in and lands on the flower. Then, in a macro close-up, its legs and abdomen are covered with golden pollen. The bee lifts off and the camera follows it to another flower of the same species. In slow motion, pollen shakes loose from the bee's hairs and falls into the stamen.
```

## Emotion, when the acting must be controlled

```text
The mood moves from <start> to <end>.
After <trigger>, <subject> first <immediate visible reaction>.
Then <eyes, brows, mouth, breath, gaze or hands> gradually <change>.
Finally <subject> shows <target emotion> through <visible performance>.
```

Example:

```text
The mood moves from restrained anticipation to composure after disappointment.
After the waiter sets a returned letter on the table, the woman's fingers on the rim of her cup stop, and her gaze drops to the return mark.
Her brows tighten, the faint smile fades, and after a slow breath she turns the envelope face down.
Finally she looks up at the empty chair across from her, keeps her shoulders straight, and says in a calm, slightly strained voice: "I understand."
```

## Product process

Turn a selling point into initial state, one operation, visible result, per
stage.

```text
Stage 1: At the start <product and parts as they are>. <Operator does one operation>. At the end <visible state>.
Stage 2: From that state, <the product does one function>. At the end <visible result>.
Stage 3: <Closing operation>. At the end <final state of product, parts and output>.
```

## One-click reel and seamless transition

```text
Turn all images into one short video; the order is free. A coffee-shop vlog in hand-drawn doodle cutout style about a puppy in different outfits. Playful internet-style BGM. The images may move slightly, like live photos, but do not alter them; keep the visuals consistent with the originals.
```

```text
Seamlessly connect [Video1] and [Video2]. At the end of [Video1] the camera flies up, turns back fast and dives straight down into [Video2]. During the move the mahjong tiles turn into high-rise buildings and the scene changes with them. Do not alter the two uploaded videos themselves.
```
