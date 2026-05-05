# Tone — registers + pacing

How each layer feels and how the player moves between them.

## The two registers

### The Waiting Room is *funny*

- The Reaper IS scary (the death of a claim) but ALSO funny — a
  bureaucrat with a scythe and a numbered ticket.
- The Gatekeeper bows formally and recites payer policy as if it
  were poetry.
- The Hydra's three heads talk over each other about who pays
  first; one is on hold.
- The Wraith, at her worst, is mournfully assembling her own
  LCD packet on a folding table.

Surreal-comic. Terry Gilliam by way of Spirited Away. The
absurdity of the system made literal — and, because absurd
systems are inherently funny, *funny*.

### The Hospital is *warm*

- NPCs have routines. Dana stops at the same coffee machine
  every morning.
- The bulletin board has a "missed-charge of the month" award.
- A patient's daughter remembers the player's name on a return
  visit.
- Someone microwaves fish at lunch and everyone is mad about it.

Animal-Crossing cozy. Quiet office sounds, fluorescent hum,
honest people doing honest work in a system that will not
honor it.

## Heavy → light register-flip

When a topic is heavy in the Hospital, its Waiting Room mirror
should *defuse* it through surrealism — not erase it, but give
the player a place to breathe.

Examples:

- A patient devastated by a surprise bill in the Hospital
  becomes the "Surprise Bill Specter" wearing a polite party-
  mask in the Waiting Room. Same denial. Different register.
- A grandparent's transplant denied for medical necessity in
  the Hospital becomes a Wraith mournfully assembling LCD
  citations. The grandparent's *face* lives in the Hospital;
  the *paperwork ghost* lives in the Waiting Room.

The horror lives in the Hospital scene. The catharsis lives in
the Waiting Room scene.

The horror is *witnessed*; the catharsis is *played*.

## Pacing — floor-by-floor, dreamlike fall

The player doesn't *choose* to descend. The Waiting Room *takes*
them. Dreamlike, not menu-driven.

### The shape of a level

1. Player arrives at the Hospital floor. Walks it. Talks to
   staff. Watches a patient at a counter. Reads the bulletin
   board. Picks up a stuck claim or two.
2. The notebook updates — Dana writes a new annotation; a page
   that was blank now has text. (See
   [`notebook/reveal-timeline.md`](notebook/reveal-timeline.md)
   for the per-level beats.)
3. At some threshold (when the player has seen enough to *know*
   the floor's shape), the descent triggers.
4. **The transition is dreamlike.** A door opens onto a corridor
   that wasn't there. The floor ripples. Sounds slow down.
   Lights flicker once. The player is *somewhere else* without
   having decided to go.
5. Player works the Waiting Room wing. Resolves what's there.
6. Returns up — also dreamlike, but warmer. The hospital is
   *slightly altered* — a new flyer, an NPC saying something
   they didn't before, a door that's now open.

### The descent is not a choice

It's an event that happens to the player. Like falling asleep
mid-sentence. The player doesn't push the button; the world
does.

### Implementation note (for later)

The transition between scenes should be smoother than today's
instant Hospital→Battle teleport. Probably a fade through both
registers superimposed for a moment — both layers visible, then
one. The transition is itself a moment of gameplay /
atmosphere.

### Per-level descent variation

How *literal* is the fall? A floor that gives way physically? A
door that opens onto a corridor? A patient who looks up and is
suddenly the Wraith?

Probably varies per level — the L4 descent through HIM should
feel different from the L8 descent through PFS. To be designed
level-by-level. (Tracked in
[`open-questions.md`](open-questions.md).)

## The two layers cause each other

The Hospital is not just where you start; the descent changes
what's there. Returning from the Waiting Room, the Hospital is
slightly altered — a new flyer, an NPC saying something they
didn't before, a door that's now open.

This isn't a one-way trip into the dungeon and back. It's a
loop where each side reshapes the other. Both layers are real,
both are partial, and *the player* is the only thread between
them.
