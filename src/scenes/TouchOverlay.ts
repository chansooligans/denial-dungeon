// TouchOverlay — virtual D-pad + interact button for mobile (and
// keyboard-impaired desktop) play.
//
// Runs as a parallel scene. Each button dispatches synthetic
// KeyboardEvent("keydown" / "keyup") to window so the underlying
// scene's `cursors.left.isDown`-style checks behave exactly as if a
// real key were held. No gameplay code in HospitalScene /
// WaitingRoomScene needs to know touch exists.
//
// Always visible: harmless on desktop, essential on mobile.

import Phaser from 'phaser'
import { addFullscreenButton } from './fullscreenButton'

interface Btn {
  /** Container holding the button graphics (for hover/press effects). */
  container: Phaser.GameObjects.Container
  /** Currently held? (so we don't fire repeated keydowns). */
  held: boolean
  /** KeyboardEvent .key value to dispatch. */
  key: string
  /** KeyboardEvent .code value (useful for arrow keys). */
  code: string
}

export class TouchOverlay extends Phaser.Scene {
  private buttons: Btn[] = []

  constructor() {
    super('TouchOverlay')
  }

  create() {
    this.buttons = []
    const { width, height } = this.scale

    // Bottom-left D-pad cluster
    const padCx = 90
    const padCy = height - 90
    const r = 28
    this.makeButton(padCx,        padCy - r * 2, '▲', 'ArrowUp',    'ArrowUp')
    this.makeButton(padCx,        padCy + r * 2, '▼', 'ArrowDown',  'ArrowDown')
    this.makeButton(padCx - r * 2, padCy,        '◀', 'ArrowLeft',  'ArrowLeft')
    this.makeButton(padCx + r * 2, padCy,        '▶', 'ArrowRight', 'ArrowRight')

    // Bottom-right primary action: interact / advance / engage (= 'E')
    this.makeButton(width - 70, height - 90, 'E',   'e',      'KeyE',     54)

    // Top-right secondary action: ESC (skip intro / flee / back to menu)
    this.makeButton(width - 40, 40, 'ESC', 'Escape', 'Escape', 28, '#3a4a5d')

    // Top-left: fullscreen toggle
    addFullscreenButton(this)

    // Release any held buttons if focus is lost (avoids stuck movement).
    this.scale.on('resize', () => this.releaseAll())
    this.input.on('gameout', () => this.releaseAll())
  }

  private makeButton(
    x: number, y: number, label: string,
    key: string, code: string,
    radius = 28, color: string = '#7ee2c1',
  ) {
    const container = this.add.container(x, y)

    const bg = this.add.circle(0, 0, radius, 0x0e1116, 0.55)
      .setStrokeStyle(1, 0x3a4a5d, 0.9)
      .setInteractive({ useHandCursor: true })
    const text = this.add.text(0, 0, label, {
      fontSize: radius >= 28 ? '16px' : '11px',
      fontFamily: 'monospace',
      color,
      fontStyle: 'bold',
    }).setOrigin(0.5)

    container.add([bg, text])
    container.setScrollFactor(0).setDepth(1000)

    const btn: Btn = { container, held: false, key, code }

    const press = () => {
      if (btn.held) return
      btn.held = true
      bg.setFillStyle(0x1f2a36, 0.85)
      window.dispatchEvent(new KeyboardEvent('keydown', { key, code, bubbles: true }))
    }
    const release = () => {
      if (!btn.held) return
      btn.held = false
      bg.setFillStyle(0x0e1116, 0.55)
      window.dispatchEvent(new KeyboardEvent('keyup', { key, code, bubbles: true }))
    }

    bg.on('pointerdown', press)
    bg.on('pointerup', release)
    bg.on('pointerout', release)
    bg.on('pointerupoutside', release)

    this.buttons.push(btn)
  }

  /** Force-release every button. Used on focus loss / resize. */
  private releaseAll() {
    for (const btn of this.buttons) {
      if (!btn.held) continue
      btn.held = false
      window.dispatchEvent(
        new KeyboardEvent('keyup', { key: btn.key, code: btn.code, bubbles: true }),
      )
    }
  }
}
