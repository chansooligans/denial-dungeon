# Parallel map structure (Hospital ↔ Waiting Room)

Each level has a Hospital floor and a Waiting Room area that
mirror each other spatially. A room on the Hospital side has a
matching station / manifestation on the Waiting Room side, at
roughly the same map position.

The "gap" the player crosses to descend is *in-place* — they
don't teleport, they fall through.

## Concretely

```
HOSPITAL L4 (Coding & Documentation floor)              WAITING ROOM L4 wing(s)
+------------------------------------------+            +------------------------------------------+
| HIM        CDI workroom    Phys office   |            | Wraith      Bundle              CDM-     |
|                                          |            |                                  Specter |
|       lobby/hallway        charge cap.   |  --gap-->  |       gap/portal    chargemaster shrine  |
|                                          |            |                                          |
+------------------------------------------+            +------------------------------------------+
```

## Two implications for content

- An encounter's Hospital "origin room" determines where it
  lives in the Waiting Room (and on the in-game map).
- The mirror is *thematic*, not literal. An HIM department
  becomes a Wraith of half-finished documentation, not a
  department-shaped ghost. The mirror is funhouse, not
  low-res.

## Today's state

The Waiting Room already has named wings (Eligibility / Coding
/ Billing / Appeals) in `src/scenes/WaitingRoomScene.ts`. The
next pass per level should produce specific *stations* within
those wings keyed to specific Hospital rooms.

Hospital floors today only exist for L1 (in
`src/content/maps/level1.ts`). L2-L10 hospital floors are
gaps; see [`open-questions.md`](open-questions.md) for the
question of how to author them.

## How the player descends

Per [`../narrative/tone.md`](../narrative/tone.md): the descent
is a **dreamlike fall**, not a menu choice. The player walks
the Hospital floor; at some threshold the world *takes* them
to the Waiting Room. Floor ripples, sounds slow down, lights
flicker once.

Coming back up is also dreamlike but warmer. Hospital is
slightly altered after a descent — a new flyer, an NPC saying
something they didn't before, a door now open.

## The two layers cause each other

The Hospital is not just where you start; the descent changes
what's there. Returning from the Waiting Room, the Hospital is
*slightly altered*.

This isn't a one-way trip into the dungeon and back. It's a
loop where each side reshapes the other.

## See also

- [`design-principles.md`](design-principles.md) — the cozy /
  surreal register split that gives each side its tone
- [`worked-examples/L4.md`](worked-examples/L4.md) — full L4
  treatment showing room-by-room mirror correspondence
- [`../narrative/tone.md`](../narrative/tone.md) — pacing
  details (dreamlike fall, transition implementation note)
- [`../narrative/cosmology.md`](../narrative/cosmology.md) —
  *why* the Waiting Room mirrors the Hospital (unresolved
  claims accumulate where they were made)
