# The Waiting Room

A turn-based RPG that teaches the US healthcare revenue cycle. Walk through a hospital, talk to billing staff, fight claim denials, and discover the surreal "Waiting Room" beneath the building where lost claims go.

**[Play it](https://chansooligans.github.io/the-waiting-room/)** (GitHub Pages) &middot; **[Case Prototypes](https://chansooligans.github.io/the-waiting-room/prototypes.html)** (one playable sketch per Case)

> **Glossary:** a **Case** is the player-side problem they solve in a single encounter — what older notes called a "problem." A **Case Prototype** is one self-contained HTML page exercising that Case end-to-end. The catalog above is the index of all of them.

## What You'll Learn

The game progressively teaches across 10 levels:

- Claim forms (CMS-1500, UB-04)
- Medical coding (ICD-10, CPT, HCPCS, modifiers)
- X12 transactions (270/271 eligibility, 837 claims, 835 remittance)
- CARC/RARC denial codes and how to resolve them
- Prior authorization, coordination of benefits, patient cost share
- CDI, audit compliance, payer policy navigation

## How to Play

**Desktop**
- **Arrow keys / WASD** — Move
- **E / Space** — Talk to NPCs, interact with objects, advance dialogue
- **1-9** — Select tools / actions during battle
- **ESC** — Skip intro cutscene; flee battle

**Mobile / touch**
- On-screen virtual D-pad (bottom-left) for movement
- **E** button (bottom-right) to interact
- **ESC** button (top-right) to skip intro / flee battle
- Battle tools, dialogue choices, and obstacle markers all respond to taps

Walk through the hospital lobby, talk to NPCs in offices, and (when an NPC hands you a Case) descend into The Waiting Room. Engage the pulsing purple obstacle markers to fight claim denials in turn-based combat. The mechanic varies per Case archetype: some are HP fights, some are case-file investigations against a real CMS-1500, some are races against a timely-filing clock — see the [Case Prototypes catalog](https://chansooligans.github.io/the-waiting-room/prototypes.html) for one playable sketch of each.

## Tech Stack

- **Phaser 3** — Game engine
- **TypeScript** — Type safety
- **Vite** — Dev server and bundler

Art is a mix:
- **Hospital + Waiting Room object sprites** (desks, chairs, plants, counters, beds, etc.) are drawn procedurally at runtime via Phaser's `Graphics` API in `BootScene.makeHospitalTiles` / `makeWaitingRoomTiles`. No image files; per-room tints reskin the same source textures.
- **Chloe (player) + NPCs** are PNG sprites under `public/sprites/` generated from a LoRA-trained Stable Diffusion pipeline (chroma-key cleanup → trim → 64×64 squares). See `reference/sprite-cleanup.md` for the cleanup procedure + parameter cheat-sheet.
- **Comic-page intro pages** are full-bleed PNGs under `public/intro/`.
- **Voiceover** is one MP3 per text beat under `public/audio/intro/`, plus ambient music tracks for the Hospital + Waiting Room layers.

### Generating new NPC contact sheets (ChatGPT prompt)

When adding new NPCs, sheets generated with this prompt drop straight into the cleanup pipeline (`tools/process-npc-sheets.sh`) without parameter tuning. Save the result as `sprite-source/npcs/npcN.png` and run the script.

```
A pixel-art character contact sheet for a 2D top-down RPG.

Layout:
- 4 rows × 4 columns. Each row is one character; each column is the
  same character in a different directional pose, in this exact
  order:
    Col 0 — three-quarter FRONT (character facing the camera; you
            see their face)
    Col 1 — character facing the camera's LEFT (character's body and
            face are turned toward the LEFT side of the canvas; you
            see their RIGHT shoulder closest to camera)
    Col 2 — character facing the camera's RIGHT (mirror image of
            col 1; you see their LEFT shoulder closest to camera)
    Col 3 — back (character facing AWAY from camera; you see the
            back of their head and body)
- DO NOT confuse "facing left" with "left side profile." We want
  the character TURNED TOWARD the screen-left edge in col 1.
- All cells must be the same height. Don't resize between poses.
- Characters are full-body, standing, idle, arms relaxed.

Style:
- Crisp pixel art, ~64-pixel-tall characters at 1× scale (the sheet
  itself is much larger — render at high res; the cleanup script
  downsamples).
- Dark outlines around silhouettes. Hand-feel pixels — not blurred
  or anti-aliased into mush.
- Warm earth-tone palette consistent with hospital interiors:
  cream / tan / walnut / brick / mustard / avocado / sepia. Avoid
  oversaturated primaries.

Background — CRITICAL:
- Solid uniform black (#000000) across the ENTIRE sheet, behind
  every cell. No gradient, no color blocks, no stage lighting.
- Black is the chroma key the cleanup script removes. Orange / red /
  yellow backgrounds also work but require a tighter cleanup
  parameter pass — black is preferred.
- Do NOT add character shadows that bleed into the bg.
- Do NOT add cell borders, grid lines, or labels on the sheet.

Characters (4 of them — describe each one row by row):
- Row 0: [character description, e.g. "Brunette woman, 30s,
  navy scrubs with ID badge, hair in a bun"]
- Row 1: [...]
- Row 2: [...]
- Row 3: [...]

Tone: realistic-but-warm, hospital ambient. No fantasy elements,
no exaggerated poses, no weapons. People you'd see at Mercy
General Hospital on a regular Friday afternoon.
```

Drop the resulting PNG into `sprite-source/npcs/` named `npc{N}.png` (next number after the existing sheets), then run `bash tools/process-npc-sheets.sh`. The cleanup will produce the per-cell PNGs and `BootScene.preload` picks them up via `NPC_SOURCES` (`src/scenes/npcSources.ts`) once you map an id to the new slot.

## Development

```bash
npm install
npm run dev          # Dev server on localhost:5173
npm run build        # Production build to dist/
npx tsc --noEmit     # Type-check
```

## Dev Tools

**Single index page: [`/dev.html`](https://chansooligans.github.io/the-waiting-room/dev.html)** — one card per tool, with descriptions. Bookmark it.

Everything ships alongside the game on the same Vite + GitHub Pages deploy:

- **`/map-editor.html`** — Visual editor for `level1.ts`'s placed objects + NPCs. Drag to move, F flips an object, R cycles an NPC's facing. Outputs paste-back `tileMeta` + `tileOverrides` + `npcPlacements`.
- **`/intro-editor.html`** — Beat-by-beat intro cinematic editor. Voiceover scrubber per text beat, drag-and-drop cover art, "open game at this beat" deep-link, paste-back TS export.
- **`/sprites.html`** — Sprite library + mapping UI. NPC tab grouped by character type (Doctors, Nurses & Techs, etc.) with active-in-game badges and per-cell remap dropdowns.
- **`/prototypes.html`** — **Case Prototypes** catalog. One playable HTML per Case (Wraith, Bundle, Reaper, …). The URL stays `prototypes.html` for link stability; the visible name is "Case Prototypes."
- **In-game dev panel** — backtick (`~`) in any scene. Save presets per level, jump-to-room teleports, chart-pull toggles, copy/paste/clear save. Auto-on in `npm run dev`; append `?dev=1` on the deployed site if you need it.

URL deep-link: `/?introBeat=N` jumps the cinematic to beat `N` (used by the intro editor's "open at this beat" button).

## Project Structure

```
src/
├── main.ts                 # Phaser config, scene registry
├── types.ts                # Game types
├── state.ts                # Save/load via localStorage
├── battle/                 # Battle engine (mechanic dispatch, ClaimSheet, screens, toolMenu)
├── content/                # Game data (maps, NPCs, dialogue, encounters, codex)
├── scenes/                 # Phaser scenes (Boot, Intro, Title, Hospital,
│                           #   Dialogue, Battle, Form, WaitingRoom, Codex,
│                           #   TouchOverlay) + introBeats data + objectSources
├── map-editor/             # Map-editor page entry + data
└── intro-editor/           # Intro-editor page entry

public/
├── sprites/                # Player + NPC art (PNG, LoRA-generated)
├── intro/                  # Cinematic comic pages (PNG/JPG)
├── audio/                  # Per-line voiceover MP3s + ambient tracks
└── *.html                  # Dev-tool entry points
```

## Deploy

`.github/workflows/deploy.yml` builds and publishes `dist/` to GitHub Pages on every push to `main`. Requires the repo's Pages source to be set to **GitHub Actions** in repo Settings → Pages.

## License

Open source educational game.
