// TimedController — HP attrition with a hard turn budget that ages out.
//
// Identical to SimpleController for the player's damage/accuracy math,
// but adds a Days Remaining counter that decrements every turn. The
// enemy's attack damage scales as the counter shrinks, so dawdling is
// punished.  When days hit 0 without the player winning, the claim
// "ages out" and the battle is lost regardless of HP.
//
// Theme: Timely Filing Reaper. Real concept: most payer contracts have
// a 90/180/365-day timely filing deadline; missing it is permanent and
// not appealable, no matter how meritorious the claim.

import Phaser from 'phaser'
import type { Encounter } from '../../types'
import { EFFECTIVENESS_BONUS } from '../../types'
import { TOOLS } from '../../content/abilities'
import type {
  MechanicController,
  PlayerTurnResult,
  EnemyTurnResult,
} from '../types'

const DEFAULT_DAYS = 7
/** Each lost day adds this much to the enemy's base attack damage. */
const ESCALATION_PER_DAY = 4
/** Tool id that buys back days instead of dealing damage, if present in player's kit. */
const PROOF_OF_TIMELY = 'proof_of_timely'

export class TimedController implements MechanicController {
  readonly encounter: Encounter
  private hp: number
  private daysRemaining: number
  private maxDays: number

  constructor(encounter: Encounter) {
    this.encounter = encounter
    this.hp = encounter.hp
    this.maxDays = DEFAULT_DAYS
    this.daysRemaining = DEFAULT_DAYS
  }

  hpRatio(): number {
    return this.hp / this.encounter.hp
  }

  hpDisplay() {
    return { current: this.hp, max: this.encounter.hp }
  }

  statusLine(): string {
    return `Days remaining: ${this.daysRemaining} / ${this.maxDays}`
  }

  panelText(): string {
    return ''
  }

  getActions() {
    // Use the player's regular tool ribbon. The Proof-of-Timely tool, if
    // unlocked, just appears in the ribbon and is recognized by id below.
    return null
  }

  applyPlayerTurn(toolId: string): PlayerTurnResult {
    // Special: Proof of Timely buys back days instead of damaging.
    if (toolId === PROOF_OF_TIMELY) {
      const gained = Math.min(2, this.maxDays - this.daysRemaining)
      this.daysRemaining = Math.min(this.maxDays, this.daysRemaining + 2)
      this.daysRemaining = Math.max(0, this.daysRemaining - 1) // costs the action's turn
      return {
        damage: 0,
        super: gained > 0,
        message: gained > 0
          ? `Proof of Timely filed. +${gained} days back.`
          : 'Proof of Timely filed. (Already at max days.)',
      }
    }

    const tool = TOOLS[toolId]
    if (!tool) {
      this.daysRemaining = Math.max(0, this.daysRemaining - 1)
      return { damage: 0, missed: true, message: 'Unknown tool.' }
    }

    const roll = Phaser.Math.Between(1, 100)
    if (roll > tool.accuracy) {
      this.daysRemaining = Math.max(0, this.daysRemaining - 1)
      return { damage: 0, missed: true, message: `${tool.name} missed!` }
    }

    const isSuper = tool.effectiveFactions.includes(this.encounter.rootCause)
    let damage = tool.damage
    if (isSuper) damage = Math.round(damage * EFFECTIVENESS_BONUS)
    this.hp = Math.max(0, this.hp - damage)
    this.daysRemaining = Math.max(0, this.daysRemaining - 1)

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
    if (this.hp <= 0) {
      // Already won; no enemy turn.
      return { damage: 0, message: '' }
    }
    if (this.daysRemaining <= 0) {
      // Out of time. Don't attack — the controller's isLost() will fire.
      return {
        damage: 0,
        message: 'The deadline passes. The claim ages out.',
      }
    }
    const daysLost = this.maxDays - this.daysRemaining
    const baseDamage = this.encounter.attackDamage
    const damage = Math.max(
      1,
      baseDamage + daysLost * ESCALATION_PER_DAY + Phaser.Math.Between(-2, 2)
    )
    return {
      damage,
      message: daysLost >= 4
        ? `The Reaper's scythe descends harder. -${damage} HP`
        : `The Reaper swings. -${damage} HP`,
    }
  }

  isWon(): boolean {
    return this.hp <= 0
  }

  isLost(): boolean {
    return this.daysRemaining <= 0 && this.hp > 0
  }
}
