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

# Round-3 variants — global erase fixed at min_excess 120 (per user
# preference); only halo_fuzz and halo_passes vary. C from round 2
# (halo 80 × 2) was the closest pick; this sweep brackets it.

# A — slightly less halo (70 vs 80) but otherwise C's params.
run_variant A "halo 70 × 2, global 120" \
  --fuzz 60 \
  --halo-fuzz 70 \
  --halo-passes 2 \
  --warm-min-excess 120

# B — between A and C.
run_variant B "halo 75 × 2, global 120" \
  --fuzz 60 \
  --halo-fuzz 75 \
  --halo-passes 2 \
  --warm-min-excess 120

# C — round-2 C, the current pick (anchor).
run_variant C "anchor — halo 80 × 2, global 120 (current pick)" \
  --fuzz 60 \
  --halo-fuzz 80 \
  --halo-passes 2 \
  --warm-min-excess 120

# D — same halo as C, one more pass (more aggressive depth-wise).
run_variant D "halo 80 × 3, global 120" \
  --fuzz 60 \
  --halo-fuzz 80 \
  --halo-passes 3 \
  --warm-min-excess 120

# E — wider halo (85), still 2 passes (more aggressive width-wise).
run_variant E "halo 85 × 2, global 120" \
  --fuzz 60 \
  --halo-fuzz 85 \
  --halo-passes 2 \
  --warm-min-excess 120

echo "✓ done — open /sprite-cleanup-compare.html in the dev server"
