# Wraith @ L4 — encounter redesign

The L4 worked-example encounter, redesigned end-to-end. We use
this as the *reference implementation* for what a battle looks
like once we drop HP / tools-as-damage / multiple choice.

After this design lands, the same six-step template applies to
any other encounter. The verb space + tone decisions made here
should generalize to Bundle, Reaper, etc.

## Six-step process

| Step | Question | Status |
|---|---|---|
| 1. Constraints brief | What are we solving for? What's off the table? | **draft below — needs review** |
| 2. Screen layout | What does the player see? Where? | not started |
| 3. Verb space | What can the player do? What does each verb cost? | not started |
| 4. Resolution arc | How does the encounter end? Multiple outcomes? Time pressure? | not started |
| 5. Tone + surrealism | How is the Wraith funny? How does the descent feel? | not started |
| 6. Stress-test | Does this generalize to Bundle + Reaper? | not started |

Step 3 is where the real decision lives. Steps 1, 2, 5 set up
the constraints that make step 3 answerable. Step 4 stress-tests
step 3 against pacing. Step 6 stress-tests against generality.

---

## Step 1 — constraints brief

### What we're solving for

A playable Wraith encounter that:

1. Teaches medical necessity / CDI (per L4 curriculum).
2. Honors the cosmology — the Wraith is unresolved-CO-50 made
   manifest; she's resolved by *claim-resolution*, not by being
   killed.
3. Honors the tone — surreal, funny, with the heavy-Hospital →
   light-Waiting-Room register flip.
4. Plays differently from any other L4 encounter (Bundle, CDM
   Specter).
5. Doesn't use HP bars, tools-as-damage-buttons, or multiple
   choice.

### What we know (locked)

- **Linked case** (`case_wraith_walker`): Arlene Walker, 67,
  BCBS NC PPO. TTE 93306 denied per LCD L33526 — payer says
  I50.9 doesn't meet criteria (no LVEF<35% documented).
- **Actual root cause:** I50.9 is too unspecified. Chart
  supports I50.42 with creatinine + sx evidence the original
  biller didn't surface.
- **Form-bridge pre-fix:** in `FormScene` the player can
  change I50.9 → I50.42; this grants some buff in the
  encounter (TBD what, given there's no HP).
- **The ClaimSheet renderer** can show the CMS-1500 inline
  with specific boxes highlighted.
- **The descent:** dreamlike-fall from CDI workroom on the L4
  hospital floor (per
  [`../narrative/tone.md`](../narrative/tone.md)). Player
  doesn't push a button.
- **Narrative context:** L4 is the level Dana shows the first
  cracks. Page 6 of her notebook (about CDI, "get the
  documentation right and the codes…") cuts off mid-sentence
  here.

### What's off the table

- HP bars on either side.
- "Tools" as ability buttons that deal damage.
- Multiple choice questions.
- Generic combat verbs — attack, defend, heal.

### Open (answered through later steps)

- **Time pressure?** Filing-window clock, or no clock?
- **Win state shape?** Binary (resolve/fail), or graduated
  (clean appeal / write-off / denied)?
- **Reversibility?** Can the player back out and come back, or
  one-shot?
- **Shortcut paths?** Are there options that work but raise
  audit risk (per the existing shadow-tool econ)?
- **Form-bridge buff content?** What does pre-fixing the dx
  unlock for the player in this encounter?
- **Encounter length?** A few minutes? Longer? Variable?

### Questions for the user (step 1)

1. **Anything to add** to "what we're solving for" or "what we
   know"?
2. **Anything to remove or relax** from "what's off the table"?
   Especially: would a *very limited* set of named verbs from
   the existing tool list be acceptable as long as they aren't
   HP-shaped, or do we genuinely need new verbs?
3. **Of the six open questions** — any you have a strong
   instinct on already? Sometimes early instincts save a lot
   of design loops.

---

## Step 2 — screen layout

*Not started. Picks up after step 1 lands.*

---

## Step 3 — verb space

*Not started. The core decision; depends on steps 1, 2.*

---

## Step 4 — resolution arc

*Not started.*

---

## Step 5 — tone + surrealism

*Not started.*

---

## Step 6 — stress-test against Bundle + Reaper

*Not started. Final step before we'd consider building.*

---

## See also

- [`../curriculum/levels/L4.md`](../curriculum/levels/L4.md) —
  L4 curriculum (concepts, rooms, narrative beats)
- [`../curriculum/worked-examples/L4.md`](../curriculum/worked-examples/L4.md)
  — L4 hospital-room ↔ Waiting-Room-station mapping
- [`../narrative/cosmology.md`](../narrative/cosmology.md) —
  why the Wraith is what she is
- [`../narrative/tone.md`](../narrative/tone.md) — register
  rules, dreamlike-fall pacing
- [`../narrative/notebook/pages.md`](../narrative/notebook/pages.md)
  — Dana's L4 page (page 6, the one that cuts off)
- [`puzzles-current.md`](puzzles-current.md) — current Wraith
  Investigation mechanic implementation
- [`puzzles-draft.md`](puzzles-draft.md) — earlier puzzle
  reframe sketches (Bundle, Wraith, Gatekeeper)
- `src/content/cases.ts` — `case_wraith_walker` data
- `src/content/enemies.ts` — `co_50` encounter data
- `src/battle/mechanics/investigation.ts` — current
  Investigation controller (the Wraith's mechanic)
