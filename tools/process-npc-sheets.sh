#!/usr/bin/env bash
# Convert the LoRA NPC sprite-sheets in sprite-source/npcs/ into
# 64×64 transparent PNGs in public/sprites/npcs-raw/ — one PNG per
# (sheet, row, direction) cell.
#
# Each sheet is a 4-row × 4-column grid. Each row is a different
# character, each column is a directional pose (typically front /
# left / right / back, but the LoRA isn't always consistent — eyeball
# the output and confirm before integrating).
#
# Output: public/sprites/npcs-raw/<sheet>_<row>_<col>.png
# e.g. doctor_officer_nurse_0_0.png is the top-left character's
# first directional pose.

set -euo pipefail

cd "$(dirname "$0")/.."

SRC=sprite-source/npcs
OUT=public/sprites/npcs-raw
SIZE="${SIZE:-64}"

# Default to 4 rows (the original sheet shape — 4 chars per sheet).
# Newer sheets are sometimes 5 rows; pass `5` as the third arg.
run_grid() {
  local input="$1" prefix="$2" rows="${3:-4}"
  if [[ ! -f "$input" ]]; then
    echo "missing: $input — skipping $prefix"
    return
  fi
  python3 tools/sprite-sheet-to-frames.py \
    --input "$input" \
    --rows "$rows" \
    --frames 4 \
    --prefix "$prefix" \
    --size "$SIZE" \
    --fuzz 30 \
    --halo-fuzz 28 \
    --halo-passes 2 \
    --dilate 4 \
    --out "$OUT"
}

# 4-row sheets (4 characters × 4 directional poses)
run_grid "$SRC/npc1.png" npc1
run_grid "$SRC/npc2.png" npc2
run_grid "$SRC/npc3.png" npc3
run_grid "$SRC/npc4.png" npc4
run_grid "$SRC/npc5.png" npc5
run_grid "$SRC/npc6.png" npc6
run_grid "$SRC/npc7.png" npc7
run_grid "$SRC/npc8.png" npc8
run_grid "$SRC/npc9.png" npc9
run_grid "$SRC/npc10.png" npc10

# 5-row sheets (5 characters × 4 directional poses)
run_grid "$SRC/npc11.png" npc11 5
run_grid "$SRC/npc12.png" npc12 5
run_grid "$SRC/npc13.png" npc13 5
run_grid "$SRC/npc14.png" npc14 5
run_grid "$SRC/npc15.png" npc15 5

echo
echo "✓ done — outputs in $OUT/ ($(ls "$OUT"/*.png 2>/dev/null | wc -l | xargs) PNGs)"
