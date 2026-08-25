# Editor rules — drop-in files

Ready-to-use rules that tell your AI editor to use Waypoint automatically (load context
at the start of a session, log progress as it works). Pick the file for your tool, copy
it to the path shown, and you're done.

> These make the AI **behave**. They assume the Waypoint **MCP server** is already
> connected — set that up first via [`../mcp-config.md`](../mcp-config.md).

| Tool | Download this file | Copy it to (in your repo) |
| --- | --- | --- |
| **Claude Code** | [`CLAUDE.md`](./CLAUDE.md) | `CLAUDE.md` (repo root) |
| **OpenAI Codex** | [`AGENTS.md`](./AGENTS.md) | `AGENTS.md` (repo root) |
| **Gemini CLI / Jules / Amp** | [`AGENTS.md`](./AGENTS.md) | `AGENTS.md` (repo root) |
| **Google Antigravity** | [`waypoint.antigravity.md`](./waypoint.antigravity.md) | `AGENTS.md` (repo root) |
| **Cursor** | [`waypoint.cursor.mdc`](./waypoint.cursor.mdc) | `.cursor/rules/waypoint.mdc` |
| **Windsurf** | [`waypoint.windsurf.md`](./waypoint.windsurf.md) | `.windsurf/rules/waypoint.md` |
| **GitHub Copilot** | [`copilot-instructions.md`](./copilot-instructions.md) | `.github/copilot-instructions.md` |
| **Cline** | [`waypoint.cline.md`](./waypoint.cline.md) | `.clinerules/waypoint.md` |
| **Aider** | [`waypoint.aider.md`](./waypoint.aider.md) | `CONVENTIONS.md` (load with `--read`) |
| **JetBrains AI (Junie)** | [`waypoint.junie.md`](./waypoint.junie.md) | `.junie/guidelines.md` |
| **Zed** | [`waypoint.zed.md`](./waypoint.zed.md) | `.rules` (repo root) |

**Notes**

- `AGENTS.md` is an open, cross-tool standard — one file covers Codex, Gemini CLI, Amp,
  and a growing list of others. If your tool isn't listed but reads `AGENTS.md`, use
  that one.
- If you already have a rules file for your tool, don't overwrite it — just paste the
  `## Waypoint` section from the matching file into your existing one.
- Every file carries the same instructions, tuned only to each tool's format (Cursor
  needs `.mdc` frontmatter; the rest are plain Markdown).

**For fully automatic, deterministic logging in Claude Code**, also wire up the
lifecycle hooks in [`../hooks/`](../hooks/) — rules tell the AI what to do; hooks make
it happen even if the AI forgets.
