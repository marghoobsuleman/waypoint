export function relativeTime(iso) {
  if (!iso) return '';
  const then = new Date(iso.replace(' ', 'T') + (iso.includes('Z') ? '' : 'Z')).getTime();
  const diff = Date.now() - then;
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}d ago`;
  const mo = Math.floor(d / 30);
  if (mo < 12) return `${mo}mo ago`;
  return `${Math.floor(mo / 12)}y ago`;
}

export const STATUS_META = {
  active: { label: 'Active', color: 'green' },
  paused: { label: 'Paused', color: 'amber' },
  done: { label: 'Done', color: 'blue' },
  archived: { label: 'Archived', color: 'gray' },
};

export const ENTRY_META = {
  progress: { label: 'Progress', icon: '↑', color: 'green' },
  blocker: { label: 'Blocker', icon: '⚠', color: 'red' },
  idea: { label: 'Idea', icon: '💡', color: 'amber' },
  decision: { label: 'Decision', icon: '◆', color: 'blue' },
};

export function staleClass(days, status) {
  if (status !== 'active') return '';
  if (days >= 14) return 'stale-hot';
  if (days >= 7) return 'stale-warm';
  return '';
}
