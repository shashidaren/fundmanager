import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { writeHandoffFile } from '../scripts/generate-handoff.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(__dirname, '..');

function runGit(args) {
  return execFileSync('git', args, {
    cwd: ROOT_DIR,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe']
  }).trim();
}

export function getGitStatusSummary() {
  try {
    const branch = runGit(['rev-parse', '--abbrev-ref', 'HEAD']);
    const statusRaw = runGit(['status', '--porcelain']);
    const modifiedFiles = statusRaw
      ? statusRaw
          .split('\n')
          .map((l) => l.trim())
          .filter(Boolean)
      : [];

    const logRaw = runGit(['log', '-n', '8', '--pretty=format:%h|%s|%cr']);
    const commits = logRaw
      ? logRaw.split('\n').map((line) => {
          const [hash, subject, relativeTime] = line.split('|');
          return { hash, subject, relativeTime };
        })
      : [];

    const handoffPath = path.join(ROOT_DIR, 'handoff.md');
    let handoffUpdatedAt = null;
    if (fs.existsSync(handoffPath)) {
      handoffUpdatedAt = fs.statSync(handoffPath).mtime.toISOString();
    }

    return {
      ok: true,
      branch,
      isClean: modifiedFiles.length === 0,
      modifiedFiles,
      latestCommit: commits[0] || null,
      recentCommits: commits,
      handoffUpdatedAt
    };
  } catch (err) {
    return {
      ok: false,
      error: err.message || 'Unable to inspect git status',
      branch: 'unknown',
      isClean: false,
      modifiedFiles: [],
      recentCommits: []
    };
  }
}

export function syncToGit(customMessage = '') {
  // 1. Always refresh handoff.md first so documentation is guaranteed current
  writeHandoffFile();

  const branch = runGit(['rev-parse', '--abbrev-ref', 'HEAD']);
  if (!branch || branch === 'HEAD') {
    throw new Error('Detached HEAD state; refusing to push.');
  }

  runGit(['add', '-A']);
  const staged = runGit(['diff', '--cached', '--name-only']);

  let committed = false;
  let commitHash = runGit(['rev-parse', '--short', 'HEAD']);
  const commitMsg =
    customMessage && customMessage.trim()
      ? customMessage.trim().slice(0, 120)
      : `chore(sync): update portfolio state, model calibration & handoff.md`;

  if (staged.length > 0) {
    runGit(['commit', '-m', commitMsg]);
    committed = true;
    commitHash = runGit(['rev-parse', '--short', 'HEAD']);
  }

  let pushed = false;
  let pushNote = '';
  try {
    runGit(['push', '-u', 'origin', branch]);
    pushed = true;
    pushNote = `Synced cleanly to origin/${branch} (${commitHash})`;
  } catch (pushErr) {
    pushNote = `Committed locally (${commitHash}); remote push note: ${pushErr.message}`;
  }

  return {
    committed,
    pushed,
    branch,
    commitHash,
    commitMessage: commitMsg,
    note: pushNote,
    status: getGitStatusSummary()
  };
}
