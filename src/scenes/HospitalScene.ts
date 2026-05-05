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
  'L': { floor: 'h_door', solid: true },  // locked door — visible but impassable (foreshadow)
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

// Tiles that act as room boundaries for flood-fill: walls and doors.
// (Doors are passable for the player but separate rooms visually.)
const BARRIER_CHARS = new Set(['W', 'D', 'L'])

const VIS_HIDDEN = 0
const VIS_VISITED = 1
const VIS_CURRENT = 2

const ALPHA_FOR_STATE = [0, 0.28, 1]

interface NPCSprite {
  sprite: Phaser.GameObjects.Image
  npc: NPC
  label: Phaser.GameObjects.Text
  tileX: number
  tileY: number
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
  private gapSprite!: Phaser.GameObjects.Graphics
  private gapPrompt!: Phaser.GameObjects.Text
  private mapDef!: MapDef

  // Room visibility state
  private tileFloorSprites: Phaser.GameObjects.Image[][] = []
  private tileObjSprites: (Phaser.GameObjects.Image | null)[][] = []
  private roomIds: number[][] = []
  private tileVisState: number[][] = []
  private currentRoomId = -1

  // Mini-map
  private miniMapBg!: Phaser.GameObjects.Graphics
  private miniMapTiles!: Phaser.GameObjects.Graphics
  private miniMapPlayer!: Phaser.GameObjects.Graphics
  private miniMapCell = 2
  private miniMapX = 0
  private miniMapY = 0
  private uiCamera!: Phaser.Cameras.Scene2D.Camera

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
    this.currentRoomId = -1

    this.cameras.main.setBackgroundColor(0x05070a)

    this.buildMap()
    this.placeGap()
    this.placePlayer()
    this.placeNPCs()
    this.setupInput()
    this.buildUI()
    this.buildHUD()

    this.cameras.main.startFollow(this.player, true, 0.1, 0.1)
    this.cameras.main.setZoom(1.5)
    this.cameras.main.setBounds(0, 0, this.mapDef.width * TILE, this.mapDef.height * TILE)

    // Dedicated UI camera (zoom 1, no scroll) so HUD/mini-map aren't affected
    // by the main camera's zoom or follow.
    this.uiCamera = this.cameras.add(0, 0, this.scale.width, this.scale.height)
    this.uiCamera.setScroll(0, 0)

    this.buildMiniMap()

    this.enterRoomAt(this.playerTileX, this.playerTileY)

    this.events.on('resume', () => {
      this.canMove = true
      this.refreshHUD()
    })

    // Level-1 atmosphere: occasionally a sheet of paper scuttles across
    // the floor — a hint that the Waiting Room is bleeding through. No
    // interaction, no codex; just sensation. Higher levels skip this.
    if (state.currentLevel === 1) {
      this.scheduleGhostPaper()
    }

