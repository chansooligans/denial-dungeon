import type { DialogueNode } from '../types'

export const DIALOGUES: Record<string, DialogueNode> = {
  // === Dana — your mentor, Level 1 orientation ===
  dana_intro: {
    id: 'dana_intro',
    speaker: 'Dana',
    text: "You're the new analyst? Good. We're short-staffed and the denial rate just hit 12%.",
    next: 'dana_intro_2',
  },
  dana_intro_2: {
    id: 'dana_intro_2',
    speaker: 'Dana',
    text: 'Every denied claim is money the hospital earned but never collected. Your job is to figure out why — and fix it upstream.',
    next: 'dana_intro_3',
  },
  dana_intro_3: {
    id: 'dana_intro_3',
    speaker: 'Dana',
    text: "A claim just vanished from the system. No 835, no rejection, just... gone. That shouldn't happen.",
    choices: [
      { text: 'Where do lost claims go?', next: 'dana_waiting_room' },
      { text: 'Can we just resubmit it?', next: 'dana_resubmit' },
    ],
  },
  dana_waiting_room: {
    id: 'dana_waiting_room',
    speaker: 'Dana',
    text: "That's what we need to find out. Check with Kim at registration first — most problems start at the front door.",
    choices: [
      { text: 'Got it.', effect: { unlockCodex: 'denial_rate' } },
    ],
  },
  dana_resubmit: {
    id: 'dana_resubmit',
    speaker: 'Dana',
    text: "Without understanding why it vanished? That's how you get duplicate claims and audit flags. Start at the source — talk to Kim at registration.",
    choices: [
      { text: 'Fair point.', effect: { unlockCodex: 'denial_rate' } },
    ],
  },

  // === Kim — registration ===
  kim_intro: {
    id: 'kim_intro',
    speaker: 'Kim',
    text: "Registration desk. We check insurance cards and enter demographics. Sounds simple, right?",
    next: 'kim_intro_2',
  },
  kim_intro_2: {
    id: 'kim_intro_2',
    speaker: 'Kim',
    text: "It's not. Patients bring expired cards, wrong member IDs, and sometimes no card at all. And we have 3 minutes per check-in.",
    choices: [
      { text: "What happens if info is wrong?", next: 'kim_wrong_info' },
      { text: "Can you verify electronically?", next: 'kim_verify' },
    ],
  },
  kim_wrong_info: {
    id: 'kim_wrong_info',
    speaker: 'Kim',
    text: "Claim goes to the wrong payer. Denied. CO-109. Patient gets a surprise bill. Everybody loses.",
    choices: [
      { text: "That sounds like a common problem.", effect: { triggerBattle: 'co_109', unlockCodex: 'co_109' } },
    ],
  },
  kim_verify: {
    id: 'kim_verify',
    speaker: 'Kim',
    text: "A 270 eligibility check. Takes seconds. But the system was down last Tuesday so we keyed it manually. That's when errors happen.",
    choices: [
      { text: "Let me look at a recent denial.", effect: { triggerBattle: 'co_109', unlockCodex: 'x12_270_271' } },
    ],
  },

  // === Dr. Martinez — documentation ===
  martinez_intro: {
    id: 'martinez_intro',
    speaker: 'Dr. Martinez',
    text: "I don't have time for this. I saved a patient's life this morning and now you want to talk about paperwork?",
    next: 'martinez_intro_2',
  },
  martinez_intro_2: {
    id: 'martinez_intro_2',
    speaker: 'Dr. Martinez',
    text: "The documentation says what I did. Isn't that enough?",
    choices: [
      { text: "The payer says the diagnosis doesn't support the procedure.", next: 'martinez_denial' },
      { text: "Your note is great clinically. But the codes need to match.", next: 'martinez_codes' },
    ],
  },
  martinez_denial: {
    id: 'martinez_denial',
    speaker: 'Dr. Martinez',
    text: "Then the payer is wrong! ... Fine. What do they need?",
    choices: [
      { text: "A CDI query can bridge the gap.", effect: { triggerBattle: 'co_11', unlockCodex: 'cdi' } },
    ],
  },
  martinez_codes: {
    id: 'martinez_codes',
    speaker: 'Dr. Martinez',
    text: "I'm a doctor, not a coder. But... I see your point. The note should support the code, and the code should support the claim.",
    choices: [
      { text: "Exactly. Let me show you the denial.", effect: { triggerBattle: 'co_11', unlockCodex: 'icd10_cm' } },
    ],
  },

  // === Jordan — patient financial services ===
  jordan_intro: {
    id: 'jordan_intro',
    speaker: 'Jordan',
    text: "A patient just called crying. Her insurance denied the procedure and now she owes $14,000.",
    next: 'jordan_intro_2',
  },
  jordan_intro_2: {
    id: 'jordan_intro_2',
    speaker: 'Jordan',
    text: "It's a benefit exclusion — PR-204. The service isn't covered under her plan. No appeal will change that.",
    choices: [
      { text: "Could we have caught this earlier?", next: 'jordan_earlier' },
      { text: "What do we tell the patient?", next: 'jordan_patient' },
    ],
  },
  jordan_earlier: {
    id: 'jordan_earlier',
    speaker: 'Jordan',
    text: "A cost estimate before the visit. Run the 270, check the benefits, and tell the patient what they'll owe BEFORE the procedure.",
    choices: [
      { text: "Let me look at this denial.", effect: { triggerBattle: 'pr_204', unlockCodex: 'cost_share' } },
    ],
  },
  jordan_patient: {
    id: 'jordan_patient',
    speaker: 'Jordan',
    text: "The truth. That their plan doesn't cover it. And that we should have told them before the visit, not after.",
    choices: [
      { text: "How do we prevent this?", effect: { triggerBattle: 'pr_204', unlockCodex: 'cost_share' } },
    ],
  },

  // === Pat — coding ===
  pat_intro: {
    id: 'pat_intro',
    speaker: 'Pat',
    text: "Two procedures billed separately, payer bundled them. CO-97. Classic.",
    next: 'pat_intro_2',
  },
  pat_intro_2: {
    id: 'pat_intro_2',
    speaker: 'Pat',
    text: "The surgeon did two distinct things. But without modifier 59, the payer sees one.",
    choices: [
      { text: "Could a claim scrubber have caught that?", next: 'pat_scrubber' },
      { text: "Is the payer right to bundle them?", next: 'pat_bundle' },
    ],
  },
  pat_scrubber: {
    id: 'pat_scrubber',
    speaker: 'Pat',
    text: "Absolutely. CCI edits are public. A good scrubber flags this before the claim ever drops.",
    choices: [
      { text: "Let's look at the denial.", effect: { triggerBattle: 'co_97', unlockCodex: 'modifiers' } },
    ],
  },
  pat_bundle: {
    id: 'pat_bundle',
    speaker: 'Pat',
    text: "Sometimes yes. The CCI edits say which codes are bundled. But when they're truly separate, we need to document and modify.",
    choices: [
      { text: "Show me.", effect: { triggerBattle: 'co_97', unlockCodex: 'modifiers' } },
    ],
  },

  // === Alex — IT/EDI ===
  alex_intro: {
    id: 'alex_intro',
    speaker: 'Alex',
    text: "The clearinghouse rejected 47 claims overnight. 277CA — front-end rejects.",
    next: 'alex_intro_2',
  },
  alex_intro_2: {
    id: 'alex_intro_2',
    speaker: 'Alex',
    text: "These never even reached the payer. Missing taxonomy code in loop 2310B.",
    choices: [
      { text: "Is that our fault or the vendor's?", next: 'alex_fault' },
      { text: "How do we fix 47 claims?", next: 'alex_fix' },
    ],
  },
  alex_fault: {
    id: 'alex_fault',
    speaker: 'Alex',
    text: "Could be either. The PM system generates the 837. But the clearinghouse validates it. Either way, it's our revenue stuck in limbo.",
    choices: [
      { text: "Let me see one.", effect: { triggerBattle: 'reject_277ca', unlockCodex: 'x12_837' } },
    ],
  },
  alex_fix: {
    id: 'alex_fix',
    speaker: 'Alex',
    text: "Fix the mapping, run them through the scrubber again, and resubmit. The good news? Front-end rejects are fast to fix. The bad news? They shouldn't happen at all.",
    choices: [
      { text: "Walk me through one.", effect: { triggerBattle: 'co_16', unlockCodex: 'x12_277ca' } },
    ],
  },

  // === Sam — denials management ===
  sam_intro: {
    id: 'sam_intro',
    speaker: 'Sam',
    text: "I have 200 appeals in my queue. Each one takes 45 minutes. You do the math.",
    next: 'sam_intro_2',
  },
  sam_intro_2: {
    id: 'sam_intro_2',
    speaker: 'Sam',
    text: "Half of these are CO-50 — medical necessity. The documentation was fine clinically but didn't meet the payer's policy criteria.",
    choices: [
      { text: "Can we win on appeal?", next: 'sam_appeal' },
      { text: "Can we prevent these upstream?", next: 'sam_prevent' },
    ],
  },
  sam_appeal: {
    id: 'sam_appeal',
    speaker: 'Sam',
    text: "Sometimes. But an appeal costs time and money. The real win is CDI before the claim drops — fix the documentation while the patient is still in the building.",
    choices: [
      { text: "Show me a med-nec denial.", effect: { triggerBattle: 'co_50', unlockCodex: 'medical_necessity' } },
    ],
  },
  sam_prevent: {
    id: 'sam_prevent',
    speaker: 'Sam',
    text: "Now you're thinking like an analyst. CDI queries, payer policy lookups, prior auth checks — all upstream. That's where you win.",
    choices: [
      { text: "Let me try resolving one.", effect: { triggerBattle: 'co_50', unlockCodex: 'medical_necessity' } },
    ],
  },
}
