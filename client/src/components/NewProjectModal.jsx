import { useState } from 'react';
import { api } from '../lib/api.js';

export default function NewProjectModal({ onClose, onCreated, existing }) {
  const [form, setForm] = useState({
    name: existing?.name || '',
    description: existing?.description || '',
    status: existing?.status || 'active',
    tech_stack: existing?.tech_stack?.join(', ') || '',
    repo_url: existing?.repo_url || '',
    deploy_url: existing?.deploy_url || '',
    docs_url: existing?.docs_url || '',
    local_path: existing?.local_path || '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  async function submit(e) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const payload = {
        ...form,
        tech_stack: form.tech_stack.split(',').map((s) => s.trim()).filter(Boolean),
      };
      if (existing) await api.updateProject(existing.slug, payload);
      else await api.createProject(payload);
      onCreated();
    } catch (e) {
      setError(e.message);
      setSaving(false);
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>{existing ? 'Edit Project' : 'New Project'}</h2>
        <form onSubmit={submit}>
          <label>Name<input autoFocus value={form.name} onChange={set('name')} required placeholder="My awesome app" /></label>
          <label>Description<textarea value={form.description} onChange={set('description')} rows={3} placeholder="What is this project and why does it exist?" /></label>
          <div className="form-row">
            <label>Status
              <select value={form.status} onChange={set('status')}>
                <option value="active">Active</option>
                <option value="paused">Paused</option>
                <option value="done">Done</option>
                <option value="archived">Archived</option>
              </select>
            </label>
            <label>Tech stack (comma-separated)<input value={form.tech_stack} onChange={set('tech_stack')} placeholder="React, Node, SQLite" /></label>
          </div>
          <label>Local path (for AI editor auto-detection)<input value={form.local_path} onChange={set('local_path')} placeholder="/Users/you/code/my-app" /></label>
          <div className="form-row">
            <label>Repo URL<input value={form.repo_url} onChange={set('repo_url')} placeholder="https://github.com/…" /></label>
            <label>Deploy URL<input value={form.deploy_url} onChange={set('deploy_url')} placeholder="https://…" /></label>
          </div>
          <label>Docs URL<input value={form.docs_url} onChange={set('docs_url')} placeholder="https://…" /></label>

          {error && <div className="error-banner">{error}</div>}
          <div className="modal-actions">
            <button type="button" className="btn" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving…' : existing ? 'Save changes' : 'Create project'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
