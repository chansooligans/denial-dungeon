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

# Round-2 variants — fill the space between old-D ("looks ok") and
# old-E ("not ok") to find the sweet spot. Variables: halo_fuzz,
# halo_passes, and chroma_key_global_erase min_excess. Each step
# nudges one knob slightly more aggressive.

# A — old D (mildest, anchor): halo 70 × 2, global 130.
run_variant A "anchor (old D) — halo 70 × 2, global 130" \
  --fuzz 60 \
  --halo-fuzz 70 \
  --halo-passes 2 \
  --warm-min-excess 130

# B — slight halo bump.
run_variant B "halo 75 × 2, global 125" \
  --fuzz 60 \
  --halo-fuzz 75 \
  --halo-passes 2 \
  --warm-min-excess 125

# C — halo 80, still 2 passes.
run_variant C "halo 80 × 2, global 120" \
  --fuzz 60 \
  --halo-fuzz 80 \
  --halo-passes 2 \
  --warm-min-excess 120

# D — bump passes to 3 to chew an extra ring.
run_variant D "halo 80 × 3, global 115" \
  --fuzz 60 \
  --halo-fuzz 80 \
  --halo-passes 3 \
  --warm-min-excess 115

# E — old E (most aggressive, anchor; current production / "not ok").
run_variant E "anchor (old E) — halo 90 × 3, global 100" \
  --fuzz 60 \
  --halo-fuzz 90 \
  --halo-passes 3 \
  --warm-min-excess 100

echo "✓ done — open /sprite-cleanup-compare.html in the dev server"
