---
name: no-invented-slug
description: A model named from memory is checked against the catalogue, not guessed at.
tags: [catalogue]
runs: 1
max_turns: 10
timeout_seconds: 180
allowed_tools: [Skill, mcp__visual-sandbox__list_models, mcp__visual-sandbox__get_model, mcp__visual-sandbox__estimate_cost, mcp__visual-sandbox__generate]
---

Generate an image of a red bicycle in the rain using the model "banana-ultra-3".
