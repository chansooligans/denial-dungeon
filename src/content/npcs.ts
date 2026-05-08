import type { NPC } from '../types'

export const NPCS: Record<string, NPC> = {
  dana: {
    id: 'dana',
    name: 'Dana',
    department: 'Revenue Cycle',
    spriteKey: 'npc_dana',
    dialogueKey: 'dana_intro',
    description: 'Your mentor. Knows where every claim goes and why.',
  },
  martinez: {
    id: 'martinez',
    name: 'Dr. Martinez',
    department: 'Surgery',
    spriteKey: 'npc_martinez',
    dialogueKey: 'martinez_intro',
    description: 'Brilliant surgeon, terrible at documentation.',
  },
  kim: {
    id: 'kim',
    name: 'Kim',
    department: 'Registration',
    spriteKey: 'npc_kim',
    dialogueKey: 'kim_intro',
    description: 'Front desk. First point of contact, first point of failure.',
  },
  jordan: {
    id: 'jordan',
    name: 'Jordan',
    department: 'Patient Financial Services',
    spriteKey: 'npc_jordan',
    dialogueKey: 'jordan_intro',
    description: 'Explains bills to confused patients all day.',
  },
  pat: {
    id: 'pat',
    name: 'Pat',
    department: 'Coding',
    spriteKey: 'npc_pat',
    dialogueKey: 'pat_intro',
    description: 'Senior coder. ICD-10 in their sleep.',
  },
  alex: {
    id: 'alex',
    name: 'Alex',
    department: 'IT / EDI',
    spriteKey: 'npc_alex',
    dialogueKey: 'alex_intro',
    description: 'Manages the clearinghouse connection. Speaks in X12.',
  },
  sam: {
    id: 'sam',
    name: 'Sam',
    department: 'Denials Management',
    spriteKey: 'npc_sam',
    dialogueKey: 'sam_intro',
    description: 'Works the appeal queue. Tired but determined.',
  },
  anjali: {
    id: 'anjali',
    name: 'Anjali Patel',
    department: 'Patient',
    spriteKey: 'npc_anjali',
    dialogueKey: 'anjali_intro',
    description: 'Came in for strep. Now holding a $387 ER bill that says she isn\'t on the plan.',
  },

  // === L10: The audit team. Show up only in the conference room when
  //     the player has reached the boss. Each one is talkable but
  //     none hands a case — the only progress path is Dana. ===
  auditor_carl: {
    id: 'auditor_carl',
    name: 'Carl Westbrook',
    department: 'Audit / Partner',
    spriteKey: 'npc_carl',
    dialogueKey: 'auditor_carl_intro',
    description: 'Senior partner. Smile that lives only on his face.',
  },
  auditor_chen: {
    id: 'auditor_chen',
    name: 'Wendy Chen',
    department: 'Audit / Data Analytics',
    spriteKey: 'npc_chen',
    dialogueKey: 'auditor_chen_intro',
    description: 'Built the regression model that flagged your hospital.',
  },
  auditor_rivera: {
    id: 'auditor_rivera',
    name: 'Mira Rivera',
    department: 'Audit / Compliance',
    spriteKey: 'npc_rivera',
    dialogueKey: 'auditor_rivera_intro',
    description: 'JD/MPH. Has read every NCD published in the last decade.',
  },
  auditor_eddi: {
    id: 'auditor_eddi',
    name: 'Eddi',
    department: 'Audit / Observer',
    spriteKey: 'npc_eddi',
    dialogueKey: 'auditor_eddi_intro',
    description: 'Doesn\'t introduce themselves. Doesn\'t need to.',
  },
}
