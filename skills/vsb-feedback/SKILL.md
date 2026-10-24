---
name: vsb-feedback
description: >
  Send feedback to the Visual Sandbox team with the MCP tool submit_feedback
  or `vsb feedback`: a bug, a result that missed what was asked, a missing
  feature or model, something confusing, or praise. Trigger when the person
  says "tell them", "report this", "send feedback", "this is broken", "this
  should exist", "I love this", or when a tool fails in a way that is not
  the person's input or your own mistake. One report for each issue, never
  when the person asks you not to send one.
license: Proprietary. See LICENSE for the terms.
---

# Send feedback

Feedback goes to the team that builds Visual Sandbox. It is free, and it is
how a defect gets fixed.

## When to send

- **The person asks.** Send what they say, as `source: "user"`.
- **You see a defect yourself.** A tool fails with a server error, a result
  breaks the model's own rules, an error message is wrong, or a documented
  field does not work. Send it as `source: "agent"`, then tell the person in
  one line that you sent it.

Do not send:

- Your own mistakes: a wrong field, a wrong slug, a file that was not there.
- An expected refusal, such as too little credit or a field out of range.
- Anything when the person asks you not to.
- A refund request. Feedback starts no refund and no new run. Send the person
  to hello@visualsandbox.com for a refund.

## How to send

Over MCP:

```json
{
  "category": "generation_quality",
  "source": "agent",
  "message": "Asked for a 9:16 clip of a red mug; got 16:9 with a blue mug. The prompt named the color twice.",
  "attempted_task": "A product video for a mug",
  "tool_name": "video_p_video",
  "job_id": "8f3…"
}
```

With the CLI: `vsb feedback "<message>" --kind generation_quality --json`.

| `category` | Use it for |
|------------|------------|
| `bug` | An error, a crash, a tool that does not do what its description says |
| `generation_quality` | A result that missed the prompt, the reference or the model's own promise |
| `missing_feature` | A model, a field or a tool that the person needed and is not there |
| `confusing` | A message, a price or a step that the person or you could not understand |
| `praise` | Something that worked well |
| `other` | Anything else |

## Write the message

- What was asked, what came back, and what was expected. Two or three
  sentences.
- The exact error text and the job id, when there is one.
- No passwords, payment details, private files or the person's own words that
  they did not want shared.

Send one report for each issue. A second failure of the same kind in the same
task is not a new report.
