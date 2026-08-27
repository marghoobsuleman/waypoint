#!/usr/bin/env node
// create-waypoint — scaffold a local Waypoint checkout in one command.
//
//   npm create waypoint@latest [dir] [options]
//   npx create-waypoint [dir] [options]
//
// Downloads the Waypoint repo into <dir> (default: "waypoint"), installs
// dependencies, and seeds a .env from the template. Dependency-free so npx
// stays fast — it shells out to the user's existing git + npm.

import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readdirSync, rmSync, copyFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

const REPO = 'https://github.com/marghoobsuleman/waypoint.git';
const MIN_NODE = 22.5;

const c = {
  reset: '\x1b[0m', bold: '\x1b[1m', dim: '\x1b[2m',
  green: '\x1b[32m', cyan: '\x1b[36m', red: '\x1b[31m', yellow: '\x1b[33m',
};
const info = (m) => console.log(m);
const step = (m) => console.log(`${c.cyan}›${c.reset} ${m}`);
const ok = (m) => console.log(`${c.green}✓${c.reset} ${m}`);
const fail = (m) => { console.error(`${c.red}✗ ${m}${c.reset}`); process.exit(1); };

// --- args -----------------------------------------------------------------
const argv = process.argv.slice(2);
if (argv.includes('-h') || argv.includes('--help')) {
  info(`
${c.bold}create-waypoint${c.reset} — scaffold a local Waypoint project tracker.

${c.bold}Usage${c.reset}
  npm create waypoint@latest [dir] [options]
  npx create-waypoint [dir] [options]

${c.bold}Options${c.reset}
  --branch <name>   Branch/tag to download (default: main)
  --no-install      Skip "npm install"
  --seed            Run "npm run seed" (adds sample projects)
  --git             Keep the .git history (default: removed for a clean start)
  -h, --help        Show this help
`);
  process.exit(0);
}

const flag = (name) => argv.includes(name);
const opt = (name, def) => {
  const i = argv.indexOf(name);
  return i !== -1 && argv[i + 1] ? argv[i + 1] : def;
};
// Positionals = args that aren't a flag and aren't the value consumed by --branch.
const optsWithValue = new Set(['--branch']);
const positionals = argv.filter((a, i) => !a.startsWith('-') && !optsWithValue.has(argv[i - 1]));
const targetName = positionals[0] || 'waypoint';
const branch = opt('--branch', 'main');
const doInstall = !flag('--no-install');
const doSeed = flag('--seed');
const keepGit = flag('--git');
const targetDir = resolve(process.cwd(), targetName);

// --- preflight ------------------------------------------------------------
const nodeMajorMinor = Number(process.versions.node.split('.').slice(0, 2).join('.'));
if (nodeMajorMinor < MIN_NODE) {
  fail(`Waypoint needs Node ≥ ${MIN_NODE} (you have ${process.versions.node}). It uses the built-in node:sqlite.`);
}
if (!hasCmd('git')) fail('git is required but was not found on your PATH.');

if (existsSync(targetDir) && readdirSync(targetDir).length > 0) {
  fail(`Target directory "${targetName}" already exists and is not empty.`);
}

info(`\n${c.bold}Creating a Waypoint project in ${c.cyan}${targetDir}${c.reset}\n`);

// --- clone ----------------------------------------------------------------
step(`Downloading Waypoint (${branch})…`);
const clone = run('git', ['clone', '--depth', '1', '--branch', branch, REPO, targetDir], { stdio: 'inherit' });
if (clone.status !== 0) fail('git clone failed. Check the branch name and your network connection.');

if (!keepGit) {
  rmSync(join(targetDir, '.git'), { recursive: true, force: true });
  ok('Fetched sources (fresh git history — run "git init" when ready).');
} else {
  ok('Fetched sources (kept .git history).');
}

// --- .env -----------------------------------------------------------------
const envExample = join(targetDir, '.env.example');
const envFile = join(targetDir, '.env');
if (existsSync(envExample) && !existsSync(envFile)) {
  copyFileSync(envExample, envFile);
  ok('Created .env from .env.example');
}

// --- install --------------------------------------------------------------
if (doInstall) {
  step('Installing dependencies (npm install)…');
  const install = run('npm', ['install'], { cwd: targetDir, stdio: 'inherit' });
  if (install.status !== 0) fail('npm install failed. You can retry it manually inside the project.');
  ok('Dependencies installed.');

  if (doSeed) {
    step('Seeding sample projects…');
    run('npm', ['run', 'seed'], { cwd: targetDir, stdio: 'inherit' });
  }
}

// --- done -----------------------------------------------------------------
info(`\n${c.green}${c.bold}Done!${c.reset} Waypoint is ready in ${c.cyan}${targetName}${c.reset}.\n`);
info(`${c.bold}Next steps${c.reset}`);
info(`  cd ${targetName}`);
if (!doInstall) info('  npm install');
if (!doSeed) info(`  npm run seed        ${c.dim}# optional: add sample projects${c.reset}`);
info(`  npm run dev         ${c.dim}# API on :4000, web UI on :5173${c.reset}`);
info(`\nThen open ${c.cyan}http://localhost:5173${c.reset}\n`);

// --- helpers --------------------------------------------------------------
function run(cmd, args, options) {
  return spawnSync(cmd, args, { shell: process.platform === 'win32', ...options });
}
function hasCmd(cmd) {
  const probe = process.platform === 'win32' ? 'where' : 'which';
  return spawnSync(probe, [cmd], { stdio: 'ignore', shell: process.platform === 'win32' }).status === 0;
}
