# Narrative — cosmology, philosophy, character arcs

What the Waiting Room IS, why the player can perceive it, and the
through-line that connects the 10 levels into a story arc.

This doc is downstream of `curriculum.md` (which says *what* to
teach) and upstream of dialogue / scene authoring (which says
*how to say it*). Lore decisions live here; teaching decisions
live in curriculum.md.

## The braid

Three threads, picked from the brainstorm. Each does a different
job; together they're the spine of the game.

| Thread | Job | One-line summary |
|---|---|---|
| **A · Cosmology** | Worldbuilding | Unresolved claims accumulate into a parallel place. |
| **C · Philosophy** | What it means | The hospital is the truth of *people*; the Waiting Room is the truth of *forms*. Both real. |
| **D · Personal hook** | Why we care | Dana, the mentor, gives the player her notebook. Late game we discover she's been writing some of it from inside. |

A is the worldbuilding. C is what the worldbuilding *means*. D is
why we care about *this particular player* doing this work.

## Cosmology — unresolved claims accumulate

Plain version:

- A claim is a small, hopeful entity. *"Please pay for this care."*
- Most claims resolve. Paid, written off, satisfied.
- Some don't. Denied without remedy, time out without appeal,
  buried in 277CA loops nobody works.
- These don't vanish. They leave a *resonance*.
- The Waiting Room is what those resonances become at scale.

Implications for content:

- Every Waiting Room obstacle is a specific kind of unresolved-
  ness. Not enemies — *patterns of institutional failure made
  manifest.*
- The Wraith is the cumulative weight of every CO-50 medical-
  necessity denial that never got the right CDI packet — half-
  finished documentation given a body.
- The Reaper is every claim that timed out, sharpening its
  hourglass.
- The Hydra is every COB chain that adjudicated out of order.
- The Audit is every shortcut compounded.
- You don't kill them. You *resolve their underlying claims*.
  Resolution is the only force that releases what's stuck.

The scale bleeds in implicitly. The Waiting Room is *crowded* —
more chairs than people in the world. The size is the systemic
critique without anyone naming it.

### Why the player can perceive it

Per the cosmology — the player's *job* is to see unresolved-ness.
They're a revenue-cycle analyst. Anyone who genuinely cares about
resolution can develop the eyes for it. Most workers learn not
to. Dana could. The player can. There is no chosen-one frame.

## Philosophy — two truths

The hospital is the truth of *people*.

- Patient, doctor, family, registrar, biller.
- Names, faces, fatigue, kindness, mistakes.
- Cozy because human.

The Waiting Room is the truth of *forms*.

- CARC code, LCD criterion, NCCI edit, DRG, modifier 25.
- The system speaking in its own dialect.
- Surreal because it's the abstract made concrete.

Both real. Neither complete alone. The institution requires both,
can hold neither comfortably.

Said aloud once or twice — once by Dana at L1, possibly echoed by
the player at L10:

> *"There's the truth that bleeds, and there's the truth that
> bills. The hospital can't run without both. Most days you only
> have to hold one. Don't trust anyone who says they always know
> which is which."*

This is the philosophical core. Most workers learn to hold one
truth at a time. The player learns to hold both. That's the
education the game is actually delivering.

## Personal hook — Dana's notebook

Dana is the player's mentor. Senior revenue-cycle analyst.
Already in `src/content/npcs.ts`. She keeps a hand-bound
notebook, dog-eared, full of annotations, color-coded with
sticky tabs that have curled with time.

On day one she gives the player a copy of pages 1–3.

### The notebook as progression artifact

- **Pages 1–3** unlock at L1. Establish cosmology + philosophy.
- **Pages 4–11** "decode" / appear as the player reaches each
  later level — one new page per level.
- The handwriting changes subtly across the run. Page 3 is neat;
  page 6 has more crossings-out; page 9 is annotated in two
  different inks; page 12 is a stranger's hand that you'll
  recognize.
- Late pages have annotations that *appear between sessions* —
  ink the player didn't see Dana write.

### The reveal (slow, ambient)

The player doesn't get told. They notice.

- **L4 / L5:** Dana misses a meeting she should be at. Comes in
  late, says she "got lost downstairs." Smiles it off.
- **L7:** The player glimpses Dana in the Waiting Room — briefly,
  distantly. A figure at a desk that vanishes when looked at
  directly. When asked the next day, Dana doesn't remember.
- **L9:** A page appears in the notebook *while the player is
  reading it*. Wet ink.
- **L10:** The audit isn't just an audit — it's the door home.
  A claim defended with full documentation can pull a trapped
  soul back to the surface. Dana's last claim is in the file.

### Why this hook works

- Not a chosen-one frame. The notebook is just a senior
  colleague's cheat sheet.
- Dana's predicament IS the cosmology happening to a person —
  she failed enough patients (or witnessed enough) that a part
  of her got *stuck* in the place where unresolved claims live.
- Implicit risk to the player: same fate. Never said out loud.

## Notebook page outline (draft)

Sketches. The actual page text gets authored when we write
dialogue.

| Level | Page | Subject | Tone |
|---|---|---|---|
| L1 | 1 | The gap noticed you | Dry, conspiratorial |
| L1 | 2 | What the Waiting Room is | Cosmology stated plainly |
| L1 | 3 | Two truths | Philosophy stated plainly |
| L2 | 4 | The first hand-off | Where a person becomes a number |
| L3 | 5 | About waiting | *"The 278 is just permission to begin grieving in the right order."* |
| L4 | 6 | Chart vs. bill | Specificity. First subtle handwriting drift. |
| L5 | 7 | Reading the rules that govern care | LCDs as scripture nobody reads |
| L6 | 8 | The chute | Claims leaving the building. Handwriting more agitated. |
| L7 | 9 | Verdicts | *"Whose courtroom is this, anyway?"* |
| L8 | 10 | Bills landing in hands | The most personal page |
| L9 | 11 | Chicken | Payers passing the bill. Two inks. |
| L10 | 12 | (the reveal) | Written from inside |

