// Lightweight narration overlay used by HospitalScene + WaitingRoomScene.
// Renders a translucent box at the bottom-center of the screen, fades
// each line in/out in sequence, then calls onComplete and tears the
// elements down. UI-camera friendly (scrollFactor 0).

import Phaser from 'phaser'
import { isTouchDevice } from './device'

export function showNarration(
  scene: Phaser.Scene,
  lines: string[],
  onComplete: () => void,
  options?: {
    color?: string
    /** Cameras that should NOT render this narration. Pass the world
     *  camera in scenes that also have a UI camera, otherwise the
     *  overlay renders twice (once per camera) at slightly offset
     *  positions. */
    ignoreCameras?: Phaser.Cameras.Scene2D.Camera[]
  },
) {
  const { width, height } = scene.scale
  const color = options?.color ?? '#e6edf3'
  // Mobile gets larger text + a taller box anchored near the bottom
  // edge of the viewport (closer to where the player is looking) so
  // the narration is legible without fullscreen. Desktop keeps the
  // original mid-screen layout.
  //
  // Position is intended in *screen* pixels but Phaser objects with
  // setScrollFactor(0) are still scaled by the main camera's zoom
  // when no UI camera owns them. To land where we expect, divide
  // by the rendering camera's zoom unless the caller has handed off
  // to a UI camera via `ignoreCameras: [main]`.
  const m = isTouchDevice()
  const renderedByMain = !(options?.ignoreCameras ?? []).includes(scene.cameras.main)
  const zoom = renderedByMain ? scene.cameras.main.zoom || 1 : 1

  // Sizes are authored in screen pixels — divide by zoom so the
  // rendered output lands at the intended on-screen size when the
  // main camera has gameplay zoom applied.
  const fontPx   = m ? 17 : 13
  const hintPx   = m ? 12 : 10
  const screenBoxW = m ? width - 40 : width - 80
  const screenBoxH = m ? 110 : 70
  const screenBoxY = m ? height - screenBoxH / 2 - 24 : height / 2 + 100

  const boxX = (width / 2) / zoom
  const boxY = screenBoxY / zoom
  const boxW = screenBoxW / zoom
  const boxH = screenBoxH / zoom
  const fontSize = `${fontPx / zoom}px`
  const hintSize = `${hintPx / zoom}px`

  const box = scene.add
    .rectangle(boxX, boxY, boxW, boxH, 0x0e1116, 0.92)
    .setStrokeStyle(1, 0x2a323d)
    .setScrollFactor(0)
    .setDepth(110)
    .setAlpha(0)
  const text = scene.add
    .text(boxX, boxY, '', {
      fontSize,
      fontFamily: 'monospace',
      color,
      align: 'center',
      wordWrap: { width: boxW - 40 / zoom },
    })
    .setOrigin(0.5)
    .setScrollFactor(0)
    .setDepth(111)
    .setAlpha(0)
  // Small "click to continue" hint inside the box — only visible while
  // a line is fully shown and waiting for input.
  const hint = scene.add
    .text(boxX + boxW / 2 - 14 / zoom, boxY + boxH / 2 - 12 / zoom, 'click ▸', {
      fontSize: hintSize,
      fontFamily: 'monospace',
      color: '#5a6a7a',
    })
    .setOrigin(1, 0.5)
    .setScrollFactor(0)
    .setDepth(111)
    .setAlpha(0)
  options?.ignoreCameras?.forEach(cam => cam.ignore([box, text, hint]))

  scene.tweens.add({ targets: box, alpha: 0.85, duration: 280 })

  let i = 0
  const showNext = () => {
    if (i >= lines.length) {
      scene.tweens.add({
        targets: [box, text, hint],
        alpha: 0,
        duration: 260,
        onComplete: () => {
          box.destroy()
          text.destroy()
          hint.destroy()
          onComplete()
        },
      })
      return
    }
    text.setText(lines[i])
    i += 1
    // Fade the line in, then wait for a click to advance.
    scene.tweens.add({
      targets: text,
      alpha: 1,
      duration: 280,
      onComplete: () => {
        scene.tweens.add({ targets: hint, alpha: 1, duration: 200 })
        scene.input.once('pointerdown', () => {
          scene.tweens.add({ targets: hint, alpha: 0, duration: 120 })
          scene.tweens.add({
            targets: text,
            alpha: 0,
            duration: 200,
            onComplete: showNext,
          })
        })
      },
    })
  }
  showNext()
}
