#!/usr/bin/env bash
set -euo pipefail

# Safe auto-pull & refresh script for Linux server deployments (e.g. root@fubd)
APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$APP_DIR"

export PATH="/usr/local/bin:/usr/bin:/bin:$PATH"

BRANCH="$(git rev-parse --abbrev-ref HEAD)"
BEFORE_SHA="$(git rev-parse HEAD)"

echo "[$(date -u +"%Y-%m-%dT%H:%M:%SZ")] Checking remote updates on origin/${BRANCH}..."
git fetch origin "$BRANCH"

REMOTE_SHA="$(git rev-parse "origin/${BRANCH}")"
if [ "$BEFORE_SHA" = "$REMOTE_SHA" ]; then
  echo "Already up to date (${BEFORE_SHA})."
  exit 0
fi

# Stash any local runtime edits in data/ if present, rebase cleanly, restore if needed
if [ -n "$(git status --porcelain)" ]; then
  git stash push -m "auto-sync-stash-$(date +%s)" || true
  STASHED=1
else
  STASHED=0
fi

git pull --rebase origin "$BRANCH"

if [ "$STASHED" -eq 1 ]; then
  git stash pop || true
fi

# Install any new packages and rebuild production bundle if code changed
if git diff --name-only "$BEFORE_SHA" HEAD | grep -Eq '^(package\.json|src/|index\.html|vite\.config\.js)'; then
  echo "Frontend/dependencies changed — rebuilding production bundle..."
  npm install
  npm run build
  if command -v systemctl >/dev/null 2>&1 && systemctl is-enabled --quiet fundpilot.service 2>/dev/null; then
    systemctl restart fundpilot.service
    echo "Restarted fundpilot.service"
  fi
fi

echo "Updated cleanly from ${BEFORE_SHA} to $(git rev-parse --short HEAD)."
