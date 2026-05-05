# Curriculum spine

What the game teaches, organized by level. The spine that the
hospital floors and Waiting Room wings hang off of. Mechanics
follow content; this doc is upstream of the puzzle/battle work.

## Design principles

Two registers, intentionally:

- **Hospital — warm, slow, human, serious.** Fluorescent lights, a
  patient who needs help, a billing manager who's tired. Heavier
  topics (a denied transplant, a charity-care decision, a surprise
  bill that wrecks someone's month) carry their weight here. NPCs
  have names, departments, days. Animal-Crossing cozy.
- **Waiting Room — surreal, fast, comic, cathartic.** When a topic
  is heavy in the hospital, the Waiting Room is the release valve.
  The Reaper who carries an hourglass-blade is *funny*; the
  bureaucrat-spirit issuing pronouncements is *funny*. Terry
  Gilliam by way of Spirited Away. Patients don't appear here —
  only the *machinery* that processes them.

Heavy in hospital → light surrealism in the matching Waiting Room
location. The two registers are how we teach hard content without
being grim.

The narrative through-line that braids these registers together —
why the Waiting Room exists, what the two layers mean, who Dana is
and why her notebook matters — lives in
[`narrative.md`](narrative.md). This doc focuses on *what* each
level teaches; the narrative doc focuses on *how the story frames
it*.

## Three axes

Most healthcare-finance curricula pick one. The game wants all three
because it's uniquely positioned to *show* their interaction.

1. **Phase axis** — where in the lifecycle of a claim does this
   happen? Front-end → middle → back-end → patient. This is the
   spine of the level progression.
2. **Actor axis** — whose job is this? Registrar, UM nurse, coder,
   CDI, biller, AR analyst, compliance officer, the patient. The
   cast.
3. **Document axis** — what artifacts does this work happen *on*?
   Card, eligibility response, chart, claim form, EOB, ERA,
   statement, audit letter. The playing field.

## Parallel map structure (Hospital ↔ Waiting Room)

Each level has a Hospital floor and a Waiting Room area that
mirror each other spatially. A room on the Hospital side has a
matching station/manifestation on the Waiting Room side, at
roughly the same map position. The "gap" the player crosses to
descend is in-place — you don't teleport, you fall through.

Concretely:

```
HOSPITAL L4 (Coding & Documentation floor)              WAITING ROOM L4 wing(s)
+------------------------------------------+            +------------------------------------------+
| HIM        CDI workroom    Phys office   |            | Wraith      Bundle              CDM-     |
|                                          |            |                                  Specter |
|       lobby/hallway        charge cap.   |  --gap-->  |       gap/portal    chargemaster shrine  |
|                                          |            |                                          |
+------------------------------------------+            +------------------------------------------+
```

Two implications for content:

- An encounter's Hospital "origin room" determines where it lives
  in the Waiting Room (and on the in-game map).
- The mirror is *thematic*, not literal. An HIM department becomes
  a Wraith of half-finished documentation, not a department-shaped
  ghost. The mirror is funhouse, not low-res.

Today's Waiting Room already has named wings (Eligibility / Coding
/ Billing / Appeals). The next pass per level should produce
specific *stations* within those wings keyed to specific Hospital
rooms.

## Per-level breakdown

Each level lists: **concepts**, **documents**, **actors**, **hospital
rooms**, **Waiting Room stations**, and what content already exists
vs. what the level still needs.

### L1 · Orientation — "What is a claim?"

- **Concepts:** the revenue cycle as a whole; what an encounter is;
  what a claim is; the lifecycle from arrival → discharge → bill →
  payment.
- **Documents:** insurance card; superbill (concept); a complete
  read-only CMS-1500.
- **Actors:** you (analyst); a friendly mentor (Dana); a billing
  manager (Kim).
- **Hospital rooms:** lobby; your desk; Dana's office; Kim's office.
- **Waiting Room stations:** the Lobby of Lost Claims (establishing
  shot — chairs occupied by paper files with faces, a ticket counter
  that never moves). No fights yet.
