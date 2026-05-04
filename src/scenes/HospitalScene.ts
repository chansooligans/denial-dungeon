import Phaser from 'phaser'
import { NPCS } from '../content/npcs'
import { LEVELS } from '../content/levels'
import { getMapForLevel } from '../content/maps'
import type { MapDef } from '../content/maps'
import { getState, saveGame } from '../state'
import type { NPC } from '../types'

const TILE = 32

const TILE_TEXTURES: Record<string, { floor: string; obj?: string; solid?: boolean }> = {
  'W': { floor: 'h_wall', solid: true },
  'D': { floor: 'h_door' },
  '.': { floor: 'h_floor' },
  '~': { floor: 'h_floor2' },
  '_': { floor: 'h_carpet' },
  'c': { floor: 'h_floor', obj: 'h_desk' },
  'h': { floor: 'h_floor', obj: 'h_chair' },
  'E': { floor: 'h_floor', obj: 'h_equipment' },
  'P': { floor: 'h_floor', obj: 'h_plant' },
  'w': { floor: 'h_floor', obj: 'h_water', solid: true },
  'F': { floor: 'h_floor', obj: 'h_cabinet', solid: true },
  'B': { floor: 'h_floor', obj: 'h_whiteboard', solid: true },
  'R': { floor: 'h_floor', obj: 'h_counter', solid: true },
  'V': { floor: 'h_floor', obj: 'h_vending', solid: true },
  'b': { floor: 'h_floor', obj: 'h_bulletin', solid: true },
  'H': { floor: 'h_floor', obj: 'h_bed', solid: true },
  'X': { floor: 'h_floor', obj: 'h_fax' },
}

interface NPCSprite {
  sprite: Phaser.GameObjects.Image
  npc: NPC
  label: Phaser.GameObjects.Text
}

export class HospitalScene extends Phaser.Scene {
  private player!: Phaser.GameObjects.Image
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys
  private npcSprites: NPCSprite[] = []
  private interactPrompt!: Phaser.GameObjects.Text
  private nearbyNpc: NPCSprite | null = null
  private canMove = true
  private playerTileX = 0
  private playerTileY = 0
  private wasdKeys!: Record<string, Phaser.Input.Keyboard.Key>
  private hudHp!: Phaser.GameObjects.Text
  private hudLevel!: Phaser.GameObjects.Text
  private crackSprite!: Phaser.GameObjects.Graphics
  private crackPrompt!: Phaser.GameObjects.Text
  private mapDef!: MapDef

  constructor() {
    super('Hospital')
  }

  create() {
    const state = getState()
    this.mapDef = getMapForLevel(state.currentLevel)

    this.playerTileX = this.mapDef.playerStart.x
    this.playerTileY = this.mapDef.playerStart.y
    this.canMove = true
    this.npcSprites = []

    this.cameras.main.setBackgroundColor(0x0e1116)

    this.buildMap()
    this.placeCrack()
    this.placePlayer()
    this.placeNPCs()
    this.setupInput()
    this.buildUI()
    this.buildHUD()

    this.cameras.main.startFollow(this.player, true, 0.1, 0.1)
    this.cameras.main.setZoom(1.5)
    this.cameras.main.setBounds(0, 0, this.mapDef.width * TILE, this.mapDef.height * TILE)

    this.events.on('resume', () => {
      this.canMove = true
      this.refreshHUD()
    })
  }

  private buildMap() {
    const { width: mw, height: mh, layout } = this.mapDef

    for (let y = 0; y < mh; y++) {
      const row = layout[y] || ''
      for (let x = 0; x < mw; x++) {
        const ch = row[x] || '.'
        const px = x * TILE + TILE / 2
        const py = y * TILE + TILE / 2
        const tileDef = TILE_TEXTURES[ch] || TILE_TEXTURES['.']

        this.add.image(px, py, tileDef.floor).setScale(2)

        if (tileDef.obj) {
          this.add.image(px, py, tileDef.obj).setScale(2).setDepth(2)
        }
      }
    }
  }

