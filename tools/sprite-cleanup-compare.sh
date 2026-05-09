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

# Round-5 variants — halo locked at 85 × 2 (user's pick); sweep
# global erase min_excess 120 → 124 in 1-unit steps. Lower
# min_excess = more aggressive global erase (more pixels match
# the dominance pattern); higher = more skin/clothing-safe.

# A — global 120 (most aggressive in this sweep).
run_variant A "halo 85 × 2, global 120" \
  --fuzz 60 \
  --halo-fuzz 85 \
  --halo-passes 2 \
  --warm-min-excess 120

# B — global 121.
run_variant B "halo 85 × 2, global 121" \
  --fuzz 60 \
  --halo-fuzz 85 \
  --halo-passes 2 \
  --warm-min-excess 121

# C — global 122.
run_variant C "halo 85 × 2, global 122" \
  --fuzz 60 \
  --halo-fuzz 85 \
  --halo-passes 2 \
  --warm-min-excess 122

# D — global 123.
run_variant D "halo 85 × 2, global 123" \
  --fuzz 60 \
  --halo-fuzz 85 \
  --halo-passes 2 \
  --warm-min-excess 123

# E — global 124 (least aggressive in this sweep).
run_variant E "halo 85 × 2, global 124" \
  --fuzz 60 \
  --halo-fuzz 85 \
  --halo-passes 2 \
  --warm-min-excess 124

echo "✓ done — open /sprite-cleanup-compare.html in the dev server"
