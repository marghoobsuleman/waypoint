import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api.js';
import { relativeTime, STATUS_META, staleClass } from '../lib/format.js';
import NewProjectModal from './NewProjectModal.jsx';

const FILTERS = ['all', 'active', 'paused', 'done'];

export default function Dashboard() {
  const [projects, setProjects] = useState([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);
  const [error, setError] = useState(null);

  async function load() {
    setLoading(true);
    try {
      setProjects(await api.listProjects(filter === 'all' ? undefined : filter));
      setError(null);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [filter]);

  const stats = {
    total: projects.length,
    active: projects.filter((p) => p.status === 'active').length,
    stale: projects.filter((p) => p.status === 'active' && p.stale_days >= 7).length,
    openTasks: projects.reduce((s, p) => s + (p.open_tasks || 0), 0),
  };

  return (
    <div className="dashboard">
      <div className="page-head">
        <div>
          <h1>Your Projects</h1>
          <p className="muted">Where you left off, across everything you're building.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowNew(true)}>+ New Project</button>
      </div>

      <div className="stat-row">
        <Stat label="Projects" value={stats.total} />
        <Stat label="Active" value={stats.active} accent="green" />
        <Stat label="Going stale" value={stats.stale} accent={stats.stale ? 'amber' : undefined} />
        <Stat label="Open tasks" value={stats.openTasks} />
      </div>

      <div className="filters">
        {FILTERS.map((f) => (
          <button key={f} className={`chip ${filter === f ? 'chip-active' : ''}`} onClick={() => setFilter(f)}>
            {f[0].toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {error && <div className="error-banner">Could not load projects: {error}</div>}
      {loading ? (
        <div className="empty">Loading…</div>
      ) : projects.length === 0 ? (
        <div className="empty">
          <p>No projects here yet.</p>
          <button className="btn btn-primary" onClick={() => setShowNew(true)}>Create your first project</button>
        </div>
      ) : (
        <div className="card-grid">
          {projects.map((p) => (
            <ProjectCard key={p.id} p={p} />
          ))}
        </div>
      )}

      {showNew && (
        <NewProjectModal
          onClose={() => setShowNew(false)}
          onCreated={() => { setShowNew(false); load(); }}
        />
      )}
    </div>
  );
}

function Stat({ label, value, accent }) {
  return (
    <div className="stat">
      <div className={`stat-value ${accent ? `accent-${accent}` : ''}`}>{value}</div>
      <div className="stat-label">{label}</div>
    </div>
  );
}

function ProjectCard({ p }) {
  const meta = STATUS_META[p.status] || STATUS_META.active;
  return (
    <Link to={`/p/${p.slug}`} className={`card ${staleClass(p.stale_days, p.status)}`}>
      <div className="card-top">
        <span className={`badge badge-${meta.color}`}>{meta.label}</span>
        <span className="muted small">{p.stale_days === 0 ? 'today' : `${p.stale_days}d ago`}</span>
      </div>
      <h3 className="card-title">{p.name}</h3>
      {p.description && <p className="card-desc">{p.description}</p>}

      {p.tech_stack?.length > 0 && (
        <div className="tags">
          {p.tech_stack.slice(0, 4).map((t) => <span key={t} className="tag">{t}</span>)}
        </div>
      )}

      <div className="card-resume">
        {p.next_task ? (
          <><span className="resume-arrow">▶</span> {p.next_task}</>
        ) : p.last_log ? (
          <span className="muted">{p.last_log.body}</span>
        ) : (
          <span className="muted">No tasks or logs yet</span>
        )}
      </div>

      <div className="card-foot">
        <span>{p.open_tasks} open task{p.open_tasks === 1 ? '' : 's'}</span>
        {p.last_log && <span className="muted">logged {relativeTime(p.last_log.created_at)}</span>}
      </div>
    </Link>
  );
}
