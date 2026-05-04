import Phaser from 'phaser'
import { BootScene } from './scenes/BootScene'
import { IntroScene } from './scenes/IntroScene'
import { TitleScene } from './scenes/TitleScene'
import { HospitalScene } from './scenes/HospitalScene'
import { DialogueScene } from './scenes/DialogueScene'
import { BattleScene } from './scenes/BattleScene'
import { FormScene } from './scenes/FormScene'

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
  scene: [BootScene, IntroScene, TitleScene, HospitalScene, DialogueScene, BattleScene, FormScene],
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
}

const game = new Phaser.Game(config)
;(window as any).__PHASER_GAME__ = game
