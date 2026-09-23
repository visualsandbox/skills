import { describe, expect, test } from "bun:test";
import { createHash } from "node:crypto";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

/**
 * This repository is two things — a Claude plugin and the skill library the
 * CLI embeds — and both break quietly. A plugin with a malformed manifest
 * does not error, it simply fails to install. A skill whose frontmatter is
 * wrong does not error, it just never loads, and the agent writes worse
 * prompts with nobody the wiser.
 *
 * Everything here reads files on disk. No network, nothing to pay for.
 */

const ROOT = join(import.meta.dir, "..");
const SKILLS = join(ROOT, "skills");
const sha256 = (s: string) => createHash("sha256").update(s, "utf-8").digest("hex");

const readJson = (p: string) => JSON.parse(readFileSync(join(ROOT, p), "utf-8"));
const skillDirs = () =>
  readdirSync(SKILLS).filter((n) => statSync(join(SKILLS, n)).isDirectory());

/** The frontmatter block of a markdown file, as raw lines. */
function frontmatter(body: string): string | null {
  if (!body.startsWith("---\n")) return null;
  const end = body.indexOf("\n---", 4);
  return end === -1 ? null : body.slice(4, end);
}

describe("the repository's version", () => {
  test("package.json carries one, and the plugin agrees with it", () => {
    const pkg = readJson("package.json");
    expect(pkg.version, "run: cd ../cli && bun run sync-version").toMatch(
      /^\d+\.\d+\.\d+$/,
    );
    expect(readJson(".claude-plugin/plugin.json").version).toBe(pkg.version);
  });
});

describe("the plugin manifest", () => {
  test("plugin.json parses and names the plugin", () => {
    const p = readJson(".claude-plugin/plugin.json");
    expect(p.name).toBe("visual-sandbox");
    expect(p.version).toMatch(/^\d+\.\d+\.\d+$/);
    expect(p.description.length).toBeGreaterThan(20);
  });

  test("marketplace.json points at a plugin that is here", () => {
    const m = readJson(".claude-plugin/marketplace.json");
    expect(m.plugins).toHaveLength(1);
    const entry = m.plugins[0];
    expect(entry.name).toBe(readJson(".claude-plugin/plugin.json").name);
    expect(existsSync(join(ROOT, entry.source))).toBe(true);
  });

  test("the marketplace version matches the plugin version", () => {
    // They are read from different files by different code paths, and a
    // mismatch shows the user one number and installs another.
    expect(readJson(".claude-plugin/marketplace.json").plugins[0].version).toBe(
      readJson(".claude-plugin/plugin.json").version,
    );
  });

  test("the plugin version matches the CLI's, when the CLI is a sibling", () => {
    // cli/package.json is where a version is decided; this is a copy, kept
    // by cli/scripts/sync-version.ts. The CLI's CI checks out both repos and
    // fails there too — this covers a workspace checkout.
    const cliPkg = join(ROOT, "..", "cli", "package.json");
    if (!existsSync(cliPkg)) return; // repo checked out on its own
    const cli = JSON.parse(readFileSync(cliPkg, "utf-8"));
    expect(
      readJson(".claude-plugin/plugin.json").version,
      "run: cd ../cli && bun run sync-version",
    ).toBe(cli.version);
  });

  test(".mcp.json points at the production server over https", () => {
    const servers = readJson(".mcp.json").mcpServers;
    expect(Object.keys(servers)).toEqual(["visual-sandbox"]);
    expect(servers["visual-sandbox"].type).toBe("http");
    expect(servers["visual-sandbox"].url).toBe("https://visualsandbox.com/mcp");
  });

  test("the plugin ships no credential of its own", () => {
    // A token committed here would be handed to everyone who installs it.
    const raw = readFileSync(join(ROOT, ".mcp.json"), "utf-8");
    expect(raw).not.toMatch(/vs_[a-f0-9]{16}/);
    expect(raw.toLowerCase()).not.toContain("secret");
  });
});

describe("the commands the plugin adds", () => {
  const dir = join(ROOT, "commands");
  const files = () => readdirSync(dir).filter((n) => n.endsWith(".md"));

  test("there is at least one, and each has a description", () => {
    expect(files().length).toBeGreaterThan(0);
    for (const name of files()) {
      const fm = frontmatter(readFileSync(join(dir, name), "utf-8"));
      expect(fm).not.toBeNull();
      expect(fm).toContain("description:");
    }
  });

  test("a command that takes an argument says so", () => {
    for (const name of files()) {
      const body = readFileSync(join(dir, name), "utf-8");
      if (body.includes("$ARGUMENTS")) {
        expect(frontmatter(body)).toContain("argument-hint:");
      }
    }
  });

  test("every command that spends money says the price comes first", () => {
    // /video runs the expensive modality. It must quote before it spends.
    const video = readFileSync(join(dir, "video.md"), "utf-8");
    expect(video).toContain("estimate_cost");
    expect(video.toLowerCase()).toContain("wait for a yes");
  });
});

