#!/usr/bin/env bash
set -euo pipefail
cd /opt/mine/frontend
exec node .output/server/index.mjs
