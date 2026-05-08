# Art-direction roadmap

⚠ PROVISIONAL — direction is locked, schedule and per-character
specifics are still in flux.

Concrete plan to upgrade the visual layer of the game beyond the
procedural pixel art currently generated in `BootScene`. Sister
document to `aesthetic-inspirations.md`, which captures *what we
want it to feel like*; this one captures *what we will build and
in what order*.

## Locked decisions

- **Player sprite resolution: 64×64.** Bigger than the current
  32×32 procedural draw, small enough to keep the pixel-art
  register and stay performant on mobile.
- **Style: pixel art, but high-density.** Hand-feel pixels, dark
  outlines, warm earth-tone palette consistent with the comic
  intro pages (`public/intro/cover.png`, `page5.png`..`page8.jpg`).
  Not painterly raster — that lives in the cinematic, not the
  gameplay layer.
- **Pipeline: Stable Diffusion / Flux LoRA trained on the existing
  comic pages, with hand-cleanup in Aseprite.** Validated by the
  first-pass Chloe sprites (back / front-walk / side / front-idle)
  generated against the intro art. See "LoRA workflow" below.
- **`pixelArt: true` stays on, canvas stays at 960×640.** No
  resolution bump or DPR rendering for now — the win on a
  pixel-art game is small and not worth the cascading
  position-math changes (see `density-demo.html` panel B).
- **Procedural BootScene sprites stay as the fallback.** New
  PNG assets layer on top of the existing texture-key system;
  if a PNG fails to load, the procedural draw is still there.
  This keeps every change reversible and lets us ship character
  by character.

## Why now

The procedural sprites were a placeholder from the prototype
phase — readable silhouettes, no character. Now that:

1. The intro cinematic with hand-drawn comic art is shipped and
   establishes a strong visual register, and
2. The first-pass Chloe LoRA outputs prove the style transfers
   to character sprites cleanly,

…there's a coherent target to upgrade against. Every NPC, tile,
and prop currently looks like a different game than the intro
narrates.

## Phased rollout

Each phase is independently shippable. Don't move to the next
until the current one is in the build and looks right at
gameplay scale.

### Phase 1 — Player (Chloe)
**Status: in flight.** First-pass LoRA poses generated. Remaining:

- [ ] Confirm pixel grid (resize to actual 64×64 in Aseprite,
      verify no anti-aliasing leaks)
- [ ] Strip cream background → transparent PNG (rembg or manual)
- [ ] Walk-cycle frames: 2–4 per direction (down / up / side).
      Img2img the existing pose with "left foot forward" / "right
      foot forward" prompts.
- [ ] Drop into `public/sprites/player/` and wire into
      `BootScene.makePlayerDirection` as a load.image override
      with the procedural draw as fallback
- [ ] Verify on mobile (the `density-demo.html` panel A shows the
      32×32 vs 64×64 contrast; gameplay test will confirm)

### Phase 2 — Major NPCs (story-critical)
The characters who drive the curriculum. Same LoRA, character
prompt swap. Each needs front-idle minimum; walk frames optional
for ones that move.

| Key | Character | Role | Notes |
|---|---|---|---|
| `npc_dana` | Dana | mentor (revenue cycle) | Required L1+; appears across all hospital floors |
| `npc_martinez` | Dr. Martinez | physician | Coat + stethoscope; appears L1, L3 |
| `npc_kim` | Kim | registration | Required L2 |
| `npc_jordan` | Jordan | PFS | Required L3 |
| `npc_pat` | Pat | coding | Required L4 |
| `npc_alex` | Alex | IT/EDI | Required L5 |
| `npc_sam` | Sam | denials | Required L6 |
| `npc_anjali` | Anjali Patel | patient | Visitor — softer palette than staff |

### Phase 3 — Auditors + special NPCs
The L10 audit cast (Carl Westbrook, Wendy Chen, Mira Rivera,
Eddi). These have distinct role-coded outfits — see
`reference/narrative/characters/` for canonical descriptions.
Color cues are already in `DialogueScene.SPEAKER_COLORS`.

| Key | Character | Notes |
|---|---|---|
| `npc_carl` | Carl Westbrook | Senior partner — grey suit, authoritative |
| `npc_chen` | Wendy Chen | Data analytics — cool blue palette |
| `npc_rivera` | Mira Rivera | Compliance — red/maroon palette |
| `npc_eddi` | Eddi | Observer — soft neutral, fades back |

### Phase 4 — Hospital tiles + props
The procedural 16×16 hospital tiles in `BootScene.makeHospitalTiles`.
Bump to 32×32 (1 tile = 32 game pixels) so they read as a
matched set with the 64×64 player sprite. Prioritize what's
visible most:

| Key | Object | Phase 4 priority |
|---|---|---|
| `h_floor`, `h_floor2`, `h_carpet`, `h_wall` | Floor + wall tiles | **first** — most screen real estate |
| `h_door` | Doors | first |
| `h_desk`, `h_chair`, `h_counter`, `h_cabinet` | Furniture | second |
| `h_plant`, `h_water`, `h_vending`, `h_whiteboard`, `h_bulletin` | Background props | second |
| `h_equipment`, `h_bed`, `h_fax` | Specialty props (only some scenes) | third |

