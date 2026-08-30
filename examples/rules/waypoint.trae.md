<!--
  Waypoint rules for Trae (ByteDance AI IDE).
  Copy this file to:  .trae/rules  or  .traerules  in the repo you want tracked.
  Requires the Waypoint MCP server — see examples/mcp-config.md.
-->

## Waypoint

This repository is tracked in **Waypoint**, a project tracker exposed to AI editors
over MCP. Use it to stay oriented and to leave a trail for the next session.

**At the start of a session**

- Call the `resume_project` tool (no arguments — it auto-detects the project from the
  working directory) to load the description, open tasks, and recent worklog before
  doing anything else. The task marked **▶** is where to resume.

**While you work**

- Call `add_worklog_entry` to record meaningful progress, decisions
  ("chose X over Y because…"), blockers, and ideas. Keep entries short and specific.
- Use `add_task` to capture follow-ups you notice but won't do right now.
- Use `complete_task` as you finish items on the task list.

**When you finish or pause**

- Log a final `add_worklog_entry` describing exactly where things stand and what the
  very next step is, so the next session can pick up instantly.

**Fallback:** if the Waypoint MCP server isn't connected, use the CLI instead —
`waypoint resume` and `waypoint log --body "…" --type progress` from the repo root.
