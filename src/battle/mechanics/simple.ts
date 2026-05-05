// SimpleController — straight HP attrition with faction effectiveness.
//
// This wraps the behavior BattleScene used to do inline. Existing 11
// encounters (all CARC-based) run through this controller unchanged.

import Phaser from 'phaser'
import type { Encounter } from '../../types'
import { EFFECTIVENESS_BONUS } from '../../types'
import { TOOLS } from '../../content/abilities'
import type { MechanicController, PlayerTurnResult, EnemyTurnResult } from '../types'

export class SimpleController implements MechanicController {
  readonly encounter: Encounter
  private hp: number

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
    return ''
  }

  panelText(): string {
    return ''
  }

  getActions() {
    // SimpleController uses the player's normal tool ribbon.
    return null
  }

  isLost(): boolean {
    return false
  }

  applyPlayerTurn(toolId: string): PlayerTurnResult {
    const tool = TOOLS[toolId]
    if (!tool) {
      return { damage: 0, missed: true, message: 'Unknown tool.' }
    }

    const roll = Phaser.Math.Between(1, 100)
    if (roll > tool.accuracy) {
      return { damage: 0, missed: true, message: `${tool.name} missed!` }
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
      message: `The claim fights back! -${damage} HP`,
    }
  }

  isWon(): boolean {
    return this.hp <= 0
  }
}
