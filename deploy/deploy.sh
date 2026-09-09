#!/usr/bin/env bash
set -euo pipefail
cd /opt/mine/frontend
chmod +x deploy/start.sh
pm2 restart mine-web || pm2 start /opt/mine/ecosystem.config.cjs --only mine-web
pm2 save
