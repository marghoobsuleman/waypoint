# Connecting AI editors to Waypoint (MCP)

Waypoint ships an **MCP server** so AI coding tools can read your project
context and log progress automatically. No browser extension is required — MCP is
built into these tools. You add one config entry; the tool launches the server and
discovers its tools.

Replace `/ABSOLUTE/PATH/TO/waypoint` with wherever you cloned this repo.

> All clients share the same database (`<project-root>/data.db` by default, or whatever
> `WAYPOINT_DB` in your `.env` points to),
> so what the web UI shows and what the AI sees are always identical.

---

## Claude Code

Add the server from the CLI (recommended):

```bash
claude mcp add waypoint -- node /ABSOLUTE/PATH/TO/waypoint/packages/mcp/src/index.js
```

…or add it to `.mcp.json` (project scope) / `~/.claude.json` (user scope) manually:

```json
{
  "mcpServers": {
    "waypoint": {
      "command": "node",
      "args": ["/ABSOLUTE/PATH/TO/waypoint/packages/mcp/src/index.js"]
    }
  }
}
```

## Cursor

`~/.cursor/mcp.json` (global) or `.cursor/mcp.json` (per-project):

```json
{
  "mcpServers": {
    "waypoint": {
      "command": "node",
      "args": ["/ABSOLUTE/PATH/TO/waypoint/packages/mcp/src/index.js"]
    }
  }
}
```

## Antigravity / Windsurf / other MCP clients

Any MCP client uses the same shape — a `command` + `args` stdio server:

```json
{
  "mcpServers": {
    "waypoint": {
      "command": "node",
      "args": ["/ABSOLUTE/PATH/TO/waypoint/packages/mcp/src/index.js"]
    }
  }
}
```

Point your client at its MCP settings file and add the block above.

---

## Tools the AI gets

| Tool | When it's used |
| --- | --- |
| `resume_project` | Start of a session — reload where you left off (auto-detects project from the folder you're in) |
| `add_worklog_entry` | While working — log progress / decisions / blockers / ideas |
| `add_task` / `complete_task` / `list_tasks` | Manage next steps |
| `update_project` | Change status, links, stack, local_path |
| `create_project` | Track a new repo |
| `list_projects` | Overview across everything |

## Making the AI actually use it

Discovering the tools isn't the same as using them. Drop a rules file into each repo
you want tracked so the AI treats logging as part of its workflow — grab the ready-made
file for your tool (Claude Code, Codex, Antigravity, Cursor, Windsurf, Copilot) from
[`rules/`](./rules/). For fully hands-off logging in Claude Code, wire up
[`hooks/`](./hooks/).
