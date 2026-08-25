import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { api } from '../lib/api.js';
import { relativeTime, STATUS_META, ENTRY_META } from '../lib/format.js';
import NewProjectModal from './NewProjectModal.jsx';

export default function ProjectDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [worklog, setWorklog] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [error, setError] = useState(null);
  const [editing, setEditing] = useState(false);

  async function loadAll() {
    try {
      const [p, w, t] = await Promise.all([
        api.getProject(slug),
        api.listWorklog(slug),
        api.listTasks(slug),
      ]);
      setProject(p); setWorklog(w); setTasks(t); setError(null);
    } catch (e) {
      setError(e.message);
    }
  }

  useEffect(() => { loadAll(); /* eslint-disable-next-line */ }, [slug]);

  if (error) return <div className="error-banner">Could not load: {error} · <Link to="/">back</Link></div>;
  if (!project) return <div className="empty">Loading…</div>;

  const meta = STATUS_META[project.status] || STATUS_META.active;
  const openTasks = tasks.filter((t) => !t.done);
  const doneTasks = tasks.filter((t) => t.done);

  async function changeStatus(status) {
    await api.updateProject(project.slug, { status });
    loadAll();
  }

  return (
    <div className="detail">
      <div className="crumb"><Link to="/">← All projects</Link></div>

      <div className="detail-head">
        <div className="detail-title">
          <span className={`badge badge-${meta.color}`}>{meta.label}</span>
          <h1>{project.name}</h1>
        </div>
        <div className="detail-actions">
          <select className="status-select" value={project.status} onChange={(e) => changeStatus(e.target.value)}>
            <option value="active">Active</option>
            <option value="paused">Paused</option>
            <option value="done">Done</option>
            <option value="archived">Archived</option>
          </select>
          <button className="btn" onClick={() => setEditing(true)}>Edit</button>
        </div>
      </div>

      {project.description && <p className="detail-desc">{project.description}</p>}

      <div className="detail-meta">
        {project.tech_stack.length > 0 && (
          <div className="tags">{project.tech_stack.map((t) => <span key={t} className="tag">{t}</span>)}</div>
        )}
        <div className="links">
          {project.repo_url && <a href={project.repo_url} target="_blank" rel="noreferrer">Repo ↗</a>}
          {project.deploy_url && <a href={project.deploy_url} target="_blank" rel="noreferrer">Deploy ↗</a>}
          {project.docs_url && <a href={project.docs_url} target="_blank" rel="noreferrer">Docs ↗</a>}
          {project.local_path && <span className="muted mono">{project.local_path}</span>}
        </div>
        <span className="muted small">Last touched {relativeTime(project.updated_at)}</span>
      </div>

      <div className="detail-grid">
        <section className="panel">
          <h2>Next steps <span className="count">{openTasks.length}</span></h2>
          <Tasks tasks={tasks} openTasks={openTasks} doneTasks={doneTasks} slug={slug} onChange={loadAll} />
        </section>

        <section className="panel">
          <h2>Worklog <span className="muted small">— where you left off</span></h2>
          <Worklog slug={slug} worklog={worklog} onChange={loadAll} />
        </section>
      </div>

      {editing && (
        <NewProjectModal
          existing={project}
          onClose={() => setEditing(false)}
          onCreated={() => { setEditing(false); loadAll(); }}
        />
      )}
    </div>
  );
}

function Tasks({ tasks, openTasks, doneTasks, slug, onChange }) {
  const [title, setTitle] = useState('');

  async function add(e) {
    e.preventDefault();
    if (!title.trim()) return;
    await api.addTask(slug, { title });
    setTitle('');
    onChange();
  }
  async function toggle(t) { await api.setTask(t.id, { done: !t.done }); onChange(); }
  async function remove(t) { await api.deleteTask(t.id); onChange(); }

  return (
    <>
      <form className="add-inline" onSubmit={add}>
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Add a next step…" />
        <button className="btn btn-primary" type="submit">Add</button>
      </form>
      <ul className="task-list">
        {openTasks.map((t, i) => (
          <li key={t.id} className={i === 0 ? 'task next' : 'task'}>
            <label>
              <input type="checkbox" checked={false} onChange={() => toggle(t)} />
              <span>{i === 0 && <span className="resume-arrow">▶ </span>}{t.title}</span>
            </label>
            <button className="icon-btn" onClick={() => remove(t)} title="Delete">×</button>
          </li>
        ))}
        {openTasks.length === 0 && <li className="muted pad">No open tasks. 🎉</li>}
      </ul>
      {doneTasks.length > 0 && (
        <details className="done-group">
          <summary>{doneTasks.length} done</summary>
          <ul className="task-list">
            {doneTasks.map((t) => (
              <li key={t.id} className="task done">
                <label>
                  <input type="checkbox" checked readOnly onChange={() => toggle(t)} />
                  <span>{t.title}</span>
                </label>
                <button className="icon-btn" onClick={() => remove(t)} title="Delete">×</button>
              </li>
            ))}
          </ul>
        </details>
      )}
    </>
  );
}

function Worklog({ slug, worklog, onChange }) {
  const [body, setBody] = useState('');
  const [type, setType] = useState('progress');

  async function add(e) {
    e.preventDefault();
    if (!body.trim()) return;
    await api.addWorklog(slug, { body, entry_type: type });
    setBody('');
    onChange();
  }
  async function remove(id) { await api.deleteWorklog(id); onChange(); }

  return (
    <>
      <form className="worklog-add" onSubmit={add}>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={2}
          placeholder="What did you just do / where are you stopping?"
        />
        <div className="worklog-add-foot">
          <div className="type-picker">
            {Object.entries(ENTRY_META).map(([k, m]) => (
              <button
                type="button"
                key={k}
                className={`type-chip ${type === k ? `type-active type-${m.color}` : ''}`}
                onClick={() => setType(k)}
              >
                {m.icon} {m.label}
              </button>
            ))}
          </div>
          <button className="btn btn-primary" type="submit">Log it</button>
        </div>
      </form>

      <ol className="timeline">
        {worklog.map((w) => {
          const m = ENTRY_META[w.entry_type] || ENTRY_META.progress;
          return (
            <li key={w.id} className="tl-item">
              <span className={`tl-dot dot-${m.color}`} title={m.label}>{m.icon}</span>
              <div className="tl-body">
                <div className="tl-head">
                  <span className={`tl-type type-text-${m.color}`}>{m.label}</span>
                  <span className="muted small">{relativeTime(w.created_at)}</span>
                  {w.source !== 'web' && <span className="src-tag">{w.source}</span>}
                  <button className="icon-btn tl-del" onClick={() => remove(w.id)} title="Delete">×</button>
                </div>
                <div className="tl-text">{w.body}</div>
              </div>
            </li>
          );
        })}
        {worklog.length === 0 && <li className="muted pad">No worklog entries yet. Add your first note above.</li>}
      </ol>
    </>
  );
}
