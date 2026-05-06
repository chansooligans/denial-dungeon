// Doppelgänger (CO-18) — runtime puzzle spec. Duplicate-claim
// adjudication: an original was denied for a transposed subscriber
// id, the biller fixed the id and resubmitted as a *fresh* 837
// instead of a replacement, and now both copies sit in Humana's
// duplicate bucket. Two issues:
//
//   - REPLACE Box 22 with the right frequency code (7) + the
//     original ICN reference. Modeled as a single amend slot with
//     paired options so freq-without-icn or icn-without-freq
//     can't accidentally win.
//   - CONFIRM Box 1a subscriber id matches Humana's 271 response.
//
// The standalone prototype renders a side-by-side claim-history
// widget showing original/resub status flips. The runtime port
// keeps just the resubmitted claim and resolves issues via the
// amend modal — simplification we'll revisit if it confuses
// players.

import { CASES } from '../../../content/cases'
import type { PuzzleSpec } from '../types'

const doppelCase = CASES.case_doppel_reyes

function claimFromCase() {
  const c = doppelCase.claim!
  if (c.type !== 'cms1500') throw new Error('doppel case must be cms1500')
  return {
    claimId: 'CLM-2026-03-12-21055', // the resubmission's ICN
    patientName: c.patient.name,
    patientDob: c.patient.dob,
    insurer: 'Humana',
    insuredId: 'HUM712390', // already correct on the resub; player just confirms
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

export const DOPPELGANGER_PUZZLE: PuzzleSpec = {
  id: 'doppelganger',
  title: 'Doppelgänger',
  district: 'billing',
  hospitalIntro: [
    'Lou, the biller, slides into your cube. "Fatima Reyes — ' +
      'diabetes follow-up from March 8. Original got denied for ' +
      'subscriber-not-found; I caught it, fixed the ID, resubmitted ' +
      'on March 12. Now <em>both</em> claims are denied as ' +
      'duplicates. CO-18. Humana thinks I\'m double-billing them."',
    'You pull up the file. Two ICNs. Two claims sitting in the ' +
      'duplicate-flag bucket. The resubmission was filed as a fresh ' +
      '837 instead of as a replacement — frequency code reads ' +
      '<em>1 (original)</em>, when it should read <em>7 (replacement)</em> ' +
      'with the original ICN in the next field over.',
  ],
  briefing: {
    paragraphs: [
      '"This one is the Doppelgänger. CO-18. Two claims for the ' +
      'same patient, same date, same provider — and Humana\'s ' +
      'adjudication engine flags both. It\'s not fraud; it\'s a ' +
      'paperwork bug. The biller fixed the original\'s transposed ' +
      'ID and resubmitted, but as a <em>fresh</em> 837 instead of ' +
      'as a replacement. Now Humana doesn\'t know which one is real."',
      '"The fix is small but it has to be exact. Two issues:"',
    ],
    bullets: [
      '<strong>REPLACE the resub.</strong> Open the resubmission\'s ' +
      'Box 22. Set the frequency code to <strong>7 (replacement)</strong>, ' +
      'not 1 (original). Reference the original\'s ICN so Humana\'s ' +
      'engine knows which claim this one supersedes.',
      '<strong>Confirm the subscriber ID.</strong> The whole reason ' +
      'we resubmitted is the original had a transposed ID. Open ' +
      'Box 1a on the replacement and confirm it matches Humana\'s ' +
      '271 response. <em>Pre-flight check before we send.</em>',
    ],
    signoff: '"Don\'t be most people. — D."',
  },
  claim: claimFromCase(),
  issues: [
    {
      id: 'replace',
      label: 'Set Box 22 — frequency code 7 (replacement) referencing the original ICN.',
      recap: "The resubmission now declares itself a replacement for ICN CLM-2026-03-08-19842. Humana's adjudication engine will retire the original claim and adjudicate the replacement; the duplicate flag clears, and only one claim is left to pay.",
      verb: 'replace',
    },
    {
      id: 'confirm',
      label: 'Confirm the subscriber ID on Box 1a matches the 271 response.',
      recap: "The resubmission has HUM712390 — the corrected subscriber ID per Humana's eligibility response. The transposition that doomed the original claim isn't repeated. Pre-flight check complete.",
      verb: 'confirm',
    },
  ],
  amendSlots: [
    {
      issueId: 'replace',
      fieldLabel: 'Box 22 · Resubmission code + original ICN',
      contextLine: '277CA log: original claim ICN CLM-2026-03-08-19842, denied 2026-03-09 for subscriber-not-found. Resubmission ICN CLM-2026-03-12-21055 filed 2026-03-12 with corrected ID.',
      options: [
        {
          id: 'freq:1',
          label: 'Frequency 1 (Original) — no original ICN reference',
          support: 'current',
          feedback: "What's currently on the resubmission — and exactly the bug. Humana sees two originals for the same patient/date/provider and flags both as duplicates.",
        },
        {
          id: 'freq:7|icn:CLM-2026-03-08-19842',
          label: 'Frequency 7 (Replacement) referencing CLM-2026-03-08-19842',
          support: 'correct',
          feedback: "Frequency 7 with the original ICN tells Humana's engine: retire the prior claim, adjudicate this one. Duplicate flag clears.",
        },
        {
          id: 'freq:7|icn:resub',
          label: 'Frequency 7 (Replacement) referencing CLM-2026-03-12-21055',
          support: 'wrong',
          feedback: "That's the resubmission's *own* ICN — a claim can't reference itself. The engine rejects this as malformed.",
        },
        {
          id: 'freq:7|icn:none',
          label: 'Frequency 7 (Replacement) — no ICN reference',
          support: 'partial',
          feedback: 'Frequency 7 needs an original ICN to point at. Without it the replacement has nothing to replace; the engine rejects.',
        },
        {
          id: 'freq:6|icn:CLM-2026-03-08-19842',
          label: 'Frequency 6 (Corrected) referencing CLM-2026-03-08-19842',
          support: 'partial',
          feedback: 'Frequency 6 is for narrow corrections — typically used for line-item adjustments where the original was paid. The original here was *denied*; replacement (7) is the right verb.',
        },
        {
          id: 'freq:8|icn:CLM-2026-03-08-19842',
          label: 'Frequency 8 (Void/Cancel) referencing CLM-2026-03-08-19842',
          support: 'wrong',
          feedback: 'Frequency 8 voids the claim outright with no replacement. The patient was actually seen — we want to be paid, not retract the bill entirely.',
        },
      ],
    },
    {
      issueId: 'confirm',
      fieldLabel: 'Box 1a · Subscriber ID',
      contextLine: 'Humana 271 says: HUM712390. Pick the value that matches.',
      claimTarget: { kind: 'subscriberId' },
      options: [
        {
          id: 'HUM712390',
          label: 'HUM712390',
          support: 'correct',
          feedback: "Matches Humana's 271 eligibility response. The replacement's Box 1a is correct.",
        },
        {
          id: 'HUM712309',
          label: 'HUM712309',
          support: 'wrong',
          feedback: "That's the original transposed ID — the bug that started this whole problem. Don't put it back.",
        },
        {
          id: 'HUM712930',
          label: 'HUM712930',
          support: 'wrong',
          feedback: "Different transposition. Won't match the 271; the replacement would bounce again.",
        },
        {
          id: 'HUM7123',
          label: 'HUM7123',
          support: 'partial',
          feedback: 'Truncated. Humana subscriber IDs are 9 characters after the prefix.',
        },
      ],
    },
  ],
  submitLabel: 'SUBMIT REPLACEMENT CLAIM',
  victory: {
    headline: 'The duplicate clears.',
    paragraphs: [
      "Humana's adjudication engine retires the original ICN, runs the replacement through, and pays $98 contractual on a $145 charge. Lou drops by to say thanks; Fatima never has to know any of this happened.",
      'The Doppelgänger is gone. Where the two of Fatima\'s claims sat in the same chair, there\'s only one chair now — and it\'s empty. A small slip of paper on the floor reads <em>freq 7 · replaces CLM-2026-03-08-19842</em>.',
    ],
  },
}
