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

### Dana's voice — wise and warm

The notebook's voice carries the philosophical weight of the
whole game, so this matters. Dana is:

- Someone who has seen everything and isn't shocked easy.
- Honest with the player. Doesn't deflect with sarcasm.
- Funny when funny is honest, not when funny is armor.
- *Believes in the work.* That's the warmth — she still cares
  whether the player makes it.

Less Sterling Archer, more Eve from WALL-E meets the wise senior
attorney who actually means it. Voice example for page 1:

> *"If you're reading this, the gap has noticed you. That's not
> a bad thing. It means you're paying attention. Most people in
> this building have learned not to.*
>
> *I'm going to write down what I know. Some of it will only
> make sense later. Read it anyway — twice if you need to.
> There's no shame in being slow about this."*

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

### The reveal (begins at L4, builds slowly)

The player doesn't get told. They notice.

- **L4 — first cracks.** Dana misses a meeting she should be at.
  Comes in late, smiles it off, says she "got lost downstairs."
  A page in the notebook now ends mid-sentence. Coffee cup with
  no coffee in it.
- **L5 — ambient.** Dana sometimes refers to a meeting that
  hasn't happened. Doesn't seem to notice the slip. The handwriting
  on a recent page doesn't quite match her hand.
- **L6 — the first wet ink.** A page that was blank yesterday
  has writing on it today. The ink hasn't dried.
- **L7 — the glimpse.** The player sees Dana in the Waiting
  Room — briefly, distantly. A figure at a desk that vanishes
  when looked at directly. When asked the next day, Dana
  doesn't remember.
- **L8 — the photo.** On Dana's desk in the hospital, there's a
  faded picture frame. Pediatric ward. The player notices it
  for the first time. (Foreshadow only.)
- **L9 — the page that writes itself.** A page appears in the
  notebook *while the player is reading it*. Wet ink.
- **L10 — the audit.** The audit isn't just an audit — it's the
  door home. A claim defended with full documentation can pull
  a trapped soul back to the surface. Dana's last claim is in
  the file.

L4 is a crucial choice: the cracks start at the *same level the
player learns CDI / documentation*. The metaphor foreshadows
itself — the level where unresolved-documentation manifests is
the level where the player sees the first sign Dana herself is
unfinished documentation.

### Why this hook works

- Not a chosen-one frame. The notebook is just a senior
  colleague's cheat sheet.
- Dana's predicament IS the cosmology happening to a person —
  she failed enough patients (or witnessed enough) that a part
  of her got *stuck* in the place where unresolved claims live.
- Implicit risk to the player: same fate. Never said out loud.

### The player's notebook (apprentice → peer)

Around L5 or L6, Dana gives the player a *blank* notebook.
"I think you're ready."

The player doesn't write it explicitly. The game writes it for
them — an automatic journal that records what they've noticed,
which encounters they've resolved, which trapped souls they've
spoken with. It's the player's record of their own
transformation.

Late game, the player can write *back* into Dana's notebook in
their own hand. Annotations on top of her annotations. The
apprentice is now a peer. The notebook has become a
conversation.

This is also a quiet way to mark ending eligibility — the player
who has filled their own notebook has done the documentation
work. The player who left it sparse hasn't.

## Other trapped souls

Dana is the most prominent, but she's not alone. Throughout the
Waiting Room are others who tried to fix something specific and
got stuck. They are *not* a chorus of saints; each tried something
particular and lost something particular. None are uncomplicated.

Two design rules to keep this from going cheesy:

1. **Each trapped soul tried *one specific thing*.** Not "the
   system" abstractly. Not "everyone should have healthcare." A
   specific contract. A specific policy. A specific spreadsheet.
   The specificity is the truth.
2. **Not all of them want to leave.** At least one is *happier*
   in the Waiting Room than she was in the hospital — the system
   stopped asking her to compromise. Players who try to "save"
   her find her uninterested. That ambivalence is the un-cheesy
   move.

Drafts (sketches, not committed):

| Soul | Tried to | Stuck where | Want out? |
|---|---|---|---|
| **The Coding Manager** | Hold the line against productivity-pressured upcoding | L4–L5 boundary, leafing through a coding manual she never finishes | Yes, but she's tired |
| **The Underpayment Analyst** | Built a contract-vs-paid variance tracker that worked; got laid off when leadership called underpayments "immaterial" | L7 with a spreadsheet that won't recalculate | Yes — she wants vindication |
| **The CFO** | Negotiated for a fair contract with a major payer; lost the politics | L5 Library, redrafting the same contract amendment forever | **No.** The Waiting Room stopped asking her to compromise. |
| **The Patient Advocate** | Tried to soften the hospital's collection-practice aggression | L8 (River), drafting a payment plan no one signs | Unclear; ambivalent |

Player encounters with these are optional, off-the-spine
content. Each is a small character beat that deepens the
cosmology without requiring narrative gymnastics. The CFO's
"no" is the most important — it means the game has a thesis
about ambivalence, not just rescue.

> Open: are these souls retrievable on different terms than
> Dana? Maybe yes — maybe each requires a different kind of
> resolution (an actual underpayment recovered for the analyst,
> a fair payment plan signed for the advocate). They're side
> quests with cosmological coherence.

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

## L10 reveal + endings

