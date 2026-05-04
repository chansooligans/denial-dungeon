import Phaser from 'phaser'
import { TOOLS } from '../content/abilities'
import { ENCOUNTERS } from '../content/enemies'
import { getState, updateResources, unlockCodex, saveGame } from '../state'
import type { Encounter, Tool } from '../types'
import { EFFECTIVENESS_BONUS, FACTION_COLOR } from '../types'

interface BattleState {
  encounter: Encounter
  encounterHp: number
  playerHp: number
  playerMaxHp: number
  playerTools: string[]
  turn: 'player' | 'enemy' | 'animating' | 'done'
  turnCount: number
}

export class BattleScene extends Phaser.Scene {
  private state!: BattleState
  private encounterNameText!: Phaser.GameObjects.Text
  private encounterDescText!: Phaser.GameObjects.Text
  private encounterHpBar!: Phaser.GameObjects.Graphics
  private encounterHpText!: Phaser.GameObjects.Text
  private playerHpBar!: Phaser.GameObjects.Graphics
  private playerHpText!: Phaser.GameObjects.Text
  private messageText!: Phaser.GameObjects.Text
  private toolButtons: Phaser.GameObjects.Container[] = []
  private factionBadge!: Phaser.GameObjects.Text

  constructor() {
    super('Battle')
  }

  init(data: { encounterId?: string; playerHp?: number; playerMaxHp?: number; playerTools?: string[] }) {
    const encounterId = data.encounterId || 'co_109'
    const encounter = ENCOUNTERS[encounterId]
    if (!encounter) throw new Error(`Unknown encounter: ${encounterId}`)

    const gameState = getState()

    this.state = {
      encounter,
      encounterHp: encounter.hp,
      playerHp: data.playerHp ?? gameState.resources.hp,
      playerMaxHp: data.playerMaxHp ?? gameState.resources.maxHp,
      playerTools: data.playerTools ?? gameState.tools,
      turn: 'player',
      turnCount: 0,
    }
  }

  create() {
    const { width, height } = this.scale

    this.cameras.main.setBackgroundColor(0x0e1116)

    this.buildEncounterPanel(width)
    this.buildPlayerPanel(width, height)
    this.buildMessageArea(width, height)
    this.buildToolMenu(width, height)

    this.showMessage(this.state.encounter.surfaceSymptom)
  }

  private buildEncounterPanel(width: number) {
    // Encounter info — top area
    const enc = this.state.encounter

    this.encounterNameText = this.add.text(width / 2, 40, enc.title, {
      fontSize: '18px', fontFamily: 'monospace', color: '#ffffff', fontStyle: 'bold',
    }).setOrigin(0.5)

    this.factionBadge = this.add.text(width / 2, 65, `Root cause: ${enc.rootCause}`, {
      fontSize: '11px', fontFamily: 'monospace',
      color: '#' + FACTION_COLOR[enc.rootCause].toString(16).padStart(6, '0'),
    }).setOrigin(0.5)

    // HP bar background
    this.add.rectangle(width / 2, 95, 300, 16, 0x1f262f).setOrigin(0.5)
    this.add.rectangle(width / 2, 95, 300, 16).setOrigin(0.5).setStrokeStyle(1, 0x2a323d)

    this.encounterHpBar = this.add.graphics()
    this.drawEncounterHp()

    this.encounterHpText = this.add.text(width / 2, 95, `${this.state.encounterHp} / ${this.state.encounter.hp}`, {
      fontSize: '10px', fontFamily: 'monospace', color: '#ffffff',
    }).setOrigin(0.5)

    this.encounterDescText = this.add.text(width / 2, 120, enc.description, {
      fontSize: '11px', fontFamily: 'monospace', color: '#8b95a5',
      wordWrap: { width: 500 }, align: 'center',
    }).setOrigin(0.5, 0)
  }

  private buildPlayerPanel(width: number, height: number) {
    // Player HP — bottom left
    const px = 80
    const py = height - 150

    this.add.text(px, py - 20, 'ANALYST', {
      fontSize: '11px', fontFamily: 'monospace', color: '#7ee2c1', fontStyle: 'bold',
    }).setOrigin(0.5)

    this.add.rectangle(px, py + 5, 120, 12, 0x1f262f).setOrigin(0.5)
    this.add.rectangle(px, py + 5, 120, 12).setOrigin(0.5).setStrokeStyle(1, 0x2a323d)

    this.playerHpBar = this.add.graphics()
    this.drawPlayerHp()

    this.playerHpText = this.add.text(px, py + 5, `${this.state.playerHp} / ${this.state.playerMaxHp}`, {
      fontSize: '9px', fontFamily: 'monospace', color: '#ffffff',
    }).setOrigin(0.5)

    this.add.image(px - 65, py + 5, 'ui_heart').setScale(1.2)
  }

  private buildMessageArea(width: number, height: number) {
    // Message log — center area
    this.messageText = this.add.text(width / 2, height / 2 - 20, '', {
      fontSize: '13px', fontFamily: 'monospace', color: '#d0d8e0',
      wordWrap: { width: 600 }, align: 'center',
    }).setOrigin(0.5)
  }

