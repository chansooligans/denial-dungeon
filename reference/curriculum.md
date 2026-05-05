# Curriculum spine

What the game teaches, organized by level. The spine that the
hospital floors and Waiting Room wings hang off of. Mechanics
follow content; this doc is upstream of the puzzle/battle work.

## Three axes

Most healthcare-finance curricula pick one. We want all three
because the game is uniquely positioned to *show* their interaction.

1. **Phase axis** — where in the lifecycle of a claim does this
   happen? Front-end → middle → back-end → patient. This is the
   spine of the level progression.
2. **Actor axis** — whose job is this? Registrar, UM nurse, coder,
   CDI, biller, AR analyst, compliance officer, the patient. This
   is the cast.
3. **Document axis** — what artifacts does this work happen *on*?
   Card, eligibility response, chart, claim form, EOB, ERA,
   statement, audit letter. This is the playing field.

## Mapping convention

- Each **Hospital level** is a *phase* with a few *rooms*. Each
  room corresponds to an actor or a document.
- Each **Waiting Room wing** is the surreal mirror of the same
  level's phase, where the *consequences* of getting it wrong
  personify themselves.
- Problems found in a hospital room manifest as obstacles in the
  matching wing, located at corresponding map positions.

This is upstream of mechanics. No HP. No "tools." The Hospital
side feels like Animal-Crossing-cozy office work; the Waiting
Room feels like a Terry-Gilliam bureaucratic afterlife.

## Per-level breakdown

Each level lists: concepts, documents, actors, candidate hospital
rooms, candidate Waiting Room manifestations, and existing
content (encounters / cases) that live there.

### L1 · Orientation — "What is a claim?"

- **Concepts:** the revenue cycle as a whole; what an encounter
  is; what a claim is; the lifecycle from arrival → discharge →
  bill → payment
- **Documents:** insurance card; superbill (concept); a complete
  CMS-1500 (read-only)
- **Actors:** you (analyst); a friendly mentor; one billing manager
- **Hospital rooms:** lobby, your desk, mentor's office
- **Waiting Room:** the lobby of lost claims — establishing shot
  only, no fights yet
- **Existing:** `case_level1_cms`; encounters `co_109`, `co_22`

### L2 · The Front Door — "Did the front desk get it right?"

- **Concepts:** patient access, demographics, insurance
  verification, eligibility (270/271), benefit basics, plan types
  (HMO/PPO/HDHP/HMO-MA/PPO-MA), in-network vs out-of-network, COB
  chain initialization
- **Documents:** registration form, insurance card, 271 response,
  benefits summary
- **Actors:** registrar, financial counselor, patient
- **Hospital rooms:** registration desk, kiosks, financial
  counseling
- **Waiting Room:** Eligibility Fog (mechanic exists); a "Wrong
  Card" mirror archetype is a possible add
- **Existing:** `eligibility_fog`, `case_fog_nguyen`, encounters
  `co_109`, `co_16`, `reject_277ca`

### L3 · The Gate — "Should this service even happen yet?"

- **Concepts:** prior authorization (278), notification vs auth vs
  predetermination, concurrent review, peer-to-peer, retroactive
  auth windows
- **Documents:** 278 request/response, payer's UM criteria
  (e.g. MCG/InterQual), peer-to-peer call notes
- **Actors:** UM nurse, precert coordinator, ordering physician,
  payer's medical director (offstage)
- **Hospital rooms:** UM office, fax room, precert coordinator's
  desk
- **Waiting Room:** Prior Auth Gatekeeper exists
- **Existing:** `co_197` Gatekeeper, `case_gatekeeper_okafor`,
  `co_50` Wraith (possibly belongs in L4 or L5)

### L4 · The Copy — "Does the chart say what the bill says?"

- **Concepts:** clinical documentation; CDI queries; specificity
  (I50.9 vs I50.42); severity coding (CCs/MCCs); diagnosis vs
  reason for visit; principal vs secondary diagnoses
- **Documents:** H&P, progress notes, op note, discharge summary,
  CDI query template