### Phase 5 — Waiting Room tiles
The `wr_*` set in `BootScene.makeWaitingRoomTiles`. Smaller
inventory, more atmosphere. The Waiting Room's surreal register
(see `aesthetic-inspirations.md`) means tiles can break the
hospital's grid logic — uneven cracks, off-color seams,
subliminally wrong scale.

| Key | Object |
|---|---|
| `wr_floor`, `wr_wall` | Tiles |
| `wr_chair` | Endless chairs |
| `wr_counter` | Ticket counter |
| `wr_paper` | Floating paper particle |

### Phase 6 — Document sprites + UI
The `doc_cms1500`, `doc_ub04`, `doc_835`, `doc_eob` icons. Currently
12×16 with colored headers. These appear at small icon size in
inventory; redrawing at 32×32 with form-specific layout cues
(visible field grid, distinct stamp area) makes them readable
even when they're 16px on screen.

`stamp_denied` and other UI elements (`ui_textbox`, `ui_heart`,
`ui_cash`, `ui_action_btn`) probably stay procedural — they're
UI chrome, not world objects, and the pixel-art style doesn't
add value here.

### Phase 7 — Encounter portraits
The `enc_payer`, `enc_provider`, `enc_vendor`, `enc_patient`,
`enc_system` sprites used in battle. Currently 48×48 procedural
icons. Battle is a candidate for character-portrait-style art
(closer to the comic register) since combat is its own visual
mode anyway. Hold this one — the battle redesign in
`reference/puzzles/puzzles-draft.md` may obsolete the current
faction-portrait scheme entirely.

## LoRA workflow

For anyone (including future-Claude) picking this up cold:

1. **Source dataset.** The 5 intro pages: `cover.png`, `page5.png`,
   `page6.png`, `page7.jpg`, `page8.jpg`. Caption each as
   `mercygen, [scene description]` — describe content, not style.
2. **Train.** Replicate `ostris/flux-dev-lora-trainer` is the
   easiest path (~$2-5, 20 min). Civitai's free trainer is the
   next step up. Local kohya_ss only if iteration is heavy.
   Trigger word: `mercygen`.
3. **Generate at high res.** Render at 1024×1024 with prompts
   like:
   ```
   mercygen, young woman in brown cardigan and dark pants,
   sprite art, top-down rpg style, full body, simple cream
   background, [direction: front idle / walking / side profile]
   ```
4. **Downscale to game size.** Aseprite → Sprite → Resize →
   nearest-neighbor → target dim (64×64 player, 32×32 tiles).
   Hand-clean any anti-aliasing leakage. Don't trust Photoshop's
   default "bicubic" — it'll soften edges.
5. **Strip background.** `rembg` CLI or manual magic-wand.
   Save as PNG with alpha.
6. **Drop into `public/sprites/<category>/<key>.png`.** The
   loader picks it up if present, falls back to procedural
   if absent.

For **walk frames**: img2img the canonical pose with
`"<original prompt>, walking, left foot forward"` at low
denoise (0.4–0.5) so the character stays consistent.

## File layout (proposed)

```
public/sprites/
├── player/
│   ├── down_idle.png
│   ├── down_walk_1.png ← walk frame 1
│   ├── down_walk_2.png
│   ├── up_idle.png
│   └── side_idle.png   ← flipped horizontally for left/right
├── npcs/
│   ├── dana.png
│   ├── kim.png
│   └── …               ← one PNG per npc_* key
├── hospital/
│   ├── floor.png
│   ├── wall.png
│   └── …
└── waiting-room/
    ├── floor.png
    └── …
```

Loader change in `BootScene.preload`: for each procedural texture
key, attempt to load the matching PNG first; if the file doesn't
exist, fall back to the procedural draw. Keeps the migration
incremental.

## Open questions

- **Mobile asset budget.** The intro pages alone are ~12MB; a
  full sprite-sheet upgrade adds more. Need to confirm load
  times stay reasonable on a 3G connection.
- **Animation frame count.** 2-frame walk is the minimum that
  reads. 4-frame is smoother but doubles the asset count. Start
  with 2.
- **Battle portraits.** Hold until the puzzle reframe lands —
  may not need them.
- **Whether to redraw the comic intro pages at higher density.**
  They already look great. Probably leave alone unless the
  upscale is essentially free.

## References

- `aesthetic-inspirations.md` — visual + audio mood board (sister
  doc; this file is downstream of it)
- `narrative/characters/dana.md` — character canonical descriptions
- `public/density-demo.html` — runtime side-by-side comparison
  of 32 / 64 / 128 / 256 px sprite densities and 960×640 vs
  1920×1280 canvas scales (the basis for the "stay at 960" and
  "go to 64" decisions above)
- `public/intro/cover.png`, `page5.png`..`page8.jpg` — the
  hand-drawn comic style the LoRA trains against
- First-pass LoRA Chloe sprites (sent over chat 2026-05-08;
  not yet integrated) — the proof that the pipeline works
