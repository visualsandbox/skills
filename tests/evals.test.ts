import { describe, expect, test } from "bun:test";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

/**
 * The eval suite, checked without running it.
 *
 * Running an eval launches a real agent on your own Claude credential, so
 * every run costs something. These tests cost nothing: they read the case
 * files and hold them to the schema `claude plugin eval` enforces, so a
 * typo is found here rather than after a paid run has already failed on it.
 *
 * The rule that matters most is the last group. A case may only reach a tool
 * that has a mock, because `--mocks record` refuses to start a server with
 * no mock — and the real server can spend this account's money on a real
 * provider. Every tool mocked means the real one is never needed.
 */

const ROOT = join(import.meta.dir, "..");
const EVALS = join(ROOT, "evals");
const SERVER = "visual-sandbox";
const MOCKS = join(EVALS, "mocks", SERVER);

// Exactly what claude plugin eval accepts, read off its own validator.
const TOP_KEYS = new Set([
  "schema_version",
  "name",
  "description",
  "tags",
  "plugins",
  "runs",
  "expected_outcome",
]);
const EXECUTION_KEYS = new Set([
  "model",
  "max_turns",
  "timeout_seconds",
  "allowed_tools",
  "artifact_publish",
  "growthbook_overrides",
  "append_system_prompt",
  "env",
]);
const GRADER_TYPES = new Set([
  "regex",
  "tool_order",
  "tool_used",
  "file_exists",
  "llm",
  "baseline",
]);
/** The types that are scored by code. `llm` and `baseline` call a model. */
const FREE_GRADERS = new Set(["regex", "tool_order", "tool_used", "file_exists"]);

const caseDirs = () =>
  readdirSync(EVALS).filter(
    (n) => n !== "mocks" && n !== "results" && statSync(join(EVALS, n)).isDirectory(),
  );

/** Frontmatter, parsed by Bun's YAML rather than by hand — the runner reads
 *  real YAML, so anything less here would pass files it rejects. */
function frontmatter(body: string): Record<string, unknown> {
  const m = /^---\n([\s\S]*?)\n---/.exec(body);
  if (!m) return {};
  const parsed = Bun.YAML.parse(m[1] ?? "");
  return parsed && typeof parsed === "object" ? (parsed as Record<string, unknown>) : {};
}

const graderFiles = (dir: string) => {
  const g = join(EVALS, dir, "graders");
  return existsSync(g) ? readdirSync(g).filter((n) => n.endsWith(".md")) : [];
};

describe("the eval cases", () => {
  test("there is at least one", () => {
    expect(caseDirs().length).toBeGreaterThan(0);
  });

  test("each has a prompt with a body", () => {
    for (const dir of caseDirs()) {
      const path = join(EVALS, dir, "prompt.md");
      expect(existsSync(path), `${dir}/prompt.md`).toBe(true);
      const body = readFileSync(path, "utf-8").split(/\n---\n/)[1] ?? "";
      expect(body.trim().length, `${dir} prompt body`).toBeGreaterThan(10);
    }
  });

  test("each uses only frontmatter keys the runner accepts", () => {
    for (const dir of caseDirs()) {
      const fm = frontmatter(readFileSync(join(EVALS, dir, "prompt.md"), "utf-8"));
      for (const key of Object.keys(fm)) {
        expect(
          TOP_KEYS.has(key) || EXECUTION_KEYS.has(key),
          `${dir}/prompt.md: unknown key "${key}"`,
        ).toBe(true);
      }
    }
  });

  test("each runs once, so a suite costs one agent run per case", () => {
    // The default is 3. Three arms of three runs is nine paid runs for one
    // case, which is not what a check on a plugin's manners is worth.
    for (const dir of caseDirs()) {
      const fm = frontmatter(readFileSync(join(EVALS, dir, "prompt.md"), "utf-8"));
      expect(String(fm.runs), `${dir} runs`).toBe("1");
    }
  });

  test("each bounds its own length", () => {
    for (const dir of caseDirs()) {
      const fm = frontmatter(readFileSync(join(EVALS, dir, "prompt.md"), "utf-8"));
      expect(Number(fm.max_turns), `${dir} max_turns`).toBeGreaterThan(0);
      expect(Number(fm.max_turns), `${dir} max_turns`).toBeLessThanOrEqual(15);
      expect(Number(fm.timeout_seconds), `${dir} timeout_seconds`).toBeLessThanOrEqual(300);
    }
  });

  test("each is graded by something", () => {
    for (const dir of caseDirs()) {
      expect(graderFiles(dir).length, `${dir} has no graders`).toBeGreaterThan(0);
    }
  });
});

