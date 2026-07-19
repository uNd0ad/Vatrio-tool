#!/usr/bin/env node
/**
 * Gate-checks backlog completion %, then (if the threshold is met) bumps
 * the version in package.json, commits, tags, and pushes.
 *
 * SAFETY: runs in --dry-run mode by default. Nothing is written to git
 * unless you pass --auto explicitly. This matters when an agent (Gemini
 * via Antigravity) is the one calling this script — you want it to be
 * able to *check* the gate freely, but only push for real when you've
 * told it (via the workflow prompt) that auto-push is allowed.
 *
 * Usage:
 *   node scripts/release.mjs --milestone m1-crawler-reliability
 *   node scripts/release.mjs --milestone m1-crawler-reliability --bump minor --auto
 *
 * Flags:
 *   --milestone <id>   required. Which milestone's % gates the release.
 *   --bump <type>       patch (default) | minor | major
 *   --auto              actually commit/tag/push. Omit for a dry run.
 */
import { readFileSync, writeFileSync } from "fs";
import { execSync } from "child_process";
import { fileURLToPath } from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.join(__dirname, "..");
const pkgPath = path.join(repoRoot, "package.json");

function parseArgs() {
  const args = process.argv.slice(2);
  const get = (flag, fallback = undefined) => {
    const i = args.indexOf(flag);
    return i >= 0 ? args[i + 1] : fallback;
  };
  return {
    milestone: get("--milestone"),
    bump: get("--bump", "patch"),
    auto: args.includes("--auto"),
  };
}

function run(cmd, opts = {}) {
  return execSync(cmd, { cwd: repoRoot, stdio: "pipe", ...opts })
    .toString()
    .trim();
}

function getMilestoneStatus(milestoneId) {
  const out = run(
    `node scripts/backlog-status.mjs ${milestoneId}`,
    { stdio: ["pipe", "pipe", "pipe"] }
  ).toString();
  return JSON.parse(out);
}

function bumpVersion(current, type) {
  const [major, minor, patch] = current.split(".").map(Number);
  if (type === "major") return `${major + 1}.0.0`;
  if (type === "minor") return `${major}.${minor + 1}.0`;
  return `${major}.${minor}.${patch + 1}`;
}

function assertCleanGitIdentity() {
  let name, email;
  try {
    name = run("git config user.name");
    email = run("git config user.email");
  } catch {
    name = email = "";
  }
  if (!name || !email) {
    console.error(
      "git user.name / user.email not configured for this repo. " +
        'Run: git config user.name "..." && git config user.email "..."'
    );
    process.exit(1);
  }
}

function main() {
  const { milestone, bump, auto } = parseArgs();

  if (!milestone) {
    console.error("Missing --milestone <id>. See backlog.json for valid IDs.");
    process.exit(1);
  }

  let status;
  try {
    status = getMilestoneStatus(milestone);
  } catch (e) {
    // backlog-status.mjs exits non-zero when threshold isn't met, but it
    // still prints valid JSON on stdout — re-parse from the error output.
    try {
      status = JSON.parse(e.stdout?.toString() ?? "{}");
    } catch {
      console.error("Could not read backlog status:", e.message);
      process.exit(1);
    }
  }

  console.log(
    `Milestone "${status.title}": ${status.done}/${status.total} tasks done (${status.percent}%). ` +
      `Threshold: ${status.meets_threshold ? "MET" : "not met"}.`
  );

  if (!status.meets_threshold) {
    console.log("Below threshold — no release action taken.");
    process.exit(0);
  }

  const pkg = JSON.parse(readFileSync(pkgPath, "utf-8"));
  const newVersion = bumpVersion(pkg.version, bump);
  const commitMessage = `chore(release): v${newVersion} — "${status.title}" at ${status.percent}% (${status.done}/${status.total})`;

  console.log(`Proposed version bump: ${pkg.version} -> ${newVersion}`);
  console.log(`Proposed commit message: ${commitMessage}`);

  if (!auto) {
    console.log(
      "\nDry run only (no --auto flag). Nothing was committed or pushed."
    );
    process.exit(0);
  }

  assertCleanGitIdentity();

  pkg.version = newVersion;
  writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + "\n");

  run("git add package.json backlog.json");

  // Verify there's actually something to commit — avoids the classic
  // silent no-op push when nothing changed.
  const staged = run("git diff --cached --name-only");
  if (!staged) {
    console.log("Nothing staged to commit — aborting to avoid an empty commit.");
    process.exit(1);
  }

  run(`git commit -m ${JSON.stringify(commitMessage)}`);
  run(`git tag v${newVersion}`);

  // Verify the commit actually landed before pushing.
  const headSha = run("git rev-parse HEAD");
  console.log(`Committed ${headSha}. Pushing...`);

  run("git push");
  run("git push --tags");

  console.log(`Released v${newVersion} and pushed.`);
}

main();
