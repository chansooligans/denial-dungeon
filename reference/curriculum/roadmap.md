# Roadmap — recommended next steps

How to actually build out the curriculum once the design is
locked. This file is the user-facing "what should we do next"
artifact.

## Recommended order

1. **L4 first.** Build the worked-example treatment in code
   (see [`worked-examples/L4.md`](worked-examples/L4.md)):
   - Add the chargemaster review room (Hospital).
   - Add the CDM Specter station (Waiting Room) at parallel
     map position.
   - Author the matching encounter + case using
     [`case-template.md`](case-template.md).
   - The Wraith moves here from L3/L7 — verify wing assignment
     matches.
2. **L5 second.** Most underbuilt; start it from scratch the
   right way (Library NPCs, contract manager, fee schedule
   encounter). See [`levels/L5.md`](levels/L5.md).
3. **L8 third.** Most ambitious; reuse L4's pattern. The
   patient-side weight needs careful handling — Hospital side
   carries it, Waiting Room defuses with the Charity
   Lighthouse and Surprise Bill Specter. See
   [`levels/L8.md`](levels/L8.md).
4. **Mechanics decisions** get made *per level / per
   encounter* during that work, not in advance. We'll either
   keep current mechanics, port the puzzle drafts in
   [`../puzzles/puzzles-draft.md`](../puzzles/puzzles-draft.md),
   or invent something that fits better.

## What "build out a level" means

For each target level:

1. Read the level file in [`levels/`](levels/).
2. Decide hospital floor layout (which rooms, where).
3. Decide Waiting Room stations (which manifestations, where,
   parallel to hospital rooms per
   [`map-structure.md`](map-structure.md)).
4. Author NPCs (who lives in each hospital room) — append to
   `src/content/npcs.ts`.
5. Author dialogue (what each NPC says) — append to
   `src/content/dialogue.ts`.
6. Author encounters (Waiting Room obstacles) — append to
   `src/content/enemies.ts`.
7. Author cases (the form puzzles backing each encounter) —
   append to `src/content/cases.ts`.
8. Update level metadata in `src/content/levels.ts`.
9. Build the hospital floor map (`src/content/maps/levelN.ts`)
   if option A in [`open-questions.md`](open-questions.md)
   wins.

## What's blocked vs. not blocked

**Not blocked** (can author confidently right now):

- L1-L9 curriculum content (concepts, cases, encounters, NPCs).
- L4 worked-example implementation (curriculum side has all the
  pieces).
- L1 NPC dialogue (Dana's pages 1-3 are drafted in
  [`../narrative/notebook/pages.md`](../narrative/notebook/pages.md)).
- Trapped-soul side encounters (drafted in
  [`../narrative/characters/trapped-souls.md`](../narrative/characters/trapped-souls.md);
  user will revisit, but middle work isn't blocked).
- The general L10 audit mechanic (already shipped).

**Blocked** (waiting on user decisions):

- L10 boss audit final dialog (coupled to ending).
- The actual notebook page 12 text (drafted as flexible; will
  revise when ending lands).
- Dana's child case content (name, age, condition, denial) —
  user is revisiting.
- Final trapped-soul slate (user is revisiting).

## When to re-open this doc

After each level is built, come back here and:

- Cross out the level we just finished.
- Promote the next-recommended level to the top.
- Update "what's blocked" if anything changed.

## See also

- [`README.md`](README.md) — folder index
- [`open-questions.md`](open-questions.md) — what's still up
- [`worked-examples/L4.md`](worked-examples/L4.md) — pattern
  to follow
- [`levels/`](levels/) — per-level details
- [`../narrative/`](../narrative/README.md) — story side
