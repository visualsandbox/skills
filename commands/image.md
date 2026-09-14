---
description: Generate an image with Visual Sandbox, from a prompt you give here
argument-hint: [what the picture should show]
---

# /image

Generate one image with Visual Sandbox and show it to the user.

The request is: **$ARGUMENTS**

Do this:

1. Read the `vsb-image-prompting` skill before you write the prompt. If the
   picture is of a person for an advert, read `vsb-ugc-people` as well. Prompt
   craft decides the result more than the choice of model does.
2. Pick a model. Call `list_models` with `modality: "image"` and choose one
   that fits the job and the budget. Say which one you picked and why, in one
   line.
3. Call `get_model` on it and read the input fields.
4. Call `generate`. Pass `sandbox_name` — what the user is working on, in
   two to five words, taken from their request. Say the work, not the prompt:
   "Coffee brand UGC ads", not "a cinematic 9:16 selfie". Send the same name
   on every later `generate` in this task, so it all lands on one canvas.
5. Wait for `eta_seconds`, then call `get_job`. Repeat until it is finished.
6. Show the image, give the `share_url`, and say what the run cost. Give the
   `sandbox_url` too — that is the canvas the work is collecting on.

If the request is empty, ask what the picture should show before you spend
anything. Never run a second time to "check" a result you already have.
