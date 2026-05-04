# Denial Dungeon

## What This Is
A turn-based hospital RPG that teaches the US healthcare revenue cycle.
Built with Phaser 3 + TypeScript + Vite. Deployable on GitHub Pages.

## The Game
You're a revenue cycle analyst at Mercy General Hospital. A routine claim
vanishes from the system. You discover "The Waiting Room" — a surreal
bureaucratic underworld beneath the hospital where every claim ever filed
still exists, waiting. You chase your missing claim through 10 levels,
learning how billing actually works.

**Dual reality**: Normal hospital (Animal Crossing cozy) + The Waiting Room
(surreal, Terry Gilliam meets Spirited Away). Turn-based encounters with
real people (not monsters), form puzzles (CMS-1500, UB-04), and a growing
codex of billing knowledge.

## Current State
**Phase 1 of 8 in progress** — Core engine rebuild from action-RPG to
turn-based RPG. See `reference/journal/2026-05-04-build-plan.md` for the
full build plan with checkboxes.

### What's Done
- [x] Project scaffold (Phaser 3, Vite, TypeScript)
- [x] Game design finalized (V3: "The Waiting Room")
- [x] types.ts rewritten for turn-based RPG
- [x] BootScene rewritten (procedural sprites for NPCs, hospital, Waiting Room)
- [ ] IntroScene (cutscene — the $215 hook)
- [ ] TitleScene rewrite
- [ ] Hospital overworld
- [ ] Dialogue system
- [ ] Turn-based battle system
- [ ] Form puzzle system (CMS-1500, UB-04)
- [ ] Codex system
- [ ] Level 1 content
- [ ] Levels 2-10

### What's NOT done yet
The current code in `src/scenes/GameScene.ts`, `HUDScene.ts`, `BoonScene.ts`,
and `SummaryScene.ts` is from the OLD action-RPG prototype (Hades-style).
It still runs but will be replaced. Don't build on it.

## Key Design Docs
- `reference/journal/2026-05-03-v3-the-waiting-room.md` — Full game design
- `reference/journal/2026-05-04-build-plan.md` — Step-by-step build plan
- `reference/journal/README.md` — Index of all design entries

## Architecture
```
src/
├── main.ts              # Phaser config
├── types.ts             # All game types
├── content/             # Game data (enemies, abilities, NPCs, cases, codex)
├── scenes/              # Phaser scenes
├── systems/             # Game logic (dialogue, battle, codex, save)
└── ui/                  # Reusable UI components
```

## Dev Commands
```bash
npm run dev              # Start dev server (port 5173)
npm run build            # Production build
npx tsc -b               # Type-check only
```

## Content Pillars
The game teaches: CMS-1500 / UB-04 claim forms, ICD-10-CM/PCS codes,
CPT codes, HCPCS, revenue codes, modifiers (25/59/76), APR-DRG / EAPG
grouping, patient cost share waterfall, 835/ERA remittance reading,
CARC/RARC codes, X12 transactions (270/271, 278, 837, 835, 277CA).

## Design Principles
- No company branding
- Human-centered: face people, not codes. Codes are the consequence.
- Warm + surreal, not grimdark
- Progressive disclosure: simple → complex across 10 levels
- Decisions compound: shortcuts early have consequences in Level 10
- Codex should be useful as a standalone reference outside the game