  private placeCrack() {
    const ct = this.mapDef.crackTile
    const px = ct.x * TILE + TILE / 2
    const py = ct.y * TILE + TILE / 2

    this.crackSprite = this.add.graphics().setDepth(3)
    this.crackSprite.lineStyle(2, 0xb18bd6, 0.6)
    this.crackSprite.lineBetween(px - 8, py - 12, px + 2, py)
    this.crackSprite.lineBetween(px + 2, py, px - 4, py + 12)
    this.crackSprite.lineStyle(1, 0xb18bd6, 0.3)
    this.crackSprite.lineBetween(px + 2, py, px + 8, py + 6)

    this.tweens.add({
      targets: this.crackSprite,
      alpha: 0.4,
      duration: 2000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    })

    this.crackPrompt = this.add.text(px, py - 24, '[E] Enter the crack', {
      fontSize: '9px', fontFamily: 'monospace', color: '#b18bd6',
      backgroundColor: '#0e1116',
      padding: { x: 4, y: 2 },
    }).setOrigin(0.5).setDepth(20).setVisible(false)
  }

  private placePlayer() {
    this.player = this.add.image(
      this.playerTileX * TILE + TILE / 2,
      this.playerTileY * TILE + TILE / 2,
      'player'
    ).setScale(2).setDepth(10)
  }

  private placeNPCs() {
    const state = getState()
    const level = LEVELS[state.currentLevel - 1]
    const activeNpcs = level?.npcsActive ?? Object.keys(NPCS)

    for (const p of this.mapDef.npcPlacements) {
      if (!activeNpcs.includes(p.npcId)) continue
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

  private buildHUD() {
    const state = getState()
    const level = LEVELS[state.currentLevel - 1]

    this.hudLevel = this.add.text(10, 10, `Level ${state.currentLevel}: ${level?.title ?? ''}`, {
      fontSize: '10px', fontFamily: 'monospace', color: '#7ee2c1',
      backgroundColor: '#0e111680',
      padding: { x: 4, y: 2 },
    }).setScrollFactor(0).setDepth(100)

    this.hudHp = this.add.text(10, 28, '', {
      fontSize: '9px', fontFamily: 'monospace', color: '#ef5b7b',
      backgroundColor: '#0e111680',
      padding: { x: 4, y: 2 },
    }).setScrollFactor(0).setDepth(100)

    this.refreshHUD()
  }

  private refreshHUD() {
    const state = getState()
    this.hudHp.setText(`HP: ${state.resources.hp}/${state.resources.maxHp}  Rep: ${state.resources.reputation}  Audit: ${state.resources.auditRisk}%`)
  }

  update() {
    if (!this.canMove) return

    let dx = 0
    let dy = 0

    if (this.cursors.left.isDown || this.wasdKeys.A.isDown) dx = -1
    else if (this.cursors.right.isDown || this.wasdKeys.D.isDown) dx = 1
    else if (this.cursors.up.isDown || this.wasdKeys.W.isDown) dy = -1
    else if (this.cursors.down.isDown || this.wasdKeys.S.isDown) dy = 1

    if (dx !== 0 || dy !== 0) {
      this.tryMove(dx, dy)
    }

    this.checkNpcProximity()
  }

  private isSolid(x: number, y: number): boolean {
    const { width: mw, height: mh, layout } = this.mapDef
    if (x < 0 || x >= mw || y < 0 || y >= mh) return true
    const ch = layout[y]?.[x] || '.'
    const def = TILE_TEXTURES[ch]
    return def?.solid === true
  }

  private tryMove(dx: number, dy: number) {
    const newX = this.playerTileX + dx
    const newY = this.playerTileY + dy

    if (this.isSolid(newX, newY)) return

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
      this.crackPrompt.setVisible(false)
    } else {
      this.interactPrompt.setVisible(false)

      const ct = this.mapDef.crackTile
      const crackPx = ct.x * TILE + TILE / 2
      const crackPy = ct.y * TILE + TILE / 2
      const crackDist = Phaser.Math.Distance.Between(
        this.player.x, this.player.y, crackPx, crackPy
      )
      this.crackPrompt.setVisible(crackDist < TILE * 2)
    }
  }

  private interact() {
    if (this.nearbyNpc) {
      this.canMove = false
      this.interactPrompt.setVisible(false)

      this.scene.pause()
      this.scene.launch('Dialogue', {
        dialogueKey: this.nearbyNpc.npc.dialogueKey,
        callingScene: 'Hospital',
      })
      return
    }

    const ct = this.mapDef.crackTile
    const crackPx = ct.x * TILE + TILE / 2
    const crackPy = ct.y * TILE + TILE / 2
    const crackDist = Phaser.Math.Distance.Between(
      this.player.x, this.player.y, crackPx, crackPy
    )
    if (crackDist < TILE * 2) {
      const state = getState()
      state.inWaitingRoom = true
      saveGame()
      this.scene.start('WaitingRoom')
    }
  }
}
