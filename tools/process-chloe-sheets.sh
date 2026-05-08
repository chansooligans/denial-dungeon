#!/usr/bin/env bash
# Convert the four LoRA sprite-sheets in sprite-source/chloe/ into
# 16 transparent 64×64 PNGs in public/sprites/player/.
#
# Required input files (4 frames each, horizontal layout, cream bg):
#   sprite-source/chloe/chloe_walk_front.png
#   sprite-source/chloe/chloe_walk_back.png
#   sprite-source/chloe/chloe_walk_left.png
#   sprite-source/chloe/chloe_walk_right.png
#
# Output: public/sprites/player/{down|up|left|right}_walk_{0..3}.png

set -euo pipefail

cd "$(dirname "$0")/.."

SRC=sprite-source/chloe
OUT=public/sprites/player

run_sheet() {
  local input="$1" prefix="$2"
  if [[ ! -f "$input" ]]; then
    echo "missing: $input — skipping $prefix"
    return
  fi
  python3 tools/sprite-sheet-to-frames.py \
    --input "$input" \
    --frames 4 \
    --prefix "$prefix" \
    --out "$OUT"
}

run_sheet "$SRC/chloe_walk_front.png" down_walk
run_sheet "$SRC/chloe_walk_back.png"  up_walk
run_sheet "$SRC/chloe_walk_left.png"  left_walk
run_sheet "$SRC/chloe_walk_right.png" right_walk

echo
echo "✓ done — outputs in $OUT/"
ls -la "$OUT"/*_walk_*.png 2>/dev/null || true
