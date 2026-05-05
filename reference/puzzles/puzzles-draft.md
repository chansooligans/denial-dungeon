# Puzzles — drafts

Proposed puzzle reframes. Structured versions live in each
encounter's `puzzleDraft` field (rendered on `battles.html`); this
file is the human-readable companion with rationale, open questions,
and risks.

## The shared frame (proposal)

Every encounter is a stuck claim. To win, the player resolves a
**checklist of issues** until the claim adjudicates clean. Most
issues are hidden; investigation reveals them. Each tool produces a
**payer reply** — not damage. Pressure comes from a finite
**filing window** + **goodwill** + run-long **audit risk**, not
from the enemy hitting you back.

```
ENCOUNTER
├── premise          (one line: what came back denied, why)
├── issues[]         (resolve all → win)
│   ├── label
│   ├── hidden?      (revealed by investigation)
│   ├── resolvedBy   (canonical tool/action)
│   └── teaching     (the beat this issue carries)
├── winCondition     ("all resolved + Submit clean")
├── costs[]          (filing window, goodwill, audit risk)
├── payerReplies     (per-tool sample text)
└── notes            (open questions)
```

The `MechanicController` interface mostly stays. `PlayerTurnResult`
gains `issueResolved` / `issueRevealed` / `payerReply` /
`filingDayLost` / `goodwillDelta`. Existing damage-emitting
controllers can co-exist during the transition.

## Encounters with seeded drafts

The structured drafts live in `src/content/enemies.ts`. Pull them
up on `battles.html` (or look at the `puzzleDraft` field directly).
This file just adds the rationale.

### Bundling Beast (CO-97) — recommended pilot

**Why this is the pilot**: simplest reframe. The existing
`toolEffects` already mutate the form correctly (mod-25 stamp via
CDI Query). The reframe is mostly UI/messaging — issue checklist
instead of HP bar; explicit payer replies; wrong-move costs that
aren't damage rolls.

**Open questions**:

- Is "Resubmit cleanly" really a separate issue, or is it just
  pressing Submit at the right time? Probably the latter; could
  fold into `winCondition`.
- Should the third issue (rescrub) be hidden or visible? Visible
  feels right — the player knows they need to verify before
  resubmitting.
- Should wrong modifier (59) get its own payer reply, or fold into
  the "submit before mod-25 added" reply?

**Risk**: too easy. Three issues with one tool each = three turns
to win. Could add a hidden issue: "Patient was seen in office (POS
11), not ASC (POS 24) — confirm POS before resubmit." Adds one
more layer without making it tedious.

### Medical Necessity Wraith (CO-50) — second port

**Why this is the second port**: already 80% puzzle. Investigation
mechanic does the heavy lifting; only the surface UI needs to
shift from "case file panel + HP" to "issue checklist + payer
replies."

**Open questions**:

- The Decide-too-early auto-loss is satisfying narratively but
  punishing for first-time players. Replace with: Decide too early
  → "Appeal denied. Resubmit with stronger evidence" → +1 wasted
  attempt counter (3 max) + filing window cost. Three failed
  appeals = real loss.
- Should distractor facts cost a filing day? Today they cost a
  turn budget. In the reframe, "wasted a day chasing a service-
  area question" reads better than "used 1/8 of your turn budget."

**Risk**: pacing. If every wrong fact costs a day, the player who
tries everything will lose to the clock. Need a sane filing window
(20+ days?) that allows exploration.

### Prior Auth Gatekeeper (CO-197) — third port

**Why this is the third port**: cleanest 1:1 mapping. The "block"
mechanic literally is "the gate is the puzzle." Today the gate
makes alternating turns useless; the reframe makes it a discrete
obstacle that the 278 specifically unlocks. Other tools have
explicit replies instead of "did 0 damage."

**Open questions**:

- Should the retro-278 require the medical-necessity documentation
  *first* (CDI Query before 278), or after (CDI Query as
  justification packet for the 278)? Real-world it's often after.
  Setting `cdi_query` as a hidden third issue captures that.
