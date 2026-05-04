# 2026-05-04 — Build Plan

## Overview
Rebuild Denial Dungeon from current Hades-style action prototype into the
V3 "Waiting Room" design: dual-reality turn-based hospital RPG. Phaser 3,
TypeScript, Vite, deployable on GitHub Pages.

## Architecture

```
src/
├── main.ts                    # Phaser game config, scene registry
├── types.ts                   # All game types
├── content/
│   ├── enemies.ts             # CARC code encounters (reuse + expand)
│   ├── abilities.ts           # Player tools/actions for turn-based combat
│   ├── npcs.ts                # NPC definitions, dialogue trees
│   ├── cases.ts               # Patient case scenarios per level
│   ├── codex.ts               # All codex entries (codes, forms, concepts)
│   └── levels.ts              # Level definitions, enemy pools, events
├── scenes/
│   ├── BootScene.ts           # Generate sprites, load assets
│   ├── IntroScene.ts          # Cutscene: the $215 hook → The Waiting Room
│   ├── TitleScene.ts          # Main menu (NEW GAME / CODEX / SETTINGS)
│   ├── HospitalScene.ts      # Normal layer: top-down hospital overworld
│   ├── WaitingRoomScene.ts   # Surreal layer: The Waiting Room overworld
│   ├── DialogueScene.ts      # NPC conversation overlay
│   ├── BattleScene.ts        # Turn-based encounter screen
│   ├── FormScene.ts          # CMS-1500 / UB-04 puzzle screen
│   ├── CodexScene.ts         # Player's collected knowledge
│   ├── HUDScene.ts           # Persistent HUD overlay
│   └── SummaryScene.ts       # End-of-level / end-of-game results
├── systems/
│   ├── dialogue.ts            # Dialogue engine (text, choices, branching)
│   ├── battle.ts              # Turn-based combat state machine
│   ├── codex.ts               # Codex unlock/tracking logic
│   ├── save.ts                # localStorage save/load
│   └── progression.ts         # Level unlock, score tracking
└── ui/
    ├── TextBox.ts             # Reusable dialogue text box
    ├── Menu.ts                # Reusable menu component
    └── Bar.ts                 # HP/resource bar component
```

## Build Phases

### Phase 1: Core Engine (do first)
Strip the action-RPG code. Lay the foundation for turn-based gameplay.

- [ ] **1.1** Rewrite `types.ts` for turn-based RPG (remove action-RPG fields)
- [ ] **1.2** Rewrite `BootScene.ts` — generate sprites for:
  - Player character (analyst)
  - NPCs (11 characters, distinct looks)
  - Hospital tiles (floor, walls, doors, desks, medical equipment)
  - Waiting Room tiles (surreal versions — cracked floors, floating papers, infinite chairs)
  - UI elements (text boxes, menu frames, bars)
- [ ] **1.3** Build `IntroScene.ts` — the cutscene (this is the hook, build it well)
  - Black screen typewriter text ($215 vs $6)
  - Pixel art hospital pan
  - Your desk, the vanishing claim
  - The crack, the fall, floating documents
  - The Waiting Room reveal
  - Title stamp
- [ ] **1.4** Rewrite `TitleScene.ts` — NEW GAME / CODEX / SETTINGS
  - No class selection yet (save for later — start as generic analyst)

### Phase 2: Hospital Overworld
The normal layer. Walk around, enter rooms, talk to NPCs.

- [ ] **2.1** Build `HospitalScene.ts` — top-down tilemap
  - Hospital layout: lobby, registration, clinical wing, coding office,
    billing, clearinghouse room, payer relations, patient services,
    compliance, CFO office, break room
  - WASD/arrow movement, collision with walls/furniture
  - Door triggers to enter rooms
  - NPC sprites standing in their departments
- [ ] **2.2** Build `DialogueScene.ts` — conversation overlay
  - Text box at bottom of screen (RPG style)
  - Character portrait + name
  - Typewriter text with advance on click/space
  - Choice prompts (2-4 options)
  - Dialogue branching based on choices
- [ ] **2.3** Create `npcs.ts` — all 11 NPCs with:
  - Name, department, sprite key, portrait key
  - Dialogue trees per level (they say different things as story progresses)
  - Relationship level (affects dialogue options available)

### Phase 3: Turn-Based Battle System
The core gameplay when encountering denial scenarios.

- [ ] **3.1** Build `BattleScene.ts` — turn-based encounter
  - Player side: HP bar, available tools/actions, status effects
  - Enemy side: the "problem" (a denial scenario, not a CARC code directly)
    - Shows surface symptoms, player must diagnose
  - Turn flow: Player picks action → animation → effect → enemy turn → repeat
  - Effectiveness: right tool for right root cause = bonus damage
  - Win: resolve the scenario → codex entry + CARC code reveal + watchpoint
  - Lose: the denial sticks → consequences carry forward
- [ ] **3.2** Rewrite `abilities.ts` → player tools for turn-based
  - Remove projectile/speed fields
  - Add: accuracy, turn cost, description of what it does narratively
  - Each tool has a "teaches" string shown on use