> ⚠ **PROVISIONAL.** The L10 endings are still being shaped. The
> structure below is a working draft — author may revise the
> branching, the conditions, or collapse to fewer endings. The
> rest of the narrative doc is built to *support* multiple
> possible endings; nothing earlier in the game commits to a
> specific one.

### Dana's last claim — the anchor

The audit file contains a claim Dana abandoned when she descended.

It was for **a child**. (Specifics deferred until L10 authoring —
name, age, condition, denial reason. The denial should be
defensible from the payer's perspective and morally wrong; that's
where the bite is. Dana fought it and lost, then descended.)

The player only learns the specifics if they earn them — clean
run, full notebook, willingness to look at what Dana could not
finish. The pediatric weight is real. We commit to it because
Dana's arc demands it.

Foreshadowing through the run (no early reveal):

- A faded photo on Dana's desk (mentioned but not zoomed,
  starting L8 per the reveal pacing above).
- A children's-floor mention from another NPC — once,
  in passing.
- A specific EOB the player might glimpse in a desk drawer.

### The audit as door

At L10:

- The auditor reviews every claim the player has worked across
  the run (existing `boss_audit` / `audit` mechanic).
- Shortcuts show up as "receipts" the auditor pulls (existing).
- The auditor's file *also* contains Dana's last claim.
- Defending Dana's claim alongside your own *is* pulling her
  back. Mechanically: same UI as defending any other case in
  the audit; thematically: a claim resolved is a soul released.

### Ending structure (draft)

Four candidate endings on two axes — *run quality* (clean /
shortcut) × *choice* (try to fetch Dana / don't):

| Run quality | Choice | Outcome (draft) |
|---|---|---|
| Clean | Defend Dana too | Dana returns. Both files survive the audit. |
| Clean | Don't try | Player passes audit. Dana stays. Bittersweet — no shame, but unfinished. |
| Shortcut | Defend Dana too | Both files collapse. Player is now also stuck. (Hardest ending — the cost of trying-without-foundation.) |
| Shortcut | Don't try | Player passes audit barely. Dana stays. The system kept turning. |

These are the *current draft*. May collapse to two or three.
May add a fifth (*"refusal"* — Dana, like the CFO above, may not
want to come back). The author is still working on this; the
middle game is built to support any of them.

### Why this works regardless of which ending lands

Consistency with the cosmology: a claim defended fully *resolves*,
and resolution is the only force that returns something from the
Waiting Room. Dana's claim is just a claim. The mechanic is the
metaphor.

Whatever specific ending lands, this principle holds. That means
the rest of the game's content can be authored confidently — the
ending refines, not rewrites.

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

## Pacing — floor-by-floor, dreamlike fall

The player doesn't *choose* to descend. The Waiting Room *takes*
them. Dreamlike, not menu-driven.

The shape of a level:

1. Player arrives at the Hospital floor. Walks it. Talks to
   staff. Watches a patient at a counter. Reads the bulletin
   board. Picks up a stuck claim or two.
2. The notebook updates — Dana writes a new annotation; a page
   that was blank now has text.
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

The descent is not a choice and not a menu — it's an event that
happens to the player. Like falling asleep mid-sentence. The
player doesn't push the button; the world does.

Implementation note (for later): the transition between scenes
should be smoother than today's instant Hospital→Battle teleport.
Probably a fade through both registers superimposed for a
moment — both layers visible, then one. The transition is
itself a moment of gameplay/atmosphere.

The two layers are mutually causing each other. The Hospital is
not just where you start; the descent changes what's there.

> Open: how *literal* is the fall? A floor that gives way
> physically? A door that opens onto a corridor? A patient who
> looks up and is suddenly the Wraith? Probably varies per
> level — the L4 descent through HIM should feel different from
> the L8 descent through PFS. To be designed level-by-level.

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

The original six questions are answered above (Dana wise+warm,
reveal at L4, other trapped souls exist, last claim was a child,
player gets a notebook, pacing is dreamlike fall). New fronts
that need attention as we keep going:

1. **Dana's child case specifics.** Eventually we need a name,
   age, condition, denial reason. Defensible from the payer's
   perspective + morally wrong. Defer until L10 authoring; the
   middle game doesn't need it locked.
2. **Trapped-soul slate.** Of the four candidates above, which
   actually ship? My recommendation: Coding Manager (yes), CFO
   (yes — the *no* one is structurally important), Underpayment
   Analyst (yes, ties to L7 gap), Patient Advocate (maybe —
   could merge with L8 work).
3. **Endings.** Will keep moving. Provisional structure above
   is built to be revised; nothing earlier in the game commits
   to one specific outcome.
4. **The descent moment per level.** Each level's "fall" wants
   its own visual language. L4 through HIM should feel
   different from L8 through PFS. Authored level-by-level.
5. **Page-text drafting cadence.** Notebook pages are 12 short
   passages. Should we write a few now (L1's pages 1–3 set the
   voice and tone for everything else) or wait until each level
   is being built?
6. **The player's voice.** When the player annotates Dana's
   notebook late game — what register? Same wise-and-warm? Or
   distinctly the player's own voice (whatever that is)?

## See also

- `reference/curriculum.md` — what each level teaches
- `reference/journal/2026-05-03-v3-the-waiting-room.md` —
  original game-design doc
- `src/content/npcs.ts` — Dana's current NPC data (will need a
  beat sheet once her arc is locked)
- `src/content/dialogue.ts` — existing dialogue trees (the
  notebook pages will live alongside or as a new content type)
