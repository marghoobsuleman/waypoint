# Rules snippet — make the AI log to Waypoint

Paste this into your editor's project rules file so the AI treats Waypoint as
part of its normal workflow. Same text works everywhere; only the filename differs:

- **Claude Code:** `CLAUDE.md` (project root)
- **Cursor:** `.cursor/rules/waypoint.mdc` (or legacy `.cursorrules`)
- **Antigravity / Windsurf:** the tool's rules / guidelines file

---

```markdown
## Waypoint

This repository is tracked in Waypoint via its MCP server.

- **At the start of a session**, call `resume_project` (no arguments — it detects the
  project from the working directory) to reload the description, open tasks, and recent
  worklog before doing anything else.
- **As you work**, call `add_worklog_entry` to record meaningful progress, decisions
  ("chose X over Y because…"), and blockers. Prefer short, specific entries.
- **When you finish or pause**, log a final `add_worklog_entry` describing exactly
  where things stand and what the next step is, and `complete_task` for anything done.
- Use `add_task` to capture follow-ups you notice but don't do now.
```

---

Once the project's `local_path` matches this repo (set it in the web UI, or run
`waypoint link <project> --path .` from the repo root), the AI never has to be told
*which* project it's in — the tools figure it out from the folder.
