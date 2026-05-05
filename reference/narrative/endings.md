# Endings — L10 reveal + branches

> ⚠ **PROVISIONAL.** The L10 endings are still being shaped.
> The structure below is a working draft — the author may revise
> the branching, the conditions, or collapse to fewer endings.
> The rest of the narrative is built to *support* multiple
> possible endings; nothing earlier in the game commits to a
> specific one.

## Dana's last claim — the anchor

The audit file contains a claim Dana abandoned when she
descended. It was for **a child**.

(See [`characters/dana.md`](characters/dana.md) for full
context. Specifics — name, age, condition, denial reason —
deferred until L10 authoring. The denial should be defensible
from the payer's perspective and morally wrong; that's where
the bite is.)

The player only learns the specifics if they earn them — clean
run, full notebook, willingness to look at what Dana could not
finish.

## The audit as door

At L10:

- The auditor reviews every claim the player has worked across
  the run (existing `boss_audit` / `audit` mechanic).
- Shortcuts show up as "receipts" the auditor pulls (existing).
- The auditor's file *also* contains Dana's last claim.
- Defending Dana's claim alongside your own *is* pulling her
  back. Mechanically: same UI as defending any other case in
  the audit; thematically: a claim resolved is a soul released.

The mechanic is the metaphor. The reason this works (no matter
what specific ending we land on): a claim defended fully
*resolves*, and resolution is the only force that returns
something from the Waiting Room. Dana's claim is just a claim.

## Ending structure (draft)

Four candidate endings on two axes — *run quality* (clean /
shortcut) × *choice* (try to fetch Dana / don't):

| Run quality | Choice | Outcome (draft) |
|---|---|---|
| Clean | Defend Dana too | Dana returns. Both files survive the audit. |
| Clean | Don't try | Player passes audit. Dana stays. Bittersweet — no shame, but unfinished. |
| Shortcut | Defend Dana too | Both files collapse. Player is now also stuck. (Hardest ending — the cost of trying-without-foundation.) |
| Shortcut | Don't try | Player passes audit barely. Dana stays. The system kept turning. |

These are the *current draft*. May collapse to two or three.
May add a fifth (*"refusal"* — Dana, like the CFO above, may
not want to come back, and the player has to honor that).

## Why this works regardless of which ending lands

The cosmological principle (resolution releases what's stuck)
holds whatever ending we choose. That means the rest of the
game's content can be authored confidently — the ending
*refines*, not *rewrites*.

## What's blocked vs. not blocked by the open ending

**Not blocked:**
- Curriculum content for L1-L9
- Hospital floor maps
- L1 NPC dialogue + Dana's pages 1-3
- Trapped-soul side encounters
- The general L10 audit mechanic (already shipped)

**Blocked:**
- L10 boss audit final dialog
- The actual notebook page 12 text
- Dana's child case content (name, age, condition, denial)

## Open questions specific to endings

- Should the "shortcut + try to fetch" ending be available, or
  is it cruel to offer it? (Argument for: the player who took
  shortcuts and is willing to atone for them is making a
  meaningful choice. Argument against: the player has no way
  to know it's the worst path until they fail it.)
- Does the Waiting Room *change* in the post-game depending on
  the ending? E.g., if Dana stayed, does the player see her
  there in subsequent playthroughs? Or in a New Game+?
- Is there a credits scene? Should the player's notebook be
  readable as the credits?

## See also

- [`characters/dana.md`](characters/dana.md) — her arc + her
  last claim
- [`cosmology.md`](cosmology.md) — why "resolution releases"
  is the cosmic rule
- [`notebook/reveal-timeline.md`](notebook/reveal-timeline.md)
  — the build-up that leads to L10
