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

# Round-4 variants — keep going aggressive on halo. User picked
# round-3 E (halo 85 × 2) as best so far; sweep continues 85 → 105
# in 5-unit steps. global erase still locked at min_excess 120.
#
# Skin safety check: halo eroder requires ALL three channels within
# halo_fuzz of the bg (~248,100,5). Light skin max-diff vs bg ~135,
# dark skin max-diff ~95. Above 95 we risk eating dark-skin edges,
# which is why the gradient stops at 105 — but the only dark-skin
# character on npc15 is Andre (row 3), worth eyeballing carefully
# at the 100/105 column.

# A — round-3 E, the new anchor.
run_variant A "anchor — halo 85 × 2, global 120 (round-3 E)" \
  --fuzz 60 \
  --halo-fuzz 85 \
  --halo-passes 2 \
  --warm-min-excess 120

# B — halo 90.
run_variant B "halo 90 × 2, global 120" \
  --fuzz 60 \
  --halo-fuzz 90 \
  --halo-passes 2 \
  --warm-min-excess 120

# C — halo 95 (approaching dark-skin edge limit).
run_variant C "halo 95 × 2, global 120" \
  --fuzz 60 \
  --halo-fuzz 95 \
  --halo-passes 2 \
  --warm-min-excess 120

# D — halo 100 (at dark-skin max-diff; risk of eating edges).
run_variant D "halo 100 × 2, global 120 (dark-skin edge risk)" \
  --fuzz 60 \
  --halo-fuzz 100 \
  --halo-passes 2 \
  --warm-min-excess 120

# E — halo 105 (over dark-skin max-diff; almost certainly eats some).
run_variant E "halo 105 × 2, global 120 (likely over the line)" \
  --fuzz 60 \
  --halo-fuzz 105 \
  --halo-passes 2 \
  --warm-min-excess 120

echo "✓ done — open /sprite-cleanup-compare.html in the dev server"