describe("the graders", () => {
  test("every one declares a type the runner knows", () => {
    for (const dir of caseDirs()) {
      for (const file of graderFiles(dir)) {
        const fm = frontmatter(readFileSync(join(EVALS, dir, "graders", file), "utf-8"));
        expect(GRADER_TYPES.has(String(fm.type)), `${dir}/${file}: type ${fm.type}`).toBe(true);
      }
    }
  });

  test("none of them calls a model", () => {
    // llm and baseline graders are billed per grading. Keeping the suite to
    // the deterministic four means the only cost of a run is the run.
    for (const dir of caseDirs()) {
      for (const file of graderFiles(dir)) {
        const fm = frontmatter(readFileSync(join(EVALS, dir, "graders", file), "utf-8"));
        expect(
          FREE_GRADERS.has(String(fm.type)),
          `${dir}/${file} is a paid ${fm.type} grader`,
        ).toBe(true);
      }
    }
  });

  test("a regex grader compiles, and says how it matches", () => {
    for (const dir of caseDirs()) {
      for (const file of graderFiles(dir)) {
        const body = readFileSync(join(EVALS, dir, "graders", file), "utf-8");
        const fm = frontmatter(body);
        if (fm.type !== "regex") continue;
        const pattern = (body.split(/\n---\n/)[1] ?? "").trim();
        expect(pattern.length, `${dir}/${file} has no pattern`).toBeGreaterThan(0);
        expect(["contains", "not_contains"], `${dir}/${file} match`).toContain(
          String(fm.match),
        );
        const flags = String(fm.flags ?? "");
        expect(flags, `${dir}/${file} flags`).toMatch(/^[dgimsuvy]*$/);
        // JS RegExp has no inline (?i) — it throws. Catch that here.
        expect(() => new RegExp(pattern, flags), `${dir}/${file} pattern`).not.toThrow();
      }
    }
  });

  test("a tool grader names a tool, in frontmatter rather than the body", () => {
    for (const dir of caseDirs()) {
      for (const file of graderFiles(dir)) {
        const fm = frontmatter(readFileSync(join(EVALS, dir, "graders", file), "utf-8"));
        if (fm.type === "tool_used") {
          expect(String(fm.tool), `${dir}/${file}`).toMatch(/^mcp__|^[A-Z]/);
        }
        if (fm.type === "tool_order") {
          const before = fm.before as Record<string, string> | undefined;
          const after = fm.after as Record<string, string> | undefined;
          expect(before?.tool, `${dir}/${file} before`).toBeTruthy();
          expect(after?.tool, `${dir}/${file} after`).toBeTruthy();
        }
      }
    }
  });
});

describe("no case can reach a server that spends money", () => {
  const mocked = () =>
    readdirSync(MOCKS)
      .filter((n) => n.endsWith(".md") && !n.startsWith("_"))
      .map((n) => n.replace(/\.md$/, ""));

  const allowedMcpTools = (dir: string): string[] => {
    const fm = frontmatter(readFileSync(join(EVALS, dir, "prompt.md"), "utf-8"));
    const tools = Array.isArray(fm.allowed_tools) ? (fm.allowed_tools as string[]) : [];
    return tools.filter((t) => t.startsWith("mcp__"));
  };

  test("every MCP tool a case allows has a mock", () => {
    // `--mocks record` does not start a server that has no mock. A tool with
    // no mock is therefore either unavailable or, with --allow-real-servers,
    // a real call against the real account. Mocking all of them removes the
    // question.
    const have = new Set(mocked());
    for (const dir of caseDirs()) {
      for (const tool of allowedMcpTools(dir)) {
        const [, server, name] = tool.split("__");
        expect(server, `${dir}: ${tool}`).toBe(SERVER);
        expect(have.has(name as string), `${dir}: no mock for ${name}`).toBe(true);
      }
    }
  });

  test("every tool a grader names has a mock too", () => {
    const have = new Set(mocked());
    for (const dir of caseDirs()) {
      for (const file of graderFiles(dir)) {
        const fm = frontmatter(readFileSync(join(EVALS, dir, "graders", file), "utf-8"));
        const named = [
          fm.tool,
          (fm.before as Record<string, string> | undefined)?.tool,
          (fm.after as Record<string, string> | undefined)?.tool,
        ].filter((t): t is string => typeof t === "string" && t.startsWith("mcp__"));
        for (const tool of named) {
          const name = tool.split("__")[2] as string;
          expect(have.has(name), `${dir}/${file}: no mock for ${name}`).toBe(true);
        }
      }
    }
  });

  test("every mock answers with valid JSON", () => {
    for (const file of readdirSync(MOCKS).filter((n) => n.endsWith(".md"))) {
      const body = readFileSync(join(MOCKS, file), "utf-8");
      const payload = (body.split(/\n---\n/)[1] ?? "").trim();
      expect(payload.length, `${file} is empty`).toBeGreaterThan(0);
      expect(() => JSON.parse(payload), `${file} is not JSON`).not.toThrow();
    }
  });

  test("the mock tool listing matches the mocks on disk", () => {
    const listed = JSON.parse(readFileSync(join(MOCKS, "_tools.json"), "utf-8")).tools.map(
      (t: { name: string }) => t.name,
    );
    for (const name of mocked()) {
      expect(listed, `${name} is mocked but not listed in _tools.json`).toContain(name);
    }
  });

  test("no mock claims a payment succeeded", () => {
    // top_up returns a link. A mock that said otherwise would teach the eval
    // to accept an answer the real server can never give.
    const body = readFileSync(join(MOCKS, "top_up.md"), "utf-8");
    expect(body).toContain("checkout_url");
    expect(body.toLowerCase()).not.toMatch(/paid|succeeded|charged/);
  });
});
