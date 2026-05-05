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

// === Waiting Room geography ===

/**
 * The Waiting Room is divided into thematic wings, each housing the
 * obstacles that personify that part of the revenue cycle.
 */
export type Wing =
  | 'eligibility'      // 270/271, COB, plan basics
  | 'coding'           // ICD-10, CPT, modifiers, CDI
  | 'billing'          // 837, scrubber, clearinghouse, 277CA
  | 'appeals'          // medical necessity, prior auth, timely filing
  | 'reconsideration'  // contract / fee schedule disputes
  | 'patient_services' // NSA, estimates, cost share
  | 'miracles'         // endgame / surreal

export const WING_LABEL: Record<Wing, string> = {
  eligibility: 'Eligibility',
  coding: 'Coding',
  billing: 'Billing',
  appeals: 'Appeals',
  reconsideration: 'Reconsideration',
  patient_services: 'Patient Services',
  miracles: 'Miracles',
}

/**
 * Optional mechanical hook that makes an obstacle play differently from
 * a vanilla HP-bar fight. BattleScene grows support for these
 * incrementally (Phase 4); 'none' is the default behavior.
 */
export type BattleMechanic =
  | 'none'        // straight fight
  | 'block'       // immune every other turn (Prior Auth Gatekeeper)
  | 'mirror'      // same tool used twice in a row does no damage (Doppelgänger)
  | 'turnLimit'   // hard turn cap; lose if not defeated (Timely Filing Reaper)
  | 'multiHead'   // multiple HP pools, each with own weakness (COB Hydra)
  | 'blind'       // tool accuracy degraded until cleared (Eligibility Fog)
  | 'spawn'       // adds reinforcements every N turns (Sprite swarm)

// === Encounters (what you face in battle) ===

/**
 * An Encounter is what the player fights in The Waiting Room. Originally
 * keyed to a real CARC code; now also supports surreal procedural
 * obstacles that teach non-CARC parts of the revenue cycle (eligibility
 * verification, charge capture, AR aging, NSA, etc.).
 *
 * Backward-compat: `carcCode` / `carcName` remain optional so existing
 * 11 CARC encounters keep their data; new obstacles can omit them.
 */
export interface Encounter {
  id: string
  title: string
  description: string
  surfaceSymptom: string
  rootCause: Faction
  hp: number
  attackDamage: number
  /** CARC code if this obstacle wraps a real denial code. Optional. */
  carcCode?: string
  carcName?: string
  watchpoint: string
  correctTools: string[]
  level: number
  // --- New fields, all optional for backward compatibility ---
  /** Display name + flavor of the procedural obstacle (e.g. "Missing Modifier Gremlin"). */
  archetype?: string
  /** Where in the Waiting Room this obstacle lives. */
  wing?: Wing
  /** Mechanical hook that varies the battle behavior. */
  mechanic?: BattleMechanic
  /** Tools that auto-unlock to the player on first defeat of this encounter. */
  unlocksOnDefeat?: string[]
  /** Codex entry id auto-unlocked the first time the player sees this encounter. */
  codexOnSight?: string
  /** Approximate dollar amount recovered on win (display + cash delta). */
  cashRecovered?: number
}

// === Tickets ===

/**
 * A "stuck claim" handed to the player by a hospital NPC. Anchors the
 * descend → form-bridge → battle → return loop. Free wandering
 * encounters do not require a ticket.
 */
export interface Ticket {
  id: string
  patientName: string
  /** Which encounter (obstacle) is keeping the claim in limbo. */
  encounterId: string
  /** Optional form puzzle whose perfect completion buffs the matching battle. */
  formCaseId?: string
  /** Has the form already been solved (perfectly)? Drives the full-HP buff. */
  formPerfected?: boolean
  /** Issuing NPC, for return dialogue. */
  fromNpc: string
  /** Set after the matching battle is won. */
  resolved?: boolean
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

export type CodexCategory = 'codes' | 'forms' | 'transactions' | 'concepts' | 'stats' | 'obstacles'

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
    /**
     * Stress accumulates across battles; persists for the whole run.
     * Drives a soft penalty when high (slower tools, weaker first turn).
     * Distinct from auditRisk (consequences) and reputation (NPCs).
     */
    stress: number
  }
  tools: string[]
  codexUnlocked: string[]
  decisions: Decision[]
  inWaitingRoom: boolean
  /**
   * Stuck-claim tickets the player has picked up but not yet resolved.
   * Anchored battles read from this list to wire form-bridge buffs and
   * post-battle NPC reactions.
   */
  activeTickets: Ticket[]
  /** Encounter ids the player has defeated at least once. */
  defeatedObstacles: string[]
  /** Wings of the Waiting Room currently accessible to the player. */
  wingsUnlocked: Wing[]
  /** Encounter ids the player has seen (for codex auto-unlock on sight). */
  obstaclesSeen: string[]
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
