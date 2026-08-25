import { createProject, addWorklog, addTask, listProjects } from './index.js';

if (listProjects().length > 0) {
  console.log('Database already has projects — skipping seed.');
  process.exit(0);
}

const a = createProject({
  name: 'Waypoint',
  description: 'The tool you are looking at. Local-first project tracker with web UI, REST API, and MCP server for AI editors.',
  status: 'active',
  tech_stack: ['Node', 'React', 'SQLite', 'MCP'],
  repo_url: 'https://github.com/yourname/waypoint',
  local_path: process.cwd(),
});
addTask(a.slug, { title: 'Ship v1 with dashboard + MCP' });
addTask(a.slug, { title: 'Write open-source README' });
addTask(a.slug, { title: 'Add hooks for automatic logging' });
addWorklog(a.slug, {
  body: 'Scaffolded monorepo: core (SQLite), server (REST), client (React), mcp, cli.',
  entry_type: 'progress',
});
addWorklog(a.slug, {
  body: 'Decided to use built-in node:sqlite to avoid native build steps.',
  entry_type: 'decision',
});

const b = createProject({
  name: 'Marketing Site Redesign',
  description: 'Revamp the landing page with a new hero and pricing section.',
  status: 'paused',
  tech_stack: ['Next.js', 'Tailwind'],
});
addTask(b.slug, { title: 'Finalize hero copy' });
addWorklog(b.slug, {
  body: 'Paused while waiting on brand guidelines from design.',
  entry_type: 'blocker',
});

console.log('Seeded sample projects.');
