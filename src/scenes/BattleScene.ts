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

const PORTRAIT_KEY: Record<string, string> = {
  payer: 'enc_payer',
  provider: 'enc_provider',
  vendor: 'enc_vendor',
  patient: 'enc_patient',
  employer: 'enc_system',
  system: 'enc_system',
}

export class BattleScene extends Phaser.Scene {
  private state!: BattleState
  private encounterNameText!: Phaser.GameObjects.Text
  private encounterHpBar!: Phaser.GameObjects.Graphics
  private encounterHpText!: Phaser.GameObjects.Text
  private playerHpBar!: Phaser.GameObjects.Graphics
  private playerHpText!: Phaser.GameObjects.Text
  private messageText!: Phaser.GameObjects.Text
  private toolButtons: Phaser.GameObjects.Container[] = []
  private portrait!: Phaser.GameObjects.Image
  private turnIndicator!: Phaser.GameObjects.Text
  private encounterHpRatio = 1
  private playerHpRatio = 1

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
    this.encounterHpRatio = 1
    this.playerHpRatio = 1
    this.toolButtons = []
  }

  create() {
    const { width, height } = this.scale
    this.cameras.main.setBackgroundColor(0x0e1116)

    this.buildEncounterPanel(width)
    this.buildPlayerPanel(width, height)
    this.buildMessageArea(width, height)
    this.buildToolMenu(width, height)

    this.turnIndicator = this.add.text(width / 2, height / 2 + 30, '', {
      fontSize: '10px', fontFamily: 'monospace', color: '#5a6a7a',
    }).setOrigin(0.5)

    this.showMessage(this.state.encounter.surfaceSymptom)
    this.setTurnIndicator()
  }

  private buildEncounterPanel(width: number) {
    const enc = this.state.encounter
    const panelY = 20

    // Portrait
    const portraitKey = PORTRAIT_KEY[enc.rootCause] || 'enc_system'
    this.portrait = this.add.image(width / 2, panelY + 50, portraitKey).setScale(2)

    // Encounter name
    this.encounterNameText = this.add.text(width / 2, panelY + 100, enc.title, {
      fontSize: '18px', fontFamily: 'monospace', color: '#ffffff', fontStyle: 'bold',
    }).setOrigin(0.5)

    // Faction badge
    const factionColor = '#' + FACTION_COLOR[enc.rootCause].toString(16).padStart(6, '0')
    this.add.text(width / 2, panelY + 120, `Root cause: ${enc.rootCause}`, {
      fontSize: '11px', fontFamily: 'monospace', color: factionColor,
    }).setOrigin(0.5)

    // HP bar
    const barX = width / 2 - 150
    const barY = panelY + 140
    this.add.rectangle(width / 2, barY + 8, 300, 14, 0x1f262f).setOrigin(0.5)
    this.add.rectangle(width / 2, barY + 8, 300, 14).setOrigin(0.5).setStrokeStyle(1, 0x2a323d)

    this.encounterHpBar = this.add.graphics()
    this.drawEncounterHp()

    this.encounterHpText = this.add.text(width / 2, barY + 8, `${this.state.encounterHp} / ${this.state.encounter.hp}`, {
      fontSize: '10px', fontFamily: 'monospace', color: '#ffffff',
    }).setOrigin(0.5)

    // Description
    this.add.text(width / 2, barY + 30, enc.description, {
      fontSize: '11px', fontFamily: 'monospace', color: '#8b95a5',
      wordWrap: { width: 500 }, align: 'center',
    }).setOrigin(0.5, 0)
  }

  private buildPlayerPanel(width: number, height: number) {
    const px = 90
    const py = height - 140

    this.add.text(px, py - 16, 'ANALYST', {
      fontSize: '11px', fontFamily: 'monospace', color: '#7ee2c1', fontStyle: 'bold',
    }).setOrigin(0.5)

    this.add.rectangle(px, py + 6, 130, 12, 0x1f262f).setOrigin(0.5)
    this.add.rectangle(px, py + 6, 130, 12).setOrigin(0.5).setStrokeStyle(1, 0x2a323d)

    this.playerHpBar = this.add.graphics()
    this.drawPlayerHp()

    this.playerHpText = this.add.text(px, py + 6, `${this.state.playerHp} / ${this.state.playerMaxHp}`, {
      fontSize: '9px', fontFamily: 'monospace', color: '#ffffff',
    }).setOrigin(0.5)

    this.add.image(px - 72, py + 6, 'ui_heart').setScale(1.2)
  }

  private buildMessageArea(width: number, height: number) {
    this.messageText = this.add.text(width / 2, height / 2 - 10, '', {
      fontSize: '13px', fontFamily: 'monospace', color: '#d0d8e0',
      wordWrap: { width: 600 }, align: 'center',
    }).setOrigin(0.5)
  }

  private buildToolMenu(width: number, height: number) {
    const tools = this.state.playerTools.map(id => TOOLS[id]).filter(Boolean)
    const cols = Math.min(tools.length, 4)
    const rows = Math.ceil(tools.length / cols)
    const btnW = 160
    const btnH = 36
    const gap = 8
    const startX = width / 2 - ((cols - 1) * (btnW + gap)) / 2
    const startY = height - 20 - rows * (btnH + gap)

    tools.forEach((tool, i) => {
      const col = i % cols
      const row = Math.floor(i / cols)
      const x = startX + col * (btnW + gap)
      const y = startY + row * (btnH + gap)
      const container = this.add.container(x, y)

      const bg = this.add.image(0, 0, 'ui_action_btn').setDisplaySize(btnW, btnH).setInteractive({ useHandCursor: true })
      const numLabel = this.add.text(-btnW / 2 + 10, -6, `${i + 1}`, {
        fontSize: '9px', fontFamily: 'monospace', color: '#5a6a7a',
      }).setOrigin(0, 0.5)
      const label = this.add.text(4, -6, tool.name, {
        fontSize: '11px', fontFamily: 'monospace', color: '#7ee2c1',
      }).setOrigin(0.5)
      const sub = this.add.text(4, 8, `DMG:${tool.damage} ACC:${tool.accuracy}%`, {
        fontSize: '8px', fontFamily: 'monospace', color: '#5a6a7a',
      }).setOrigin(0.5)

      container.add([bg, numLabel, label, sub])

      bg.on('pointerover', () => { bg.setTexture('ui_action_btn_hover'); label.setColor('#ffffff') })
      bg.on('pointerout', () => { bg.setTexture('ui_action_btn'); label.setColor('#7ee2c1') })
      bg.on('pointerdown', () => this.useToolAction(tool))

      this.toolButtons.push(container)
    })

    // Flee button
    const fleeX = width - 80
    const fleeY = height - 30
    const fleeBtn = this.add.text(fleeX, fleeY, '[ FLEE ]', {
      fontSize: '11px', fontFamily: 'monospace', color: '#5a6a7a',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true })
    fleeBtn.on('pointerover', () => fleeBtn.setColor('#f4d06f'))
    fleeBtn.on('pointerout', () => fleeBtn.setColor('#5a6a7a'))
    fleeBtn.on('pointerdown', () => this.tryFlee())
    const fleeContainer = this.add.container(0, 0, [fleeBtn])
    this.toolButtons.push(fleeContainer)

    // Keyboard shortcuts
    const keys = this.input.keyboard!
    tools.forEach((tool, i) => {
      keys.on(`keydown-${i + 1}`, () => {
        if (this.state.turn === 'player') this.useToolAction(tool)
      })
    })
    keys.on('keydown-ESC', () => {
      if (this.state.turn === 'player') this.tryFlee()
    })
  }

  private tryFlee() {
    if (this.state.turn !== 'player') return
    this.state.turn = 'animating'
    this.setToolButtonsVisible(false)

    const success = Phaser.Math.Between(1, 100) <= 40
    if (success) {
      this.showMessage('You fled the encounter!')
      this.time.delayedCall(1000, () => this.exitBattle(false))
    } else {
      this.showMessage('Failed to flee!')
      this.time.delayedCall(1000, () => this.enemyTurn())
    }
  }

  private useToolAction(tool: Tool) {
    if (this.state.turn !== 'player') return
    this.state.turn = 'animating'
    this.setToolButtonsVisible(false)

    const roll = Phaser.Math.Between(1, 100)
    if (roll > tool.accuracy) {
      this.showMessage(`${tool.name} missed!`)
      this.time.delayedCall(1000, () => this.enemyTurn())
      return
    }

    let damage = tool.damage
    const isEffective = tool.effectiveFactions.includes(this.state.encounter.rootCause)
    if (isEffective) {
      damage = Math.round(damage * EFFECTIVENESS_BONUS)
    }

    this.state.encounterHp = Math.max(0, this.state.encounterHp - damage)
    this.animateEncounterHp()
    this.encounterHpText.setText(`${this.state.encounterHp} / ${this.state.encounter.hp}`)

    // Portrait hit flash
    this.tweens.add({
      targets: this.portrait,
      alpha: 0.3,
      duration: 80,
      yoyo: true,
      repeat: 2,
    })

    // Floating damage number
    this.spawnDamageNumber(this.portrait.x, this.portrait.y - 40, damage, isEffective)

    // Screen flash scaled to damage
    const intensity = Math.min(damage / this.state.encounter.hp, 0.3)
    this.cameras.main.flash(80, 255, 255, 255, false, undefined, intensity)

    let msg = `${tool.name} deals ${damage} damage!`
    if (isEffective) msg += '\nSuper effective!'
    this.showMessage(msg)

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
    this.animatePlayerHp()
    this.playerHpText.setText(`${this.state.playerHp} / ${this.state.playerMaxHp}`)

    this.showMessage(`The claim fights back! -${damage} HP`)

    // Damage number on player side
    this.spawnDamageNumber(90, this.scale.height - 160, damage, false, 0xef5b7b)

    // Shake scaled to damage
    const shakeIntensity = 0.003 + (damage / this.state.playerMaxHp) * 0.01
    this.cameras.main.shake(250, shakeIntensity)

    if (this.state.playerHp <= 0) {
      this.time.delayedCall(1200, () => this.defeat())
      return
    }

    this.time.delayedCall(1200, () => {
      this.state.turn = 'player'
      this.state.turnCount++
      this.setToolButtonsVisible(true)
      this.setTurnIndicator()
      this.showMessage('Choose your action.')
    })
  }

  private spawnDamageNumber(x: number, y: number, damage: number, isSuper: boolean, color?: number) {
    const col = color ? '#' + color.toString(16).padStart(6, '0') :
      isSuper ? '#f4d06f' : '#ffffff'
    const text = isSuper ? `-${damage}!` : `-${damage}`
    const dmgText = this.add.text(x, y, text, {
      fontSize: isSuper ? '18px' : '14px',
      fontFamily: 'monospace',
      color: col,
      fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(50)

    this.tweens.add({
      targets: dmgText,
      y: y - 40,
      alpha: 0,
      duration: 1000,
      ease: 'Power2',
      onComplete: () => dmgText.destroy(),
    })
  }

  private victory() {
    this.state.turn = 'done'
    const enc = this.state.encounter

    this.toolButtons.forEach(c => c.setVisible(false))
    this.messageText.setVisible(false)
    this.turnIndicator.setVisible(false)

    const { width, height } = this.scale

    // Overlay
    const overlay = this.add.rectangle(width / 2, height / 2, width, height, 0x0e1116, 0)
    this.tweens.add({ targets: overlay, fillAlpha: 0.85, duration: 400 })

    // Portrait scales up
    this.tweens.add({
      targets: this.portrait,
      scaleX: 1.5,
      scaleY: 1.5,
      alpha: 0.3,
      duration: 600,
      ease: 'Power2',
    })

    this.time.delayedCall(400, () => {
      const resolved = this.add.text(width / 2, 60, 'RESOLVED', {
        fontSize: '28px', fontFamily: 'monospace', color: '#7ee2c1', fontStyle: 'bold',
      }).setOrigin(0.5).setAlpha(0)
      this.tweens.add({ targets: resolved, alpha: 1, duration: 300 })

      // CARC code reveal
      this.add.text(width / 2, 110, `CARC: ${enc.carcCode}`, {
        fontSize: '16px', fontFamily: 'monospace', color: '#ef5b7b',
      }).setOrigin(0.5)

      this.add.text(width / 2, 135, enc.carcName, {
        fontSize: '12px', fontFamily: 'monospace', color: '#ffffff',
      }).setOrigin(0.5)

      // Watchpoint
      this.add.text(width / 2, 180, `"${enc.watchpoint}"`, {
        fontSize: '12px', fontFamily: 'monospace', color: '#f4d06f',
        fontStyle: 'italic', wordWrap: { width: 500 }, align: 'center',
      }).setOrigin(0.5)

      // Best tools
      const correctNames = enc.correctTools.map(id => TOOLS[id]?.name || id).join(', ')
      this.add.text(width / 2, 230, `Best tools: ${correctNames}`, {
        fontSize: '11px', fontFamily: 'monospace', color: '#8b95a5',
      }).setOrigin(0.5)

      // Turn count + rating
      const turns = this.state.turnCount + 1
      const stars = turns <= 2 ? 3 : turns <= 4 ? 2 : 1
      this.add.text(width / 2, 260, `Resolved in ${turns} turns  ${'★'.repeat(stars)}${'☆'.repeat(3 - stars)}`, {
        fontSize: '11px', fontFamily: 'monospace', color: '#f4d06f',
      }).setOrigin(0.5)

      // Continue button
      const btn = this.add.text(width / 2, 320, '[ CONTINUE ]', {
        fontSize: '14px', fontFamily: 'monospace', color: '#7ee2c1',
      }).setOrigin(0.5).setInteractive({ useHandCursor: true })
      btn.on('pointerover', () => btn.setColor('#ffffff'))
      btn.on('pointerout', () => btn.setColor('#7ee2c1'))
      btn.on('pointerdown', () => this.exitBattle(true))

      this.input.keyboard!.on('keydown-SPACE', () => this.exitBattle(true))
    })
  }

  private defeat() {
    this.state.turn = 'done'
    this.toolButtons.forEach(c => c.setVisible(false))
    this.messageText.setVisible(false)
    this.turnIndicator.setVisible(false)

    const { width, height } = this.scale

    const overlay = this.add.rectangle(width / 2, height / 2, width, height, 0x0e1116, 0)
    this.tweens.add({ targets: overlay, fillAlpha: 0.85, duration: 400 })

    this.tweens.add({
      targets: this.portrait,
      scaleX: 2.5,
      scaleY: 2.5,
      alpha: 0.15,
      duration: 800,
      ease: 'Power2',
    })

    this.time.delayedCall(400, () => {
      this.add.text(width / 2, height / 2 - 60, 'CLAIM LOST', {
        fontSize: '28px', fontFamily: 'monospace', color: '#ef5b7b', fontStyle: 'bold',
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
    })
  }

  private exitBattle(won: boolean) {
    if (won) {
      updateResources({ hp: this.state.playerHp - getState().resources.hp })
      unlockCodex(this.state.encounter.id)
      saveGame()
    }
    this.scene.start('Hospital')
  }

  private showMessage(text: string) {
    this.messageText.setText(text)
    this.messageText.setAlpha(0)
    this.tweens.add({ targets: this.messageText, alpha: 1, duration: 200 })
  }

  private setTurnIndicator() {
    if (this.state.turn === 'player') {
      this.turnIndicator.setText('YOUR TURN').setColor('#7ee2c1')
    }
  }

  private setToolButtonsVisible(visible: boolean) {
    this.toolButtons.forEach(c => {
      c.setVisible(visible)
      c.setAlpha(visible ? 1 : 0.3)
    })
    if (visible) this.turnIndicator.setVisible(true)
    else this.turnIndicator.setVisible(false)
  }

  private animateEncounterHp() {
    const targetRatio = this.state.encounterHp / this.state.encounter.hp
    this.tweens.addCounter({
      from: this.encounterHpRatio * 100,
      to: targetRatio * 100,
      duration: 400,
      ease: 'Power2',
      onUpdate: (tween) => {
        this.encounterHpRatio = tween.getValue() / 100
        this.drawEncounterHp()
      },
    })
  }

  private animatePlayerHp() {
    const targetRatio = this.state.playerHp / this.state.playerMaxHp
    this.tweens.addCounter({
      from: this.playerHpRatio * 100,
      to: targetRatio * 100,
      duration: 400,
      ease: 'Power2',
      onUpdate: (tween) => {
        this.playerHpRatio = tween.getValue() / 100
        this.drawPlayerHp()
      },
    })
  }

  private drawEncounterHp() {
    const { width } = this.scale
    const barWidth = 300
    const barHeight = 14
    const x = width / 2 - barWidth / 2
    const y = 168 - barHeight / 2

    this.encounterHpBar.clear()
    const ratio = this.encounterHpRatio
    const color = ratio > 0.5 ? 0x6cd49a : ratio > 0.25 ? 0xf4d06f : 0xef5b7b
    this.encounterHpBar.fillStyle(color)
    this.encounterHpBar.fillRect(x, y, barWidth * ratio, barHeight)
  }

  private drawPlayerHp() {
    const px = 90
    const py = this.scale.height - 134
    const barWidth = 130
    const barHeight = 12
    const x = px - barWidth / 2
    const y = py - barHeight / 2

    this.playerHpBar.clear()
    const ratio = this.playerHpRatio
    const color = ratio > 0.5 ? 0x6cd49a : ratio > 0.25 ? 0xf4d06f : 0xef5b7b
    this.playerHpBar.fillStyle(color)
    this.playerHpBar.fillRect(x, y, barWidth * ratio, barHeight)
  }
}
