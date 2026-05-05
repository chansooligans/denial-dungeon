# Puzzles — current state

How each battle actually plays today. "Battle DNA" baseline.

## The shared frame

Every battle is a turn loop:

1. Player picks a tool (or mechanic action). Tool rolls accuracy.
2. Hit → mechanic-specific damage / state change.
3. Enemy turn: attack damage with small variance.
4. Repeat until enemy HP at 0 (win) or player HP at 0 (loss).

What varies between mechanics is **what the player chooses from**
and **what makes wrong choices feel different from right choices**.
Most mechanics still resolve to "swing tools at HP bar with twist X."

| Mechanic | Encounter | What feels puzzle-like | What still feels combat-y |
|---|---|---|---|
| `simple` | CO-22, CO-109, CO-11, CO-16, etc. | Faction effectiveness rewards reading the encounter's rootCause. | HP bar; "missed!" rolls; enemy hits you back each turn. |
| `investigation` | CO-50 Wraith | Genuinely puzzle-shaped. Investigate, Lookup, Document, Decide. Distractor facts feed it. The form annotates as you reveal evidence. | The "decide too early" cost is auto-loss, which is satisfying but feels abrupt — there's no second chance. |
| `timed` | CO-29 Reaper | Days-Remaining clock injects real-world pressure. The escalating attack damage models the cost of lateness. | Still HP attrition under the clock. No payer replies — just damage. |
| `block` | CO-197 Gatekeeper | The 278-as-key reads correctly (other tools "bounce off"). | Bouncing is rendered as 0 damage — feels like a miss, not a payer message. |
| `mirror` | CO-18 Doppelgänger | "Same tool twice = no damage" teaches the duplicate-claim concept. | The kickback damage to the player is pure combat. |
| `multiHead` | OA-23 Hydra | Sequenced adjudication is clearly modeled. Each head has its own rootCause. | Still attacks you back. Players can lose just by being slow. |
| `blind` | Eligibility Fog | Accuracy debuff models flying blind. 270 visibly clears it. | Otherwise plain HP. |
| `spawn` | CO-16 Sprite Swarm | The mechanic is the lesson — patching the chart upstream is the point. claim_scrubber sweeps; cdi_query stops the bleed. | Still HP attrition on the Source itself. |
| `audit` | L10 Boss | Run-long shadow choices inflate the fight. Heal-on-shadow-tool-use is novel. | Still HP attrition; the inflated HP just makes the swing race longer. |

## Common observations

- **Wrong moves are damage-shaped.** Today, "wrong" mostly means
  "lower expected damage" or "missed." Real revenue cycle work is
  about *getting more information* from a wrong move ("payer says
  X"), not just losing a turn.
- **The form is decorative more than operational.** ClaimSheet
  annotates via `toolEffects` but never gates a win. The boxes
  could *be* the puzzle (apply tool to box → field updates), but
  today you operate at the encounter level, not the field level.
- **Filing window is implied, not explicit.** Real claim work is
  shaped by deadlines (timely filing, prompt-pay, LCD review
  windows). Only Reaper makes that explicit; everywhere else turn
  count is invisible.
- **No retry granularity.** You either finish a fight or flee. No
  middle ground like "submit and see what comes back."

## Files

- `src/battle/mechanics/{simple,investigation,timed,block,mirror,blind,multiHead,spawn,audit}.ts`
- `src/battle/types.ts` — `MechanicController`, `PlayerTurnResult`
- `src/battle/ClaimSheet.ts` — form renderer (CMS-1500 + UB-04)
- `src/scenes/BattleScene.ts` — orchestration

## What stays in a reframe

Most of this is reusable:

- ClaimSheet renderer + `applyEffect()` — these *are* the field
  mutations a puzzle frame needs.
- `caseFile` / `CaseFact.onReveal` — already model "investigate →
  reveal annotation." Generalizes to "any tool can reveal an issue
  on the form."
- Form-bridge buff — even nicer in a puzzle frame: prepping the
  form clears the first issue automatically.
- Stress + audit risk + filing window — pressure meters that aren't
  HP. Already the language we want.
