import express from 'express';
import cors from 'cors';
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  listProjects,
  getProject,
  createProject,
  updateProject,
  deleteProject,
  listWorklog,
  addWorklog,
  deleteWorklog,
  listTasks,
  addTask,
  setTaskDone,
  updateTask,
  deleteTask,
  resumeProject,
  resolveDbPath,
} from '@waypoint/core';

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
app.use(cors());
app.use(express.json());

// Small wrapper so route handlers can throw and we still return clean JSON.
const h = (fn) => (req, res) => {
  try {
    const result = fn(req, res);
    if (result !== undefined) res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

const api = express.Router();

api.get('/health', (req, res) => res.json({ ok: true, db: resolveDbPath() }));

// Projects
api.get('/projects', h((req) => listProjects({ status: req.query.status })));
api.post('/projects', h((req, res) => {
  res.status(201);
  return createProject(req.body);
}));
api.get('/projects/:id', h((req) => {
  const p = getProject(req.params.id);
  if (!p) throw new Error('project not found');
  return p;
}));
api.patch('/projects/:id', h((req) => updateProject(req.params.id, req.body)));
api.delete('/projects/:id', h((req) => deleteProject(req.params.id)));
api.get('/projects/:id/resume', h((req) => {
  const snap = resumeProject(req.params.id);
  if (!snap) throw new Error('project not found');
  return snap;
}));

// Worklog
api.get('/projects/:id/worklog', h((req) => listWorklog(req.params.id, { limit: Number(req.query.limit) || 50 })));
api.post('/projects/:id/worklog', h((req, res) => {
  res.status(201);
  return addWorklog(req.params.id, req.body);
}));
api.delete('/worklog/:id', h((req) => deleteWorklog(req.params.id)));

// Tasks
api.get('/projects/:id/tasks', h((req) => listTasks(req.params.id)));
api.post('/projects/:id/tasks', h((req, res) => {
  res.status(201);
  return addTask(req.params.id, req.body);
}));
api.patch('/tasks/:id', h((req) => {
  if (typeof req.body.done === 'boolean') return setTaskDone(req.params.id, req.body.done);
  return updateTask(req.params.id, req.body);
}));
api.delete('/tasks/:id', h((req) => deleteTask(req.params.id)));

app.use('/api', api);

// Serve the built client if present (production / single-process deploy).
const clientDist = join(__dirname, '../../../client/dist');
if (existsSync(clientDist)) {
  app.use(express.static(clientDist));
  app.get('*', (req, res) => res.sendFile(join(clientDist, 'index.html')));
}

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Waypoint API on http://localhost:${PORT}`);
  console.log(`Database: ${resolveDbPath()}`);
  if (!existsSync(clientDist)) {
    console.log('Client not built yet — run "npm run dev" for the UI, or "npm run build".');
  }
});
