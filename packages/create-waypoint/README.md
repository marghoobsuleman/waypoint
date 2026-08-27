# create-waypoint

One-command installer for [Waypoint](https://github.com/marghoobsuleman/waypoint) — a
local-first project tracker with a web dashboard, REST API, and an MCP server for AI editors.

```bash
npm create waypoint@latest
# or
npx create-waypoint
```

This downloads Waypoint into a new folder, installs dependencies, and seeds a `.env`
from the template. Then:

```bash
cd waypoint
npm run dev      # API on :4000, web UI on :5173
```

## Usage

```bash
npm create waypoint@latest [dir] [options]
```

| Option | Description |
| --- | --- |
| `[dir]` | Target directory (default: `waypoint`) |
| `--branch <name>` | Branch or tag to download (default: `main`) |
| `--no-install` | Skip `npm install` |
| `--seed` | Run `npm run seed` to add sample projects |
| `--git` | Keep the cloned `.git` history (removed by default) |
| `-h`, `--help` | Show help |

**Requirements:** Node **≥ 22.5** (Waypoint uses the built-in `node:sqlite` — no native
build step) and `git` on your `PATH`.

## Without publishing

Until this is published to npm, you can run the installer straight from GitHub:

```bash
npx github:marghoobsuleman/waypoint/packages/create-waypoint
```
