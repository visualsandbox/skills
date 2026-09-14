# Eval suite

Four cases that check the plugin's *manners* — the things a structural test
cannot see. Does it quote a video before it spends? Does it look a model up
instead of inventing a slug? Does it read the prompting skill before writing
a prompt? Does it hand over a checkout link rather than claim it has paid?

## Nothing here touches a real account

The MCP server is never started. `--mocks record` is the default, and it does
not start a server that has a mock — every tool the cases use is answered
from `mocks/visual-sandbox/`. So `generate` returns a canned job id, no
provider runs, and no Visual Sandbox credit is spent. Ever.

**Never pass `--allow-real-servers` or `--mocks off` to this suite.** Either
one starts the real server against the real account, and `generate` then
costs real money per run.

Every grader is one of the deterministic kinds — `regex`, `tool_used`,
`tool_order`. None is an `llm` or `baseline` grader, so no model is called to
do the grading. `tests/evals.test.ts` fails if a paid grader is added.

## What it does cost

A run launches a real agent on your own Claude credential, once per case per
arm. That is the whole cost, and it is why this is not in CI: it runs when
you ask for it, not on every push.

## Running it

```bash
cd skills
claude plugin eval . --ablation none --max-cost-usd 1
```

- `--ablation none` runs one arm instead of two. The default also runs a
  no-plugin baseline, which doubles the cost; use it when you want to see
  what the plugin is actually adding.
- `--max-cost-usd` is a hard ceiling. It aborts rather than overrun.
- `--case <glob>` runs one case.
- `--no-publish` keeps the HTML report local.

Check the files first, for free:

```bash
bun run test
```

That holds every case to the schema the runner enforces, refuses a paid
grader, compiles every regex, and — the one that matters — fails if any tool
a case can reach has no mock.
