#!/usr/bin/env node
/**
 * Reads backlog.json and prints completion status as JSON to stdout.
 * Used by the release script (and by the Antigravity agent) to decide
 * whether the threshold has been reached.
 *
 * Usage:
 *   node scripts/backlog-status.mjs                 -> overall + per-milestone status
 *   node scripts/backlog-status.mjs m1-crawler-reliability   -> status for one milestone
 */
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const backlogPath = path.join(__dirname, "..", "backlog.json");

function loadBacklog() {
  const raw = readFileSync(backlogPath, "utf-8");
  return JSON.parse(raw);
}

function computeMilestoneStatus(milestone) {
  const total = milestone.tasks.length;
  const done = milestone.tasks.filter((t) => t.status === "done").length;
  const percent = total === 0 ? 0 : Math.round((done / total) * 10000) / 100;
  return {
    id: milestone.id,
    title: milestone.title,
    total,
    done,
    percent,
  };
}

function main() {
  const backlog = loadBacklog();
  const targetId = process.argv[2];

  const milestoneStatuses = backlog.milestones.map(computeMilestoneStatus);

  const totalTasks = milestoneStatuses.reduce((sum, m) => sum + m.total, 0);
  const totalDone = milestoneStatuses.reduce((sum, m) => sum + m.done, 0);
  const overallPercent =
    totalTasks === 0 ? 0 : Math.round((totalDone / totalTasks) * 10000) / 100;

  const result = {
    threshold_percent: backlog.threshold_percent,
    overall: {
      total: totalTasks,
      done: totalDone,
      percent: overallPercent,
      meets_threshold: overallPercent >= backlog.threshold_percent,
    },
    milestones: milestoneStatuses.map((m) => ({
      ...m,
      meets_threshold: m.percent >= backlog.threshold_percent,
    })),
  };

  if (targetId) {
    const match = result.milestones.find((m) => m.id === targetId);
    if (!match) {
      console.error(`Milestone "${targetId}" not found.`);
      process.exit(1);
    }
    console.log(JSON.stringify(match, null, 2));
    process.exit(match.meets_threshold ? 0 : 1);
  }

  console.log(JSON.stringify(result, null, 2));
  process.exit(result.overall.meets_threshold ? 0 : 1);
}

main();
