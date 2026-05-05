import Phaser from 'phaser'
import { TOOLS } from '../content/abilities'
import { ENCOUNTERS } from '../content/enemies'
import { getState, updateResources, unlockCodex, unlockTool, saveGame } from '../state'
import type { Encounter, Tool } from '../types'
import { FACTION_COLOR } from '../types'
import { createMechanic } from '../battle'
import type { MechanicController } from '../battle'

interface BattleState {
  encounter: Encounter
  // Cached snapshot of the mechanic's HP for the on-screen text widget.
  // The mechanic controller owns the source of truth; this is just for
  // tween animations that need a previous-value to interpolate from.
  encounterHp: number
  playerHp: number
  playerMaxHp: number
  playerTools: string[]
  turn: 'player' | 'enemy' | 'animating' | 'done'
  turnCount: number
  /** Which scene to return to after the battle ends. Defaults to Hospital. */
  returnScene: string
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
  private mechanic!: MechanicController
  private encounterNameText!: Phaser.GameObjects.Text
  private encounterDescriptionText?: Phaser.GameObjects.Text
  private encounterHpBar!: Phaser.GameObjects.Graphics
  private encounterHpText!: Phaser.GameObjects.Text
  private playerHpBar!: Phaser.GameObjects.Graphics
  private playerHpText!: Phaser.GameObjects.Text
  private messageText!: Phaser.GameObjects.Text
  private toolButtons: Phaser.GameObjects.Container[] = []
  private portrait!: Phaser.GameObjects.Image
  private turnIndicator!: Phaser.GameObjects.Text
  private statusText?: Phaser.GameObjects.Text
  private panelTextWidget?: Phaser.GameObjects.Text
  private encounterHpRatio = 1
  private playerHpRatio = 1

  constructor() {
    super('Battle')
  }

