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
**Phases 1-4 + 7.1 complete** — Core engine, battle system, hospital
overworld, dialogue, form puzzles, game state, and Level 1 vertical slice.

### What's Done
- [x] Project scaffold (Phaser 3, Vite, TypeScript)
- [x] Game design finalized (V3: "The Waiting Room")
- [x] types.ts for turn-based RPG
- [x] BootScene (procedural sprites for NPCs, hospital, Waiting Room, UI, documents)
- [x] IntroScene (cutscene — the $215 hook, 8 beats)
- [x] TitleScene (menu with floating papers)
- [x] BattleScene (turn-based combat, effectiveness system, CARC reveal on victory)
- [x] HospitalScene (tile-based overworld, NPC placement, camera follow, HUD)
- [x] DialogueScene (branching dialogue, effects, triggers battle/form)
- [x] FormScene (CMS-1500 / UB-04 puzzles — find and correct errors)
- [x] Game state manager (save/load via localStorage)
- [x] 10 level definitions with titles, concepts, NPCs
- [x] 7 NPCs with dialogue trees
- [x] 11 encounters with real CARC codes
- [x] 12 player tools with faction effectiveness
- [x] 2 patient cases with real billing errors

### What's NOT Done
- [ ] The Waiting Room overworld (surreal layer per level)
- [ ] Codex system (CodexScene + codex entries content)
- [ ] Levels 2-10 content (encounters, cases, dialogues per level)
- [ ] Level progression (complete level → advance)
- [ ] Sound design
- [ ] Polish (transitions, particles, screen shake refinement)

## Key Design Docs
- `reference/journal/2026-05-03-v3-the-waiting-room.md` — Full game design
- `reference/journal/2026-05-04-build-plan.md` — Step-by-step build plan
- `reference/aesthetic-inspirations.md` — Mood board (Brazil, Spirited Away, Twin Peaks)

## Architecture
```
src/
├── main.ts              # Phaser config, scene registry
├── types.ts             # All game types
├── state.ts             # Game state manager (save/load)
├── content/
│   ├── abilities.ts     # 12 player tools (TOOLS)
│   ├── enemies.ts       # 11 encounters (ENCOUNTERS)
│   ├── npcs.ts          # 7 NPCs
│   ├── dialogue.ts      # Branching dialogue trees
│   ├── cases.ts         # Patient cases for form puzzles
│   └── levels.ts        # 10 level definitions
├── scenes/
│   ├── BootScene.ts     # Procedural sprite generation
│   ├── IntroScene.ts    # Opening cutscene
│   ├── TitleScene.ts    # Main menu
│   ├── HospitalScene.ts # Top-down overworld
│   ├── DialogueScene.ts # NPC dialogue overlay
│   ├── BattleScene.ts   # Turn-based combat
│   └── FormScene.ts     # Claim form puzzles
```

## Dev Commands
```bash
npm run dev              # Start dev server (port 5173)
npm run build            # Production build
npx tsc --noEmit         # Type-check only
```

## Game Flow
Title → Hospital (walk around, talk to NPCs) → Dialogue (branching choices)
→ Battle (turn-based, use tools, effectiveness matters) → Victory (CARC reveal)
→ back to Hospital. Form puzzles triggered via dialogue choices.

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
