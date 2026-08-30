# Connecting AI Editors to Waypoint (MCP)

Waypoint ships a standard **MCP server (Model Context Protocol)** so AI coding tools and editors can read your project context and log progress automatically. No browser extension is required — MCP support is built directly into modern AI tools. You add one config entry; the tool launches the server and discovers its tools (`resume_project`, `add_worklog_entry`, `complete_task`, etc.).

Replace `/ABSOLUTE/PATH/TO/waypoint` with wherever you cloned this repo.

> All clients share the same SQLite database (`<project-root>/data.db` by default, or whatever `WAYPOINT_DB` / `WAYPOINT_DATA_DIR` points to), so what the web UI shows and what the AI sees are always in sync.

---

## Quick Reference: Config File Locations

| Editor / Tool | Global Config Location | Project-Level Config Location |
| --- | --- | --- |
| **Claude Code** | `~/.claude.json` | `.mcp.json` |
| **Claude Desktop** | `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS)<br>`%APPDATA%\Claude\claude_desktop_config.json` (Windows) | — |
| **Google Antigravity** | `~/.gemini/config/mcp_config.json` | `.agents/plugins/waypoint/mcp_config.json` |
| **VS Code** (GitHub Copilot) | User Settings `mcp.json` | `.vscode/mcp.json` |
| **VS Code** (Cline / Roo Code) | Extension MCP Settings UI | Extension MCP Settings |
| **IntelliJ IDEA & JetBrains IDEs** | Settings > Tools > Model Context Protocol (MCP) | `.idea/mcp.json` |
| **Continue.dev** (VS Code & JetBrains) | `~/.continue/config.json` | — |
| **Cursor** | `~/.cursor/mcp.json` | `.cursor/mcp.json` |
| **Windsurf** | `~/.codeium/windsurf/mcp_config.json` | — |
| **Trae** | `~/.trae/mcp.json` | `.trae/mcp.json` |
| **Zed** | `~/.config/zed/settings.json` | `.zed/settings.json` |
| **Goose** | `~/.config/goose/config.yaml` | `.goosehints` |

---

## Editor-by-Editor Configuration

### 1. Claude Code (CLI)

Add the server from the command line:

```bash
# Host Node.js
claude mcp add waypoint -- node /ABSOLUTE/PATH/TO/waypoint/packages/mcp/src/index.js

# Docker container
claude mcp add waypoint -- docker exec -i waypoint node packages/mcp/src/index.js
```

…or manually add to `.mcp.json` (project scope) or `~/.claude.json` (user scope):

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

---

### 2. Claude Desktop (macOS / Windows)

Add to `claude_desktop_config.json` (macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`, Windows: `%APPDATA%\Claude\claude_desktop_config.json`):

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

---

### 3. Google Antigravity

Add to your global Antigravity MCP configuration in `~/.gemini/config/mcp_config.json`:

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

**Running in Docker?**

```json
{
  "mcpServers": {
    "waypoint": {
      "command": "docker",
      "args": [
        "exec",
        "-i",
        "waypoint",
        "node",
        "packages/mcp/src/index.js"
      ]
    }
  }
}
```

*(Optional)* **As a workspace plugin:** Create `.agents/plugins/waypoint/plugin.json` (`{ "name": "waypoint" }`) and `.agents/plugins/waypoint/mcp_config.json` inside your project.

---

### 4. Visual Studio Code (VS Code)

Depending on which AI assistant you use in VS Code:

#### Option A: GitHub Copilot (Agent Mode / MCP)
Add to `.vscode/mcp.json` (project) or your global VS Code user MCP configuration:

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

#### Option B: Cline or Roo Code (Extensions)
1. Click the **MCP Servers** icon in the extension sidebar.
2. Click **Configure MCP Servers** (or edit `cline_mcp_settings.json` / `roo_mcp_settings.json`).
3. Add:
   ```json
   {
     "mcpServers": {
       "waypoint": {
         "command": "node",
         "args": ["/ABSOLUTE/PATH/TO/waypoint/packages/mcp/src/index.js"],
         "disabled": false,
         "autoApprove": []
       }
     }
   }
   ```

#### Option C: Continue.dev (Extension)
Add to `~/.continue/config.json` under `"mcpServers"`:

```json
{
  "mcpServers": [
    {
      "name": "waypoint",
      "command": "node",
      "args": ["/ABSOLUTE/PATH/TO/waypoint/packages/mcp/src/index.js"]
    }
  ]
}
```

---

### 5. IntelliJ IDEA & JetBrains IDEs (WebStorm, PyCharm, PhpStorm, GoLand, CLion, Rider)

JetBrains IDEs support MCP through JetBrains AI Assistant (Junie), GitHub Copilot, and Continue.

