// Battle end-state screens: victory + defeat overlays.
//
// Pulled out of BattleScene so the orchestration file stays focused on
// the turn loop. These functions take the scene + minimal context and
// drive their own UI; the scene exposes a couple of callbacks for what
// happens when the player chooses Continue / Retry / Exit.

import Phaser from 'phaser'
import { TOOLS } from '../content/abilities'
import { getState } from '../state'
import type { Encounter } from '../types'

export interface VictoryParams {
  encounter: Encounter
  /** Tool buttons + text to hide before drawing the overlay. */
  toolButtons: Phaser.GameObjects.Container[]
  messageText: Phaser.GameObjects.Text
  turnIndicator: Phaser.GameObjects.Text
  portrait: Phaser.GameObjects.Image
  /** Total turns the player took (used for star rating). */
  turnCount: number
  /** Called when the player presses Continue / SPACE. */
  onContinue: () => void
}

export function showVictoryScreen(scene: Phaser.Scene, p: VictoryParams) {
  const enc = p.encounter

  p.toolButtons.forEach(c => c.setVisible(false))
  p.messageText.setVisible(false)
  p.turnIndicator.setVisible(false)

  const { width, height } = scene.scale

  // Backdrop fade
  const overlay = scene.add.rectangle(width / 2, height / 2, width, height, 0x0e1116, 0)
  scene.tweens.add({ targets: overlay, fillAlpha: 0.85, duration: 400 })

  // Portrait scales up + fades back as the resolution lands
  scene.tweens.add({
    targets: p.portrait,
    scaleX: 1.5, scaleY: 1.5, alpha: 0.3,
    duration: 600, ease: 'Power2',
  })

  scene.time.delayedCall(400, () => {
    const resolved = scene.add.text(width / 2, 60, 'RESOLVED', {
      fontSize: '28px', fontFamily: 'monospace', color: '#7ee2c1', fontStyle: 'bold',
    }).setOrigin(0.5).setAlpha(0)
    scene.tweens.add({ targets: resolved, alpha: 1, duration: 300 })

    // CARC reveal vs archetype label
    if (enc.carcCode) {
      scene.add.text(width / 2, 110, `CARC: ${enc.carcCode}`, {
        fontSize: '16px', fontFamily: 'monospace', color: '#ef5b7b',
      }).setOrigin(0.5)
      if (enc.carcName) {
        scene.add.text(width / 2, 135, enc.carcName, {
          fontSize: '12px', fontFamily: 'monospace', color: '#ffffff',
        }).setOrigin(0.5)
      }
    } else if (enc.archetype) {
      scene.add.text(width / 2, 110, enc.archetype, {
        fontSize: '16px', fontFamily: 'monospace', color: '#b18bd6',
      }).setOrigin(0.5)
    }

    // Watchpoint
    scene.add.text(width / 2, 180, `"${enc.watchpoint}"`, {
      fontSize: '12px', fontFamily: 'monospace', color: '#f4d06f',
      fontStyle: 'italic', wordWrap: { width: 500 }, align: 'center',
    }).setOrigin(0.5)

    // Best tools
    const correctNames = enc.correctTools.map(id => TOOLS[id]?.name || id).join(', ')
    scene.add.text(width / 2, 230, `Best tools: ${correctNames}`, {
      fontSize: '11px', fontFamily: 'monospace', color: '#8b95a5',
    }).setOrigin(0.5)

    // Turn count + rating
    const turns = p.turnCount + 1
    const stars = turns <= 2 ? 3 : turns <= 4 ? 2 : 1
    scene.add.text(
      width / 2, 260,
      `Resolved in ${turns} turns  ${'★'.repeat(stars)}${'☆'.repeat(3 - stars)}`,
      { fontSize: '11px', fontFamily: 'monospace', color: '#f4d06f' },
    ).setOrigin(0.5)

    // New tools earned (if first defeat) — exitBattle does the unlock,
    // we just surface it here so the kit-growing is legible.
    const earned = enc.unlocksOnDefeat ?? []
    const previouslyHad = new Set(getState().tools)
    const newlyEarned = earned.filter(id => !previouslyHad.has(id))
    if (newlyEarned.length > 0) {
      const names = newlyEarned.map(id => TOOLS[id]?.name || id).join(', ')
      scene.add.text(width / 2, 285, `New tool unlocked: ${names}`, {
        fontSize: '11px', fontFamily: 'monospace', color: '#7ee2c1', fontStyle: 'bold',
      }).setOrigin(0.5)
    }

    const btn = scene.add.text(width / 2, 330, '[ CONTINUE ]', {
      fontSize: '14px', fontFamily: 'monospace', color: '#7ee2c1',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true })
    btn.on('pointerover', () => btn.setColor('#ffffff'))
    btn.on('pointerout', () => btn.setColor('#7ee2c1'))
    btn.on('pointerdown', p.onContinue)

    scene.input.keyboard!.on('keydown-SPACE', p.onContinue)
  })
}

export interface DefeatParams {
  toolButtons: Phaser.GameObjects.Container[]
  messageText: Phaser.GameObjects.Text
  turnIndicator: Phaser.GameObjects.Text
  portrait: Phaser.GameObjects.Image
  /** Called when player picks Retry. Receives no args; scene restarts. */
  onRetry: () => void
  /** Called when player picks Back to Title. */
  onExitToTitle: () => void
}

export function showDefeatScreen(scene: Phaser.Scene, p: DefeatParams) {
  p.toolButtons.forEach(c => c.setVisible(false))
  p.messageText.setVisible(false)
  p.turnIndicator.setVisible(false)

  const { width, height } = scene.scale

  const overlay = scene.add.rectangle(width / 2, height / 2, width, height, 0x0e1116, 0)
  scene.tweens.add({ targets: overlay, fillAlpha: 0.85, duration: 400 })

  scene.tweens.add({
    targets: p.portrait,
    scaleX: 2.5, scaleY: 2.5, alpha: 0.15,
    duration: 800, ease: 'Power2',
  })

  scene.time.delayedCall(400, () => {
    scene.add.text(width / 2, height / 2 - 60, 'CLAIM LOST', {
      fontSize: '28px', fontFamily: 'monospace', color: '#ef5b7b', fontStyle: 'bold',
    }).setOrigin(0.5)

    scene.add.text(
      width / 2, height / 2 - 20,
      'The denial stands. The patient gets a surprise bill.',
      {
        fontSize: '12px', fontFamily: 'monospace', color: '#8b95a5',
        wordWrap: { width: 400 }, align: 'center',
      },
    ).setOrigin(0.5)

    const retryBtn = scene.add.text(width / 2, height / 2 + 40, '[ RETRY ]', {
      fontSize: '14px', fontFamily: 'monospace', color: '#f4d06f',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true })
    retryBtn.on('pointerover', () => retryBtn.setColor('#ffffff'))
    retryBtn.on('pointerout', () => retryBtn.setColor('#f4d06f'))
    retryBtn.on('pointerdown', p.onRetry)

    const exitBtn = scene.add.text(width / 2, height / 2 + 80, '[ BACK TO TITLE ]', {
      fontSize: '12px', fontFamily: 'monospace', color: '#5a6a7a',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true })
    exitBtn.on('pointerover', () => exitBtn.setColor('#ffffff'))
    exitBtn.on('pointerout', () => exitBtn.setColor('#5a6a7a'))
    exitBtn.on('pointerdown', p.onExitToTitle)
  })
}
