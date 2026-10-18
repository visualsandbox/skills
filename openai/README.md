# The OpenAI plugin package (ChatGPT and Codex)

This folder turns this repository into a plugin for the OpenAI plugin
directory. The directory is how ChatGPT users find a plugin, and it is the
channel that grew CreativeClaw from $5,254 in August 2026 to $92,894 in
September. Issue: `visualsandbox/visual-sandbox#67`.

| File | What it does |
|------|--------------|
| `plugin.openai.json` | The listing, the keywords, the review test cases, the commerce statement and the release notes. `name` must be the plugin id that the portal gives you. |
| `mcp.json` | Records the server address, `https://visualsandbox.com/mcp/chatgpt`. The ZIP does not ship it: the portal sets the server when you create the plugin. The build checks that this file names the right address. |
| `assets/icon.png` | The 512 px icon. |

## Why a second server address

OpenAI forbids selling credit inside a plugin. `/mcp/chatgpt` is the same
server as `/mcp` without the `top_up` tool and without the top-up link in
`get_balance`. A person adds credit on visualsandbox.com. The rule lives in
the django repository, in `core/mcp/transport.py`.

## Build

```bash
bun run openai:check   # validate only
bun run openai:build   # write output/openai/visual-sandbox-openai-<version>.zip
```

The build copies the skills in `SHIPPED`, adds an `agents/openai.yaml` to
each one, turns links to unshipped packs into plain text, and checks every
limit in OpenAI's submission guide. It refuses to write a ZIP while `name`
is still the placeholder.

## Submit, the first time

Do these in order. Each one needs a person.

1. Deploy the django branch, so `https://visualsandbox.com/mcp/chatgpt` is
   live. Check that `/.well-known/oauth-protected-resource/mcp/chatgpt`
   answers 200.
2. In the OpenAI platform portal, verify the domain `visualsandbox.com`.
3. Create the plugin with the server address above. Connect it once with
   OAuth to check that sign-in works.
4. Copy the `app-…` id that the portal shows into `name` in
   `plugin.openai.json`.
5. Run `bun run openai:build` and upload the ZIP under Plugins.
6. Enter the 5 positive and 3 negative test cases from `plugin.openai.json`
   in the MCP review form. The portal does not read them from the ZIP.
7. Make a reviewer account with credit on it, and enter its sign-in in the
   portal. Never put the sign-in in this repository.
8. Record a short demo video and add screenshots, 706 px wide.

## Each later release

Edit the skills, raise `version` and `publication.release_notes`, build, and
upload the new ZIP. A change to the server needs no new ZIP: deploy it, then
press Rescan in the portal.
