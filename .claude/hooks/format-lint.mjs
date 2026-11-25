import { spawnSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
const LINT_EXTENSIONS = new Set([".ts", ".tsx", ".js", ".jsx", ".mjs"]);
const SKIPPED_DIRS = ["node_modules", ".next", "references"];
const readStdin = async () => {
  let data = "";
  for await (const chunk of process.stdin) data += chunk;
  return data;
};
const run = (args, cwd) =>
  spawnSync("npx", args, { cwd, encoding: "utf8", shell: true });
const stripBlankLines = (file) => {
  let inTemplate = false;
  const lines = readFileSync(file, "utf8").split(/\r?\n/);
  const kept = lines.filter((line) => {
    const keep = inTemplate || line.trim() !== "";
    if ((line.match(/`/g) ?? []).length % 2 === 1) inTemplate = !inTemplate;
    return keep;
  });
  writeFileSync(file, kept.join("\n").trimEnd() + "\n");
};

const input = JSON.parse((await readStdin()) || "{}");
const filePath = input.tool_input?.file_path;
if (!filePath) process.exit(0);

const projectDir = path.resolve(
  process.env.CLAUDE_PROJECT_DIR ?? process.cwd(),
);
const absolute = path.resolve(filePath);
const relative = path.relative(projectDir, absolute);

if (relative.startsWith("..") || path.isAbsolute(relative)) process.exit(0);
if (relative.split(path.sep).some((part) => SKIPPED_DIRS.includes(part))) {
  process.exit(0);
}

const target = `"${absolute}"`;

const isCode = LINT_EXTENSIONS.has(path.extname(absolute).toLowerCase());

let lint;
if (isCode) lint = run(["eslint", "--fix", target], projectDir);
run(["prettier", "--write", "--ignore-unknown", target], projectDir);
if (isCode) stripBlankLines(absolute);

if (lint && lint.status !== 0) {
  process.stderr.write(
    `ESLint errores en ${relative}:\n${lint.stdout}${lint.stderr}`,
  );
  process.exit(2);
}

process.exit(0);
