import { DatabaseSync } from 'node:sqlite';
import { existsSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { homedir } from 'node:os';

/**
 * Resolve the database file path.
 *
 * Priority:
 *   1. WAYPOINT_DB environment variable (absolute path)
 *   2. ~/.waypoint/data.db  (default)
 *
 * A fixed home-directory default matters: the MCP server and CLI are launched
 * from arbitrary working directories (whatever repo you happen to be in), so
 * they must all resolve to the *same* database rather than a cwd-relative one.
 */
export function resolveDbPath() {
  const fromEnv = process.env.WAYPOINT_DB;
  if (fromEnv && fromEnv.trim()) return fromEnv.trim();
  return join(homedir(), '.waypoint', 'data.db');
}

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
