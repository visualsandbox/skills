# Visual Sandbox Skills and Claude plugin

Everything an AI agent needs to generate media with
[Visual Sandbox](https://visualsandbox.com): the knowledge packs that teach it
how to prompt each model, and the plugin that gives it the tools to run them.

This repository is two things at once.

**A Claude Code plugin.** `.claude-plugin/` + `.mcp.json` at the root ship the
skills, four slash commands, and the hosted MCP server as one install:

```bash
claude plugin marketplace add visualsandbox/skills
claude plugin install visual-sandbox@visual-sandbox
```

That adds the `visual-sandbox` MCP server at `https://visualsandbox.com/mcp`.
The first tool call opens a browser, you press Approve, and it is connected.
No token to copy. Then `/image a red bicycle in the rain` works straight away.

**A skill library for the `vsb` CLI.** Each skill is a single `SKILL.md` (plus
optional `references/`) with YAML frontmatter the agent runtime reads to decide
when the skill applies. The CLI embeds them in its binary and `vsb setup`
writes them to `~/.claude/skills/`.

Both surfaces do the same work. The `vsb` trunk skill opens with
[Two ways to run](skills/vsb/SKILL.md#two-ways-to-run-mcp-tools-or-the-cli),
which sends an agent holding MCP tools to
[the MCP reference](skills/vsb/references/mcp.md) and everyone else to the CLI.

## Commands the plugin adds

| Command | What it does |
|---------|--------------|
| `/image <what to show>` | Pick a model, write the prompt well, generate, show the picture |
| `/video <what happens>` | Price it first, wait for a yes, then generate |
| `/models [filter]` | The catalogue with prices, cheapest first |
| `/balance` | Credit left, and what the last ten runs cost |

## The MCP tools

`list_models`, `get_model`, `estimate_cost`, `generate`, `get_job`,
`list_jobs`, `upload_media`, `list_sandbox_items`, `get_selection`,
`read_sandbox_docs`, `write_sandbox_doc`, `create_design`, `get_design`,
`update_design`, `export_design`, `list_presets`, `get_preset`,
`get_balance`, `top_up`, `list_skills`, `get_skill` — one for each `vsb`
command. Add the server on its own, without the plugin:

```bash
claude mcp add --transport http visual-sandbox https://visualsandbox.com/mcp
```

Every generation is charged to the connected account. Nothing is free.

## Skills

| Skill | Purpose |
|-------|---------|
| [`vsb`](skills/vsb/) | Top-level guide to the `vsb` CLI — auth, run, status, presets, agent rules |
| [`vsb-image`](skills/vsb-image/) | Pick the right image model and prompt it well |
| [`vsb-video`](skills/vsb-video/) | Generate / edit video — async + status polling |
| [`vsb-audio`](skills/vsb-audio/) | Generate sound effects, ambient audio, speech |
| [`vsb-vector`](skills/vsb-vector/) | Make SVGs — Quiver for icons, raster-then-Recraft-vectorize for detailed art, colour count asked first |
| [`vsb-design`](skills/vsb-design/) | Design pages, screens and code drawings on the canvas in named layers — export as HTML, React, SVG or PNG, free |
| [`vsb-presets`](skills/vsb-presets/) | Run, save, override, and share reproducible model configurations |
| [`vsb-nano-banana`](skills/vsb-nano-banana/) | Prompt the Nano Banana family well — edit-mode rules, text rendering, multi-reference blending |
| [`vsb-image-prompting`](skills/vsb-image-prompting/) | Canonical prompt-craft trunk for every image model — anatomy, reference keep/ignore rules |
| [`vsb-image-iteration`](skills/vsb-image-iteration/) | Edit an image more than once without generation loss — prompt stacking, contact sheet, crop-and-composite |
| [`vsb-ugc-people`](skills/vsb-ugc-people/) | UGC-style single-person ad photos — selfie POV + talking-head formats for 9:16 TikTok/Reels |
| [`vsb-seedance`](skills/vsb-seedance/) | Run the Seedance family — tiers, reference lists, locked aspect and duration per task, price jumps |
| [`vsb-seedance-prompting`](skills/vsb-seedance-prompting/) | Prompt craft for Seedance — asset bindings, shot lists, timestamps, edits, extensions, templates |
| [`vsb-p-video`](skills/vsb-p-video/) | Run P-Video, the cheapest video model — draft toggle, pricing, async + poll |
| [`vsb-p-video-prompting`](skills/vsb-p-video-prompting/) | Prompt craft for P-Video — Pruna's slot formula, talking-avatar narration |
| [`vsb-crop`](skills/vsb-crop/) | Trim a clip or change its shape — local ffmpeg, free |
| [`vsb-cut`](skills/vsb-cut/) | Join clips with one of 23 named film transitions — local ffmpeg, free |
| [`vsb-speed`](skills/vsb-speed/) | Slow motion, reverse, boomerang, freeze frame, seamless loop — local ffmpeg, free |
| [`vsb-timeline`](skills/vsb-timeline/) | Build a longer edit — shots end to end, sound under, titles over, one render |
| [`vsb-subtitles`](skills/vsb-subtitles/) | Burn TikTok-style word-by-word captions into a video |
| [`vsb-download`](skills/vsb-download/) | Download a TikTok/IG/YouTube video and read it with frame grids |

## Install

```bash
# One-shot install of the binary + default skill bundle + auth
curl -fsSL https://visualsandbox.com/install.sh | sh
vsb setup
```

`vsb setup` writes the default bundle (`vsb`, `vsb-presets`, `vsb-image`, `vsb-image-prompting`, `vsb-video`, `vsb-audio`) into `~/.claude/skills/` so Claude Code finds them in every project. Pass `--project` to install into `./.claude/skills/` instead (committable, per-project, shared via git).

```bash
# Skills only — skip auth (re-run after editing locally)
vsb setup --skills-only

# Pick individual skills
vsb skills install nano-banana
vsb skills install ugc-people --project

# Refresh installed skills to the latest version baked into the binary
vsb skills update
```

Agents working with `vsb` should follow [`cli-install.md`](cli-install.md) for the full install playbook — covers PATH issues, token recovery, and the first-run verify.

### Planned: the film pyramid

Every skill above answers one question: how do I run this model well? None of
them answers what comes first — what am I making, and what should the shot be?

[`docs/film-pyramid.md`](docs/film-pyramid.md) plans six skills that sit above
the model, from an idea down to a finished cut, and says how they hand work to
each other. Nothing in it is built yet.

## Layout

```
skills/
├── <name>/
│   ├── SKILL.md          # frontmatter + body
│   └── references/        # optional supporting docs
├── index.json             # sha256 + bytes per file (generated)
```

## How the CLI consumes this

`vsb` embeds these skills directly into the binary at build time — every
release ships a snapshot of `skills/`, sha256-verified against `index.json`.
`vsb setup` / `vsb skills install` write from the embedded bundle with
zero network calls.

Power users can opt into the live registry instead of the embedded copy:

```bash
vsb skills install nano-banana --remote
# or for the whole session:
VSB_SKILLS_REMOTE=1 vsb setup --skills-only
```

Remote mode pulls from `https://raw.githubusercontent.com/visualsandbox/skills/main/skills/`,
caches in `~/.vsb/skills-cache/`, and verifies sha256 against the live `index.json`.
Pin to a tag, branch, or sha with `VSB_SKILLS_REF=v0.3 vsb setup --skills-only`.

## Contributing

Edits land in `skills/<name>/SKILL.md`. After editing locally:

```bash
bun run gen
```

That regenerates `skills/index.json` with fresh sha256s. The CI workflow
in `.github/workflows/index.yml` also regenerates the index on every
push to `main`, so manual runs are mainly for previewing the diff
before opening a PR.

## License

MIT — see [LICENSE](LICENSE).