- **Existing:** `case_level1_cms`; encounters `co_109`, `co_22`.

### L2 · The Front Door — "Did the front desk get it right?"

- **Concepts:** patient access; demographics; insurance verification
  (270/271); benefit basics; **plan types — HMO / PPO / EPO / HDHP /
  HMO-MA / PPO-MA / Medicaid managed care** (gap: payer-type
  literacy); in-network vs out-of-network; **eligibility-vendor
  workflow** (gap: vendor management — eligibility APIs aren't always
  the payer); COB chain initialization.
- **Documents:** registration form; insurance card; 271 response;
  benefits summary.
- **Actors:** registrar; financial counselor; **the patient at the
  front desk**; vendor's eligibility platform (offstage).
- **Hospital rooms:** registration desk; self-serve kiosks; financial
  counseling office; manager's office.
- **Waiting Room stations:** Eligibility Fog (✅); a "Wrong Card"
  mirror archetype (gap — the patient handed over a card that no
  longer exists; the spirit hands you back unreadable IDs).
- **Existing:** `eligibility_fog`, `case_fog_nguyen`, encounters
  `co_109`, `co_16`, `reject_277ca`.

### L3 · The Gate — "Should this service even happen yet?"

- **Concepts:** prior authorization (278); notification vs auth vs
  predetermination; concurrent review for inpatient stays; peer-to-
  peer review; retroactive auth windows.
- **Documents:** 278 request/response; payer's UM criteria
  (e.g. MCG / InterQual); peer-to-peer call notes.
- **Actors:** UM nurse; precert coordinator; ordering physician;
  payer's medical director (offstage).
- **Hospital rooms:** UM office; fax room (yes, still); precert
  coordinator's desk; phone bank for peer-to-peer.
- **Waiting Room stations:** Prior Auth Gatekeeper (✅).
- **Existing:** `co_197` Gatekeeper, `case_gatekeeper_okafor`.
- **Note:** the Wraith was previously listed here — moved to L4,
  where the teaching (CDI / documentation) actually lives.

### L4 · The Copy — "Does the chart say what the bill says?"

- **Concepts:** clinical documentation; CDI queries; specificity
  (I50.9 vs I50.42); severity coding (CCs / MCCs); diagnosis vs
  reason for visit; principal vs secondary diagnoses; **introduction
  to charge capture / CDM** (gap: charge capture starts here as
  "what got documented but didn't appear on the bill?", continues
  into L6).
- **Documents:** H&P, progress notes, op note, discharge summary,
  CDI query template; **chargemaster row** (gap: introduce the CDM
  artifact).
- **Actors:** physician; CDI specialist; HIM; **charge capture
  coordinator** (gap).
- **Hospital rooms:** HIM; CDI workroom; physician's office;
  **chargemaster review room** (gap).
- **Waiting Room stations:** Medical Necessity Wraith (✅, **moved
  here from L3/L7**); Bundling Beast (✅); a "CDM Specter" gap
  archetype for missed charges.
- **Existing:** `co_50` Wraith (re-homed to this level),
  `co_11`, `co_97` Bundle, `case_wraith_walker`, `case_bundle_kim`,
  `case_level1_ub`.

### L5 · The Library — "What do the rules actually say?"

- **Concepts:** medical policy (LCD / NCD); NCCI edits; payer policy
  bulletins; medical necessity definitions; **fee schedules and
  contract terms** (gap: actually teach contract math — allowed
  amount, lesser-of, withholds, carve-outs); **vendor: policy
  research databases** (offstage).
- **Documents:** LCD article; NCCI edit table; payer policy PDF;
  **contract excerpt with fee schedule attachment** (gap); payer
  provider manual.
- **Actors:** payer medical director (offstage); **contract
  manager** (gap — needs an NPC); you as researcher.
- **Hospital rooms:** contract management office; a literal library
  of binders that quietly updates itself.
