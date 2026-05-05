# Three axes

Most healthcare-finance curricula pick one axis and ignore the
other two. The game wants all three because it's uniquely
positioned to *show* their interaction.

## 1. Phase axis

Where in the lifecycle of a claim does this happen? Front-end →
middle → back-end → patient.

This is the spine of the level progression. L1 is orientation;
L2-L3 are front-end (registration, eligibility, prior auth);
L4-L6 are middle (documentation, coding, claim submission); L7
is adjudication; L8 is patient billing; L9-L10 are coordination
and audit.

Walking through the levels in order is walking through one
claim's lifecycle.

## 2. Actor axis

Whose job is this? Registrar, UM nurse, coder, CDI specialist,
biller, AR analyst, compliance officer, the patient.

The cast. Each level introduces 1–2 new specialists with their
own room, their own routine, their own reason for being there.
The player learns who does what work, not just what work gets
done.

For the current NPC roster + which levels they live in, see
`src/content/npcs.ts`. For the gap (most levels need additional
specialists), see [`open-questions.md`](open-questions.md).

## 3. Document axis

What artifacts does this work happen *on*? Card, eligibility
response, chart, claim form, EOB, ERA, statement, audit
letter.

The playing field. Every interaction in the game ultimately
manipulates a document. The player learns to read these
artifacts the way an analyst would — what each box means, what
goes wrong when fields are blank, what the payer is actually
saying when they cite a CARC code.

The ClaimSheet renderer (`src/battle/ClaimSheet.ts`) renders
real CMS-1500 and UB-04 layouts. Future levels add EOB, ERA,
audit packet renderers as new document types come online.

## Why all three

- Phase alone (chronological) = the player learns what happens
  when, but not who does it or what they do it on.
- Actor alone (job-based) = the player learns specialists, but
  not how their work fits the lifecycle.
- Document alone (form-based) = the player learns to read forms
  but not who signed them or when.

The game's strength is *connecting* them. A specific specialist,
at a specific phase, working on a specific document, hands a
stuck claim to the player. That's the unit. The curriculum
delivers concept content by varying which axis is in the
foreground at each moment.

## See also

- [`README.md`](README.md) — folder index
- [`levels/`](levels/) — per-level breakdowns; each level shows
  all three axes
- [`map-structure.md`](map-structure.md) — how phase + document
  combine into the parallel hospital ↔ Waiting Room layout
