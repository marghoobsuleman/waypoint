import { getDb } from './db.js';
import { getProject, touchProject } from './projects.js';

const VALID_TYPES = ['progress', 'blocker', 'idea', 'decision'];

export function listWorklog(idOrSlug, { limit = 50 } = {}) {
  const db = getDb();
  const project = getProject(idOrSlug);
  if (!project) throw new Error('project not found');
  return db
    .prepare('SELECT * FROM worklog WHERE project_id = ? ORDER BY created_at DESC, id DESC LIMIT ?')
    .all(project.id, limit);
}

export function addWorklog(idOrSlug, { body, entry_type = 'progress', source = 'web' }) {
  const db = getDb();
  const project = getProject(idOrSlug);
  if (!project) throw new Error('project not found');
  if (!body || !body.trim()) throw new Error('body is required');
  const type = VALID_TYPES.includes(entry_type) ? entry_type : 'progress';
  const info = db
    .prepare('INSERT INTO worklog (project_id, body, entry_type, source) VALUES (?, ?, ?, ?)')
    .run(project.id, body.trim(), type, source);
  touchProject(project.id);
  return db.prepare('SELECT * FROM worklog WHERE id = ?').get(Number(info.lastInsertRowid));
}

export function deleteWorklog(id) {
  getDb().prepare('DELETE FROM worklog WHERE id = ?').run(Number(id));
  return { deleted: true, id: Number(id) };
}

export { VALID_TYPES };
