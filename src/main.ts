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

installDevPanel()
installDebugRibbon()

// Track scene starts via the SceneManager event so the ribbon shows
// transitions even from code paths we haven't manually instrumented.
game.events.on(Phaser.Core.Events.READY, () => {
  for (const s of game.scene.scenes) {
    s.events.on(Phaser.Scenes.Events.START, () => debugEvent(`start ${s.scene.key}`))
    s.events.on(Phaser.Scenes.Events.SHUTDOWN, () => debugEvent(`shut ${s.scene.key}`))
  }
})
