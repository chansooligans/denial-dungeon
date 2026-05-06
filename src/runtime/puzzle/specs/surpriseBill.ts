// Surprise Bill Specter — runtime puzzle spec. Lou Ramirez was
// seen in Mercy's in-network ER but the radiologist who read his
// CT was out-of-network. NSA-protected scenario; he's been billed
// $4,200 he doesn't owe.
//
// Three issues:
//   - CLASSIFY  — is this NSA-protected?
//   - CALCULATE — what does Lou actually owe?
//   - DISPUTE   — file the protective statement + initiate IDR.
//
// No claim form (the bill in question is from an OON ancillary,
// not a CMS-1500). No workbench. Three sequential picker amends.

import type { PuzzleSpec } from '../types'

export const SURPRISE_BILL_PUZZLE: PuzzleSpec = {
  id: 'surprise-bill',
  title: 'Surprise Bill Specter',
  district: 'billing',
  hospitalIntro: [
    'Lou Ramirez is at your counter with two pieces of paper. The ' +
      'first is the Mercy ER bill from his April 15 visit — chest ' +
      'pain, ruled out as reflux, sent home with omeprazole. That ' +
      'bill says "PAID — your responsibility: $200" and he paid it ' +
      'the day of discharge. The second is a separate bill that ' +
      'arrived in his mail two weeks ago: $4,200 from Radiology ' +
      'Associates of Eastside, the radiologist who read his CT. ' +
      'Anthem paid them nothing because they\'re out-of-network. ' +
      'They\'re now billing Lou directly.',
    'Lou is not panicking — he\'s furious in the contained way of ' +
      'someone who reads contracts for a living. "I went to your ' +
      'hospital. I paid your bill. Now this guy I never met — that ' +
      'I had no way to even know about — wants four grand. How is ' +
      'that legal?"',
  ],
  briefing: {
    paragraphs: [
      '"This one is the Surprise Bill Specter. Different beast from ' +
      'the Lighthouse — Lou doesn\'t need charity. He needs the law ' +
      'applied to him correctly. The NSA has been on the books ' +
      'since 2022, but OON ancillaries still send these bills out — ' +
      'sometimes by mistake, sometimes because they\'re hoping the ' +
      'patient pays before figuring out they don\'t have to."',
      '"Three issues, in order:"',
    ],
    bullets: [
      '<strong>CLASSIFY.</strong> Is this an NSA-protected scenario? ' +
      "You need the right answer and the right reasoning — 'no, OON " +
      "is just OON' and 'partial cap' both lose Lou money he isn't " +
      'legally required to pay.',
      '<strong>CALCULATE.</strong> What does Lou actually owe? It\'s ' +
      'not zero (NSA caps at in-network, doesn\'t eliminate it). ' +
      'It\'s not the bill (NSA prohibits that). It\'s his ' +
      'in-network cost-share — his plan\'s ER imaging copay.',
      '<strong>DISPUTE.</strong> File the protective statement: ' +
      'void Lou\'s $4,200 bill, reissue at the right amount, ' +
      'initiate IDR with the OON provider for the contested portion.',
    ],
    signoff: '"The Specter only haunts patients who don\'t know the rules. — D."',
  },
  issues: [
    {
      id: 'classify',
      label: 'Classify the bill — is this NSA-protected?',
      recap: "Yes — in-network ER (Mercy) + out-of-network ancillary provider (Radiology Associates of Eastside, the contracted reader) in an emergency context. Textbook NSA scenario; the patient is held harmless from the OON balance.",
      verb: 'classify',
    },
    {
      id: 'calculate',
      label: 'Calculate Lou\'s actual cost-share under NSA rules.',
      recap: "$150 — Lou's in-network CT copay under his Anthem PPO. NSA caps the patient's cost-share at the *in-network* amount even when the rendering provider is out-of-network. The remaining ~$3,850 is a dispute between the hospital, the OON provider, and Anthem; not Lou's problem.",
      verb: 'calculate',
    },
    {
      id: 'dispute',
      label: 'Dispute — protect the patient and initiate IDR with the OON provider.',
      recap: "You voided the $4,200 patient statement and reissued it at $150. The OON provider has been notified of NSA applicability with a 30-day window to accept the QPA-based amount or initiate IDR. Lou walks out with a corrected bill and a paper trail.",
      verb: 'dispute',
    },
  ],
  amendSlots: [
    {
      issueId: 'classify',
      fieldLabel: 'Classification',
      contextLine: 'In-network facility (Mercy ER) + OON ancillary (radiologist read of CT) + emergency context (chest pain).',
      options: [
        {
          id: 'yes-nsa',
          label: 'Yes — NSA applies. In-network facility, OON ancillary, emergency context.',
          support: 'correct',
          feedback: "Right call. The radiologist who read Lou's CT was OON, but the facility (Mercy's ER) was in-network and the visit was an emergency. The NSA's surprise-bill protections apply in full.",
        },
        {
          id: 'no-nsa',
          label: 'No — this is just an out-of-network charge. Patient owes the bill minus their plan benefit.',
          support: 'wrong',
          feedback: "That was the rule before 2022. The No Surprises Act explicitly carved this scenario out — emergency care at an in-network facility cannot be balance-billed by ancillary providers regardless of their network status.",
        },
        {
          id: 'partial-nsa',
          label: 'Partial — NSA caps the bill, but Lou still owes the OON amount above his in-network limit.',
          support: 'wrong',
          feedback: "NSA isn't a partial cap — it's a full hold-harmless. The patient pays in-network cost-share, period. Anything above is between the OON provider, the facility, and the payer (via IDR).",
        },
        {
          id: 'prior-auth',
          label: 'It\'s a prior-auth issue — refer Lou back to Anthem.',
          support: 'wrong',
          feedback: "Wrong category entirely. ER imaging doesn't require prior auth (emergency exception); the bill came from RAE, not from Anthem; and 'call your insurance' is exactly the runaround patients dread.",
        },
      ],
    },
    {
      issueId: 'calculate',
      fieldLabel: 'Patient cost-share',
      contextLine: 'Anthem PPO ER imaging copay: $150. OON provider billed: $4,200.',
      options: [
        {
          id: 'inn-150',
          label: '$150 — in-network CT copay per Anthem PPO benefits',
          support: 'correct',
          feedback: "Right amount. Lou's PPO has a flat $150 copay for ER imaging; under NSA, that's also his cap when the provider is OON.",
        },
        {
          id: 'full-bill',
          label: '$4,200 — the OON provider\'s billed charge',
          support: 'wrong',
          feedback: "That's the bill RAE sent — but it's exactly what NSA prohibits. The patient's responsibility is capped at in-network cost-share.",
        },
        {
          id: 'zero',
          label: '$0 — patient owes nothing',
          support: 'wrong',
          feedback: "Generous, but wrong. NSA caps patient responsibility at *in-network* — it doesn't zero it out. The in-network copay still applies.",
        },
        {
          id: 'half',
          label: '$2,100 — split the difference, settle for half',
          support: 'wrong',
          feedback: "This is what some PFS teams quietly do under pressure. NSA makes it unnecessary — the patient doesn't need to negotiate; the law does the work.",
        },
      ],
    },
    {
      issueId: 'dispute',
      fieldLabel: 'Action',
      contextLine: "The patient is held harmless. The dispute is between Mercy, RAE, and Anthem.",
      options: [
        {
          id: 'void-and-idr',
          label: 'Void the $4,200 statement, reissue at $150, file IDR with RAE',
          support: 'correct',
          feedback: 'Right action and right ordering: protect the patient first, settle the OON dispute through IDR. RAE has 30 days to accept the QPA-based offer or formally initiate IDR.',
        },
        {
          id: 'patient-pay-dispute-later',
          label: 'Tell Lou to pay the $4,200 now and dispute it later',
          support: 'wrong',
          feedback: "Common advice, frequently illegal post-NSA. Asking the patient to front a bill they aren't required to pay shifts the regulatory burden back onto them.",
        },
        {
          id: 'refer-to-payer',
          label: 'Refer Lou to Anthem and let him handle it with them',
          support: 'wrong',
          feedback: "NSA explicitly puts the burden on the *facility* to protect the patient. Punting Lou to Anthem when he came to Mercy with the problem is the runaround NSA was passed to end.",
        },
        {
          id: 'collections',
          label: 'Let it go to collections',
          support: 'wrong',
          feedback: "Worst path. Sending an NSA-protected balance bill to collections is itself a violation — the hospital risks regulatory action, and Lou gets a credit-bureau hit for a bill he never owed.",
        },
      ],
    },
  ],
  submitLabel: 'FILE PROTECTIVE STATEMENT',
  victory: {
    headline: 'The bill becomes $150.',
    paragraphs: [
      "Lou's $4,200 statement is voided. A reissued statement at $150 — his in-network ER imaging copay — is in his email by 9 AM with a one-page NSA explanation attached. Mercy's billing team initiates IDR with RAE for the $4,050 contested portion. RAE will accept Anthem's QPA-based offer or arbitrate; either way, Lou is out of the loop.",
      'The Specter is gone. Where the tall figure stood, there\'s a single piece of paper — Lou\'s reissued statement, $150, marked PROTECTED. The polished shoes left no print on the chevron floor; the suit was never quite there at all.',
    ],
  },
}
