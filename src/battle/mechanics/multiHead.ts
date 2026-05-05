// MultiHeadController — COB Hydra.
//
// Three heads, three distinct payer-side rootCauses, three HP pools.
// Only the lowest-index undefeated head is "active" — your tool hits
// that head specifically. The other heads stay locked but still swing
// for damage on the enemy turn. Killing in sequence (Primary →
// Secondary → Tertiary) is the whole point: in real COB, you adjudicate
// payers in order, and attacking out of order causes retractions.
//
// Why this teaches: coordination of benefits is fundamentally about
// sequence. Most COB confusion is a payer adjudicating in the wrong
// position. The mechanic is the lesson.

import Phaser from 'phaser'
import type { Encounter, Faction } from '../../types'
import { EFFECTIVENESS_BONUS } from '../../types'
import { TOOLS } from '../../content/abilities'
import { getState } from '../../state'
import type {
  MechanicController,
  PlayerTurnResult,
  EnemyTurnResult,
} from '../types'

interface Head {
  id: string
  name: string
  rootCause: Faction
  hp: number
  maxHp: number
  defeated: boolean
}

function stressAccuracyPenalty(): number {
  const stress = getState().resources.stress
  if (stress >= 75) return 20
  if (stress >= 50) return 10
  return 0
}

export class MultiHeadController implements MechanicController {
  readonly encounter: Encounter
  private heads: Head[]

  constructor(encounter: Encounter) {
    this.encounter = encounter
    // Three heads modeling Primary → Secondary → Tertiary payers.
    // Per-head HP is calibrated so total ≈ encounter.hp.
    const totalHp = encounter.hp
    this.heads = [
      {
        id: 'primary',
        name: 'Primary: BCBS',
        rootCause: 'payer',
        hp: Math.round(totalHp * 0.42),
        maxHp: Math.round(totalHp * 0.42),
        defeated: false,
      },
      {
        id: 'secondary',
        name: 'Secondary: Medicare',
        rootCause: 'system',
        hp: Math.round(totalHp * 0.33),
        maxHp: Math.round(totalHp * 0.33),
        defeated: false,
      },
      {
        id: 'tertiary',
        name: 'Tertiary: Medicaid',
        rootCause: 'employer',
        hp: totalHp - Math.round(totalHp * 0.42) - Math.round(totalHp * 0.33),
        maxHp: totalHp - Math.round(totalHp * 0.42) - Math.round(totalHp * 0.33),
        defeated: false,
      },
    ]
  }

  /** First non-defeated head — the only one tools can target. */
  private activeHead(): Head | null {
    return this.heads.find(h => !h.defeated) ?? null
  }

  hpRatio(): number {
    const total = this.heads.reduce((s, h) => s + h.maxHp, 0)
    const remaining = this.heads.reduce((s, h) => s + h.hp, 0)
    return remaining / total
  }

  hpDisplay() {
    const total = this.heads.reduce((s, h) => s + h.maxHp, 0)
    const remaining = this.heads.reduce((s, h) => s + h.hp, 0)
    return { current: remaining, max: total }
  }

  statusLine(): string {
    return this.heads
      .map(h => h.defeated
        ? `[${h.name}: down]`
        : `[${h.name}: ${h.hp}/${h.maxHp}]`)
      .join('  ')
  }

  panelText(): string { return '' }
  getActions() { return null }

  applyPlayerTurn(toolId: string): PlayerTurnResult {
    const active = this.activeHead()
    if (!active) {
      return { damage: 0, missed: true, message: 'No heads remain.' }
    }

    const tool = TOOLS[toolId]
    if (!tool) return { damage: 0, missed: true, message: 'Unknown tool.' }

    const accuracy = Math.max(10, tool.accuracy - stressAccuracyPenalty())
    const roll = Phaser.Math.Between(1, 100)
    if (roll > accuracy) {
      const reason = stressAccuracyPenalty() > 0 ? ' (stressed)' : ''
      return { damage: 0, missed: true, message: `${tool.name} missed${reason}!` }
    }

    // Super-effective is computed against the ACTIVE head's rootCause,
    // not the encounter's. That's the whole point — different head,
    // different tool answer. Cob_check is super vs employer; medical_policy
    // and prior_auth_278 hit payer; submit_837p generic.
    const isSuper = tool.effectiveFactions.includes(active.rootCause)
    let damage = tool.damage
    if (isSuper) damage = Math.round(damage * EFFECTIVENESS_BONUS)
    active.hp = Math.max(0, active.hp - damage)

    let message = `${active.name} takes ${damage}!`
    if (isSuper) message += '\nSuper effective!'

    if (active.hp <= 0) {
      active.defeated = true
      message += `\n${active.name} drops. Next head incoming.`
    }

    const allDown = this.heads.every(h => h.defeated)
    return {
      damage,
      super: isSuper,
      message,
      ends: allDown,
    }
  }

  applyEnemyTurn(): EnemyTurnResult {
    // All non-defeated heads contribute. Per-head damage is the
    // encounter's base scaled to head count for variety.
    const live = this.heads.filter(h => !h.defeated)
    if (live.length === 0) return { damage: 0, message: '' }
    const perHead = Math.max(1, Math.round(this.encounter.attackDamage * 0.4))
    const damage = perHead * live.length + Phaser.Math.Between(-1, 1)
    return {
      damage: Math.max(0, damage),
      message: live.length === 3
        ? `All three heads strike. -${damage} HP`
        : live.length === 2
        ? `Two heads still in play. -${damage} HP`
        : `${live[0].name} alone. -${damage} HP`,
    }
  }

  isWon(): boolean { return this.heads.every(h => h.defeated) }
  isLost(): boolean { return false }
}
