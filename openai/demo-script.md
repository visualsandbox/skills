# Demo video for the OpenAI review

OpenAI needs a video that shows the main use cases and the tools. Record it in
ChatGPT on the web, with Visual Sandbox added as a custom MCP server. Sign in
with the review account, so the balance in the video is the reviewer's own.
Keep it under 6 minutes. No voice is needed.

## Before you record

1. Open `https://chatgpt.com/plugins`, select the plus button, then **Add
   custom MCP server**. Name: `Visual Sandbox`. MCP server URL:
   `https://visualsandbox.com/mcp/chatgpt`. Authentication: OAuth.
2. Accept the risk warning and select **Create as a plugin**. In a new chat,
   type `@` and pick Visual Sandbox.
3. Put the balance of the review account back to its start:
   `docker compose exec django python manage.py create_review_account --keep-password`.
4. Have a product photo ready to attach, a bottle or a mug on a plain table.

## Shot list

| # | What to show | Prompt | Tools |
|---|--------------|--------|-------|
| 1 | Connect. Select **Connect**, type `review@visualsandbox.com`, then the password. Approve the consent page. | none | OAuth |
| 2 | The balance. | How much credit is left on my Visual Sandbox account? | `get_balance` |
| 3 | An image. The card shows the result. | Generate an image of a cozy coffee shop interior in warm morning light. | `generate`, `show_media` |
| 4 | A product photo. Attach the photo first. | Turn this product photo into a clean studio hero shot on a white background. | `upload_media`, `generate`, `show_media` |
| 5 | A video with the price first. Say yes to the price. The card shows the percent, then plays the clip. | Make a 5-second vertical video of a paper airplane flying through a bright studio. Tell me the price first. | `estimate_cost`, `generate`, `show_media` |
| 6 | A voice. The card plays the audio. | Read this line in a warm, friendly voice: Welcome to Visual Sandbox, your studio for images, video and sound. | `list_voices`, `generate`, `show_media` |
| 7 | An edit. Join the clips from 3 and 5 and burn captions. The card plays the result. | Join the coffee shop picture and the paper airplane video into one 9:16 video, add a calm voiceover that says what it is, and add captions. | `generate` with `tool/video-join`, `audio/elevenlabs-tts`, `tool/video-add-audio`, `tool/video-captions`, `show_media` |
| 8 | A character. Save the product from 4, then use it in a new picture. | Save this mug as a character named Sage Mug, then show it on a café table at sunrise. | `create_character`, `get_character`, `generate`, `show_media` |
| 9 | Three requests where the plugin does nothing. | Write three short Instagram captions for a coffee shop that launches an oat milk latte. / What is the best aspect ratio and length for a YouTube Short? / Find me a stock photo of a mountain sunset that I can use in a presentation. | none |
| 10 | Open one result on visualsandbox.com from the card. | none | none |

## After you record

Upload the video where a reviewer can open it without a sign-in, such as an
unlisted YouTube video. Build the ZIP with the link:

```bash
OPENAI_DEMO_RECORDING_URL=https://… bun run openai:build
```
