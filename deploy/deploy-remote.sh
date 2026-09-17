#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SSH_KEY="${DEPLOY_SSH_KEY:-$HOME/.ssh/sentinel_github_deploy}"
SSH_HOST="${DEPLOY_SSH_HOST:-root@141.11.190.106}"
SSH_PORT="${DEPLOY_SSH_PORT:-30890}"
RSYNC_RSH="ssh -i $SSH_KEY -p $SSH_PORT -o BatchMode=yes -o StrictHostKeyChecking=accept-new"

cd "$ROOT"
echo "Building production bundle (same-origin /api)..."
npm run build

echo "Syncing to VPS..."
rsync -avz --delete -e "$RSYNC_RSH" "$ROOT/.output/" "$SSH_HOST:/opt/mine/frontend/.output/"
rsync -avz --delete -e "$RSYNC_RSH" "$ROOT/public/" "$SSH_HOST:/opt/mine/frontend/public/"
rsync -avz -e "$RSYNC_RSH" "$ROOT/deploy/" "$SSH_HOST:/opt/mine/frontend/deploy/"

echo "Restarting mine-web..."
ssh -i "$SSH_KEY" -p "$SSH_PORT" -o BatchMode=yes "$SSH_HOST" 'bash /opt/mine/frontend/deploy/deploy.sh'

echo "Deploy complete."
