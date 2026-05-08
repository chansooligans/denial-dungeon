#!/usr/bin/env bash
# Convert the four LoRA sprite-sheets in sprite-source/chloe/ into
# 16 transparent 64×64 PNGs in public/sprites/player/.
#
# Required input files (4 frames each, horizontal layout, cream bg):
#   sprite-source/chloe/chloe-side-a.png   (painterly variant)
#   sprite-source/chloe/chloe-side-b.png   (chunky pixel variant)
#   sprite-source/chloe/chloe-back.png
#   sprite-source/chloe/chloe-front.png
#
# Output: public/sprites/player/{down|up|side}_walk_{0..3}.png
#
# Pick which side variant to use via SIDE_VARIANT (a|b). Default a.

set -euo pipefail

cd "$(dirname "$0")/.."

SIDE_VARIANT="${SIDE_VARIANT:-a}"
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

run_sheet "$SRC/chloe-front.png" down_walk
run_sheet "$SRC/chloe-back.png"  up_walk
run_sheet "$SRC/chloe-side-${SIDE_VARIANT}.png" side_walk

echo
echo "✓ done — outputs in $OUT/"
ls -la "$OUT"/*_walk_*.png 2>/dev/null || true
