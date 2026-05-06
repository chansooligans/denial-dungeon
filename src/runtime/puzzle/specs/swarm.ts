// Sprite Swarm (CO-16) — runtime puzzle spec. Eighteen 277CA
// rejections from the same clinic, all CO-16. Fourteen share a
// root cause (blank rendering NPI). Three are real outliers. One
// is a false positive.
//
// Three issues:
//   - BATCH the cluster fix.
//   - SWEEP the outliers (modeled here as 3 separate amend slots
//     for clarity; player resolves all three to clear the issue).
//   - PATCH upstream (file the EHR ticket).
//
// The standalone prototype renders the 18-claim queue; the
// runtime port models each fix as an amend slot.

import type { PuzzleSpec } from '../types'

export const SWARM_PUZZLE: PuzzleSpec = {
  id: 'swarm',
  title: 'Sprite Swarm',
  district: 'eligibility',
  hospitalIntro: [
    'Coffee not hot yet. The weekend\'s 277CA rejections finished ' +
      'posting overnight. Eighteen claims, all from Smith Family ' +
      'Medicine — Dr. Lila Smith\'s clinic across the lobby. All ' +
      'flagged CO-16. Total charge value: $2,460. Small dollars, ' +
      'irritating volume.',
    'You scroll the list. Most of them say the same thing in the ' +
      'detail string. You stop scrolling.',
  ],
  briefing: {
    paragraphs: [
      '"This one is the Swarm. CO-16 is the most common denial code ' +
      'in the building because it\'s a catch-all — anything missing ' +
      'from the claim. The CARC itself tells you almost nothing. ' +
      'The detail string tells you everything. Read those first."',
      '"When you see eighteen of these on a Monday morning, check ' +
      'for a pattern before you start fixing them one at a time. If ' +
      'they\'re from the same clinic with the same detail string, ' +
      'that\'s not a queue — that\'s one bug in the upstream system."',
    ],
    bullets: [
      '<strong>BATCH the cluster.</strong> Fourteen of these claims ' +
      'share a detail string. Figure out the right NPI, apply it to ' +
      'all fourteen at once.',
      '<strong>SWEEP the outliers.</strong> The remaining four have ' +
      'different issues. Most need real fixes. One is a false ' +
      'positive — looks broken, isn\'t. Triage matters.',
      '<strong>PATCH upstream.</strong> Why was the NPI blank? ' +
      'Dr. Smith\'s profile in the EHR has an empty rendering-NPI ' +
      'field. File an IT ticket so this stops happening.',
    ],
    signoff: '"Don\'t be the person who fixes the same fourteen claims every Monday. — D."',
  },
  issues: [
    {
      id: 'batch-npi',
      label: 'Batch-fix the 14 NPI rejections — apply Dr. Smith\'s correct NPI to all of them.',
      recap: "Fourteen claims share the same root cause — Dr. Smith's NPI was sent as 0000000000 on every one. Fixed once, applied across the cluster. The queue isn't actually 14 problems; it's one problem 14 times.",
      verb: 'batch',
    },
    {
      id: 'outlier-dx',
      label: 'Outlier 1 — fix the missing diagnosis pointer on Box 24E.',
      recap: 'Box 24E now points at Box 21A — the only diagnosis on the claim. Resubmits clean.',
      verb: 'sweep',
    },
    {
      id: 'outlier-pos',
      label: 'Outlier 2 — fix the wrong place-of-service code.',
      recap: 'POS corrected from 99 (other) to 11 (office). Matches the encounter note.',
      verb: 'sweep',
    },
    {
      id: 'outlier-clean',
      label: 'Outlier 3 — triage the false positive.',
      recap: "Imani's claim was flagged CO-16 by the clearinghouse but all fields were actually populated. Marked no-action; resubmits as-is.",
      verb: 'sweep',
    },
    {
      id: 'patch-upstream',
      label: 'Patch upstream — file an EHR ticket so the NPI stops being blank.',
      recap: "Logged the upstream root cause: Dr. Smith's provider profile in the EHR has a blank rendering-NPI field. The billing module defaults blank NPIs to '0000000000'. Filed for IT to fix the profile and add a non-empty validator.",
      verb: 'patch',
    },
  ],
  amendSlots: [
    {
      issueId: 'batch-npi',
      fieldLabel: 'Box 24j · NPI (apply to all 14)',
      contextLine: 'All 14 claims have the same blank-NPI default placeholder. Fix once, apply to the cluster.',
      options: [
        {
          id: '0000000000',
          label: '0000000000',
          support: 'current',
          feedback: "That's what the queue already has — the placeholder the billing system inserted when the profile field was blank. That's the bug, not the fix.",
        },
        {
          id: '1487329104',
          label: '1487329104 — Dr. Lila Smith',
          support: 'correct',
          feedback: "Matches Dr. Smith's NPI on file with NPPES. Applied to the cluster — all 14 claims will resubmit with this on Box 24j.",
        },
        {
          id: '1487329140',
          label: '1487329140',
          support: 'wrong',
          feedback: 'Last two digits transposed. NPIs are checksum-validated; this would fail the Luhn check at the clearinghouse.',
        },
        {
          id: '1487329',
          label: '1487329',
          support: 'partial',
          feedback: 'Truncated. NPIs are exactly 10 digits — this is 7. The clearinghouse would reject on length validation.',
        },
      ],
    },
    {
      issueId: 'outlier-dx',
      fieldLabel: 'Outlier 1 · Box 24E (Diagnosis pointer)',
      contextLine: 'Box 21A has the only diagnosis on the claim. Box 24E is blank.',
      options: [
        {
          id: 'A',
          label: 'A — point at the only diagnosis on the claim',
          support: 'correct',
          feedback: 'Right call. Box 24E now points at Box 21A. Resubmits clean.',
        },
        {
          id: 'blank',
          label: '— leave blank, payer will figure it out',
          support: 'current',
          feedback: 'They will not figure it out. Blank dx pointer = CO-16 again. The pointer is required.',
        },
        {
          id: 'X',
          label: 'X — placeholder',
          support: 'wrong',
          feedback: "Pointers are letters A-D referencing existing Box 21 entries. X isn't valid.",
        },
      ],
    },
    {
      issueId: 'outlier-pos',
      fieldLabel: 'Outlier 2 · Box 24B (Place of service)',
      contextLine: 'Box 24B shows POS 99 (other). The encounter note says the patient was seen in the clinic office.',
      options: [
        {
          id: '11',
          label: '11 — Office',
          support: 'correct',
          feedback: "Office visit, POS 11. Matches the encounter note. Resubmits clean.",
        },
        {
          id: '99',
          label: '99 — Other (current)',
          support: 'current',
          feedback: "POS 99 was the rejection reason in the first place. Specific codes adjudicate; 'other' doesn't.",
        },
        {
          id: '22',
          label: '22 — On-campus outpatient hospital',
          support: 'wrong',
          feedback: "He wasn't seen in a hospital outpatient department — he was seen in Smith Family Medicine's office. POS 22 would underpay.",
        },
        {
          id: '23',
          label: '23 — Emergency room',
          support: 'wrong',
          feedback: 'Not an ER visit. Wrong POS triggers another denial — and ER reimbursement rates would lift the payer\'s eyebrows.',
        },
      ],
    },
    {
      issueId: 'outlier-clean',
      fieldLabel: 'Outlier 3 · Imani Edwards (false positive)',
      contextLine: "All Box-24 fields populated; clearinghouse appears to have flagged in error. Decide what to do.",
      options: [
        {
          id: 'no-action',
          label: 'Mark as no-action — leave on the resubmit queue as-is',
          support: 'correct',
          feedback: "Right call. Sometimes the right move is no move; this resubmits as-is and the clearinghouse won't false-positive it twice in a row.",
        },
        {
          id: 'rebuild',
          label: 'Rebuild the 837 from scratch',
          support: 'wrong',
          feedback: "Make-work — the claim is fine. Rebuilding doesn't reduce error rate; it raises it.",
        },
        {
          id: 'writeoff',
          label: 'Write off the $220 charge',
          support: 'wrong',
          feedback: "$220 left on the table for no reason. The claim is good — it just needs to resubmit.",
        },
      ],
    },
    {
      issueId: 'patch-upstream',
      fieldLabel: 'Upstream patch · EHR ticket',
      contextLine: "Root cause: Dr. Smith's EHR profile has a blank rendering-NPI field. Billing module defaults blank to '0000000000'.",
      options: [
        {
          id: 'file-ticket',
          label: 'File IT ticket: populate NPI in profile + add non-empty validator',
          support: 'correct',
          feedback: 'Logged. Next Monday\'s rejection batch from Smith Family Medicine drops to two claims, not fourteen.',
        },
        {
          id: 'note',
          label: 'Add a note in the AR shared doc',
          support: 'partial',
          feedback: 'Better than nothing, but a note doesn\'t fix the upstream profile. Without the IT ticket, the cluster comes back next week.',
        },
        {
          id: 'skip',
          label: 'Skip — we\'ll just clean it up again next Monday',
          support: 'wrong',
          feedback: 'That is exactly the trap. The cluster doubles each week if upstream isn\'t fixed.',
        },
      ],
    },
  ],
  submitLabel: 'RESUBMIT QUEUE — 18 CLAIMS',
  victory: {
    headline: 'The queue empties.',
    paragraphs: [
      "Seventeen of the eighteen claims adjudicate clean overnight. The eighteenth (Imani's) sails through without anybody noticing the clearinghouse had false-positived it. The IT ticket comes back closed the same afternoon — Dr. Smith's profile is fixed and the billing module has a new validator. Next Monday's rejection batch from her clinic is two claims, not fourteen.",
      'The Swarm is gone. Where it was, you can see clearly for the first time — eighteen tiny envelopes stacked neatly on a table, with one ten-digit number written on a small card on top. The number Dr. Smith\'s profile should have had all along.',
    ],
  },
}
