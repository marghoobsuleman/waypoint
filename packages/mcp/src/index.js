#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import {
  listProjects,
  createProject,
  updateProject,
  addWorklog,
  addTask,
  setTaskDone,
  listTasks,
  resumeProject,
  resumeToMarkdown,
  findProjectByPath,
} from '../../core/src/index.js';

const server = new Server(
  { name: 'waypoint', version: '0.1.0' },
  { capabilities: { tools: {} } }
);

const text = (t) => ({ content: [{ type: 'text', text: t }] });
const json = (o) => ({ content: [{ type: 'text', text: JSON.stringify(o, null, 2) }] });

const tools = [
  {
    name: 'resume_project',
    description:
      'Load the "where was I" snapshot for a project: description, tech stack, links, open tasks (▶ marks the one to resume), and recent worklog. Call this at the START of a coding session to reload context. If no project is given, it auto-detects from the current working directory.',
    inputSchema: {
      type: 'object',
      properties: {
        project: { type: 'string', description: 'Project id or slug. Omit to auto-detect from cwd.' },
        cwd: { type: 'string', description: 'Working directory to match against a project local_path. Defaults to the process cwd.' },
      },
    },
    handler: (args) => {
      const cwd = args.cwd || process.cwd();
      const snap = resumeProject(args.project, { cwd });
      if (!snap) return text(`No matching project found (cwd: ${cwd}). Use list_projects or create_project.`);
      return text(resumeToMarkdown(snap));
    },
  },
  {
    name: 'list_projects',
    description: 'List all projects with status, days since last touched (stale_days), open task count, and the next task to resume.',
    inputSchema: {
      type: 'object',
      properties: {
        status: { type: 'string', enum: ['active', 'paused', 'done', 'archived'], description: 'Filter by status.' },
      },
    },
    handler: (args) => json(listProjects({ status: args.status })),
  },
  {
    name: 'add_worklog_entry',
    description:
      'Log a worklog entry to a project — use this WHILE working to capture progress, decisions, blockers, or ideas so future sessions know what happened. Updates the project\'s last-touched time.',
    inputSchema: {
      type: 'object',
      properties: {
        project: { type: 'string', description: 'Project id or slug. Omit to auto-detect from cwd.' },
        body: { type: 'string', description: 'What happened. Be specific: what changed, what is next, any blocker.' },
        entry_type: { type: 'string', enum: ['progress', 'blocker', 'idea', 'decision'], description: 'Defaults to progress.' },
      },
      required: ['body'],
    },
    handler: (args) => {
      const target = resolveTarget(args.project);
      const entry = addWorklog(target, { body: args.body, entry_type: args.entry_type, source: 'mcp' });
      return text(`Logged (${entry.entry_type}) to "${target}".`);
    },
  },
  {
    name: 'add_task',
    description: 'Add a next-step task to a project.',
    inputSchema: {
      type: 'object',
      properties: {
        project: { type: 'string', description: 'Project id or slug. Omit to auto-detect from cwd.' },
        title: { type: 'string', description: 'Short task description.' },
      },
      required: ['title'],
    },
    handler: (args) => {
      const target = resolveTarget(args.project);
      const t = addTask(target, { title: args.title });
      return text(`Added task #${t.id}: ${t.title}`);
    },
  },
  {
    name: 'complete_task',
    description: 'Mark a task done (or undone) by its id. Get ids from resume_project or list_tasks.',
    inputSchema: {
      type: 'object',
      properties: {
        task_id: { type: 'number', description: 'Task id.' },
        done: { type: 'boolean', description: 'Defaults to true.' },
      },
      required: ['task_id'],
    },
    handler: (args) => {
      const t = setTaskDone(args.task_id, args.done !== false);
      return text(`Task #${t.id} "${t.title}" → ${t.done ? 'done' : 'open'}.`);
    },
  },
  {
    name: 'list_tasks',
    description: 'List tasks for a project with their ids and done state.',
    inputSchema: {
      type: 'object',
      properties: {
        project: { type: 'string', description: 'Project id or slug. Omit to auto-detect from cwd.' },
      },
    },
    handler: (args) => json(listTasks(resolveTarget(args.project))),
  },
  {
    name: 'update_project',
    description: 'Update a project\'s status, description, links, tech stack, or local_path.',
    inputSchema: {
      type: 'object',
      properties: {
        project: { type: 'string', description: 'Project id or slug. Omit to auto-detect from cwd.' },
        status: { type: 'string', enum: ['active', 'paused', 'done', 'archived'] },
        description: { type: 'string' },
        tech_stack: { type: 'array', items: { type: 'string' } },
        repo_url: { type: 'string' },
        deploy_url: { type: 'string' },
        docs_url: { type: 'string' },
        local_path: { type: 'string' },
      },
    },
    handler: (args) => {
      const { project, ...data } = args;
      const p = updateProject(resolveTarget(project), data);
      return text(`Updated "${p.name}" (status: ${p.status}).`);
    },
  },
  {
    name: 'create_project',
    description: 'Create a new tracked project. Set local_path to the repo directory so it can be auto-detected later.',
    inputSchema: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        description: { type: 'string' },
        status: { type: 'string', enum: ['active', 'paused', 'done', 'archived'] },
        tech_stack: { type: 'array', items: { type: 'string' } },
        repo_url: { type: 'string' },
        deploy_url: { type: 'string' },
        docs_url: { type: 'string' },
        local_path: { type: 'string' },
      },
      required: ['name'],
    },
    handler: (args) => {
      const p = createProject(args);
      return text(`Created "${p.name}" (slug: ${p.slug}).`);
    },
  },
];

// Resolve the project target: explicit id/slug, else auto-detect from cwd.
function resolveTarget(project) {
  if (project) return project;
  const p = findProjectByPath(process.cwd());
  if (!p) throw new Error(`No project specified and none matches cwd (${process.cwd()}).`);
  return p.slug;
}

server.setRequestHandler(ListToolsRequestSchema, () => ({
  tools: tools.map(({ name, description, inputSchema }) => ({ name, description, inputSchema })),
}));

server.setRequestHandler(CallToolRequestSchema, async (req) => {
  const tool = tools.find((t) => t.name === req.params.name);
  if (!tool) throw new Error(`Unknown tool: ${req.params.name}`);
  try {
    return tool.handler(req.params.arguments || {});
  } catch (err) {
    return { content: [{ type: 'text', text: `Error: ${err.message}` }], isError: true };
  }
});

const transport = new StdioServerTransport();
await server.connect(transport);
console.error('waypoint MCP server running on stdio');
