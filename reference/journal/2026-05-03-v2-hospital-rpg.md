# 2026-05-03 — V2: Hospital RPG with Real Billing Artifacts

## Pivot Summary
From action roguelike (Hades-style) → Animal Crossing / Pokemon cozy turn-based RPG.
You face PEOPLE, not denial codes. Denial codes are the RESULT of failed encounters.

## Research Sources
- Richman et al. (2022) "Billing and Insurance-Related Administrative Costs: A Cross-National Analysis" — Health Affairs 41:8
- PATIENTS (Publicly Accountable Transparent Interoperable Efficient Nonproprietary Transaction Standard) framework
- Revenue cycle field guide (policyTracker.js)

## Key Stats to Teach (from Richman et al.)
- US BIR cost: $215/inpatient surgical bill vs $6 in Canada
- 25-31% of US healthcare spending = admin
- $20 to collect every $100 in primary care
- Credit card transaction: 2% overhead. Healthcare: 25-31%
- 4 BIR categories: Eligibility, Coding, Submission, Rework
- Coding is the #1 cost driver (not wages — complexity)
- Countries w/ standardized payment have far lower costs
- Financial counseling before treatment reduces rework

## Content Pillars (What the Game Must Teach)

### 1. Claim Forms
- **CMS-1500** (professional claims): 33 boxes, physician/outpatient
  - Key fields: Box 21 (ICD-10-CM dx), Box 24 (CPT + modifiers + dx pointers), Box 33 (billing provider NPI)
- **UB-04** (institutional claims): 81 form locators, facility/inpatient
  - Key fields: FL 4 (type of bill), FL 42 (revenue codes), FL 44 (HCPCS/CPT), FL 67 (principal dx), FL 74 (principal procedure ICD-10-PCS)
- Game: these ARE the battle screens. Fill them out, spot errors, correct them.

### 2. Diagnosis Codes
- **ICD-10-CM** (Clinical Modification): ~70,000 diagnosis codes
  - Structure: 3-7 characters. E.g., M54.5 = Low back pain
  - Used on BOTH CMS-1500 and UB-04
  - Teaches: specificity matters. M54.5 vs M54.51 (vertebrogenic) changes payment
- **ICD-10-PCS** (Procedure Coding System): ~78,000 procedure codes, INPATIENT ONLY
  - 7-character alphanumeric. E.g., 0SB20ZZ = excision of left hip joint
  - Each position = a defined axis (section, body system, root operation, body part, approach, device, qualifier)
  - Game: PCS code builder mini-game — pick the right value for each axis

### 3. Procedure / Service Codes
- **CPT** (Current Procedural Terminology): ~10,000 codes, owned by AMA
  - E&M codes: 99213 (established, moderate), 99214 (established, high)
  - Surgery: 27447 (total knee arthroplasty)
- **HCPCS Level II**: Supplies, DME, drugs. E.g., J0129 = abatacept injection
- **Revenue Codes** (UB-04 only): 4-digit, categorize department/service
  - 0120 = Room & board semi-private, 0250 = pharmacy, 0450 = emergency room
  - Revenue code is the "where" — CPT/HCPCS is the "what"
- Game: match the right procedure code to the clinical scenario

### 4. Modifiers
- **25**: Significant, separately identifiable E&M on same day as procedure
- **59**: Distinct procedural service (prevents bundling)
- **76**: Repeat procedure by same physician
- **26**: Professional component only
- **TC**: Technical component only
- **GT**: Via interactive audio/video telehealth
- Game: attach the right modifier to prevent denial. Wrong = CO-97 (bundled)

### 5. Payment/Grouping Systems
- **APR-DRG** (All Patient Refined Diagnosis Related Groups): Inpatient
  - Principal dx + procedures + complications → DRG → fixed payment
  - Severity of illness (SOI) 1-4, Risk of mortality (ROM) 1-4
  - Example: DRG 470 (Major joint replacement) base rate ~$12,000
  - CC/MCC status changes the DRG and payment dramatically
- **EAPG** (Enhanced Ambulatory Patient Groups): Outpatient
  - Similar concept for outpatient — groups services into payment categories
  - Significant procedure EAPGs, medical visit EAPGs, ancillary EAPGs
