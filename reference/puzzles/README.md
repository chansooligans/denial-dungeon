# Puzzles

Design surface for the battle-as-puzzle reframe.

## What's here

- **`puzzles-current.md`** — what each battle plays like *today*. The
  "battle DNA" snapshot. Useful as the baseline you're refactoring
  away from.
- **`puzzles-draft.md`** — proposed reframe per encounter, written
  in prose. The `puzzleDraft` field on each `Encounter` (in
  `src/content/enemies.ts`) is the structured machine-readable
  version, rendered on `battles.html`. This file is the human-
  readable companion: more rationale, open questions, and risks.
- **`screenshots/`** — drop in-game screenshots, mockups, scribbles,
  whiteboards. Embed in the markdown with relative paths
  (e.g. `![bundle-mockup](screenshots/bundle-mockup-2026-05-05.png)`).

## Workflow

1. Read `puzzles-current.md` for the encounter you're reframing.
2. Sketch the puzzle in `puzzles-draft.md` — issue checklist, payer
   replies, win condition, costs.
3. Once the prose feels right, encode it into the encounter's
   `puzzleDraft: PuzzleDraft` field in `src/content/enemies.ts`. The
   catalog page picks it up automatically.
4. When the structure is settled, port it into a new
   `MechanicController` (or extend an existing one) and decide
   whether the existing fight still has value at lower levels.

## See also

- `reference/journal/2026-05-05-battle-mechanics-and-form-bridge.md`
  — current mechanic catalog
- `battles.html` (deployed at
  `https://chansooligans.github.io/denial-dungeon/battles.html`) —
  live rendering of every encounter, including the structured puzzle
  drafts
- `src/types.ts` — `PuzzleDraft` and `PuzzleIssue` interfaces
