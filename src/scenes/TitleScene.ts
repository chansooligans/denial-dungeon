import Phaser from 'phaser'
import { newGame } from '../state'
import { addFullscreenButton } from './fullscreenButton'

export class TitleScene extends Phaser.Scene {
  constructor() {
    super('Title')
  }

  create() {
    const { width, height } = this.scale
    addFullscreenButton(this)

    // Floating papers in background
    for (let i = 0; i < 12; i++) {
      const paper = this.add.image(
        Phaser.Math.Between(50, width - 50),
        Phaser.Math.Between(50, height - 50),
        'wr_paper'
      ).setScale(Phaser.Math.FloatBetween(1.5, 3)).setAlpha(0.1)

      this.tweens.add({
        targets: paper,
        y: paper.y - 10,
        x: paper.x + Phaser.Math.Between(-8, 8),
        duration: Phaser.Math.Between(3000, 5000),
        yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
        delay: i * 400,
      })
    }

    // Title
    this.add.text(width / 2, 120, 'DENIAL DUNGEON', {
      fontSize: '32px', fontFamily: 'monospace', color: '#ef5b7b',
      fontStyle: 'bold',
    }).setOrigin(0.5)

    this.add.text(width / 2, 155, 'a revenue cycle RPG', {
      fontSize: '13px', fontFamily: 'monospace', color: '#8b95a5',
    }).setOrigin(0.5)

    // Menu options
    const menuItems = [
      { label: 'NEW GAME', action: () => this.startGame() },
      { label: 'CODEX', action: () => this.openCodex() },
      { label: 'REPLAY INTRO', action: () => this.scene.start('Intro') },
    ]

    menuItems.forEach((item, i) => {
      const y = 260 + i * 55
      const btn = this.add.text(width / 2, y, `[ ${item.label} ]`, {
        fontSize: '16px', fontFamily: 'monospace', color: '#7ee2c1',
      }).setOrigin(0.5).setInteractive({ useHandCursor: true })

      btn.on('pointerover', () => btn.setColor('#ffffff'))
      btn.on('pointerout', () => btn.setColor('#7ee2c1'))
      btn.on('pointerdown', item.action)
    })

    // Flavor text
    this.add.text(width / 2, height - 80, 'Chase a lost claim through The Waiting Room.\nLearn how healthcare billing actually works.', {
      fontSize: '11px', fontFamily: 'monospace', color: '#3a4a5d',
      align: 'center',
    }).setOrigin(0.5)

    this.add.text(width / 2, height - 30, 'An open-source educational game', {
      fontSize: '10px', fontFamily: 'monospace', color: '#2a323d',
    }).setOrigin(0.5)

    // Keyboard nav
    const keys = this.input.keyboard!
    keys.on('keydown-ONE', () => this.startGame())
    keys.on('keydown-TWO', () => this.openCodex())
    keys.on('keydown-THREE', () => this.scene.start('Intro'))
  }

  private startGame() {
    newGame()
    this.scene.start('Hospital')
  }

  private openCodex() {
    this.scene.start('Codex')
  }
}
