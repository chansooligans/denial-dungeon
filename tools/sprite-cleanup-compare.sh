#!/usr/bin/env bash
# Run npc15.png through five different cleanup parameterizations and
# write each variant to its own folder under
# `public/sprites/cleanup-compare/{A..E}/`. Open
# `/sprite-cleanup-compare.html` to inspect the variants side-by-side
# and pick the one that strikes the best balance between tight borders
# and intact faces.
#
# Each variant disables the warm-chroma auto-bump (`--no-warm-bump`)
# so we can pass exact `--fuzz` / `--halo-fuzz` values without max()
# clamping; whether `chroma_key_global_erase` runs (and at what
# min_excess) is its own knob.

set -euo pipefail

cd "$(dirname "$0")/.."

SHEET=sprite-source/npcs/npc15.png
OUT_BASE=public/sprites/cleanup-compare
SIZE=64

if [[ ! -f "$SHEET" ]]; then
  echo "missing $SHEET — bail"
  exit 1
fi

run_variant() {
  local label="$1"
  local description="$2"
  local out="$OUT_BASE/$label"
  shift 2
  rm -rf "$out"
  mkdir -p "$out"
  echo "=== Variant $label — $description ==="
  python3 tools/sprite-sheet-to-frames.py \
    --input "$SHEET" \
    --rows 5 \
    --frames 4 \
    --prefix "v${label}" \
    --size "$SIZE" \
    --no-warm-bump \
    --dilate 4 \
    --out "$out" \
    "$@"
  echo
}

# A — minimal: just flood-fill, no halo, no global erase.
run_variant A "minimal — flood only, no halo, no global erase" \
  --fuzz 50 \
  --halo-fuzz 0 \
  --halo-passes 0 \
  --no-global-erase

# B — gentle: small halo, no global erase.
run_variant B "gentle — halo 50, passes 2, no global erase" \
  --fuzz 55 \
  --halo-fuzz 50 \
  --halo-passes 2 \
  --no-global-erase

# C — medium (likely best for faces): halo 70, passes 2, no global erase.
run_variant C "medium — halo 70, passes 2, no global erase" \
  --fuzz 60 \
  --halo-fuzz 70 \
  --halo-passes 2 \
  --no-global-erase

# D — medium + safe global erase (high min_excess).
run_variant D "medium + safe global — halo 70, passes 2, global min_excess 130" \
  --fuzz 60 \
  --halo-fuzz 70 \
  --halo-passes 2 \
  --warm-min-excess 130

# E — current production (PR #169 — too aggressive).
run_variant E "current production — halo 90, passes 3, global min_excess 100" \
  --fuzz 60 \
  --halo-fuzz 90 \
  --halo-passes 3 \
  --warm-min-excess 100

echo "✓ done — open /sprite-cleanup-compare.html in the dev server"
