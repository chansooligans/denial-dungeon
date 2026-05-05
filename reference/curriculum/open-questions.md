# Curriculum open questions

The original v1 questions are answered (sequencing kept,
gaps distributed, NSA included, patients can be NPCs, room-
level granularity flexible, Wraith moved to L4). Current
questions are about the *room-level* pass and what comes next.

## 1. Hospital floor maps

Each level needs a hospital room layout. Two options:

- **Option A.** Build them in `src/content/maps/levelN.ts`
  using the same `mapBuilder` system as Level 1. Familiar.
  Allows free-roam exploration with rooms placed in tile space.
- **Option B.** Handcraft per-level in a new format that's
  denser — more rooms, fewer hallways, more like a small
  apartment than a hospital floor.

Probably A unless the per-level files start feeling too
sparse.

## 2. NPC roster expansion

The current 7 NPCs (Dana, Kim, Jordan, Alex, Martinez, Sam,
Pat) get thin past L5. Each level past L5 introduces work
the existing roster doesn't cleanly do.

Proposal: each level introduces 1–2 new NPCs with a clear
job:

| Level | Likely new NPCs |
|---|---|
| L2 | Registrar; financial counselor |
| L3 | UM nurse; precert coordinator |
| L4 | Charge integrity analyst (Martinez can stay as CDI) |
| L5 | Contract manager |
| L6 | Charge integrity analyst; clearinghouse vendor rep |
| L7 | Underpayment specialist; payment poster |
| L8 | PFS rep; financial assistance counselor; *the patient* |
| L9 | COB desk specialist |
| L10 | Auditor; compliance officer |

## 3. The patient as NPC

Per the design principle, patients can appear in Hospital
rooms. Two ways to model:

- **Full NPC IDs** in `src/content/npcs.ts` like staff. They
  recur, have routines, are waiting on something specific.
- **A separate "Patient" concept** attached to each case. The
  patient is bound to the case file, appears once, and isn't
  reusable.

Probably hybrid: a small named-patient pool (maybe 4–6) who
recur across levels, plus one-off patients tied to specific
cases.

## 4. Cross-level threading

A patient introduced at L2 (registration) might re-appear at
L7 (now adjudicating) and L8 (now landing in their hands).
Worth modeling, or one case = one level?

If we model it: a single patient's claim becomes a *campaign*
that the player tracks across phases. That's narratively
strong but mechanically complex. Probably worth one or two
threaded patients (showcase cases) but not all.

## 5. Chargemaster vs charge capture split

L4 introduces the CDM, L6 teaches it in depth. Right split, or
should both live in L6?

Argument for split: L4 is where the CDM gets brought into
play in passing (it's how charges connect to documentation);
L6 is where it gets the full treatment (chargemaster
maintenance, late charges, integrity analysis).

Argument for merging at L6: the CDM is fundamentally a
billing artifact; introducing it at L4 might confuse the
documentation/coding focus.

Probably split — L4 introduces, L6 deepens. Same pattern as
COB (L2 introduces, L9 fights the boss).

## 6. Codex for cross-cutting concerns

Today's codex (`src/content/codex.ts`) has entries per CARC
code and per archetype. Cross-cutting concerns (denial
taxonomy as a *system*, time pressure, vendor management)
don't have entries.

Should they? Argument for: lets the player re-read the
*concept* as they see new variations. Argument against:
adds another category players have to navigate.

Probably yes — a "concepts" category (already declared in
`CodexCategory`) that catches cross-cutting threads.

## 7. The Wraith's room

The Wraith was moved from L3/L7 to L4 (CDI is the actual
teaching home). Implementation question: does that affect
where the Wraith *physically* lives in the Waiting Room?
Today she's in `wing: 'appeals'` in
`src/content/enemies.ts`. Does she move to `wing: 'coding'`?

Probably yes, to match the L4 home. Defer until the room-
level pass.

## See also

- [`README.md`](README.md) — folder index
- [`roadmap.md`](roadmap.md) — recommended next steps
- [`levels/`](levels/) — per-level breakdowns; each level may
  raise its own open questions in its file
