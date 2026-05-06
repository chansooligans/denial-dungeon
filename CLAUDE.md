# The Waiting Room

## What This Is
A turn-based hospital RPG that teaches the US healthcare revenue cycle.
Built with Phaser 3 + TypeScript + Vite. Deployable on GitHub Pages.

## The Game
You're a revenue cycle analyst at Mercy General Hospital. A routine claim
vanishes. You discover "The Waiting Room" — a surreal bureaucratic
underworld beneath the hospital where every claim ever filed still
exists.

**Dual reality**: Hospital (Animal-Crossing cozy — dialogue, form
puzzles, codex; no combat). Waiting Room (Terry-Gilliam-meets-Spirited-
Away — battles against surreal procedural obstacles like Medical
Necessity Wraith, Timely Filing Reaper, Bundling Beast).

## Current State
Core engine + Level-1 vertical slice. Three Waiting Room obstacles
wired with realistic CMS-1500 forms (real ICD-10/CPT codes, real
payer denial language). Detailed history in `git log`.

### What's Done
- [x] Scenes: Boot, Intro (comic-page + click-to-advance), Title, Hospital, Dialogue, Form, Battle, WaitingRoom, Codex
- [x] Asymmetric Level-1 hospital with fog of war + mini-map
- [x] Game state with persistent stress + forward-compat save migration
- [x] Battle dispatch (`MechanicController`): simple, investigation, timed
- [x] `ClaimSheet` panel — realistic CMS-1500 with disputed boxes + payer note
- [x] Tool progression: 5 default + `unlocksOnDefeat` + dialogue grants
- [x] Stress with teeth: 50+ → −10% accuracy, 75+ disables `turnCost ≥ 2` tools
- [x] Structured map builder + per-level files
- [x] 12 tools, 12 encounters, 5 PatientCases, 7 NPCs, 22 codex entries

### What's NOT Done
- [ ] Levels 2–10 content (encounters, cases, dialogue, NPCs)
- [ ] Hospital intrusion glimpse + form-bridge mechanic
- [ ] Decouple hospital `triggerBattle` (battles only in Waiting Room)
- [ ] Multi-wing Waiting Room layout
- [ ] More mechanics: `block`, `mirror`, `multiHead`, `blind`
- [ ] Tools visibly modify ClaimSheet fields (Phase B)
- [ ] UB-04 layout in ClaimSheet
- [ ] Sound design + art polish

## Key Design Docs
- `reference/journal/2026-05-03-v3-the-waiting-room.md` — full game design
- `reference/journal/2026-05-04-build-plan.md` — step-by-step build plan
- `reference/journal/2026-05-04-waiting-room-combat-foundation.md` — combat refactor decisions
- `reference/aesthetic-inspirations.md` — mood board

## Architecture
```
src/
├── main.ts, types.ts, state.ts
├── battle/                        Battle controllers + UI helpers
│   ├── index.ts                   createMechanic(encounter) factory
│   ├── types.ts                   MechanicController interface
│   ├── ClaimSheet.ts              CMS-1500 panel renderer
│   ├── screens.ts                 Victory + defeat overlays
│   └── mechanics/                 simple.ts, investigation.ts, timed.ts
├── content/                       Game data
│   ├── abilities.ts, enemies.ts, npcs.ts, dialogue.ts
│   ├── cases.ts, codex.ts, levels.ts
│   ├── mapBuilder.ts              Structured map types + buildMapLayout()
│   ├── maps.ts                    Per-level aggregator
│   └── maps/levelN.ts             Per-level hospital layouts (1..5)
└── scenes/                        Boot, Intro, Title, Hospital, Dialogue,
                                   Battle, Form, WaitingRoom, Codex
public/intro/                      Hand-drawn comic pages
```

## Battle Architecture
`BattleScene` orchestrates; the encounter's `mechanic` field selects a
`MechanicController` (`simple`, `investigation`, `timed`, …) via
`createMechanic()`. Controller owns turn logic; scene owns rendering.
When an encounter has `caseId`, `ClaimSheet` renders the linked
`PatientCase.claim` data with `highlightedBoxes` + `payerNote` as
battle-time overlays. Tools come from `state.tools` (default 5;
`Encounter.unlocksOnDefeat` and `DialogueEffect.addTool` add more).
Victory + defeat screens live in `src/battle/screens.ts`.

## Map System
Maps are structured Room/Corridor data in `src/content/maps/levelN.ts`,
compiled to ASCII via `mapBuilder.buildMapLayout()`. Tile legend lives
in `mapBuilder.ts` + `HospitalScene.TILE_TEXTURES`. Player spawns in
the lobby (south), walks north to reach the gap (Waiting Room portal).

## Dev Commands
```bash
npm run dev              # Dev server on :5173
npm run build            # Production build
npx tsc --noEmit         # Type-check only
```

## Game Flow
Title → Hospital (walk, talk, take form puzzles, walk to the gap) →
Waiting Room (engage obstacle markers with E) → Battle → return to
Waiting Room or Hospital depending on entry point. Hospital dialogue
can also trigger battles (legacy path; will be decoupled).

## Content Pillars
The game teaches: CMS-1500 / UB-04 forms, ICD-10-CM/PCS, CPT, HCPCS,
revenue codes, modifiers (25/59/76), APR-DRG / EAPG grouping, patient
cost share waterfall, 835/ERA reading, CARC/RARC codes, X12
transactions (270/271, 278, 837, 835, 277CA).

## Design Principles
- No company branding
- Face people in the hospital, codes/forms in the Waiting Room
- Warm + surreal, not grimdark
- Progressive disclosure: simple → complex across 10 levels
- Decisions compound: shortcuts (shadow tools, losses) raise stress
  and audit risk for the rest of the run
- Codex should be useful as a standalone reference outside the game
- Battle pedagogy uses real codes — new encounters populate `caseId`
  + `highlightedBoxes` + `payerNote` so the form is the experience
