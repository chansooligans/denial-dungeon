# 2026-05-03 — V3: "The Waiting Room" — Final Design

## One-Liner
A turn-based hospital RPG where you chase a lost claim through a surreal
bureaucratic underworld called The Waiting Room, learning the real US
revenue cycle along the way.

## Concept

### Dual Reality
- **The Hospital** (normal layer): warm, Animal Crossing cozy. Real people,
  real departments, real conversations. You talk to staff, help patients,
  make decisions about billing processes.
- **The Waiting Room** (surreal layer): the hidden complexity beneath every
  claim. An infinite waiting room where claims physically travel from
  submission to payment. Not evil — neglected. Absurdly complex. Think
  Terry Gilliam's Brazil meets Spirited Away's bathhouse.

### Story
You're a revenue cycle analyst at Mercy General Hospital. Working late on a
Friday, a routine claim vanishes from the system — not denied, not rejected,
just gone. You discover a crack in the floor and fall into The Waiting Room:
a surreal underworld where every claim ever filed still exists — waiting.

You chase your missing claim through 10 levels. Each level, you discover
another failure point that trapped it. Along the way you learn how the
entire revenue cycle actually works.

The twist: your claim was never special. Every claim faces this gauntlet.
Your real mission isn't to save one claim — it's to fix The Waiting Room
itself so claims stop getting lost.

### Tone
- Normal layer: warm, friendly, slice-of-life
- Waiting Room: surreal, whimsical-eerie, overwhelming but not scary
- The feeling of being inside a system so complex no single person
  understands all of it

---

## Intro Cutscene

### Beat 1: The Hook (black screen, typewriter text)
> In the United States, it costs $215 in administrative work to process
> a single hospital bill.
>
> In Canada, it costs $6.
>
> That's not a typo.

Source: Richman et al. (2022) Health Affairs 41:8

### Beat 2: The Hospital (warm pixel art, camera pans)
> Every day, thousands of claims move through a system so complex that
> no single person understands all of it.
>
> Doctors document. Coders translate. Billers submit. Payers decide.
> Patients pay.
>
> And somewhere between all of them, claims get lost.

Camera pans through empty departments at night. Registration desk with
scattered papers. Coding office with monitors still on. Billing with
stacked folders.

### Beat 3: Your Desk
Single desk. Monitor glows. Cold coffee. Sticky note: "835 DOESN'T MATCH —
CHECK MONDAY"

> You are a revenue cycle analyst at Mercy General Hospital.
> It's Friday. It's late. You should have gone home hours ago.

You click through screens. A claim number blinks. Vanishes.

> Not denied. Not rejected. Not pending. Gone.

### Beat 4: The Fall
Desk lamp flickers. Crack in the floor. Faint light pulses from below.
The hum of fluorescents shifts to something lower — like paper feeding
through a printer that never stops.

The floor gives way like stepping through a soap bubble. Slow fall,
surrounded by floating documents — 837s, 835s, CMS-1500 forms half-filled,
UB-04s covered in red stamps, EOBs folded into paper airplanes.

### Beat 5: The Waiting Room
> Below the hospital you know, there is another place.
>
> A place where every claim that was ever filed still exists — waiting.
>
> The chairs stretch on forever. The number on the ticket counter never
> seems to change. Forms fill out themselves, then unfill. Somewhere,
> a phone rings that no one answers.
>
> They call it The Waiting Room.
>
> Nobody comes here on purpose.

Your missing claim floats past and disappears around a corner.

### Beat 6: Title
Title stamps onto screen like a form approval:

# DENIAL DUNGEON
*A revenue cycle RPG*

Menu: NEW GAME / CODEX / SETTINGS

---

## Levels

