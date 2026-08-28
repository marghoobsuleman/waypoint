#!/usr/bin/env node
import {
  listProjects,
  getProject,
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

const [, , cmd, ...rest] = process.argv;

// Parse `--key value` and `--key=value` flags; the rest are positionals.
function parseArgs(argv) {
  const flags = {};
  const pos = [];
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith('--')) {
      const eq = a.indexOf('=');
      if (eq !== -1) flags[a.slice(2, eq)] = a.slice(eq + 1);
      else if (argv[i + 1] && !argv[i + 1].startsWith('--')) flags[a.slice(2)] = argv[++i];
      else flags[a.slice(2)] = true;
    } else pos.push(a);
  }
  return { flags, pos };
}

const { flags, pos } = parseArgs(rest);

function targetFrom(pos0, flags) {
  if (pos0) return pos0;
  if (flags.project) return flags.project;
  const p = findProjectByPath(process.cwd());
  if (p) return p.slug;
  return null;
}

function help() {
  console.log(`Waypoint CLI

Usage: waypoint <command> [args] [--flags]

Commands:
  list [--status active|paused|done|archived]   List projects
  resume [project]                              Show "where was I" (auto-detects from cwd)
  log <project?> --body "..." [--type progress|blocker|idea|decision]
                                                Add a worklog entry
  task <project?> --title "..."                 Add a task
  done <task_id>                                Mark a task done
  tasks [project]                               List tasks
  new --name "..." [--desc "..."] [--stack a,b] [--path .] [--repo url]
                                                Create a project
  status <project?> --set active|paused|done    Change status
  link <project?> --path .                      Link current repo path to a project

Project defaults to the one matching your current directory when omitted.`);
}

try {
  switch (cmd) {
    case 'list': {
      const rows = listProjects({ status: flags.status });
      if (!rows.length) { console.log('No projects yet. Create one with: waypoint new --name "..."'); break; }
      for (const p of rows) {
        const next = p.next_task ? ` → ${p.next_task}` : '';
        console.log(`${p.status.padEnd(8)} ${String(p.stale_days).padStart(3)}d  ${p.name} (${p.slug})  [${p.open_tasks} open]${next}`);
      }
      break;
    }
    case 'resume': {
      const t = targetFrom(pos[0], flags);
      if (!t) { console.log('No project matches this directory. Pass one: waypoint resume <project>'); break; }
      const snap = resumeProject(t, { cwd: process.cwd() });
      console.log(resumeToMarkdown(snap));
      break;
    }
    case 'log': {
      const t = targetFrom(pos[0], flags);
      if (!t) throw new Error('No project. Pass one or run inside a linked repo.');
      if (!flags.body) throw new Error('--body is required');
      const e = addWorklog(t, { body: flags.body, entry_type: flags.type || 'progress', source: 'cli' });
      console.log(`Logged (${e.entry_type}) to ${t}.`);
      break;
    }
    case 'task': {
      const t = targetFrom(pos[0], flags);
      if (!t) throw new Error('No project. Pass one or run inside a linked repo.');
      if (!flags.title) throw new Error('--title is required');
      const x = addTask(t, { title: flags.title });
      console.log(`Added task #${x.id}: ${x.title}`);
      break;
    }
    case 'done': {
      if (!pos[0]) throw new Error('Usage: waypoint done <task_id>');
      const x = setTaskDone(Number(pos[0]), true);
      console.log(`Task #${x.id} done: ${x.title}`);
      break;
    }
    case 'tasks': {
      const t = targetFrom(pos[0], flags);
      if (!t) throw new Error('No project. Pass one or run inside a linked repo.');
      for (const x of listTasks(t)) console.log(`${x.done ? '[x]' : '[ ]'} #${x.id} ${x.title}`);
      break;
    }
    case 'new': {
      if (!flags.name) throw new Error('--name is required');
      const p = createProject({
        name: flags.name,
        description: flags.desc || flags.description || '',
        tech_stack: flags.stack ? String(flags.stack).split(',') : [],
        local_path: flags.path === true ? process.cwd() : flags.path || '',
        repo_url: flags.repo || '',
      });
      console.log(`Created "${p.name}" (slug: ${p.slug}).`);
      break;
    }
    case 'status': {
      const t = targetFrom(pos[0], flags);
      if (!t) throw new Error('No project.');
      if (!flags.set) throw new Error('--set <status> is required');
      const p = updateProject(t, { status: flags.set });
      console.log(`${p.name} → ${p.status}`);
      break;
    }
    case 'link': {
      const t = pos[0] || flags.project;
      if (!t) throw new Error('Usage: waypoint link <project> [--path .]');
      const path = flags.path === true || !flags.path ? process.cwd() : flags.path;
      const p = updateProject(t, { local_path: path });
      console.log(`Linked ${p.name} → ${path}`);
      break;
    }
    case 'help':
    case undefined:
      help();
      break;
    default:
      console.error(`Unknown command: ${cmd}\n`);
      help();
      process.exit(1);
  }
} catch (err) {
  console.error(`Error: ${err.message}`);
  process.exit(1);
}
