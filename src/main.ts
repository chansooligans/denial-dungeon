import Phaser from 'phaser'
import { BootScene } from './scenes/BootScene'
import { GameScene } from './scenes/GameScene'
import { HUDScene } from './scenes/HUDScene'
import { TitleScene } from './scenes/TitleScene'
import { BoonScene } from './scenes/BoonScene'
import { SummaryScene } from './scenes/SummaryScene'

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
  scene: [BootScene, TitleScene, GameScene, HUDScene, BoonScene, SummaryScene],
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
}

const game = new Phaser.Game(config)
;(window as any).__PHASER_GAME__ = game
