import { getDb } from './db.js';
import { getProject, touchProject } from './projects.js';

export function listTasks(idOrSlug, { includeDone = true } = {}) {
  const db = getDb();
  const project = getProject(idOrSlug);
  if (!project) throw new Error('project not found');
  const where = includeDone ? '' : 'AND done = 0';
  return db
    .prepare(`SELECT * FROM tasks WHERE project_id = ? ${where} ORDER BY done, position, id`)
    .all(project.id);
}

export function addTask(idOrSlug, { title }) {
  const db = getDb();
  const project = getProject(idOrSlug);
  if (!project) throw new Error('project not found');
  if (!title || !title.trim()) throw new Error('title is required');
  const maxPos =
    db.prepare('SELECT COALESCE(MAX(position), 0) AS m FROM tasks WHERE project_id = ?').get(project.id).m;
  const info = db
    .prepare('INSERT INTO tasks (project_id, title, position) VALUES (?, ?, ?)')
    .run(project.id, title.trim(), maxPos + 1);
  touchProject(project.id);
  return db.prepare('SELECT * FROM tasks WHERE id = ?').get(Number(info.lastInsertRowid));
}

export function setTaskDone(id, done = true) {
  const db = getDb();
  const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(Number(id));
  if (!task) throw new Error('task not found');
  db.prepare('UPDATE tasks SET done = ?, done_at = ? WHERE id = ?').run(
    done ? 1 : 0,
    done ? new Date().toISOString().slice(0, 19).replace('T', ' ') : null,
    task.id
  );
  touchProject(task.project_id);
  return db.prepare('SELECT * FROM tasks WHERE id = ?').get(task.id);
}

export function updateTask(id, { title }) {
  const db = getDb();
  const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(Number(id));
  if (!task) throw new Error('task not found');
  if (title != null) db.prepare('UPDATE tasks SET title = ? WHERE id = ?').run(String(title).trim(), task.id);
  touchProject(task.project_id);
  return db.prepare('SELECT * FROM tasks WHERE id = ?').get(task.id);
}

export function deleteTask(id) {
  const db = getDb();
  const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(Number(id));
  if (!task) throw new Error('task not found');
  db.prepare('DELETE FROM tasks WHERE id = ?').run(task.id);
  touchProject(task.project_id);
  return { deleted: true, id: task.id };
}
