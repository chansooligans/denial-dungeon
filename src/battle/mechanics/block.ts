// BlockController — Prior Auth Gatekeeper.
//
// HP-based fight, but every odd-numbered player turn the "gate is
// shut": damage is absorbed and the move does nothing visible. Even
// turns hit normally. The bypass tool is `prior_auth_278` — using it
// once opens the gate permanently for the rest of the fight, so the
// player can chain damage from then on.
//
// Real-world parallel: payer requires precert (CO-197). Without it,
// every other appeal bounces. File the 278 once, gate falls.

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

/** Tool id that permanently opens the gate. */
const BYPASS_TOOL = 'prior_auth_278'

function stressAccuracyPenalty(): number {
  const stress = getState().resources.stress
  if (stress >= 75) return 20
  if (stress >= 50) return 10
  return 0
}

export class BlockController implements MechanicController {
  readonly encounter: Encounter
  private hp: number
  /** Player turn counter — increments at the start of each player turn. */
  private turnNumber = 0
  /** True once prior_auth_278 has been used. Disables the gate forever after. */
  private gateOpen = false

  constructor(encounter: Encounter) {
    this.encounter = encounter
    this.hp = encounter.hp
  }

  hpRatio(): number {
    return this.hp / this.encounter.hp
  }

  hpDisplay() {
    return { current: this.hp, max: this.encounter.hp }
  }

  statusLine(): string {
    if (this.gateOpen) return 'Gate: open  •  auth on file'
    // Show what the NEXT turn will look like — turnNumber is the count
    // of turns already played; the upcoming turn is turnNumber + 1.
    const nextWillBlock = (this.turnNumber + 1) % 2 === 1
    return nextWillBlock ? 'Gate: SHUT — next move blocked' : 'Gate: open this turn'
  }

  panelText(): string {
    return ''
  }

  getActions() {
    return null
  }

  applyPlayerTurn(toolId: string): PlayerTurnResult {
    this.turnNumber++

    // Bypass: prior auth 278. Opens the gate permanently and deals
    // moderate damage. Costs the turn just like any other action.
    if (toolId === BYPASS_TOOL) {
      const tool = TOOLS[toolId]
      const dmg = tool ? Math.round(tool.damage * EFFECTIVENESS_BONUS) : 24
      this.hp = Math.max(0, this.hp - dmg)
      const wasShut = !this.gateOpen
      this.gateOpen = true
      return {
        damage: dmg,
        super: true,
        message: wasShut
          ? `Prior Auth filed. The gate falls.\n${dmg} damage.`
          : `Prior Auth re-confirmed. ${dmg} damage.`,
        ends: this.hp <= 0,
      }
    }

    const tool = TOOLS[toolId]
    if (!tool) {
      return { damage: 0, missed: true, message: 'Unknown tool.' }
    }

    // The gate blocks every odd-numbered turn (1, 3, 5, …) until bypass.
    if (!this.gateOpen && this.turnNumber % 2 === 1) {
      return {
        damage: 0,
        missed: true,
        message: `${tool.name} bounces off the closed gate.\nNeed Prior Auth (278).`,
      }
    }

    // Normal damage path with stress penalty.
    const accuracy = Math.max(10, tool.accuracy - stressAccuracyPenalty())
    const roll = Phaser.Math.Between(1, 100)
    if (roll > accuracy) {
      const reason = stressAccuracyPenalty() > 0 ? ' (stressed)' : ''
      return { damage: 0, missed: true, message: `${tool.name} missed${reason}!` }
    }

    const isSuper = tool.effectiveFactions.includes(this.encounter.rootCause)
    let damage = tool.damage
    if (isSuper) damage = Math.round(damage * EFFECTIVENESS_BONUS)
    this.hp = Math.max(0, this.hp - damage)
    let message = `${tool.name} deals ${damage} damage!`
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
    const damage = Math.max(0, this.encounter.attackDamage + variance)
    return {
      damage,
      message: this.gateOpen
        ? `The Gatekeeper lashes out, weakened. -${damage} HP`
        : `The Gatekeeper strikes through the bars. -${damage} HP`,
    }
  }

  isWon(): boolean {
    return this.hp <= 0
  }

  isLost(): boolean {
    return false
  }
}
