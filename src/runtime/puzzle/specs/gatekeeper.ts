// Prior Auth Gatekeeper (CO-197) — runtime puzzle spec. UHC denied
// Tunde's lumbar MRI for no auth on file. Someone got verbal
// approval and forgot to write the number down.
//
// Two issues, in order:
//   - REQUEST — file a 278 inquiry with the right clinical
//     rationale; UHC's UM system returns the auth number that
//     was already on file.
//   - AMEND — transcribe the recovered auth number onto Box 23.
//
// Standalone prototype has a dedicated REQUEST STATION with
// rationale picker + RESPONSE PANEL. The runtime port models the
// 278 as an amend slot whose options are the rationales — picking
// the right rationale "files the 278" and unlocks the auth
// number. Lossy on UI but preserves the lesson (rationale must
// match chart + UM criteria).

import { CASES } from '../../../content/cases'
import type { PuzzleSpec } from '../types'

const gatekeeperCase = CASES.case_gatekeeper_okafor

function claimFromCase() {
  const c = gatekeeperCase.claim!
  if (c.type !== 'cms1500') throw new Error('gatekeeper case must be cms1500')
  return {
    claimId: c.claimId,
    patientName: c.patient.name,
    patientDob: c.patient.dob,
    insurer: 'UnitedHealthcare Choice Plus',
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

export const GATEKEEPER_PUZZLE: PuzzleSpec = {
  id: 'gatekeeper',
  title: 'Prior Auth Gatekeeper',
  district: 'eligibility',
  hospitalIntro: [
    'Tunde Okafor\'s wife calls — she sounds tired. "Hi, we got a ' +
      'bill for $1,425 for the MRI he had last month? But we ' +
      'called and got approval before we went. The lady on the ' +
      'phone said it was fine."',
    'You pull up Tunde\'s file. The claim shows a CO-197 — no ' +
      'prior auth on record. Box 23 is empty. Somebody got verbal ' +
      'approval and forgot to write the number down. There may ' +
      'still be an auth on file at UHC, but until it\'s pinned to ' +
      'the claim, the gate stays shut.',
  ],
  briefing: {
    paragraphs: [
      '"This one is a Gatekeeper. CO-197. UHC says there\'s no ' +
      'auth on file for the MRI. Polite as anything, but ' +
      'immovable: no number, no money. Doesn\'t matter that ' +
      'Tunde\'s MRI was clinically appropriate. Doesn\'t matter ' +
      'that someone got verbal sign-off. The gate only opens for ' +
      'one thing: an auth number sitting on Box 23."',
      '"Two issues, in order:"',
    ],
    bullets: [
      '<strong>File a 278.</strong> Send a retroactive prior-auth ' +
      'inquiry to UHC. Pick a clinical rationale that matches both ' +
      'the chart AND UHC\'s UM criteria. If it lines up, their ' +
      'system finds the approval that was issued back in February ' +
      '— the one nobody wrote down — and sends back the auth ' +
      'number. <em>This is the new verb: REQUEST.</em>',
      '<strong>Amend Box 23.</strong> Once the 278 returns the ' +
      'auth number, transcribe it onto the claim. The gate opens.',
    ],
    signoff: '"Don\'t argue with the Gatekeeper. File the right form. — D."',
  },
  claim: claimFromCase(),
  issues: [
    {
      id: 'auth-request',
      label: 'File a retroactive 278 inquiry; recover the auth number from UHC.',
      recap: "You filed a clean 278 with proper clinical rationale. UHC's UM system pulled up an existing approval on file — the precert team got verbal sign-off back on Feb 4 but never circulated the auth number internally. Now you have it: PA-78294-A.",
      verb: 'request',
    },
    {
      id: 'auth-transcribe',
      label: 'Transcribe auth number PA-78294-A onto Box 23 of the claim.',
      recap: "Box 23 is the prior-auth-number field. UHC's adjudication engine matches that string against their auth database. Without the number, it didn't matter that an auth existed — the claim never linked to it. With it, the gate opens.",
      verb: 'amend',
    },
  ],
  amendSlots: [
    {
      issueId: 'auth-request',
      fieldLabel: '278 inquiry · Clinical rationale',
      contextLine: "Chart: 3-month L-spine pain w/ R-leg radiculopathy; PT × 12 sessions, NSAIDs, gabapentin all failed; positive SLR + R EHL weakness on exam. UHC UM criteria allow lumbar MRI for failed-conservative or radiculopathy.",
      options: [
        {
          id: 'failed-conservative',
          label: 'Lumbar disc herniation w/ radiculopathy; failed >6 wks conservative tx',
          support: 'correct',
          feedback: "Matches both the chart and UHC's UM criteria for lumbar MRI. The 278 returns approved — auth number PA-78294-A.",
        },
        {
          id: 'acute-pain',
          label: 'Acute low back pain with new neurologic deficit',
          support: 'partial',
          feedback: "Closer — UHC's UM criteria do allow MRI for acute back pain with red flags. But Tunde's chart documents a chronic course (six weeks of failed conservative treatment), not an acute red-flag presentation.",
        },
        {
          id: 'preop',
          label: 'Pre-operative imaging for upcoming surgery',
          support: 'wrong',
          feedback: "There's no surgery scheduled — the chart shows a conservative-treatment plan that failed. A pre-op rationale doesn't match the record and gets the 278 denied for inconsistent documentation.",
        },
        {
          id: 'patient-request',
          label: 'Patient requested imaging',
          support: 'wrong',
          feedback: "UHC doesn't approve elective imaging on patient request alone — there has to be a clinical indication backed by the chart. Auto-rejected by UM.",
        },
      ],
    },
    {
      issueId: 'auth-transcribe',
      fieldLabel: 'Box 23 · Prior Authorization Number',
      contextLine: 'Transcribe the auth number from the 278 response.',
      options: [
        {
          id: 'PA-78294-A',
          label: 'PA-78294-A',
          support: 'correct',
          feedback: "Matches the 278 response exactly. UHC's adjudication engine will link the claim to the auth on file.",
        },
        {
          id: 'PA-78294',
          label: 'PA-78294',
          support: 'wrong',
          feedback: "Close — but you dropped the trailing '-A' suffix. UHC's auth IDs include the suffix; without it the engine treats it as a different auth.",
        },
        {
          id: 'PA-44021',
          label: 'PA-44021',
          support: 'wrong',
          feedback: "That's an old auth number from a 2025 X-ray. Wrong auth, wrong service.",
        },
      ],
    },
  ],
  submitLabel: 'SUBMIT CLAIM WITH AUTH',
  victory: {
    headline: 'The gate opens.',
    paragraphs: [
      "UHC's adjudication engine matches the auth number on the resubmitted claim against PA-78294-A in their system. Approved on first pass. Tunde's wife calls back; you can hear the relief in her voice. The $1,425 was patient responsibility for ten minutes; now it isn't.",
      'The Gatekeeper steps aside. There\'s no fanfare — just a small movement, a clipboard set down, the velvet rope drawn back. On the wall behind it, a row of little numbered plaques is now one plaque longer.',
    ],
  },
}
