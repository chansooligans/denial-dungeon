// MirrorController — Duplicate Claim Doppelgänger.
//
// HP-based fight where the obstacle "remembers" the last tool you used.
// Hitting it with the same tool twice in a row mirrors the move back:
// the action does no damage, the Doppelgänger heals a chunk, and the
// player takes a bonus hit. The whole point is to force tool variety —
// the real-world parallel is a duplicate-claim rejection (CO-18): if
// you keep resubmitting the same thing, the system keeps flagging it.
//
// The thematic teaching: rotate your approach. Don't just resubmit.
// Use 837 frequency-7 replacement, void/replace, or vary the tool —
// not the same submit_837p again and again.

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

/** HP the Doppelgänger heals back when a mirrored move bounces. */
const MIRROR_HEAL = 5
/** Bonus damage the player takes from a mirrored move. */
const MIRROR_KICKBACK = 10

function stressAccuracyPenalty(): number {
  const stress = getState().resources.stress
  if (stress >= 75) return 20
  if (stress >= 50) return 10
  return 0
}

export class MirrorController implements MechanicController {
  readonly encounter: Encounter
  private hp: number
  /** Last tool id the player used. Drives the mirror check. */
  private lastToolId: string | null = null
  /** Pending kickback damage queued for the next enemy turn. */
  private pendingKickback = 0

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
    if (!this.lastToolId) return 'Doppelgänger watches. Rotate your tools.'
    const lastName = TOOLS[this.lastToolId]?.name ?? this.lastToolId
    return `Reflecting: ${lastName}  •  use a different tool next`
  }

  panelText(): string { return '' }

  getActions() { return null }

  applyPlayerTurn(toolId: string): PlayerTurnResult {
    const tool = TOOLS[toolId]
    if (!tool) {
      return { damage: 0, missed: true, message: 'Unknown tool.' }
    }

    // Mirror trip: same tool as last turn. The kickback hits on the
    // upcoming enemy turn so the player feels the mistake immediately.
    if (this.lastToolId === toolId) {
      this.hp = Math.min(this.encounter.hp, this.hp + MIRROR_HEAL)
      this.pendingKickback = MIRROR_KICKBACK
      // lastToolId stays — repeating again will mirror again.
      return {
        damage: 0,
        missed: true,
        message: `The Doppelgänger throws ${tool.name} back at you.\n` +
          `+${MIRROR_HEAL} to its claim, kickback incoming. Rotate.`,
      }
    }

    // Normal damage path with stress-accuracy penalty.
    const accuracy = Math.max(10, tool.accuracy - stressAccuracyPenalty())
    const roll = Phaser.Math.Between(1, 100)
    if (roll > accuracy) {
      this.lastToolId = toolId
      const reason = stressAccuracyPenalty() > 0 ? ' (stressed)' : ''
      return { damage: 0, missed: true, message: `${tool.name} missed${reason}!` }
    }

    const isSuper = tool.effectiveFactions.includes(this.encounter.rootCause)
    let damage = tool.damage
    if (isSuper) damage = Math.round(damage * EFFECTIVENESS_BONUS)
    this.hp = Math.max(0, this.hp - damage)
    this.lastToolId = toolId

    let message = `${tool.name} cuts through the reflection. ${damage} damage!`
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
    const baseDamage = Math.max(0, this.encounter.attackDamage + variance)
    // Mirror kickback rides the next enemy turn after a mirrored move.
    const kickback = this.pendingKickback
    this.pendingKickback = 0
    const total = baseDamage + kickback
    return {
      damage: total,
      message: kickback > 0
        ? `The mirrored move comes back. -${total} HP (incl. ${kickback} kickback).`
        : `The Doppelgänger swings. -${total} HP`,
    }
  }

  isWon(): boolean { return this.hp <= 0 }
  isLost(): boolean { return false }
}