    // Mobile / accessibility: parallel scene with virtual D-pad + E + ESC.
    if (!this.scene.isActive('TouchOverlay')) this.scene.launch('TouchOverlay')
    // Deferred stop: when this scene shuts down, defer to the next tick
    // so the next scene has had a chance to start. If we're transitioning
    // to another scene that also wants the overlay (Hospital ⇄ WaitingRoom),
    // leave it running; otherwise stop it.
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      const sm = this.game.scene
      setTimeout(() => {
        if (!sm.isActive('Hospital') && !sm.isActive('WaitingRoom')) {
          sm.stop('TouchOverlay')
        }
      }, 0)
    })
  }

  private buildMap() {
    const { width: mw, height: mh, layout } = this.mapDef

    this.tileFloorSprites = Array.from({ length: mh }, () => new Array(mw))
    this.tileObjSprites = Array.from({ length: mh }, () => new Array(mw).fill(null))
    this.tileVisState = Array.from({ length: mh }, () => new Array(mw).fill(VIS_HIDDEN))

    for (let y = 0; y < mh; y++) {
      const row = layout[y] || ''
      for (let x = 0; x < mw; x++) {
        const ch = row[x] || '.'
        const px = x * TILE + TILE / 2
        const py = y * TILE + TILE / 2
        const tileDef = TILE_TEXTURES[ch] || TILE_TEXTURES['.']

        const floor = this.add.image(px, py, tileDef.floor).setScale(2).setAlpha(0)
        this.tileFloorSprites[y][x] = floor

        if (tileDef.obj) {
          const obj = this.add.image(px, py, tileDef.obj).setScale(2).setDepth(2).setAlpha(0)
          this.tileObjSprites[y][x] = obj
        }
      }
    }

    this.computeRooms()
  }

  private computeRooms() {
    const { width: mw, height: mh, layout } = this.mapDef
    this.roomIds = Array.from({ length: mh }, () => new Array(mw).fill(-1))
    let nextId = 0

    const isInterior = (x: number, y: number) => {
      if (x < 0 || x >= mw || y < 0 || y >= mh) return false
      const ch = layout[y]?.[x] || '.'
      return !BARRIER_CHARS.has(ch)
    }

    for (let y = 0; y < mh; y++) {
      for (let x = 0; x < mw; x++) {
        if (this.roomIds[y][x] !== -1) continue
        if (!isInterior(x, y)) continue

        const queue: [number, number][] = [[x, y]]
        this.roomIds[y][x] = nextId
        while (queue.length) {
          const [cx, cy] = queue.shift()!
          for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]] as const) {
            const nx = cx + dx
            const ny = cy + dy
            if (!isInterior(nx, ny)) continue
            if (this.roomIds[ny][nx] !== -1) continue
            this.roomIds[ny][nx] = nextId
            queue.push([nx, ny])
          }
        }
        nextId++
      }
    }
  }

  private placeGap() {
    const ct = this.mapDef.gapTile
    const px = ct.x * TILE + TILE / 2
    const py = ct.y * TILE + TILE / 2

    this.gapSprite = this.add.graphics().setDepth(3).setAlpha(0)
    this.gapSprite.lineStyle(2, 0xb18bd6, 0.6)
    this.gapSprite.lineBetween(px - 8, py - 12, px + 2, py)
    this.gapSprite.lineBetween(px + 2, py, px - 4, py + 12)
    this.gapSprite.lineStyle(1, 0xb18bd6, 0.3)
    this.gapSprite.lineBetween(px + 2, py, px + 8, py + 6)

    this.tweens.add({
      targets: this.gapSprite,
      alpha: 0.4,
      duration: 2000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    })

    this.gapPrompt = this.add.text(px, py - 24, '[E] Enter the gap', {
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

      const sprite = this.add.image(px, py, npc.spriteKey).setScale(2).setDepth(5).setAlpha(0)

      const label = this.add.text(px, py - 22, npc.name, {
        fontSize: '8px', fontFamily: 'monospace', color: '#7ee2c1',
      }).setOrigin(0.5).setDepth(6).setAlpha(0)

      this.npcSprites.push({ sprite, npc, label, tileX: p.tileX, tileY: p.tileY })
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

  private buildMiniMap() {
    const { width: mw, height: mh } = this.mapDef
    const screenW = this.scale.width

    this.miniMapCell = Math.max(1, Math.min(3, Math.floor(180 / mw))) || 1
    const innerW = mw * this.miniMapCell
    const innerH = mh * this.miniMapCell
    const pad = 4
    const totalW = innerW + pad * 2
    const totalH = innerH + pad * 2
    this.miniMapX = screenW - totalW - 8
    this.miniMapY = 8

    this.miniMapBg = this.add.graphics().setDepth(99)
    this.miniMapBg.fillStyle(0x0e1116, 0.85)
    this.miniMapBg.fillRect(this.miniMapX, this.miniMapY, totalW, totalH)
    this.miniMapBg.lineStyle(1, 0x7ee2c1, 0.6)
    this.miniMapBg.strokeRect(this.miniMapX + 0.5, this.miniMapY + 0.5, totalW - 1, totalH - 1)

    this.miniMapTiles = this.add.graphics().setDepth(100)
    this.miniMapPlayer = this.add.graphics().setDepth(101)

    // Main camera ignores the minimap; UI camera ignores everything else.
    this.cameras.main.ignore([this.miniMapBg, this.miniMapTiles, this.miniMapPlayer])
    this.uiCamera.ignore(this.children.list.filter(
      c => c !== this.miniMapBg && c !== this.miniMapTiles && c !== this.miniMapPlayer
    ))
  }

  private refreshHUD() {
    const state = getState()
    this.hudHp.setText(
      `HP: ${state.resources.hp}/${state.resources.maxHp}  ` +
      `Rep: ${state.resources.reputation}  ` +
      `Audit: ${state.resources.auditRisk}%  ` +
      `Stress: ${state.resources.stress}`
    )
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
      if (newX === ns.tileX && newY === ns.tileY) return
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

    this.enterRoomAt(newX, newY)
    this.updateMiniMapPlayer()
  }

  private enterRoomAt(x: number, y: number) {
    const newRoomId = this.roomIds[y]?.[x] ?? -1
    // -1 means standing on a door/wall — keep current room.
    if (newRoomId === -1 || newRoomId === this.currentRoomId) return

    // Demote any tile currently lit to "visited."
    for (let yy = 0; yy < this.tileVisState.length; yy++) {
      const row = this.tileVisState[yy]
      for (let xx = 0; xx < row.length; xx++) {
        if (row[xx] === VIS_CURRENT) row[xx] = VIS_VISITED
      }
    }

    this.revealRoom(newRoomId)
    this.currentRoomId = newRoomId
    this.applyTileVisibility()
    this.applyEntityVisibility()
    this.redrawMiniMapTiles()
  }

  private revealRoom(roomId: number) {
    const { width: mw, height: mh } = this.mapDef
    for (let y = 0; y < mh; y++) {
      for (let x = 0; x < mw; x++) {
        if (this.roomIds[y][x] !== roomId) continue
        this.tileVisState[y][x] = VIS_CURRENT
        // Reveal adjacent walls/doors so room boundaries are visible.
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            if (dx === 0 && dy === 0) continue
            const nx = x + dx
            const ny = y + dy
            if (nx < 0 || nx >= mw || ny < 0 || ny >= mh) continue
            if (this.roomIds[ny][nx] === -1) {
              this.tileVisState[ny][nx] = VIS_CURRENT
            }
          }
        }
      }
    }
  }

  private applyTileVisibility() {
    const { width: mw, height: mh } = this.mapDef
    for (let y = 0; y < mh; y++) {
      for (let x = 0; x < mw; x++) {
        const a = ALPHA_FOR_STATE[this.tileVisState[y][x]]
        this.tileFloorSprites[y][x].setAlpha(a)
        const obj = this.tileObjSprites[y][x]
        if (obj) obj.setAlpha(a)
      }
    }
  }

  private applyEntityVisibility() {
    const ct = this.mapDef.gapTile
    const gapVis = this.tileVisState[ct.y]?.[ct.x] ?? VIS_HIDDEN
    this.gapSprite.setVisible(gapVis !== VIS_HIDDEN)

    for (const ns of this.npcSprites) {
      const v = this.tileVisState[ns.tileY]?.[ns.tileX] ?? VIS_HIDDEN
      const a = ALPHA_FOR_STATE[v]
      ns.sprite.setAlpha(a)
      ns.label.setAlpha(a)
    }
  }

  private redrawMiniMapTiles() {
    const { width: mw, height: mh, layout } = this.mapDef
    const g = this.miniMapTiles
    const cell = this.miniMapCell
    const ox = this.miniMapX + 4
    const oy = this.miniMapY + 4

    g.clear()

    for (let y = 0; y < mh; y++) {
      for (let x = 0; x < mw; x++) {
        const state = this.tileVisState[y][x]
        if (state === VIS_HIDDEN) continue

        const ch = layout[y]?.[x] || '.'
        let color: number
        if (ch === 'W') color = 0x3a3f4d
        else if (ch === 'D' || ch === 'L') color = 0xf4d06f
        else color = 0xa89377

        const alpha = state === VIS_CURRENT ? 1 : 0.45
        g.fillStyle(color, alpha)
        g.fillRect(ox + x * cell, oy + y * cell, cell, cell)
      }
    }

    const ct = this.mapDef.gapTile
    if (this.tileVisState[ct.y]?.[ct.x] !== VIS_HIDDEN) {
      g.fillStyle(0xb18bd6, 1)
      g.fillRect(ox + ct.x * cell - 1, oy + ct.y * cell - 1, cell + 2, cell + 2)
    }

    this.updateMiniMapPlayer()
  }

  private updateMiniMapPlayer() {
    const cell = this.miniMapCell
    const ox = this.miniMapX + 4
    const oy = this.miniMapY + 4
    this.miniMapPlayer.clear()
    this.miniMapPlayer.fillStyle(0x7ee2c1, 1)
    this.miniMapPlayer.fillRect(
      ox + this.playerTileX * cell - 1,
      oy + this.playerTileY * cell - 1,
      cell + 2,
      cell + 2
    )
  }

  private checkNpcProximity() {
    let closest: NPCSprite | null = null
    let closestDist = Infinity

    for (const ns of this.npcSprites) {
      const v = this.tileVisState[ns.tileY]?.[ns.tileX] ?? VIS_HIDDEN
      if (v !== VIS_CURRENT) continue
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
      this.gapPrompt.setVisible(false)
    } else {
      this.interactPrompt.setVisible(false)

      const ct = this.mapDef.gapTile
      const gapVis = this.tileVisState[ct.y]?.[ct.x] ?? VIS_HIDDEN
      const gapPx = ct.x * TILE + TILE / 2
      const gapPy = ct.y * TILE + TILE / 2
      const gapDist = Phaser.Math.Distance.Between(
        this.player.x, this.player.y, gapPx, gapPy
      )
      this.gapPrompt.setVisible(gapVis === VIS_CURRENT && gapDist < TILE * 2)
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

    const ct = this.mapDef.gapTile
    const gapPx = ct.x * TILE + TILE / 2
    const gapPy = ct.y * TILE + TILE / 2
    const gapDist = Phaser.Math.Distance.Between(
      this.player.x, this.player.y, gapPx, gapPy
    )
    if (gapDist < TILE * 2) {
      const state = getState()
      state.inWaitingRoom = true
      saveGame()
      this.scene.start('WaitingRoom')
    }
  }

  /**
   * Periodically launch a "ghost paper" — a faint piece of paper
   * scuttles across the camera viewport. Atmosphere only; no
   * interaction. Hints that the Waiting Room is bleeding through.
   *
   * Spawned in screen-space (scrollFactor 0) so it's always visible
   * regardless of where the camera is following the player.
   */
  private scheduleGhostPaper() {
    const fire = () => {
      // Skip if we're paused, transitioning, or generally not focused.
      if (!this.scene.isActive()) return
      this.spawnGhostPaper()
      // Re-arm with a randomized interval so it doesn't feel timed.
      this.time.delayedCall(Phaser.Math.Between(35_000, 70_000), fire)
    }
    // First glimpse fires after the player has had a moment to orient.
    this.time.delayedCall(Phaser.Math.Between(15_000, 30_000), fire)
  }

  private spawnGhostPaper() {
    const { width, height } = this.scale
    // Pick a horizontal direction; spawn just off the matching edge,
    // drift across with a slight vertical wobble + rotation.
    const goingRight = Phaser.Math.Between(0, 1) === 0
    const startX = goingRight ? -32 : width + 32
    const endX = goingRight ? width + 32 : -32
    const y = Phaser.Math.Between(Math.floor(height * 0.55), height - 80)

    const paper = this.add.image(startX, y, 'wr_paper')
      .setScale(2.2)
      .setAlpha(0)
      .setAngle(Phaser.Math.Between(-25, 25))
      .setScrollFactor(0)
      .setDepth(15)

    // The UI camera at zoom 1 owns scrollFactor-0 widgets cleanly.
    this.cameras.main.ignore(paper)

    const duration = Phaser.Math.Between(1800, 3200)
    this.tweens.add({
      targets: paper,
      alpha: 0.55,
      duration: 300,
    })
    this.tweens.add({
      targets: paper,
      x: endX,
      y: y + Phaser.Math.Between(-12, 12),
      angle: paper.angle + Phaser.Math.Between(-30, 30),
      duration,
      ease: 'Sine.easeInOut',
      onComplete: () => {
        this.tweens.add({
          targets: paper,
          alpha: 0,
          duration: 250,
          onComplete: () => paper.destroy(),
        })
      },
    })
  }
}
