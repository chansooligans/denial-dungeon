# 2026-05-08 — Art-pipeline shipped: phase 1 & 2 of art-direction-roadmap

Closing thread on the LoRA-based sprite upgrade. Today's session
took the player + NPC layer from procedural placeholders to
LoRA-generated 64×64 art, end-to-end: source generation → tooling
→ scene integration → contact-sheet picker → mapping JSON → wired
in. Capturing where things stand and where to go next.

## Where things stand after the merges

| Phase | Status |
|---|---|
| 1. Player (Chloe) | ✅ shipped — chroma-key cleaned 64×64 walk frames, 4 directions, animations register'd, tile-bottom anchor, idle textures (#145 in flight) |
| 2. NPCs (12 canonical + 8 customs as textures) | ✅ shipped — all 20 mapped via `/sprites.html` picker, integrated with procedural fallback |
| 3. Auditors (Carl / Wendy Chen / Mira Rivera / Eddi) | ✅ folded into phase 2 (canonical mapping covered them) |
| 4. Hospital tiles + props | ⏳ next bottleneck if we keep going |
| 5. Waiting Room tiles | ⏳ |
| 6. Documents + UI | ⏳ |
| 7. Encounter portraits | ⏳ — held pending puzzle reframe |

PRs landed today (in merge order):
`#138` chloe walk frames · `#140` chloe 64×64 + flood-fill bg ·
`#139` player Sprite + animations · `#141` 80 NPC frames + contact
picker · `#142` NPC sprites wired into HospitalScene · `#143`
chroma-key support + chloe re-process · `#144` rename
`npcs-preview` → `sprites.html` + Chloe section. `#145` (idle
poses + right_walk_1 mirror) still open.

What the upgrade actually buys:
- Walking Chloe (4-direction × 4-frame cycle, idle on stop)
- 12 named LoRA NPCs at canonical positions in the hospital
- 8 customs (`liana`, `dr_priya`, `dev`, `walter`, `dr_ethan`,
  `officer_reyes`, `joe`, `noah`) registered as textures, ready
  for content-design placement
- Tooling that handles cream / chroma-key / RGBA inputs cleanly
  (`tools/sprite-sheet-to-frames.py`)
- A live asset gallery at `/sprites.html` for picking + reviewing

Procedural draws in `BootScene` stay as fallback per character key,
so any missing PNG falls back gracefully.

## Options by impact

**A. Place the 8 custom NPCs in the world.** Liana, Dr. Priya, Dev,
Walter, Dr. Ethan, Officer Reyes, Joe, Noah are all texture-loaded
but unused. Adding them to `src/content/npcs.ts` +
`HOSPITAL_MAP.npcPlacements` is a ~30-minute content edit and
makes the hospital feel populated rather than empty between
canonical NPCs. Highest payoff for least effort.

**B. Use the magenta 4×3 grid for Chloe expressions.** The extra
poses (talking gesture / surprised / sitting at desk / holding
paper) plug directly into `DialogueScene` (different sprite when
speaking vs idle) and `IntroScene` (the desk shot is *literally*
the cinematic's last image). Adds personality without a new LoRA
pass. Sister doc: `reference/art-direction-roadmap.md`.

**C. Hospital tiles (phase 4).** Biggest remaining art lift.
Floors / walls cover the most screen real estate and still look
like a different game from the characters. Same LoRA pipeline as
before, but ~15 tile keys to generate and the existing 16×16 →
32×32 jump means re-tuning some scene math
(`src/scenes/HospitalScene.ts`'s `TILE_TEXTURES` / tints).

**D. Pivot back to gameplay.** The puzzle reframe drafts in
`reference/puzzles/puzzles-draft.md` and the runtime battle
engine swap have been deferred this whole arc. Art is in a good
resting state; gameplay is where "is this fun" actually lives.
If you want to play-test the upgrade and decide on systemic
changes, this is the moment.

**E. Animation polish.** Walk cycles are wired but there's no
idle bob, no run animation, no transition smoothing. Half-day of
work, perceptual win.

## Recommendation

**A first** — quickest visible payoff, closes the loop on the
customs we already paid the LoRA cost to generate. Then **D**
(rotate back to gameplay). **C** is a bigger commitment — wait
until we've tested the current upgrade in play to see if tiles
actually feel like the next bottleneck.

Pause art after A unless something specific is missing. The
gameplay layer (puzzle reframe, runtime engine) has been queued
for too long and the art arc has a natural stopping point here.
