import Phaser from 'phaser'

// Small tappable fullscreen toggle for mobile play. Browsers require a
// user gesture to enter fullscreen, so this lives as a button rather than
// auto-triggering. Used by Intro, Title, and TouchOverlay.
export function addFullscreenButton(scene: Phaser.Scene, x = 16, y = 16) {
  const btn = scene.add.text(x, y, '⛶', {
    fontSize: '20px', fontFamily: 'monospace', color: '#7ee2c1',
    backgroundColor: '#0e1116cc',
    padding: { left: 8, right: 8, top: 4, bottom: 4 },
  }).setOrigin(0, 0).setDepth(1100).setScrollFactor(0)
    .setInteractive({ useHandCursor: true })

  btn.on('pointerdown', (_p: Phaser.Input.Pointer, _x: number, _y: number, event?: { stopPropagation?: () => void }) => {
    event?.stopPropagation?.()
    if (scene.scale.isFullscreen) scene.scale.stopFullscreen()
    else scene.scale.startFullscreen()
  })

  return btn
}
