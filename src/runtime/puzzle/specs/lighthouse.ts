// Lighthouse — runtime puzzle spec. Charity-care / financial-
// assistance encounter. Maria Vega has an $87,420 stroke bill and
// no insurance (her job ended two weeks before the stroke). The
// "obstacle" isn't a payer; it's the gap between her and the FA
// program that already exists.
//
// Three issues:
//   - LISTEN  — ask a follow-up question that gets useful info
//     without making her feel audited.
//   - SCREEN  — compute her household income against FPL and pick
//     the right tier.
//   - RELEASE — file the bill correctly (charity care, not bad
//     debt or payment plan).
//
// No claim form, no payer, no workbench. Patient-facing.

import type { PuzzleSpec } from '../types'

export const LIGHTHOUSE_PUZZLE: PuzzleSpec = {
  id: 'lighthouse',
  title: 'Lighthouse',
  district: 'appeals',
  hospitalIntro: [
    'Maria Vega is in front of you holding a printed statement. ' +
      '$87,420. She\'s 42, food service, two kids. Six weeks ago ' +
      'she had a stroke at her mother\'s apartment; the ambulance ' +
      'brought her here. ICU, step-down, inpatient rehab. The ' +
      'recovery is going well. The recovery is the only thing ' +
      'going well.',
    'Her job ended on 2026-04-12. Sysco\'s plan ended two weeks ' +
      'before the stroke; she\'d hit her FMLA 60-day mark just ' +
      'before going out, and the policy paused. COBRA would have ' +
      'been $802 a month. She didn\'t sign up. She didn\'t expect ' +
      'to have a stroke.',
    'She\'s not crying. She did her crying weeks ago. Her hands ' +
      'are shaking on the statement.',
  ],
  briefing: {
    paragraphs: [
      '"This one isn\'t a fight. There\'s no payer on the other ' +
      'side of the desk; there\'s just Maria. The bill is already ' +
      'real. The question is what kind of bill it becomes — ' +
      'charity, bad debt, payment plan, or something in between."',
      '"Three issues, in order:"',
    ],
    bullets: [
      '<strong>LISTEN.</strong> She\'s already exhausted. Ask one ' +
      'good follow-up question — the kind that gets you what the ' +
      'application needs without making her feel audited.',
      '<strong>SCREEN.</strong> Open the FA worksheet. Compute her ' +
      'household income against FPL. Pick her tier.',
      '<strong>RELEASE.</strong> File the bill correctly — as ' +
      'charity care under the right tier, not as bad debt and not ' +
      'as a payment-plan-only.',
    ],
    signoff: '"Be the kind one. — D."',
  },
  issues: [
    {
      id: 'listen',
      label: 'Ask a follow-up question that elicits useful information without paternalism.',
      recap: "You asked her about her job's insurance and her recovery, not about whether she made the 'right' financial choices. She told you what she lost when the employer plan ended; she told you what the COBRA premium was; she told you what dinner has looked like for the kids.",
      verb: 'listen',
    },
    {
      id: 'screen',
      label: "Compute Maria's household income against FPL and pick her tier.",
      recap: "Household of 3 (Maria + her two kids). 2024 FPL for HH=3 is $25,820; her income is $32,000, which puts her at 124% FPL — squarely in Mercy's <200% tier. By policy, that's a 100% write-off; she owes $0.",
      verb: 'screen',
    },
    {
      id: 'release',
      label: 'File the bill as charity care, not bad debt and not payment-plan-only.',
      recap: "You filed Maria's $87,420 as charity care under Mercy's <200%-FPL tier. Charity is the *positive* path: the hospital writes the bill off voluntarily because the patient qualifies. Bad debt is what happens when a hospital fails to collect; payment-plan-only would be quietly cruel.",
      verb: 'release',
    },
  ],
  amendSlots: [
    {
      issueId: 'listen',
      fieldLabel: 'Follow-up question',
      contextLine: 'She lost her job on 2026-04-12 and had the stroke on 2026-04-26. The application needs income context.',
      options: [
        {
          id: 'plan-end-timing',
          label: '"Did Sysco\'s plan end when you went on FMLA, or earlier?"',
          support: 'correct',
          feedback: "Right kind of question. Job-loss timing matters for the FA application's narrative — and asking about the *plan*, not about her *choices*, signals you're not auditing her.",
        },
        {
          id: 'judge-cobra',
          label: '"Did you not sign up for COBRA when the plan ended?"',
          support: 'wrong',
          feedback: 'She tried. The COBRA premium was nearly her entire monthly income. The question lands as judgment whether you intended that or not.',
        },
        {
          id: 'bank-statements',
          label: '"I\'ll need to see your bank statements before we can process this."',
          support: 'wrong',
          feedback: "Premature. Mercy's FA application asks for income documentation but not bank statements at intake — paystubs or a tax return suffice. Asking for bank statements in the first thirty seconds reads as suspicion.",
        },
        {
          id: 'recovery',
          label: '"How are you doing with the recovery? Are you back to PT yet?"',
          support: 'partial',
          feedback: "Kind, and exactly the kind of question a human asks. But for the FA application you need information about her household and finances first — there'll be time for the recovery questions when the paperwork is settled.",
        },
      ],
    },
    {
      issueId: 'screen',
      fieldLabel: 'FPL tier',
      contextLine: '2024 FPL for HH=3 is $25,820. Maria\'s income is $32,000 (HH=3). 32000/25820 = 124%.',
      options: [
        {
          id: 'under-200',
          label: 'Under 200% FPL — 100% charity write-off (patient owes $0)',
          support: 'correct',
          feedback: "Right tier. Maria's at 124% FPL — well under 200%. Mercy's policy writes off 100% of the bill for this band.",
        },
        {
          id: '200-300',
          label: '200-300% FPL — 75% write-off (~$21,855 owed)',
          support: 'wrong',
          feedback: "Maria's at 124% FPL, not 200-300%. She qualifies for the under-200% tier, which is a full write-off, not 75%.",
        },
        {
          id: '300-400',
          label: '300-400% FPL — 50% write-off (~$43,710 owed)',
          support: 'wrong',
          feedback: 'Way off. 300% FPL for HH=3 is $77,460; Maria\'s at $32,000.',
        },
        {
          id: 'over-400',
          label: 'Over 400% FPL — not eligible; payment plan only',
          support: 'wrong',
          feedback: "Not even close. 400% FPL for HH=3 is $103,280; Maria earned $32,000 last year. This pick would deny her assistance she clearly qualifies for.",
        },
      ],
    },
    {
      issueId: 'release',
      fieldLabel: 'Disposition',
      contextLine: 'Maria qualifies for Mercy\'s <200%-FPL tier (100% write-off).',
      options: [
        {
          id: 'charity-100',
          label: 'Charity care · 100% write-off ($87,420 written off; patient owes $0)',
          support: 'correct',
          feedback: 'The right tool for who Maria is. Mercy writes the full $87,420 off as charity care; the bill never becomes hers to pay. The lighthouse rings.',
        },
        {
          id: 'charity-75',
          label: 'Charity care · 75% write-off ($21,855 owed on payment plan)',
          support: 'wrong',
          feedback: "Wrong tier. The screening said <200% FPL = 100% write-off; you've applied the 200-300% band's rules.",
        },
        {
          id: 'payment-plan',
          label: 'Payment plan only — $87,420 over 24 months at $3,642/mo',
          support: 'wrong',
          feedback: 'A payment plan she can\'t pay is just deferral. Maria\'s monthly income is around $2,600 pre-tax; $3,642/month is impossible.',
        },
        {
          id: 'bad-debt',
          label: 'Bad debt — write off internally and send to collections',
          support: 'wrong',
          feedback: "Bad debt is the *passive* path: the bill goes to collections, hits Maria's credit, follows her around for seven years. Charity care is the *active* path — same dollar amount written off, but as a deliberate kindness. She qualifies. Use the right tool.",
        },
      ],
    },
  ],
  submitLabel: 'FILE FINANCIAL ASSISTANCE',
  victory: {
    headline: 'The bell rings.',
    paragraphs: [
      "Mercy's financial-assistance committee approves the write-off. The full $87,420 comes off the hospital's books as charity care. Maria's statement gets reissued at $0. She calls PFS to make sure it's real, twice. The third time she just thanks the rep and hangs up.",
      'Recovery continues. Outpatient PT three days a week. Job interview at a different food-service company, with insurance on day one this time. The kids are at school. The mortgage on her mom\'s apartment, where they\'re staying, is paid this month.',
      'The Lighthouse is unchanged. The bell is still ringing — softly, from a long way off. The next person finds it the same way Maria did.',
    ],
  },
}
