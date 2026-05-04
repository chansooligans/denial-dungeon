import Phaser from 'phaser'
import { FACTION_COLOR } from '../types'
import type { Faction } from '../types'

export class BootScene extends Phaser.Scene {
  constructor() {
    super('Boot')
  }

  create() {
    this.generateSprites()
    this.scene.start('Title')
  }

  private generateSprites() {
    // Player sprite — 16x16 white/cyan humanoid
    const player = this.make.graphics({ x: 0, y: 0 })
    player.fillStyle(0x7ee2c1)
    player.fillRect(5, 0, 6, 4) // head
    player.fillRect(4, 4, 8, 8) // torso
    player.fillRect(4, 12, 3, 4) // left leg
    player.fillRect(9, 12, 3, 4) // right leg
    player.fillRect(1, 5, 3, 6) // left arm
    player.fillRect(12, 5, 3, 6) // right arm
    player.generateTexture('player', 16, 16)
    player.destroy()

    // Player dash ghost
    const ghost = this.make.graphics({ x: 0, y: 0 })
    ghost.fillStyle(0x7ee2c1, 0.3)
    ghost.fillRect(5, 0, 6, 4)
    ghost.fillRect(4, 4, 8, 8)
    ghost.fillRect(4, 12, 3, 4)
    ghost.fillRect(9, 12, 3, 4)
    ghost.generateTexture('player_ghost', 16, 16)
    ghost.destroy()

    // Enemy sprites per faction — 16x16 document/entity shapes
    const factions: Faction[] = ['payer', 'provider', 'vendor', 'patient', 'employer', 'system']
    for (const f of factions) {
      const color = FACTION_COLOR[f]
      const g = this.make.graphics({ x: 0, y: 0 })
      // Document shape with colored border
      g.fillStyle(0x1f262f)
      g.fillRect(2, 1, 12, 14)
      g.lineStyle(1, color)
      g.strokeRect(2, 1, 12, 14)
      // Colored accent bar at top
      g.fillStyle(color)
      g.fillRect(3, 2, 10, 3)
      // "Text lines"
      g.fillStyle(0x8b95a5)
      g.fillRect(4, 7, 8, 1)
      g.fillRect(4, 9, 6, 1)
      g.fillRect(4, 11, 7, 1)
      g.generateTexture(`enemy_${f}`, 16, 16)
      g.destroy()
    }

    // Boss sprite — larger 24x24
    const boss = this.make.graphics({ x: 0, y: 0 })
    boss.fillStyle(0x1f262f)
    boss.fillRect(2, 2, 20, 20)
    boss.lineStyle(2, 0xef5b7b)
    boss.strokeRect(2, 2, 20, 20)
    boss.fillStyle(0xef5b7b)
    boss.fillRect(4, 4, 16, 4)
    boss.fillStyle(0xf0a868)
    boss.fillRect(6, 10, 12, 2)
    boss.fillRect(6, 13, 10, 2)
    boss.fillRect(6, 16, 8, 2)
    boss.generateTexture('enemy_boss', 24, 24)
    boss.destroy()

    // Projectile — player
    const pBullet = this.make.graphics({ x: 0, y: 0 })
    pBullet.fillStyle(0x7ee2c1)
    pBullet.fillCircle(4, 4, 3)
    pBullet.generateTexture('bullet_player', 8, 8)
    pBullet.destroy()

    // Projectile — enemy (per faction)
    for (const f of factions) {
      const b = this.make.graphics({ x: 0, y: 0 })
      b.fillStyle(FACTION_COLOR[f])
      b.fillCircle(3, 3, 3)
      b.generateTexture(`bullet_${f}`, 6, 6)
      b.destroy()
    }

    // Wall tile
    const wall = this.make.graphics({ x: 0, y: 0 })
    wall.fillStyle(0x2a323d)
    wall.fillRect(0, 0, 16, 16)
    wall.lineStyle(1, 0x3a4a5d)
    wall.strokeRect(0, 0, 16, 16)
    wall.generateTexture('wall', 16, 16)
    wall.destroy()

    // Floor tile
    const floor = this.make.graphics({ x: 0, y: 0 })
    floor.fillStyle(0x161b22)
    floor.fillRect(0, 0, 16, 16)
    // subtle grid lines
    floor.lineStyle(1, 0x1c2129, 0.5)
    floor.strokeRect(0, 0, 16, 16)
    floor.generateTexture('floor', 16, 16)
    floor.destroy()

    // Door tile
    const door = this.make.graphics({ x: 0, y: 0 })
    door.fillStyle(0x7ee2c1, 0.3)
    door.fillRect(0, 0, 16, 16)
    door.lineStyle(1, 0x7ee2c1)
    door.strokeRect(1, 1, 14, 14)
    door.generateTexture('door', 16, 16)
    door.destroy()

    // Heart/HP icon
    const heart = this.make.graphics({ x: 0, y: 0 })
    heart.fillStyle(0xef5b7b)
    heart.fillCircle(4, 4, 3)
    heart.fillCircle(10, 4, 3)
    heart.fillTriangle(1, 5, 13, 5, 7, 12)
    heart.generateTexture('heart', 14, 13)
    heart.destroy()
  }
}
