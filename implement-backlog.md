# Workflow: Implement Backlog Milestone

Dispatch this from Antigravity's Manager view as a background/long-running goal.

## Goal template (paste into Manager, fill in the milestone id)

> Work through the `m1-crawler-reliability` milestone in `backlog.json`,
> following the process in `AGENTS.md`. Implement tasks one at a time, run tests
> after each, update task status in `backlog.json`, and check
> `node scripts/backlog-status.mjs
> m1-crawler-reliability` after every task.
> When the dry-run release check
> (`node scripts/release.mjs --milestone m1-crawler-reliability`, no `--auto`)
> reports the threshold is met, stop and show me the output — do not push
> anything without my confirmation.

## What "done" looks like for this workflow run

- Every task in the milestone is either `done` or explicitly flagged with a
  reason it's blocked.
- Test suite passes.
- A dry-run release report is shown to you, unpushed.
- Nothing was force-pushed, no secrets were committed, no history was rewritten.

## After you review and approve

Tell the agent explicitly, e.g.:

> Looks good, go ahead — run scripts/release.mjs --milestone
> m1-crawler-reliability --auto --bump patch

Don't pre-authorize `--auto` in the original goal dispatch. Reviewing the diff
and the dry-run output before every push is the entire point of the gate —
skipping that removes the one safety check in this pipeline.

## Adding more milestones later

Copy the shape of `m1-crawler-reliability` in `backlog.json` for the next
section (e.g. `m2-security`, `m3-testing`), add its tasks, then reuse this same
workflow with the new milestone id.
