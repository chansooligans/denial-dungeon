# 2026-05-04 — Waiting Room combat foundation (Phase 0 + 1)

Setup work for the bigger feature: confining battle to the Waiting Room
layer, with surreal procedural obstacles instead of HP-bag people. This
journal entry covers only the foundation — no gameplay change yet.

## Decisions locked

1. **Tied vs free battles**: hybrid. Anchored ticket battles (NPC hands
   you a stuck claim → descend → form-bridge → battle) plus optional
   wandering encounters in each Waiting Room wing.
2. **Persistence**: stress and audit risk persist across the whole run.
   Decisions in Level 1 must be able to bite in Level 10.
3. **Tool sources**: NPCs (hospital), defeating obstacles (Waiting Room),
   and form-puzzle perfect runs all unlock tools.
4. **Form-bridge buff**: solving the matching CMS-1500 / UB-04 perfectly
   in the hospital starts the Waiting Room battle at full HP.
5. **Complexity ladder**: matches existing 10-level concept progression
   (front-end → coding → adjudication → patient → audit). Each level
   adds new wings, new obstacle archetypes, and new mechanical hooks.
6. **Battle mechanics**: Lane C — per-archetype mechanics dispatched
   from a shared engine. SimpleController = HP attrition (today's).
   Future controllers: Investigation (case file, no HP), Timed (turn
   budget), MultiHead, Mirror, Blind, Block, Spawn.

## Phase 0 — data model

Additive only; no current behavior changes.

- `Wing` union: eligibility / coding / billing / appeals /
  reconsideration / patient_services / miracles.
- `BattleMechanic` union: simple / block / mirror / turnLimit /
  multiHead / blind / spawn / none.
- `Encounter` extended: `carcCode` and `carcName` are now optional
  (so non-CARC obstacles like Eligibility Sphinx or Aging Wraith are
  expressible). New optional fields: `archetype`, `wing`, `mechanic`,
  `unlocksOnDefeat`, `codexOnSight`, `cashRecovered`.
- `Ticket` interface: anchored stuck-claim handed by an NPC.
- `GameState` extended: `resources.stress` (0-100, persistent),
  `activeTickets[]`, `defeatedObstacles[]`, `wingsUnlocked[]` (L1
  starts with `eligibility`), `obstaclesSeen[]`.
- Codex categories now include `'obstacles'` for the bestiary.
- `state.ts`: forward-compat `migrateState()` fills any new field on
  existing localStorage saves so we don't break players' progress.
- `BattleScene` victory screen: only renders the CARC reveal when an
  encounter has one; non-CARC obstacles show their archetype name.

## Phase 1 — mechanic dispatch

`BattleScene` previously inlined damage / accuracy / effectiveness math.
That logic now lives in a controller and is dispatched per encounter:

```
src/battle/
├── types.ts                   # MechanicController, PlayerTurnResult, EnemyTurnResult
├── index.ts                   # createMechanic(encounter) factory
└── mechanics/
    └── simple.ts              # SimpleController — current HP attrition fight
```

`createMechanic(encounter)` looks at `encounter.mechanic`. Today every
encounter falls through to `SimpleController`. Phase 2 will add
`InvestigationController` and `TimedController` and re-key two real
encounters to those mechanics so the dispatch is exercised end-to-end.

`BattleScene.useToolAction` and `enemyTurn` now call
`mechanic.applyPlayerTurn(toolId)` / `mechanic.applyEnemyTurn()` and
read HP via `mechanic.hpDisplay()`. A new optional `statusLine()` is
rendered above the enemy panel (used by Timed for "Days remaining" etc).

## Verified

- `npx tsc --noEmit` is clean.
- All 11 existing encounters still route through SimpleController and
  preserve damage / accuracy / super-effective behavior.
- BattleScene victory CARC reveal now degrades gracefully for
  archetype-only encounters.

## Phase 2 (next)

- Build `InvestigationController` (case-file fact-finding, time budget).
- Build `TimedController` (HP + countdown, attack escalation).
- Author one obstacle for each: Medical Necessity Wraith
  (investigation, points at existing CO-50) and Timely Filing Reaper
  (timed, new CARC CO-29 obstacle).
- Add UI panels for status (case file table, days-remaining clock).
- Wire stress increments on shortcuts so persistence has teeth.

## Phase 3+ (later)

- Decouple battle from hospital dialogue; Waiting Room becomes the
  only place fights happen.
- Waiting Room geography: turn the single dim room into 5–6 wings
  using the new structured `mapBuilder`.
- Anchored ticket flow: NPC hands ticket → form puzzle → battle →
  return dialogue. Form-bridge buff = full HP.
- Hospital intrusion moment: a paper scuttles across the lobby in
  Level 1 as a one-time atmosphere beat.