- **Waiting Room stations:** infinite shelves whose pages reorder
  when you look away; a "Fee Schedule Cartographer" gap archetype
  who keeps redrawing the math; possibly a librarian-spirit who
  asks for the right citation.
- **Existing:** none yet — this level is mostly a gap. Encounters
  `co_50`, `co_11` re-used here can be reframed once they have
  Library-specific cases.

### L6 · The Conveyor — "How does the claim leave the building?"

- **Concepts:** **charge capture / CDM in depth** (gap: full
  treatment — chargemaster maintenance, late charges, missed
  charges, charge integrity); claim assembly (837P vs 837I);
  clearinghouse; front-end edits (277CA); claim scrubbers; EDI loops
  / segments at a high level; **vendor management** (gap:
  clearinghouse and scrubber vendors are real characters in the
  rev cycle, currently invisible).
- **Documents:** CDM row; 837 EDI sample; 277CA reject; scrubber
  report; **vendor SLA / queue dashboard** (gap).
- **Actors:** biller; charge integrity analyst; **clearinghouse
  vendor rep** (gap NPC); data analyst.
- **Hospital rooms:** billing office; CDM management; server room
  (clearinghouse); a corner desk where someone fights the vendor.
- **Waiting Room stations:** Documentation Sprite Swarm (✅);
  Duplicate Claim Doppelgänger (✅); a "Vendor Lich" / clearinghouse
  archetype could go here (gap).
- **Existing:** `co_16`, `co_16_swarm`, `reject_277ca`,
  `co_18_doppelganger`, `case_swarm_yamada`, `case_doppel_reyes`.

### L7 · The Courtroom — "What did the payer decide?"

- **Concepts:** adjudication; the 835 ERA; CARC vs RARC; allowed
  amount, paid amount, contractual adjustment, patient
  responsibility; **underpayments — paid less than contract**
  (gap: huge in real RCM); partial payments; remit posting;
  **AR aging buckets — 0–30 / 31–60 / 61–90 / 90+** (gap: triage
  logic).
- **Documents:** 835 ERA; EOB; payer letter; **AR aging report**
  (gap); **contract-vs-paid variance report** (gap).
- **Actors:** payer claim adjudicator (offstage); payment poster;
  AR analyst; **underpayment specialist** (gap NPC).
- **Hospital rooms:** payment posting area; AR floor; cash room;
  **underpayment desk** (gap).
- **Waiting Room stations:** courtroom of stamped denials; Reaper
  (✅) lives here; **Underpayment Specter** (gap — appears to pay
  in full, then short-changes you on the way out); **Aging-Bucket
  Layers** (gap — older claims sink to deeper, dustier rooms).
- **Existing:** `co_29_reaper`, `case_reaper_park`, `co_50`,
  `co_97`, `oa_23`.

### L8 · The River — "Who pays what's left?"

This is the most expansive level after the gap absorption — and the
heaviest emotionally. Lean Hospital-side weight on patient stories;
lean Waiting Room surrealism for the release valve.

- **Concepts:** patient cost-share waterfall (deductible →
  coinsurance → copay → OOP max); HDHPs and the deductible-cliff
  trap; **NSA (No Surprises Act)** (gap: surprise billing,
  air-ambulance / out-of-network ER carve-outs, IDR process);
  **good-faith estimates (GFE)** (gap); balance billing rules;
  statement cadence; **bad debt vs charity care vs financial
  assistance** (gap: the *positive* path — screen for charity, not
  collect); **payment plans** (gap); **AR aging from the patient
  side** (linked to L7).
- **Documents:** EOB; GFE; patient statement; financial assistance
  application; AR aging report (patient side); NSA disclosure
  forms.
- **Actors:** patient financial services rep; **the patient as
  named NPC** (per the design principle — patients can speak here);
  state regulator (offstage in NSA cases).
- **Hospital rooms:** PFS counter; billing window; **financial
  assistance office** (gap); statement room; counseling room for
  hard conversations.
