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
| `puzzles/` | Drafts here are now ahead of where they started — most have shipped as standalone HTML prototypes in `src/<encounter>-prototype/`. See root [`../CLAUDE.md`](../CLAUDE.md) "Prototype catalog" section. The runtime battle engine in `src/battle/` still uses the old HP-based mechanics; the prototypes are the design target it'll eventually move to. |
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

## Current state — past design mode

The "design mode" framing this file used to carry is stale.
The curriculum + narrative spine is locked, and the puzzle
drafts that lived in `puzzles/` have largely shipped as
standalone single-encounter HTML prototypes in
`src/<encounter>-prototype/`. Twelve of them now span L2 →
L10; see root [`../CLAUDE.md`](../CLAUDE.md) "Prototype
catalog" for the full table.

The runtime battle engine in `src/battle/` still uses the
older HP / tools-as-damage / multiple-choice model and is
largely frozen while the prototypes settle. Once a prototype
shape stops moving, the runtime adopts it.

What stays in this folder: the long-form design docs.
Curriculum-level breakdowns, narrative cosmology + Dana's
voice + notebook pages, archetype mapping, journal entries.
Code follows; docs lead. Editing patterns:

- **Adding a new prototype**: create `src/<name>-prototype/main.ts`,
  consume the shared `BASE_CSS + districtVars` from
  `src/shared/prototype-base.ts`, register the static
  `<name>-prototype.html` page in `vite.config.ts`, add an
  entry to `src/prototypes/main.ts` for the catalog.
- **Updating a level's encounter slate**: edit `curriculum/levels/LN.md`.
  Mark new gaps with `*(gap)*` and existing items with `✅`.
- **Changing what a battle teaches**: usually means a new prototype
  before any runtime change.

## Provisional sections still in flux

- **Endings** (`narrative/endings.md`) — L10 reveal +
  branches still PROVISIONAL.
- **Dana's specific child case** — deferred; current notebook
  pages are deliberately generic.
- **Trapped-soul slate** — four candidates drafted; not all
  will ship. User revisiting.

## See also

- Root [`CLAUDE.md`](../CLAUDE.md) — game-level context
  (Phaser, build commands, what's done vs. not in code,
  prototype catalog)
- `narrative/CLAUDE.md` — narrative-specific authoring rules,
  voice, what's locked vs. provisional
- `curriculum/CLAUDE.md` — curriculum-spine authoring rules
