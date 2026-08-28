import { DatabaseSync } from 'node:sqlite';
import { existsSync, mkdirSync } from 'node:fs';
import { dirname, join, isAbsolute, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

// The Waypoint project root, derived from this file's location — NOT from the
// current working directory. This matters because the MCP server and CLI are
// launched from arbitrary directories (whatever repo you're in), yet they must
// all resolve to the *same* project root, .env file, and database.
const PROJECT_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');

// Load environment variables from <project-root>/.env if present. Uses Node's
// built-in env-file loader (Node >= 20.12) — no dependency. Silent if absent.
try {
  const envPath = join(PROJECT_ROOT, '.env');
  if (existsSync(envPath) && typeof process.loadEnvFile === 'function') {
    process.loadEnvFile(envPath);
  }
} catch {
  /* ignore malformed/missing .env — fall back to shell env + defaults */
}

/**
 * Resolve the database file path.
 *
 * Priority:
 *   1. WAYPOINT_DB (from .env or the shell). Absolute paths are used as-is;
 *      relative paths resolve against the project root.
 *   2. <project-root>/data.db  (default — lives inside the Waypoint project).
 */
export function resolveDbPath() {
  // 1. WAYPOINT_DB — an explicit full path wins. This is how the Docker
  //    container points core at the mounted file (WAYPOINT_DB=/data/data.db).
  //    Absolute paths are used as-is; relative paths resolve from the root.
  const fromEnv = process.env.WAYPOINT_DB;
  if (fromEnv && fromEnv.trim()) {
    const p = fromEnv.trim();
    return isAbsolute(p) ? p : resolve(PROJECT_ROOT, p);
  }
  // 2. WAYPOINT_DATA_DIR (+ WAYPOINT_DB_FILE) — the single source of truth
  //    shared with docker-compose.yml, so a local run and the container both
  //    resolve to the same database. The directory holds data.db and its
  //    -wal/-shm sidecar files, which is why Docker mounts the folder.
  const dataDir = process.env.WAYPOINT_DATA_DIR;
  if (dataDir && dataDir.trim()) {
    const base = dataDir.trim();
    const file = (process.env.WAYPOINT_DB_FILE || 'data.db').trim();
    return isAbsolute(base) ? join(base, file) : resolve(PROJECT_ROOT, base, file);
  }
  // 3. Default — inside the project directory.
  return join(PROJECT_ROOT, 'data.db');
}

export { PROJECT_ROOT };

let _db = null;

/** Get a shared, lazily-initialised database connection. */
export function getDb() {
  if (_db) return _db;
  const path = resolveDbPath();
  const dir = dirname(path);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  _db = new DatabaseSync(path);
  _db.exec('PRAGMA journal_mode = WAL;');
  _db.exec('PRAGMA foreign_keys = ON;');
  migrate(_db);
  return _db;
}

/** Create tables if they do not exist. Idempotent. */
function migrate(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS projects (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      name         TEXT NOT NULL,
      slug         TEXT UNIQUE NOT NULL,
      description  TEXT DEFAULT '',
      status       TEXT NOT NULL DEFAULT 'active',
      tech_stack   TEXT DEFAULT '',          -- comma-separated tags
      repo_url     TEXT DEFAULT '',
      deploy_url   TEXT DEFAULT '',
      docs_url     TEXT DEFAULT '',
      local_path   TEXT DEFAULT '',          -- used to auto-detect project from cwd
      created_at   TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at   TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS worklog (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id   INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      body         TEXT NOT NULL,
      entry_type   TEXT NOT NULL DEFAULT 'progress',  -- progress | blocker | idea | decision
      source       TEXT NOT NULL DEFAULT 'web',       -- web | mcp | cli
      created_at   TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS tasks (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id   INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      title        TEXT NOT NULL,
      done         INTEGER NOT NULL DEFAULT 0,
      position     INTEGER NOT NULL DEFAULT 0,
      created_at   TEXT NOT NULL DEFAULT (datetime('now')),
      done_at      TEXT
    );

    CREATE INDEX IF NOT EXISTS idx_worklog_project ON worklog(project_id, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_tasks_project ON tasks(project_id, done, position);
  `);
}

/** For tests / scripts that need a fresh connection to a specific file. */
export function closeDb() {
  if (_db) {
    _db.close();
    _db = null;
  }
}