- **Waiting Room stations:** river of unread bills; ghost
  statements; **a "Surprise Bill Specter"** (gap — appears in the
  ER wing wearing an out-of-network mask); a "Charity Lighthouse"
  release-valve station that lights the way out.
- **Existing:** `pr_204`, `co_109` — both real but neither carries
  the patient-cost-share weight on its own. This level needs new
  encounters and cases.

### L9 · The Maze — "Whose plan pays first?"

- **Concepts:** COB chain; primary / secondary / tertiary; Medicare
  Secondary Payer rules; birthday rule for kids; TRICARE / VA edge
  cases; OA-23 cascading; "the spouse's plan" trap.
- **Documents:** primary 835; secondary claim; COB questionnaire.
- **Actors:** member services (payer side); COB desk;
  the patient (again).
- **Hospital rooms:** COB desk; spreadsheet hell.
- **Waiting Room stations:** COB Hydra (✅).
- **Existing:** `oa_23_hydra`, `case_hydra_okwu`.

### L10 · The Audit — "Was any of this defensible?"

- **Concepts:** RAC; Medicare integrity contractors; payer pre-
  payment audits; documentation defense; coding compliance;
  upcoding / downcoding; the False Claims Act (background); medical
  record (M&R) requests; recoupments.
- **Documents:** audit demand letter; requested chart packet;
  response template; recoupment letter.
- **Actors:** auditor; compliance officer; you defending your
  earlier work; the medical director who signs off.
- **Hospital rooms:** conference room with auditors and binders.
- **Waiting Room stations:** mirror room — every shortcut from
  earlier levels reflected back; Quarterly Audit boss (✅).
- **Existing:** `boss_audit`, `case_audit_finale`.

## Cross-cutting concerns

These thread through levels, not their own level.

| Concern | Lives most in | Touches |
|---|---|---|
| Denial taxonomy (CARC/RARC) | L7 | every level |
| Compliance / doc defense | L10 | L4, L5, L6 |
| Patient experience | L8 | L2, L3, L7 |
| Time pressure (filing windows) | L7 | every back-end level |
| Vendor / clearinghouse | L6 | L2, L7 |
| Health equity / financial harm | L8 | L2, L7 |
| Charge capture / CDM | L6 | L4 (intro) |
| AR aging / triage | L7 | L8 |

## Worked example — L4 · The Copy

To make the parallel-map structure concrete. (Other levels need the
same treatment in a follow-up pass.)

### Hospital — Coding & Documentation floor

| Room | What happens here | Candidate NPCs / cases |
|---|---|---|
| **Lobby / hallway** | Walk-through; orientation board explains "the chart is the truth, the bill is the claim about the truth." | A poster with the day's CDI metrics. |
| **HIM** | Records-of-truth. NPC: HIM director who explains chart structure, principal vs secondary dx, what an op note is. | Hands the player a real chart packet to read; uses `case_level1_ub` as the touchstone artifact. |
| **CDI workroom** | The query workflow. NPC: CDI specialist (Martinez) shows how to write a non-leading query. | Existing `case_wraith_walker` lives here. |
| **Physician's office** | The other end of the query. NPC: a tired internist (Dr. Park) who needs CDI to be terse. | Roleplay: send a query, watch them respond. |
| **Chargemaster review room** *(new)* | Where charges leak. NPC: charge integrity analyst introduces the CDM. | New encounter / case: "the chart says they got the drug; the bill doesn't." Teaches charge capture. |

### Waiting Room — L4 wing

| Station | Surreal manifestation | Mirrors which Hospital room | Existing? |
|---|---|---|---|
| **Wraith Hollow** | Half-finished documentation as ghost. Investigation puzzle: assemble facts from chart and LCD. | CDI workroom | ✅ `co_50` |
| **Bundle Pen** | A two-headed beast that keeps insisting two services are one. | HIM (the chart shows two separate things; the bill fused them) | ✅ `co_97` |
| **CDM Specter** *(new)* | A figure draped in chargemaster rows; whatever it touches becomes "no charge on file." | Chargemaster review room | gap |

