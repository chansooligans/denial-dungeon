# Skill: Sprite cleanup

How to take a freshly-generated NPC contact sheet from the LoRA
pipeline (or ChatGPT image gen) and turn it into the per-cell 64×64
PNGs the game loads at runtime. Captures the chroma-key handling,
the failure modes that took several rounds to surface, and the
production parameter values we ended up at after empirical sweeps.

This is the procedure for adding **new** sheets — the existing 20
sheets are already processed and committed.

## Pipeline overview

```
sprite-source/npcs/npcN.png   ←  one contact sheet per "rounds" of
                                 NPCs. 4-row format = 4 chars × 4
                                 directional poses; 5-row format
                                 also supported.
        ↓
tools/process-npc-sheets.sh   ←  thin shell wrapper that calls the
                                 Python tool once per sheet, with
                                 the production parameters baked
                                 in. Pass `5` as 3rd arg for
                                 5-row sheets.
        ↓
tools/sprite-sheet-to-frames.py   ← does the actual work: split
                                    grid → flood-fill bg → erode
                                    halo → global chroma erase →
                                    keep-largest-blob → trim to
                                    bbox → resize to 64×64.
        ↓
public/sprites/npcs-raw/npcN_R_C.png   ← N=sheet, R=row, C=col
                                         (0=front, 1=L, 2=R, 3=back)
```

`BootScene.preload` reads `npcN_R_0.png` (front pose) as the
canonical `npc_<id>` texture and the other three poses as
`npc_<id>_<dir>` — the slot-to-id mapping lives in
`src/scenes/npcSources.ts`.

## When to run

After dropping a new sheet (or several) into `sprite-source/npcs/`
named `npc{N}.png`. Then:

```bash
# Bootstrapping a clean Pillow venv (one-time per dev machine):
python3 -m venv .venv-tools
.venv-tools/bin/pip install Pillow

# Each run:
PATH=".venv-tools/bin:$PATH" bash tools/process-npc-sheets.sh
```

The script is idempotent — re-running on existing sheets just
overwrites the per-cell PNGs with the current parameter values.
Useful when a parameter changes; not useful when the source
sheets are unchanged.

## The chroma-key pitfall (warm vs. cool)

This is the lesson that took six rounds to find. **The cleanup
algorithm has different defaults for warm vs. cool chroma-key
backgrounds, and you need to know which kind you have.**

The sheet's corner sample drives detection:
- `is_chroma_key()` → true if max-channel minus min-channel > 150
  (highly saturated background).
- `is_warm_chroma()` → true if red dominates green AND blue by
  >30. Warm chromas (orange / red / yellow) share the channel-
  dominance pattern with skin tones.

**Cool chroma** (pure neon green, magenta, cyan): aggressive
defaults are safe because the channel gap to character palettes
is huge. Skin tones are nowhere near pure green or magenta, so
the algorithm can throw the kitchen sink at the bg without
risking faces. Defaults:
- `flood_fuzz` auto-bump: 90
- `halo_fuzz` auto-bump: 130
- `chroma_key_global_erase` `min_excess`: 15

**Warm chroma** (orange, red, yellow): aggressive defaults eat
skin. Skin's red channel dominates green and blue by ~60, which
puts it inside the same dominance band as warm chromas. The
algorithm can't tell which pixels are bg-tinted halo and which
are someone's face. Defaults — these are the values locked in
after the npc15 sweep:
- `flood_fuzz` auto-bump: 60
- `halo_fuzz` auto-bump: **85**
- `--halo-passes` (CLI): **1**
- `chroma_key_global_erase` `min_excess`: **120**

## Failure modes + how to recognize them

