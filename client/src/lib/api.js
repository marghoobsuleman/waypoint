const BASE = '/api';

async function req(path, options = {}) {
  const res = await fetch(BASE + path, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  if (!res.ok) {
    let msg = res.statusText;
    try { msg = (await res.json()).error || msg; } catch {}
    throw new Error(msg);
  }
  if (res.status === 204) return null;
  return res.json();
}

export const api = {
  listProjects: (status) => req(`/projects${status ? `?status=${status}` : ''}`),
  getProject: (id) => req(`/projects/${id}`),
  createProject: (data) => req('/projects', { method: 'POST', body: data }),
  updateProject: (id, data) => req(`/projects/${id}`, { method: 'PATCH', body: data }),
  deleteProject: (id) => req(`/projects/${id}`, { method: 'DELETE' }),
  resume: (id) => req(`/projects/${id}/resume`),

  listWorklog: (id) => req(`/projects/${id}/worklog`),
  addWorklog: (id, data) => req(`/projects/${id}/worklog`, { method: 'POST', body: data }),
  deleteWorklog: (id) => req(`/worklog/${id}`, { method: 'DELETE' }),

  listTasks: (id) => req(`/projects/${id}/tasks`),
  addTask: (id, data) => req(`/projects/${id}/tasks`, { method: 'POST', body: data }),
  setTask: (id, data) => req(`/tasks/${id}`, { method: 'PATCH', body: data }),
  deleteTask: (id) => req(`/tasks/${id}`, { method: 'DELETE' }),
};
