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
  | 'simple'        // HP attrition + faction effectiveness (default)
  | 'none'          // alias of 'simple'
  | 'investigation' // case-file fact-finding, time budget instead of HP
  | 'timed'         // HP + countdown; attacks escalate as time runs (Reaper)
  | 'block'         // immune every other turn (Prior Auth Gatekeeper)
  | 'mirror'        // same tool used twice in a row does no damage (Doppelgänger)
  | 'multiHead'     // multiple HP pools, each with own weakness (COB Hydra)
  | 'blind'         // tool accuracy degraded until cleared (Eligibility Fog)
  | 'spawn'         // adds reinforcements every N turns (Sprite swarm)
  | 'audit'         // L10 boss — HP / damage scale with player's audit risk; shadow tools heal the boss

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
  /**
   * Case-file data for `mechanic: 'investigation'` encounters. Each fact
   * is either relevant to the resolution or a distractor. Some facts are
   * "weakly supported" on reveal — the player must use Document to make
   * them count toward the win threshold.
   */
  caseFile?: CaseFile
  /**
   * References a PatientCase whose `claim` data is rendered as a
   * realistic CMS-1500 / UB-04 in the battle UI. Lets battle and the
   * form-puzzle scene share one source of truth per stuck claim.
   */
  caseId?: string
  /**
   * Box ids on the linked claim that this fight is disputing. Rendered
   * with a red highlight on the ClaimSheet so the player can see
   * exactly where the problem is.
   * Examples: '21A', '24D-1' (line 1 of box 24D), '24A-2'.
   */
  highlightedBoxes?: string[]
  /**
   * The payer's denial language as it would appear on the 835 ERA or
   * letter. Rendered beneath the claim form during the fight.
   */
  payerNote?: string
  /**
   * Per-tool / per-action visual effects on the ClaimSheet. Keys are
   * tool ids (Simple/Timed) or mechanic action ids (Investigation:
   * 'investigate' | 'lookup' | 'document' | 'decide').
   *
   * Example:
   *   toolEffects: { cdi_query: [{ box: '24D-1', kind: 'stamp', value: '+25 mod' }] }
   *
   * BattleScene calls ClaimSheet.applyEffect(effect) after a successful
   * action, so the player sees the form change in response to what they
   * did.
   */
  toolEffects?: Record<string, ToolEffect[]>
  /**
   * Design-time draft for re-imagining this encounter as a puzzle
   * rather than an HP fight. Rendered on the public battle catalog
   * (battles.html) when present; ignored at runtime by the battle
   * engine. Lets us iterate on a puzzle structure (issue checklist,
   * payer replies, win condition) outside the live game.
   *
   * The shape is intentionally narrative — these are sketches, not
   * runnable specs. Once a draft feels right, port it into a
   * MechanicController in src/battle/mechanics/.
   */
  puzzleDraft?: PuzzleDraft
}

/**
 * A draft puzzle reframe for an Encounter. Author once in
 * `enemies.ts`; the catalog renders it. None of these fields run in
 * the live game.
 */
export interface PuzzleDraft {
  /** One-line summary of what the puzzle is about. */
  premise: string
  /**
   * Ordered list of issues the player must resolve to win. Hidden
   * issues (revealed via investigation) get `hidden: true`. Each
   * issue suggests the canonical resolving tool/action.
   */
  issues: PuzzleIssue[]
  /**
   * Win condition prose — when does the claim adjudicate clean?
   * Usually "all issues resolved + Submit pressed".
   */
  winCondition: string
  /**
   * Failure / penalty modes — what wrong moves cost. Filing-window
   * burn, goodwill loss, audit risk, etc. Replaces "HP damage" in
   * the puzzle frame.
   */
  costs: string[]
  /**
   * Sample payer replies (string keys = tool id or action label,
   * values = the response shown to the player). Optional — used to
   * sketch the dialogue feel without committing to one wording.
   */
  payerReplies?: Record<string, string>
  /** Free-form design notes / open questions / risks. */
  notes?: string
}

export interface PuzzleIssue {
  /** Short label (≤ ~70 chars). */
  label: string
  /** Hidden until investigation reveals it. */
  hidden?: boolean
  /** Canonical tool / action that resolves this issue. */
  resolvedBy?: string
  /** Why this is the issue — the teaching beat. */
  teaching?: string
}

/** A visible mutation applied to a CMS-1500 field during battle. */
export interface ToolEffect {
  /** Box id matching ClaimSheet conventions, e.g. '24D-1'. */
  box: string
  /**
   * 'stamp' — adds short red text overlapping the field (e.g. '+25 mod').
   * 'check' — adds a green ✓ near the field.
   * 'note'  — adds a small yellow annotation under the field (e.g. 'LCD reviewed').
   */
  kind: 'stamp' | 'check' | 'note'
  /** Value text for stamp / note. Ignored for check. */
  value?: string
}

export interface CaseFact {
  id: string
  /** Short text shown in the case file panel (≤ ~70 chars). */
  label: string
  /** Whether this fact actually matters to the resolution. */
  relevance: 'relevant' | 'distractor'
  /** When true, this fact reveals as "weakly supported" — needs Document. */
  weakOnReveal?: boolean
  /**
   * Optional ClaimSheet annotation that lands on the form when this
   * fact is first revealed by Investigate. Lets revealed evidence be
   * visible in-form, not just in messageText.
   */
  onReveal?: ToolEffect
}