| # | Title | Normal Layer | Waiting Room Layer | Core Concepts | Boss Encounter |
|---|-------|-------------|-------------------|---------------|----------------|
| 1 | Orientation | First day, meet staff | Discover The Waiting Room exists | What a claim IS, CMS-1500 basics | Submit your first clean claim |
| 2 | The Front Door | Front Desk Dana's registration mess | A sorting room where patient records fall into wrong bins | Eligibility (270/271), demographics, insurance verification | Fix Dana's error backlog |
| 3 | The Gate | Dr. Martinez's prior auth emergency | A locked gate with a ticking timer | 278 transactions, medical necessity, payer portals | Get auth before deadline |
| 4 | The Copy | Dr. Martinez's duplicate notes | A room where documents keep duplicating and overlapping | CDI, clinical documentation, ICD-10-CM specificity | Convince Dr. Martinez to fix notes |
| 5 | The Library | Coder Kim's impossible case | A library where books rewrite themselves as you read | ICD-10-PCS, CPT, modifiers (25/59/76), DRG/EAPG grouping | Code a complex inpatient case |
| 6 | The Conveyor | Biller Jordan's end-of-day rush | A conveyor belt accelerating toward a shredder | UB-04, 837P/837I, clearinghouse edits, 277CA | Clear rejected claims before EOD |
| 7 | The Courtroom | Meeting with Claims Adjuster Pat | A courtroom where the rules change mid-trial | Adjudication, medical policy, allowed amounts, contract terms | Argue a wrongful denial |
| 8 | The River | A pile of unposted remittances | A river of numbers where you fish out underpayments | 835/ERA, CARC/RARC codes, group codes, payment posting | Reconcile a week of remittances |
| 9 | The Maze | A patient crying at the billing window | A maze where every door has a different price | Cost share waterfall (deductible → copay → coinsurance → OOP max), estimates, NSA, financial assistance | Help patients without losing revenue |
| 10 | The Audit | Everything on the line | The entire Waiting Room — all areas connected, everything you fixed (or didn't) visible | Full end-to-end review of all prior decisions | Survive the quarterly payer audit |

---

## NPCs

| Name | Department | Role in Story | What They Teach |
|------|-----------|--------------|-----------------|
| Front Desk Dana | Registration | Overwhelmed, making typos | Eligibility, demographics, insurance verification |
| Dr. Martinez | Clinical | Well-meaning but sloppy documentation | CDI queries, copy-paste problem, clinical specificity |
| Coder Kim | HIM/Coding | Meticulous, drowning in volume | ICD-10-CM/PCS, CPT, revenue codes, modifiers, DRG grouping |
| Biller Jordan | Billing | Fast but error-prone under pressure | CMS-1500, UB-04 form completion, claim submission |
| Clearinghouse Bot (EDDI) | IT/EDI | An actual robot — friendly, literal | 277CA rejects, X12 format validation, 837 structure |
| Claims Adjuster Pat | Payer Relations | Adversarial but fair — just following policy | Adjudication logic, medical necessity, allowed amounts |
| Appeals Attorney Alex | Legal | Passionate, overworked | Appeal strategies, clinical evidence requirements |
| Financial Counselor Sam | Patient Services | The heart of the hospital | Cost estimates, financial assistance, NSA compliance |
| Collections Carl | Revenue | Pragmatic, morally gray | AR aging, collections ethics, write-offs |
| Compliance Officer Chen | Compliance | By-the-book, sees everything | Audit risk, upcoding detection, modifier abuse |
| CFO Rivera | Administration | Big picture, pressured by board | KPIs, denial rate trends, the $215-vs-$6 reality |

---

## Content Pillars (What the Game Teaches)

### Claim Forms
- **CMS-1500**: 33 boxes. Professional/outpatient claims.
  - Box 21: ICD-10-CM diagnosis
  - Box 24: CPT codes + modifiers + diagnosis pointers
  - Box 33: Billing provider NPI
- **UB-04**: 81 form locators. Institutional/inpatient claims.
  - FL 4: Type of bill (e.g., 0111 = inpatient admit through discharge)
  - FL 42: Revenue codes (0120 room & board, 0250 pharmacy, 0450 ER)
  - FL 44: HCPCS/CPT procedure codes
  - FL 67: Principal diagnosis (ICD-10-CM)
  - FL 74: Principal procedure (ICD-10-PCS)
- **In-game**: these are puzzle screens. Spot errors, fill blanks, correct codes.

### Diagnosis & Procedure Codes
- **ICD-10-CM**: ~70,000 diagnosis codes. 3-7 chars. E.g., M54.5 = low back pain
- **ICD-10-PCS**: ~78,000 procedure codes, inpatient only. 7-char alphanumeric.
  - Each position = an axis (section, body system, root operation, body part, approach, device, qualifier)
- **CPT**: ~10,000 procedure codes (AMA). Professional services.
  - E&M: 99213 (established moderate), 99214 (established high)
  - Surgery: 27447 (total knee arthroplasty)
- **HCPCS Level II**: Supplies, DME, drugs. J0129 = abatacept injection
- **Revenue codes**: 4-digit, UB-04 only. Department/service category.

### Modifiers
- **25**: Significant separately identifiable E&M
- **59**: Distinct procedural service (anti-bundling)
- **76**: Repeat procedure, same physician
- **26**: Professional component only
- **TC**: Technical component only

### Payment Systems
- **APR-DRG**: Inpatient grouping. Principal dx + procedures + CC/MCC → DRG → payment
  - SOI (severity of illness) 1-4, ROM (risk of mortality) 1-4
- **EAPG**: Outpatient grouping. Significant procedure, medical visit, ancillary
- **APC**: CMS outpatient payment classification

### Patient Cost Share
```
Billed charge ($50,000)
  → Allowed amount per contract ($30,000)
    → Deductible remaining ($2,000)
    → Copay ($250)
    → Coinsurance (20% of remainder)
    → Out-of-pocket max cap
  → Payer pays the rest
  → Patient responsibility = deductible + copay + coinsurance (capped at OOP max)
```

### Remittance (835/ERA)
- CARC: Claim Adjustment Reason Code (WHY)
- RARC: Remittance Advice Remark Code (additional context)
- Group codes: CO (contractual), PR (patient responsibility), OA (other)

### X12 Transactions
- 270/271: Eligibility inquiry/response
- 276/277: Claim status inquiry/response
- 278: Prior auth request/response
- 837P/837I: Claim submission (professional/institutional)
- 835: Electronic remittance advice
- 277CA: Claim acknowledgment (clearinghouse)

---

## Codex
Every concept encountered gets cataloged with plain-English explanation.
Organized by category: Codes, Forms, Transactions, Concepts, Stats.
Should be useful as a standalone reference outside the game.

---

## Research References
- Richman et al. (2022). Billing And Insurance-Related Administrative Costs:
  A Cross-National Analysis. Health Affairs 41:8, pp. 1098-1106.
- Tseng et al. (2018). Administrative Costs Associated With Physician Billing
  and Insurance-Related Activities. JAMA.
- Istvan et al. Addressing Health Care's Administrative Cost Crisis. JAMA.
- PATIENTS framework (open.forpatients.health)
- Scheinker et al. (2021). Reducing administrative costs in US health care.
  Health Serv Res.

---

## Design Principles
- Human-centered: real people, real jobs, real stakes
- The fun IS the learning — every game mechanic teaches something
- Serious but warm — Animal Crossing tone in normal world, surreal wonder in Waiting Room
- Progressive disclosure: start simple, layer complexity
- Decisions compound: shortcuts in early levels have consequences later
- The complexity is the villain, not any one person or faction
- The codex should be useful OUTSIDE the game
- No company branding
