import type { DialogueNode } from '../types'

export const DIALOGUES: Record<string, DialogueNode> = {
  // === Dana — your mentor, Level 1 orientation ===
  dana_intro: {
    id: 'dana_intro',
    speaker: 'Dana',
    text: "Oh — you're the part-time intern? Sorry, I'm slammed. Stick around the lobby; if anything weird comes up, flag me.",
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
      { text: "I'll go check the system. The Waiting Room queue is full of these.", effect: { unlockCodex: 'co_109' } },
    ],
  },
  kim_verify: {
    id: 'kim_verify',
    speaker: 'Kim',
    text: "A 270 eligibility check. Takes seconds. But the system was down last Tuesday so we keyed it manually. That's when errors happen.",
    choices: [
      { text: "I'll look at the queue downstairs.", effect: { unlockCodex: 'x12_270_271' } },
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
      { text: "A CDI query can bridge the gap. I'll work it.", effect: { unlockCodex: 'cdi' } },
    ],
  },
  martinez_codes: {
    id: 'martinez_codes',
    speaker: 'Dr. Martinez',
    text: "I'm a doctor, not a coder. But... I see your point. The note should support the code, and the code should support the claim.",
    choices: [
      { text: "Exactly. I'll go take a look at the queue.", effect: { unlockCodex: 'icd10_cm' } },
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
      { text: "I'll see what I can do downstairs.", effect: { unlockCodex: 'cost_share' } },
    ],
  },
  jordan_patient: {
    id: 'jordan_patient',
    speaker: 'Jordan',
    text: "The truth. That their plan doesn't cover it. And that we should have told them before the visit, not after.",
    choices: [
      { text: "Got it. Cost estimates upstream — noted.", effect: { unlockCodex: 'cost_share' } },
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
      { text: "Let me prep the claim before you fight it.", effect: { triggerForm: 'case_bundle_kim', unlockCodex: 'modifiers' } },
    ],
  },
  pat_bundle: {
    id: 'pat_bundle',
    speaker: 'Pat',
    text: "Sometimes yes. The CCI edits say which codes are bundled. But when they're truly separate, we need to document and modify.",
    choices: [
      { text: "Walk me through fixing the claim form first.", effect: { triggerForm: 'case_bundle_kim', unlockCodex: 'modifiers' } },
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
      { text: "I'll go work the queue.", effect: { unlockCodex: 'x12_837' } },
    ],
  },
  alex_fix: {
    id: 'alex_fix',
    speaker: 'Alex',
    text: "Fix the mapping, run them through the scrubber again, and resubmit. The good news? Front-end rejects are fast to fix. The bad news? They shouldn't happen at all.",
    choices: [
      { text: "Got it. I'll head down to clear them.", effect: { unlockCodex: 'x12_277ca' } },
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
      { text: "What about timely filing?", next: 'sam_timely' },
    ],
  },
  sam_timely: {
    id: 'sam_timely',
    speaker: 'Sam',
    text: "Worst feeling in this job. The claim is meritorious, the documentation is perfect, and you missed the contractual deadline by three days. There is no appeal. Watch the clock — that's the whole game.",
    choices: [
      { text: "I'll watch for one in the queue.", effect: { unlockCodex: 'co_29_reaper' } },
    ],
  },
  sam_appeal: {
    id: 'sam_appeal',
    speaker: 'Sam',
    text: "Sometimes. But an appeal costs time and money. The real win is CDI before the claim drops — fix the documentation while the patient is still in the building.",
    choices: [
      { text: "I'll go find one in the queue.", effect: { unlockCodex: 'medical_necessity' } },
    ],
  },
  sam_prevent: {
    id: 'sam_prevent',
    speaker: 'Sam',
    text: "Now you're thinking like an analyst. CDI queries, payer policy lookups, prior auth checks — all upstream. That's where you win.",
    choices: [
      { text: "I'll head down and try one.", effect: { unlockCodex: 'medical_necessity' } },
    ],
  },

  // === Anjali — Level 1 intro patient. The wrong-card case. ===
  // The intern is part-time, undertrained, not supposed to help patients
  // directly. She does anyway — the patient looks like she's been
  // waiting forever.
  anjali_intro: {
    id: 'anjali_intro',
    speaker: 'Anjali',
    text: "Sorry to bother you. They told me someone here could check whether I was approved.",
    next: 'anjali_intro_2',
  },
  anjali_intro_2: {
    id: 'anjali_intro_2',
    speaker: 'Anjali',
    text: "I had strep last week. They said my insurance was accepted at check-in. Now there's a bill for $387 saying I'm not on the plan.",
    next: 'anjali_intro_3',
  },
  anjali_intro_3: {
    id: 'anjali_intro_3',
    speaker: 'Anjali',
    text: "I have the same Aetna PPO as my husband. I've had it for years. I really don't think this is right.",
    choices: [
      { text: "(I'm not supposed to do this.)", next: 'anjali_hesitate' },
      { text: "Let me pull up your file.", next: 'anjali_pull_file' },
    ],
  },
  anjali_hesitate: {
    id: 'anjali_hesitate',
    speaker: 'Intern',
    text: "Part-time interns don't help patients directly. You're supposed to flag this to a supervisor — but it's late, and there's no supervisor here. And she looks like she's been waiting forever.",
    choices: [
      { text: "Let me pull up your file.", next: 'anjali_pull_file' },
    ],
  },
  anjali_pull_file: {
    id: 'anjali_pull_file',
    speaker: 'Anjali',
    text: "Thank you. I — I just want to figure this out.",
    choices: [
      {
        text: "(Sit down at your desk and open the claim.)",
        effect: { triggerDescent: { encounterId: 'intro_wrong_card' } },
      },
    ],
  },

  // === Anjali — after the intro case is solved. Auto-launched on
  //     return to Hospital. ===
  anjali_thanks: {
    id: 'anjali_thanks',
    speaker: 'Anjali',
    text: "Wait — that's it? It's fixed?",
    next: 'anjali_thanks_2',
  },
  anjali_thanks_2: {
    id: 'anjali_thanks_2',
    speaker: 'Anjali',
    text: "I had my husband's card on me by accident. Of course I did. Thank you. Really.",
    choices: [
      { text: "(You're not entirely sure what just happened either.)", next: 'anjali_thanks_3' },
      { text: "Glad I could help.", next: 'anjali_thanks_3' },
    ],
  },
  anjali_thanks_3: {
    id: 'anjali_thanks_3',
    speaker: 'Anjali',
    text: "I'm going to go home and sleep for a week. Thanks again.",
    choices: [
      { text: "Take care.", effect: { unlockCodex: 'co_31' } },
    ],
  },
}
