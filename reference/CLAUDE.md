# Reference folder — orientation

This folder holds **design docs**, not runtime code. Curriculum,
narrative, journal entries, mood-board notes. Code in `src/`
implements the choices made here.

## Folder map

```
reference/
├── curriculum/             what each level teaches (10-level spine)
│   ├── README.md           folder index
│   ├── design-principles.md   cozy / surreal register split
│   ├── three-axes.md       phase / actor / document
│   ├── map-structure.md    parallel hospital ↔ Waiting Room
│   ├── case-template.md    authoring template for new encounters
│   ├── cross-cutting.md    concerns that thread through levels
│   ├── open-questions.md   room-level + roster + threading qs
│   ├── roadmap.md          recommended next steps
│   ├── worked-examples/L4.md   the worked example
│   └── levels/L1.md..L10.md   per-level breakdowns
├── narrative/              cosmology, philosophy, characters, notebook
│   ├── README.md           folder index
│   ├── cosmology.md        unresolved claims accumulate
│   ├── philosophy.md       two truths
│   ├── tone.md             register guide + dreamlike-fall pacing
│   ├── archetypes.md       resonance mapping
│   ├── endings.md          ⚠ PROVISIONAL — L10 + branches
│   ├── open-questions.md
│   ├── characters/
│   │   ├── dana.md         mentor; voice; arc
│   │   └── trapped-souls.md   the others (drafted, user revisiting)
│   └── notebook/
│       ├── README.md       progression artifact mechanic
│       ├── pages.md        12-page outline + drafts (1-12 drafted)
│       └── reveal-timeline.md   L4 → L10 build
├── puzzles/                puzzle-reframe drafts (battle redesign)
│   ├── README.md
│   ├── puzzles-current.md  battle DNA snapshot
│   └── puzzles-draft.md    proposed reframes per encounter
├── research/               external research material
│   └── billing-and-insurance-related-administrative-costs-a-cross-national-analysis.pdf
├── journal/                dated build-log entries (append-only)
│   ├── 2026-05-03-v3-the-waiting-room.md   original game design
│   ├── 2026-05-04-build-plan.md
│   ├── 2026-05-04-waiting-room-combat-foundation.md
│   └── 2026-05-05-battle-mechanics-and-form-bridge.md
└── aesthetic-inspirations.md
```

## What's locked vs in flight

| Doc | Status |
|---|---|
| `curriculum/` | Spine + per-level breakdown + worked example locked. Open questions per level + cross-cutting questions in `curriculum/open-questions.md`. See `curriculum/CLAUDE.md` for detail. |
| `narrative/` | Cosmology + philosophy + Dana's voice + reveal pacing + 12 notebook page drafts **locked**. Endings + Dana's specific child case + trapped-soul slate **provisional** (user revisiting). See `narrative/CLAUDE.md` for detail. |
| `puzzles/` | Drafts only. Bundle / Wraith / Gatekeeper have structured `puzzleDraft` data in code; rest are gaps. Nothing in `puzzles/` is implemented in the game engine yet. |
| `research/` | External research papers. PDF on US administrative healthcare costs lives here. Add new sources here. |
| `journal/` | Append-only. Each entry is a snapshot at its date. Don't edit old entries; add new ones. |

## Where to look for what

- **"What does L4 teach?"** → `curriculum/levels/L4.md`
- **"What's the build order?"** → `curriculum/roadmap.md`
- **"How do I author a new encounter?"** → `curriculum/case-template.md`
- **"What is the Waiting Room?"** → `narrative/cosmology.md`
- **"Who is Dana?"** → `narrative/characters/dana.md`
- **"What does notebook page 6 say?"** → `narrative/notebook/pages.md`
- **"How does a battle play today?"** → `puzzles/puzzles-current.md`
- **"How could battles be reframed?"** → `puzzles/puzzles-draft.md`

## Authoring conventions

- **Relative links between docs.** Use `[text](path)` with paths
  relative to the file. The narrative/ subfolder uses
  `[`../curriculum/README.md`](../curriculum/README.md)` and similar. Don't
  use `reference/...` absolute paths in markdown links — they
  break when files move.
- **Mark provisional sections with `⚠ PROVISIONAL`** at the top
  so a future reader can tell at a glance what's stable vs.
  in flux.
- **Don't reference what doesn't exist.** If you cite a file or
  feature, it should be there. If you're proposing a future
  thing, mark it as "(gap)" or "(proposed)".
- **Code references use backticks** with the file path: e.g.
  `src/content/enemies.ts`. Don't link to source from design
  docs — too easy to break.

## Current design-mode session context

We're in **design mode**, not build mode. The user explicitly
asked to slow down on mechanics and organize curriculum +
narrative first. Don't start authoring encounters, NPCs, scenes,
or hospital floor maps based on these docs without checking in.
The docs are upstream of code; code follows once docs settle.

The ongoing PR is `curriculum-spine` (PR #39). Work happens
there until the user either merges it or rebases it. New
narrative or curriculum changes go on that branch.

## See also

- Root [`CLAUDE.md`](../CLAUDE.md) — game-level context
  (Phaser, build commands, what's done vs. not in code)
- `narrative/CLAUDE.md` — narrative-specific authoring rules,
  voice, what's locked vs. provisional
