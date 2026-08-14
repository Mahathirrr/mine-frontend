#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SOURCE="${LEETCODE_MATERIALS_DIR:-/home/neonnex/dev/leetcode/ModuleLeetCodeRoadmap/build}"
TARGET="$ROOT/public/leetcode-materials/build"

mkdir -p "$ROOT/public/leetcode-materials"
ln -sfn "$SOURCE" "$TARGET"

echo "Linked LeetCode materials:"
echo "  $SOURCE -> $TARGET"
