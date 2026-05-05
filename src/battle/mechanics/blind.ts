// BlindController — Eligibility Fog.
//
// HP-based fight where everything is shrouded: tool accuracy is cut by
// 30% across the board because you don't actually know what the
// patient's plan covers. Using `eligibility_270` clears the fog
// permanently — once you've run the 270 inquiry, the obstacle's plan
// (and your own accuracy) are visible.
//
// Real-world parallel: missing eligibility verification. Coverage,
// network, COB, and benefit details are all unknown until the 270/271
// happens. Most "denials" are actually predictable from the eligibility
// response — you just need to look first.

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

/** Tool id that clears the fog. */
const CLEAR_TOOL = 'eligibility_270'
/** Accuracy penalty (in percentage points) while fog is active. */
const FOG_PENALTY = 30

function stressAccuracyPenalty(): number {
  const stress = getState().resources.stress
  if (stress >= 75) return 20
  if (stress >= 50) return 10
  return 0
}

export class BlindController implements MechanicController {
  readonly encounter: Encounter
  private hp: number
  /** True once the fog has been cleared by a 270 inquiry. Permanent. */
  private fogCleared = false

  constructor(encounter: Encounter) {
    this.encounter = encounter
    this.hp = encounter.hp
  }

  hpRatio(): number { return this.hp / this.encounter.hp }
  hpDisplay() { return { current: this.hp, max: this.encounter.hp } }

  statusLine(): string {
    return this.fogCleared
      ? 'Fog cleared  •  benefits visible'
      : 'Fog: thick — every move is half-blind'
  }

  panelText(): string { return '' }
  getActions() { return null }

  applyPlayerTurn(toolId: string): PlayerTurnResult {
    // Special: 270 eligibility inquiry clears the fog and deals modest damage.
    if (toolId === CLEAR_TOOL) {
      const tool = TOOLS[toolId]
      const dmg = tool ? Math.round(tool.damage * EFFECTIVENESS_BONUS) : 18
      this.hp = Math.max(0, this.hp - dmg)
      const wasFogged = !this.fogCleared
      this.fogCleared = true
      return {
        damage: dmg,
        super: true,
        message: wasFogged
          ? `270 inquiry returns. The fog burns off.\n${dmg} damage.`
          : `Eligibility re-confirmed. ${dmg} damage.`,
        ends: this.hp <= 0,
      }
    }

    const tool = TOOLS[toolId]
    if (!tool) return { damage: 0, missed: true, message: 'Unknown tool.' }

    // Accuracy: base − stress penalty − (fog penalty if not cleared).
    const fogPenalty = this.fogCleared ? 0 : FOG_PENALTY
    const accuracy = Math.max(10, tool.accuracy - stressAccuracyPenalty() - fogPenalty)
    const roll = Phaser.Math.Between(1, 100)
    if (roll > accuracy) {
      const reasons: string[] = []
      if (fogPenalty > 0) reasons.push('blind')
      if (stressAccuracyPenalty() > 0) reasons.push('stressed')
      const tag = reasons.length > 0 ? ` (${reasons.join(', ')})` : ''
      return { damage: 0, missed: true, message: `${tool.name} missed${tag}!` }
    }

    const isSuper = tool.effectiveFactions.includes(this.encounter.rootCause)
    let damage = tool.damage
    if (isSuper) damage = Math.round(damage * EFFECTIVENESS_BONUS)
    this.hp = Math.max(0, this.hp - damage)
    let message = `${tool.name} lands. ${damage} damage!`
    if (isSuper) message += '\nSuper effective!'
    return { damage, super: isSuper, message, ends: this.hp <= 0 }
  }

  applyEnemyTurn(): EnemyTurnResult {
    const variance = Phaser.Math.Between(-2, 2)
    const damage = Math.max(0, this.encounter.attackDamage + variance)
    return {
      damage,
      message: this.fogCleared
        ? `The Fog lashes thinner walls. -${damage} HP`
        : `Something in the fog hits you. -${damage} HP`,
    }
  }

  isWon(): boolean { return this.hp <= 0 }
  isLost(): boolean { return false }
}
