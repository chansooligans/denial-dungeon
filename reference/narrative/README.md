# Narrative

Lore, characters, tone, and story arc for *Denial Dungeon*.
This folder is the *how the story frames the teaching* layer.
Curriculum (what to teach) is one level up at
[`../curriculum/README.md`](../curriculum/README.md).

Authored as small focused files so we can edit one piece at a
time without rebuilding the whole picture.

## The braid

Three threads, picked from the brainstorm. Each does a different
job; together they're the spine of the game.

| Thread | Job | Lives in |
|---|---|---|
| **A · Cosmology** | Worldbuilding | [`cosmology.md`](cosmology.md) |
| **C · Philosophy** | What it means | [`philosophy.md`](philosophy.md) |
| **D · Personal hook** | Why we care | [`characters/dana.md`](characters/dana.md) + [`notebook/`](notebook/) |

A is the worldbuilding (unresolved claims accumulate). C is what
the worldbuilding *means* (the truth of people vs. the truth of
forms). D is why we care about *this particular player* doing
this work (Dana's notebook, the slow reveal, the L10 choice).

## Folder map

```
narrative/
├── README.md            this file (the braid + folder map)
├── cosmology.md         A — unresolved claims accumulate
├── philosophy.md        C — two truths
├── tone.md              register guide + dreamlike-fall pacing
├── archetypes.md        existing → cosmological-resonance mapping
├── endings.md           ⚠ PROVISIONAL — L10 reveal, child claim, branches
├── open-questions.md    what's still up for shaping
├── characters/
│   ├── dana.md          mentor; voice; arc; her last claim
│   └── trapped-souls.md the others (specific, ambivalent, not saints)
└── notebook/
    ├── README.md        notebook as progression artifact + player's notebook
    ├── pages.md         12-page outline (will grow into actual page text)
    └── reveal-timeline.md L4 → L10 build of Dana's reveal
```

## Where to look for what

- **"What is the Waiting Room?"** → [`cosmology.md`](cosmology.md)
- **"What does it mean?"** → [`philosophy.md`](philosophy.md)
- **"Who is Dana?"** → [`characters/dana.md`](characters/dana.md)
- **"How does the notebook work?"** → [`notebook/README.md`](notebook/README.md)
- **"When does the player figure it out?"** → [`notebook/reveal-timeline.md`](notebook/reveal-timeline.md)
- **"What does each notebook page say?"** → [`notebook/pages.md`](notebook/pages.md)
- **"How do levels feel? How does the player descend?"** → [`tone.md`](tone.md)
- **"Why is the Bundling Beast a beast?"** → [`archetypes.md`](archetypes.md)
- **"How does the game end?"** → [`endings.md`](endings.md) (provisional)
- **"What are we still figuring out?"** → [`open-questions.md`](open-questions.md)

## See also

- [`../curriculum/README.md`](../curriculum/README.md) — what each level teaches
- [`../journal/2026-05-03-v3-the-waiting-room.md`](../journal/2026-05-03-v3-the-waiting-room.md)
  — original game-design doc
- `src/content/npcs.ts` — Dana's existing NPC data (will need
  a beat sheet once her arc is locked)
- `src/content/dialogue.ts` — existing dialogue trees (notebook
  pages will live alongside or as a new content type)
