import Phaser from 'phaser'
import { BootScene } from './scenes/BootScene'
import { IntroScene } from './scenes/IntroScene'
import { TitleScene } from './scenes/TitleScene'
import { HospitalScene } from './scenes/HospitalScene'
import { DialogueScene } from './scenes/DialogueScene'
import { PuzzleBattleScene } from './scenes/PuzzleBattleScene'
import { FormScene } from './scenes/FormScene'
import { WaitingRoomScene } from './scenes/WaitingRoomScene'
import { CodexScene } from './scenes/CodexScene'
import { TouchOverlay } from './scenes/TouchOverlay'
import { installDevPanel } from './dev/devPanel'
import { installDebugRibbon, debugEvent } from './scenes/debugRibbon'
import { addFullscreenButton } from './scenes/fullscreenButton'
import { addMuteButton } from './scenes/muteButton'

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: 960,
  height: 640,
  parent: 'game',
  pixelArt: true,
  backgroundColor: '#0e1116',
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: 0 },
      debug: false,
    },
  },
  scene: [BootScene, IntroScene, TitleScene, HospitalScene, DialogueScene, PuzzleBattleScene, FormScene, WaitingRoomScene, CodexScene, TouchOverlay],
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
}

const game = new Phaser.Game(config)
;(window as any).__PHASER_GAME__ = game

// Mobile audio unlock — iOS Safari and Chrome on Android suspend the
// Web Audio AudioContext until a user gesture. Phaser has its own
// unlock mechanism, but it only listens on the canvas and can miss
// taps on DOM overlays (skip button, touch controls, fullscreen/mute
// buttons). This listener catches ANY first touch/click on the page
// and explicitly resumes the AudioContext so subsequent play() calls
// succeed. Runs once, then removes itself.
function unlockMobileAudio() {
  const sm = game.sound as any
  const ctx: AudioContext | undefined = sm?.context
  if (!ctx) return
  if (ctx.state !== 'suspended') return
  const resume = () => {
    ctx.resume().then(() => {
      // Poke Phaser's internal locked flag so queued sounds drain.
      if (sm.locked !== undefined) sm.locked = false
      if (typeof sm.unlock === 'function') sm.unlock()
      debugEvent('audio-ctx-resumed')
    })
    document.removeEventListener('touchstart', resume, true)
    document.removeEventListener('touchend', resume, true)
    document.removeEventListener('click', resume, true)
  }
  // Use capture so we fire before any stopPropagation in the tree.
  document.addEventListener('touchstart', resume, true)
  document.addEventListener('touchend', resume, true)
  document.addEventListener('click', resume, true)
}
game.events.once(Phaser.Core.Events.READY, unlockMobileAudio)

installDevPanel()
installDebugRibbon()
// Fullscreen + mute are pure DOM globals — mount them once at game
// init so they're always present regardless of which scene is active.
// Pass `null as any` since the Phaser scene argument is unused.
addFullscreenButton(null as unknown as Phaser.Scene)
addMuteButton(null as unknown as Phaser.Scene)

// Track scene starts via the SceneManager event so the ribbon shows
// transitions even from code paths we haven't manually instrumented.
game.events.on(Phaser.Core.Events.READY, () => {
  for (const s of game.scene.scenes) {
    s.events.on(Phaser.Scenes.Events.START, () => debugEvent(`start ${s.scene.key}`))
    s.events.on(Phaser.Scenes.Events.SHUTDOWN, () => debugEvent(`shut ${s.scene.key}`))
  }
})