- **APC** (Ambulatory Payment Classification): CMS outpatient payment
- Game: DRG calculator mini-game — see how dx specificity changes payment

### 6. Patient Cost Share (the waterfall)
```
Billed charge (e.g., $50,000)
  → Allowed amount per contract (e.g., $30,000)
    → Payer pays (after deductible, copay, coinsurance)
      → Patient responsibility
        - Deductible remaining (e.g., $2,000)
        - Copay (flat fee, e.g., $250)
        - Coinsurance (% of remainder, e.g., 20%)
        - Out-of-pocket max cap
```
- Game: calculate patient responsibility correctly. Overcharge = rep loss. Undercharge = revenue loss.

### 7. Remittance / ERA (835)
- Shows how payer adjudicated each service line
- CARC (Claim Adjustment Reason Code): WHY adjustment was made
- RARC (Remittance Advice Remark Code): additional context
- Group codes: CO (contractual obligation), PR (patient responsibility), OA (other adjustment)
- Game: read the remittance, understand what happened, decide next action (appeal, rebill, patient bill, write off)

### 8. X12 Transactions
- 270/271: Eligibility inquiry/response
- 276/277: Claim status inquiry/response
- 278: Prior authorization request/response
- 837P/837I: Professional/institutional claim submission
- 835: Electronic remittance advice
- 277CA: Claim acknowledgment (clearinghouse accept/reject)
- Game: you USE these transactions as tools during encounters

## Game Structure

### Overworld: Hospital Campus (Animal Crossing style)
Walk around, enter buildings, talk to NPCs. Each building = a department.

### Encounters: Turn-Based (Pokemon style)
You face a PERSON with a PROBLEM. Pick the right tool/action.
The denial code only appears if you fail or as a teaching reveal.

### NPC Cast
| NPC | Department | What They Teach |
|-----|-----------|-----------------|
| Front Desk Dana | Registration | Eligibility, demographics, insurance verification |
| Dr. Martinez | Clinical | Documentation quality, copy-paste notes, CDI |
| Coder Kim | HIM/Coding | ICD-10-CM/PCS, CPT, DRG grouping, modifier logic |
| Biller Jordan | Billing | CMS-1500 / UB-04 form completion, submission |
| Clearinghouse Bot | IT/EDI | 277CA rejects, X12 format validation |
| Claims Adjuster Pat | Payer | Adjudication logic, medical necessity, auth |
| Appeals Attorney Alex | Legal | Appeal letter strategy, clinical evidence |
| Financial Counselor Sam | Patient Svcs | Cost estimates, financial assistance, NSA |
| Collections Carl | Revenue | AR aging, collections ethics, write-offs |
| Compliance Officer Chen | Compliance | Audit risk, upcoding, modifier abuse |
| CFO Rivera | Administration | KPIs, dashboards, denial rate trends |

### Progression
1. **Chapter 1**: Professional claims (CMS-1500, CPT, ICD-10-CM)
2. **Chapter 2**: Eligibility & prior auth (270/271, 278)
3. **Chapter 3**: Institutional claims (UB-04, revenue codes, ICD-10-PCS)
4. **Chapter 4**: Groupers & payment (APR-DRG, EAPG)
5. **Chapter 5**: Adjudication & remittance (835, CARC/RARC)
6. **Chapter 6**: Patient billing & cost share
7. **Chapter 7**: Appeals & compliance
8. **Chapter 8**: Cross-national comparison (why is the US system so expensive?)
9. **Boss**: Full end-to-end case — registration through collections

### Codex
Every concept you encounter gets cataloged:
- Codes (ICD-10, CPT, HCPCS, Revenue, CARC, RARC)
- Form fields (CMS-1500 boxes, UB-04 form locators)
- Transactions (X12 types)
- Concepts (deductible, coinsurance, DRG, etc.)
- Stats (from Richman et al. and other research)

## Design Principles
- NO mention of any company
- Human-centered: real people, real jobs, real stakes
- The fun IS the learning — every game mechanic teaches something
- Serious but warm — Animal Crossing tone, not grimdark
- Progressive disclosure: start simple, layer complexity
- The codex should be useful OUTSIDE the game as a reference
