// Intro puzzle (level 1) — "Wrong Card." The teaching encounter.
//
// Mrs. Patel handed her husband's insurance card to the registrar at
// the ER counter. Same plan, different subscriber id. The 837 went
// out under his id; Aetna's roster has the dependent under her own
// id, so the claim bounces as CO-31 (patient not identifiable as
// our insured). One amend on Box 1a — swap to her actual id —
// resolves it.
//
// Why this is the opener:
//   - Single issue, single picker. The clearest possible demo of the
//     puzzle loop (briefing → claim → amend → SUBMIT → victory).
//   - The denial is clerical, not adversarial. Sets the tone for the
//     whole game: "denials" are mostly mistakes, and someone has to
//     know the rules well enough to catch them.
//   - Universally relatable hook (everyone has fumbled an insurance
//     card or watched a loved one do it).
//   - The hospital ↔ waiting-room loop runs once at low stakes, so
//     the player learns the layer-shift before any of it has to
//     carry narrative weight.

import { CASES } from '../../../content/cases'
import type { PuzzleSpec } from '../types'

const introCase = CASES.case_intro_patel

function claimFromCase() {
  const c = introCase.claim!
  if (c.type !== 'cms1500') throw new Error('intro case must be cms1500')
  return {
    claimId: c.claimId,
    patientName: c.patient.name,
    patientDob: c.patient.dob,
    insurer: 'Aetna PPO',
    insuredId: c.insured.id, // pre-fix: husband's id
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

export const INTRO_PUZZLE: PuzzleSpec = {
  id: 'intro',
  title: 'The Wrong Card',
  district: 'eligibility',
  hospitalIntro: [
    'Anjali Patel is at the patient-services counter holding a $387 ' +
      'ER bill. "I had strep throat last week. I gave them my card. ' +
      'It said \'accepted.\' Now they\'re saying I\'m not on the plan?"',
    'You pull up the file. The card she handed to the registrar was ' +
      'her husband\'s — same Aetna PPO, same family group, but his ' +
      'subscriber id, not hers. The claim went out under <em>his</em> ' +
      'name. Aetna\'s roster lists him as the subscriber and her as a ' +
      'dependent with her own id. CO-31 — "patient cannot be ' +
      'identified as our insured." Two minutes of work to fix.',
  ],
  briefing: {
    paragraphs: [
      '"Welcome to the building. You\'ll get a feel for the rhythm ' +
      'fast. Most of what we do here looks like this one: somebody ' +
      'in the chain typed the wrong thing into a box, and the ' +
      'payer\'s computer kicked it back. A typo, a card swap, a ' +
      'missing field."',
      '"You\'re going to learn one verb today:"',
    ],
    bullets: [
      '<strong>AMEND.</strong> Click a disputed field on the claim ' +
      'and pick what should actually be there. The chart and the ' +
      'payer\'s eligibility record are your sources of truth — not ' +
      'the photocopy of the card.',
      'There are bigger fights upstairs and downstairs. We\'ll get ' +
      'to those. <em>This one</em> is the shape of half your job: ' +
      'a small thing, fixed cleanly, before it becomes someone\'s ' +
      'collections problem.',
    ],
    signoff: '"Welcome aboard. — D."',
  },
  claim: claimFromCase(),
  issues: [
    {
      id: 'subscriber-id',
      label: 'Amend Box 1a — swap to Anjali\'s subscriber id, not her husband\'s.',
      recap: "The 271 eligibility response had her id (AET447821491) all along. The card photocopy lied — or rather, it was the wrong card. Box 1a now matches the payer's roster; the claim adjudicates clean on the next pass.",
      verb: 'amend',
    },
  ],
  amendSlots: [
    {
      issueId: 'subscriber-id',
      fieldLabel: 'Box 1a · Subscriber ID',
      contextLine: "Aetna 271 response, ran just now: subscriber AET447821491 (Patel, Anjali, dependent). The card on file is AET447821903 (Patel, Ravi).",
      claimTarget: { kind: 'subscriberId' },
      options: [
        {
          id: 'AET447821903',
          label: 'AET447821903 — PATEL, RAVI',
          support: 'current',
          feedback: "What's currently on the claim. That's the husband's id; Aetna's roster has him as the subscriber, not Anjali. CO-31 again.",
        },
        {
          id: 'AET447821491',
          label: 'AET447821491 — PATEL, ANJALI',
          support: 'correct',
          feedback: "Matches the 271 response. Anjali is on the plan as a dependent under her own id; Box 1a now lines up with the payer's roster.",
        },
        {
          id: 'AET44782149',
          label: 'AET44782149',
          support: 'partial',
          feedback: "Close — but you dropped the trailing digit. Aetna IDs are 11 characters after the prefix.",
        },
      ],
    },
  ],
  submitLabel: 'SUBMIT CORRECTED CLAIM',
  victory: {
    headline: 'You blink.',
    paragraphs: [
      'You’re at your desk. Or — you never left.',
      'The screen in front of you shows the claim has resubmitted. Anjali is still standing across the counter, still holding the bill.',
      'She hasn’t realized anything has happened yet.',
    ],
  },
}
