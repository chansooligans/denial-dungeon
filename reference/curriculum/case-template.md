# Stuck-claim case template

Every new encounter or case (existing or proposed) should be
able to answer this template. Use it when authoring `Encounter`
/ `PatientCase` content; if a slot is blank, you're not done
yet.

## The template

```
ID:                      <encounter id, snake_case>
LEVEL:                   <1..10>
PHASE:                   <which level, e.g. "L4 · The Copy">
HOSPITAL ROOM:           <which room on the hospital floor>
WAITING ROOM STATION:    <surreal mirror inside the level's wing>
MAP POSITION:            <(x, y) tile in the wing>

THE PATIENT:             <one-line — name, age, plan>
THE CHART SAYS:          <what the documentation shows>
THE CLAIM SAYS:          <what got billed>
THE PAYER SAYS:          <CARC + RARC + denial language>

ROOT CAUSE FACTION:      <provider | payer | vendor | patient | employer | system>
SURFACE SYMPTOM:         <what the player sees first>
ACTUAL ROOT CAUSE:       <what's really wrong>

WHAT THE PLAYER LEARNS:  <one sentence — the takeaway>
WHAT MAKES THIS DIFFER   <one sentence — what distinguishes this from
FROM EVERY OTHER         the other encounters at this level>
ENCOUNTER:

FORM-BRIDGE PRE-FIX:     <which fields the player can fix in
                          FormScene to start the battle pre-buffed>
HOSPITAL CONVERSATION:   <which NPC hands this case to the player>
```

## Why the template matters

- Every slot is something the *player* will eventually
  perceive (the chart, the claim, the payer note, the room,
  the NPC). If we can't fill a slot, the player won't have
  anything to perceive there.
- The "WHAT MAKES THIS DIFFER" slot is the anti-redundancy
  filter. If two encounters at the same level give the same
  answer, one of them shouldn't ship.
- The "FORM-BRIDGE PRE-FIX" slot keeps the form-puzzle and
  battle in one piece — if a case has no useful pre-fix in
  FormScene, the form-bridge mechanic doesn't add value here.

## Worked instance — `case_wraith_walker`

(Informally drafted in
[`../puzzles/puzzles-current.md`](../puzzles/puzzles-current.md);
formalize when we do the next per-encounter pass.)

```
ID:                      case_wraith_walker
LEVEL:                   4
PHASE:                   L4 · The Copy
HOSPITAL ROOM:           CDI workroom
WAITING ROOM STATION:    Wraith Hollow
MAP POSITION:            (x, y) tile in the L4 Coding wing — TBD

THE PATIENT:             Arlene Walker, 67, BCBS NC PPO
THE CHART SAYS:          Patient with chronic kidney disease stage 3,
                          recent labs creatinine 2.8, documented
                          fatigue / edema / declining GFR
THE CLAIM SAYS:          93306 (echocardiography, transthoracic) for
                          I50.9 (heart failure, unspecified)
THE PAYER SAYS:          CO-50: TTE 93306 not medically necessary for
                          I50.9 without supporting evidence of LVEF<35%
                          per LCD L33526.

ROOT CAUSE FACTION:      provider
SURFACE SYMPTOM:         Payer denies medical necessity
ACTUAL ROOT CAUSE:       Diagnosis I50.9 is too unspecified; the chart
                          supports I50.42 with documented LCD criteria.

WHAT THE PLAYER LEARNS:  Medical necessity denials are won upstream in
                          CDI, before the claim drops. Specificity in
                          coding makes the difference.
WHAT MAKES THIS DIFFER   This is the investigation fight: assemble
FROM EVERY OTHER         supporting facts from chart and policy before
ENCOUNTER:               committing to the appeal.

FORM-BRIDGE PRE-FIX:     Diagnosis Code field: I50.9 → I50.42
HOSPITAL CONVERSATION:   Martinez (CDI specialist, L4 CDI workroom)
                          hands the player the case.
```

## See also

- [`README.md`](README.md) — folder index
- [`levels/`](levels/) — per-level breakdowns showing where
  each existing case fits
- [`../puzzles/puzzles-current.md`](../puzzles/puzzles-current.md)
  — battle DNA snapshot for existing encounters
- [`../narrative/archetypes.md`](../narrative/archetypes.md) —
  cosmological mapping (which kind of unresolved-ness this case
  becomes when it goes to the Waiting Room)
- `src/content/cases.ts` — current PatientCase data
- `src/content/enemies.ts` — current Encounter data
