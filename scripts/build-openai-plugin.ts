#!/usr/bin/env bun
/**
 * Builds the plugin ZIP for the OpenAI plugin directory (ChatGPT and Codex).
 *
 *   bun run scripts/build-openai-plugin.ts          # writes output/openai/*.zip
 *   bun run scripts/build-openai-plugin.ts --check  # validates only
 *
 * The ZIP is a portable Agent Plugins package: `plugin.json`, `mcp.json`
 * with the one server, the skills listed in SHIPPED, and the icon. The first
 * upload must carry the server, because the portal cannot add one to a
 * plugin that has none. The review test cases ride along in `plugin.json`,
 * which the portal accepts beside exactly one server.
 *
 * Every limit below is one from OpenAI's submission guide. A package that
 * breaks one is refused at upload, so it is refused here first.
 */
import { execFileSync } from "node:child_process";
import {
  cpSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const ROOT = join(import.meta.dir, "..");
const OPENAI = join(ROOT, "openai");
const CHECK_ONLY = process.argv.includes("--check");

// The ChatGPT surface: every tool but the top-up tool, which the directory
// forbids. See django `core/mcp/transport.py`.
const MCP_URL = "https://visualsandbox.com/mcp/chatgpt";

// The packs that work with MCP tools alone. The edit packs (crop, cut,
// speed, timeline, subtitles, download) run local ffmpeg through the CLI,
// and `vsb` is the CLI guide, so none of them belongs in a chat client.
const SHIPPED = [
  "vsb-setup",
  "vsb-product-photoshoot",
  "vsb-ugc-ad",
  "vsb-ad-variations",
  "vsb-animate-photo",
  "vsb-short-film",
  "vsb-talking-avatar",
  "vsb-clone-voice",
  "vsb-video-to-reels",
  "vsb-edit-video",
  "vsb-html-video",
  "vsb-library-themes",
  "vsb-swap-motion",
  "vsb-feedback",
  "vsb-characters",
  "vsb-image",
  "vsb-image-prompting",
  "vsb-image-iteration",
  "vsb-nano-banana",
  "vsb-ugc-people",
  "vsb-video",
  "vsb-p-video",
  "vsb-p-video-prompting",
  "vsb-seedance",
  "vsb-seedance-prompting",
  "vsb-audio",
  "vsb-vector",
  "vsb-3d",
  "vsb-design",
];

const errors: string[] = [];
const fail = (message: string) => errors.push(message);
const json = (path: string) => JSON.parse(readFileSync(path, "utf-8"));
const chars = (value: unknown) => Array.from(String(value ?? "")).length;
const https = (value: unknown) => typeof value === "string" && /^https:\/\/[^\s@]+$/.test(value);

const base = json(join(ROOT, ".claude-plugin", "plugin.json"));
const overlay = json(join(OPENAI, "plugin.openai.json"));
const mcp = json(join(OPENAI, "mcp.json"));
const openai = structuredClone(overlay.extensions["com.openai"]);
const ui = openai.interface ?? {};

const manifest = {
  $schema: "https://agent-plugins.org/schemas/1.0.0/plugin.schema.json",
  name: overlay.name,
  version: overlay.version,
  description: base.description,
  author: { name: "Visual Sandbox", email: "hello@visualsandbox.com", url: "https://visualsandbox.com" },
  homepage: base.homepage,
  repository: base.repository,
  license: base.license,
  keywords: overlay.keywords,
  extensions: { "com.openai": openai },
};

// A stable package identifier. The portal keeps its own plugin id: a ZIP
// upload takes the identity of the plugin it is uploaded to.
if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(manifest.name ?? "") || chars(manifest.name) > 64) {
  fail("name must be lowercase letters, numbers and single hyphens, 64 characters at most");
}
if (!/^\d+\.\d+\.\d+$/.test(manifest.version ?? "")) fail("version must be x.y.z");
if (chars(manifest.description) > 4000) fail("description is longer than 4000 characters");
if (!ui.displayName || chars(ui.displayName) > 30) fail("interface.displayName: required, 30 characters at most");
if (!ui.shortDescription || chars(ui.shortDescription) > 30 || /\n/.test(ui.shortDescription)) {
  fail("interface.shortDescription: required, one line, 30 characters at most");
}
if (!ui.longDescription || chars(ui.longDescription) > 4000) fail("interface.longDescription: required, 4000 characters at most");
// The directory forbids selling inside a plugin, and its reviewers read the
// listing for it.
if (/\b(free|trial|discount|promo(tion)?|top[ -]?up|subscribe|subscription)\b|\$\d/i.test(`${ui.shortDescription} ${ui.longDescription}`)) {
  fail("listing text must not name prices, trials, discounts, top-ups or subscriptions");
}
if (!ui.developerName || chars(ui.developerName) > 80) fail("interface.developerName: required, 80 characters at most");
if (!ui.category) fail("interface.category is required");
if (!Array.isArray(ui.capabilities) || ui.capabilities.length > 20 || ui.capabilities.some((c: string) => chars(c) > 120)) {
  fail("interface.capabilities: 20 labels at most, 120 characters each");
}
for (const field of ["websiteURL", "supportURL", "privacyPolicyURL", "termsOfServiceURL"]) {
  if (!https(ui[field]) || chars(ui[field]) > 1024) fail(`interface.${field} must be an HTTPS URL`);
}
const prompts: string[] = ui.defaultPrompt ?? [];
if (prompts.length > 3 || new Set(prompts).size !== prompts.length || prompts.some((p) => chars(p) > 128 || p.includes("@"))) {
  fail("defaultPrompt: 3 unique prompts at most, 128 characters each, no @mentions");
}
for (const field of ["brandColor", "brandColorDark"]) {
  if (ui[field] !== undefined && !/^#[0-9A-Fa-f]{6}$/.test(ui[field])) fail(`interface.${field} must be #RRGGBB`);
}
for (const field of ["composerIcon", "logo"]) {
  const file = join(OPENAI, ui[field] ?? "");
  if (!ui[field] || !existsSync(file)) {
    fail(`interface.${field}: ${ui[field]} is not under openai/`);
    continue;
  }
  const png = readFileSync(file);
  const width = png.readUInt32BE(16);
  const height = png.readUInt32BE(20);
  if (png.readUInt32BE(12) !== 0x49484452) fail(`interface.${field} is not a PNG`);
  else if (width !== height || width < 48 || width > 4096 || png.length > 5 * 1024 * 1024) {
    fail(`interface.${field}: square, 48 to 4096 px, 5 MiB at most (it is ${width}x${height})`);
  }
}
const onboarding = /^\.\/skills\/([a-z0-9-]+)\/SKILL\.md$/.exec(openai.onboardingSkill ?? "")?.[1];
if (!onboarding || !SHIPPED.includes(onboarding)) fail("onboardingSkill must be one of the shipped skills");

const cases = openai.review?.test_cases ?? {};
const positive = cases.positive ?? [];
const negative = cases.negative ?? [];
if (positive.length !== 5) fail(`review needs exactly 5 positive test cases, not ${positive.length}`);
if (negative.length !== 3) fail(`review needs exactly 3 negative test cases, not ${negative.length}`);
for (const [kind, list] of [["positive", positive], ["negative", negative]] as const) {
  list.forEach((c: Record<string, string>, i: number) => {
    if (!c.description || !c.prompt) fail(`${kind}[${i}] needs a description and a prompt`);
    if (kind === "positive" && (!c.tools_triggered || !c.expected_behavior)) {
      fail(`positive[${i}] needs tools_triggered and expected_behavior`);
    }
  });
}
if (typeof openai.review?.commerce !== "boolean") fail("review.commerce must be true or false");
if (!openai.publication?.release_notes) fail("publication.release_notes is required");

const servers = Object.values(mcp.mcpServers ?? {}) as { url?: string; type?: string }[];
if (servers.length !== 1 || servers[0].url !== MCP_URL || servers[0].type !== "streamable-http") {
  fail(`openai/mcp.json must name one streamable-http server, ${MCP_URL}`);
}

for (const name of SHIPPED) {
  const file = join(ROOT, "skills", name, "SKILL.md");
  if (!existsSync(file)) {
    fail(`skills/${name}/SKILL.md is missing`);
    continue;
  }
  const head = readFileSync(file, "utf-8").split("\n---")[0];
  if (!new RegExp(`^---[\\s\\S]*\\bname:\\s*${name}\\b`).test(head) || !/\bdescription:/.test(head)) {
    fail(`skills/${name}/SKILL.md needs name: ${name} and a description`);
  }
}

// The demo video is private, so it comes from the environment, never from
// the repository. Without it the portal asks for the link in the form.
const demo = process.env.OPENAI_DEMO_RECORDING_URL;
if (demo) {
  if (!https(demo)) fail("OPENAI_DEMO_RECORDING_URL must be an HTTPS URL");
  openai.review.demo_recording_url = demo;
}

if (errors.length) {
  console.error(errors.map((e) => `error: ${e}`).join("\n"));
  process.exit(1);
}

const staging = mkdtempSync(join(tmpdir(), "visual-sandbox-openai-"));
const pkg = join(staging, "visual-sandbox");
mkdirSync(join(pkg, "skills"), { recursive: true });
for (const name of SHIPPED) {
  cpSync(join(ROOT, "skills", name), join(pkg, "skills", name), { recursive: true });
  // Tells ChatGPT and Codex which server a skill needs.
  mkdirSync(join(pkg, "skills", name, "agents"), { recursive: true });
  writeFileSync(
    join(pkg, "skills", name, "agents", "openai.yaml"),
    [
      "dependencies:",
      "  tools:",
      '    - type: "mcp"',
      '      value: "visual-sandbox"',
      '      description: "Visual Sandbox image, video, audio, vector and design tools"',
      '      transport: "streamable_http"',
      `      url: "${MCP_URL}"`,
      "policy:",
      "  allow_implicit_invocation: true",
      "",
    ].join("\n"),
  );
}
// A link to a pack that is not shipped would open nothing in ChatGPT, so it
// becomes plain text. Most of them point at `vsb`, the CLI guide.
const unshipped = /\[([^\]]+)\]\((?:\.\.\/)+([a-z0-9-]+)\/SKILL\.md[^)]*\)/g;
for (const name of SHIPPED) {
  for (const rel of readdirSync(join(pkg, "skills", name), { recursive: true }) as string[]) {
    if (!rel.endsWith(".md")) continue;
    const file = join(pkg, "skills", name, rel);
    const text = readFileSync(file, "utf-8");
    const kept = text.replace(unshipped, (link, label, target) => (SHIPPED.includes(target) ? link : label));
    if (kept !== text) writeFileSync(file, kept);
  }
}
// The ChatGPT plugin starts with the low-cost models. The packs are shared
// with the CLI and Claude, which keep their own defaults, so only the
// packaged copy gets this block, after the frontmatter.
const CHATGPT_DEFAULTS: Record<string, string> = {
  "vsb-image": [
    "## Default model in ChatGPT",
    "",
    "For a new image from a prompt, call `image_recraft_v4_1_flash` ($0.01 an image).",
    "It takes no reference image, so for an edit of a photo call `image_nano_banana_2_lite`.",
    "Use another model only when the person names one or asks for what these cannot do.",
    "This rule comes before the defaults in the table below.",
  ].join("\n"),
  "vsb-video": [
    "## Default model in ChatGPT",
    "",
    "For a video, call `video_p_video_2`. It makes a clip from a prompt, a first frame or an audio file, with sound.",
    "Use another model only when the person names one or asks for what P-Video 2 cannot do.",
    "This rule comes before the defaults in the table below.",
  ].join("\n"),
};
for (const [name, block] of Object.entries(CHATGPT_DEFAULTS)) {
  const file = join(pkg, "skills", name, "SKILL.md");
  const text = readFileSync(file, "utf-8");
  const end = text.indexOf("\n---\n", 4);
  if (!text.startsWith("---\n") || end < 0) throw new Error(`skills/${name}/SKILL.md has no frontmatter`);
  writeFileSync(file, `${text.slice(0, end + 5)}\n${block}\n${text.slice(end + 5)}`);
}
cpSync(join(OPENAI, "assets"), join(pkg, "assets"), { recursive: true });
writeFileSync(join(pkg, "plugin.json"), JSON.stringify(manifest, null, 2) + "\n");
cpSync(join(OPENAI, "mcp.json"), join(pkg, "mcp.json"));
cpSync(join(ROOT, "LICENSE"), join(pkg, "LICENSE"));

const summary = `${SHIPPED.length} skills, ${positive.length}+${negative.length} review cases, ${manifest.keywords.length} keywords`;
if (CHECK_ONLY) {
  console.log(`OpenAI package ${manifest.version} is valid (${summary}).`);
} else {
  const out = join(ROOT, "output", "openai");
  mkdirSync(out, { recursive: true });
  const zip = join(out, `visual-sandbox-openai-${manifest.version}.zip`);
  rmSync(zip, { force: true });
  // The plugin's files sit at the root of the ZIP, as the portal expects.
  execFileSync("zip", ["-qrX", zip, "."], { cwd: pkg });
  console.log(`Built ${zip} (${summary}).`);
}
rmSync(staging, { recursive: true, force: true });
