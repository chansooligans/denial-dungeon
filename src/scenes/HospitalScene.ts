import Phaser from 'phaser'
import { NPCS } from '../content/npcs'
import type { NPC } from '../types'

const TILE = 32
const MAP_W = 30
const MAP_H = 20

const LAYOUT = [
  'WWWWWWWWWWWWWWWWWWWWWWWWWWWWWW',
  'W............................W',
  'W............................W',
  'W...WWDWW....WWDWW....WWWW..W',
  'W...W...W....W...W....W..W..W',
  'W...W.c.W....W.c.W....W..W..W',
  'W...W...W....W...W....WDWW..W',
  'W...WWWWW....WWWWW..........W',
  'W............................W',
  'W............................W',
  'W.....E........E............W',
  'W............................W',
  'W...WWDWW....WWDWW....WWDWW.W',
  'W...W...W....W...W....W...W.W',
  'W...W.c.W....W.c.W....W.c.W.W',
  'W...W...W....W...W....W...W.W',
  'W...WWWWW....WWWWW....WWWWW.W',
  'W............................W',
  'W............................W',
  'WWWWWWWWWWWWWWWWWWWWWWWWWWWWWW',
]

interface NPCSprite {
  sprite: Phaser.GameObjects.Image
  npc: NPC
  label: Phaser.GameObjects.Text
}

export class HospitalScene extends Phaser.Scene {
  private player!: Phaser.GameObjects.Image
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys
  private walls: Phaser.GameObjects.Image[] = []
  private npcSprites: NPCSprite[] = []
  private interactPrompt!: Phaser.GameObjects.Text
  private nearbyNpc: NPCSprite | null = null
  private canMove = true
  private playerTileX = 4
  private playerTileY = 8
  private wasdKeys!: Record<string, Phaser.Input.Keyboard.Key>

  constructor() {
    super('Hospital')
  }

  create() {
    this.cameras.main.setBackgroundColor(0x0e1116)
    this.buildMap()
    this.placePlayer()
    this.placeNPCs()
    this.setupInput()
    this.buildUI()

    this.cameras.main.startFollow(this.player, true, 0.1, 0.1)
    this.cameras.main.setZoom(1.5)

    this.events.on('resume', () => {
      this.canMove = true
    })
  }

  private buildMap() {
    for (let y = 0; y < MAP_H; y++) {
      for (let x = 0; x < MAP_W; x++) {
        const ch = LAYOUT[y][x]
        const px = x * TILE + TILE / 2
        const py = y * TILE + TILE / 2

        if (ch === 'W') {
          this.add.image(px, py, 'h_wall').setScale(2)
          this.walls.push(this.add.image(px, py, 'h_wall').setScale(2).setAlpha(0))
        } else if (ch === 'D') {
          this.add.image(px, py, 'h_door').setScale(2)
        } else if (ch === 'c') {
          this.add.image(px, py, 'h_floor').setScale(2)
          this.add.image(px, py, 'h_desk').setScale(2)
        } else if (ch === 'E') {
          this.add.image(px, py, 'h_floor').setScale(2)
          this.add.image(px, py, 'h_equipment').setScale(2)
        } else {
          this.add.image(px, py, 'h_floor').setScale(2)
        }
      }
    }
  }

  private placePlayer() {
    this.player = this.add.image(
      this.playerTileX * TILE + TILE / 2,
      this.playerTileY * TILE + TILE / 2,
      'player'
    ).setScale(2).setDepth(10)
  }

  private placeNPCs() {
    const placements: { npcId: string; tileX: number; tileY: number }[] = [
      { npcId: 'dana', tileX: 6, tileY: 1 },
      { npcId: 'kim', tileX: 5, tileY: 5 },
      { npcId: 'martinez', tileX: 14, tileY: 5 },
      { npcId: 'jordan', tileX: 5, tileY: 14 },
      { npcId: 'pat', tileX: 14, tileY: 14 },
      { npcId: 'alex', tileX: 23, tileY: 14 },
      { npcId: 'sam', tileX: 23, tileY: 5 },
    ]

    for (const p of placements) {
      const npc = NPCS[p.npcId]
      if (!npc) continue

      const px = p.tileX * TILE + TILE / 2
      const py = p.tileY * TILE + TILE / 2

      const sprite = this.add.image(px, py, npc.spriteKey).setScale(2).setDepth(5)

      const label = this.add.text(px, py - 22, npc.name, {
        fontSize: '8px', fontFamily: 'monospace', color: '#7ee2c1',
      }).setOrigin(0.5).setDepth(6)

      this.npcSprites.push({ sprite, npc, label })
    }
  }

