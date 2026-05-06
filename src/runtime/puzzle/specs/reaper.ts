// Reaper (CO-29) — runtime puzzle spec. Timely-filing denial on
// Devon Park's TKA. AMEND the subscriber ID on Box 1a (transposed
// digits — that's why the 277CA kept bouncing) + CITE the
// extenuating-circumstances waiver backed by the 277CA chain.
//
// The standalone prototype layers a 14-day countdown; the runtime
// port keeps the verb-space and saves the time-pressure UI for a
// follow-up.

import { CASES } from '../../../content/cases'
import type { PuzzleSpec } from '../types'

const reaperCase = CASES.case_reaper_park

function claimFromCase() {
  const c = reaperCase.claim!
  if (c.type !== 'cms1500') throw new Error('reaper case must be cms1500')
  return {
    claimId: c.claimId,
    patientName: c.patient.name,
    patientDob: c.patient.dob,
    insurer: 'Aetna PPO',
    // The case data has the *correct* id; the puzzle starts from the
    // pre-fix state, so render with the bounced id and let the amend
    // restore the right one.
    insuredId: 'AET882441293',
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

export const REAPER_PUZZLE: PuzzleSpec = {
  id: 'reaper',
  title: 'Reaper',
  district: 'appeals',
  hospitalIntro: [
    'Devon Park leans against your office doorframe with that ' +
      'carefully-calm look people get when they\'ve been on hold ' +
      'with a billing department for an hour. "Hey — I just got a ' +
      'letter. Aetna says my knee surgery from last August won\'t ' +
      'be covered. They said it was filed too late. But… we ' +
      'scheduled the surgery <em>through</em> them?"',
    'He sets the letter on your desk. CO-29. Final denial, dated ' +
      'April 20. You pull up the file. The 277CA log scrolls past ' +
      'on the second monitor — four bounces, same reason each time. ' +
      'The claim never reached Aetna.',
  ],
  briefing: {
    paragraphs: [
      '"This one is a Reaper. CO-29. Aetna says we filed too late. ' +
      'Their final denial went out fifteen days ago, which means ' +
      'we\'re running on a narrow appeal window before the file is ' +
      'dead and Devon owes $42,300 he doesn\'t have."',
      '"Two issues. Both have to land:"',
    ],
    bullets: [
      '<strong>Amend the claim.</strong> The Box 1a subscriber ID ' +
      'has been transposed since day one. That\'s why the 277CA ' +
      'kept bouncing it at the clearinghouse — it never reached ' +
      'Aetna. Click the claim\'s subscriber line to fix it. ' +
      '<em>This is the root-cause fix.</em>',
      '<strong>Build a citation.</strong> File an extenuating-' +
      'circumstances waiver. Show that we tried to file <em>inside</em> ' +
      'the 90-day window — the 277CA receipts prove it — and point ' +
      'at Aetna\'s own provider manual section that allows for this ' +
      'exact case. <em>This is what unlocks the appeal.</em>',
    ],
    signoff: '"Don\'t be most people. — D."',
  },
  claim: claimFromCase(),
  issues: [
    {
      id: 'subscriber-id',
      label: 'Amend the subscriber ID on Box 1a so the claim stops bouncing.',
      recap: "The 277CAs have been telling us this for nine months. The last four digits were transposed: AET882441293 → AET882441923. Same digits, different order. Now the claim can land at Aetna instead of getting kicked back at the clearinghouse.",
      verb: 'amend',
    },
    {
      id: 'timely-waiver',
      label: 'Cite proof of timely original submission for the extenuating-circumstances waiver.',
      recap: "You just argued: we tried to file inside the 90-day window — within seven days of surgery, in fact — but the clearinghouse kept bouncing it on a transposed ID. Aetna's own provider manual carves out an extenuating-circumstances waiver for exactly this scenario, provided we can show the 277CA acknowledgments. We can.",
      verb: 'cite',
    },
  ],
  payerProse:
    'Aetna denied the claim. They said it was {{phrase:window}} and ' +
    'that the {{phrase:subscriber}}.',
  payerPhrases: [
    {
      id: 'window',
      text: 'received outside the 90-day timely filing window',
      plain: "Aetna says the claim arrived in their system after the 90-day window closed. Their final denial. Without a waiver, we lose the $42,300.",
      issueId: 'timely-waiver',
    },
    {
      id: 'subscriber',
      text: 'subscriber identifier not found in our records',
      plain: "Every previous submission attempt bounced at the clearinghouse for this exact reason — the ID on Box 1a doesn't match any active Aetna subscriber. The 277CAs flagged it each time.",
      issueId: 'subscriber-id',
    },
  ],
  chartHeader: '277CA log + chart (Park, D.)',
  chartFacts: [
    {
      id: 'first-submit',
      plain: "Our billing system first submitted this claim on 2025-08-22 — exactly seven days after surgery, well within Aetna's 90-day window.",
      technical: "Clearinghouse log: 837P submitted 2025-08-22T14:11Z; ICN 2025-08-22-A22087.",
      issueId: 'timely-waiver',
    },
    {
      id: '277ca-chain',
      plain: "Every submission attempt got a 277CA bounce within 48 hours: 2025-08-25, 2025-09-14, 2025-10-09, 2026-01-15. Same reason each time: subscriber ID not found.",
      technical: "277CA STC*A7:562*U: subscriber id not found in payer master, ref AET882441293, suggested AET882441923.",
      issueId: 'timely-waiver',
    },
    {
      id: 'surgery-success',
      plain: "Devon was ambulating well at the six-week post-op visit; recovery has been straightforward.",
      technical: "Op note + 6-wk f/u: WBAT, ROM 0-110°, no effusion; routine PT progression.",
      issueId: null,
      distractorReason: "How well the patient is recovering doesn't bear on whether the claim can still be filed. The waiver is about timely-filing intent, not clinical outcome.",
    },
    {
      id: 'patient-eligible',
      plain: "Devon's coverage was active on 2025-08-15 — the 270/271 eligibility check that morning came back clean.",
      technical: "270 inquiry 2025-08-15T07:42Z; 271 response: active coverage, group 0078421, copay $400.",
      issueId: null,
      distractorReason: "Eligibility on the surgery date isn't disputed — Aetna isn't claiming Devon wasn't covered. They're claiming we filed late. The waiver argument needs to be about *when we tried to file*.",
    },
  ],
  policyHeader: 'Aetna Provider Manual',
  policyClauses: [
    {
      id: 'waiver-rule',
      source: 'Aetna PPM',
      plain: "Aetna's provider manual allows an extenuating-circumstances waiver for claims that bounced at the clearinghouse on identifier issues, provided the original submission was inside the 90-day window and 277CA evidence is attached.",
      technical: "§4.2.3 (timely filing waivers) — extenuating circumstances includes 'documented EDI rejection chains where the provider's good-faith original submission predates the contractual filing limit.'",
      issueId: 'timely-waiver',
    },
    {
      id: '277ca-evidence',
      source: 'Aetna PPM',
      plain: "A complete 277CA acknowledgment chain is acceptable proof of attempted timely filing — the dates on the bounces become the dates of record.",
      technical: "§4.2.3.b — acceptable proof: 'all 277CA STC code records with timestamps, plus the original 837P submission ICN.'",
      issueId: 'timely-waiver',
    },
    {
      id: 'prior-auth-rule',
      source: 'Aetna PPM',
      plain: "Aetna's prior-auth rule for elective orthopedic surgeries.",
      technical: "§6.1 — prior auth required for elective inpatient and selected outpatient orthopedic procedures.",
      issueId: null,
      distractorReason: "Prior-auth wasn't the denial reason here — Aetna issued CO-29 (timely filing), not CO-15 or CO-197.",
    },
  ],
  amendSlots: [
    {
      issueId: 'subscriber-id',
      fieldLabel: 'Box 1a · Subscriber ID',
      contextLine: 'Every 277CA bounce-back log lists AET882441923 as the suggested correction. The current ID has the last four digits transposed.',
      claimTarget: { kind: 'subscriberId' },
      options: [
        {
          id: 'AET882441293',
          label: 'AET882441293',
          support: 'current',
          feedback: "This is what's currently on the claim — and it's why the 277CA has bounced it four times.",
        },
        {
          id: 'AET882441923',
          label: 'AET882441923',
          support: 'correct',
          feedback: "Last four digits restored to the order Aetna's eligibility system actually uses. Matches every 277CA bounce-back the clearinghouse has been mailing us.",
        },
        {
          id: 'AET88241923',
          label: 'AET88241923',
          support: 'partial',
          feedback: "Close, but you dropped a digit. Aetna IDs are eleven characters after the 'AET' prefix.",
        },
        {
          id: 'AET882441329',
          label: 'AET882441329',
          support: 'wrong',
          feedback: "A different transposition — still doesn't match. The 277CA log explicitly listed AET882441923 as the correct subscriber.",
        },
      ],
    },
  ],
  submitLabel: 'SUBMIT WAIVER + CORRECTED CLAIM',
  victory: {
    headline: 'The waiver lands.',
    paragraphs: [
      "Aetna's appeals team accepts the extenuating-circumstances waiver. The 277CA chain did the heavy lifting — they could see the original 2025-08-22 submission stamp, well inside the window. The corrected claim adjudicates in the next ERA. Devon won't owe the $42,300.",
      'Where the Reaper stood, an unsealed file folder is sitting on a table — Devon Park, 2025-08-15 — with four 277CA receipts paperclipped to the cover.',
    ],
  },
}
