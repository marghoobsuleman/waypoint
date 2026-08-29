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

- **Dashboard** — every project at a glance: status, days-since-touched (stale
  detector), open tasks, and a *"resume here ▶"* hint per project.
- **Worklog** — a per-project timeline of progress, blockers, ideas, and decisions.
  This is the "where was I" memory.
- **Next steps** — a lightweight task checklist; the top open task is your resume point.
- **MCP server** — AI editors read context (`resume_project`) and log work
  (`add_worklog_entry`, `complete_task`, …) with **no extension required**.
- **Hooks + CLI** — optional Claude Code hooks make context-loading and logging
  fully automatic.
- **One SQLite file** — human-friendly, easy to back up. Web UI, REST API, MCP,
  and CLI all read/write the **same** database.

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

**Requirements:** Node **≥ 22.5** (uses the built-in `node:sqlite` — no native build step)
and `git` on your `PATH`.

### One command (recommended)

```bash
npm create waypoint@latest
```

This scaffolds Waypoint into a new `waypoint/` folder, installs dependencies, and creates
a `.env` for you. Then:

```bash
cd waypoint
npm run dev      # API on :4000, web UI on :5173
```

Pass a folder name and options if you like — `npm create waypoint@latest my-tracker --seed`.
See [`packages/create-waypoint`](packages/create-waypoint) for all flags. Until it's
published to npm, run it straight from GitHub:

```bash
npx github:marghoobsuleman/waypoint/packages/create-waypoint
```

### Manual clone

```bash
git clone https://github.com/marghoobsuleman/waypoint.git
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

## Run with Docker

A `Dockerfile` (multi-stage, `node:24-alpine`) builds the dashboard and serves the API +
UI from a single process. The SQLite database lives on a mounted volume, so your data
survives container rebuilds.

**Docker Compose (recommended):**

```bash
docker compose up -d --build
```

Open **http://localhost:4000**. By default the database is stored in a Docker-managed
named volume (`waypoint-data`).

### Choosing where the data lives

Inside the container the database always lives under `/data`. Where `/data` comes from
on the host is configurable (set these in `.env` or your shell):

| Variable | Default | Purpose |
| --- | --- | --- |
| `WAYPOINT_DATA_DIR` | named volume `waypoint-data` | Host directory bind-mounted to `/data`. Set an **absolute path** to reuse an existing database folder. |
| `WAYPOINT_DB_FILE` | `data.db` | SQLite filename inside `/data` (container runs with `WAYPOINT_DB=/data/<this>`). |

**Reuse an existing database** — point `WAYPOINT_DATA_DIR` at the folder that *contains*
your `data.db`:

```bash
# .env
WAYPOINT_DATA_DIR=/Users/you/www/databases-data/waypoint-dbi
WAYPOINT_DB_FILE=data.db
```

```bash
docker compose up -d --build   # now reads/writes your existing data.db
```

> Don't run the host process and the container against the same SQLite file **at the
> same time** — use one or the other to avoid write conflicts.

**Plain Docker** (bind-mount the directory, not the file):

```bash
docker build -t waypoint .
docker run -d --name waypoint -p 4000:4000 \
  -v /Users/you/www/databases-data/waypoint-dbi:/data \
  -e WAYPOINT_DB=/data/data.db \
  waypoint
```

Every other [configuration variable](#data--configuration) works via `-e` too (e.g.
`-e PORT=8080 -e WAYPOINT_DEFAULT_FILTER=paused`). The image exposes a `/api/health`
healthcheck.

> **MCP over Docker:** the dashboard runs in the container, but the MCP server is a stdio
> subprocess the editor launches — you can run it on the host (sharing the same DB) or
> through Docker. See [Running Waypoint in Docker?](#running-waypoint-in-docker) under
> *Connect your AI editor*.

---

## Data & configuration

Configuration is read from a `.env` file in the project root (all values optional).
Copy the template and edit as needed:

```bash
cp .env.example .env
```

| Variable | Default | Purpose |
| --- | --- | --- |
| `WAYPOINT_DB` | `<project-root>/data.db` | SQLite database file. Absolute paths are used as-is; relative paths resolve from the project root. |
| `PORT` | `4000` | REST API + web UI port (the Vite dev proxy reads it too). |
| `WAYPOINT_FILTERS` | `all,active,paused,done,archived` | Status filter chips shown on the dashboard, comma-separated. `all` lists everything except archived projects. |
| `WAYPOINT_DEFAULT_FILTER` | `active` | Which filter is selected when the dashboard first loads (must be one of `WAYPOINT_FILTERS`). |

- **By default the database lives inside the project directory** (`data.db` at the repo
  root), so a fresh clone just works with no setup — and the file is git-ignored.
- The path is resolved from the project root (derived from the source location), **not**
  the current directory — so the MCP server and CLI reach the *same* database no matter
  which repo you launch them from.
- Point `WAYPOINT_DB` somewhere shared (e.g. `~/.waypoint/data.db`) if you want one
  database across multiple Waypoint checkouts.
- **Dashboard filters are configurable** via `WAYPOINT_FILTERS` and
  `WAYPOINT_DEFAULT_FILTER` — served to the UI at `GET /api/config`, so a change takes
  effect on refresh with no rebuild. Valid statuses: `active`, `paused`, `done`,
  `archived` (plus the virtual `all`).

```bash
# or set inline without a .env file:
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