#### Option A: JetBrains AI Assistant / Junie
1. Open **Settings / Preferences** (`⌘,` on macOS, `Ctrl+,` on Windows/Linux).
2. Navigate to **Tools > Model Context Protocol (MCP)** (or **AI Assistant > Context Providers**).
3. Click **+ Add Server**:
   - **Name**: `waypoint`
   - **Command**: `node` (or `docker`)
   - **Arguments**: `/ABSOLUTE/PATH/TO/waypoint/packages/mcp/src/index.js` (or `exec -i waypoint node packages/mcp/src/index.js` for Docker)
4. Or configure project-wide via `.idea/mcp.json`:
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

#### Option B: GitHub Copilot or Continue in JetBrains
Follow the Copilot `.idea/mcp.json` or Continue (`~/.continue/config.json`) instructions listed above.

---

### 6. Cursor

Add to `~/.cursor/mcp.json` (global) or `.cursor/mcp.json` (project-level):

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

**Running in Docker:**

```json
{
  "mcpServers": {
    "waypoint": {
      "command": "docker",
      "args": ["exec", "-i", "waypoint", "node", "packages/mcp/src/index.js"]
    }
  }
}
```

---

### 7. Windsurf (Codeium)

Add to `~/.codeium/windsurf/mcp_config.json` (or via Windsurf Settings > Advanced Settings > Cascade > MCP):

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

---

### 8. Trae (ByteDance AI IDE)

Add to `~/.trae/mcp.json` (global) or `.trae/mcp.json` (project):

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

---

### 9. Zed Editor

Zed uses a `context_servers` key in `~/.config/zed/settings.json`:

```json
{
  "context_servers": {
    "waypoint": {
      "command": {
        "path": "node",
        "args": ["/ABSOLUTE/PATH/TO/waypoint/packages/mcp/src/index.js"]
      }
    }
  }
}
```

**Running in Docker on Zed:**

```json
{
  "context_servers": {
    "waypoint": {
      "command": {
        "path": "docker",
        "args": ["exec", "-i", "waypoint", "node", "packages/mcp/src/index.js"]
      }
    }
  }
}
```

---

### 10. Goose (Block / Square)

Add from CLI:

```bash
goose mcp add waypoint stdio -- node /ABSOLUTE/PATH/TO/waypoint/packages/mcp/src/index.js
```

…or in `~/.config/goose/config.yaml`:

```yaml
extensions:
  waypoint:
    name: waypoint
    cmd: node
    args:
      - /ABSOLUTE/PATH/TO/waypoint/packages/mcp/src/index.js
    type: stdio
```

---

## Running Waypoint in Docker (Summary)

The MCP server operates over **stdio** (standard input/output). If your Waypoint dashboard runs in a Docker container, you can connect your AI editors using either:

1. **Host-mode MCP with shared DB (simplest)** — run `node packages/mcp/src/index.js` on the host. It reads the same SQLite file bind-mounted to your container.
2. **Container Exec (`docker exec -i`)** — execute directly in the running `waypoint` container:
   ```json
   {
     "mcpServers": {
       "waypoint": {
         "command": "docker",
         "args": ["exec", "-i", "waypoint", "node", "packages/mcp/src/index.js"]
       }
     }
   }
   ```
   *(The `-i` flag is required so standard input remains interactive).*

---

## Tools the AI Gets

| Tool | When it's used |
| --- | --- |
| `resume_project` | Start of a session — reload where you left off (auto-detects project from cwd) |
| `add_worklog_entry` | While working — log progress / decisions / blockers / ideas |
| `add_task` · `complete_task` · `list_tasks` | Manage next steps and checklist |
| `update_project` | Change status, links, stack, local_path |
| `create_project` | Track a new repo |
| `list_projects` | Overview across all projects |

---

## Making the AI Actually Use It

Discovering tools is only half the equation. Drop a rules file into your repo so your editor automatically calls `resume_project` at the start of a session and logs progress with `add_worklog_entry`.

Grab the ready-made rules file for your editor from [`rules/`](./rules/):
- **VS Code**: [`.github/copilot-instructions.md`](./rules/copilot-instructions.md) or [`.clinerules/waypoint.md`](./rules/waypoint.cline.md)
- **IntelliJ IDEA & JetBrains IDEs**: [`.junie/guidelines.md`](./rules/waypoint.junie.md) or [`.github/copilot-instructions.md`](./rules/copilot-instructions.md)
- **Google Antigravity**: [`AGENTS.md`](./rules/waypoint.antigravity.md)
- **Cursor**: [`.cursor/rules/waypoint.mdc`](./rules/waypoint.cursor.mdc)
- **Windsurf**: [`.windsurf/rules/waypoint.md`](./rules/waypoint.windsurf.md)
- **Trae**: [`.trae/rules`](./rules/waypoint.trae.md)
- **Claude Code**: [`CLAUDE.md`](./rules/CLAUDE.md) (and optional [`hooks/`](./hooks/))
