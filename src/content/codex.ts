import type { CodexEntry } from '../types'

export const CODEX_ENTRIES: Record<string, CodexEntry> = {
  // === Codes ===
  co_109: {
    id: 'co_109',
    name: 'CO-109',
    category: 'codes',
    description: 'Claim not covered by this payer per coordination of benefits.',
    detail: 'CARC CO-109 means the payer says the patient is not their member, or another payer is primary. Usually caused by stale insurance info at registration. Fix: run a 270 eligibility check before billing.',
  },
  co_11: {
    id: 'co_11',
    name: 'CO-11',
    category: 'codes',
    description: 'Diagnosis is inconsistent with the procedure.',
    detail: 'CARC CO-11 fires when the ICD-10 diagnosis code does not medically support the CPT procedure code billed. A CDI query before coding can prevent this by ensuring the clinical documentation explicitly links the condition to the procedure.',
  },
  co_16: {
    id: 'co_16',
    name: 'CO-16',
    category: 'codes',
    description: 'Claim lacks required information.',
    detail: 'CARC CO-16 is a catch-all for missing or invalid data. Common causes: blank fields in the 837, invalid taxonomy codes, missing NPI. Often appears as a 277CA front-end reject before the payer even sees the claim.',
  },
  co_22: {
    id: 'co_22',
    name: 'CO-22',
    category: 'codes',
    description: 'This care may be covered by another payer per coordination of benefits.',
    detail: 'CARC CO-22 means another insurance plan should be billed first. The coordination of benefits (COB) order is set by the employer and member services, not the provider. Run COB checks before billing.',
  },
  co_50: {
    id: 'co_50',
    name: 'CO-50',
    category: 'codes',
    description: 'These are non-covered services because this is not deemed a medical necessity.',
    detail: 'CARC CO-50 is the medical necessity denial. The payer says the service was not necessary for the documented condition. CDI before coding is the best prevention. Appeals work but cost 45+ minutes each.',
  },
  co_97: {
    id: 'co_97',
    name: 'CO-97',
    category: 'codes',
    description: 'The benefit for this service is included in the payment for another service.',
    detail: 'CARC CO-97 means the payer bundled two procedures together. CCI edits define which CPT codes are bundled. Modifier 59 (distinct procedural service) or modifier 25 (significant E/M) can unbundle when clinically appropriate.',
  },
  co_197: {
    id: 'co_197',
    name: 'CO-197',
    category: 'codes',
    description: 'Precertification/authorization/notification absent.',
    detail: 'CARC CO-197 means the service required prior authorization and none was on file. The 278 transaction is how auths are submitted electronically, though many providers still fax. Only fixable upstream — get the auth before the visit.',
  },
  pr_204: {
    id: 'pr_204',
    name: 'PR-204',
    category: 'codes',
    description: 'This service is not covered under the patient\'s current benefit plan.',
    detail: 'CARC PR-204 is a benefit exclusion. The patient\'s specific plan design does not cover the service. No appeal will change this. The correct response is a cost estimate before the visit so the patient knows what they will owe.',
  },
  oa_23: {
    id: 'oa_23',
    name: 'OA-23',
    category: 'codes',
    description: 'The impact of prior payer adjudication.',
    detail: 'CARC OA-23 appears when the primary payer has already processed the claim and adjusted payment. This is not a denial — it\'s a workflow signal. Send the ERA from the primary to the secondary payer with the claim.',
  },

  // === Forms ===
  cms1500: {
    id: 'cms1500',
    name: 'CMS-1500',
    category: 'forms',
    description: 'The standard paper claim form for professional (physician) services.',
    detail: 'CMS-1500 has 33 boxes covering patient info, insurance, diagnosis codes (ICD-10-CM), procedure codes (CPT/HCPCS), modifiers, place of service, charges, and provider info. The electronic equivalent is the 837P transaction.',
  },
  ub04: {
    id: 'ub04',
    name: 'UB-04',
    category: 'forms',
    description: 'The standard paper claim form for institutional (hospital) services.',
    detail: 'UB-04 has 81 form locators covering patient info, type of bill, admission/discharge info, revenue codes, ICD-10-PCS procedure codes, diagnosis codes, charges, and provider info. The electronic equivalent is the 837I transaction.',
  },

  // === Transactions ===
  x12_270_271: {
    id: 'x12_270_271',
    name: '270/271 Eligibility',
    category: 'transactions',
    description: 'Electronic eligibility inquiry (270) and response (271).',
    detail: 'The 270 asks: "Is this patient covered by this plan?" The 271 answers with coverage details, copay amounts, deductible status, and COB info. Takes seconds. Prevents CO-109 and CO-22 denials. Should run before every visit.',
  },
  x12_278: {
    id: 'x12_278',
    name: '278 Prior Auth',
    category: 'transactions',
    description: 'Electronic prior authorization request and response.',
    detail: 'The 278 transaction submits a prior authorization request to the payer and receives an approval, denial, or pend response. Most providers still fax auth requests, but electronic 278s are faster and create an audit trail.',
  },
  x12_837: {
    id: 'x12_837',
    name: '837 Claim',
    category: 'transactions',
    description: 'Electronic claim submission (837P for professional, 837I for institutional).',
    detail: 'The 837 is the electronic version of the CMS-1500 (837P) or UB-04 (837I). It goes from the provider to the clearinghouse to the payer. Loops and segments carry all the data from the paper form plus additional fields.',
  },
  x12_835: {
    id: 'x12_835',
    name: '835 Remittance',
    category: 'transactions',
    description: 'Electronic remittance advice (ERA) — the payer\'s payment explanation.',
    detail: 'The 835/ERA is the payer\'s response to a claim. It shows what was paid, what was adjusted, and why (via CARC/RARC codes). It\'s the electronic equivalent of the paper EOB. Payment posting reads the 835 to update the patient account.',
  },
  x12_277ca: {
    id: 'x12_277ca',
    name: '277CA',
    category: 'transactions',
    description: 'Claim acknowledgment — the clearinghouse\'s front-end validation result.',
    detail: 'The 277CA tells you whether the clearinghouse accepted or rejected the 837 before it reached the payer. Front-end rejects (277CA rejections) are not denials — they mean the claim had format or data errors. Fix and resubmit fast.',
  },

  // === Concepts ===
  denial_rate: {
    id: 'denial_rate',
    name: 'Denial Rate',
    category: 'concepts',
    description: 'The percentage of claims denied on first submission.',
    detail: 'Industry average denial rate is 10-15%. Every denied claim costs $25-118 to rework. A 1% reduction in denial rate at a mid-size hospital saves $1M+ annually. Most denials are preventable with upstream fixes.',
  },
  cdi: {
    id: 'cdi',
    name: 'CDI (Clinical Documentation Improvement)',
    category: 'concepts',
    description: 'The process of improving clinical documentation to support accurate coding.',
    detail: 'CDI specialists review charts while the patient is still in the hospital and send queries to physicians asking them to clarify diagnoses, specify conditions, and document severity. This happens BEFORE coding, preventing CO-11 and CO-50 denials downstream.',
  },
  medical_necessity: {
    id: 'medical_necessity',
    name: 'Medical Necessity',
    category: 'concepts',
    description: 'The payer\'s determination that a service was clinically appropriate.',
    detail: 'Payers publish medical policies defining what they consider necessary for each diagnosis. If the documentation doesn\'t meet the policy criteria, the claim is denied CO-50. The physician may have done the right thing clinically, but the documentation must prove it to the payer.',
  },
  cost_share: {
    id: 'cost_share',
    name: 'Patient Cost Share',
    category: 'concepts',
    description: 'The portion of a medical bill the patient is responsible for.',
    detail: 'Patient cost share flows: deductible first (patient pays 100% until met), then coinsurance (patient pays a percentage, e.g. 20%), with an out-of-pocket maximum cap. Copays are flat fees per visit. Same procedure, same plan, different deductible = different bill.',
  },
  icd10_cm: {
    id: 'icd10_cm',
    name: 'ICD-10-CM',
    category: 'codes',
    description: 'International Classification of Diseases, 10th Revision, Clinical Modification.',
    detail: 'ICD-10-CM has ~70,000 diagnosis codes. Used on every claim to describe WHY the patient needed care. Format: letter + digits (e.g., E11.9 = Type 2 diabetes). Specificity matters — an unspecified code may trigger a denial when a more specific code exists.',
  },
  modifiers: {
    id: 'modifiers',
    name: 'Modifiers',
    category: 'codes',
    description: 'Two-digit codes appended to CPT codes to provide additional information.',
    detail: 'Key modifiers: 25 (significant, separately identifiable E/M), 59 (distinct procedural service — unbundles), 76 (repeat procedure by same physician), 26 (professional component only), TC (technical component only). Wrong modifier = wrong payment or denial.',
  },
}

export const CODEX_LIST = Object.values(CODEX_ENTRIES)
