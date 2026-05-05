// AuditController — L10 boss "The Quarterly Audit".
//
// The whole run-long shadow-tool / audit-risk system finally has teeth
// in this fight. Every shortcut the player took (upcode,
// aggressive_collections, etc.) inflated `state.resources.auditRisk`,
// and that number now becomes the boss's HP cushion and attack power.
//
// Effects:
//   - Boss starting HP = encounter.hp + auditRisk
//   - Boss base damage += floor(auditRisk / 10)
//   - Using a shadow tool during this fight HEALS the boss for `tool.damage`
//     (the auditor finds yet another receipt) and lands 0 damage. Player
//     also takes auditDelta. The auditor remembers — so should the player.
//   - Using `cdi_query`, `medical_policy`, or `claim_scrubber` is super-
//     effective (the audit's whole language is documentation).
//
// Why this teaches: the shadow econ in this game isn't a flavor knob,
// it's the cost. The boss IS the bill for prior shortcuts. By the time
// the player sees the inflated HP bar and the "+receipt" heal text,
// the connection is unmistakable.

import Phaser from 'phaser'
import type { Encounter } from '../../types'
import { EFFECTIVENESS_BONUS } from '../../types'
import { TOOLS } from '../../content/abilities'
import { getState } from '../../state'
import type {
  MechanicController,
  PlayerTurnResult,
  EnemyTurnResult,
} from '../types'

const SUPER_TOOLS = new Set(['cdi_query', 'medical_policy', 'claim_scrubber'])

function stressAccuracyPenalty(): number {
  const stress = getState().resources.stress
  if (stress >= 75) return 20
  if (stress >= 50) return 10
  return 0
}

export class AuditController implements MechanicController {
  readonly encounter: Encounter
  private maxHp: number
  private hp: number
  private bonusDamage: number
  private startingAuditRisk: number

  constructor(encounter: Encounter) {
    this.encounter = encounter
    const auditRisk = Math.max(0, getState().resources.auditRisk)
    this.startingAuditRisk = auditRisk
    this.maxHp = encounter.hp + auditRisk
    this.hp = this.maxHp
    this.bonusDamage = Math.floor(auditRisk / 10)
  }

  hpRatio(): number {
    return this.hp / this.maxHp
  }

  hpDisplay() {
    return { current: this.hp, max: this.maxHp }
  }

  statusLine(): string {
    const ar = this.startingAuditRisk
    if (ar <= 0) return 'Audit risk: clean — no extra receipts in the file'
    return `Audit risk this run: ${ar}  •  +${ar} HP / +${this.bonusDamage} dmg`
  }

  panelText(): string { return '' }
  getActions() { return null }

  applyPlayerTurn(toolId: string): PlayerTurnResult {
    const tool = TOOLS[toolId]
    if (!tool) return { damage: 0, missed: true, message: 'Unknown tool.' }

    const accuracy = Math.max(10, tool.accuracy - stressAccuracyPenalty())
    const roll = Phaser.Math.Between(1, 100)
    if (roll > accuracy) {
      const reason = stressAccuracyPenalty() > 0 ? ' (stressed)' : ''
      return { damage: 0, missed: true, message: `${tool.name} missed${reason}!` }
    }

    // Shadow tools — the auditor pulls another receipt. Boss heals.
    if (tool.shadow) {
      const heal = tool.damage
      this.hp = Math.min(this.maxHp, this.hp + heal)
      return {
        damage: 0,
        message: `The auditor pulls another receipt.\n${tool.name} healed the audit for ${heal}.`,
      }
    }

    // Documentation tools are super-effective.
    let damage = tool.damage
    const isSuper = SUPER_TOOLS.has(toolId) || tool.effectiveFactions.includes(this.encounter.rootCause)
    if (isSuper) damage = Math.round(damage * EFFECTIVENESS_BONUS)
    this.hp = Math.max(0, this.hp - damage)

    let message = `${tool.name} delivers documentation. -${damage}`
    if (isSuper) message += '\nSuper effective!'

    return {
      damage,
      super: isSuper,
      message,
      ends: this.hp <= 0,
    }
  }

  applyEnemyTurn(): EnemyTurnResult {
    const variance = Phaser.Math.Between(-2, 2)
    const damage = Math.max(0, this.encounter.attackDamage + this.bonusDamage + variance)
    return {
      damage,
      message: this.bonusDamage > 0
        ? `The auditor cites the file. -${damage} HP (audit-risk weighted)`
        : `The auditor cites the file. -${damage} HP`,
    }
  }

  isWon(): boolean { return this.hp <= 0 }
  isLost(): boolean { return false }
}
