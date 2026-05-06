// Wraith (CO-50) — runtime puzzle spec. Medical-necessity denial on
// Walker's TTE. Same shape as Bundle: AMEND the diagnosis on Box 21
// (replace I50.9 with the more specific I50.22) + CITE the kidney
// alternative path and the symptomatology clause.

import { CASES } from '../../../content/cases'
import type { PuzzleSpec } from '../types'

const wraithCase = CASES.case_wraith_walker

function claimFromCase() {
  const c = wraithCase.claim!
  if (c.type !== 'cms1500') throw new Error('wraith case must be cms1500')
  return {
    claimId: c.claimId,
    patientName: c.patient.name,
    patientDob: c.patient.dob,
    insurer: c.insured.name ?? 'BCBS NC PPO',
    insuredId: c.insured.id,
    diagnoses: c.diagnoses.map(d => ({ code: d.code, label: d.label })),
    serviceLines: c.serviceLines.map(line => ({
      dos: line.dos,
      pos: line.pos,
      cptCode: line.cpt.code,
      cptLabel: line.cpt.label,
      modifier: line.modifier ?? '—',
      charges: line.charges,
    })),
  }
}

export const WRAITH_PUZZLE: PuzzleSpec = {
  id: 'wraith',
  title: 'Wraith',
  district: 'appeals',
  hospitalIntro: [
    'Mrs. Walker\'s daughter called this morning. Her mother\'s ' +
      'echocardiogram (a heart ultrasound) came back denied — ' +
      'CO-50, "not medically necessary." She\'s 67 and her ' +
      'cardiologist is worried.',
    'The CDI specialist, Martinez, is on vacation. The case is ' +
      'on your desk. You walk to the CDI workroom to read the ' +
      'chart. You pull the file, sit down, open it —',
  ],
  briefing: {
    paragraphs: [
      '"Walker\'s claim got denied. Insurance said it wasn\'t ' +
      'medically necessary. Your job is to <strong>argue back</strong> — ' +
      'make the case that they should pay anyway."',
      '"Two ways to address an issue, and you need to know which to reach for:"',
    ],
    bullets: [
      '<strong>Amend the claim.</strong> Sometimes the issue is ' +
      'just that the wrong code was billed. The chart supports ' +
      'something more specific; you change it. Click directly on ' +
      'a disputed box on the claim form (Box 21 is the diagnosis) ' +
      'to amend it. <em>This is the cheap fix.</em>',
      '<strong>Build a citation.</strong> When there\'s nothing ' +
      'simple to fix — when the policy has an alternative path, ' +
      'or when the chart\'s evidence supports a real argument — ' +
      'connect a chart fact and a policy clause to the payer\'s ' +
      'specific assertion. <em>That\'s an appeal.</em>',
    ],
    signoff: '"Don\'t be most people. — D."',
  },
  claim: claimFromCase(),
  issues: [
    {
      id: 'specificity',
      label: 'Replace the vague diagnosis on the claim with a specific one.',
      recap: "Fixed at the source. The chart documented systolic dysfunction all along; the original biller just used the unspecific code. Once the dx is right, the policy's specificity rule no longer applies. No argument needed.",
      verb: 'amend',
    },
    {
      id: 'criterion',
      label: "Use the policy's kidney-function alternative path.",
      recap: "You just argued: even without the heart-pumping measurement, the patient's poor kidney function (per the chart) qualifies them under an *alternative path* the policy itself spells out.",
      verb: 'cite',
    },
    {
      id: 'symptomatology',
      label: "Show the chart documents qualifying symptoms.",
      recap: "You just argued: the chart documents specific symptoms (fatigue, swelling, declining kidneys). The policy explicitly accepts documented symptoms in place of the heart-pumping measurement.",
      verb: 'cite',
    },
  ],
  payerProse:
    'BCBS NC denied the TTE. They said it was not medically ' +
    'necessary {{phrase:lvef}} and {{phrase:no-evidence}}.',
  payerPhrases: [
    {
      id: 'lvef',
      text: 'without supporting evidence of LVEF<35%',
      plain: 'No proof of how poorly the heart was pumping (LVEF is a measurement of heart function).',
      issueId: 'criterion',
    },
    {
      id: 'no-evidence',
      text: 'absent supporting documentation',
      plain: "The chart didn't include enough evidence of the patient's symptoms.",
      issueId: 'symptomatology',
    },
  ],
  chartHeader: 'Chart (Walker, A.)',
  chartFacts: [
    {
      id: 'creat',
      plain: "Kidney function is poor. (High creatinine reading from a few months ago.)",
      technical: 'Labs (3 mo prior): creatinine 2.8 mg/dL',
      issueId: 'criterion',
    },
    {
      id: 'sx',
      plain: "The patient has clear symptoms — tired, swelling, kidneys getting worse.",
      technical: 'Documented fatigue, edema, declining GFR',
      issueId: 'symptomatology',
    },
    {
      id: 'ckd',
      plain: "The patient has long-standing kidney disease (moderate stage).",
      technical: 'Patient has chronic kidney disease, stage 3',
      issueId: 'criterion',
    },
    {
      id: 'referrer',
      plain: "The doctor who ordered the test is in the insurance company's network.",
      technical: 'Referring provider is in-network',
      issueId: null,
      distractorReason: "Network status doesn't address whether the test was medically necessary.",
    },
  ],
  policyHeader: 'LCD L33457 (Echocardiography)',
  policyClauses: [
    {
      id: 'creat-alt',
      source: 'LCD',
      plain: "Alternate path: poor kidney function plus documented symptoms also qualifies — even without the heart-pumping measurement.",
      technical: 'Alternative criterion: creatinine > 2.5 mg/dL with documented symptomatology.',
      issueId: 'criterion',
    },
    {
      id: 'sx-required',
      source: 'LCD',
      plain: "If the heart-pumping measurement isn't on file, documented symptoms can stand in.",
      technical: 'Documented symptomatology required for coverage when LVEF data not on file.',
      issueId: 'symptomatology',
    },
  ],
  amendSlots: [
    {
      issueId: 'specificity',
      fieldLabel: 'Box 21 · Diagnosis A',
      contextLine: 'The chart documents chronic systolic dysfunction — long-standing, with reduced ejection fraction noted in cardiology consult.',
      claimTarget: { kind: 'diagnosisCode', diagnosisIndex: 0 },
      options: [
        {
          id: 'I50.9',
          label: 'Heart failure, unspecified',
          support: 'current',
          feedback: "This is what's already on the claim — the vague code that triggered the denial.",
        },
        {
          id: 'I50.20',
          label: 'Systolic heart failure, unspecified',
          support: 'partial',
          feedback: "Better than I50.9 — at least it's systolic. But the chart documents this as *chronic*, so we can be more specific.",
        },
        {
          id: 'I50.22',
          label: 'Chronic systolic (congestive) heart failure',
          support: 'correct',
          feedback: "Matches the chart: documented systolic dysfunction, long-standing. This is what the chart actually supports.",
        },
        {
          id: 'I50.30',
          label: 'Diastolic heart failure, unspecified',
          support: 'wrong',
          feedback: "The chart documents *systolic* dysfunction, not diastolic. This would be wrong — and arguably worse than the current code.",
        },
      ],
    },
  ],
  submitLabel: 'SUBMIT APPEAL PACKET',
  victory: {
    headline: 'The packet submits.',
    paragraphs: [
      "Walker's appeal is approved. The TTE is covered. Her daughter calls back to say thank you. You don't tell her about the room you fell into.",
      'The Wraith is not where she was. The chair where she sat is empty. There are still <em>so many</em> chairs.',
    ],
  },
}
