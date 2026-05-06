// Audit Boss — runtime puzzle spec. Three RAC findings on Margaret
// Holloway's inpatient stay. For each, the player picks either:
//   - RECEIPT: a chart document that defends the original coding
//     (correct on findings 1 and 2 — the documentation is there).
//   - AMEND:   concede and accept the recoupment
//     (correct on finding 3 — a real billing error).
//
// Three issues, each with its own amend slot. Modeled as a single
// pick per finding: the player chooses one of {receipt-A,
// receipt-B, receipt-C, amend} and the issue resolves if it's the
// supporting move for that finding.
//
// The standalone prototype has bespoke per-finding modals + an
// auditor sentiment meter; the runtime port loses those but
// preserves the pedagogy: defend what the chart supports, concede
// what it doesn't, and don't bluff.

import { CASES } from '../../../content/cases'
import type { PuzzleSpec } from '../types'

const auditCase = CASES.case_audit_finale

function claimFromCase() {
  const c = auditCase.claim!
  if (c.type !== 'cms1500') {
    // Audit case is UB-04; render a minimal CMS-1500-shaped summary
    // for now so the claim panel still has the patient's identity.
    return undefined
  }
  return {
    claimId: c.claimId,
    patientName: c.patient.name,
    patientDob: c.patient.dob,
    insurer: c.insured.name ?? 'Medicare',
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

export const AUDIT_BOSS_PUZZLE: PuzzleSpec = {
  id: 'audit-boss',
  title: 'The Audit',
  district: 'appeals',
  hospitalIntro: [
    'The auditor arrived at 8 AM. She is small, exact, and ' +
      'impeccably dressed. Her badge says Riley Tan, RAC reviewer. ' +
      'She has set up at the long conference table with a single ' +
      'thin laptop and three thin file folders. She is polite. ' +
      'She is unsympathetic. She is good at her job.',
    'The first folder is Margaret Holloway. Five-day inpatient ' +
      'stay last month — sepsis admission, MSSA on cultures, ICU ' +
      'step-down, discharged stable. Three findings flagged for ' +
      'review. $11,970 of revenue is exposed if every finding ' +
      'stands.',
    'On the corner of Riley\'s notebook, half-hidden under a ' +
      'folder, there is a faded photograph in a small frame. You ' +
      'don\'t get a clear look. You\'re not supposed to.',
  ],
  briefing: {
    paragraphs: [
      '"This is the audit. It\'s not a fight against a payer — ' +
      'it\'s a defense of work that\'s already been done. Three ' +
      'findings. For each one you have to decide: do I have the ' +
      'chart evidence to back this up, or is this a real error I ' +
      'should concede before the auditor digs deeper?"',
      '"Two verbs:"',
    ],
    bullets: [
      '<strong>RECEIPT.</strong> Defend the original coding. Pick ' +
      'the right chart document. If the document supports the ' +
      'code, the finding closes; if it doesn\'t, the finding ' +
      'stands AND the auditor gets suspicious. <em>Don\'t bluff.</em>',
      '<strong>AMEND.</strong> Concede the finding. Accept the ' +
      'recoupment. This is what you do when the chart actually ' +
      'doesn\'t support the code, or when the error is small and ' +
      'conceding fast keeps the audit narrow.',
      'On Margaret\'s case: two of these findings are defensible ' +
      '— the principal dx is supported by the day-1 culture; the ' +
      'MCC severity is supported by the ICU flowsheet. One is a ' +
      'real billing error — a duplicate vancomycin charge that ' +
      'just shouldn\'t have been on the bill. <em>Defend the two ' +
      'real ones. Concede the small one cleanly.</em>',
    ],
    signoff: '"This one is the door home. — D."',
  },
  claim: claimFromCase(),
  issues: [
    {
      id: 'principal-dx',
      label: 'Finding 1 — Principal dx A41.01 (Sepsis MSSA): defend or concede.',
      recap: 'Day-1 blood culture is the receipt. Coded in real time, supported by lab. The principal dx stands; DRG 870 holds.',
      verb: 'receipt',
    },
    {
      id: 'severity-mcc',
      label: 'Finding 2 — Severity MCC R65.20 (severe sepsis): defend or concede.',
      recap: 'ICU flowsheet documents MAP < 65, lactate > 4, pressor requirement — all the criteria for R65.20. Severity stands.',
      verb: 'receipt',
    },
    {
      id: 'duplicate-charge',
      label: 'Finding 3 — Duplicate vancomycin charge: defend or concede.',
      recap: "Real billing error. The MAR shows one administration; the bill shows two at the same timestamp. Conceded cleanly — the auditor closes the finding without expanding scope. Recoupment $340.",
      verb: 'amend',
    },
  ],
  amendSlots: [
    {
      issueId: 'principal-dx',
      fieldLabel: 'Finding 1 · Principal dx A41.01',
      contextLine: "Auditor: 'Principal diagnosis A41.01 was added after admission. I don't see real-time documentation of MSSA sepsis at presentation.' Recoupment exposure: $8,420.",
      options: [
        {
          id: 'receipt:culture-day1',
          label: 'RECEIPT — Day-1 blood culture report (MSSA, 2 of 2 bottles)',
          support: 'correct',
          feedback: 'Pulled the lab report. Cultures resulted on day 1 — coded in real time. The principal dx is supported. Riley nods, closes the finding.',
        },
        {
          id: 'receipt:progress-day3',
          label: 'RECEIPT — Day-3 progress note',
          support: 'wrong',
          feedback: "Day-3 is too late — the finding is about whether the dx was supported on admission, not later in the stay. Wrong receipt; the finding stands AND the auditor flags you as a bluffer.",
        },
        {
          id: 'receipt:discharge',
          label: 'RECEIPT — Discharge summary',
          support: 'wrong',
          feedback: "Discharge summary documents the whole stay, including the eventual sepsis treatment — but doesn't establish day-1 documentation. Auditor expands scope.",
        },
        {
          id: 'amend',
          label: 'AMEND — concede the finding, accept $8,420 recoupment',
          support: 'wrong',
          feedback: 'Conceding a defensible finding gives the auditor a free win — and signals the rest of the case may be soft. Pull the day-1 culture instead.',
        },
      ],
    },
    {
      issueId: 'severity-mcc',
      fieldLabel: 'Finding 2 · Severity MCC R65.20',
      contextLine: "Auditor: 'R65.20 (severe sepsis) requires evidence of organ dysfunction. I don't see it documented.' Recoupment exposure: $3,210.",
      options: [
        {
          id: 'receipt:icu-flowsheet',
          label: 'RECEIPT — ICU flowsheet (MAP, lactate, pressor)',
          support: 'correct',
          feedback: 'ICU flowsheet documents MAP < 65, lactate > 4, pressor requirement — textbook R65.20 criteria. Severity stands.',
        },
        {
          id: 'receipt:admission-orders',
          label: 'RECEIPT — Admission orders',
          support: 'wrong',
          feedback: "Admission orders state the plan but don't document the organ dysfunction R65.20 needs. Wrong receipt.",
        },
        {
          id: 'receipt:cxr',
          label: 'RECEIPT — Chest X-ray (pneumonia)',
          support: 'wrong',
          feedback: "Pneumonia is a different finding. R65.20 wants severe-sepsis criteria, not the source. Wrong receipt.",
        },
        {
          id: 'amend',
          label: 'AMEND — concede the finding, accept $3,210 recoupment',
          support: 'wrong',
          feedback: 'The ICU flowsheet has exactly what the auditor is asking for. Conceding here loses defensible revenue.',
        },
      ],
    },
    {
      issueId: 'duplicate-charge',
      fieldLabel: 'Finding 3 · Duplicate vancomycin charge',
      contextLine: "Auditor: 'Two vancomycin administrations at identical timestamps — looks like a duplicate.' Recoupment exposure: $340.",
      options: [
        {
          id: 'amend',
          label: 'AMEND — concede the finding, accept $340 recoupment',
          support: 'correct',
          feedback: 'Real billing error. MAR shows one administration; the bill double-charged. Conceded cleanly — finding closes, audit stays narrow.',
        },
        {
          id: 'receipt:mar',
          label: 'RECEIPT — Medication Administration Record (MAR)',
          support: 'wrong',
          feedback: "The MAR shows ONE dose, not two. Pulling it as a receipt confirms the auditor's finding. Don't bluff.",
        },
        {
          id: 'receipt:pharmacy-orders',
          label: 'RECEIPT — Pharmacy orders',
          support: 'wrong',
          feedback: 'Pharmacy orders show one dose ordered. Defending the duplicate as legitimate makes the auditor expand scope into pharmacy.',
        },
        {
          id: 'receipt:none',
          label: 'RECEIPT — no specific document, just dispute it',
          support: 'wrong',
          feedback: 'Disputing without evidence is the worst possible move on an audit. Concede.',
        },
      ],
    },
  ],
  submitLabel: 'CLOSE THE AUDIT',
  victory: {
    headline: 'The audit closes clean.',
    paragraphs: [
      'Riley closes her notebook. "Documentation defended; one minor billing correction. Audit closed without expansion." She gathers the folders, the laptop, the framed photograph she didn\'t want you to see. Total recoupment: $340 of $11,970 exposed. The two defensible findings retained.',
      'Where Riley sat, the chair is empty. The chevron floor is steady. The faded photograph is gone — but you saw, for half a second, that it was a hospital corridor exactly like this one.',
    ],
  },
}
