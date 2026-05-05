# 2026-05-05 — Battle mechanics catalog + form-bridge

Snapshot of where the Waiting Room combat system landed since the
foundation in `2026-05-04-waiting-room-combat-foundation.md`.

## Mechanics shipped

| Mechanic | Controller | Encounter (CARC) | Defining trick |
|---|---|---|---|
| `simple` | `SimpleController` | many (CO-22, CO-109, CO-97 originally, …) | HP attrition + faction effectiveness |
| `investigation` | `InvestigationController` | CO-50 Medical Necessity Wraith | Case-file fact-finding; turn budget instead of HP; Decide commits |
| `timed` | `TimedController` | CO-29 Timely Filing Reaper | HP + Days Remaining; enemy damage escalates as days lapse; out-of-time = auto-loss |
| `block` | `BlockController` | CO-197 Prior Auth Gatekeeper | Every odd turn the gate is shut (0 damage); `prior_auth_278` opens it permanently |
| `mirror` | `MirrorController` | CO-18 Duplicate Claim Doppelgänger | Same tool used twice in a row → 0 damage, +heal to enemy, kickback to player |

`multiHead`, `blind`, `spawn` are still ahead.

## ClaimSheet — pedagogy as the centerpiece

Each archetype encounter now ships a real CMS-1500 (via `caseId →
PatientCase.claim`) with disputed boxes highlighted and the payer's
denial language quoted beneath. Players read actual ICD-10/CPT codes,
real place-of-service numbers, real dollar amounts.

**Tool effects** (`Encounter.toolEffects[toolId | actionId]`)
visibly mutate the form when the matching action lands — CDI Query
stamps "+25 mod" into box 24D-1 on the Bundle, prior_auth_278
stamps "278 on file — gate down" on the Gatekeeper, etc.

**Investigation reveals** carry inline annotations: `CaseFact.onReveal`
carries a `ToolEffect`, returned via `result.formEffects` from the
mechanic. By the time the player presses DECIDE on the Wraith, the
ClaimSheet shows the chart-and-LCD evidence in the right boxes.

## Form-bridge

`state.formsPerfected: string[]` (with save migration) tracks every
PatientCase id solved with all errors caught in FormScene. When a
battle starts and the encounter's `caseId` is in that list, starting
playerHp is set to playerMaxHp regardless of the analyst's current
resources. A "Form prepped — full HP" banner fades in.

All four archetype cases now ship realistic `errors[]` puzzles, so
the hospital→Waiting-Room loop closes for the entire bestiary:

| Case | Pre-fix | Buff applies to |
|---|---|---|
| `case_bundle_kim` | Add modifier 25 | Bundling Beast |
| `case_wraith_walker` | I50.9 → I50.42 (more specific dx) | Med-Nec Wraith |
| `case_reaper_park` | Subscriber ID transposed | Timely Filing Reaper |
| `case_gatekeeper_okafor` | Box 23 prior-auth number missing | Prior Auth Gatekeeper |
| `case_doppel_reyes` | Subscriber ID transposed (resubmit avoids dup) | Duplicate Doppelgänger |

## Hospital decoupled

All twelve `triggerBattle` effects were removed from dialogue. Hospital
NPCs now end with closing lines ("I'll go check the system"). Battles
only happen via Waiting Room obstacle markers (or via dialogue
`triggerForm` → form puzzle → descend).

## Stress with teeth (already shipped, recap)

`state.resources.stress` is persistent across the run. Effects:
- 50+: −10% accuracy on every tool roll
- 75+: −20% accuracy AND tools with `turnCost ≥ 2` are gated (today
  that's just `appeal_letter` — "no time to file appeals when stressed")
- Win → −3, loss → +10, flee → +2, shadow tool use (upcode,
  aggressive_collections) → +5 per use

## Mobile + deploy

`TouchOverlay` parallel scene with virtual D-pad + E + ESC. Synthesizes
KeyboardEvents so existing cursor-key checks Just Work. Persists
across Hospital ⇄ Waiting-Room transitions. GitHub Actions workflow
publishes to Pages on each push to `main`.

## Files of interest

- `src/battle/index.ts` — mechanic factory
- `src/battle/types.ts` — `MechanicController` interface, `PlayerTurnResult.formEffects`
- `src/battle/mechanics/{simple,investigation,timed,block,mirror}.ts`
- `src/battle/ClaimSheet.ts` — CMS-1500 renderer + `applyEffect()`
- `src/battle/screens.ts` — victory + defeat overlays (depth 200+)
- `src/battle/toolMenu.ts` — default ribbon + custom action ribbon + flee + gating
- `src/content/cases.ts` — PatientCases (form puzzle errors + claim data)
- `src/content/enemies.ts` — encounter table with toolEffects, caseId, highlightedBoxes, payerNote
- `src/scenes/BattleScene.ts` — orchestration, form-bridge buff in init
- `src/scenes/FormScene.ts` — CMS-1500/UB-04 puzzle + formsPerfected push
- `src/scenes/WaitingRoomScene.ts` — obstacle marker layer
