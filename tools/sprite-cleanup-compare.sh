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

# Round-6 variants — halo still locked at 85 × 2 (user's pick).
# Sweep global erase min_excess 120 → 112 in 2-unit steps (going
# *more aggressive* than the round-5 anchor). Skin r-excess hovers
# around 60 across light/dark tones, so values down to ~75 are
# still safely above skin's signature; below that we'd start
# eating warm clothing patches.

# A — global 120 (round-5 anchor, mildest in this sweep).
run_variant A "halo 85 × 2, global 120" \
  --fuzz 60 \
  --halo-fuzz 85 \
  --halo-passes 2 \
  --warm-min-excess 120

# B — global 118.
run_variant B "halo 85 × 2, global 118" \
  --fuzz 60 \
  --halo-fuzz 85 \
  --halo-passes 2 \
  --warm-min-excess 118

# C — global 116.
run_variant C "halo 85 × 2, global 116" \
  --fuzz 60 \
  --halo-fuzz 85 \
  --halo-passes 2 \
  --warm-min-excess 116

# D — global 114.
run_variant D "halo 85 × 2, global 114" \
  --fuzz 60 \
  --halo-fuzz 85 \
  --halo-passes 2 \
  --warm-min-excess 114

# E — global 112 (most aggressive in this sweep).
run_variant E "halo 85 × 2, global 112" \
  --fuzz 60 \
  --halo-fuzz 85 \
  --halo-passes 2 \
  --warm-min-excess 112

echo "✓ done — open /sprite-cleanup-compare.html in the dev server"
