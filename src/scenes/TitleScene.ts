import Phaser from 'phaser'
import { CLASSES } from '../content/classes'
import { getDailySeed } from '../store/seed'
import type { ClassId } from '../types'

export class TitleScene extends Phaser.Scene {
  private selectedClass: ClassId = 'rural'

  constructor() {
    super('Title')
  }

  create() {
    const { width, height } = this.scale

    // Title
    this.add.text(width / 2, 60, 'DENIAL DUNGEON', {
      fontSize: '32px',
      fontFamily: 'monospace',
      color: '#7ee2c1',
    }).setOrigin(0.5)

    this.add.text(width / 2, 92, 'a revenue-cycle roguelike', {
      fontSize: '14px',
      fontFamily: 'monospace',
      color: '#8b95a5',
    }).setOrigin(0.5)

    // Daily seed
    this.add.text(width / 2, 120, `Daily Seed: ${getDailySeed()}`, {
      fontSize: '12px',
      fontFamily: 'monospace',
      color: '#f0a868',
    }).setOrigin(0.5)

    // Class selection
    this.add.text(width / 2, 160, 'SELECT YOUR FACILITY', {
      fontSize: '14px',
      fontFamily: 'monospace',
      color: '#e6edf3',
    }).setOrigin(0.5)

    const classIds: ClassId[] = ['rural', 'specialty', 'academic']
    const cardWidth = 220
    const gap = 20
    const totalWidth = classIds.length * cardWidth + (classIds.length - 1) * gap
    const startX = (width - totalWidth) / 2

    classIds.forEach((id, i) => {
      const cls = CLASSES[id]
      const x = startX + i * (cardWidth + gap)
      const y = 190

      const bg = this.add.rectangle(x + cardWidth / 2, y + 80, cardWidth, 160, 0x161b22)
        .setStrokeStyle(1, 0x2a323d)
        .setInteractive({ useHandCursor: true })

      const title = this.add.text(x + 10, y + 10, cls.name, {
        fontSize: '14px',
        fontFamily: 'monospace',
        color: '#e6edf3',
        fontStyle: 'bold',
      })

      const diff = this.add.text(x + cardWidth - 10, y + 10, cls.difficulty, {
        fontSize: '11px',
        fontFamily: 'monospace',
        color: cls.difficulty === 'Easy' ? '#6cd49a' : cls.difficulty === 'Medium' ? '#f0a868' : '#ef5b7b',
      }).setOrigin(1, 0)

      const blurb = this.add.text(x + 10, y + 35, cls.blurb, {
        fontSize: '11px',
        fontFamily: 'monospace',
        color: '#8b95a5',
        wordWrap: { width: cardWidth - 20 },
      })

      const stats = this.add.text(x + 10, y + 100, `HP: ${cls.startingHp}  Abilities: ${cls.startingAbilities.length}`, {
        fontSize: '11px',
        fontFamily: 'monospace',
        color: '#7ee2c1',
      })

      bg.on('pointerdown', () => {
        this.selectedClass = id
        this.highlightSelection(classIds, startX, cardWidth, gap)
      })

      if (id === this.selectedClass) {
        bg.setStrokeStyle(2, 0x7ee2c1)
      }

      // Store reference for highlighting
      bg.setData('classId', id)
      bg.setData('refs', { bg, title, diff, blurb, stats })
    })

    // Controls hint
    this.add.text(width / 2, 400, 'WASD — move  |  SPACE — dash  |  1-4 — abilities  |  Mouse — aim', {
      fontSize: '11px',
      fontFamily: 'monospace',
      color: '#8b95a5',
    }).setOrigin(0.5)

    // Start button
    const startBtn = this.add.text(width / 2, 460, '[ START RUN ]', {
      fontSize: '18px',
      fontFamily: 'monospace',
      color: '#7ee2c1',
      padding: { x: 20, y: 10 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true })

    startBtn.on('pointerover', () => startBtn.setColor('#ffffff'))
    startBtn.on('pointerout', () => startBtn.setColor('#7ee2c1'))
    startBtn.on('pointerdown', () => {
      this.scene.start('Game', {
        classId: this.selectedClass,
        seed: getDailySeed(),
      })
    })

    // Info
    this.add.text(width / 2, 540, 'Navigate 11 phases of the revenue cycle.\nFight denial codes. Learn who really caused them.', {
      fontSize: '11px',
      fontFamily: 'monospace',
      color: '#8b95a5',
      align: 'center',
    }).setOrigin(0.5)

    this.add.text(width / 2, 590, 'Built by Turquoise Health', {
      fontSize: '10px',
      fontFamily: 'monospace',
      color: '#3a4a5d',
    }).setOrigin(0.5)
  }

  private highlightSelection(classIds: ClassId[], startX: number, cardWidth: number, gap: number) {
    this.children.each((child) => {
      if (child instanceof Phaser.GameObjects.Rectangle && child.getData('classId')) {
        const id = child.getData('classId')
        if (id === this.selectedClass) {
          child.setStrokeStyle(2, 0x7ee2c1)
        } else {
          child.setStrokeStyle(1, 0x2a323d)
        }
      }
    })
  }
}