| Symptom | Likely cause | Fix |
|---|---|---|
| Character is a thin silhouette; face/hands gone | Warm-chroma global erase with `min_excess` too low | Bump `--warm-min-excess` (≥120 is safe) |
| Visible orange ring around the silhouette | `halo_fuzz` too low for the bg's saturation | Increase via the warm-chroma cap or pass `--halo-fuzz N` directly with `--no-warm-bump` |
| Dark hair / dark clothing edges chewed | `halo_fuzz` ≥95 against orange — eating dark-skin-adjacent pixels | Cap halo at 85–90 |
| Tan / brown jackets get patches erased | `min_excess` <75 — overlapping warm-clothing dominance | Stay ≥100 |
| Whole character disappears | Connected-component blob filter is stripping a small character because the dilated mask broke it into multiple components | Bump `--dilate` (default 3 → 4 or 5) |
| Two adjacent characters get merged into one blob | `--dilate` too high — neighbor cells bridged | Lower `--dilate` |

## Recreating the comparison rig (ad-hoc)

The comparison rig (variants A–E side-by-side) was deleted after
locking in the final parameters. If you need to re-sweep — e.g.
for a sheet with a new background color — recreate it like this:

1. Create `tools/sprite-cleanup-compare.sh`:
   ```bash
   #!/usr/bin/env bash
   set -euo pipefail
   cd "$(dirname "$0")/.."
   SHEET=sprite-source/npcs/npcXX.png  # ← edit
   OUT=public/sprites/cleanup-compare
   for L in A B C D E; do rm -rf "$OUT/$L"; done

   run_v() {
     python3 tools/sprite-sheet-to-frames.py \
       --input "$SHEET" --rows 4 --frames 4 --prefix "v$1" \
       --size 64 --no-warm-bump --dilate 4 --out "$OUT/$1" "${@:2}"
   }
   run_v A --fuzz 60 --halo-fuzz 70 --halo-passes 1 --warm-min-excess 130
   run_v B --fuzz 60 --halo-fuzz 80 --halo-passes 1 --warm-min-excess 120
   run_v C --fuzz 60 --halo-fuzz 85 --halo-passes 1 --warm-min-excess 120
   run_v D --fuzz 60 --halo-fuzz 90 --halo-passes 2 --warm-min-excess 110
   run_v E --fuzz 60 --halo-fuzz 100 --halo-passes 2 --warm-min-excess 100
   ```
2. Create `sprite-cleanup-compare.html` with a 5-column grid that
   loads `/sprites/cleanup-compare/{A..E}/v{A..E}_<row>_<col>.png`.
   See the git history for the working version (commit deleted in
   the same chore that deleted the rig).
3. `bash tools/sprite-cleanup-compare.sh && npm run dev`, then
   visit `http://localhost:5173/sprite-cleanup-compare.html`.

## CLI flag cheat-sheet (sprite-sheet-to-frames.py)

| Flag | Default | When to use |
|---|---|---|
| `--input` PATH | required | source sheet |
| `--rows N` | 1 | grid mode if >1 |
| `--frames N` | 4 | columns per row |
| `--prefix STR` | required | output filename prefix |
| `--out DIR` | `public/sprites/player` | output dir |
| `--size N` | 64 | output px |
| `--fuzz N` | 35 | flood-fill match tolerance (auto-bumped on chroma) |
| `--halo-fuzz N` | 60 | edge-eroder tolerance (auto-bumped on chroma) |
| `--halo-passes N` | 3 | erosion depth in 1-pixel rings |
| `--dilate N` | 3 | blob-filter dilation radius (gap tolerance) |
| `--no-warm-bump` | off | bypass warm-chroma auto-bumps for parameter sweeps |
| `--no-global-erase` | off | skip the dominance-pattern erase entirely |
| `--warm-min-excess N` | 120 | global-erase threshold for warm chromas |

## Source-of-truth for the production knobs

If a future change needs different parameters across the board:

- Warm-chroma defaults live as constants inside
  `tools/sprite-sheet-to-frames.py`:
  - `remove_background()`: `if is_warm_chroma: fuzz = max(fuzz, 60)`
  - `erode_halo()`: `if is_warm_chroma: halo_fuzz = max(halo_fuzz, 85)`
  - `--warm-min-excess` argparse default: 120
- The `--halo-passes` value lives in `tools/process-npc-sheets.sh`
  (production: 1).

Bump in lockstep when adjusting; the sweep rig validates against
npc15 by default.
