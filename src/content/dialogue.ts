import type { DialogueNode } from '../types'

export const DIALOGUES: Record<string, DialogueNode> = {
  // === Dana — your mentor, Level 1 orientation ===
  dana_intro: {
    id: 'dana_intro',
    speaker: 'Dana',
    text: "Oh — Chloe, right? The part-time intern. Sorry, I'm slammed. Stick around the lobby; if anything weird comes up, flag me.",
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
    speaker: 'Chloe',
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
    text: "I had my husband's card on me by accident. Of course I did. Thank you, Chloe. Really.",
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

  // === Level 2 — Kim hands off the eligibility-fog case ===
  kim_l2_intake: {
    id: 'kim_l2_intake',
    speaker: 'Kim',
    text: "Chloe — you're back. Word travels. Listen, I need a hand. The 270 we sent on Mai Nguyen this morning came back fogged. Half the fields blanked, no clear reason.",
    next: 'kim_l2_intake_2',
  },
  kim_l2_intake_2: {
    id: 'kim_l2_intake_2',
    speaker: 'Kim',
    text: "If we file without verifying her plan, that claim ends up in the Waiting Room with the rest of the half-answered ones. Want to take a look?",
    choices: [
      { text: '(Sit down at the workstation and pull her file.)',
        effect: { triggerDescent: { encounterId: 'eligibility_fog' } } },
      { text: "Maybe later.", next: 'kim_l2_intake_back' },
    ],
  },
  kim_l2_intake_back: {
    id: 'kim_l2_intake_back',
    speaker: 'Kim',
    text: "Fair. It'll still be here. They always are.",
    choices: [{ text: '(Step away.)' }],
  },

  // === Level 3 — Sam (Denials) hands off the prior-auth gatekeeper ===
  sam_l3_intake: {
    id: 'sam_l3_intake',
    speaker: 'Sam',
    text: "There's a UHC denial on Adaeze Okafor — MRI lumbar, CO-197. No 278 on file. Pre-cert team swears they got verbal sign-off. Nobody wrote down the auth number.",
    next: 'sam_l3_intake_2',
  },
  sam_l3_intake_2: {
    id: 'sam_l3_intake_2',
    speaker: 'Sam',
    text: "If you can dig the auth out of the payer's UM portal and re-file with it, we recover. Otherwise it dies in appeals. Want to take it?",
    choices: [
      { text: '(Open the case.)',
        effect: { triggerDescent: { encounterId: 'co_197' } } },
      { text: 'Not yet.', next: 'sam_l3_intake_back' },
    ],
  },
  sam_l3_intake_back: {
    id: 'sam_l3_intake_back',
    speaker: 'Sam',
    text: "Take your time. The appeal clock is only ninety days.",
    choices: [{ text: '(Step away.)' }],
  },

  // === Level 4 — Pat (Coding) hands off the bundling beast ===
  pat_l4_intake: {
    id: 'pat_l4_intake',
    speaker: 'Pat',
    text: "Got a CO-97 on Sarah Kim's chart. E&M and a procedure same day, NCCI bundled them. The visit was significant and separate — modifier 25 just never made it on.",
    next: 'pat_l4_intake_2',
  },
  pat_l4_intake_2: {
    id: 'pat_l4_intake_2',
    speaker: 'Pat',
    text: "Quick fix if you know where to put it. Care to give it a swing?",
    // Three branches gated on chart state:
    //  - chart not yet pulled: "I'll grab the op-note first" + decline
    //  - chart pulled: descend immediately
    // The chart-pull is a tile interaction inside Medical Records (any
    // 'F' cabinet on L4); see HospitalScene.tryChartPull.
    choices: [
      { text: '(Pull the op-note first.)',
        next: 'pat_l4_chart_hint',
        condition: { chartNotPulled: 'co_97' } },
      { text: '(Sit down and code it.)',
        effect: { triggerDescent: { encounterId: 'co_97' } },
        condition: { chartPulled: 'co_97' } },
      { text: 'In a bit.', next: 'pat_l4_intake_back' },
    ],
  },
  pat_l4_chart_hint: {
    id: 'pat_l4_chart_hint',
    speaker: 'Pat',
    text: "Right. Op-note's in Medical Records — east wing, third room down. The binders by the desk. Won't make sense without it.",
    choices: [{ text: '(Step away.)' }],
  },
  pat_l4_intake_back: {
    id: 'pat_l4_intake_back',
    speaker: 'Pat',
    text: "Bundle's not going anywhere. It's bundled.",
    choices: [{ text: '(Step away.)' }],
  },

  // === Level 5 — Sam hands off the medical-necessity wraith ===
  sam_l5_intake: {
    id: 'sam_l5_intake',
    speaker: 'Sam',
    text: "CO-50 on Walker. TTE for unspecified heart failure. Payer wants LCD evidence of LVEF under 35%. Echo report exists; it's just not stapled to the claim.",
    next: 'sam_l5_intake_2',
  },
  sam_l5_intake_2: {
    id: 'sam_l5_intake_2',
    speaker: 'Sam',
    text: "Wraiths feed on missing pages. Bring the evidence and it dissolves. Try?",
    // Same chart-gating pattern as Pat L4: descent only available
    // after the player has pulled Walker's echo from Medical Records.
    choices: [
      { text: '(Get the echo report from Records first.)',
        next: 'sam_l5_chart_hint',
        condition: { chartNotPulled: 'co_50' } },
      { text: '(Bring the echo to the wraith.)',
        effect: { triggerDescent: { encounterId: 'co_50' } },
        condition: { chartPulled: 'co_50' } },
      { text: 'Later.', next: 'sam_l5_intake_back' },
    ],
  },
  sam_l5_chart_hint: {
    id: 'sam_l5_chart_hint',
    speaker: 'Sam',
    text: "Walker. Echo dated 09/14. Medical Records — east wing — bottom shelf. Without the LVEF the LCD doesn't apply. Don't go down empty-handed.",
    choices: [{ text: '(Step away.)' }],
  },
  sam_l5_intake_back: {
    id: 'sam_l5_intake_back',
    speaker: 'Sam',
    text: "It only gets harder to read once it's been a week.",
    choices: [{ text: '(Step away.)' }],
  },

  // === Level 6 — Alex (IT/EDI) hands off the documentation-sprite swarm ===
  alex_l6_intake: {
    id: 'alex_l6_intake',
    speaker: 'Alex',
    text: "Yamada batch. 277CA rejects piling up — taxonomy missing on the rendering provider, and a dx pointer that points to nothing. We can scrub each reject one at a time, but they're regenerating faster than we sweep them.",
    next: 'alex_l6_intake_2',
  },
  alex_l6_intake_2: {
    id: 'alex_l6_intake_2',
    speaker: 'Alex',
    text: "Want to chase the source upstream? Patch the chart, the swarm starves.",
    choices: [
      { text: '(Trace the swarm.)',
        effect: { triggerDescent: { encounterId: 'co_16_swarm' } } },
      { text: 'Hold on.', next: 'alex_l6_intake_back' },
    ],
  },
  alex_l6_intake_back: {
    id: 'alex_l6_intake_back',
    speaker: 'Alex',
    text: "Sure. They multiply quietly until they don't.",
    choices: [{ text: '(Step away.)' }],
  },

  // === Level 7 — Sam hands off the duplicate-claim reaper ===
  sam_l7_intake: {
    id: 'sam_l7_intake',
    speaker: 'Sam',
    text: "Park got a CO-29 on the 835 — duplicate claim. The provider hand-keyed a corrected version while a frequency-1 was still adjudicating. Now both look like duplicates to the payer.",
    next: 'sam_l7_intake_2',
  },
  sam_l7_intake_2: {
    id: 'sam_l7_intake_2',
    speaker: 'Sam',
    text: "Fix is a frequency-7 with the right ICN. Sound easy. Isn't. Want to handle it?",
    choices: [
      { text: '(Open the ERA.)',
        effect: { triggerDescent: { encounterId: 'co_29_reaper' } } },
      { text: 'Soon.', next: 'sam_l7_intake_back' },
    ],
  },
  sam_l7_intake_back: {
    id: 'sam_l7_intake_back',
    speaker: 'Sam',
    text: "Reaper's patient. Reaper waits.",
    choices: [{ text: '(Step away.)' }],
  },

  // === Level 8 — Jordan (PFS) hands off the surprise-bill specter ===
  jordan_l8_intake: {
    id: 'jordan_l8_intake',
    speaker: 'Jordan',
    text: "Patient on the line — surprise bill from an out-of-network anesthesiologist. The procedure was at an in-network facility. NSA applies. Provider's billing it like it doesn't.",
    next: 'jordan_l8_intake_2',
  },
  jordan_l8_intake_2: {
    id: 'jordan_l8_intake_2',
    speaker: 'Jordan',
    text: "I need someone to push the IDR side and document the protections. Want to walk it through?",
    choices: [
      { text: '(Take the case.)',
        effect: { triggerDescent: { encounterId: 'surprise_bill_specter' } } },
      { text: 'Give me a minute.', next: 'jordan_l8_intake_back' },
    ],
  },
  jordan_l8_intake_back: {
    id: 'jordan_l8_intake_back',
    speaker: 'Jordan',
    text: "She's still on hold. She's been on hold a while.",
    choices: [{ text: '(Step away.)' }],
  },

  // === Level 9 — Kim hands off the duplicate-claim doppelgänger.
  //     (Was the COB hydra; hydra moved to prototype-only catalog.) ===
  kim_l9_intake: {
    id: 'kim_l9_intake',
    speaker: 'Kim',
    text: "Two claims for Reyes — same DOS, same CPT, same everything — and they're both denying CO-18. Someone resubmitted instead of replacing.",
    next: 'kim_l9_intake_2',
  },
  kim_l9_intake_2: {
    id: 'kim_l9_intake_2',
    speaker: 'Kim',
    text: "I've got the original ICN. Box 22 frequency 7 references it and the duplicate folds back in. Want to take it?",
    choices: [
      { text: '(Open the duplicate.)',
        effect: { triggerDescent: { encounterId: 'co_18_doppelganger' } } },
      { text: 'Hold up.', next: 'kim_l9_intake_back' },
    ],
  },
  kim_l9_intake_back: {
    id: 'kim_l9_intake_back',
    speaker: 'Kim',
    text: "It'll keep. They always do.",
    choices: [{ text: '(Step away.)' }],
  },

  // === Level 10 — Dana hands off the audit boss ===
  dana_l10_intake: {
    id: 'dana_l10_intake',
    speaker: 'Dana',
    text: "Auditors are in the conference room. They've got every claim you've touched in the last ninety days printed out, sorted by payer.",
    next: 'dana_l10_intake_2',
  },
  dana_l10_intake_2: {
    id: 'dana_l10_intake_2',
    speaker: 'Dana',
    text: "Documentation, modifiers, medical necessity, the whole stack. They'll ask, and your answers go on the record. You ready?",
    choices: [
      { text: '(Walk into the conference room.)',
        effect: { triggerDescent: { encounterId: 'boss_audit' } } },
      { text: 'Give me a minute.', next: 'dana_l10_intake_back' },
    ],
  },
  // === L10 audit team — atmosphere NPCs. Each speaks one line and
  //     ends. They don't hand off cases (that's Dana's job); they're
  //     here to make the conference room feel like a deposition. ===
  auditor_carl_intro: {
    id: 'auditor_carl_intro',
    speaker: 'Carl Westbrook — Senior Partner',
    text: "We've blocked off four hours for this. We'll need them.",
  },
  auditor_chen_intro: {
    id: 'auditor_chen_intro',
    speaker: 'Wendy Chen — Data Analytics',
    text: "Your CMI variance is in the 96th percentile. That's not a compliment.",
  },
  auditor_rivera_intro: {
    id: 'auditor_rivera_intro',
    speaker: 'Mira Rivera — Compliance',
    text: "We're not here to teach. We're here to find.",
  },
  auditor_eddi_intro: {
    id: 'auditor_eddi_intro',
    speaker: 'Eddi — Observer',
    text: "...",
  },

  // === Ambient populace — one-line atmospheric exchanges. None hand
  //     off cases. Terminal nodes (no `next`, no `choices`) — the
  //     dialogue scene shows them with a click-to-close prompt. ===
  liana_intro: {
    id: 'liana_intro',
    speaker: 'Liana',
    text: "Pharmacy ran the prior auth twice. Both came back 'in process.' That's not a status. That's a holding pattern.",
  },
  dr_priya_intro: {
    id: 'dr_priya_intro',
    speaker: 'Dr. Priya',
    text: "Tell coding the bowel obstruction was complete. Not partial. Different DRG.",
  },
  dev_intro: {
    id: 'dev_intro',
    speaker: 'Dev',
    text: "Bed B is in the hallway because someone said C was contaminated. Nobody charted it.",
  },
  walter_intro: {
    id: 'walter_intro',
    speaker: 'Walter',
    text: "Two hours. They said one. I'm not in a hurry. I just want to know.",
  },
  dr_ethan_intro: {
    id: 'dr_ethan_intro',
    speaker: 'Dr. Ethan',
    text: "Discharge summary's on me. Don't bill until it's signed.",
  },
  officer_reyes_intro: {
    id: 'officer_reyes_intro',
    speaker: 'Officer Reyes',
    text: "You new? You walk like you know where you're going. Most of them don't.",
  },
  joe_intro: {
    id: 'joe_intro',
    speaker: 'Joe',
    text: "Dust on these binders is older than the binders. Records doesn't throw anything out. Can't.",
  },
  noah_intro: {
    id: 'noah_intro',
    speaker: 'Noah',
    text: "Radiology. I know it's near the cafeteria. I keep ending up at the cafeteria.",
  },

  // Round 2 ambient — east wing, 2F, outdoor.
  rad_tech_intro: {
    id: 'rad_tech_intro',
    speaker: 'Adaeze',
    text: "Echo, MRI, two CTs since seven. Half are stat. The other half think they're stat.",
  },
  records_clerk_intro: {
    id: 'records_clerk_intro',
    speaker: 'Marisol',
    text: "Whatever you're looking for is here. Whether you find it depends on what year it lived in.",
  },
  payer_rep_intro: {
    id: 'payer_rep_intro',
    speaker: 'Theresa',
    text: "I'm contracted to be onsite three days a week. Tuesday I do nothing but call my own auto-attendant on speakerphone.",
  },
  payer_supervisor_intro: {
    id: 'payer_supervisor_intro',
    speaker: 'Diane',
    text: "The medical policy hasn't changed. Your interpretation of it has.",
  },
  compliance_officer_intro: {
    id: 'compliance_officer_intro',
    speaker: 'Theo',
    text: "Don't say 'breach' until I've finished the four-factor assessment. The word does work on its own.",
  },
  smoker_visitor_intro: {
    id: 'smoker_visitor_intro',
    speaker: 'Earl',
    text: "Stepped out for one. Came back, room's empty, sheets stripped. They don't tell you anything if you're not in the room.",
  },

  // Round 3 ambient — smokers (outdoor-only), paramedic, lobby visitors.
  smoker_outdoor_b_intro: {
    id: 'smoker_outdoor_b_intro',
    speaker: 'Sandra',
    text: "I quit twice. Last time stuck three years. Then payroll switched the schedule and here I am.",
  },
  paramedic_intro: {
    id: 'paramedic_intro',
    speaker: 'Cassie',
    text: "Transfer from West Coast. They paged ahead, but the bed's still showing dirty. I'll wait.",
  },
  flower_visitor_intro: {
    id: 'flower_visitor_intro',
    speaker: 'Greta',
    text: "Lilies again. She always says they're fine. She knows I know they're not her favorite.",
  },
  elder_patient_intro: {
    id: 'elder_patient_intro',
    speaker: 'Mr. Beck',
    text: "Sign says cardiology that way. Or it says cafeteria. Hard to tell. The arrow's at an angle.",
  },

  // Round 4 — cafeteria staff + a couple of pool back-fills.
  cafeteria_worker_intro: {
    id: 'cafeteria_worker_intro',
    speaker: 'Manny',
    text: "We had meatloaf today. We always have meatloaf today. They like the consistency.",
  },
  cashier_intro: {
    id: 'cashier_intro',
    speaker: 'Yvette',
    text: "Visitor or staff? Doesn't matter, same price. I just like to know which line you cut.",
  },
  server_intro: {
    id: 'server_intro',
    speaker: 'Reggie',
    text: "Tray here, tray there. Don't sit at the corner table — leg's loose, swore I told them last week.",
  },
  bike_emt_intro: {
    id: 'bike_emt_intro',
    speaker: 'Chase',
    text: "Three miles in eight minutes. The rig was still on the freeway. They paid me less than the rig made waiting.",
  },
  dr_park_intro: {
    id: 'dr_park_intro',
    speaker: 'Dr. Park',
    text: "I rounded twenty-two patients before the auditor's email. I'm not reading it until the cafeteria runs out of coffee.",
  },
  lab_tech_intro: {
    id: 'lab_tech_intro',
    speaker: 'Roni',
    text: "Modifier 91 on the second draw, modifier 59 on the urinalysis. They keep coming back NCCI-bundled because nobody copy-pastes the right modifier.",
  },

  // SW-corridor blocker. Cal stands in the south-wing trough at L1-6
  // and politely will not move; disappears at L7 when the last room
  // behind him (lecture hall) finally unlocks.
  maintenance_worker_intro: {
    id: 'maintenance_worker_intro',
    speaker: 'Cal',
    text: "Sorry, sorry — back wing's torn up. Billing, the phones, the lab, the lecture hall. Wiring, mostly. Ceiling tiles came down on Tuesday. Couple weeks and you'll be walking through here like nothing happened.",
  },

  // === Round 5 — Data Sandbox (R&D) + Turquoise Lounge ===
  chansoo_intro: {
    id: 'chansoo_intro',
    speaker: 'Chansoo',
    text: "Pulling the denial regression. Cleanest signal from the dirtiest data — every reason code is a different kind of lie.",
  },
  nicole_intro: {
    id: 'nicole_intro',
    speaker: 'Nicole',
    text: "Spinning up a sandbox env. One model per department, one schema per payer. Don't ask me which one Aetna's running today.",
  },
  nick_intro: {
    id: 'nick_intro',
    speaker: 'Nick',
    text: "PRD's in Notion, Linear's in flames, retro's at four. We ship Tuesday.",
  },
  monika_intro: {
    id: 'monika_intro',
    speaker: 'Monika',
    text: "Joining claim adjudications to remit codes. Two LEFT JOINs deep and still finding nulls where the patient should be.",
  },
  chris_intro: {
    id: 'chris_intro',
    speaker: 'Chris',
    text: "Pricing transparency rules. Hospitals love them in the press release, hate them in the spreadsheet.",
  },
  adam_intro: {
    id: 'adam_intro',
    speaker: 'Adam',
    text: "Standing up the chargemaster diff. Five hundred million rows; the diff fits on a screenshot. That's the bug.",
  },

  dana_l10_intake_back: {
    id: 'dana_l10_intake_back',
    speaker: 'Dana',
    text: "They're not in a hurry. They never are.",
    choices: [{ text: '(Step away.)' }],
  },
}

/** Per-level dialogue overrides. When `state.currentLevel` matches a
 *  key here, the matching NPC opens the listed dialogue tree instead
 *  of their default `dialogueKey`. Lets one NPC carry different cases
 *  across levels without forking their identity. */
export const LEVEL_NPC_DIALOGUES: Record<number, Record<string, string>> = {
  2:  { kim:      'kim_l2_intake' },
  3:  { sam:      'sam_l3_intake' },
  4:  { pat:      'pat_l4_intake' },
  5:  { sam:      'sam_l5_intake' },
  6:  { alex:     'alex_l6_intake' },
  7:  { sam:      'sam_l7_intake' },
  8:  { jordan:   'jordan_l8_intake' },
  9:  { kim:      'kim_l9_intake' },
  10: { dana:     'dana_l10_intake' },
}
