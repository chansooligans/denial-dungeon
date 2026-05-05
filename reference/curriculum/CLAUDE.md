# Curriculum folder — orientation

What the game teaches, organized by level. Upstream of mechanic
work; downstream of narrative.

Start at [`README.md`](README.md) for the folder index. This
file is shorter and oriented at "what's locked, what's not, and
where to author next."

## Folder layout

```
curriculum/
├── README.md             entry + folder map
├── design-principles.md  cozy/surreal register split
├── three-axes.md         phase / actor / document
├── map-structure.md      parallel hospital ↔ Waiting Room
├── case-template.md      authoring template for new encounters
├── cross-cutting.md      concerns that thread through levels
├── open-questions.md     room-level + roster + threading qs
├── roadmap.md            recommended next steps
├── worked-examples/L4.md the L4 worked example (rooms + WR + map)
└── levels/L1.md..L10.md  per-level breakdowns
```

## What's locked

| Decision | Source |
|---|---|
| Sequencing — chronological through the cycle | [`README.md`](README.md) |
| 10 levels (existing names) | [`levels/`](levels/) |
| Two-register design (Hospital cozy / Waiting Room surreal) | [`design-principles.md`](design-principles.md) |
| Parallel-map structure (hospital floor ↔ Waiting Room wing share coords) | [`map-structure.md`](map-structure.md) |
| Wraith re-homed L3/L7 → L4 | [`levels/L4.md`](levels/L4.md) |
| 8 gaps distributed into their natural levels | spread through `levels/` |
| Stuck-claim case template | [`case-template.md`](case-template.md) |
| L4 as the worked example / build pattern | [`worked-examples/L4.md`](worked-examples/L4.md) |
| Build order: L4 → L5 → L8 | [`roadmap.md`](roadmap.md) |

## What's still open

Open questions per level are in each level file. Cross-cutting
open questions are in [`open-questions.md`](open-questions.md):
hospital floor map format, NPC roster expansion, patient as
NPC, cross-level patient threading, chargemaster split, codex
entries for cross-cutting concerns, Wraith wing migration.

## Authoring rules for new content

When adding to this folder:

- **Don't pre-commit to provisional things.** Foreshadowing
  that touches Dana's specific child case or trapped-soul
  details should stay flexible (user is revisiting both).
- **One file per level.** Don't sprawl across multiple files;
  per-level questions live in `levels/LN.md`.
- **Use real revenue-cycle terms.** I50.42, 278, LCD L33526,
  not generic stand-ins.
- **Cross-link freely.** Especially to
  [`../narrative/`](../narrative/) (story side) and
  [`../puzzles/`](../puzzles/) (mechanic side).
- **Mark gaps clearly.** "(gap)" inline; *(new)* in tables;
  ⚠ PROVISIONAL on whole sections that aren't stable.

## Don't author code from this folder yet

We're in design mode. Encounters, NPCs, dialogue, scenes, and
hospital floor maps shouldn't be authored in `src/` based on
these docs without checking in. The docs are still moving.

When the user says "let's start building L4" we follow
[`roadmap.md`](roadmap.md) and
[`worked-examples/L4.md`](worked-examples/L4.md).

## See also

- [`README.md`](README.md) — folder index
- [`../narrative/CLAUDE.md`](../narrative/CLAUDE.md) — story
  side authoring rules
- [`../CLAUDE.md`](../CLAUDE.md) — reference folder
  conventions
- Root [`../../CLAUDE.md`](../../CLAUDE.md) — game-level
  context
