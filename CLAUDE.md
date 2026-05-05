# Denial Dungeon

A turn-based hospital RPG that teaches the US healthcare revenue cycle.
Phaser 3 + TypeScript + Vite. Deployable on GitHub Pages.

## Design

You're a revenue cycle analyst at Mercy General Hospital. A claim
vanishes; you discover **The Waiting Room** — a surreal bureaucratic
underworld where every claim ever filed still exists. Two layers:

- **Hospital** (Animal-Crossing-cozy): NPC dialogue, form puzzles, codex.
  No combat here.
- **Waiting Room** (Terry-Gilliam-meets-Spirited-Away): turn-based
  battles against surreal procedural obstacles (Medical Necessity
  Wraith, Timely Filing Reaper, Bundling Beast, …) that personify
  parts of the revenue cycle.

### Pillars
- Face people in the hospital, codes/forms in the Waiting Room.
- Battles render realistic CMS-1500/UB-04 forms with real ICD-10/CPT
  codes and real payer denial language. Pedagogy is the point.
- Decisions compound — `state.resources.stress` and `auditRisk`
  persist for the whole run. Shortcuts in early levels bite later.
- Codex is useful as a standalone reference outside the game.

## Architecture

```
src/
├── main.ts                Phaser config, scene registry
├── types.ts               All shared types
├── state.ts               Game state + save/load + migration
├── battle/
│   ├── index.ts           createMechanic(encounter) factory
│   ├── types.ts           MechanicController interface, action shapes
│   ├── ClaimSheet.ts      Realistic CMS-1500 panel renderer
│   └── mechanics/
│       ├── simple.ts      HP attrition + faction effectiveness
│       ├── investigation.ts  Case-file fact-finding (no HP)
│       └── timed.ts       HP + days-remaining countdown
├── content/
│   ├── abilities.ts       Player tools (TOOLS)
│   ├── enemies.ts         Encounters (ENCOUNTERS) — CARC + archetype
│   ├── cases.ts           PatientCases (form puzzle data + claim data)
│   ├── npcs.ts, dialogue.ts, codex.ts, levels.ts
│   ├── mapBuilder.ts      Structured map types + buildMapLayout()
│   ├── maps.ts            Aggregator re-exporting per-level maps
│   └── maps/level{1..5}.ts  Per-level hospital layouts
└── scenes/
    ├── BootScene, IntroScene, TitleScene
    ├── HospitalScene      Tile-map overworld + fog + mini-map
    ├── DialogueScene      Branching NPC dialogue
    ├── BattleScene        Combat orchestration; delegates to mechanic
    ├── FormScene          CMS-1500 / UB-04 puzzles
    ├── WaitingRoomScene   Multi-obstacle marker layer (engage with E)
    └── CodexScene         Knowledge collection
```

## Battle architecture

`BattleScene` is the orchestrator. The encounter's `mechanic` field
selects a `MechanicController` (`simple`, `investigation`, `timed`,
…) via `createMechanic()`. The controller owns turn logic; the scene
owns rendering. When an encounter has `caseId`, `ClaimSheet` renders
the linked `PatientCase.claim` data as the panel area, with
`highlightedBoxes` + `payerNote` as battle-time overlays.

Tools come from `state.tools` (default 5; expanded by
`Encounter.unlocksOnDefeat` and `DialogueEffect.addTool`). Stress
≥ 50 reduces accuracy; ≥ 75 disables `turnCost ≥ 2` tools.

## Dev

```bash
npm run dev          # vite dev server on :5173
npm run build        # production
npx tsc --noEmit     # type-check only
```

## Reference

- `reference/journal/2026-05-03-v3-the-waiting-room.md` — full game design
- `reference/journal/2026-05-04-waiting-room-combat-foundation.md` — combat refactor decisions
- `reference/aesthetic-inspirations.md` — mood board

## House rules

- No company branding.
- Battle pedagogy uses real codes (ICD-10, CPT, POS, modifiers). New
  encounters should populate `caseId` + `highlightedBoxes` + `payerNote`
  so the form is the experience.
- New `MechanicController` per archetype when needed; don't bolt
  variations onto `simple`.