  private setupInput() {
    this.cursors = this.input.keyboard!.createCursorKeys()
    this.wasdKeys = {
      W: this.input.keyboard!.addKey('W'),
      A: this.input.keyboard!.addKey('A'),
      S: this.input.keyboard!.addKey('S'),
      D: this.input.keyboard!.addKey('D'),
    }
    this.input.keyboard!.on('keydown-E', () => this.interact())
    this.input.keyboard!.on('keydown-SPACE', () => this.interact())
  }

  private buildUI() {
    this.interactPrompt = this.add.text(0, 0, '[E] Talk', {
      fontSize: '9px', fontFamily: 'monospace', color: '#f4d06f',
      backgroundColor: '#0e1116',
      padding: { x: 4, y: 2 },
    }).setOrigin(0.5).setDepth(20).setVisible(false)
  }

  update() {
    if (!this.canMove) return

    let dx = 0
    let dy = 0

    if (Phaser.Input.Keyboard.JustDown(this.cursors.left) || Phaser.Input.Keyboard.JustDown(this.wasdKeys.A)) dx = -1
    else if (Phaser.Input.Keyboard.JustDown(this.cursors.right) || Phaser.Input.Keyboard.JustDown(this.wasdKeys.D)) dx = 1
    else if (Phaser.Input.Keyboard.JustDown(this.cursors.up) || Phaser.Input.Keyboard.JustDown(this.wasdKeys.W)) dy = -1
    else if (Phaser.Input.Keyboard.JustDown(this.cursors.down) || Phaser.Input.Keyboard.JustDown(this.wasdKeys.S)) dy = 1

    if (dx !== 0 || dy !== 0) {
      this.tryMove(dx, dy)
    }

    this.checkNpcProximity()
  }

  private tryMove(dx: number, dy: number) {
    const newX = this.playerTileX + dx
    const newY = this.playerTileY + dy

    if (newX < 0 || newX >= MAP_W || newY < 0 || newY >= MAP_H) return

    const ch = LAYOUT[newY][newX]
    if (ch === 'W') return

    // Check NPC collision
    for (const ns of this.npcSprites) {
      const npcTileX = Math.round((ns.sprite.x - TILE / 2) / TILE)
      const npcTileY = Math.round((ns.sprite.y - TILE / 2) / TILE)
      if (newX === npcTileX && newY === npcTileY) return
    }

    this.playerTileX = newX
    this.playerTileY = newY

    this.canMove = false
    this.tweens.add({
      targets: this.player,
      x: newX * TILE + TILE / 2,
      y: newY * TILE + TILE / 2,
      duration: 120,
      ease: 'Linear',
      onComplete: () => { this.canMove = true },
    })
  }

  private checkNpcProximity() {
    let closest: NPCSprite | null = null
    let closestDist = Infinity

    for (const ns of this.npcSprites) {
      const dist = Phaser.Math.Distance.Between(
        this.player.x, this.player.y,
        ns.sprite.x, ns.sprite.y
      )
      if (dist < TILE * 2 && dist < closestDist) {
        closest = ns
        closestDist = dist
      }
    }

    this.nearbyNpc = closest
    if (closest) {
      this.interactPrompt.setPosition(closest.sprite.x, closest.sprite.y - 36)
      this.interactPrompt.setVisible(true)
    } else {
      this.interactPrompt.setVisible(false)
    }
  }

  private interact() {
    if (!this.nearbyNpc) return

    this.canMove = false
    this.interactPrompt.setVisible(false)

    this.scene.pause()
    this.scene.launch('Dialogue', {
      dialogueKey: this.nearbyNpc.npc.dialogueKey,
      callingScene: 'Hospital',
    })
  }
}