  private buildToolMenu(width: number, height: number) {
    const tools = this.state.playerTools.map(id => TOOLS[id]).filter(Boolean)
    const startX = width / 2 - ((tools.length - 1) * 100)
    const y = height - 55

    tools.forEach((tool, i) => {
      const x = startX + i * 200
      const container = this.add.container(x, y)

      const bg = this.add.image(0, 0, 'ui_action_btn').setInteractive({ useHandCursor: true })
      const label = this.add.text(0, -6, tool.name, {
        fontSize: '11px', fontFamily: 'monospace', color: '#7ee2c1',
      }).setOrigin(0.5)
      const sub = this.add.text(0, 10, `DMG:${tool.damage} ACC:${tool.accuracy}%`, {
        fontSize: '9px', fontFamily: 'monospace', color: '#5a6a7a',
      }).setOrigin(0.5)

      container.add([bg, label, sub])

      bg.on('pointerover', () => {
        bg.setTexture('ui_action_btn_hover')
        label.setColor('#ffffff')
      })
      bg.on('pointerout', () => {
        bg.setTexture('ui_action_btn')
        label.setColor('#7ee2c1')
      })
      bg.on('pointerdown', () => this.useToolAction(tool))

      this.toolButtons.push(container)
    })

    // Keyboard shortcuts
    const keys = this.input.keyboard!
    tools.forEach((tool, i) => {
      keys.on(`keydown-${i + 1}`, () => {
        if (this.state.turn === 'player') this.useToolAction(tool)
      })
    })
  }

  private useToolAction(tool: Tool) {
    if (this.state.turn !== 'player') return
    this.state.turn = 'animating'
    this.setToolButtonsVisible(false)

    // Accuracy check
    const roll = Phaser.Math.Between(1, 100)
    if (roll > tool.accuracy) {
      this.showMessage(`${tool.name} missed!`)
      this.time.delayedCall(1000, () => this.enemyTurn())
      return
    }

    // Calculate damage
    let damage = tool.damage
    const isEffective = tool.effectiveFactions.includes(this.state.encounter.rootCause)
    if (isEffective) {
      damage = Math.round(damage * EFFECTIVENESS_BONUS)
    }

    this.state.encounterHp = Math.max(0, this.state.encounterHp - damage)
    this.drawEncounterHp()
    this.encounterHpText.setText(`${this.state.encounterHp} / ${this.state.encounter.hp}`)

    // Flash the HP bar
    this.cameras.main.flash(100, 255, 255, 255, false, (_: any, progress: number) => {
      if (progress === 1) this.cameras.main.resetFX()
    })

    let msg = `${tool.name} deals ${damage} damage!`
    if (isEffective) msg += '\nSuper effective!'

    this.showMessage(msg)

    // Check win
    if (this.state.encounterHp <= 0) {
      this.time.delayedCall(1200, () => this.victory())
      return
    }

    this.time.delayedCall(1200, () => this.enemyTurn())
  }

  private enemyTurn() {
    this.state.turn = 'animating'
    const enc = this.state.encounter
    const damage = enc.attackDamage + Phaser.Math.Between(-2, 2)

    this.state.playerHp = Math.max(0, this.state.playerHp - damage)
    this.drawPlayerHp()
    this.playerHpText.setText(`${this.state.playerHp} / ${this.state.playerMaxHp}`)

    this.showMessage(`The claim fights back! -${damage} HP`)

    // Shake effect
    this.cameras.main.shake(200, 0.005)

    if (this.state.playerHp <= 0) {
      this.time.delayedCall(1200, () => this.defeat())
      return
    }

    this.time.delayedCall(1200, () => {
      this.state.turn = 'player'
      this.state.turnCount++
      this.setToolButtonsVisible(true)
      this.showMessage('Choose your action.')
    })
  }