- **Actors:** physician, CDI specialist, HIM
- **Hospital rooms:** HIM, CDI workroom, physician's office
- **Waiting Room:** Medical Necessity Wraith exists
- **Existing:** `co_50` Wraith, `co_11`, `co_97` Bundle,
  `case_wraith_walker`, `case_bundle_kim`, `case_level1_ub`

### L5 · The Library — "What do the rules actually say?"

- **Concepts:** medical policy (LCD/NCD), NCCI edits, payer
  policy bulletins, medical necessity definitions, fee schedules,
  contract terms
- **Documents:** LCD article, NCCI table, payer policy PDF,
  contract excerpt, payer provider manual
- **Actors:** payer medical director, contract manager, you
  (researcher)
- **Hospital rooms:** contract management office; a literal
  library of binders that updates quietly
- **Waiting Room:** infinite shelves; pages reorder when looked
  away from. **No archetype yet — gap.**
- **Existing:** encounters `co_50`, `co_11` (re-used)

### L6 · The Conveyor — "How does the claim leave the building?"

- **Concepts:** charge capture, CDM (charge description master),
  claim assembly, 837P vs 837I, clearinghouse, front-end edits
  (277CA), claim scrubbers, EDI loops/segments at a high level
- **Documents:** CDM row, 837 EDI sample, 277CA reject, scrubber
  report
- **Actors:** biller, vendor (clearinghouse), data analyst,
  charge capture coordinator
- **Hospital rooms:** billing office, server room (clearinghouse)
- **Waiting Room:** Documentation Sprite Swarm; Duplicate
  Doppelgänger
- **Existing:** `co_16`, `co_16_swarm`, `reject_277ca`,
  `co_18_doppelganger`, `case_swarm_yamada`, `case_doppel_reyes`

### L7 · The Courtroom — "What did the payer decide?"

- **Concepts:** adjudication; the 835 ERA; CARC vs RARC; allowed
  amount, paid amount, contractual adjustment, patient
  responsibility; underpayments; partial payments; remit posting
- **Documents:** 835 ERA, EOB, payer letter
- **Actors:** payer claim adjudicator (offstage), payment poster,
  AR analyst
- **Hospital rooms:** payment posting area, AR floor
- **Waiting Room:** courtroom of stamped denials; Reaper exists.
  **Underpayment specters / contractual-adjustment scribes are
  gaps.**
- **Existing:** `co_29_reaper`, `case_reaper_park`, `co_50`,
  `co_97`, `oa_23`

### L8 · The River — "Who pays what's left?"

- **Concepts:** patient cost-share (deductible → coinsurance →
  copay → OOP max); HDHPs; NSA (No Surprises Act); good-faith
  estimates; balance billing rules; statement cadence; bad debt
  vs charity care; payment plans
- **Documents:** EOB, GFE, patient statement, financial
  assistance application, AR aging report
- **Actors:** patient financial services rep, the patient,
  sometimes a state regulator
- **Hospital rooms:** patient financial services, billing window
- **Waiting Room:** river of unread bills; ghost statements;
  patient-shaped silhouettes asking what their bill means.
  **No archetype yet — gap.**
- **Existing:** `pr_204`, `co_109`

### L9 · The Maze — "Whose plan pays first?"

- **Concepts:** COB chain; primary/secondary/tertiary; Medicare
  Secondary Payer rules; birthday rule for kids; tricare/VA edge
  cases; OA-23 cascading; "the spouse's plan" trap
- **Documents:** primary 835, secondary claim, COB questionnaire
- **Actors:** member services (payer), COB desk, the patient
- **Hospital rooms:** COB desk, spreadsheet hell
- **Waiting Room:** COB Hydra exists
- **Existing:** `oa_23_hydra`, `case_hydra_okwu`

### L10 · The Audit — "Was any of this defensible?"

- **Concepts:** RAC, Medicare integrity contractors, payer
  pre-payment audits; documentation defense; coding compliance;
  upcoding/downcoding; the False Claims Act as background; M&R
  (medical record) requests
