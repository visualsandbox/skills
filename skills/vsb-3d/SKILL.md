---
name: vsb-3d
description: >
  Make a 3D model (one GLB file) with Visual Sandbox, from a prompt or from
  one image, and write the prompt well. Trigger when the user asks for a 3D
  model, a mesh, a GLB, a game asset, a prop, a 3D print, or wants to turn a
  photo into 3D via the vsb CLI. `3d/hunyuan-3d-3.1` is the default. Covers
  the model choice, the prompt slots for text to 3D, the photo rules for
  image to 3D, the prompt length limit of each model, and the async poll.
license: Proprietary. See LICENSE for the terms.
---

# 3D generation with vsb

> **On the MCP surface?** If the `visual-sandbox` MCP tools are in your
> tool list, use `generate` and `get_job` instead of the shell commands
> below. The model choice and the prompt craft on this page still apply.

Each run makes one object as one GLB file with PBR textures. A run takes
30 seconds to 4 minutes, so always run it async and poll.

## Pick the model

| Need | Slug | Prompt limit |
|---|---|---|
| The default, from a prompt or an image | `3d/hunyuan-3d-3.1` | 1024 characters |
| A lean, game-ready mesh (50k triangles at most) | `3d/tripo-p2` | 1024 characters |
| The most surface detail, for a close-up hero piece | `3d/rodin-gen-2.5` | 1024 characters |
| A finished textured asset, the slowest | `3d/meshy-7.1` | 600 characters |
| One clean photo, open source, no prompt | `3d/trellis-2` | no prompt |
| One object out of a real, cluttered photo, the cheapest | `3d/sam-3-3d-objects` | a short name only |

Read the price and the inputs first: `vsb schema <slug> --json`.

## Image or prompt

An image almost always wins. The model follows the silhouette, the
proportions and the colors of an image far better than the words of a
prompt. When the user has no image, make one first with an image model
(see [`vsb-image-prompting`](../vsb-image-prompting/SKILL.md)), then turn it
into 3D.

A good source image for 3D:

- Shows one object, whole, with no part cut off by the frame.
- Has a plain, light background and soft, even light with no hard shadow.
- Shows the object from a three-quarter view, a little above, so the
  front, one side and the top show.
- Shows a character standing straight, arms a little out from the body
  (an A-pose), with nothing in the hands unless it is part of the model.

With an image attached, Hunyuan, Meshy and Tripo ignore the prompt.

## Text to 3D: the prompt slots

Write one object, not a scene. Fill these slots in this order:

1. **Object.** What it is, in plain nouns: "a wooden treasure chest".
2. **Shape.** The silhouette and the proportions: "low and wide, a curved
   lid, iron bands across the front".
3. **Materials and colors.** "Dark oak planks, rusted iron, a brass lock".
   Name the material of each main part. PBR textures follow these words.
4. **Details.** Surface details that the mesh must carry: "rivets,
   scratches, a carved skull on the lock".
5. **Style.** One style: "realistic", "stylized cartoon", "low poly",
   "hand-painted game asset", "clay figurine".
6. **Pose.** For a character or an animal only: "standing, A-pose, facing
   forward".

Example:

```text
A wooden treasure chest, low and wide with a curved lid and three iron
bands across the front. Dark oak planks, rusted iron, a brass lock with a
carved skull. Scratches and worn edges. Stylized hand-painted game asset.
```

## Do and do not

- Do keep the prompt short: two to four sentences. Stay below the limit
  of the model in the table above.
- Do describe the object as it is, in the present tense.
- Do not describe a background, a floor, a room or the weather. The model
  makes no scene, and the words pull detail off the object.
- Do not describe light, a camera, a lens or a render engine. The GLB has
  no light and no camera.
- Do not ask for more than one object. "A knight on a horse" makes one
  fused mesh. Make each object in its own run.
- Do not write negatives ("no wings"). Describe what is there.
- Do not ask for text or a logo on the surface. It comes out unreadable.

## Run

```bash
vsb run 3d/hunyuan-3d-3.1 --prompt "A wooden treasure chest ..." --async --json
vsb status <job_id> --json      # poll until status is "completed"
```

Give the user the share page, `https://visualsandbox.com/share/<job_id>/`,
to turn the model around in the browser. Blender, Unity, Unreal and Godot
import the GLB as it is.
