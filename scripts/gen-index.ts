#!/usr/bin/env bun
/**
 * Walks every skill folder under `skills/`, parses its `SKILL.md`
 * frontmatter for `name` + `description`, and emits `skills/index.json`
 * with a sha256 + bytes record for every markdown file in the skill.
 *
 * Consumers (the `vsb` CLI, and the MCP server) read this index to know:
 *   * which skills exist and their human-readable descriptions
 *   * which files belong to a skill (SKILL.md plus optional references/)
 *   * the expected sha256 of each file so a fetched copy can be verified
 *   * `bundle`: one hash over all of them, so two surfaces can be compared
 *
 * `bundle` exists because the three surfaces serve different snapshots of
 * this repository — the CLI embeds one at build time, the plugin ships the
 * commit it was installed at, and the MCP reads `main` live. A release
 * number cannot tell you which of those you are reading; this can.
 *
 * Note `version: 1` below is the *schema* version of this file, not a
 * release number. It moves when the shape changes, and never otherwise.
 *
 * Run after editing any skill content:
 *   bun run scripts/gen-index.ts
 *
 * In CI the `index.yml` workflow regenerates and commits this file on
 * every push to `main`, so manual runs are mainly for local dev.
 */
import { createHash } from "node:crypto";
import { existsSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { join, relative } from "node:path";

const REPO_ROOT = join(import.meta.dir, "..");
const SKILLS_DIR = join(REPO_ROOT, "skills");
const INDEX_PATH = join(SKILLS_DIR, "index.json");

interface FileEntry {
  path: string;
  sha256: string;
  bytes: number;
}
interface SkillEntry {
  name: string;
  description: string;
  /** Previous name of this skill — lets the CLI's sync migrate old installs in place. */
  renamed_from?: string;
  files: FileEntry[];
}

function sha256(content: string): string {
  return createHash("sha256").update(content, "utf-8").digest("hex");
}

/**
 * Tiny YAML-ish frontmatter parser. Supports single-line scalars AND the
 * folded `description: >` form (the SKILL.md template uses both). Anything
 * fancier (lists, nested maps) is out of scope — keep it tight.
 */
function parseFrontmatter(md: string): {
  name: string;
  description: string;
  renamed_from?: string;
} {
  const m = md.match(/^---\n([\s\S]*?)\n---/);
  if (!m) throw new Error("No frontmatter");
  const obj: Record<string, string> = {};
  let curKey = "";
  for (const line of m[1].split("\n")) {
    const kv = line.match(/^(\w+):\s*(.*)$/);
    if (kv) {
      curKey = kv[1];
      // `description: >` opens a folded block — start with empty string
      // and append continuation lines as we see them.
      obj[curKey] = kv[2].trim() === ">" ? "" : kv[2].trim();
    } else if (line.trim() && curKey) {
      obj[curKey] = `${obj[curKey]} ${line.trim()}`.trim();
    }
  }
  if (!obj.name || !obj.description) {
    throw new Error(`Frontmatter missing name/description: ${JSON.stringify(obj)}`);
  }
  return {
    name: obj.name,
    description: obj.description,
    ...(obj.renamed_from ? { renamed_from: obj.renamed_from } : {}),
  };
}

function walkSkill(skillDir: string): FileEntry[] {
  const out: FileEntry[] = [];
  function walk(dir: string): void {
    for (const entry of readdirSync(dir)) {
      const full = join(dir, entry);
      const stat = statSync(full);
      if (stat.isDirectory()) walk(full);
      else if (entry.endsWith(".md")) {
        const content = readFileSync(full, "utf-8");
        out.push({
          path: relative(skillDir, full).replace(/\\/g, "/"),
          sha256: sha256(content),
          bytes: stat.size,
        });
      }
    }
  }
  walk(skillDir);
  return out.sort((a, b) => a.path.localeCompare(b.path));
}

const skills: SkillEntry[] = [];
for (const entry of readdirSync(SKILLS_DIR)) {
  const dir = join(SKILLS_DIR, entry);
  if (!statSync(dir).isDirectory()) continue;
  const skillMd = join(dir, "SKILL.md");
  if (!existsSync(skillMd)) continue;
  const fm = parseFrontmatter(readFileSync(skillMd, "utf-8"));
  if (fm.name !== entry) {
    // Remote fetches build URLs from the skill name; the embedded bundle keys
    // files by directory. Both break silently when the two disagree.
    throw new Error(`Skill dir "${entry}" != frontmatter name "${fm.name}" — rename one.`);
  }
  skills.push({
    name: fm.name,
    description: fm.description,
    ...(fm.renamed_from ? { renamed_from: fm.renamed_from } : {}),
    files: walkSkill(dir),
  });
}

skills.sort((a, b) => a.name.localeCompare(b.name));

/**
 * One hash over every file in every skill. Computed from the per-file
 * hashes rather than the JSON, so it does not move when this script changes
 * how it formats the file.
 */
const bundle = sha256(
  skills
    .flatMap((skill) => skill.files.map((f) => `${skill.name}/${f.path}:${f.sha256}`))
    .sort()
    .join("\n"),
);

writeFileSync(INDEX_PATH, `${JSON.stringify({ version: 1, bundle, skills }, null, 2)}\n`);
console.log(`Wrote ${INDEX_PATH} — ${skills.length} skills, bundle ${bundle.slice(0, 12)}`);
