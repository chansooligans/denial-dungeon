// ToolMenu — the bottom-of-screen action ribbon during battle.
//
// Two flavors, picked at construction:
//   1. Default tool ribbon: one button per Tool from state.tools. Used
//      by SimpleController and TimedController.
//   2. Custom action ribbon: one button per MechanicAction returned by
//      mechanic.getActions(). Used by InvestigationController.
//
// Both flavors get a FLEE button on the right + 1..9 keyboard shortcuts
// and ESC for flee. Buttons honor a per-tool gate reason (e.g. stress
// ≥ 75 disables turnCost-2 tools) so the player gets a flash message
// instead of the click going through.
//
// BattleScene owns the turn loop and state; ToolMenu owns rendering +
// click + keyboard for the ribbon. Communication is via callbacks.

import Phaser from 'phaser'
import type { Tool } from '../types'
import type { MechanicAction } from './types'

export interface ToolMenuCallbacks {
  /** Should be true when the player is allowed to act. Gates clicks. */
  isPlayerTurn: () => boolean
  /** Return a user-facing reason if the tool is currently unusable; null otherwise. */
  toolGateReason: (tool: Tool) => string | null
  /** Surface a one-shot message (used when a click hits a gated tool). */
  showMessage: (msg: string) => void
  onUseTool: (tool: Tool) => void
  onUseAction: (actionId: string) => void
  onFlee: () => void
}

export class ToolMenu {
  /** Public so victory/defeat screens can hide them with `forEach c => c.setVisible(false)`. */
  readonly buttons: Phaser.GameObjects.Container[] = []

  private scene: Phaser.Scene
  private cb: ToolMenuCallbacks
  /** Tools currently authored in the ribbon (default flavor only). */
  private tools: Tool[] = []
  /** Action ids currently authored (custom flavor only). */
  private actionIds: string[] = []

  constructor(
    scene: Phaser.Scene,
    width: number,
    height: number,
    tools: Tool[],
    customActions: MechanicAction[] | null,
    cb: ToolMenuCallbacks,
  ) {
    this.scene = scene
    this.cb = cb
    if (customActions) {
      this.buildCustomActionRibbon(width, height, customActions)
    } else {
      this.tools = tools
      this.buildDefaultToolRibbon(width, height, tools)
    }
    this.buildFleeButton(width, height)
  }

  /** Hide / show the entire ribbon (during enemy turn, victory, defeat). */
  setVisible(visible: boolean) {
    for (const container of this.buttons) {
      container.setVisible(visible)
      container.setAlpha(visible ? 1 : 0.3)
    }
  }

  /**
   * Re-applies disabled / styling state on every button. Call after each
   * turn — stress can change mid-fight (shadow tools push it up; wins
   * pull it down) and disabled actions vary per Investigation turn.
   */
  refreshGates(actions: MechanicAction[] | null) {
    for (const container of this.buttons) {
      const tool = container.getData('tool') as Tool | undefined
      if (tool) {
        this.styleToolButton(container, tool)
        continue
      }
      const actionId = container.getData('actionId') as string | undefined
      if (actionId && actions) {
        this.styleActionButton(container, actionId, actions)
      }
    }
  }

  // -------------------------------------------------------------------
  // Default tool ribbon (Simple / Timed)
  // -------------------------------------------------------------------

  private buildDefaultToolRibbon(width: number, height: number, tools: Tool[]) {
    const cols = Math.min(tools.length, 4)
    const rows = Math.ceil(tools.length / cols)
    const btnW = 160
    const btnH = 36
    const gap = 8
    const startX = width / 2 - ((cols - 1) * (btnW + gap)) / 2
    const startY = height - 20 - rows * (btnH + gap)

    tools.forEach((tool, i) => {
      const x = startX + (i % cols) * (btnW + gap)
      const y = startY + Math.floor(i / cols) * (btnH + gap)
      const container = this.scene.add.container(x, y)

      const bg = this.scene.add.image(0, 0, 'ui_action_btn')
        .setDisplaySize(btnW, btnH)
        .setInteractive({ useHandCursor: true })
      const numLabel = this.scene.add.text(-btnW / 2 + 10, -6, `${i + 1}`, {
        fontSize: '9px', fontFamily: 'monospace', color: '#5a6a7a',
      }).setOrigin(0, 0.5)
      const label = this.scene.add.text(4, -6, tool.name, {
        fontSize: '11px', fontFamily: 'monospace', color: '#7ee2c1',
      }).setOrigin(0.5)
      const sub = this.scene.add.text(4, 8, `DMG:${tool.damage} ACC:${tool.accuracy}%`, {
        fontSize: '8px', fontFamily: 'monospace', color: '#5a6a7a',
      }).setOrigin(0.5)

      container.add([bg, numLabel, label, sub])
      container.setData('tool', tool)
      container.setData('label', label)
      container.setData('sub', sub)
      container.setData('bg', bg)

      bg.on('pointerover', () => {
        if (this.cb.toolGateReason(tool)) return
        bg.setTexture('ui_action_btn_hover')
        label.setColor('#ffffff')
      })
      bg.on('pointerout', () => {
        if (this.cb.toolGateReason(tool)) return
        bg.setTexture('ui_action_btn')
        label.setColor('#7ee2c1')
      })
      bg.on('pointerdown', () => {
        const reason = this.cb.toolGateReason(tool)
        if (reason) {
          this.cb.showMessage(reason)
          return
        }
        this.cb.onUseTool(tool)
      })

      this.buttons.push(container)
    })

    const keys = this.scene.input.keyboard!
    tools.forEach((tool, i) => {
      keys.on(`keydown-${i + 1}`, () => {
        if (!this.cb.isPlayerTurn()) return
        const reason = this.cb.toolGateReason(tool)
        if (reason) {
          this.cb.showMessage(reason)
          return
        }
        this.cb.onUseTool(tool)
      })
    })
  }

