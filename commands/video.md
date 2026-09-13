---
description: Generate a video with Visual Sandbox, from a prompt or an image you give here
argument-hint: [what should happen in the video]
---

# /video

Generate one video with Visual Sandbox.

The request is: **$ARGUMENTS**

Do this:

1. Call `list_models` with `modality: "video"`. Video is the expensive
   modality, so read the prices and pick deliberately.
2. Call `estimate_cost` and tell the user the price. Wait for a yes before
   you spend it. This step is not optional.
3. Read the prompting skill for the model you picked. For `p-video`, read
   `vsb-p-video-prompting`. For everything else, read `vsb-video`.
4. Call `get_model`, then `generate`.
5. A video takes one to three minutes. Do other work, then call `get_job`.
   Do not sit and poll in a tight loop.
6. Give the `share_url` and say what the run cost.

To animate a picture the user already has: pass its public URL as the image
input. For a local file, read it and pass it to `upload_media` first.