export interface CaseFile {
  /** Number of relevant + supported facts needed to win Decide. */
  threshold: number
  facts: CaseFact[]
  /** Optional flavor shown above the panel ("From the chart:" etc.). */
  intro?: string
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
  /**
   * Realistic box-by-box claim data for the ClaimSheet renderer. When
   * present, both FormScene and BattleScene draw from this to keep the
   * stuck claim visually consistent across the form puzzle and the
   * battle. Optional so legacy cases keep working.
   */
  claim?: ClaimSheetData
}

// === Claim sheet (realistic CMS-1500 / UB-04 rendering) ===

/**
 * A code+label pair. Many CMS-1500 fields are short codes (ICD-10, CPT,
 * place-of-service) where the label is what the player needs to learn.
 */
export interface ClaimFieldValue {
  code: string
  /** Optional human-readable label, e.g. "Heart failure, unspecified". */
  label?: string
}

/** One row in box 24 of a CMS-1500 (a single billable service). */
export interface ServiceLine {
  /** Box 24A — date of service (YYYY-MM-DD or display string). */
  dos: string
  /** Box 24B — place of service (numeric, e.g. '11' = office). */
  pos: string
  /** Box 24D — procedure code (CPT/HCPCS). */
  cpt: ClaimFieldValue
  /** Box 24D — modifier(s), e.g. '25', '59', or '25, 59'. */
  modifier?: string
  /** Box 24E — diagnosis pointer (letters A-D pointing into box 21). */
  dxPointer: string
  /** Box 24F — charged amount (display string, e.g. '$2,150.00'). */
  charges: string
}

/** One row in boxes 42-47 of a UB-04 (institutional service line). */
export interface UB04ServiceLine {
  /** Box 42 — Revenue code (4-digit, e.g. '0250' Pharmacy, '0360' OR). */
  revCode: string
  /** Box 43 — Revenue code description (e.g. 'Operating Room'). */
  description: string
  /** Box 44 — HCPCS / Rate / HIPPS (where applicable). */
  hcpcs?: string
  /** Box 45 — Service date (institutional claims also have line dates). */
  serviceDate?: string
  /** Box 46 — Service units. */
  units?: string
  /** Box 47 — Total charges. */
  totalCharges: string
}

/**
 * Realistic CMS-1500 field data for the ClaimSheet renderer. Field
 * naming mirrors the actual form's box numbers so `highlightedBoxes`
 * ids on an Encounter line up with what's drawn.
 */
export interface CMS1500Data {
  type: 'cms1500'
  claimId: string
  /** Box 1 — insurance program type (e.g. 'Group', 'Medicare'). */
  insuranceType?: string
  /** Box 2 + 3. */
  patient: {
    name: string
    dob: string
    sex?: 'M' | 'F'
  }
  /** Box 1a (id) + 4 (name) + 11 (group #). */
  insured: {
    id: string
    name?: string
    group?: string
  }
  /** Box 21 A-D — diagnoses (typically 1-4 entries). */
  diagnoses: ClaimFieldValue[]
  /** Box 24 — one or more service lines. */
  serviceLines: ServiceLine[]
  /** Box 31 — rendering provider signature. */
  provider: {
    name: string
    npi?: string
  }
}

/**
 * Realistic UB-04 (institutional / hospital billing) field data.
 * Different fields and box numbers from the CMS-1500 — type-of-bill,
 * admission, revenue codes, attending provider, DRG.
 *
 * Box id convention for `highlightedBoxes`:
 *   '4'  = type of bill, '6' = statement period, '14' = admission type,
 *   '42-N' / '43-N' / '44-N' / '47-N' = service line N revcode/desc/hcpcs/charges,
 *   '67' = principal dx, '67A'..'67Q' = other dx,
 *   '76' = attending provider, '80' = DRG.
 */
export interface UB04Data {
  type: 'ub04'
  claimId: string
  /** Box 4 — type of bill (e.g. '111' inpatient, '131' outpatient). */
  typeOfBill: string
  patient: {
    name: string
    dob: string
    sex?: 'M' | 'F'
  }
  insured: {
    id: string
    name?: string
    group?: string
  }
  /** Box 6 — statement period covered by this bill. */
  statementPeriod?: { from: string; through: string }
  /** Box 14 — type of admission (e.g. 'EMG', 'URG', 'ELC'). */
  admissionType?: string
  /** Box 67 + 67A..67Q — diagnoses. First entry is principal. */
  diagnoses: ClaimFieldValue[]
  /** Box 42-47 — service line table. */
  serviceLines: UB04ServiceLine[]
  /** Box 76 — attending provider. */
  attendingProvider: {
    name: string
    npi?: string
  }
  /** Box 80 — DRG / occurrence remark. */
  drg?: string
}

/**
 * Discriminated union over the two claim form types. ClaimSheet
 * dispatches its render based on `data.type`.
 */
export type ClaimSheetData = CMS1500Data | UB04Data

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
  /**
   * PatientCase ids the player has solved with every error caught.
   * Drives the form-bridge buff: any obstacle whose `caseId` is in this
   * list starts the matching battle at full HP.
   */
  formsPerfected: string[]
  /**
   * One-shot level-advance banner trigger. Set by
   * `checkLevelProgression()` when a defeat threshold is crossed,
   * read + cleared by `consumePendingLevelBanner()` from
   * HospitalScene's create() to surface the "Level N — <Title>"
   * announcement on next entry.
   */
  pendingLevelBanner?: number | null
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
