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
    --halo-passes 1 \
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

# Round 3 — outdoor / visitor / security focus (May 2026 batch 2).
# Includes three smoker poses (npc16_1, npc18_1, npc20_2) which by
# design are *outdoor-only* placements per the original brief.
run_grid "$SRC/npc16.png" npc16
run_grid "$SRC/npc17.png" npc17
run_grid "$SRC/npc18.png" npc18
run_grid "$SRC/npc19.png" npc19
run_grid "$SRC/npc20.png" npc20

# === Round 5 — single-character sheets for the R&D / Turquoise team
# (May 2026 batch 3). Unlike the multi-char sheets above, these come
# from the LoRA in two layouts:
#   - 4×1 horizontal strip on orange chroma  (Chansoo, Chris, Adam)
#   - 2×2 grid on green chroma                (Nicole, Nick, Monika)
# Both cases collapse to a single "row" in the slot scheme — i.e.
# slot `npc<N>_0` with four directional poses. The python extractor
# emits flat `_0..._3` for 1-row mode and `_<r>_<c>` for grid mode;
# we rename both into the canonical `npc<N>_0_<dir>.png` shape so
# BootScene can reach them via the existing `{slot}_<dir>.png`
# convention.
#
# Direction order (matches the BootScene swap):
#   _0 = front (down)          col 0 of the source layout
#   _1 = facing screen-RIGHT   col 1 (top-right cell of a 2×2)
#   _2 = facing screen-LEFT    col 0, row 1 of a 2×2 (or col 2 flat)
#   _3 = back (up)             col 1, row 1 of a 2×2 (or col 3 flat)
run_strip_one() {
  local input="$1" prefix="$2"
  if [[ ! -f "$input" ]]; then
    echo "missing: $input — skipping $prefix"
    return
  fi
  python3 tools/sprite-sheet-to-frames.py \
    --input "$input" --rows 1 --frames 4 \
    --prefix "$prefix" --size "$SIZE" \
    --fuzz 30 --halo-fuzz 28 --halo-passes 1 --dilate 4 \
    --out "$OUT"
  # Re-shape `<prefix>_<i>.png` → `<prefix>_0_<i>.png` so the slot
  # is `npc<N>_0` like every other multi-character sheet.
  for i in 0 1 2 3; do
    if [[ -f "$OUT/${prefix}_${i}.png" ]]; then
      mv -f "$OUT/${prefix}_${i}.png" "$OUT/${prefix}_0_${i}.png"
    fi
  done
}

run_grid_2x2_one() {
  local input="$1" prefix="$2"
  if [[ ! -f "$input" ]]; then
    echo "missing: $input — skipping $prefix"
    return
  fi
  python3 tools/sprite-sheet-to-frames.py \
    --input "$input" --rows 2 --frames 2 \
    --prefix "$prefix" --size "$SIZE" \
    --fuzz 30 --halo-fuzz 28 --halo-passes 1 --dilate 4 \
    --out "$OUT"
  # Row-major flatten of (row,col) → directional pose:
  #   (0,0) → _0_0 (front)         (already correct)
  #   (0,1) → _0_1 (screen-right)  (already correct)
  #   (1,0) → _0_2 (screen-left)
  #   (1,1) → _0_3 (back)
  # Stage via .tmp suffix so we can reuse names safely.
  [[ -f "$OUT/${prefix}_0_0.png" ]] && mv -f "$OUT/${prefix}_0_0.png" "$OUT/${prefix}_0_0.tmp.png" || true
  [[ -f "$OUT/${prefix}_0_1.png" ]] && mv -f "$OUT/${prefix}_0_1.png" "$OUT/${prefix}_0_1.tmp.png" || true
  [[ -f "$OUT/${prefix}_1_0.png" ]] && mv -f "$OUT/${prefix}_1_0.png" "$OUT/${prefix}_0_2.tmp.png" || true
  [[ -f "$OUT/${prefix}_1_1.png" ]] && mv -f "$OUT/${prefix}_1_1.png" "$OUT/${prefix}_0_3.tmp.png" || true
  for i in 0 1 2 3; do
    if [[ -f "$OUT/${prefix}_0_${i}.tmp.png" ]]; then
      mv -f "$OUT/${prefix}_0_${i}.tmp.png" "$OUT/${prefix}_0_${i}.png"
    fi
  done
}

# Data Sandbox cast (Chansoo + R&D peers).
run_strip_one    "$SRC/npc21.png" npc21   # Chansoo (4×1 strip — orange chroma)
run_grid_2x2_one "$SRC/npc22.png" npc22   # Nicole  (2×2 grid — green chroma)
run_grid_2x2_one "$SRC/npc23.png" npc23   # Nick    (2×2 grid — green chroma)
run_grid_2x2_one "$SRC/npc24.png" npc24   # Monika  (2×2 grid — green chroma)
# Turquoise Lounge cast.
run_strip_one    "$SRC/npc25.png" npc25   # Chris   (4×1 strip — orange chroma)
run_strip_one    "$SRC/npc26.png" npc26   # Adam    (4×1 strip — orange chroma)

echo
echo "✓ done — outputs in $OUT/ ($(ls "$OUT"/*.png 2>/dev/null | wc -l | xargs) PNGs)"
