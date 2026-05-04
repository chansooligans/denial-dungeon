import Phaser from 'phaser'
import { ABILITIES } from '../content/abilities'
import { PHASE_NAMES, FACTION_COLOR } from '../types'
import type { RunState } from '../types'

export class HUDScene extends Phaser.Scene {
  private hpText!: Phaser.GameObjects.Text
  private cashText!: Phaser.GameObjects.Text
  private repText!: Phaser.GameObjects.Text
  private auditText!: Phaser.GameObjects.Text
  private phaseText!: Phaser.GameObjects.Text
  private abilitySlots: Phaser.GameObjects.Container[] = []
  private run!: RunState

  constructor() {
    super('HUD')
  }

  init(data: { run: RunState }) {
    this.run = data.run
  }

  create() {
    const { width } = this.scale

    // Top bar background
    this.add.rectangle(width / 2, 16, width, 32, 0x0e1116, 0.9).setDepth(0)

    // HP
    this.add.image(12, 16, 'heart').setScale(1).setDepth(1)
    this.hpText = this.add.text(26, 8, '', {
      fontSize: '13px', fontFamily: 'monospace', color: '#ef5b7b',
    }).setDepth(1)

    // Cash
    this.cashText = this.add.text(120, 8, '', {
      fontSize: '13px', fontFamily: 'monospace', color: '#6cd49a',
    }).setDepth(1)

    // Reputation
    this.repText = this.add.text(240, 8, '', {
      fontSize: '13px', fontFamily: 'monospace', color: '#f4d06f',
    }).setDepth(1)

    // Audit risk
    this.auditText = this.add.text(380, 8, '', {
      fontSize: '13px', fontFamily: 'monospace', color: '#f0a868',
    }).setDepth(1)

    // Phase
    this.phaseText = this.add.text(width - 10, 8, '', {
      fontSize: '12px', fontFamily: 'monospace', color: '#8b95a5',
    }).setOrigin(1, 0).setDepth(1)

    // Ability bar at bottom
    this.createAbilityBar()

    // Listen for updates from GameScene
    const gameScene = this.scene.get('Game')
    gameScene.events.on('update-run', (run: RunState) => {
      this.run = run
      this.updateDisplay()
    })

    this.updateDisplay()
  }

  private createAbilityBar() {
    const { width, height } = this.scale
    const slotSize = 56
    const gap = 8
    const maxSlots = 4

    const totalWidth = maxSlots * slotSize + (maxSlots - 1) * gap
    const startX = (width - totalWidth) / 2

    // Bar background
    this.add.rectangle(width / 2, height - 40, totalWidth + 20, slotSize + 12, 0x0e1116, 0.9)
      .setDepth(0)

    for (let i = 0; i < maxSlots; i++) {
      const x = startX + i * (slotSize + gap) + slotSize / 2
      const y = height - 40

      const container = this.add.container(x, y)

      // Slot bg
      const bg = this.add.rectangle(0, 0, slotSize, slotSize, 0x161b22)
        .setStrokeStyle(1, 0x2a323d)
      container.add(bg)

      // Key hint
      const key = this.add.text(-slotSize / 2 + 4, -slotSize / 2 + 2, `${i + 1}`, {
        fontSize: '9px', fontFamily: 'monospace', color: '#8b95a5',
      })
      container.add(key)

      // Ability name (will be updated)
      const name = this.add.text(0, 4, '', {
        fontSize: '9px', fontFamily: 'monospace', color: '#e6edf3',
        align: 'center',
        wordWrap: { width: slotSize - 6 },
      }).setOrigin(0.5)
      container.add(name)

      // Cooldown overlay
      const cdOverlay = this.add.rectangle(0, 0, slotSize, slotSize, 0x000000, 0.6).setVisible(false)
      container.add(cdOverlay)

      container.setDepth(1)
      container.setData('name', name)
      container.setData('cdOverlay', cdOverlay)
      container.setData('bg', bg)
      this.abilitySlots.push(container)
    }
  }

  private updateDisplay() {
    if (!this.run) return

    this.hpText.setText(`${this.run.resources.hp}/${this.run.resources.maxHp}`)
    this.cashText.setText(`$${this.run.resources.cash}`)
    this.repText.setText(`Rep: ${this.run.resources.reputation}`)
    this.auditText.setText(`Audit: ${this.run.resources.auditRisk}`)

    const phaseName = PHASE_NAMES[this.run.phase] || ''
    this.phaseText.setText(`Phase ${this.run.phase + 1}: ${phaseName}  Room ${this.run.room + 1}/${this.run.rooms.length}`)

    // Update ability slots
    for (let i = 0; i < 4; i++) {
      const slot = this.abilitySlots[i]
      const abilityId = this.run.abilities[i]
      const nameText = slot.getData('name') as Phaser.GameObjects.Text
      const bg = slot.getData('bg') as Phaser.GameObjects.Rectangle

      if (abilityId) {
        const ability = ABILITIES[abilityId]
        if (ability) {
          nameText.setText(ability.name)
          const color = FACTION_COLOR[ability.faction]
          bg.setStrokeStyle(1, color)
        }
      } else {
        nameText.setText('—')
        bg.setStrokeStyle(1, 0x2a323d)
      }
    }
  }
}
