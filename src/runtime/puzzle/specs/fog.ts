// Eligibility Fog — runtime puzzle spec. Pre-submission encounter:
// Linh changed jobs in November and her insurance card is from her
// old employer. The registration screen accepted the format but the
// data is stale. If the claim drops as-is, it'll bounce off Anthem
// for subscriber-not-found.
//
// Three issues, in order:
//   - REVEAL — run a 270 eligibility inquiry; the 271 response
//     becomes the source of truth.
//   - AMEND  — fix the subscriber ID against the 271.
//   - AMEND  — fix the group number against the 271.
//
// The standalone prototype renders fogged claim fields that burn
// off once the 270/271 returns; the runtime port models the reveal
// as a single-option amend so the issue resolves on click. The
// pedagogy of "trust the 271, not the card" is preserved in the
// briefing copy.

import { CASES } from '../../../content/cases'
import type { PuzzleSpec } from '../types'

const fogCase = CASES.case_fog_nguyen

function claimFromCase() {
  const c = fogCase.claim!
  if (c.type !== 'cms1500') throw new Error('fog case must be cms1500')
  return {
    claimId: c.claimId,
    patientName: c.patient.name,
    patientDob: c.patient.dob,
    insurer: 'Anthem PPO',
    // Pre-fix state: the stale id from her old employer's plan.
    insuredId: 'ANT883112',
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

export const FOG_PUZZLE: PuzzleSpec = {
  id: 'fog',
  title: 'Eligibility Fog',
  district: 'eligibility',
  hospitalIntro: [
    'Linh Nguyen comes in for a sore throat. She hands over her ' +
      'insurance card at the front desk; the registrar keys it in. ' +
      'You happen to walk past as the registration screen lights up ' +
      'green — accepted. But Linh mentions, almost in passing, that ' +
      'she changed jobs in November. The registrar shrugs. ' +
      '<em>"It said accepted."</em>',
    'You pull up the claim before it submits. Subscriber ID is ' +
      'there. Group is there. Everything looks fine. But it ' +
      'shimmers a little when you look at it. Like there\'s ' +
      'something behind it you can\'t see.',
  ],
  briefing: {
    paragraphs: [
      '"This one is the Fog. Eligibility. Linh changed jobs three ' +
      'months ago. The card she handed over at the front desk is ' +
      'from her old plan. The registration screen accepted it ' +
      'because the format was valid — but the data is stale. If ' +
      'this claim drops as-is, it\'ll bounce off Anthem\'s ' +
      'adjudication engine for a subscriber-not-found, and we\'ll ' +
      'be cleaning it up for the next month."',
      '"Three issues, in order. The reveal first — without it, ' +
      'you can\'t see what\'s wrong:"',
    ],
    bullets: [
      '<strong>REVEAL.</strong> Run a 270 inquiry. Send the ' +
      'eligibility check to Anthem; the 271 response comes back ' +
      'with her current plan, subscriber ID, group. The fog burns ' +
      'off. <em>This is the new verb.</em>',
      '<strong>AMEND the subscriber ID.</strong> The 271 says ' +
      'ANT772041 — her current Anthem PPO ID. The card has the ' +
      'old one. Fix it.',
      '<strong>AMEND the group number.</strong> Same root cause ' +
      'as the subscriber ID — old employer\'s group. The 271 has ' +
      'the new one. Fix it.',
    ],
    signoff: '"Trust the 271, not the card. — D."',
  },
  claim: claimFromCase(),
  issues: [
    {
      id: 'reveal',
      label: 'Run a 270 eligibility inquiry to clear the fog.',
      recap: "You sent a 270 inquiry and got the 271 back. That's the official record — Linh's coverage today, straight from Anthem's eligibility system. Whatever's on the registration form has to match this.",
      verb: 'reveal',
    },
    {
      id: 'amend-subscriber',
      label: 'Amend the subscriber ID to match the 271 response.',
      recap: "The card Linh handed over at the front desk was from her previous employer's plan. The 271 returned her current plan's subscriber ID. Fixed at the source — the claim now matches Anthem's records before submission, so it lands clean instead of bouncing.",
      verb: 'amend',
    },
    {
      id: 'amend-group',
      label: 'Amend the group number to match the 271 response.',
      recap: "Same story as the subscriber ID — the group number was tied to her old employer. The new plan has a different group. Anthem's adjudication engine matches both fields; mismatched group means denial even with the right subscriber ID.",
      verb: 'amend',
    },
  ],
  amendSlots: [
    {
      issueId: 'reveal',
      fieldLabel: '270/271 eligibility inquiry',
      contextLine: "The card on file is from Linh's previous employer. Run an inquiry to Anthem's eligibility system and get the current record.",
      options: [
        {
          id: 'skip',
          label: 'Skip — submit the claim as-is',
          support: 'current',
          feedback: 'Submitting without an inquiry is what got us here in the first place. Run the 270.',
        },
        {
          id: 'run-270',
          label: 'Run 270 inquiry to Anthem',
          support: 'correct',
          feedback: "271 returns. Linh's current plan: subscriber ANT772041, group 0066114. The fog burns off — both fields on the claim are stale.",
        },
      ],
    },
    {
      issueId: 'amend-subscriber',
      fieldLabel: 'Box 1a · Subscriber ID',
      contextLine: '271 response returned ANT772041 as the active subscriber id.',
      claimTarget: { kind: 'subscriberId' },
      options: [
        {
          id: 'ANT883112',
          label: 'ANT883112',
          support: 'current',
          feedback: "What's currently on the claim — from her old card.",
        },
        {
          id: 'ANT772041',
          label: 'ANT772041',
          support: 'correct',
          feedback: 'Matches the 271 response. Her current Anthem PPO subscriber ID since the job change in November.',
        },
        {
          id: 'ANT772014',
          label: 'ANT772014',
          support: 'wrong',
          feedback: "Last two digits transposed. Won't match the 271; submission would still bounce.",
        },
        {
          id: 'ANT883120',
          label: 'ANT883120',
          support: 'wrong',
          feedback: "That's not what the 271 returned.",
        },
      ],
    },
    {
      issueId: 'amend-group',
      fieldLabel: 'Box 11 · Group Number',
      contextLine: '271 response returned 0066114 as the active group number.',
      options: [
        {
          id: '0048221',
          label: '0048221',
          support: 'current',
          feedback: "What's currently on the claim — her old employer's group.",
        },
        {
          id: '0066114',
          label: '0066114',
          support: 'correct',
          feedback: "Matches the 271. New employer's group number, in effect since the job change.",
        },
        {
          id: '0066141',
          label: '0066141',
          support: 'wrong',
          feedback: "Last two digits transposed. Won't match the 271.",
        },
        {
          id: '0066',
          label: '0066',
          support: 'partial',
          feedback: 'Truncated. Group numbers are seven digits.',
        },
      ],
    },
  ],
  submitLabel: 'SUBMIT CLEAN CLAIM',
  victory: {
    headline: 'The claim drops clean.',
    paragraphs: [
      'Anthem accepts the 837 on first pass. No 277CA bounce. No CO-26. The claim moves to adjudication; the 835 will follow next week. Linh leaves with her sore-throat prescription and no idea anything was about to go wrong.',
      'The Fog burns off. Where it stood, you can see clearly — Linh\'s name, her current plan, her current group, all stamped on a small card that didn\'t exist a few minutes ago. The card she should have had all along.',
    ],
  },
}
