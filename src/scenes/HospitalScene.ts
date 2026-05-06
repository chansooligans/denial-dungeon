import Phaser from 'phaser'
import { NPCS } from '../content/npcs'
import { LEVELS } from '../content/levels'
import { HOSPITAL_MAP } from '../content/maps'
import type { MapDef } from '../content/maps'
import { getState, saveGame, consumePendingLevelBanner } from '../state'
import type { NPC } from '../types'

const TILE = 32

// 70s + David Lynch palette — applied as tints on top of existing
// sprites. Reads warm but uncanny: cream-tan floors, walnut walls,
// burnt-orange chairs, mustard counters, avocado plants. Cooler
// fluorescent tiles get replaced with a warm incandescent register.
const TINT = {
  floor:    0xc8b090, // cream-tan, scuffed
  floorAlt: 0xb89870, // slightly darker tan for ~ tiles (worn carpet patches)
  carpet:   0x8a4a30, // burgundy-cream carpet (entry rugs etc.)
  wall:     0x4a3220, // walnut wood paneling
  door:     0x9a6a3a, // brass door
  doorLock: 0x6a4828, // dim brass (locked)
  desk:     0x5a3820, // dark walnut
  chair:    0x9a4a28, // burnt orange
  equip:    0x6a5a4a, // dim taupe
  plant:    0x5a7028, // avocado green
  water:    0xc8a040, // mustard yellow (doubles as a "lamp" highlight)
  cabinet:  0x6a4828, // walnut cabinet
  whiteboard: 0xa89878, // off-cream board
  counter:  0xb08c30, // mustard counter laminate
  vending:  0x8a4a28, // burnt orange machine
  bulletin: 0x8a6840, // cork tan
  bed:      0xb09870, // tan
  fax:      0x6a5a4a, // dim taupe
} as const

