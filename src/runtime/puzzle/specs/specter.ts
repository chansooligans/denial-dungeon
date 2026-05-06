// Underpayment Specter — runtime puzzle spec. BCBS paid four claims
// in one ERA; one is underpaid by $28 (chest x-ray paid against
// last year's $14 fee instead of this year's $42). The hardest
// fight in the building because the claim already paid — there's
// no denial letter to read.
//
// Two issues:
//   - DETECT  — find the underpayment.
//   - APPEAL  — file with the right shortfall and reason.
//
// The standalone prototype renders the ERA + fee schedule
// side-by-side so the player runs the math; the runtime port
// models the detect step as a single pick (which line to flag),
// then the appeal as a second pick.

import type { PuzzleSpec } from '../types'

export const SPECTER_PUZZLE: PuzzleSpec = {
  id: 'specter',
  title: 'Underpayment Specter',
  district: 'billing',
  hospitalIntro: [
    'The April 835 from BCBS posted overnight. Four claims in one ' +
      'ERA — three small E&Ms and a chest x-ray. Bola, the AR ' +
      'analyst, drops the printout on your desk. "Looks fine. But ' +
      'the contract-vs-paid report flagged this batch. Something\'s ' +
      'underpaid; I can\'t tell which one."',
    "You spread the ERA next to BCBS's 2026-A fee schedule. The " +
      'total paid looks roughly right. The line-level numbers will ' +
      'tell you where the variance is.',
  ],
  briefing: {
    paragraphs: [
      '"This one is the Specter. Underpayment. Hardest fight in the ' +
      'building because the claim already paid — there\'s no denial ' +
      'letter to read, no CARC to argue with. The payer paid less ' +
      'than they owe, hid the difference inside a CO-45 adjustment, ' +
      'and walked away."',
      '"AR analysts call this a contract-vs-paid variance. The ' +
      'contract says X, the ERA says Y, X minus Y is what you fight ' +
      'for. It\'s small per claim — $28 here. It adds up to millions ' +
      'across a hospital."',
    ],
    bullets: [
      '<strong>DETECT.</strong> Verify each claim against the fee ' +
      'schedule. The math will surface the variance, if any. Three ' +
      'are clean. One isn\'t.',
      '<strong>APPEAL.</strong> Once you\'ve found the underpayment, ' +
      'file with the right shortfall and the right reason. Wrong ' +
      'shortfall = denied appeal. Wrong reason = routed to the wrong ' +
      'queue and lost for a month.',
    ],
    signoff: '"The Specter looks like nothing\'s wrong. That\'s the whole game. — D."',
  },
  issues: [
    {
      id: 'detect',
      label: 'Find the underpayment hidden in the 835.',
      recap: "You spotted it: Patient C's chest x-ray (CPT 71046) was paid $14 against a contracted $42. The ERA's overall pay total looked plausible, but the line-level math told the truth. Underpayment of $28.",
      verb: 'detect',
    },
    {
      id: 'appeal',
      label: 'File the underpayment appeal with the correct shortfall and reason.',
      recap: "You filed with the right shortfall ($28) and the right reason — BCBS's fee schedule for 71046 is $42 per the 2026-A contract; their adjudication engine paid $14, which matches the *prior year's* schedule. Their fee table didn't update on Jan 1.",
      verb: 'appeal',
    },
  ],
  amendSlots: [
    {
      issueId: 'detect',
      fieldLabel: 'ERA · which line is underpaid?',
      contextLine: 'Four lines in this ERA. Compare each paid amount to the 2026-A fee schedule.',
      options: [
        {
          id: 'line-c-71046',
          label: 'Patient C, line 2 — CPT 71046 (chest x-ray): paid $14, contract $42',
          support: 'correct',
          feedback: "Found it. 71046's contracted rate is $42 effective 2026-01-01; BCBS paid $14, which matches the *prior year's* $14 fee. Their fee table didn't roll forward.",
        },
        {
          id: 'line-a-99213',
          label: 'Patient A, line 1 — CPT 99213: paid $98, contract $98',
          support: 'wrong',
          feedback: 'Match. $98 paid against $98 contract — clean.',
        },
        {
          id: 'line-b-99214',
          label: 'Patient B, line 1 — CPT 99214: paid $145, contract $145',
          support: 'wrong',
          feedback: 'Match. $145 paid against $145 contract — clean.',
        },
        {
          id: 'line-d-99203',
          label: 'Patient D, line 1 — CPT 99203: paid $135, contract $135',
          support: 'wrong',
          feedback: 'Match. $135 paid against $135 contract — clean.',
        },
      ],
    },
    {
      issueId: 'appeal',
      fieldLabel: 'Underpayment appeal · shortfall + reason',
      contextLine: 'CPT 71046, paid $14, contracted $42. Pick the appeal that matches.',
      options: [
        {
          id: 'right-amount-right-reason',
          label: '$28 · 71046 paid against 2025 fee table; 2026-A contract sets allowed at $42',
          support: 'correct',
          feedback: "Right shortfall, right reason. BCBS's adjudication engine still has the prior year's $14 rate cached. Filing with the contract reference triggers manual review and a corrected 835.",
        },
        {
          id: 'wrong-amount-co45',
          label: '$46 · CO-45 adjustment exceeded contracted amount',
          support: 'wrong',
          feedback: '$46 is the *adjustment* (billed minus paid: $60 - $14). The shortfall is contract-vs-paid: $42 - $14 = $28. Rejecting CO-45 entirely would mean asking BCBS to pay $60 — that\'s not the contract.',
        },
        {
          id: 'right-amount-wrong-reason',
          label: '$28 · Medical necessity on 71046 not supported',
          support: 'wrong',
          feedback: "Right shortfall, wrong reason — they didn't deny medical necessity (the line paid; the issue is the rate). A med-nec argument here would route to the wrong appeals queue.",
        },
        {
          id: 'wrong-amount-billed',
          label: '$60 · 71046 line should have paid in full per contract',
          support: 'wrong',
          feedback: "$60 is what was *billed*, not what's contracted. Contract allows $42; they paid $14; shortfall is $28.",
        },
        {
          id: 'wrong-amount-contracted',
          label: '$42 · 71046 underpaid; contract allows $42',
          support: 'partial',
          feedback: '$42 is the *contracted rate*, not the shortfall. Shortfall is what they owe us beyond what they paid: $42 - $14 = $28.',
        },
      ],
    },
  ],
  submitLabel: 'FILE UNDERPAYMENT APPEAL',
  victory: {
    headline: 'The Specter pays the difference.',
    paragraphs: [
      "BCBS reprocesses the chest x-ray line at the 2026-A rate. The corrected 835 lands with a $28 recoupment line. Bola adds the find to her log: thirty-fifth underpayment caught this quarter, $4,200 recovered. The contract-vs-paid report keeps catching them; you keep filing.",
      'The Specter is gone. Where it was, a small ledger is sitting open on a table — a single line in green ink: <em>BCBS · clm-C · 71046 · $28 recovered · 2026-04-30</em>. The page turns itself.',
    ],
  },
}
