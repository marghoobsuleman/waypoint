import { getProject, findProjectByPath } from './projects.js';
import { listWorklog } from './worklog.js';
import { listTasks } from './tasks.js';

/**
 * Build the "where was I" snapshot for a project — the single most important
 * read in the whole system. Used by the web detail view and by AI editors via
 * MCP to reload context at the start of a session.
 */
export function resumeProject(idOrSlugOrPath, { cwd } = {}) {
  let project = null;
  if (idOrSlugOrPath) project = getProject(idOrSlugOrPath);
  if (!project && cwd) project = findProjectByPath(cwd);
  if (!project) return null;

  const worklog = listWorklog(project.id, { limit: 8 });
  const openTasks = listTasks(project.id, { includeDone: false });

  return {
    project,
    open_tasks: openTasks,
    recent_worklog: worklog,
  };
}

/** Render a resume snapshot as human/AI-friendly markdown. */
export function resumeToMarkdown(snapshot) {
  if (!snapshot) return 'No matching project found.';
  const { project, open_tasks, recent_worklog } = snapshot;
  const lines = [];
  lines.push(`# ${project.name}  _(${project.status})_`);
  if (project.description) lines.push(`\n${project.description}`);
  if (project.tech_stack.length) lines.push(`\n**Stack:** ${project.tech_stack.join(', ')}`);
  const links = [
    project.repo_url && `[repo](${project.repo_url})`,
    project.deploy_url && `[deploy](${project.deploy_url})`,
    project.docs_url && `[docs](${project.docs_url})`,
  ].filter(Boolean);
  if (links.length) lines.push(`**Links:** ${links.join(' · ')}`);
  lines.push(`\n_Last touched ${project.stale_days} day(s) ago._`);

  lines.push(`\n## Open tasks (${open_tasks.length})`);
  if (open_tasks.length === 0) lines.push('_None — nothing queued._');
  else open_tasks.forEach((t, i) => lines.push(`${i === 0 ? '**▶**' : '-'} [ ] ${t.title}`));

  lines.push(`\n## Recent worklog`);
  if (recent_worklog.length === 0) lines.push('_No entries yet._');
  else
    recent_worklog.forEach((w) =>
      lines.push(`- \`${w.created_at}\` **${w.entry_type}** — ${w.body}`)
    );

  return lines.join('\n');
}