  private victory() {
    this.state.turn = 'done'
    const enc = this.state.encounter

    this.toolButtons.forEach(c => c.setVisible(false))
    this.messageText.setVisible(false)

    const { width, height } = this.scale

    this.add.rectangle(width / 2, height / 2, width, height, 0x0e1116, 0.85)

    this.add.text(width / 2, 160, 'RESOLVED', {
      fontSize: '24px', fontFamily: 'monospace', color: '#7ee2c1', fontStyle: 'bold',
    }).setOrigin(0.5)

    // Reveal CARC code — the learning moment
    this.add.text(width / 2, 210, `CARC: ${enc.carcCode}`, {
      fontSize: '16px', fontFamily: 'monospace', color: '#ef5b7b',
    }).setOrigin(0.5)

    this.add.text(width / 2, 235, enc.carcName, {
      fontSize: '12px', fontFamily: 'monospace', color: '#ffffff',
    }).setOrigin(0.5)

    // Watchpoint — the real takeaway
    this.add.text(width / 2, 280, `"${enc.watchpoint}"`, {
      fontSize: '12px', fontFamily: 'monospace', color: '#f4d06f',
      fontStyle: 'italic', wordWrap: { width: 500 }, align: 'center',
    }).setOrigin(0.5)

    // Correct tools reveal
    const correctNames = enc.correctTools.map(id => TOOLS[id]?.name || id).join(', ')
    this.add.text(width / 2, 330, `Best tools: ${correctNames}`, {
      fontSize: '11px', fontFamily: 'monospace', color: '#8b95a5',
    }).setOrigin(0.5)

    // Turn count
    this.add.text(width / 2, 360, `Resolved in ${this.state.turnCount + 1} turns`, {
      fontSize: '10px', fontFamily: 'monospace', color: '#5a6a7a',
    }).setOrigin(0.5)

    // Continue button
    const btn = this.add.text(width / 2, 430, '[ CONTINUE ]', {
      fontSize: '14px', fontFamily: 'monospace', color: '#7ee2c1',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true })

    btn.on('pointerover', () => btn.setColor('#ffffff'))
    btn.on('pointerout', () => btn.setColor('#7ee2c1'))
    btn.on('pointerdown', () => this.exitBattle(true))

    this.input.keyboard!.on('keydown-SPACE', () => this.exitBattle(true))
  }

  private defeat() {
    this.state.turn = 'done'
    this.toolButtons.forEach(c => c.setVisible(false))
    this.messageText.setVisible(false)

    const { width, height } = this.scale

    this.add.rectangle(width / 2, height / 2, width, height, 0x0e1116, 0.85)

    this.add.text(width / 2, height / 2 - 60, 'CLAIM LOST', {
      fontSize: '24px', fontFamily: 'monospace', color: '#ef5b7b', fontStyle: 'bold',
    }).setOrigin(0.5)

    this.add.text(width / 2, height / 2 - 20, 'The denial stands. The patient gets a surprise bill.', {
      fontSize: '12px', fontFamily: 'monospace', color: '#8b95a5',
      wordWrap: { width: 400 }, align: 'center',
    }).setOrigin(0.5)

    const retryBtn = this.add.text(width / 2, height / 2 + 40, '[ RETRY ]', {
      fontSize: '14px', fontFamily: 'monospace', color: '#f4d06f',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true })

    retryBtn.on('pointerover', () => retryBtn.setColor('#ffffff'))
    retryBtn.on('pointerout', () => retryBtn.setColor('#f4d06f'))
    retryBtn.on('pointerdown', () => {
      this.scene.restart({
        encounterId: this.state.encounter.id,
        playerHp: this.state.playerMaxHp,
        playerMaxHp: this.state.playerMaxHp,
        playerTools: this.state.playerTools,
      })
    })

    const exitBtn = this.add.text(width / 2, height / 2 + 80, '[ BACK TO TITLE ]', {
      fontSize: '12px', fontFamily: 'monospace', color: '#5a6a7a',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true })

    exitBtn.on('pointerover', () => exitBtn.setColor('#ffffff'))
    exitBtn.on('pointerout', () => exitBtn.setColor('#5a6a7a'))
    exitBtn.on('pointerdown', () => this.scene.start('Title'))
  }

  private exitBattle(won: boolean) {
    updateResources({ hp: this.state.playerHp - getState().resources.hp })
    unlockCodex(this.state.encounter.id)
    saveGame()
    this.scene.start('Hospital')
  }

  private showMessage(text: string) {
    this.messageText.setText(text)
    this.messageText.setAlpha(0)
    this.tweens.add({
      targets: this.messageText,
      alpha: 1,
      duration: 200,
    })
  }

  private setToolButtonsVisible(visible: boolean) {
    this.toolButtons.forEach(c => {
      c.setVisible(visible)
      c.setAlpha(visible ? 1 : 0.3)
    })
  }

  private drawEncounterHp() {
    const { width } = this.scale
    const barWidth = 300
    const barHeight = 16
    const x = width / 2 - barWidth / 2
    const y = 95 - barHeight / 2
    const ratio = this.state.encounterHp / this.state.encounter.hp

    this.encounterHpBar.clear()
    const color = ratio > 0.5 ? 0x6cd49a : ratio > 0.25 ? 0xf4d06f : 0xef5b7b
    this.encounterHpBar.fillStyle(color)
    this.encounterHpBar.fillRect(x, y, barWidth * ratio, barHeight)
  }

  private drawPlayerHp() {
    const px = 80
    const py = this.scale.height - 145
    const barWidth = 120
    const barHeight = 12
    const x = px - barWidth / 2
    const y = py - barHeight / 2
    const ratio = this.state.playerHp / this.state.playerMaxHp

    this.playerHpBar.clear()
    const color = ratio > 0.5 ? 0x6cd49a : ratio > 0.25 ? 0xf4d06f : 0xef5b7b
    this.playerHpBar.fillStyle(color)
    this.playerHpBar.fillRect(x, y, barWidth * ratio, barHeight)
  }
}