## L10 reveal + ending branches

At the audit:

- The auditor reviews every claim the player has worked across
  the run (already what `boss_audit` does mechanically).
- Every shortcut shows up as a "receipt" the auditor pulls
  (existing `audit` mechanic).
- New: the auditor's file *also* contains Dana's last claim —
  abandoned when she descended.
- Defending Dana's claim alongside your own == pulling her back.

Four possible endings, falling out of two axes (clean / shortcut
run × try / don't try to fetch Dana):

| Run quality | Choice | Outcome |
|---|---|---|
| Clean | Defend Dana too | Dana returns. Both files survive the audit. |
| Clean | Don't try | Player passes audit. Dana stays. Bittersweet — no shame, but unfinished. |
| Shortcut | Defend Dana too | Both files collapse. Player is now also stuck. (Hardest ending — the cost of trying-without-foundation.) |
| Shortcut | Don't try | Player passes audit barely. Dana stays. The game's quietest ending — the system kept turning. |

Consistency with the cosmology: a claim defended fully *resolves*,
and resolution is the only force that returns something from the
Waiting Room. Dana's claim is just a claim. The mechanic is the
metaphor.

## Tone guidelines

The Waiting Room is *funny*.

- The Reaper IS scary (the death of a claim) but ALSO funny — a
  bureaucrat with a scythe and a numbered ticket.
- The Gatekeeper bows formally and recites payer policy as if it
  were poetry.
- The Hydra's three heads talk over each other about who pays
  first; one is on hold.
- The Wraith, at her worst, is mournfully assembling her own
  LCD packet on a folding table.

The Hospital is *warm*.

- NPCs have routines. Dana stops at the same coffee machine
  every morning.
- The bulletin board has a "missed-charge of the month" award.
- A patient's daughter remembers the player's name on a return
  visit.
- Someone microwaves fish at lunch and everyone is mad about it.

### Heavy → light register-flip

When a topic is heavy in the Hospital, its Waiting Room mirror
should *defuse* it through surrealism — not erase it, but give
the player a place to breathe.

- A patient devastated by a surprise bill in the Hospital
  becomes the "Surprise Bill Specter" wearing a polite party-
  mask in the Waiting Room. Same denial. Different register.
- The horror lives in the Hospital scene (the patient's face).
  The catharsis lives in the Waiting Room scene (the costume).

The horror is *witnessed*; the catharsis is *played*.

## Pacing — floor-then-floor with descent as invitation

(Lifted from the design conversation. Confirm or revise.)

- Player walks the entire Hospital floor. Talks to staff. Watches
  a patient at a counter. Reads the bulletin board.
- The notebook updates — Dana writes a new annotation, or a page
  that was blank now has text.
- The gap appears at a *meaningful spot* — wherever the player
  lingered most, or wherever the case they picked up was rooted.
  Different runs, different gap locations.
- The gap is invitation, not gate. Player can ignore it. Keep
  wandering. Talk to the same nurse twice.
- When they descend, they descend on purpose.
- Coming back up, the Hospital is *slightly altered* — a new
  flyer, an NPC saying something they didn't before, a door
  that's now open.

The two layers are mutually causing each other. The Hospital is
not just where you start; the descent changes what's there.

## How the archetypes fit the cosmology

Each existing Waiting Room archetype is now legible as a *kind of
unresolved-ness*.

| Archetype | Resonance of |
|---|---|
| Medical Necessity Wraith | Every CO-50 that didn't get the right CDI packet |
| Prior Auth Gatekeeper | Every service done without a 278 on file |
| Timely Filing Reaper | Every claim that missed its window |
| Bundling Beast | Every modifier-25 that should have been claimed |
| Duplicate Claim Doppelgänger | Every well-meaning re-submission that became a duplicate |
| Coordination Hydra | Every COB chain adjudicated out of order |
| Eligibility Fog | Every claim sent before verification |
| Documentation Sprite Swarm | Every 277CA reject driven by chart hygiene |
| The Quarterly Audit | Every shortcut taken to keep a claim alive |

Future archetypes (CDM Specter, Underpayment Specter, Surprise
Bill Specter, etc.) work the same way — name the pattern of
failure, give it a body.

## Open questions

1. **Dana's voice.** Dry/wry/wise? Or warmer/maternal? Affects
   the notebook's voice and through it, the philosophical
   register of the whole game.
2. **Pacing of the reveal.** Suspect by L4 or hold off until L7?
   Earlier is more dramatically satisfying; later preserves the
   cosmology mystery.
3. **Other trapped souls.** Is Dana the only one? If others,
   are some retrievable? At what cost?
4. **The original claim.** What was Dana's last claim — the one
   she abandoned when she descended? A child? A neighbor? A
   close call? This anchors her arc and we'll need it for L10.
5. **The player's own notebook.** Does the player start one
   themselves? Mid-late game, the player begins annotating
   Dana's notebook in their own hand — apprentice becoming
   peer. Could be a quiet way to mark the transformation.
6. **Confirm pacing.** Floor-then-floor (above) — or should
   we revisit?

## See also

- `reference/curriculum.md` — what each level teaches
- `reference/journal/2026-05-03-v3-the-waiting-room.md` —
  original game-design doc
- `src/content/npcs.ts` — Dana's current NPC data (will need a
  beat sheet once her arc is locked)
- `src/content/dialogue.ts` — existing dialogue trees (the
  notebook pages will live alongside or as a new content type)
