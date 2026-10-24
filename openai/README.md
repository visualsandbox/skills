# The OpenAI plugin package (ChatGPT and Codex)

This folder turns this repository into a plugin for the OpenAI plugin
directory. The directory is how ChatGPT users find a plugin. Issue:
`visualsandbox/visual-sandbox#67`.

| File | What it does |
|------|--------------|
| `plugin.openai.json` | The listing, the keywords, the review test cases, the commerce statement and the release notes. `name` is the package id, `visual-sandbox`. The portal keeps its own plugin id. |
| `mcp.json` | The one server, `https://visualsandbox.com/mcp/chatgpt`, with OAuth by dynamic client registration. The ZIP ships it at its root. |
| `assets/icon.png` | The 512 px icon. |

## Starter prompts and their screenshots

The portal takes one 706×860 screenshot for each starter prompt
(`defaultPrompt`). Each one in `assets/screenshots/` is the result card with a
real run, drawn by `core/mcp/card.html`. They are not in the ZIP; add them in
the portal with the next upload.

| Starter prompt | Screenshot | The real run behind it |
|----------------|------------|------------------------|
| Animate this product photo into a 5-second vertical video. | `1-animate-product-photo.png` | Veo 3.1 Fast, 8 s, 9:16, $1.50 |
| Make a 10-second vertical video ad for my product with a script and a voiceover. | `2-vertical-video-ad.png` | Seedance 2.5, 10 s, vertical, $2.89 |
| Turn this product photo into a clean studio shot and two lifestyle photos. | `3-studio-and-lifestyle-photos.png` | Nano Banana 2 Lite twice ($0.05 each) and FLUX.2 Klein 9B ($0.02) |

Change a starter prompt and its screenshot together.

## Why a second server address

OpenAI forbids selling credit inside a plugin. `/mcp/chatgpt` is the same
server as `/mcp` without the `top_up` tool, without the top-up link in
`get_balance`, and without the `vsb` skill pack, which names both. It adds
`show_media`, which draws the result in a card in the chat. A person adds
credit on visualsandbox.com, and a new account starts with a small credit.
The rules live in the django repository, in `core/mcp/transport.py`.

## Build

```bash
bun run openai:check   # validate only
bun run openai:build   # write output/openai/visual-sandbox-openai-<version>.zip
OPENAI_DEMO_RECORDING_URL=https://… bun run openai:build   # with the demo video
```

The ZIP is a portable Agent Plugins package: `plugin.json`, `mcp.json`, the
skills in `SHIPPED`, and the icon. The build adds an `agents/openai.yaml` to
each skill, turns links to unshipped packs into plain text, and checks every
limit in OpenAI's submission guide. The demo link is private, so it comes
from the environment and never from this repository.

## Submit, the first time

1. In the OpenAI platform, verify the organization in its settings, as a
   person or as a business. Only a verified identity can upload.
2. Run `bun run openai:build`. Under **Plugins**, select **Upload new or
   existing plugin**, choose the verified identity, and upload the ZIP. Fix
   any finding under **Metadata & Skills**.
3. Under **MCPs**, select **Connect**. The portal shows a domain token. Put
   it in `OPENAI_APPS_CHALLENGE` in `/opt/visual-sandbox/.env` and recreate
   the django container (`docker compose stop django && docker compose rm -f
   django && docker compose up -d django`). Check that
   `https://visualsandbox.com/.well-known/openai-apps-challenge` shows it.
4. Connect, sign in, and wait for the tool scan.
5. Under **Review details**, enter the reviewer account. Make it on the box
   with `docker compose exec django python manage.py create_review_account`.
   It prints the password once. The login URL is
   `https://visualsandbox.com/auth/login/`: type the email, then the
   password. No code is sent. Never put the password in this repository.
6. Add the demo video link, if the ZIP did not carry it.
7. Select **Submit for review** and accept the attestations.
8. After approval, open the approved version and select **Publish plugin**.

## Each later release

Edit the skills, raise `version` and `publication.release_notes`, build, and
select **Upload plugin to make changes** on the existing plugin. A change to
the server needs no new ZIP: deploy it, then select **Rescan** under
**MCPs**. Run `create_review_account --keep-password` to put the reviewer's
balance back before each review.
