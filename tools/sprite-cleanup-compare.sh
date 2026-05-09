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

# Round-7 variants — halo and global both locked (85 / 120). Sweep
# halo_passes 1 → 5 to see how deep the edge erosion can go before
# it starts eating into the character. Each pass eats one pixel
# ring of edge pixels matching halo_fuzz. Effects compound — the
# Nth pass operates on edges revealed by pass N-1.

# A — passes 1 (single ring).
run_variant A "halo 85 × 1, global 120" \
  --fuzz 60 \
  --halo-fuzz 85 \
  --halo-passes 1 \
  --warm-min-excess 120

# B — passes 2 (round-3 anchor / current pick).
run_variant B "halo 85 × 2, global 120 (current pick)" \
  --fuzz 60 \
  --halo-fuzz 85 \
  --halo-passes 2 \
  --warm-min-excess 120

# C — passes 3.
run_variant C "halo 85 × 3, global 120" \
  --fuzz 60 \
  --halo-fuzz 85 \
  --halo-passes 3 \
  --warm-min-excess 120

# D — passes 4.
run_variant D "halo 85 × 4, global 120" \
  --fuzz 60 \
  --halo-fuzz 85 \
  --halo-passes 4 \
  --warm-min-excess 120

# E — passes 5.
run_variant E "halo 85 × 5, global 120" \
  --fuzz 60 \
  --halo-fuzz 85 \
  --halo-passes 5 \
  --warm-min-excess 120

echo "✓ done — open /sprite-cleanup-compare.html in the dev server"
