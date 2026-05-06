// Bundle (CO-97) — runtime puzzle spec. First encounter ported to
// the prototype shape inside the runtime. Mirrors the data in
// `src/bundle-prototype/main.ts` but flattened into the
// PuzzleSpec contract.

import { CASES } from '../../../content/cases'
import type { PuzzleSpec } from '../types'

const bundleCase = CASES.case_bundle_kim

/** Pluck the CMS-1500 from the existing PatientCase for reuse. */
function claimFromCase() {
  const c = bundleCase.claim!
  if (c.type !== 'cms1500') throw new Error('bundle case must be cms1500')
  return {
    claimId: c.claimId,
    patientName: c.patient.name,
    patientDob: c.patient.dob,
    insurer: c.insured.name ?? 'Cigna',
    insuredId: c.insured.id,
    diagnoses: c.diagnoses.map(d => ({ code: d.code, label: d.label })),
    serviceLines: [
      {
        dos: c.serviceLines[0].dos,
        pos: c.serviceLines[0].pos,
        cptCode: c.serviceLines[0].cpt.code,
        cptLabel: c.serviceLines[0].cpt.label,
        modifier: '—',
        charges: c.serviceLines[0].charges,
        disputed: true,
      },
      {
        dos: c.serviceLines[1].dos,
        pos: c.serviceLines[1].pos,
        cptCode: c.serviceLines[1].cpt.code,
        cptLabel: c.serviceLines[1].cpt.label,
        modifier: '—',
        charges: c.serviceLines[1].charges,
        disputed: false,
      },
    ],
  }
}

