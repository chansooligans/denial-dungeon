# Curriculum

What the game teaches, organized by level. The spine that the
hospital floors and Waiting Room wings hang off of. Mechanics
follow content; this folder is upstream of mechanic / battle
work and downstream of narrative.

## The three axes

The game wants all three because it's uniquely positioned to
*show* their interaction. (See [`three-axes.md`](three-axes.md)
for full text.)

1. **Phase axis** — where in the lifecycle of a claim does this
   happen?
2. **Actor axis** — whose job is this?
3. **Document axis** — what artifacts does this work happen on?

## Folder map

```
curriculum/
├── README.md             this file (entry + three axes)
├── design-principles.md  the cozy/surreal register split
├── three-axes.md         phase / actor / document framing
├── map-structure.md      parallel hospital ↔ Waiting Room layout
├── case-template.md      stuck-claim case authoring template
├── cross-cutting.md      concerns that thread through levels
├── open-questions.md     room-level + NPC-roster + threading questions
├── roadmap.md            recommended next steps for build-out
├── worked-examples/
│   └── L4.md             full L4 treatment (rooms + WR + map correspondence)
└── levels/
    ├── L1.md  Orientation
    ├── L2.md  The Front Door
    ├── L3.md  The Gate
    ├── L4.md  The Copy
    ├── L5.md  The Library
    ├── L6.md  The Conveyor
    ├── L7.md  The Courtroom
    ├── L8.md  The River
    ├── L9.md  The Maze
    └── L10.md The Audit
```

## Where to look for what

- **"What does L4 teach?"** → [`levels/L4.md`](levels/L4.md)
- **"What's in L4 already vs what's a gap?"** → [`levels/L4.md`](levels/L4.md), bottom
- **"How does the player descend?"** → [`map-structure.md`](map-structure.md) here, plus [`../narrative/tone.md`](../narrative/tone.md) for the dreamlike-fall pacing
- **"How do I author a new encounter?"** → [`case-template.md`](case-template.md)
- **"Why isn't COB its own level?"** → [`cross-cutting.md`](cross-cutting.md)
- **"What's the next level we should build?"** → [`roadmap.md`](roadmap.md)
- **"What story frames this curriculum?"** → [`../narrative/`](../narrative/README.md)

## See also

- [`../narrative/`](../narrative/README.md) — the story that
  frames the teaching (cosmology, philosophy, Dana's notebook)
- [`../journal/`](../journal/) — dated build-log entries
- [`../puzzles/`](../puzzles/) — battle / encounter mechanic
  drafts
- `src/content/levels.ts` — current level metadata in code
- `src/content/enemies.ts` — encounter table
- `src/content/cases.ts` — patient cases