**Remove / disconnect** — this only unregisters the server in Claude Code; your database
is untouched:

```bash
claude mcp list             # see configured servers (and their scope)
claude mcp remove waypoint  # add -s local / -s user / -s project for a specific scope
```

If the same name was added in **more than one scope**, `claude mcp remove waypoint` will
refuse and list them — remove each one explicitly (local wins over user when both exist):

```bash
claude mcp remove waypoint -s local
claude mcp remove waypoint -s user
```

**Switching the `waypoint` command** (e.g. host → Docker) fails with *"already exists"* —
remove it first, then re-add, or use a different name so both can coexist:

```bash
claude mcp add waypoint-docker -- docker exec -i waypoint node packages/mcp/src/index.js
```

#### Running Waypoint in Docker?

The MCP server talks over **stdio** — the editor launches it as a subprocess, it is not
reached over a port. The container runs the *web/API* server, a different entrypoint, so
Claude can't attach to it over `:4000`. Pick one of these:

- **Host MCP, shared DB (simplest).** Keep the command above. Because the MCP server,
  the container, and the CLI all read the same SQLite file (`WAYPOINT_DB` →
  `WAYPOINT_DATA_DIR`), the host MCP process already sees the same data as the Docker
  dashboard. Nothing extra to configure.

- **MCP inside the running container** (`docker compose up` first):

  ```bash
  claude mcp add waypoint -- docker exec -i waypoint node packages/mcp/src/index.js
  ```

- **MCP as a self-contained container** (no web container needed; fresh per session):

  ```bash
  claude mcp add waypoint -- docker run -i --rm \
    -e WAYPOINT_DB=/data/data.db \
    -v /ABSOLUTE/PATH/TO/waypoint-data:/data \
    waypoint node packages/mcp/src/index.js
  ```

The `-i` flag is **required** (stdio needs stdin open); do **not** pass `-t`. Whichever
you choose, keep to **one writer at a time** on the SQLite file — don't run a host
`npm start` and a container against the same DB simultaneously.

**Google Antigravity** — add to `~/.gemini/config/mcp_config.json`:

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

*(If running Waypoint in Docker, use `"command": "docker"` and `"args": ["exec", "-i", "waypoint", "node", "packages/mcp/src/index.js"]`)*.

**Cursor / Windsurf / other MCP clients** — add to the tool's `mcp.json` (e.g. `~/.cursor/mcp.json`):

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
2. **A drop-in rules file** in your repo (`CLAUDE.md`, `AGENTS.md`, `.cursor/rules`, …)
   makes logging part of the AI's workflow — **recommended**. Ready-to-use files per tool
   (Claude Code, Codex, Antigravity, Cursor, Windsurf, Copilot) are in
   [`examples/rules/`](examples/rules/).
3. **Hooks** (Claude Code) make it fully automatic and deterministic. See
   [`examples/hooks/`](examples/hooks/).

### Drop-in rules files (download)

Grab the ready-made rules file for your editor and copy it to the path shown — that's all
it takes to make the AI use Waypoint automatically. Full index:
[`examples/rules/`](examples/rules/).

| Editor | File | Copy it to |
| --- | --- | --- |
| Claude Code | [`CLAUDE.md`](examples/rules/CLAUDE.md) | `CLAUDE.md` (repo root) |
| OpenAI Codex | [`AGENTS.md`](examples/rules/AGENTS.md) | `AGENTS.md` (repo root) |
| Gemini CLI / Jules / Amp | [`AGENTS.md`](examples/rules/AGENTS.md) | `AGENTS.md` (repo root) |
| Google Antigravity | [`waypoint.antigravity.md`](examples/rules/waypoint.antigravity.md) | `AGENTS.md` (repo root) |
| Cursor | [`waypoint.cursor.mdc`](examples/rules/waypoint.cursor.mdc) | `.cursor/rules/waypoint.mdc` |
| Windsurf | [`waypoint.windsurf.md`](examples/rules/waypoint.windsurf.md) | `.windsurf/rules/waypoint.md` |
| GitHub Copilot | [`copilot-instructions.md`](examples/rules/copilot-instructions.md) | `.github/copilot-instructions.md` |
| Cline | [`waypoint.cline.md`](examples/rules/waypoint.cline.md) | `.clinerules/waypoint.md` |
| Aider | [`waypoint.aider.md`](examples/rules/waypoint.aider.md) | `CONVENTIONS.md` (load with `--read`) |
| JetBrains AI (Junie) | [`waypoint.junie.md`](examples/rules/waypoint.junie.md) | `.junie/guidelines.md` |
| Zed | [`waypoint.zed.md`](examples/rules/waypoint.zed.md) | `.rules` (repo root) |

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
| GET | `/config` | Dashboard UI config (`filters`, `defaultFilter`) from `.env` |
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