- Does the player need to know about Box 23 explicitly, or is it
  enough that Submit auto-populates it after 278 approval? The
  former teaches more; the latter feels less fiddly.

**Risk**: the "auth number" issue is a small detail that could
feel like trivia. Worth keeping if we're willing to render Box 23
on the ClaimSheet (we already do).

## Encounters not yet drafted

These all need design passes. Rough thoughts:

| Encounter | First-pass thought |
|---|---|
| **CO-29 Reaper** | Filing window is *the* puzzle. Each tool advances or burns days. Win = adjudicate before days = 0. The reframe is mostly stripping HP entirely. |
| **CO-18 Doppelgänger** | Issues = (1) why was the claim duplicated? (2) what frequency code is needed? (3) can we cancel the dupe before adjudication? `submit_837p` with frequency 7 resolves issue 2. |
| **OA-23 Hydra** | Three sequential mini-puzzles, one per payer. Each head's issue list is small (2–3 issues). Adjudicating out of order = retraction = +1 wasted attempt. |
| **Eligibility Fog** | Issues hidden until `eligibility_270` clears the fog. Then the claim is just a Simple-style fight, except now it's about catching what eligibility uncovered (wrong plan, wrong member id, etc.). |
| **CO-16 Sprite Swarm** | Already mechanic-as-lesson. Issues = (1) what's leaking from the chart? (2) sweep the queue (3) patch upstream. Source HP becomes "claims pending in queue" — work, not health. |
| **L10 Audit Boss** | Issues = the auditor's specific findings (one issue per shortcut taken in earlier levels). Each shortcut = one issue + one healing receipt. The whole run plays back. |

## Engine work needed

Roughly two PRs:

**PR-A — foundation** (no behavior change yet):

- Extend `PlayerTurnResult` with `issueResolved? / issueRevealed? /
  payerReply? / filingDayLost? / goodwillDelta?`
- Add `PuzzleController` base class (or just helpers) that maintain
  `issues: Issue[]` and `daysRemaining: number`
- BattleScene gets a "puzzle UI mode" toggled by encounter — issue
  checklist replaces HP bar; payer reply replaces "enemy hits you"
  text
- All existing controllers continue to work (no `puzzle` opt-in =
  the old HP UI)

**PR-B — pilot conversion**:

- Convert the Bundle to puzzle. Use it as the reference
  implementation
- Don't touch the other seven mechanics yet — let the Bundle
  bake. Iterate on UI feel, info density, retry pacing.

Then iterate: convert Wraith next (it's already 80% puzzle), then
Gatekeeper, etc. Reaper + Audit might keep some pressure-meter
feel because *time* and *risk* are exactly what they teach.

## Open design questions

- **Retry pacing.** How many wrong moves before a fight is lost?
  Three feels right (CMS frequency code 7, 7-day window, 3
  resubmits). Need to playtest.
- **Filing window granularity.** Per-encounter (Reaper has 14
  days, Bundle has 90) or universal (every fight has 7 turns)?
  Per-encounter is more realistic; universal is more legible.
  Probably per-encounter.
- **Goodwill / NPC reactions.** Each ticket comes from an NPC.
  Wrong moves on their claim cost goodwill with *that* NPC, which
  affects their dialogue afterward. This is a big change but
  threads the form-bridge work into a relationship system. Defer
  to a later phase.
- **The "Submit" button.** Should it be its own action (you press
  it when you think you're done), or should it auto-fire when the
  last issue resolves? The former is more satisfying (commits feel
  earned) and matches real workflow. The latter is faster.
  Probably the former.

## Screenshots

Drop in-game screenshots, mockups, or whiteboards in
`screenshots/` and embed them with relative paths:

```markdown
![bundle-mockup](screenshots/bundle-mockup-2026-05-05.png)
```

(Folder is empty for now.)

## See also

- `puzzles-current.md` — what battles look like today (baseline)
- `battles.html` (deployed) — every encounter, including the
  structured `puzzleDraft` for those with one
- `src/types.ts` — `PuzzleDraft` and `PuzzleIssue` interfaces
- `reference/journal/2026-05-05-battle-mechanics-and-form-bridge.md`
  — current mechanic catalog
