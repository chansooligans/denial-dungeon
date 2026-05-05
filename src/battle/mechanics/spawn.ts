// SpawnController — Documentation Sprite Swarm.
//
// CO-16 "Missing/invalid information" expressed as a swarm. The Source
// (the chart gap itself) has an HP pool. Every 2 enemy turns it spits
// out a Sprite — a minion personifying one missing-information reject
// from the clearinghouse. Sprites do small damage every enemy turn and
// stack additively. Up to 3 sprites alive concurrently.
//
// Two upstream tools change the fight:
//   - `claim_scrubber` clears every currently-alive Sprite (front-end
//     edits sweep them away) but does not touch the Source.
//   - `cdi_query` patches the chart at the source — no further spawns.
//
// Any other tool damages the Source normally. Win = Source HP at 0.
//
// Why this teaches: most "denials" engineers see are 277CA front-end
// rejects, not real adjudication denials. They keep coming back until
// the *upstream documentation* is fixed — not until each one is fought.
// The mechanic is the lesson: fighting sprites without patching the
// chart is endless work.

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

const MAX_SPRITES = 3
const SPAWN_EVERY = 2 // every 2 enemy turns
const SPRITE_DAMAGE = 3

function stressAccuracyPenalty(): number {
  const stress = getState().resources.stress
  if (stress >= 75) return 20
  if (stress >= 50) return 10
  return 0
}

export class SpawnController implements MechanicController {
  readonly encounter: Encounter
  private hp: number
  private sprites: number = 0
  private enemyTurnCount: number = 0
  private patched: boolean = false

  constructor(encounter: Encounter) {
    this.encounter = encounter
    this.hp = encounter.hp
    // Start with one sprite already on the field, so the player sees
    // the mechanic in action before the first spawn.
    this.sprites = 1
  }

  hpRatio(): number {
    return this.hp / this.encounter.hp
  }

  hpDisplay() {
    return { current: this.hp, max: this.encounter.hp }
  }

  statusLine(): string {
    const swarm = this.sprites > 0
      ? `Sprites in swarm: ${this.sprites}/${MAX_SPRITES}`
      : 'Sprites in swarm: none'
    const chart = this.patched ? 'Chart: patched' : 'Chart: leaking'
    return `${swarm}  •  ${chart}`
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

    // claim_scrubber sweeps the swarm — no boss damage but kills sprites.
    if (toolId === 'claim_scrubber' && this.sprites > 0) {
      const cleared = this.sprites
      this.sprites = 0
      return {
        damage: 0,
        message: `Claim Scrubber sweeps the swarm.\n${cleared} sprite${cleared === 1 ? '' : 's'} cleared.`,
      }
    }

    // cdi_query patches the chart at the source — stops future spawns.
    // Also lands a small chip of damage on the Source.
    if (toolId === 'cdi_query' && !this.patched) {
      this.patched = true
      const damage = Math.round(tool.damage * 0.5)
      this.hp = Math.max(0, this.hp - damage)
      return {
        damage,
        super: true,
        message: `CDI Query patches the chart.\nNo more sprites will spawn.\n-${damage} to the Source.`,
        ends: this.hp <= 0,
      }
    }

    // Normal attack against the Source.
    const isSuper = tool.effectiveFactions.includes(this.encounter.rootCause)
    let damage = tool.damage
    if (isSuper) damage = Math.round(damage * EFFECTIVENESS_BONUS)
    this.hp = Math.max(0, this.hp - damage)

    let message = `${tool.name} hits the Source for ${damage}.`
    if (isSuper) message += '\nSuper effective!'

    return {
      damage,
      super: isSuper,
      message,
      ends: this.hp <= 0,
    }
  }

  applyEnemyTurn(): EnemyTurnResult {
    this.enemyTurnCount += 1

    // Spawn step: every SPAWN_EVERY turns, add one sprite (cap at MAX).
    let spawnedMsg = ''
    if (
      !this.patched &&
      this.enemyTurnCount % SPAWN_EVERY === 0 &&
      this.sprites < MAX_SPRITES
    ) {
      this.sprites += 1
      spawnedMsg = `\nA new sprite peels off the chart. (${this.sprites}/${MAX_SPRITES})`
    }

    // Damage = base + per-sprite contribution.
    const variance = Phaser.Math.Between(-1, 1)
    const baseDamage = Math.max(0, this.encounter.attackDamage + variance)
    const swarmDamage = this.sprites * SPRITE_DAMAGE
    const damage = baseDamage + swarmDamage

    let message = `The Source pulses. -${baseDamage} HP`
    if (this.sprites > 0) {
      message += `\nSwarm pile-on: -${swarmDamage} HP (${this.sprites} sprite${this.sprites === 1 ? '' : 's'})`
    }
    message += spawnedMsg

    return { damage, message }
  }

  isWon(): boolean { return this.hp <= 0 }
  isLost(): boolean { return false }
}
