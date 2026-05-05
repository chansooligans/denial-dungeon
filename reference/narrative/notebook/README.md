# The notebook

The player's primary progression artifact for the narrative
arc. Dana hands the player a copy of pages 1-3 on day one;
the rest of the notebook decodes / reveals as the player
progresses through levels.

## Files in this folder

- [`pages.md`](pages.md) — 12-page outline (will grow into
  actual page text per page).
- [`reveal-timeline.md`](reveal-timeline.md) — the per-level
  beats of Dana's reveal, paced from L4 → L10.

## How the notebook works

### Dana's notebook

A hand-bound notebook, dog-eared, full of annotations,
color-coded with sticky tabs that have curled with time.

- **Pages 1-3** unlock at L1. Establish cosmology + philosophy.
- **Pages 4-11** "decode" / appear as the player reaches each
  later level — one new page per level.
- The handwriting changes subtly across the run. Page 3 is
  neat; page 6 has more crossings-out; page 9 is annotated in
  two different inks; page 12 is a stranger's hand that you'll
  recognize.
- Late pages have annotations that *appear between sessions* —
  ink the player didn't see Dana write.

The notebook's voice is Dana's voice — wise + warm. See
[`../characters/dana.md`](../characters/dana.md) for the tonal
anchor and the page-1 voice example.

### The player's own notebook (apprentice → peer)

Around L5 or L6, Dana gives the player a *blank* notebook. The
line is something like:

> *"I think you're ready."*

The player doesn't write it explicitly. The game writes it for
them — an automatic journal that records what they've noticed,
which encounters they've resolved, which trapped souls they've
spoken with. It's the player's record of their own
transformation.

Late game, the player can write *back* into Dana's notebook in
their own hand. Annotations on top of her annotations. The
apprentice is now a peer. The notebook has become a
conversation.

This is also a quiet way to mark **ending eligibility** — the
player who has filled their own notebook has done the
documentation work. The player who left it sparse hasn't. See
[`../endings.md`](../endings.md) for how eligibility maps to
endings.

## Implementation thoughts (for later)

- The notebook should probably be its own UI surface (a screen
  the player can open from the Hospital), not a battle-state
  thing. Likely a new Phaser scene.
- Page text could live alongside dialogue in
  `src/content/dialogue.ts`, or as its own content type
  (`src/content/notebook.ts`) — TBD.
- The "wet ink" / "page that wasn't there yesterday" effect is
  worth doing well — small visual touches sell the cosmology.

## See also

- [`pages.md`](pages.md) — the 12-page outline
- [`reveal-timeline.md`](reveal-timeline.md) — when Dana's
  state slips, beat by beat
- [`../characters/dana.md`](../characters/dana.md) — the voice
  the notebook speaks in
