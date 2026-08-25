import { getDb } from './db.js';

const VALID_STATUS = ['active', 'paused', 'done', 'archived'];

function slugify(name) {
  return String(name)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60) || 'project';
}

function uniqueSlug(base) {
  const db = getDb();
  let slug = base;
  let n = 2;
  while (db.prepare('SELECT 1 FROM projects WHERE slug = ?').get(slug)) {
    slug = `${base}-${n++}`;
  }
  return slug;
}

/** Days since the project was last touched (updated_at). */
function staleDays(updatedAt) {
  const then = new Date(updatedAt.replace(' ', 'T') + 'Z').getTime();
  return Math.floor((Date.now() - then) / 86400000);
}

function decorate(project) {
  if (!project) return project;
  return {
    ...project,
    tech_stack: project.tech_stack
      ? project.tech_stack.split(',').map((s) => s.trim()).filter(Boolean)
      : [],
    stale_days: staleDays(project.updated_at),
  };
}

export function listProjects({ status } = {}) {
  const db = getDb();
  let rows;
  if (status) {
    rows = db.prepare('SELECT * FROM projects WHERE status = ? ORDER BY updated_at DESC').all(status);
  } else {
    rows = db
      .prepare("SELECT * FROM projects WHERE status != 'archived' ORDER BY updated_at DESC")
      .all();
  }
  return rows.map((p) => {
    const open = db
      .prepare('SELECT COUNT(*) AS c FROM tasks WHERE project_id = ? AND done = 0')
      .get(p.id).c;
    const nextTask = db
      .prepare('SELECT title FROM tasks WHERE project_id = ? AND done = 0 ORDER BY position, id LIMIT 1')
      .get(p.id);
    const lastLog = db
      .prepare('SELECT body, entry_type, created_at FROM worklog WHERE project_id = ? ORDER BY created_at DESC, id DESC LIMIT 1')
      .get(p.id);
    return {
      ...decorate(p),
      open_tasks: open,
      next_task: nextTask ? nextTask.title : null,
      last_log: lastLog || null,
    };
  });
}

export function getProject(idOrSlug) {
  const db = getDb();
  const row =
    typeof idOrSlug === 'number' || /^\d+$/.test(idOrSlug)
      ? db.prepare('SELECT * FROM projects WHERE id = ?').get(Number(idOrSlug))
      : db.prepare('SELECT * FROM projects WHERE slug = ?').get(idOrSlug);
  return decorate(row);
}

/** Match a filesystem path to a project by longest local_path prefix. */
export function findProjectByPath(cwd) {
  const db = getDb();
  const rows = db.prepare("SELECT * FROM projects WHERE local_path != ''").all();
  let best = null;
  for (const r of rows) {
    if (cwd === r.local_path || cwd.startsWith(r.local_path.replace(/\/?$/, '/'))) {
      if (!best || r.local_path.length > best.local_path.length) best = r;
    }
  }
  return decorate(best);
}

export function createProject(data) {
  const db = getDb();
  if (!data.name || !data.name.trim()) throw new Error('name is required');
  const status = data.status && VALID_STATUS.includes(data.status) ? data.status : 'active';
  const slug = uniqueSlug(slugify(data.slug || data.name));
  const techStack = Array.isArray(data.tech_stack)
    ? data.tech_stack.join(', ')
    : data.tech_stack || '';
  const stmt = db.prepare(`
    INSERT INTO projects (name, slug, description, status, tech_stack, repo_url, deploy_url, docs_url, local_path)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const info = stmt.run(
    data.name.trim(),
    slug,
    data.description || '',
    status,
    techStack,
    data.repo_url || '',
    data.deploy_url || '',
    data.docs_url || '',
    data.local_path || ''
  );
  return getProject(Number(info.lastInsertRowid));
}

export function updateProject(idOrSlug, data) {
  const db = getDb();
  const project = getProject(idOrSlug);
  if (!project) throw new Error('project not found');

  const fields = [];
  const values = [];
  const set = (col, val) => {
    fields.push(`${col} = ?`);
    values.push(val);
  };

  if (data.name != null) set('name', String(data.name).trim());
  if (data.description != null) set('description', String(data.description));
  if (data.status != null) {
    if (!VALID_STATUS.includes(data.status)) throw new Error(`invalid status: ${data.status}`);
    set('status', data.status);
  }
  if (data.tech_stack != null)
    set('tech_stack', Array.isArray(data.tech_stack) ? data.tech_stack.join(', ') : data.tech_stack);
  if (data.repo_url != null) set('repo_url', data.repo_url);
  if (data.deploy_url != null) set('deploy_url', data.deploy_url);
  if (data.docs_url != null) set('docs_url', data.docs_url);
  if (data.local_path != null) set('local_path', data.local_path);

  fields.push("updated_at = datetime('now')");
  values.push(project.id);
  db.prepare(`UPDATE projects SET ${fields.join(', ')} WHERE id = ?`).run(...values);
  return getProject(project.id);
}

export function deleteProject(idOrSlug) {
  const db = getDb();
  const project = getProject(idOrSlug);
  if (!project) throw new Error('project not found');
  db.prepare('DELETE FROM projects WHERE id = ?').run(project.id);
  return { deleted: true, id: project.id };
}

/** Bump updated_at — called whenever activity happens on a project. */
export function touchProject(projectId) {
  getDb().prepare("UPDATE projects SET updated_at = datetime('now') WHERE id = ?").run(projectId);
}

export { VALID_STATUS };
