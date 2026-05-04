import Phaser from 'phaser'
import { ABILITIES, ABILITY_LIST } from '../content/abilities'
import { FACTION_COLOR } from '../types'
import type { RunState, Ability } from '../types'

export class BoonScene extends Phaser.Scene {
  private run!: RunState
  private onComplete!: () => void

  constructor() {
    super('Boon')
  }

  init(data: { run: RunState; onComplete: () => void }) {
    this.run = data.run
    this.onComplete = data.onComplete
  }

  create() {
    const { width, height } = this.scale

    // Darken background
    this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.7)

    this.add.text(width / 2, 60, 'CHOOSE AN UPGRADE', {
      fontSize: '18px',
      fontFamily: 'monospace',
      color: '#7ee2c1',
    }).setOrigin(0.5)

    this.add.text(width / 2, 85, 'New ability or heal', {
      fontSize: '12px',
      fontFamily: 'monospace',
      color: '#8b95a5',
    }).setOrigin(0.5)

    // Pick 3 random abilities not already owned
    const available = ABILITY_LIST.filter(a => !this.run.abilities.includes(a.id) && !a.shadow)
    const choices: Ability[] = []
    const shuffled = [...available].sort(() => Math.random() - 0.5)
    for (let i = 0; i < Math.min(3, shuffled.length); i++) {
      choices.push(shuffled[i])
    }

    const cardWidth = 200
    const gap = 20
    const totalWidth = choices.length * cardWidth + (choices.length - 1) * gap
    const startX = (width - totalWidth) / 2

    choices.forEach((ability, i) => {
      const x = startX + i * (cardWidth + gap) + cardWidth / 2
      const y = height / 2 - 30

      const color = FACTION_COLOR[ability.faction]
      const colorStr = '#' + color.toString(16).padStart(6, '0')

      const card = this.add.rectangle(x, y, cardWidth, 220, 0x161b22)
        .setStrokeStyle(2, color)
        .setInteractive({ useHandCursor: true })

      this.add.text(x, y - 80, ability.name, {
        fontSize: '13px', fontFamily: 'monospace', color: '#e6edf3', fontStyle: 'bold',
      }).setOrigin(0.5)

      this.add.text(x, y - 55, ability.faction.toUpperCase(), {
        fontSize: '10px', fontFamily: 'monospace', color: colorStr,
      }).setOrigin(0.5)

      this.add.text(x, y - 30, `DMG: ${ability.damage}  CD: ${ability.cooldown}ms`, {
        fontSize: '11px', fontFamily: 'monospace', color: '#8b95a5',
      }).setOrigin(0.5)

      this.add.text(x, y, ability.effect, {
        fontSize: '10px', fontFamily: 'monospace', color: '#e6edf3',
        wordWrap: { width: cardWidth - 20 }, align: 'center',
      }).setOrigin(0.5)

      if (ability.blocksFactions && ability.blocksFactions.length > 0) {
        this.add.text(x, y + 35, `Strong vs: ${ability.blocksFactions.join(', ')}`, {
          fontSize: '10px', fontFamily: 'monospace', color: '#7ee2c1',
        }).setOrigin(0.5)
      }

      this.add.text(x, y + 60, ability.teaches, {
        fontSize: '9px', fontFamily: 'monospace', color: '#f0a868',
        wordWrap: { width: cardWidth - 20 }, align: 'center', fontStyle: 'italic',
      }).setOrigin(0.5)

      card.on('pointerover', () => card.setStrokeStyle(2, 0x7ee2c1))
      card.on('pointerout', () => card.setStrokeStyle(2, color))
      card.on('pointerdown', () => {
        // Replace weakest or add to slot
        if (this.run.abilities.length < 4) {
          this.run.abilities.push(ability.id)
        } else {
          // Replace first non-starter with lowest damage
          let replaceIdx = 0
          let lowestDmg = Infinity
          for (let j = 0; j < this.run.abilities.length; j++) {
            const a = ABILITIES[this.run.abilities[j]]
            if (a && a.damage < lowestDmg) {
              lowestDmg = a.damage
              replaceIdx = j
            }
          }
          this.run.abilities[replaceIdx] = ability.id
        }
        this.close()
      })
    })

    // Heal option
    const healBtn = this.add.text(width / 2, height - 100, '[ HEAL +20 HP instead ]', {
      fontSize: '13px', fontFamily: 'monospace', color: '#ef5b7b',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true })

    healBtn.on('pointerover', () => healBtn.setColor('#ffffff'))
    healBtn.on('pointerout', () => healBtn.setColor('#ef5b7b'))
    healBtn.on('pointerdown', () => {
      this.run.resources.hp = Math.min(this.run.resources.hp + 20, this.run.resources.maxHp)
      this.close()
    })

    // Skip option
    const skipBtn = this.add.text(width / 2, height - 70, '[ SKIP ]', {
      fontSize: '12px', fontFamily: 'monospace', color: '#8b95a5',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true })

    skipBtn.on('pointerdown', () => this.close())
  }

  private close() {
    this.scene.stop()
    this.onComplete()
  }
}
