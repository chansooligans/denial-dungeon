// === Factions ===

export type Faction =
  | 'payer'
  | 'provider'
  | 'vendor'
  | 'patient'
  | 'employer'
  | 'system'

export const FACTION_LABEL: Record<Faction, string> = {
  payer: 'Payer',
  provider: 'Provider',
  vendor: 'Vendor',
  patient: 'Patient',
  employer: 'Employer',
  system: 'System',
}

export const FACTION_COLOR: Record<Faction, number> = {
  payer: 0x6da9e3,
  provider: 0xec8f6e,
  vendor: 0x6cd49a,
  patient: 0xf4d06f,
  employer: 0xb18bd6,
  system: 0xa3aab5,
}

// === Tools (player actions in battle) ===

export interface Tool {
  id: string
  name: string
  faction: Faction
  damage: number
  accuracy: number
  turnCost: number
  effectiveFactions: Faction[]
  effect: string
  teaches: string
  shadow?: boolean
  reputationDelta?: number
  auditDelta?: number
  cashDelta?: number
}

// === Encounters (what you face in battle) ===

export interface Encounter {
  id: string
  title: string
  description: string
  surfaceSymptom: string
  rootCause: Faction
  hp: number
  attackDamage: number
  carcCode: string
  carcName: string
  watchpoint: string
  correctTools: string[]
  level: number
}

// === NPCs ===

export interface NPC {
  id: string
  name: string
  department: string
  spriteKey: string
  dialogueKey: string
  description: string
}

// === Dialogue ===

export interface DialogueChoice {
  text: string
  next?: string
  effect?: DialogueEffect
}

export interface DialogueEffect {
  reputationDelta?: number
  auditDelta?: number
  cashDelta?: number
  addTool?: string
  unlockCodex?: string
  triggerBattle?: string
  triggerForm?: string
}

export interface DialogueNode {
  id: string
  speaker: string
  text: string
  choices?: DialogueChoice[]
  next?: string
}

// === Codex ===

export type CodexCategory = 'codes' | 'forms' | 'transactions' | 'concepts' | 'stats'

export interface CodexEntry {
  id: string
  name: string
  category: CodexCategory
  description: string
  detail: string
  levelDiscovered?: number
}

// === Patient Cases (form puzzles) ===

export interface PatientCase {
  id: string
  patientName: string
  age: number
  insurance: string
  diagnosis: string
  diagnosisCode: string
  procedure: string
  procedureCode: string
  modifiers?: string[]
  revenueCode?: string
  formType: 'cms1500' | 'ub04'
  errors?: FormError[]
  level: number
}

export interface FormError {
  field: string
  currentValue: string
  correctValue: string
  explanation: string
}

// === Level ===

export interface LevelDef {
  id: number
  title: string
  subtitle: string
  hospitalDescription: string
  waitingRoomDescription: string
  concepts: string[]
  encounters: string[]
  cases: string[]
  npcsActive: string[]
  bossEncounter?: string
}

// === Game State ===

export interface GameState {
  currentLevel: number
  levelComplete: boolean[]
  levelStars: number[]
  resources: {
    hp: number
    maxHp: number
    cash: number
    reputation: number
    auditRisk: number
  }
  tools: string[]
  codexUnlocked: string[]
  decisions: Decision[]
  inWaitingRoom: boolean
}

export interface Decision {
  level: number
  description: string
  choice: string
  consequence: string
}

// === Constants ===

export const PHASE_NAMES = [
  'Orientation',
  'The Front Door',
  'The Gate',
  'The Copy',
  'The Library',
  'The Conveyor',
  'The Courtroom',
  'The River',
  'The Maze',
  'The Audit',
] as const

export const EFFECTIVENESS_BONUS = 1.6
