// InvestigationController — case-file fact-finding battles.
//
// No HP attrition. The encounter ships a CaseFile with relevant facts
// (mixed with distractors). The player has a turn budget and four
// actions: Investigate (reveal a fact), Lookup (codex hint), Document
// (strengthen a weakly-supported fact), Decide (submit resolution).
//
// Win: Decide once at least `threshold` relevant facts are revealed AND
// supported. Lose: Decide too early, or the turn budget runs out.

import Phaser from 'phaser'
import type { Encounter, CaseFact, CaseFile } from '../../types'
import type {
  MechanicController,
  PlayerTurnResult,
  EnemyTurnResult,
  MechanicAction,
} from '../types'

/** Per-fact runtime state on top of the encounter's authored CaseFact. */
interface FactState {
  fact: CaseFact
  revealed: boolean
  supported: boolean
  /** Set after a Lookup turn — show the relevance hint in the panel. */
  hintShown: boolean
}

const DEFAULT_TURN_BUDGET = 6

const ACTIONS: MechanicAction[] = [
  { id: 'investigate', label: 'INVESTIGATE', sub: 'reveal a fact' },
  { id: 'lookup',      label: 'LOOKUP',      sub: 'codex relevance' },
  { id: 'document',    label: 'DOCUMENT',    sub: 'strengthen evidence' },
  { id: 'decide',      label: 'DECIDE',      sub: 'submit resolution' },
]

export class InvestigationController implements MechanicController {
  readonly encounter: Encounter
  private caseFile: CaseFile
  private facts: FactState[]
  private turnsRemaining: number
  private maxTurns: number
  private won = false
  private lost = false
  /** Most recent action result text — surfaced in the panel header. */
  private lastResult = ''

  constructor(encounter: Encounter) {
    this.encounter = encounter
    if (!encounter.caseFile) {
      throw new Error(
        `Investigation encounter "${encounter.id}" is missing caseFile data.`
      )
    }
    this.caseFile = encounter.caseFile
    this.facts = encounter.caseFile.facts.map(f => ({
      fact: f,
      revealed: false,
      supported: false,
      hintShown: false,
    }))
    this.maxTurns = DEFAULT_TURN_BUDGET
    this.turnsRemaining = DEFAULT_TURN_BUDGET
  }

  // --- Display ---

  hpRatio(): number {
    return this.turnsRemaining / this.maxTurns
  }

  hpDisplay() {
    return { current: this.turnsRemaining, max: this.maxTurns }
  }

  statusLine(): string {
    const supported = this.relevantSupported()
    const goal = this.caseFile.threshold
    return `${this.turnsRemaining} turns left  •  Evidence ${supported}/${goal}`
  }

  panelText(): string {
    const lines: string[] = []
    if (this.lastResult) lines.push(`▸ ${this.lastResult}`, '')
    if (this.caseFile.intro) lines.push(this.caseFile.intro, '')
    for (const f of this.facts) {
      lines.push(this.factLine(f))
    }
    lines.push('', `Goal: ${this.caseFile.threshold} supported relevant facts.`)
    return lines.join('\n')
  }

  getActions(): MechanicAction[] {
    return ACTIONS.map(a => ({ ...a, disabled: this.actionDisabled(a.id) }))
  }

  // --- Turn application ---

  applyPlayerTurn(actionId: string): PlayerTurnResult {
    if (this.actionDisabled(actionId)) {
      const result: PlayerTurnResult = { damage: 0, missed: true, message: 'No effect.' }
      this.lastResult = result.message ?? ''
      return result
    }
    this.turnsRemaining = Math.max(0, this.turnsRemaining - 1)

    let result: PlayerTurnResult
    switch (actionId) {
      case 'investigate': result = this.investigate(); break
      case 'lookup':      result = this.lookup(); break
      case 'document':    result = this.document(); break
      case 'decide':      result = this.decide(); break
      default:
        result = { damage: 0, missed: true, message: `Unknown action ${actionId}.` }
    }
    this.lastResult = (result.message ?? '').replace(/\n/g, ' ')
    return result
  }

  applyEnemyTurn(): EnemyTurnResult {
    // Investigation has no aggressive enemy turn — time pressure was
    // already applied during the player's action. If the budget is now
    // empty and the player hasn't decided, the claim ages out.
    if (!this.won && !this.lost && this.turnsRemaining <= 0) {
      this.lost = true
      return { damage: 0, message: 'The clock runs out. The claim ages out.' }
    }
    return { damage: 0, message: '' }
  }

  isWon(): boolean { return this.won }
  isLost(): boolean { return this.lost }

  // --- Action implementations ---

  private investigate(): PlayerTurnResult {
    const hidden = this.facts.filter(f => !f.revealed)
    if (hidden.length === 0) {
      return { damage: 0, message: 'Nothing more to investigate.' }
    }
    const pick = Phaser.Math.RND.pick(hidden)
    pick.revealed = true
    // Weakly-supported facts come in needing a Document pass.
    pick.supported = !pick.fact.weakOnReveal
    const isRelevant = pick.fact.relevance === 'relevant'
    return {
      damage: 0,
      super: isRelevant && pick.supported,
      message: `Revealed: ${pick.fact.label}` +
        (pick.fact.weakOnReveal ? '\n(weakly supported — needs Documentation.)' : ''),
    }
  }

  private lookup(): PlayerTurnResult {
    let any = false
    for (const f of this.facts) {
      if (f.revealed && !f.hintShown) {
        f.hintShown = true
        any = true
      }
    }
    if (!any) {
      return { damage: 0, message: 'Codex consulted. Nothing new to flag.' }
    }
    return {
      damage: 0,
      message: 'Codex consulted. Relevance flags shown on revealed facts.',
    }
  }

  private document(): PlayerTurnResult {
    // Strengthens the first revealed-but-not-supported relevant fact.
    const target = this.facts.find(
      f => f.revealed && !f.supported && f.fact.relevance === 'relevant'
    )
    if (!target) {
      return { damage: 0, message: 'No facts available to document.' }
    }
    target.supported = true
    return {
      damage: 0,
      super: true,
      message: `Documented: ${target.fact.label}`,
    }
  }

  private decide(): PlayerTurnResult {
    const supported = this.relevantSupported()
    if (supported >= this.caseFile.threshold) {
      this.won = true
      return {
        damage: 1,
        super: true,
        ends: true,
        message: 'Resolution submitted. The Wraith dissolves into paperwork.',
      }
    }
    this.lost = true
    return {
      damage: 0,
      ends: true,
      message: `Resolution rejected — only ${supported}/${this.caseFile.threshold} supported. The Wraith feeds.`,
    }
  }

  // --- Helpers ---

  private relevantSupported(): number {
    return this.facts.filter(
      f => f.revealed && f.supported && f.fact.relevance === 'relevant'
    ).length
  }

  private actionDisabled(actionId: string): boolean {
    if (this.won || this.lost) return true
    switch (actionId) {
      case 'investigate':
        return this.facts.every(f => f.revealed)
      case 'document':
        return !this.facts.some(
          f => f.revealed && !f.supported && f.fact.relevance === 'relevant'
        )
      default:
        return false
    }
  }

  private factLine(f: FactState): string {
    if (!f.revealed) return '·  ???'
    const marker = f.supported ? '✓' : '~'
    let suffix = ''
    if (f.hintShown) {
      suffix = f.fact.relevance === 'relevant'
        ? '  (RELEVANT)'
        : '  (UNRELATED)'
    }
    return `${marker}  ${f.fact.label}${suffix}`
  }
}