- [ ] **3.3** Rewrite `enemies.ts` → encounter scenarios
  - Each is a SITUATION, not a monster
  - Surface presentation (what it looks like)
  - Root cause (what actually went wrong)
  - Correct tools to resolve it
  - CARC code revealed on resolution
  - Watchpoint text

### Phase 4: Form Puzzles
Interactive CMS-1500 and UB-04 screens.

- [ ] **4.1** Build `FormScene.ts` — claim form puzzle
  - Render a simplified but recognizable CMS-1500 or UB-04
  - Some fields pre-filled, some blank, some wrong
  - Player fills in or corrects fields
  - Validation: checks against the patient case
  - Wrong answers highlighted with explanation
  - Completed form = claim submitted (triggers battle or progression)
- [ ] **4.2** Create `cases.ts` — patient case scenarios
  - Each level has 2-3 cases
  - Case = patient demographics + diagnosis + procedure + insurance info
  - Maps to specific codes (ICD-10, CPT, revenue codes, modifiers)
  - Cases get more complex per level

### Phase 5: The Waiting Room
The surreal underworld layer.

- [ ] **5.1** Build `WaitingRoomScene.ts` — surreal overworld
  - Same top-down movement as hospital, but different tileset
  - Surreal environment per level:
    - L1: A reception desk with an infinite queue number
    - L2: Sorting room with bins labeled wrong
    - L3: Locked gate with timer
    - L4: Room of duplicating documents
    - L5: Self-rewriting library
    - L6: Conveyor belt toward shredder
    - L7: Courtroom with shifting rules
    - L8: River of floating numbers
    - L9: Maze with different-priced doors
    - L10: All areas connected
  - Transition effect between normal/Waiting Room (screen crack, color shift)
- [ ] **5.2** Visual effects for The Waiting Room
  - Muted/shifted color palette
  - Floating paper particle effects
  - Ambient sounds described in text (phone ringing, stamps, printer hum)
  - Slight screen distortion/wobble

### Phase 6: Codex & Progression
The knowledge collection system.

- [ ] **6.1** Build `CodexScene.ts` — player's reference book
  - Categories: Codes, Forms, Transactions, Concepts, Stats
  - Each entry: name, category, plain-English explanation, where encountered
  - Unlocked by encountering in gameplay
  - Searchable/filterable
- [ ] **6.2** Build `progression.ts` — level completion tracking
  - Each level: score (0-3 stars based on performance)
  - Codex completion percentage
  - Total score across all levels
  - Decisions tracked for Level 10 audit
- [ ] **6.3** Build `save.ts` — localStorage persistence
  - Save: current level, codex entries, decisions, scores
  - Load on startup
  - Reset option

### Phase 7: Content Population
Fill in all 10 levels with real content.

- [ ] **7.1** Level 1: Orientation (CMS-1500, CPT, ICD-10-CM basics)
- [ ] **7.2** Level 2: Registration (eligibility, 270/271, demographics)
- [ ] **7.3** Level 3: Prior Auth (278, medical necessity)
- [ ] **7.4** Level 4: Documentation (CDI, ICD-10-CM specificity)
- [ ] **7.5** Level 5: Coding (ICD-10-PCS, CPT, modifiers, DRG/EAPG)
- [ ] **7.6** Level 6: Submission (UB-04, 837, clearinghouse, 277CA)
- [ ] **7.7** Level 7: Adjudication (payer logic, medical policy, allowed amounts)
- [ ] **7.8** Level 8: Remittance (835, CARC/RARC, payment posting)
- [ ] **7.9** Level 9: Patient Billing (cost share, estimates, NSA, financial assistance)
- [ ] **7.10** Level 10: The Audit (end-to-end, all decisions reviewed)

### Phase 8: Polish & Ship
- [ ] **8.1** Sound design (text blips, menu sounds, Waiting Room ambient)
- [ ] **8.2** Screen transitions (fade, crack effect for Waiting Room entry)
- [ ] **8.3** Leaderboard (daily seed scores, localStorage + optional backend)
- [ ] **8.4** GitHub Pages deployment test
- [ ] **8.5** README with screenshots

## Build Order / Priority
1. Phase 1 (engine) — must be solid before anything else
2. Phase 3 (battle) — this is the core loop, test it early
3. Phase 2 (hospital overworld) — connects everything
4. Phase 4 (form puzzles) — unique differentiator
5. Phase 7.1 (Level 1 content) — first playable vertical slice
6. Phase 5 (Waiting Room) — the wow factor
7. Phase 6 (codex) — the educational payoff
8. Phase 7.2-7.10 (remaining levels)
9. Phase 8 (polish)

## Vertical Slice Target
Get Level 1 fully playable end-to-end ASAP:
Intro cutscene → Title → Hospital overworld (lobby + billing office) →
Talk to Biller Jordan → CMS-1500 form puzzle → Turn-based encounter
(first denial) → CARC code reveal → Codex entry unlocked → Level complete

This proves the whole loop works before building 9 more levels of content.

## Tech Notes
- Phaser 3 + Arcade physics (for overworld collision only)
- All sprites generated procedurally in BootScene (no external assets)
- Vite 7 bundler, TypeScript
- localStorage for saves (no backend required for MVP)
- GitHub Pages deploy via existing Actions workflow
