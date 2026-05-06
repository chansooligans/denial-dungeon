// COB Hydra (OA-23) — runtime puzzle spec. Three payers, three
// heads. Adaeze Okwu has BCBS Federal (employer plan, still
// working past 65), Medicare, and Medicaid. The COB on file has
// Medicare primary; by Medicare Secondary Payer rules, the
// employer plan should be primary.
//
// The standalone prototype walks the chain three times (primary,
// secondary, tertiary) showing the running balance. The runtime
// port simplifies to a single sequencing pick — once the chain is
// right, the chain walks itself.

import type { PuzzleSpec } from '../types'

export const HYDRA_PUZZLE: PuzzleSpec = {
  id: 'hydra',
  title: 'COB Hydra',
  district: 'billing',
  hospitalIntro: [
    'The COB analyst — her name\'s Bola — drops a chart on your ' +
      'desk. "Mrs. Okwu\'s dialysis claim. $1,250. Bouncing for ' +
      'two months. Three insurance cards on file: BCBS Federal ' +
      'through her job, Medicare since she turned 65, Medicaid ' +
      'because of the kidney disease. Whoever set up the COB at ' +
      'registration listed Medicare primary. Now everybody\'s ' +
      'pointing at everybody else."',
    'You spread the three cards out. They look like an argument. ' +
      'Adaeze is still working — she runs a small catering company ' +
      '— so by Medicare\'s own rules, her employer plan is supposed ' +
      'to pay first. The chain on file has it backwards.',
  ],
  briefing: {
    paragraphs: [
      '"This one is the Hydra. OA-23. Three payers, three heads. ' +
      'They don\'t fight you — they fight each other, and the ' +
      'patient is in the middle. Your job is to hand them the ' +
      'right contract chain so they line up instead of clawing back."',
      '"The rules are contractual. Not optional. Medicare Secondary ' +
      'Payer says: working past 65 with employer coverage = employer ' +
      'plan first. Medicaid law says: Medicaid pays last, period. ' +
      'So the chain Adaeze\'s claim needs is BCBS Federal → Medicare ' +
      'Part B → Medicaid."',
    ],
    bullets: [
      '<strong>SEQUENCE the COB chain.</strong> Three slots — primary, ' +
      'secondary, tertiary. Pick the right payer for each. Once it\'s ' +
      'right, BCBS pays first, Medicare picks up the patient ' +
      'responsibility, Medicaid covers the remainder. The Hydra stops ' +
      'fighting itself.',
    ],
    signoff: '"Don\'t be most people. — D."',
  },
  issues: [
    {
      id: 'reorder',
      label: 'Sequence the COB chain — primary, secondary, tertiary in the correct order.',
      recap: "You moved BCBS Federal to primary. Adaeze is still working, so her employer's group plan pays first by Medicare Secondary Payer rules. Medicare drops to secondary; Medicaid stays at the bottom of the stack as payer of last resort. BCBS pays $850, Medicare picks up $160, Medicaid covers the final $40. Patient responsibility: $0.",
      verb: 'sequence',
    },
  ],
  amendSlots: [
    {
      issueId: 'reorder',
      fieldLabel: 'COB chain · Primary → Secondary → Tertiary',
      contextLine: 'Adaeze still works (employer plan applies). MSP rule: employer plan first. Federal law: Medicaid is always last.',
      options: [
        {
          id: 'medicare-bcbs-medicaid',
          label: 'Medicare → BCBS Federal → Medicaid',
          support: 'current',
          feedback: "What's on file right now. Medicare in the primary slot — but Adaeze is still employed. Her employer plan is primary by federal rule (MSP). Wrong order triggers retraction.",
        },
        {
          id: 'bcbs-medicare-medicaid',
          label: 'BCBS Federal → Medicare → Medicaid',
          support: 'correct',
          feedback: 'Employer plan first (Adaeze works). Medicare drops to secondary per MSP. Medicaid tertiary (payer of last resort, federal law). The chain walks: BCBS pays $850, Medicare picks up $160, Medicaid covers the final $40.',
        },
        {
          id: 'bcbs-medicaid-medicare',
          label: 'BCBS Federal → Medicaid → Medicare',
          support: 'partial',
          feedback: 'BCBS is right for primary. But you\'ve reversed secondary and tertiary. Medicare should always come before Medicaid in a chain with both — Medicaid is always last.',
        },
        {
          id: 'medicaid-bcbs-medicare',
          label: 'Medicaid → BCBS Federal → Medicare',
          support: 'wrong',
          feedback: 'Medicaid in primary breaks federal law — Medicaid is always payer of last resort. This chain triggers immediate retraction across all three payers.',
        },
      ],
    },
  ],
  submitLabel: 'SUBMIT COB CHAIN',
  victory: {
    headline: 'The three heads stop arguing.',
    paragraphs: [
      "Bola sticks her head in to say the COB chain landed clean. BCBS paid $850, Medicare picked up $160, Medicaid covered the final $40. Adaeze owes $0. The dialysis claim joins the closed pile.",
      'The Hydra\'s three heads are no longer talking over each other. Standing in a row instead, like they were always meant to: BCBS, Medicare, Medicaid. The contract chain — primary to last resort — written in the air above them and slowly, quietly fading.',
    ],
  },
}
