// Lightweight narration overlay used by HospitalScene + WaitingRoomScene.
// Renders a translucent box at the bottom-center of the screen, fades
// each line in/out in sequence, then calls onComplete and tears the
// elements down. UI-camera friendly (scrollFactor 0).

import Phaser from 'phaser'

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
  const box = scene.add
    .rectangle(width / 2, height / 2 + 100, width - 80, 70, 0x0e1116, 0.85)
    .setStrokeStyle(1, 0x2a323d)
    .setScrollFactor(0)
    .setDepth(110)
    .setAlpha(0)
  const text = scene.add
    .text(width / 2, height / 2 + 100, '', {
      fontSize: '13px',
      fontFamily: 'monospace',
      color,
      align: 'center',
      wordWrap: { width: width - 120 },
    })
    .setOrigin(0.5)
    .setScrollFactor(0)
    .setDepth(111)
    .setAlpha(0)
  // Small "click to continue" hint inside the box — only visible while
  // a line is fully shown and waiting for input.
  const hint = scene.add
    .text(width / 2 + (width - 80) / 2 - 14, height / 2 + 100 + 22, 'click ▸', {
      fontSize: '10px',
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
