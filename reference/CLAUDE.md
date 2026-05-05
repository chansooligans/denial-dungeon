# Reference folder — orientation

This folder holds **design docs**, not runtime code. Curriculum,
narrative, journal entries, mood-board notes. Code in `src/`
implements the choices made here.

## Folder map

```
reference/
├── curriculum.md           what each level teaches (10-level spine)
├── narrative/              cosmology, philosophy, characters, notebook
│   ├── README.md           start here for narrative
│   ├── cosmology.md        unresolved claims accumulate
│   ├── philosophy.md       two truths
│   ├── tone.md             register guide + dreamlike-fall pacing
│   ├── archetypes.md       resonance mapping (Wraith = unresolved CO-50s, etc.)
│   ├── endings.md          ⚠ PROVISIONAL — L10 + branches
│   ├── open-questions.md   what's still up for shaping
│   ├── characters/
│   │   ├── dana.md         mentor; voice; arc
│   │   └── trapped-souls.md   the others (drafted, not all committed)
│   └── notebook/
│       ├── README.md       progression artifact mechanic
│       ├── pages.md        12-page outline + drafts
│       └── reveal-timeline.md   L4 → L10 build of Dana's reveal
├── puzzles/                puzzle-reframe drafts (battle redesign work)
│   ├── README.md
│   ├── puzzles-current.md  battle DNA snapshot
│   └── puzzles-draft.md    proposed reframes per encounter
├── journal/                dated build-log entries
│   ├── 2026-05-03-v3-the-waiting-room.md   original game design
│   ├── 2026-05-04-build-plan.md
│   ├── 2026-05-04-waiting-room-combat-foundation.md
│   └── 2026-05-05-battle-mechanics-and-form-bridge.md
├── aesthetic-inspirations.md
└── billing-and-insurance-related-administrative-costs-...pdf
```

## What's locked vs in flight

| Doc | Status |
|---|---|
| `curriculum.md` | Spine + per-level breakdown locked. Open questions noted in-doc. Currently on PR #39 (not auto-merged so it can be reshaped). |
| `narrative/` | Cosmology + philosophy + Dana's voice + reveal pacing **locked**. Endings + Dana's specific child case + trapped-soul slate **provisional**. See `narrative/CLAUDE.md` for detail. |
| `puzzles/` | Drafts only. Two encounters (Bundle, Wraith, Gatekeeper) have structured `puzzleDraft` data in code; rest are gaps. Nothing in `puzzles/` is implemented in the game engine yet. |
| `journal/` | Append-only. Each entry is a snapshot at its date. Don't edit old entries; add new ones. |

## Where to look for what

- **"What does L4 teach?"** → `curriculum.md`, L4 section
- **"What is the Waiting Room?"** → `narrative/cosmology.md`
- **"Who is Dana?"** → `narrative/characters/dana.md`
- **"What does notebook page 6 say?"** → `narrative/notebook/pages.md`
- **"How does a battle play today?"** → `puzzles/puzzles-current.md`
- **"How could battles be reframed?"** → `puzzles/puzzles-draft.md`

## Authoring conventions

- **Relative links between docs.** Use `[text](path)` with paths
  relative to the file. The narrative/ subfolder uses
  `[`../curriculum.md`](../curriculum.md)` and similar. Don't
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