export const BUNDLE_PUZZLE: PuzzleSpec = {
  id: 'bundle',
  title: 'Bundle',
  district: 'coding',
  hospitalIntro: [
    'Dr. Patel, the dermatologist, leans into your office. ' +
      '"Hey — Sarah Kim\'s claim from last week. Cigna paid me for ' +
      'the biopsy but rejected the office visit. They said it was ' +
      'bundled. But she came in for hypertension! I noticed the ' +
      'spot during the exam, did the biopsy, but the visit was its ' +
      'own thing."',
    'He drops the chart on your desk. You start reading.',
  ],
  briefing: {
    paragraphs: [
      '"This one is a Bundle. The insurance company saw two ' +
      'services on the same day and decided to only pay for one. ' +
      'The fix is usually small: there\'s a two-digit modifier that ' +
      'tells their automated system \'these are actually separate.\'"',
      '"Two ways to address this:"',
    ],
    bullets: [
      '<strong>Amend the claim.</strong> Add the right modifier ' +
      '(it\'s called a modifier 25) to the office-visit line. Click ' +
      'the line on the claim above to open the modifier picker. ' +
      '<em>This is the cheap fix.</em>',
      '<strong>Build a citation.</strong> If you want to back up ' +
      'the modifier with chart evidence — show that the office visit ' +
      'really was separate from the procedure — connect a chart fact ' +
      'to the NCCI guidance. <em>This is the appeal-ready version.</em>',
    ],
    signoff: '"Don\'t be most people. — D."',
  },
  claim: claimFromCase(),
  issues: [
    {
      id: 'modifier',
      label: 'Add modifier 25 to the office-visit line.',
      recap: "Fixed at the source. The chart documents that the office visit was separate from the lesion removal — modifier 25 is exactly the field for 'significant, separately identifiable E&M.' Once it's on the line, NCCI no longer bundles them.",
      verb: 'amend',
    },
    {
      id: 'separately-identifiable',
      label: 'Show the chart documents the E&M as significant and separately identifiable.',
      recap: 'You just argued: the patient came in for one reason (hypertension recheck) and the lesion was noted incidentally during the exam — a textbook case for modifier 25. NCCI guidance explicitly allows it.',
      verb: 'cite',
    },
  ],
  payerProse:
    'Cigna denied the office-visit charge. They said it was ' +
    '{{phrase:bundled}} because there was {{phrase:no-modifier}}.',
  payerPhrases: [
    {
      id: 'bundled',
      text: 'CPT 99214 bundled into 11102 per NCCI edit',
      plain: 'The insurance company says the office visit (99214) is automatically included in the lesion-removal procedure (11102), so they\'re only paying for one of them.',
      issueId: 'separately-identifiable',
    },
    {
      id: 'no-modifier',
      text: 'no separately-identifiable modifier on the E&M line',
      plain: 'Their automated system didn\'t see modifier 25 on the office-visit line, so it merged the two services. The fix is to add the modifier and resubmit.',
      issueId: 'modifier',
    },
  ],
  chartHeader: 'Chart (Kim, S.)',
  chartFacts: [
    {
      id: 'visit-reason',
      plain: 'The patient came in primarily for a hypertension recheck — a planned, scheduled visit.',
      technical: 'Chief complaint: HTN follow-up; BP today 138/86; meds reviewed.',
      issueId: 'separately-identifiable',
    },
    {
      id: 'incidental',
      plain: 'The doctor only noticed the skin lesion during the visit — it wasn\'t why she came.',
      technical: 'Skin lesion noted incidentally on exam; biopsy performed same encounter.',
      issueId: 'separately-identifiable',
    },
    {
      id: 'em-time',
      plain: 'The doctor spent real time on the visit (review of meds, BP discussion) — not just the procedure.',
      technical: 'E&M time documented: 22 min counseling, history, exam (HTN-focused).',
      issueId: 'separately-identifiable',
    },
    {
      id: 'biopsy-tech',
      plain: 'The biopsy itself was a quick procedure (a few minutes).',
      technical: 'Tangential biopsy of dorsal forearm lesion: ~3 min, no complications.',
      issueId: null,
      distractorReason: "How long the biopsy took isn't relevant to whether the E&M was separately identifiable. The biopsy is its own service.",
    },
  ],
  policyHeader: 'NCCI Guidance',
  policyClauses: [
    {
      id: 'mod25-rule',
      source: 'NCCI',
      plain: 'Modifier 25 may be added to an E&M visit when it\'s significant and separately identifiable from a procedure done the same day.',
      technical: 'Per NCCI guidance: modifier 25 may be appended to E&M when documentation supports a significant, separately identifiable E&M service on the same day as a procedure.',
      issueId: 'separately-identifiable',
    },
    {
      id: 'em-criteria',
      source: 'NCCI',
      plain: 'The visit qualifies if the doctor did real medical work beyond the procedure — like reviewing meds, exam, counseling.',
      technical: 'E&M qualifies as separately identifiable when documentation shows history, exam, and medical decision-making distinct from the procedure\'s own pre/intra/post work.',
      issueId: 'separately-identifiable',
    },
  ],
  amendSlots: [
    {
      issueId: 'modifier',
      fieldLabel: 'Box 24 · Modifier (line 1: 99214)',
      contextLine: 'The chart says: patient seen for HTN recheck (planned visit), lesion noted incidentally during exam, biopsy performed same encounter.',
      claimTarget: { kind: 'serviceLineModifier', lineIndex: 0 },
      options: [
        {
          id: '—',
          label: 'No modifier',
          support: 'current',
          feedback: "This is what's currently on the line — and it's why the claim was bundled.",
        },
        {
          id: '25',
          label: 'Modifier 25 — significant, separately identifiable E&M',
          support: 'correct',
          feedback: 'Right modifier for an E&M visit performed on the same day as a procedure when the visit was significant and separate. Matches the chart.',
        },
        {
          id: '59',
          label: 'Modifier 59 — distinct procedural service',
          support: 'partial',
          feedback: 'Modifier 59 marks two distinct *procedures* — but the issue here is an E&M visit alongside a procedure, not two procedures. Modifier 25 is the right tool for that.',
        },
        {
          id: '76',
          label: 'Modifier 76 — repeat procedure, same physician',
          support: 'wrong',
          feedback: "Modifier 76 is for a procedure repeated by the same physician (e.g. two X-rays). That doesn't apply here — there's no repeated procedure.",
        },
      ],
    },
  ],
  submitLabel: 'SUBMIT CORRECTED CLAIM',
  victory: {
    headline: 'The corrected claim resubmits.',
    paragraphs: [
      'Cigna pays for both lines. Dr. Patel sticks his head in to say thanks. The corrected claim goes through their system in less than 12 hours — Bundles are usually quick once the modifier\'s right.',
      'Where the Bundling Beast stood, two service lines that had been fused are sitting on a folding table, side by side, with a small modifier "25" pinned between them like a ribbon.',
    ],
  },
}