  init(data: {
    encounterId?: string
    playerHp?: number
    playerMaxHp?: number
    playerTools?: string[]
    /** Scene to start when this battle ends. Defaults to 'Hospital'. */
    returnScene?: string
  }) {
    const encounterId = data.encounterId || 'co_109'
    const encounter = ENCOUNTERS[encounterId]
    if (!encounter) throw new Error(`Unknown encounter: ${encounterId}`)

    const gameState = getState()

    this.mechanic = createMechanic(encounter)
    const initialHp = this.mechanic.hpDisplay()

    this.state = {
      encounter,
      encounterHp: initialHp.current,
      playerHp: data.playerHp ?? gameState.resources.hp,
      playerMaxHp: data.playerMaxHp ?? gameState.resources.maxHp,
      playerTools: data.playerTools ?? gameState.tools,
      turn: 'player',
      turnCount: 0,
      returnScene: data.returnScene ?? 'Hospital',
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
    this.refreshStatus()
    this.refreshPanel()
    this.refreshActionButtons()
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

    // Description — hidden if a mechanic provides a persistent panel
    // (the panel content carries the relevant flavor + state in that case).
    this.encounterDescriptionText = this.add.text(width / 2, barY + 30, enc.description, {
      fontSize: '11px', fontFamily: 'monospace', color: '#8b95a5',
      wordWrap: { width: 500 }, align: 'center',
    }).setOrigin(0.5, 0)
    if (this.mechanic.panelText()) {
      this.encounterDescriptionText.setVisible(false)
    }
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
    const customActions = this.mechanic.getActions()
    if (customActions) {
      this.buildCustomActionMenu(width, height, customActions)
    } else {
      this.buildDefaultToolMenu(width, height)
    }

    // Flee button (always available)
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

    this.input.keyboard!.on('keydown-ESC', () => {
      if (this.state.turn === 'player') this.tryFlee()
    })
  }

  private buildDefaultToolMenu(width: number, height: number) {
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

    const keys = this.input.keyboard!
    tools.forEach((tool, i) => {
      keys.on(`keydown-${i + 1}`, () => {
        if (this.state.turn === 'player') this.useToolAction(tool)
      })
    })
  }

  private buildCustomActionMenu(
    width: number, height: number,
    actions: import('../battle/types').MechanicAction[]
  ) {
    const cols = Math.min(actions.length, 4)
    const rows = Math.ceil(actions.length / cols)
    const btnW = 170
    const btnH = 40
    const gap = 8
    const startX = width / 2 - ((cols - 1) * (btnW + gap)) / 2
    const startY = height - 20 - rows * (btnH + gap)

    actions.forEach((action, i) => {
      const col = i % cols
      const row = Math.floor(i / cols)
      const x = startX + col * (btnW + gap)
      const y = startY + row * (btnH + gap)
      const container = this.add.container(x, y)

      const bg = this.add.image(0, 0, 'ui_action_btn').setDisplaySize(btnW, btnH)
        .setInteractive({ useHandCursor: true })
      const numLabel = this.add.text(-btnW / 2 + 10, -8, `${i + 1}`, {
        fontSize: '9px', fontFamily: 'monospace', color: '#5a6a7a',
      }).setOrigin(0, 0.5)
      const label = this.add.text(4, -8, action.label, {
        fontSize: '12px', fontFamily: 'monospace', color: '#b18bd6', fontStyle: 'bold',
      }).setOrigin(0.5)
      const sub = this.add.text(4, 9, action.sub ?? '', {
        fontSize: '8px', fontFamily: 'monospace', color: '#7a8898',
      }).setOrigin(0.5)
      container.add([bg, numLabel, label, sub])
      container.setData('actionId', action.id)
      container.setData('label', label)

      bg.on('pointerover', () => { bg.setTexture('ui_action_btn_hover'); label.setColor('#ffffff') })
      bg.on('pointerout', () => { bg.setTexture('ui_action_btn'); label.setColor('#b18bd6') })
      bg.on('pointerdown', () => this.useMechanicAction(action.id))

      this.toolButtons.push(container)
    })

    const keys = this.input.keyboard!
    actions.forEach((action, i) => {
      keys.on(`keydown-${i + 1}`, () => {
        if (this.state.turn === 'player') this.useMechanicAction(action.id)
      })
    })
  }

  /** Refresh disabled-state styling on custom action buttons each turn. */
  private refreshActionButtons() {
    const actions = this.mechanic.getActions()
    if (!actions) return
    for (const container of this.toolButtons) {
      const id = container.getData('actionId') as string | undefined
      if (!id) continue
      const matching = actions.find(a => a.id === id)
      if (!matching) continue
      const label = container.getData('label') as Phaser.GameObjects.Text | undefined
      if (matching.disabled) {
        container.setAlpha(0.4)
        label?.setColor('#5a4a6a')
      } else {
        container.setAlpha(1)
        label?.setColor('#b18bd6')
      }
    }
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

  /**
   * Used by mechanics that ship custom action buttons (Investigation,
   * Timed-with-special-actions, etc.). Same flow as useToolAction but
   * skips the Tool lookup since actions aren't tied to a tool record.
   */
  private useMechanicAction(actionId: string) {
    if (this.state.turn !== 'player') return
    this.state.turn = 'animating'
    this.setToolButtonsVisible(false)

    const result = this.mechanic.applyPlayerTurn(actionId)
    this.applyTurnResult(result, actionId)
  }

  private useToolAction(tool: Tool) {
    if (this.state.turn !== 'player') return
    this.state.turn = 'animating'
    this.setToolButtonsVisible(false)

    const result = this.mechanic.applyPlayerTurn(tool.id)
    this.applyTurnResult(result, tool.name)
  }

  /**
   * Common post-turn handling for both tool and custom-action paths.
   * Updates HP, plays effects, checks win/lose, schedules enemy turn.
   */
  private applyTurnResult(result: import('../battle/types').PlayerTurnResult, actionLabel: string) {
    if (result.missed) {
      this.showMessage(result.message ?? `${actionLabel} missed!`)
      this.time.delayedCall(1000, () => this.enemyTurn())
      return
    }

    // Sync local snapshot from the controller (source of truth).
    const { current, max } = this.mechanic.hpDisplay()
    this.state.encounterHp = current
    this.animateEncounterHp()
    this.encounterHpText.setText(`${current} / ${max}`)
    this.refreshStatus()
    this.refreshPanel()
    this.refreshActionButtons()

    if (result.damage > 0) {
      // Only flash/shake when there's actual HP damage (Investigation
      // results return damage 0 even on success).
      this.tweens.add({
        targets: this.portrait,
        alpha: 0.3, duration: 80, yoyo: true, repeat: 2,
      })
      this.spawnDamageNumber(this.portrait.x, this.portrait.y - 40, result.damage, !!result.super)
      const intensity = Math.min(result.damage / max, 0.3)
      this.cameras.main.flash(80, 255, 255, 255, false, undefined, intensity)
    }

    this.showMessage(result.message ?? `${actionLabel}.`)

    // Mechanic-driven loss (Investigation: bad Decide / out-of-time)
    // takes precedence over a normal victory or enemy turn.
    if (this.mechanic.isLost()) {
      this.time.delayedCall(1200, () => this.defeat())
      return
    }
    if (result.ends || this.mechanic.isWon()) {
      this.time.delayedCall(1200, () => this.victory())
      return
    }

    this.time.delayedCall(1200, () => this.enemyTurn())
  }

  private enemyTurn() {
    this.state.turn = 'animating'
    const result = this.mechanic.applyEnemyTurn()
    const damage = result.damage

    if (damage > 0) {
      this.state.playerHp = Math.max(0, this.state.playerHp - damage)
      this.animatePlayerHp()
      this.playerHpText.setText(`${this.state.playerHp} / ${this.state.playerMaxHp}`)
    }
    this.refreshStatus()
    this.refreshPanel()

    if (result.message) this.showMessage(result.message)

    if (damage > 0) {
      this.spawnDamageNumber(90, this.scale.height - 160, damage, false, 0xef5b7b)
      const shakeIntensity = 0.003 + (damage / this.state.playerMaxHp) * 0.01
      this.cameras.main.shake(250, shakeIntensity)
    }

    if (this.mechanic.isLost() || this.state.playerHp <= 0) {
      this.time.delayedCall(1200, () => this.defeat())
      return
    }

    this.time.delayedCall(1200, () => {
      this.state.turn = 'player'
      this.state.turnCount++
      this.setToolButtonsVisible(true)
      this.setTurnIndicator()
      this.refreshActionButtons()
      this.showMessage('Choose your action.')
    })
  }

  /**
   * Show / refresh the persistent text panel — used by Investigation to
   * render the case file. Hides the central messageText to avoid overlap
   * since the panel is wide and tall.
   */
  private refreshPanel() {
    const text = this.mechanic.panelText()
    if (!text) {
      this.panelTextWidget?.setVisible(false)
      return
    }
    // Move/hide the centered messageText since the panel takes its space.
    this.messageText.setVisible(false)
    if (!this.panelTextWidget) {
      const { width, height } = this.scale
      this.panelTextWidget = this.add.text(width / 2, 195, text, {
        fontSize: '11px',
        fontFamily: 'monospace',
        color: '#d0d8e0',
        backgroundColor: '#0e1116ee',
        padding: { x: 12, y: 8 },
        align: 'left',
        wordWrap: { width: width - 80 },
      }).setOrigin(0.5, 0).setDepth(40)
      // Constrain height so it never reaches the action buttons.
      this.panelTextWidget.setMaxLines(Math.floor((height - 380) / 14))
    } else {
      this.panelTextWidget.setText(text).setVisible(true)
    }
  }

  /** Show / refresh the optional status line for mechanics that have one. */
  private refreshStatus() {
    const line = this.mechanic.statusLine()
    if (!line) {
      this.statusText?.setVisible(false)
      return
    }
    if (!this.statusText) {
      const { width } = this.scale
      this.statusText = this.add.text(width / 2, 10, line, {
        fontSize: '11px', fontFamily: 'monospace', color: '#b18bd6',
        backgroundColor: '#0e1116cc', padding: { x: 6, y: 3 },
      }).setOrigin(0.5, 0).setDepth(40)
    } else {
      this.statusText.setText(line).setVisible(true)
    }
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

      // CARC code reveal — only shown for obstacles wrapping a real
      // denial code. Non-CARC obstacles (e.g. eligibility, charge capture,
      // AR aging) display their archetype name instead.
      if (enc.carcCode) {
        this.add.text(width / 2, 110, `CARC: ${enc.carcCode}`, {
          fontSize: '16px', fontFamily: 'monospace', color: '#ef5b7b',
        }).setOrigin(0.5)

        if (enc.carcName) {
          this.add.text(width / 2, 135, enc.carcName, {
            fontSize: '12px', fontFamily: 'monospace', color: '#ffffff',
          }).setOrigin(0.5)
        }
      } else if (enc.archetype) {
        this.add.text(width / 2, 110, enc.archetype, {
          fontSize: '16px', fontFamily: 'monospace', color: '#b18bd6',
        }).setOrigin(0.5)
      }

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

      // New tools earned (if first defeat). Surfaced so the player notices
      // the kit growing — exitBattle() does the actual unlock.
      const earned = enc.unlocksOnDefeat ?? []
      const previouslyHad = new Set(getState().tools)
      const newlyEarned = earned.filter(id => !previouslyHad.has(id))
      if (newlyEarned.length > 0) {
        const names = newlyEarned.map(id => TOOLS[id]?.name || id).join(', ')
        this.add.text(width / 2, 285, `New tool unlocked: ${names}`, {
          fontSize: '11px', fontFamily: 'monospace', color: '#7ee2c1', fontStyle: 'bold',
        }).setOrigin(0.5)
      }

      // Continue button
      const btn = this.add.text(width / 2, 330, '[ CONTINUE ]', {
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
          returnScene: this.state.returnScene,
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
    const state = getState()
    if (won) {
      updateResources({ hp: this.state.playerHp - state.resources.hp })
      unlockCodex(this.state.encounter.id)
      // Track defeated obstacles so Waiting Room markers can hide once
      // their encounter is resolved. SimpleController encounters that win
      // via dialogue + exitBattle still flow through here, so they get
      // marked too — that's fine; the list is only consulted by the
      // Waiting Room marker renderer for now.
      if (!state.defeatedObstacles.includes(this.state.encounter.id)) {
        state.defeatedObstacles.push(this.state.encounter.id)
      }
      // Tools the encounter teaches on first defeat. Idempotent —
      // unlockTool dedupes against state.tools.
      const earned = this.state.encounter.unlocksOnDefeat ?? []
      for (const toolId of earned) unlockTool(toolId)
      saveGame()
    }
    this.scene.start(this.state.returnScene)
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