  /** Apply gated styling to a tool button. */
  private styleToolButton(container: Phaser.GameObjects.Container, tool: Tool) {
    const label = container.getData('label') as Phaser.GameObjects.Text | undefined
    const sub = container.getData('sub') as Phaser.GameObjects.Text | undefined
    const bg = container.getData('bg') as Phaser.GameObjects.Image | undefined
    const reason = this.cb.toolGateReason(tool)
    if (reason) {
      container.setAlpha(0.55)
      label?.setColor('#ef5b7b')
      sub?.setText('STRESSED — unavailable')
      sub?.setColor('#ef5b7b')
      bg?.setTexture('ui_action_btn')
    } else {
      container.setAlpha(1)
      label?.setColor('#7ee2c1')
      sub?.setText(`DMG:${tool.damage} ACC:${tool.accuracy}%`)
      sub?.setColor('#5a6a7a')
    }
  }

  // -------------------------------------------------------------------
  // Custom action ribbon (Investigation)
  // -------------------------------------------------------------------

  private buildCustomActionRibbon(width: number, height: number, actions: MechanicAction[]) {
    const cols = Math.min(actions.length, 4)
    const rows = Math.ceil(actions.length / cols)
    const btnW = 170
    const btnH = 40
    const gap = 8
    const startX = width / 2 - ((cols - 1) * (btnW + gap)) / 2
    const startY = height - 20 - rows * (btnH + gap)

    actions.forEach((action, i) => {
      const x = startX + (i % cols) * (btnW + gap)
      const y = startY + Math.floor(i / cols) * (btnH + gap)
      const container = this.scene.add.container(x, y)

      const bg = this.scene.add.image(0, 0, 'ui_action_btn')
        .setDisplaySize(btnW, btnH)
        .setInteractive({ useHandCursor: true })
      const numLabel = this.scene.add.text(-btnW / 2 + 10, -8, `${i + 1}`, {
        fontSize: '9px', fontFamily: 'monospace', color: '#5a6a7a',
      }).setOrigin(0, 0.5)
      const label = this.scene.add.text(4, -8, action.label, {
        fontSize: '12px', fontFamily: 'monospace', color: '#b18bd6', fontStyle: 'bold',
      }).setOrigin(0.5)
      const sub = this.scene.add.text(4, 9, action.sub ?? '', {
        fontSize: '8px', fontFamily: 'monospace', color: '#7a8898',
      }).setOrigin(0.5)
      container.add([bg, numLabel, label, sub])
      container.setData('actionId', action.id)
      container.setData('label', label)

      bg.on('pointerover', () => {
        bg.setTexture('ui_action_btn_hover'); label.setColor('#ffffff')
      })
      bg.on('pointerout', () => {
        bg.setTexture('ui_action_btn'); label.setColor('#b18bd6')
      })
      bg.on('pointerdown', () => this.cb.onUseAction(action.id))

      this.buttons.push(container)
      this.actionIds.push(action.id)
    })

    const keys = this.scene.input.keyboard!
    actions.forEach((action, i) => {
      keys.on(`keydown-${i + 1}`, () => {
        if (this.cb.isPlayerTurn()) this.cb.onUseAction(action.id)
      })
    })
  }

  private styleActionButton(
    container: Phaser.GameObjects.Container,
    actionId: string,
    actions: MechanicAction[],
  ) {
    const matching = actions.find(a => a.id === actionId)
    if (!matching) return
    const label = container.getData('label') as Phaser.GameObjects.Text | undefined
    if (matching.disabled) {
      container.setAlpha(0.4)
      label?.setColor('#5a4a6a')
    } else {
      container.setAlpha(1)
      label?.setColor('#b18bd6')
    }
  }

  // -------------------------------------------------------------------
  // Flee
  // -------------------------------------------------------------------

  private buildFleeButton(width: number, height: number) {
    const fleeBtn = this.scene.add.text(width - 80, height - 30, '[ FLEE ]', {
      fontSize: '11px', fontFamily: 'monospace', color: '#5a6a7a',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true })
    fleeBtn.on('pointerover', () => fleeBtn.setColor('#f4d06f'))
    fleeBtn.on('pointerout', () => fleeBtn.setColor('#5a6a7a'))
    fleeBtn.on('pointerdown', () => this.cb.onFlee())
    const fleeContainer = this.scene.add.container(0, 0, [fleeBtn])
    this.buttons.push(fleeContainer)

    this.scene.input.keyboard!.on('keydown-ESC', () => {
      if (this.cb.isPlayerTurn()) this.cb.onFlee()
    })
  }
}