### Map correspondence

The L4 hospital floor and L4 Waiting Room wing share the same
coordinate frame. The chargemaster review room (Hospital) and the
CDM Specter station (Waiting Room) sit at the same (x, y). Walking
to that location and "descending" puts the player at the right
station. This is the pattern future levels should follow.

## Stuck claim case template

Every new encounter or case (existing or proposed) should be able
to answer this template. Use it when authoring `Encounter` /
`PatientCase` content; if a slot is blank, you're not done yet.

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

A worked instance for an existing case (`case_wraith_walker`) is in
`reference/puzzles/puzzles-current.md` (informally — should be
formalized when we do the next per-encounter pass).

## Identified gaps (post-distribution)

Most of the gaps from v1 of this doc are now folded into specific
levels above. What's still genuinely missing is *content authoring
work* — encounters and cases that fill the slots:

- L2: payer-type literacy encounter; "Wrong Card" archetype
- L4: chargemaster room + CDM Specter encounter + matching case
- L5: this level is mostly a gap — needs library-specific
  encounters / cases / NPC (contract manager)
- L6: vendor management / clearinghouse archetype
- L7: Underpayment Specter encounter + AR aging treatment
- L8: NSA, surprise billing, charity care, GFE — multiple new
  encounters / cases needed; this is the level most underbuilt
  relative to its real-world weight

## Open questions for the next pass

The v1 questions are answered. New ones for the room-level pass:

1. **Hospital floor maps.** Each level needs a hospital room layout.
   Build them in `src/content/maps/levelN.ts` like Level 1, or
   handcraft per-level in a new format that's denser (more rooms,
   fewer hallways)?
2. **NPC roster.** The current 7 NPCs (Dana, Kim, Jordan, Alex,
   Martinez, Sam, Pat) get thin past L5. Add specialists per level
   (charge integrity analyst, contract manager, underpayment
   specialist, financial counselor) — each level introduces 1–2
   new NPCs?
3. **The patient as NPC.** Per the design principle, patients can
   appear in Hospital rooms (PFS counter, financial counseling).
   Do they get full NPC IDs in `npcs.ts`, or are they a separate
   "Patient" concept (one-off, attached to a case)?
4. **Cross-level threading.** A case introduced at L2 (a particular
   patient's claim) might re-appear at L7 (now adjudicating) and
   L8 (now landing in patient hands). Worth modeling, or one
   case = one level?
5. **Chargemaster vs charge capture.** L4 introduces the CDM, L6
   teaches it in depth. Is that the right split, or should both
   live in L6?

## Recommendation for next steps

1. **Lock this doc** (review + merge or revise).
2. **L4 first.** Build the worked-example treatment in code: add
   the chargemaster review room (Hospital) and the CDM Specter
   station (Waiting Room) at parallel map positions; author the
   matching encounter + case using the template.
3. **L5 second.** Most underbuilt; start it from scratch the right
   way (Library NPCs, contract manager, fee schedule encounter).
4. **L8 third.** Most ambitious; use L4's pattern.
5. Mechanics decisions get made *per level / per encounter* during
   that work, not in advance.

## See also

- [`narrative.md`](narrative.md) — cosmology, philosophy, Dana
  and the notebook, L10 reveal, tone guidelines
- `reference/journal/2026-05-03-v3-the-waiting-room.md` — original
  game design
- `reference/journal/2026-05-04-build-plan.md` — engineering plan
- `reference/journal/2026-05-05-battle-mechanics-and-form-bridge.md`
  — mechanic catalog (current battle implementation)
- `reference/puzzles/puzzles-current.md` — battle DNA snapshot
- `reference/puzzles/puzzles-draft.md` — puzzle reframe drafts
- `src/content/levels.ts` — current level metadata
- `src/content/enemies.ts` — encounter table
- `src/content/cases.ts` — patient cases
- `src/content/maps/level1.ts` — example hospital floor map
