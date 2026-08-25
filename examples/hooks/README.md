# Claude Code hooks — fully automatic logging

Hooks make logging deterministic: Claude Code runs a shell command on lifecycle
events, so context loads and logs happen whether or not the AI "remembers" to.

## What the example does

- **`SessionStart`** → runs `waypoint resume`, injecting your project's *where-was-I*
  snapshot (description, open tasks, recent worklog) into the session context
  automatically. This is the highest-value hook.
- **`Stop`** → appends a lightweight worklog marker when a session ends.

> The `Stop` marker is intentionally generic — for *meaningful* end-of-session notes,
> keep the [rules file](../rules/) so the AI writes a real summary via
> `add_worklog_entry`. Hooks give you the deterministic floor; the rules give you
> quality. Use both.

## Install

1. Make sure the repo you're working in is linked to a project:

   ```bash
   node /ABSOLUTE/PATH/TO/waypoint/packages/cli/src/index.js link <project-slug> --path .
   ```

2. Copy the hook config into `.claude/settings.json` in that repo (or your global
   `~/.claude/settings.json`), replacing `/ABSOLUTE/PATH/TO/waypoint` with your
   clone path. See [`settings.json`](./settings.json).

3. Start Claude Code in that repo — you should see the resume snapshot loaded at the
   top of the session.

Other editors (Cursor, Antigravity) don't expose the same lifecycle hooks, so they
rely on the MCP tools + rules snippet instead — which is already very reliable.