const TILE_TEXTURES: Record<string, { floor: string; obj?: string; solid?: boolean; floorTint?: number; objTint?: number }> = {
  'W': { floor: 'h_wall',  solid: true, floorTint: TINT.wall },
  'D': { floor: 'h_door',  floorTint: TINT.door },
  'L': { floor: 'h_door',  solid: true, floorTint: TINT.doorLock },
  '.': { floor: 'h_floor', floorTint: TINT.floor },
  '~': { floor: 'h_floor2', floorTint: TINT.floorAlt },
  '_': { floor: 'h_carpet', floorTint: TINT.carpet },
  'c': { floor: 'h_floor', obj: 'h_desk',       floorTint: TINT.floor, objTint: TINT.desk },
  'h': { floor: 'h_floor', obj: 'h_chair',      floorTint: TINT.floor, objTint: TINT.chair },
  'E': { floor: 'h_floor', obj: 'h_equipment',  floorTint: TINT.floor, objTint: TINT.equip },
  'P': { floor: 'h_floor', obj: 'h_plant',      floorTint: TINT.floor, objTint: TINT.plant },
  'w': { floor: 'h_floor', obj: 'h_water',      solid: true, floorTint: TINT.floor, objTint: TINT.water },
  'F': { floor: 'h_floor', obj: 'h_cabinet',    solid: true, floorTint: TINT.floor, objTint: TINT.cabinet },
  'B': { floor: 'h_floor', obj: 'h_whiteboard', solid: true, floorTint: TINT.floor, objTint: TINT.whiteboard },
  'R': { floor: 'h_floor', obj: 'h_counter',    solid: true, floorTint: TINT.floor, objTint: TINT.counter },
  'V': { floor: 'h_floor', obj: 'h_vending',    solid: true, floorTint: TINT.floor, objTint: TINT.vending },
  'b': { floor: 'h_floor', obj: 'h_bulletin',   solid: true, floorTint: TINT.floor, objTint: TINT.bulletin },
  'H': { floor: 'h_floor', obj: 'h_bed',        solid: true, floorTint: TINT.floor, objTint: TINT.bed },
  'X': { floor: 'h_floor', obj: 'h_fax',        floorTint: TINT.floor, objTint: TINT.fax },
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
    this.mapDef = HOSPITAL_MAP

    // If we're returning from a puzzle round-trip (NPC handed us a case
    // → descended → solved → coming back), respawn at the saved tile
    // so the player wakes up next to whoever they were talking to.
    if (state.pendingHospitalSpawn) {
      this.playerTileX = state.pendingHospitalSpawn.x
      this.playerTileY = state.pendingHospitalSpawn.y
      state.pendingHospitalSpawn = null
    } else {
      this.playerTileX = this.mapDef.playerStart.x
      this.playerTileY = this.mapDef.playerStart.y
    }
    this.canMove = true
    this.npcSprites = []
    this.currentRoomId = -1

    // 70s-Lynch warm darkness — incandescent-bulb register, not
    // fluorescent. Deeper than #1a1208 because the camera shows a
    // lot of bg through the fog-of-war alpha-0.28 visited tiles.
    this.cameras.main.setBackgroundColor(0x140a05)

    this.buildMap()
    this.applyAmbientPulse()
    this.placeGap()
    this.placePlayer()
    this.placeNPCs()
    this.setupInput()
    this.buildUI()
    this.buildHUD()

    this.cameras.main.startFollow(this.player, true, 0.1, 0.1)
    this.cameras.main.setZoom(1.5)
    this.cameras.main.setBounds(0, 0, this.mapDef.width * TILE, this.mapDef.height * TILE)
    // Fade in from black on scene start. Returns from the WR or
    // a battle land here too, so this single call covers all
    // entries into the Hospital.
    this.cameras.main.fadeIn(450, 0, 0, 0)

    // Level-advance banner — if the player just crossed a defeat
    // threshold during the prior battle, surface it now. Banner
    // is screen-space (UI camera) and self-cleans after ~3s.
    const advancedLevel = consumePendingLevelBanner()
    if (advancedLevel !== null) {
      this.showLevelAdvanceBanner(advancedLevel)
    }

    // Dedicated UI camera (zoom 1, no scroll) so HUD/mini-map aren't affected
    // by the main camera's zoom or follow.
    this.uiCamera = this.cameras.add(0, 0, this.scale.width, this.scale.height)
    this.uiCamera.setScroll(0, 0)

    this.buildMiniMap()

    this.enterRoomAt(this.playerTileX, this.playerTileY)

    this.events.on('resume', () => {
      // A dialogue handoff may have flagged a descent. Save the
      // player's current position so we can return them here, then
      // play the descent animation into the WR.
      const s = getState()
      if (s.pendingDescent) {
        const descent = s.pendingDescent
        s.pendingDescent = null
        s.pendingHospitalSpawn = { x: this.playerTileX, y: this.playerTileY }
        saveGame()
        this.descendThroughGap(descent.encounterId)
        return
      }
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
        if (tileDef.floorTint !== undefined) floor.setTint(tileDef.floorTint)
        this.tileFloorSprites[y][x] = floor

        if (tileDef.obj) {
          const obj = this.add.image(px, py, tileDef.obj).setScale(2).setDepth(2).setAlpha(0)
          if (tileDef.objTint !== undefined) obj.setTint(tileDef.objTint)
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

  /**
   * "LEVEL N — <Title>" banner shown after the player advances out
   * of a level by clearing the defeat threshold. Centered, fades in
   * from above + holds for ~2s + fades out. Sits on the UI camera
   * so it's not affected by the main camera's pulse.
   */
  private showLevelAdvanceBanner(newLevel: number) {
    const level = LEVELS[newLevel - 1]
    if (!level) return
    const { width: vw } = this.scale

    const titleText = `LEVEL ${newLevel}`
    const subtitleText = level.title

    const title = this.add.text(vw / 2, 80, titleText, {
      fontSize: '22px', fontFamily: 'monospace', color: '#f0d090',
      backgroundColor: '#1a060880',
      padding: { x: 14, y: 6 },
      stroke: '#05070a', strokeThickness: 3,
      fontStyle: 'bold',
    }).setOrigin(0.5).setScrollFactor(0).setDepth(200).setAlpha(0)

    const subtitle = this.add.text(vw / 2, 116, subtitleText, {
      fontSize: '13px', fontFamily: 'monospace', color: '#c8a040',
      backgroundColor: '#1a060880',
      padding: { x: 10, y: 4 },
      stroke: '#05070a', strokeThickness: 2,
    }).setOrigin(0.5).setScrollFactor(0).setDepth(200).setAlpha(0)

    // Fade in (slightly delayed so it lands on a fresh hospital), hold,
    // then fade out + destroy.
    this.tweens.add({
      targets: [title, subtitle], alpha: 1, duration: 400, delay: 600,
      ease: 'Sine.easeOut',
    })
    this.tweens.add({
      targets: [title, subtitle], alpha: 0, duration: 500, delay: 3000,
      ease: 'Sine.easeIn',
      onComplete: () => { title.destroy(); subtitle.destroy() },
    })
  }

  /**
   * Lynch-warm incandescent ambient pulse on the camera. Slow
   * 6-second breath plus an occasional sharp dim — like a stage
   * bulb that doesn't quite hold. Same idea as the Waiting Room's
   * ambient flicker but warmer and slower; the Hospital is supposed
   * to feel almost-but-not-quite-stable.
   */
  private applyAmbientPulse() {
    this.tweens.add({
      targets: this.cameras.main,
      alpha: 0.94,
      duration: 6000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    })
    // One sharp stutter every ~9 seconds. Brief — 90ms — so the
    // overall feel stays still, with the occasional reminder that
    // the room is theatrical rather than real.
    this.time.addEvent({
      delay: 9000,
      loop: true,
      callback: () => {
        this.cameras.main.setAlpha(0.74)
        this.time.delayedCall(90, () => this.cameras.main.setAlpha(0.94))
      },
    })
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
      backgroundColor: '#1f1208',
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
      backgroundColor: '#1f1208',
      padding: { x: 4, y: 2 },
    }).setOrigin(0.5).setDepth(20).setVisible(false)
  }

  private buildHUD() {
    const state = getState()
    const level = LEVELS[state.currentLevel - 1]

    this.hudLevel = this.add.text(10, 10, `Level ${state.currentLevel}: ${level?.title ?? ''}`, {
      fontSize: '10px', fontFamily: 'monospace', color: '#7ee2c1',
      backgroundColor: '#1f120880',
      padding: { x: 4, y: 2 },
    }).setScrollFactor(0).setDepth(100)

    this.hudHp = this.add.text(10, 28, '', {
      fontSize: '9px', fontFamily: 'monospace', color: '#ef5b7b',
      backgroundColor: '#1f120880',
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
    this.miniMapBg.fillStyle(0x140a05, 0.88) // matches camera bg (warm dark)
    this.miniMapBg.fillRect(this.miniMapX, this.miniMapY, totalW, totalH)
    this.miniMapBg.lineStyle(1, 0xc8a040, 0.6) // mustard frame, fits 70s palette
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
    const targetX = newX * TILE + TILE / 2
    const targetY = newY * TILE + TILE / 2
    // Position tween — moves the player to the new tile.
    this.tweens.add({
      targets: this.player,
      x: targetX,
      y: targetY,
      duration: 120,
      ease: 'Linear',
      onComplete: () => { this.canMove = true },
    })
    // Walking bob — scaleY squashes 1.0 → 0.92 → 1.0 over the
    // duration of the move so the character has a hint of weight
    // landing each step. Tiny effect (8% squash); reads as life
    // without becoming cartoony.
    this.tweens.add({
      targets: this.player,
      scaleY: 1.84, // base scale is 2; 1.84 = 8% squash
      duration: 60,
      yoyo: true,
      ease: 'Sine.easeInOut',
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
        if (ch === 'W') color = 0x4a3220       // walnut, matches wall tint
        else if (ch === 'D' || ch === 'L') color = 0xc8a040 // mustard for doors
        else color = 0xc8b090                  // cream-tan for floors

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
    this.interactPrompt.setVisible(!!closest)
    if (closest) {
      this.interactPrompt.setPosition(closest.sprite.x, closest.sprite.y - 36)
    }
    // gapPrompt is intentionally never shown — descent is dialogue-driven.
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
    // The gap tile is no longer player-engageable — descent is
    // triggered exclusively by NPC dialogue (DialogueEffect.triggerDescent).
    // The visual remains as ambience.
  }

  /**
   * Hospital → Waiting Room transition. Triggered from a dialogue
   * handoff (the player isn't supposed to *want* to descend; cases
   * pull them in). The player sprite drops + fades while the camera
   * fades to black, then starts WaitingRoomScene with the active
   * encounter id so only that one obstacle is lit on arrival.
   */
  private descendThroughGap(activeEncounterId: string) {
    if (!this.canMove) return
    this.canMove = false

    // Player sprite drops + fades. ScaleY shrinks slightly as if
    // pulled downward into the floor.
    this.tweens.add({
      targets: this.player,
      y: this.player.y + TILE * 4,
      alpha: 0,
      scaleY: 1.4, // base scale 2 → ~30% squash
      duration: 600,
      ease: 'Sine.easeIn',
    })

    // Camera fade-to-black + start WR on completion.
    this.cameras.main.fadeOut(700, 0, 0, 0)
    this.cameras.main.once('camerafadeoutcomplete', () => {
      const state = getState()
      state.inWaitingRoom = true
      saveGame()
      this.scene.start('WaitingRoom', { activeEncounterId })
    })
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