- **Documents:** audit demand letter, requested chart packet,
  response template
- **Actors:** auditor, compliance officer, you defending your
  earlier work
- **Hospital rooms:** conference room with auditors and binders
- **Waiting Room:** mirror room — every shortcut from earlier
  levels reflected back; Quarterly Audit boss exists
- **Existing:** `boss_audit`, `case_audit_finale`

## Cross-cutting concerns

These shouldn't get their own level — they appear in their
natural homes and reference each other.

| Concern | Lives most strongly in | Touches |
|---|---|---|
| Denial taxonomy (CARC/RARC) | L7 Courtroom | every level |
| Compliance / documentation defense | L10 Audit | L4, L5, L6 |
| Patient experience | L8 River | L2, L3, L7 |
| Time pressure (filing windows) | L7 Courtroom (Reaper) | every back-end level |
| Vendor / clearinghouse | L6 Conveyor | L2, L7 |
| Health equity / financial harm | L8 River | L2, L7 |

## Identified gaps

Topics not yet taught by any encounter or case:

1. **Charge capture / CDM** — L6 names it; no encounter
   demonstrates it. Charges missed in the chart are a top-3
   revenue leak in real hospitals.
2. **Underpayments** — L7 only teaches denials, not "they paid us
   60% of contract." Real AR analysts spend half their time here.
3. **Self-pay / financial assistance / charity care** — L8 needs
   to teach the *positive* path (screen for charity, not collect).
4. **NSA (No Surprises Act) / surprise billing** — high-stakes,
   recent, currently taught nowhere.
5. **Contract terms / fee schedules** — L5 names them; nothing
   actually teaches them.
6. **AR aging buckets** — 0–30, 31–60, 61–90, 90+ triage logic.
7. **Vendor management** — clearinghouses, eligibility vendors,
   scrubber vendors. Hidden actor in real RCM.
8. **Payer-type literacy** — Medicare vs Medicaid vs commercial vs
   MA. The *categories* matter, even if specifics shouldn't be
   memorized.

## Open design questions

1. **Sequencing.** Current 10 levels are roughly chronological
   through the cycle. Keep, or reorder by *severity of
   consequence* (start with what hurts most)?
2. **Granularity.** Is "Charge Capture" big enough for its own
   level (would push something else out), or stays tucked in L6?
3. **NSA.** Important but politically fraught. How spicy?
4. **Patient as actor.** Today patients are background. Should
   some encounters be *with* a patient (PFS counter
   conversation), not about a denial?
5. **Local vs canonical.** Each Hospital level having a
   discoverable *map of rooms*, each room a small encounter — or
   keep the open-floor exploration we have?
6. **Wraith placement.** `co_50` Medical Necessity Wraith
   currently lives in `wing: 'appeals'` but the *teaching* sits
   firmly in CDI / documentation (L4). Move?

## Recommendation for next steps

Before any more mechanics work:

1. Lock the curriculum spine (this doc).
2. Per level, decide: which rooms exist, what each room teaches,
   what Waiting Room manifestation mirrors it, where on the map
   it sits.
3. Per encounter / case: the same questions, applied at the
   smallest unit. (Concept, document, actor, hospital room,
   surreal mirror, what the player walks away knowing.)
4. *Then* pick mechanics — and possibly different mechanics for
   different levels, because front-end work, denial work, audit
   work, and patient work feel very different.

A "stuck claim case template" capturing those questions for new
content is a good companion artifact (not yet written).

## See also

- `reference/journal/2026-05-03-v3-the-waiting-room.md` — original
  game design
- `reference/journal/2026-05-04-build-plan.md` — engineering plan
- `reference/journal/2026-05-05-battle-mechanics-and-form-bridge.md`
  — mechanic catalog
- `reference/puzzles/puzzles-current.md` — battle DNA snapshot
- `reference/puzzles/puzzles-draft.md` — puzzle reframe drafts
- `src/content/levels.ts` — current level metadata
