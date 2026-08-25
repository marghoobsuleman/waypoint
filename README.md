<p align="center">
  <img src="client/public/logo.svg" width="88" alt="Waypoint logo" />
</p>
<h1 align="center">Waypoint</h1>
<p align="center"><em>Never lose your place across many projects — for you and your AI editors.</em></p>

---

**Never lose your place again.** A local-first project tracker for people juggling many
projects at once — it remembers *where you left off*, *what's done*, and *why you made
the decisions you did*, so you can reload the full context of any project in seconds.

What makes it different: it exposes an **MCP server**, so AI coding editors
(**Claude Code, Cursor, Antigravity, Windsurf, …**) can read your project context and
log progress **automatically** as you work. Waypoint fills itself in.

<!-- Add a screenshot here once hosted: ![Dashboard](docs/dashboard.png) -->

---

## Features

- 📊 **Dashboard** — every project at a glance: status, days-since-touched (stale
  detector), open tasks, and a *"resume here ▶"* hint per project.
- 📝 **Worklog** — a per-project timeline of progress, blockers, ideas, and decisions.
  This is the "where was I" memory.
- ✅ **Next steps** — a lightweight task checklist; the top open task is your resume point.
- 🤖 **MCP server** — AI editors read context (`resume_project`) and log work
  (`add_worklog_entry`, `complete_task`, …) with **no extension required**.
- 🪝 **Hooks + CLI** — optional Claude Code hooks make context-loading and logging
  fully automatic.
- 💾 **One SQLite file** — human-friendly, easy to back up. Web UI, REST API, MCP,
  and CLI all read/write the **same** database.
- 🔓 **Local-first & open-source (MIT)** — runs on `localhost`, deployable later.

---

## Architecture

Everything is built on a single shared data layer (`@waypoint/core`), so the web
UI and the AI editors can never drift out of sync.

```
waypoint/
├── packages/
│   ├── core/     SQLite schema + all data access  ← single source of truth
│   ├── server/   Express REST API                 → for the web UI
│   ├── mcp/       MCP server (stdio)               → for Claude Code / Cursor / Antigravity
│   └── cli/       `waypoint` command                → for hooks & terminal use
├── client/        React + Vite dashboard
└── examples/      MCP config, editor rules, Claude Code hooks
                        ┌──────────────┐
   Web UI  ───REST───▶  │              │
   AI editor ──MCP───▶  │  core (SQLite)  ◀── one data.db
   Terminal ──CLI───▶   │              │
                        └──────────────┘
```

---

## Quick start

**Requirements:** Node **≥ 22.5** (uses the built-in `node:sqlite` — no native build step).

```bash
git clone <your-fork-url> waypoint
cd waypoint
npm install
npm run seed     # optional: adds a couple of sample projects
npm run dev      # API on :4000, web UI on :5173
```

Open **http://localhost:5173**.

### Production / single-process

```bash
npm run build    # builds the React client
npm start        # serves API + UI together on :4000
```

---

## Data & configuration

- The database lives at `~/.waypoint/data.db` by default. A fixed home-directory
  location matters: the MCP server and CLI run from whatever repo you're in, and they all
  need to reach the *same* database.
- Override the location with the `WAYPOINT_DB` environment variable.
- Change the API port with `PORT`.

```bash
WAYPOINT_DB=/data/waypoint.db PORT=8080 npm start
```

---

## Connect your AI editor (MCP)

One config entry — **no browser extension**. Full per-tool instructions in
[`examples/mcp-config.md`](examples/mcp-config.md).

**Claude Code:**

```bash
claude mcp add waypoint -- node /ABSOLUTE/PATH/TO/waypoint/packages/mcp/src/index.js
```

**Cursor / Antigravity / Windsurf** — add to the tool's `mcp.json`:

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

### How it knows *which* project you're in

Set a project's **local path** (in the web UI, or `waypoint link <slug> --path .` from the
repo). The MCP tools then auto-detect the project from the working directory — the AI
never has to be told which project it's working on.

### How it knows *to* log (three levels)

1. **Tool descriptions** nudge the AI to use them (passive).
2. **A rules snippet** in your repo (`CLAUDE.md`, `.cursor/rules`, …) makes logging part
   of the AI's workflow — **recommended**. See [`examples/rules-snippet.md`](examples/rules-snippet.md).
3. **Hooks** (Claude Code) make it fully automatic and deterministic. See
   [`examples/hooks/`](examples/hooks/).

### MCP tools

| Tool | Purpose |
| --- | --- |
| `resume_project` | Load the "where was I" snapshot (auto-detects project from cwd) |
| `list_projects` | Overview with status, stale days, open tasks |
| `add_worklog_entry` | Log progress / blocker / idea / decision |
| `add_task` · `complete_task` · `list_tasks` | Manage next steps |
| `update_project` | Change status, links, stack, local_path |
| `create_project` | Track a new repo |

---

## CLI

The `waypoint` command works in any repo (auto-detects the project from your folder):

```bash
node packages/cli/src/index.js resume            # where was I? (or: npm run waypoint -- resume)
node packages/cli/src/index.js list
node packages/cli/src/index.js log --body "Fixed auth redirect" --type progress
node packages/cli/src/index.js task --title "Write tests for login"
node packages/cli/src/index.js done 12
node packages/cli/src/index.js new --name "My App" --stack "React,Node" --path .
node packages/cli/src/index.js link my-app --path .
```

Tip: `npm link` inside `packages/cli` (or add a shell alias) to call it as just `waypoint`.

---

## REST API

Base URL `http://localhost:4000/api`.

| Method | Path | Description |
| --- | --- | --- |
| GET | `/projects` | List (optional `?status=`) |
| POST | `/projects` | Create |
| GET | `/projects/:id` | Get one (by id or slug) |
| PATCH | `/projects/:id` | Update |
| DELETE | `/projects/:id` | Delete |
| GET | `/projects/:id/resume` | "Where was I" snapshot |
| GET/POST | `/projects/:id/worklog` | List / add worklog entries |
| DELETE | `/worklog/:id` | Delete a worklog entry |
| GET/POST | `/projects/:id/tasks` | List / add tasks |
| PATCH | `/tasks/:id` | Update / toggle (`{ "done": true }`) |
| DELETE | `/tasks/:id` | Delete a task |

`:id` accepts a numeric id or a slug (e.g. `my-app`).

---

## Data model

- **Project** — name, slug, description, status (`active` / `paused` / `done` / `archived`),
  tech stack, repo/deploy/docs URLs, `local_path`, timestamps.
- **Worklog entry** — body, type (`progress` / `blocker` / `idea` / `decision`), source
  (`web` / `mcp` / `cli`), timestamp.
- **Task** — title, done, position, timestamps.

---

## Roadmap

- [ ] Full-text search across worklogs
- [ ] Multi-user + auth (for hosted/team deployments)
- [ ] Markdown rendering in worklog bodies
- [ ] Export / import (JSON, Markdown)
- [ ] Per-project activity charts

## Contributing

Issues and PRs welcome. The codebase is intentionally small and dependency-light.
Keep new logic in `packages/core` so every interface benefits.

## License

MIT — see [LICENSE](LICENSE).
