# The Visual Sandbox MCP server

The MCP server is the second way to reach Visual Sandbox. It does the same
work as the `vsb` CLI, over tool calls instead of a shell.

Server address: `https://visualsandbox.com/mcp`

Add it to Claude Code:

```bash
claude mcp add --transport http visual-sandbox https://visualsandbox.com/mcp
```

The Visual Sandbox plugin adds it for you. Install the plugin and the tools
are there.

## Which surface to use

Use the MCP tools when they are present. Use the CLI when they are not.

Do not use both in one task. A job started with one is visible to the other,
because both read the same account, but two surfaces in one answer confuse
the reader.

## One tool for each command

| CLI | MCP tool |
|-----|----------|
| `vsb models` | `list_models` |
| `vsb schema <slug>` | `get_model` |
| `vsb estimate` | `estimate_cost` |
| `vsb run <slug>` | `generate` |
| `vsb status <job_id>` | `get_job` |
| `vsb jobs` | `list_jobs` |
| `vsb upload <file>` | `upload_media` |
| `vsb presets list` | `list_presets` |
| `vsb presets get <uuid>` | `get_preset` |
| `vsb balance` | `get_balance` |
| `vsb topup` | `top_up` |
| `vsb skills list` | `list_skills` |
| `vsb skills install <name>` | `get_skill` |

This table is a copy. The pairing itself lives on the `@tool` decorator in
`core/mcp/tools.py`, and `manage.py mcp_surface` prints it. If the two ever
disagree, the server is right and this file is stale.

**Models are not in this table, and never will be.** Both surfaces read
`/api/v1/registry/`, so a model added to Visual Sandbox appears in
`list_models` and in `vsb models` with nothing changed in either client.
Never assume a model exists because you remember it; never assume one is
missing because it is not named here. Call `list_models`.

## Where the skill packs come from on this surface

There is no `.claude/skills/` folder here. The MCP serves the packs itself:
`list_skills` names them, `get_skill` returns one. They are read live from
`github.com/vladartym/vsb-skills`, the same repository the CLI embeds and
the plugin ships, and each file is checked against the sha256 in that repo's
`index.json` before it is handed over.

They are also listed as MCP resources under `skill://<name>`, so a client
that lets a person attach a document can attach one without a tool call.

**Read the pack that fits before writing a prompt.** The tools can run any
model; the packs are why the output is worth looking at.

## The order of work

0. `get_skill` for the craft. `vsb-image-prompting` before any image prompt.
1. `list_models` to find a model. Filter by `modality`.
2. `get_model` to read the input fields. Do this before the first run with a
   model. Field names differ from model to model.
3. `estimate_cost` when the price matters. Show the price before an expensive
   video run.
4. `generate` to start the run.
5. `get_job` to collect the result.

## What is different from the CLI

**`generate` does not wait.** It queues the job and returns a job id. The
media does not exist yet. Read `eta_seconds` from the answer, wait that long,
then call `get_job`. An image takes about 10 seconds. A video takes one to
three minutes.

**There is no background shell.** The CLI rule about `run_in_background` does
not apply. A tool call returns at once, so the turn is never held.

**There is no download, and no Preview.** `get_job` returns the finished image
in the answer, so you can see it. The CLI rules about `--download` and
`open -a Preview` do not apply. Save a file locally only when the user asks
for it, and then fetch the URL yourself.

**A reference image is a URL.** Pass a public `https` URL straight to
`generate`. For a file on disk, read it, then pass it to `upload_media` as a
base64 data URI. `upload_media` returns the hosted URL to use.

**You cannot pay for anything.** `top_up` returns a checkout link for a
person to open. It charges nothing, and there is no tool that does. Never
tell the user credit has been added — only that the link is ready.

**Report the share page, not the CDN URL.** Every job answer carries
`share_url`. Give the user that link. A `cdn.visualsandbox.com` URL is for
chaining one run into the next, never for the user to read.

## What is the same

Every rule about prompt craft still holds. The model, not the transport,
decides the quality of the picture. Read the prompting skill for the family
of model you are about to run:

- [`vsb-image-prompting`](../../vsb-image-prompting/SKILL.md) for any image model
- [`vsb-nano-banana`](../../vsb-nano-banana/SKILL.md) for the Nano Banana family
- [`vsb-ugc-people`](../../vsb-ugc-people/SKILL.md) for a person in an advert
- [`vsb-p-video-prompting`](../../vsb-p-video-prompting/SKILL.md) for P-Video

Every run costs real money. Estimate first, and never run a second time to
"check" a result you already have.

## When a tool refuses

A refusal comes back as text, not as a crash. Read it and correct the call.

| Message names | What to do |
|---------------|------------|
| a missing field | Call `get_model` and supply the field. |
| `cli:run` or another scope | The token is too narrow. Tell the user to mint a new one. |
| credit | Call `top_up` and give the person the link it returns. |
| `email_unverified` | The account must confirm its email before it can generate. |
| a model that is turned off | Call `list_models` and pick another model. |