describe("every skill pack", () => {
  test("has a SKILL.md with a name and a description", () => {
    for (const name of skillDirs()) {
      const body = readFileSync(join(SKILLS, name, "SKILL.md"), "utf-8");
      const fm = frontmatter(body);
      expect(fm, `${name} has no frontmatter`).not.toBeNull();
      expect(fm, `${name} declares no name`).toContain("name:");
      expect(fm, `${name} declares no description`).toContain("description:");
    }
  });

  test("declares the name of the directory it lives in", () => {
    // The runtime loads by directory and matches by name; a mismatch means
    // the skill is installed under one name and triggers under another.
    for (const name of skillDirs()) {
      const fm = frontmatter(readFileSync(join(SKILLS, name, "SKILL.md"), "utf-8")) ?? "";
      const declared = /^name:\s*(\S+)/m.exec(fm)?.[1];
      expect(declared, `${name}/SKILL.md`).toBe(name);
    }
  });

  test("has a description long enough to route on", () => {
    // The description is the only thing the runtime reads to decide whether
    // a skill applies. One line of it is not enough to decide anything.
    for (const name of skillDirs()) {
      const body = readFileSync(join(SKILLS, name, "SKILL.md"), "utf-8");
      const fm = frontmatter(body) ?? "";
      const desc = /description:\s*>?\s*([\s\S]*?)(?:\n[a-z_-]+:|$)/.exec(fm)?.[1] ?? "";
      expect(desc.trim().length, `${name} description`).toBeGreaterThan(60);
    }
  });

  test("links to a sibling skill that exists", () => {
    const known = new Set(skillDirs());
    for (const name of skillDirs()) {
      const body = readFileSync(join(SKILLS, name, "SKILL.md"), "utf-8");
      for (const [, target] of body.matchAll(/\]\(\.\.\/([a-z0-9-]+)\/SKILL\.md/g)) {
        expect(known.has(target), `${name} links to ../${target}/, which is not here`).toBe(
          true,
        );
      }
    }
  });

  test("links to a reference file that exists", () => {
    for (const name of skillDirs()) {
      const dir = join(SKILLS, name);
      const body = readFileSync(join(dir, "SKILL.md"), "utf-8");
      for (const [, rel] of body.matchAll(/\]\((references\/[a-z0-9._-]+)\)/g)) {
        expect(existsSync(join(dir, rel)), `${name} links to ${rel}, which is not here`).toBe(
          true,
        );
      }
    }
  });

  test("is named in the vsb skill's table and in the README", () => {
    // `vsb setup` installs a few packs. The `vsb` skill is the one an agent
    // always has, so its table is how the agent learns the others exist.
    const trunk = readFileSync(join(SKILLS, "vsb", "SKILL.md"), "utf-8");
    const table = trunk.slice(trunk.indexOf("## Skill packs"));
    const readme = readFileSync(join(ROOT, "README.md"), "utf-8");
    for (const name of skillDirs()) {
      expect(table, `add ${name} to Skill packs in vsb/SKILL.md`).toContain(`| \`${name}\` |`);
      expect(readme, `add ${name} to the Skills table in README.md`).toContain(`[\`${name}\`]`);
    }
  });
});

describe("index.json, which the CLI verifies against", () => {
  const index = () => JSON.parse(readFileSync(join(SKILLS, "index.json"), "utf-8"));

  test("lists every skill directory, and no others", () => {
    const listed = index().skills.map((s: { name: string }) => s.name);
    expect(listed.sort()).toEqual(skillDirs().sort());
  });

  test("every checksum matches the file on disk", () => {
    // The CLI refuses a file whose sha256 does not match this manifest, so a
    // stale index.json means a skill that cannot be installed at all.
    for (const skill of index().skills) {
      for (const file of skill.files) {
        const path = join(SKILLS, skill.name, file.path);
        expect(existsSync(path), `${skill.name}/${file.path} is missing`).toBe(true);
        expect(sha256(readFileSync(path, "utf-8")), `${skill.name}/${file.path}`).toBe(
          file.sha256,
        );
      }
    }
  });

  test("carries a bundle hash over every file", () => {
    // The three surfaces serve different snapshots of this repository — the
    // CLI embeds one at build time, the plugin ships the commit it was
    // installed at, the MCP reads main live. `bundle` is how you tell which
    // one you are reading; a release number cannot.
    const idx = index();
    expect(idx.bundle, "run `bun run gen`").toMatch(/^[0-9a-f]{64}$/);
    const recomputed = sha256(
      idx.skills
        .flatMap((s: { name: string; files: { path: string; sha256: string }[] }) =>
          s.files.map((f) => `${s.name}/${f.path}:${f.sha256}`),
        )
        .sort()
        .join("\n"),
    );
    expect(idx.bundle, "the bundle does not match the files it covers").toBe(recomputed);
  });

  test("version stays the schema version, not a release number", () => {
    // sync-version.ts writes release numbers into package.json and the
    // plugin manifests. Writing one here would break every reader that
    // checks the shape of this file.
    expect(index().version).toBe(1);
  });

  test("lists every file that is actually in each skill directory", () => {
    const walk = (dir: string, base = ""): string[] =>
      readdirSync(dir).flatMap((n) => {
        const p = join(dir, n);
        return statSync(p).isDirectory() ? walk(p, `${base}${n}/`) : [`${base}${n}`];
      });
    for (const skill of index().skills) {
      const onDisk = walk(join(SKILLS, skill.name)).sort();
      const listed = skill.files.map((f: { path: string }) => f.path).sort();
      expect(listed, `${skill.name}: run \`bun run gen\``).toEqual(onDisk);
    }
  });
});
