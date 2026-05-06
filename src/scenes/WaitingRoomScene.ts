import Phaser from 'phaser'
import { getState, saveGame } from '../state'
import { LEVELS } from '../content/levels'
import { ENCOUNTERS } from '../content/enemies'
import { HOSPITAL_MAP } from '../content/maps'
import { showNarration } from './narration'
import type { MapDef } from '../content/maps'

const TILE = 32

/**
 * The Waiting Room is a *parallel layer* — it shares the Hospital's
 * floor plan, transformed. Same walls, same doors, same rooms; the
 * register flips from "Animal Crossing cozy" to "Twin Peaks Red Room
 * cranked up to dramatic + cyberpunk." Per the design doc:
 *
 *   "Below the hospital you know, there is another place… every
 *    claim that was ever filed still exists, waiting."
 *
 * Mechanically: the WR is summoned by NPC dialogue. The conversation
 * pulls the player downstairs with one specific case (`activeEncounterId`
 * passed via init). Only that obstacle is rendered; the others stay
 * dark until their own NPC calls. Player walks to the lit obstacle,
 * presses E, the puzzle launches, and on completion the scene returns
 * directly to the Hospital — the player wakes up next to whoever
 * handed them the case.
 *
 * Free-roam mode (no activeEncounterId) is retained as a fallback: it
 * renders every obstacle and exits via the gap. The dev panel uses it.
 */

interface ObstacleMarker {
  /** World-space tile coordinate inside the Hospital room. */
  tileX: number
  tileY: number
  encounterId: string
  /**
   * When this marker is the active one for an NPC-triggered descent,
   * confine the player to this rectangle (in tile units). Prevents the
   * player from wandering to other obstacles' rooms during a focused
   * case. Optional — when absent or in free-roam mode, no extra
   * confinement beyond the map's solid tiles.
   */
  bounds?: { x: number; y: number; w: number; h: number }
}

/**
 * Encounter placement on the Hospital level-1 map. Each one sits inside
 * a thematically-appropriate room.
 *   Patient Services (2-13, 17-24)   → Wraith (med necessity, sad-witness register)
 *   Registration   (15-36, 17-24)    → Fog + Swarm (eligibility + data quality)
 *   Eligibility    (24-33, 24-29)    → Gatekeeper (auth — the kiosk is literally a gate)
 *   Main Hub       (20-37, 3-12)     → Hydra + Reaper (hub-as-tribunal)
 *   Corridor       (x=14, y=14..29)  → Bundle + Doppelgänger (in-transit fights)
 *   Lobby          — no fights (the safe entry space)
 *   Prior Auth     — locked (post-L1)
 */
// Main Hub room bounds (matches MAIN_HUB in level1.ts: x:20, y:3, w:18, h:10).
// The intro session pins the player here; the obstacle sits a few tiles
// from the gap landing so the player can see it as they arrive.
const MAIN_HUB_BOUNDS = { x: 20, y: 3, w: 18, h: 10 }

const OBSTACLES: ObstacleMarker[] = [
  // Intro — same room as the gap landing (Main Hub). Bounded so the
  // player can't drift into other rooms during a focused case.
  { tileX: 32, tileY: 9, encounterId: 'intro_wrong_card', bounds: MAIN_HUB_BOUNDS },
  // Patient Services
  { tileX: 8,  tileY: 21, encounterId: 'co_50' },          // Wraith
  // Registration (two beats — Fog at the west end, Swarm at the east)
  { tileX: 20, tileY: 21, encounterId: 'eligibility_fog' },
  { tileX: 30, tileY: 21, encounterId: 'co_16_swarm' },     // Sprite Swarm
  // Eligibility kiosk
  { tileX: 29, tileY: 26, encounterId: 'co_197' },          // Gatekeeper
  // Main Hub — the tribunal at the top of the map
  { tileX: 25, tileY: 7,  encounterId: 'oa_23_hydra' },
  { tileX: 32, tileY: 7,  encounterId: 'co_29_reaper' },
  // Corridor — fights you encounter in transit
  { tileX: 14, tileY: 16, encounterId: 'co_97' },           // Bundle
  { tileX: 14, tileY: 22, encounterId: 'co_18_doppelganger' },
]

interface ObstacleSprite {
  marker: ObstacleMarker
  graphics: Phaser.GameObjects.Graphics
  label: Phaser.GameObjects.Text
}

/**
 * Per-tile-char rendering for the Waiting Room. Same chars as
 * `HospitalScene.TILE_TEXTURES` (so we can read the same map), but
 * each one transformed: walls → red curtains, floors → B&W chevron,
 * doors → neon-glowing portals, chairs → red velvet, counters →
 * ticket-counter monitors, etc.
 */
interface WrTileDef {
  /** Sprite key — uses wr_* sprites where they exist, else falls back to h_* with heavy tint. */
  sprite: string
  /** Tint applied to the base sprite. */
  tint: number
  /** True if the player can't walk over this tile. */
  solid: boolean
  /** Object sprite drawn on top (chairs, counters, etc.). */
  obj?: string
  /** Object tint. */
  objTint?: number
  /** Cyberpunk overlay: glowing neon ring around the tile. */
  glow?: number
}

const WR_TILES: Record<string, WrTileDef> = {
  // Walls → red curtain panels (alternating fold tint applied per-tile in buildMap)
  'W': { sprite: 'wr_wall', tint: 0x6a0d10, solid: true },
  // Doors → neon-portal floor + soft glow
  'D': { sprite: 'wr_floor', tint: 0x141014, solid: false, glow: 0xff3050 },
  'L': { sprite: 'wr_floor', tint: 0x2a0608, solid: true,  glow: 0x6a4828 }, // dim/dead-neon (locked)
  // Floor: chevron checkerboard handled per-tile
  '.': { sprite: 'wr_floor', tint: 0xd8cfc4, solid: false },
  '~': { sprite: 'wr_floor', tint: 0x141014, solid: false },
  '_': { sprite: 'wr_floor', tint: 0x4a0608, solid: false }, // burgundy carpet
  // Furniture / props — re-skinned for the Red Room
  'c': { sprite: 'wr_floor', tint: 0xd8cfc4, solid: false, obj: 'h_desk',       objTint: 0x2a0608 },
  'h': { sprite: 'wr_floor', tint: 0xd8cfc4, solid: false, obj: 'wr_chair',     objTint: 0x6a0d10 },
  'P': { sprite: 'wr_floor', tint: 0xd8cfc4, solid: false, obj: 'h_plant',      objTint: 0x4a0608 }, // dried-blood plant
  'w': { sprite: 'wr_floor', tint: 0xd8cfc4, solid: true,  obj: 'h_water',      objTint: 0xff3050, glow: 0xff3050 }, // neon dispenser
  'F': { sprite: 'wr_floor', tint: 0xd8cfc4, solid: true,  obj: 'h_cabinet',    objTint: 0x2a0608 },
  'B': { sprite: 'wr_floor', tint: 0xd8cfc4, solid: true,  obj: 'h_whiteboard', objTint: 0xff3050, glow: 0xff3050 }, // monitor
  'R': { sprite: 'wr_floor', tint: 0xd8cfc4, solid: true,  obj: 'wr_counter',   objTint: 0x6a0d10 }, // ticket counter
  'V': { sprite: 'wr_floor', tint: 0xd8cfc4, solid: true,  obj: 'h_vending',    objTint: 0xff3050, glow: 0xff3050 }, // glowing vending
  'b': { sprite: 'wr_floor', tint: 0xd8cfc4, solid: true,  obj: 'h_bulletin',   objTint: 0x6a0d10 },
  'H': { sprite: 'wr_floor', tint: 0xd8cfc4, solid: true,  obj: 'h_bed',        objTint: 0x4a0608 },
  'X': { sprite: 'wr_floor', tint: 0xd8cfc4, solid: false, obj: 'h_fax',        objTint: 0xff3050, glow: 0xff3050 }, // CRT terminal
  'E': { sprite: 'wr_floor', tint: 0xd8cfc4, solid: false, obj: 'h_equipment',  objTint: 0x2a0608 },
}

function tileForChar(ch: string): WrTileDef {
  return WR_TILES[ch] ?? WR_TILES['.']
}

export class WaitingRoomScene extends Phaser.Scene {
  private player!: Phaser.GameObjects.Image
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys
  private wasdKeys!: Record<string, Phaser.Input.Keyboard.Key>
  private canMove = true
  private playerTileX = 0
  private playerTileY = 0
  private mapDef!: MapDef
  /** When set, only this obstacle is rendered + engageable. The session
   *  was opened by a dialogue handoff and the player is here to handle
   *  exactly this one case. Null = legacy free-roam mode. */
  private activeEncounterId: string | null = null
  /** When set, tryMove rejects any tile outside this rectangle —
   *  confines the player to the active obstacle's room. */
  private sessionBounds: { x: number; y: number; w: number; h: number } | null = null

  private floatingMotes: Phaser.GameObjects.Graphics[] = []
  private ticketText!: Phaser.GameObjects.Text
  private hudLevel!: Phaser.GameObjects.Text
  private exitPrompt!: Phaser.GameObjects.Text
  private obstacleSprites: ObstacleSprite[] = []
  private engagePrompt!: Phaser.GameObjects.Text
  private nearbyObstacle: ObstacleSprite | null = null

  constructor() {
    super('WaitingRoom')
  }

  init(data: { activeEncounterId?: string }) {
    this.activeEncounterId = data?.activeEncounterId ?? null
    const activeMarker = this.activeEncounterId
      ? OBSTACLES.find(m => m.encounterId === this.activeEncounterId)
      : null
    this.sessionBounds = activeMarker?.bounds ?? null
  }

  create() {
    const state = getState()
    this.mapDef = HOSPITAL_MAP

    // Spawn at the gap tile — the player fell through, so they
    // arrive where the gap is in the Hospital. Walking back to the
    // same tile + pressing E exits to the Hospital.
    this.playerTileX = this.mapDef.gapTile.x
    this.playerTileY = this.mapDef.gapTile.y

    // Deeper burgundy than the Hospital's warm dark — this is the
    // dramatic stage. Pure black with red highlights would feel too
    // much like a haunted house; #1a0608 reads as theatrical.
    this.cameras.main.setBackgroundColor(0x1a0608)
    this.canMove = true
    this.floatingMotes = []
    this.obstacleSprites = []
    this.nearbyObstacle = null

    this.buildMap()
    this.placePlayer()
    this.addAtmosphere()
    this.placeObstacles()
    this.setupInput()
    this.buildHUD()

    this.cameras.main.startFollow(this.player, true, 0.08, 0.08)
    this.cameras.main.setZoom(1.5)
    this.cameras.main.setBounds(0, 0, this.mapDef.width * TILE, this.mapDef.height * TILE)
    // Fade in from black — the player just fell through the gap,
    // and the WR resolves out of the dark.
    this.cameras.main.fadeIn(700, 0, 0, 0)

    // Arrival animation — the player drops in from above, rotating
    // out of the spin from the Hospital descent, then settles with a
    // squash. A red ground-flash hits the moment they land.
    const targetX = this.player.x
    const targetY = this.player.y
    this.player.setPosition(targetX, targetY - TILE * 5)
    this.player.setAlpha(0)
    this.player.setAngle(220)
    this.canMove = false
    this.tweens.add({
      targets: this.player,
      y: targetY,
      alpha: 1,
      angle: 0,
      duration: 600,
      delay: 350,
      ease: 'Sine.easeOut',
    })
    this.player.setScale(2, 1.0)
    this.tweens.add({
      targets: this.player,
      scaleY: 2,
      duration: 280,
      ease: 'Back.easeOut',
      delay: 900,
    })
    // Landing flash — concentric red ring out from the landing tile.
    this.time.delayedCall(900, () => {
      const ring = this.add.graphics().setDepth(20)
      ring.lineStyle(2, 0xff3050, 1)
      ring.strokeCircle(targetX, targetY, 4)
      this.tweens.add({
        targets: ring,
        scale: 8,
        alpha: 0,
        duration: 700,
        ease: 'Cubic.easeOut',
        onComplete: () => ring.destroy(),
      })

      // First time the player ever lands in the WR: surreal-reveal
      // narration. Movement stays disabled until it finishes.
      const s = getState()
      if (!s.firstWrArrivalNarrationPlayed) {
        showNarration(this, [
          'You are somewhere else.',
          "The same room, but it isn't.",
        ], () => {
          const after = getState()
          after.firstWrArrivalNarrationPlayed = true
          saveGame()
          this.canMove = true
        })
      } else {
        this.canMove = true
      }
    })

    // When a battle returns control, refresh obstacle visibility (defeated
    // obstacles disappear) and re-enable movement.
    this.events.on('resume', () => {
      this.canMove = true
      this.refreshObstacleVisibility()
    })

    // Mobile / accessibility: virtual D-pad + E button.
    if (!this.scene.isActive('TouchOverlay')) this.scene.launch('TouchOverlay')
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

    for (let y = 0; y < mh; y++) {
      const row = layout[y] || ''
      for (let x = 0; x < mw; x++) {
        const ch = row[x] || '.'
        const px = x * TILE + TILE / 2
        const py = y * TILE + TILE / 2
        const def = tileForChar(ch)

        // Floor / base tile
        const floor = this.add.image(px, py, def.sprite).setScale(2)
        // Chevron checkerboard for floors: alternate bone-white + ink-black
        // on every other tile. Walls + furniture get their fixed tints.
        if (ch === '.' || ch === 'h' || ch === 'c' || ch === 'P' || ch === 'w' ||
            ch === 'F' || ch === 'B' || ch === 'R' || ch === 'V' || ch === 'b' ||
            ch === 'H' || ch === 'X' || ch === 'E') {
          const isBoneTile = (x + y) % 2 === 0
          floor.setTint(isBoneTile ? 0xd8cfc4 : 0x141014)
        } else if (ch === 'W') {
          // Walls — alternating fold tint to give the curtain texture
          // even with a uniform sprite.
          const isFold = (x + y) % 2 === 0
          floor.setTint(isFold ? 0x6a0d10 : 0x4a0709)
        } else {
          floor.setTint(def.tint)
        }

        // Object on top (furniture, monitor, counter, etc.)
        if (def.obj) {
          const obj = this.add.image(px, py, def.obj).setScale(2).setDepth(2)
          if (def.objTint !== undefined) obj.setTint(def.objTint)
        }

        // Cyberpunk neon glow — under-tile pool of light for monitors,
        // doors, vending. Drawn behind object so the object's silhouette
        // still reads.
        if (def.glow !== undefined) {
          const glow = this.add.graphics().setDepth(1)
          glow.fillStyle(def.glow, 0.18)
          glow.fillCircle(px, py, TILE * 0.85)
          glow.fillStyle(def.glow, 0.32)
          glow.fillCircle(px, py, TILE * 0.45)
          // Slow flicker on the glow — reads as bad fluorescent / neon.
          this.tweens.add({
            targets: glow, alpha: 0.55,
            duration: Phaser.Math.Between(2200, 4500),
            yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
            delay: Phaser.Math.Between(0, 1500),
          })
        }
      }
    }

    // Ticket counter monitor — float a "NOW SERVING" widget over the
    // first counter tile we find. This sits in the Hospital's lobby
    // counter or the Registration counter; either reads thematically.
    let counterFound = false
    for (let y = 0; y < mh && !counterFound; y++) {
      for (let x = 0; x < mw && !counterFound; x++) {
        if (layout[y]?.[x] === 'R') {
          const px = x * TILE + TILE / 2
          const py = y * TILE + TILE / 2 - 6
          this.ticketText = this.add.text(px, py, 'NOW SERVING\n     ?', {
            fontSize: '8px', fontFamily: 'monospace', color: '#ff3050',
          }).setOrigin(0.5).setDepth(5)
          counterFound = true
        }
      }
    }
    if (counterFound) {
      // Cycle the number aggressively — never lands. Cyberpunk drama.
      this.time.addEvent({
        delay: 1400,
        loop: true,
        callback: () => {
          const n = Phaser.Math.Between(0, 9999)
          this.ticketText.setText(`NOW SERVING\n   ${n.toString().padStart(4, '0')}`)
          this.ticketText.setAlpha(0.35)
          this.time.delayedCall(120, () => this.ticketText.setAlpha(1))
        },
      })
    }
  }

  private placePlayer() {
    this.player = this.add.image(
      this.playerTileX * TILE + TILE / 2,
      this.playerTileY * TILE + TILE / 2,
      'player'
    ).setScale(2).setDepth(10)
  }

  private addAtmosphere() {
    // Drop a subtle "you arrived here" glow at the gap so the player
    // can find their way back. Lavender, matching the gap in the
    // Hospital — the only tile where the two layers visually agree.
    const gapPx = this.mapDef.gapTile.x * TILE + TILE / 2
    const gapPy = this.mapDef.gapTile.y * TILE + TILE / 2
    const gapGlow = this.add.graphics().setDepth(0)
    gapGlow.fillStyle(0xb18bd6, 0.12)
    gapGlow.fillCircle(gapPx, gapPy, TILE * 1.6)
    gapGlow.fillStyle(0xb18bd6, 0.25)
    gapGlow.fillCircle(gapPx, gapPy, TILE * 0.9)
    this.tweens.add({
      targets: gapGlow, alpha: 0.65, duration: 2400,
      yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
    })

    // Floating data motes — replace the old papers with small
    // glowing dots that drift slowly. Cyberpunk-ish; the room's
    // air is thick with information that never resolves.
    for (let i = 0; i < 28; i++) {
      const mx = Phaser.Math.Between(2 * TILE, (this.mapDef.width - 2) * TILE)
      const my = Phaser.Math.Between(2 * TILE, (this.mapDef.height - 2) * TILE)
      const mote = this.add.graphics().setDepth(1)
      const color = Phaser.Math.RND.pick([0xff3050, 0xff8090, 0xb18bd6])
      mote.fillStyle(color, Phaser.Math.FloatBetween(0.18, 0.42))
      mote.fillCircle(0, 0, Phaser.Math.FloatBetween(1.5, 3))
      mote.setPosition(mx, my)
      this.tweens.add({
        targets: mote,
        y: my - Phaser.Math.Between(20, 60),
        x: mx + Phaser.Math.Between(-30, 30),
        alpha: { from: mote.alpha, to: mote.alpha * 0.3 },
        duration: Phaser.Math.Between(5000, 11000),
        yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
        delay: i * 220,
      })
      this.floatingMotes.push(mote)
    }

    // CRT scanlines overlay — fixed-position thin horizontal bars
    // across the camera. Sits under HUD (depth 90) so HUD text
    // remains crisp.
    const { width: vw, height: vh } = this.scale
    const scanlines = this.add.graphics().setScrollFactor(0).setDepth(90)
    scanlines.fillStyle(0x000000, 0.18)
    for (let y = 0; y < vh; y += 4) {
      scanlines.fillRect(0, y, vw, 1)
    }

    // Edge curtains — narrow burgundy bars framing the camera.
    // Same idea as the prior pass but with a darker outer edge for
    // more theatrical dimensionality.
    const curtain = this.add.graphics().setScrollFactor(0).setDepth(99)
    const cWidth = 44
    curtain.fillStyle(0x1a0608, 0.7)
    curtain.fillRect(0, 0, cWidth, vh)
    curtain.fillRect(vw - cWidth, 0, cWidth, vh)
    curtain.fillStyle(0x6a0d10, 0.4)
    curtain.fillRect(cWidth, 0, 6, vh)
    curtain.fillRect(vw - cWidth - 6, 0, 6, vh)
    // Top + bottom soft mask — gives the camera a letterbox-y
    // theatrical frame.
    curtain.fillStyle(0x000000, 0.55)
    curtain.fillRect(0, 0, vw, 18)
    curtain.fillRect(0, vh - 18, vw, 18)

    // Ambient camera pulse — slower + deeper than the Hospital,
    // and the sharp dim hits harder.
    this.tweens.add({
      targets: this.cameras.main,
      alpha: 0.88,
      duration: 5800,
      yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
    })
    // Sharp brownout every ~6 seconds. Drops to 0.5 for 130ms
    // and recovers — the lights cutting then catching.
    this.time.addEvent({
      delay: 6000,
      loop: true,
      callback: () => {
        this.cameras.main.setAlpha(0.5)
        this.time.delayedCall(130, () => this.cameras.main.setAlpha(0.88))
      },
    })
    // Even rarer: a single full-black blink. Once every ~22 seconds.
    this.time.addEvent({
      delay: 22000,
      loop: true,
      callback: () => {
        this.cameras.main.setAlpha(0.05)
        this.time.delayedCall(60, () => this.cameras.main.setAlpha(0.88))
      },
    })

    // Exit prompt + engage prompt
    this.exitPrompt = this.add.text(0, 0, '[E] Return to Hospital', {
      fontSize: '9px', fontFamily: 'monospace', color: '#f0d090',
      backgroundColor: '#1a0608', padding: { x: 4, y: 2 },
    }).setOrigin(0.5).setDepth(20).setVisible(false)
    this.engagePrompt = this.add.text(0, 0, '', {
      fontSize: '9px', fontFamily: 'monospace', color: '#f0d090',
      backgroundColor: '#1a0608', padding: { x: 4, y: 2 },
    }).setOrigin(0.5).setDepth(20).setVisible(false)
  }

  private placeObstacles() {
    // When the WR was opened to handle one specific case (NPC handoff),
    // only the matching obstacle gets rendered. The others stay dark
    // until their own NPC summons them.
    const markers = this.activeEncounterId
      ? OBSTACLES.filter(m => m.encounterId === this.activeEncounterId)
      : OBSTACLES
    for (const marker of markers) {
      const enc = ENCOUNTERS[marker.encounterId]
      if (!enc) continue
      const px = marker.tileX * TILE + TILE / 2
      const py = marker.tileY * TILE + TILE / 2

      // Holographic encounter marker — magenta + cyan stack with
      // a flicker. Cyberpunk-ish; reads as glitch.
      const g = this.add.graphics().setDepth(4)
      // Outer magenta ring
      g.lineStyle(2, 0xff3050, 0.85)
      g.strokeCircle(px, py, 16)
      // Cyan inner ring (offset slightly for chromatic aberration)
      g.lineStyle(1, 0x60d0ff, 0.7)
      g.strokeCircle(px + 1, py - 1, 12)
      // Solid magenta core
      g.fillStyle(0xff3050, 0.45)
      g.fillCircle(px, py, 5)

      // Pulse + tiny jitter — never quite still
      this.tweens.add({
        targets: g, alpha: 0.55,
        duration: 900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
      })

      const labelText = enc.archetype ?? enc.title
      const label = this.add.text(px, py - 28, labelText, {
        fontSize: '9px', fontFamily: 'monospace', color: '#ff8090',
        backgroundColor: '#1a0608cc', padding: { x: 4, y: 2 },
      }).setOrigin(0.5).setDepth(5)

      this.obstacleSprites.push({ marker, graphics: g, label })
    }
    this.refreshObstacleVisibility()
  }

  private refreshObstacleVisibility() {
    const state = getState()
    for (const os of this.obstacleSprites) {
      const defeated = state.defeatedObstacles.includes(os.marker.encounterId)
      os.graphics.setVisible(!defeated)
      os.label.setVisible(!defeated)
    }
    if (this.nearbyObstacle &&
        getState().defeatedObstacles.includes(this.nearbyObstacle.marker.encounterId)) {
      this.nearbyObstacle = null
      this.engagePrompt.setVisible(false)
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
    this.input.keyboard!.on('keydown-E', () => this.tryInteract())
    this.input.keyboard!.on('keydown-SPACE', () => this.tryInteract())
  }

  private tryInteract() {
    if (this.nearbyObstacle) {
      this.tryEngageObstacle(this.nearbyObstacle)
    } else {
      this.tryExit()
    }
  }

  private tryEngageObstacle(os: ObstacleSprite) {
    const state = getState()
    if (state.defeatedObstacles.includes(os.marker.encounterId)) return
    const enc = ENCOUNTERS[os.marker.encounterId]
    if (!enc) return
    if (!enc.puzzleSpecId) {
      // Engagement requires a puzzle spec. Encounters without one
      // exist as codex/lore data only (or are still being authored).
      return
    }

    this.canMove = false
    this.engagePrompt.setVisible(false)
    saveGame()

    // NPC-triggered sessions return to the Hospital after the puzzle
    // (the player wakes up next to whoever handed them the case).
    // Free-roam sessions return to the WR so the player can wander
    // to another obstacle.
    const returnScene = this.activeEncounterId ? 'Hospital' : 'WaitingRoom'

    this.scene.start('PuzzleBattle', {
      encounterId: enc.id,
      puzzleSpecId: enc.puzzleSpecId,
      returnScene,
    })
  }

  private buildHUD() {
    const state = getState()
    const level = LEVELS[state.currentLevel - 1]

    this.hudLevel = this.add.text(10, 10, `THE WAITING ROOM — ${level?.title ?? ''}`, {
      fontSize: '10px', fontFamily: 'monospace', color: '#f0d090',
      backgroundColor: '#1a060880', padding: { x: 4, y: 2 },
    }).setScrollFactor(0).setDepth(100)

    this.add.text(10, 28, '"Your number will be called."', {
      fontSize: '9px', fontFamily: 'monospace', color: '#a8806a',
      fontStyle: 'italic',
      backgroundColor: '#1a060880', padding: { x: 4, y: 2 },
    }).setScrollFactor(0).setDepth(100)

    const r = state.resources
    this.add.text(10, 46, `HP: ${r.hp}/${r.maxHp}  Rep: ${r.reputation}  Audit: ${r.auditRisk}%  Stress: ${r.stress}`, {
      fontSize: '9px', fontFamily: 'monospace', color: '#ff8090',
      backgroundColor: '#1a060880', padding: { x: 4, y: 2 },
    }).setScrollFactor(0).setDepth(100)
  }

  update() {
    if (!this.canMove) return

    let dx = 0
    let dy = 0
    // Hold-to-move: poll `isDown` each frame and gate via `canMove`
    // (set false during the tween, true on completion). Mirrors the
    // Hospital's input pattern; the older WR code used `JustDown` and
    // forced tap-to-move.
    if (this.cursors.left.isDown  || this.wasdKeys.A.isDown) dx = -1
    else if (this.cursors.right.isDown || this.wasdKeys.D.isDown) dx = 1
    else if (this.cursors.up.isDown    || this.wasdKeys.W.isDown) dy = -1
    else if (this.cursors.down.isDown  || this.wasdKeys.S.isDown) dy = 1

    if (dx !== 0 || dy !== 0) this.tryMove(dx, dy)

    this.checkExitProximity()
    this.checkObstacleProximity()
  }

  /** Swap the player texture based on the direction they're moving. */
  private faceDirection(dx: number, dy: number) {
    if (dx > 0) {
      this.player.setTexture('player_side').setFlipX(false)
    } else if (dx < 0) {
      this.player.setTexture('player_side').setFlipX(true)
    } else if (dy < 0) {
      this.player.setTexture('player_up').setFlipX(false)
    } else if (dy > 0) {
      this.player.setTexture('player').setFlipX(false)
    }
  }

  private isSolid(x: number, y: number): boolean {
    const { width: mw, height: mh, layout } = this.mapDef
    if (x < 0 || x >= mw || y < 0 || y >= mh) return true
    const ch = layout[y]?.[x] || '.'
    return tileForChar(ch).solid
  }

  private tryMove(dx: number, dy: number) {
    const newX = this.playerTileX + dx
    const newY = this.playerTileY + dy

    this.faceDirection(dx, dy)

    if (this.isSolid(newX, newY)) return

    // NPC-triggered sessions confine the player to the active obstacle's
    // room. Other doors / corridors are visually present but unreachable.
    if (this.sessionBounds) {
      const b = this.sessionBounds
      if (newX < b.x || newX >= b.x + b.w || newY < b.y || newY >= b.y + b.h) {
        return
      }
    }

    this.playerTileX = newX
    this.playerTileY = newY

    this.canMove = false
    const targetX = newX * TILE + TILE / 2
    const targetY = newY * TILE + TILE / 2
    this.tweens.add({
      targets: this.player,
      x: targetX, y: targetY,
      duration: 140, ease: 'Linear',
      onComplete: () => { this.canMove = true },
    })
    // Same walking bob as Hospital — keeps the character feeling
    // present in both layers.
    this.tweens.add({
      targets: this.player,
      scaleY: 1.84,
      duration: 70, yoyo: true, ease: 'Sine.easeInOut',
    })
  }

  private checkObstacleProximity() {
    const state = getState()
    let closest: ObstacleSprite | null = null
    let closestDist = Infinity

    for (const os of this.obstacleSprites) {
      if (state.defeatedObstacles.includes(os.marker.encounterId)) continue
      const ox = os.marker.tileX * TILE + TILE / 2
      const oy = os.marker.tileY * TILE + TILE / 2
      const d = Phaser.Math.Distance.Between(this.player.x, this.player.y, ox, oy)
      if (d < TILE * 1.6 && d < closestDist) {
        closest = os
        closestDist = d
      }
    }

    if (closest) {
      const enc = ENCOUNTERS[closest.marker.encounterId]
      const name = enc?.archetype ?? enc?.title ?? 'obstacle'
      const ox = closest.marker.tileX * TILE + TILE / 2
      const oy = closest.marker.tileY * TILE + TILE / 2
      this.engagePrompt.setText(`[E] Engage ${name}`)
      this.engagePrompt.setPosition(ox, oy - 44)
      this.engagePrompt.setVisible(true)
      this.nearbyObstacle = closest
    } else {
      this.engagePrompt.setVisible(false)
      this.nearbyObstacle = null
    }
  }

  private checkExitProximity() {
    const gapX = this.mapDef.gapTile.x * TILE + TILE / 2
    const gapY = this.mapDef.gapTile.y * TILE + TILE / 2
    const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, gapX, gapY)

    if (dist < TILE * 2 && !this.nearbyObstacle) {
      this.exitPrompt.setPosition(gapX, gapY - 28)
      this.exitPrompt.setVisible(true)
    } else {
      this.exitPrompt.setVisible(false)
    }
  }

  private tryExit() {
    // Block return until the active obstacle is defeated. NPC-triggered
    // sessions are one-way until the case is resolved.
    if (this.activeEncounterId) {
      const state = getState()
      if (!state.defeatedObstacles.includes(this.activeEncounterId)) {
        this.flashHint('You can’t leave until the case is resolved.')
        return
      }
    }
    const gapX = this.mapDef.gapTile.x * TILE + TILE / 2
    const gapY = this.mapDef.gapTile.y * TILE + TILE / 2
    const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, gapX, gapY)

    if (dist < TILE * 2) {
      this.ascendThroughGap()
    }
  }

  /** Brief screen-space hint message that fades out. */
  private flashHint(text: string) {
    const { width, height } = this.scale
    const t = this.add
      .text(width / 2, height - 80, text, {
        fontSize: '12px',
        fontFamily: 'monospace',
        color: '#ff8090',
        backgroundColor: '#1a060899',
        padding: { x: 8, y: 4 },
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(120)
      .setAlpha(0)
    this.tweens.add({
      targets: t,
      alpha: 1,
      duration: 220,
      hold: 1400,
      yoyo: true,
      onComplete: () => t.destroy(),
    })
  }

  /**
   * Waiting Room → Hospital transition. Player rises (the inverse
   * of the descent: y up + alpha fade) while the camera fades to
   * black, then HospitalScene starts and fades back in.
   */
  private ascendThroughGap() {
    if (!this.canMove) return
    this.canMove = false

    // Player rises out of frame — opposite direction of the descent.
    this.tweens.add({
      targets: this.player,
      y: this.player.y - TILE * 4,
      alpha: 0,
      scaleY: 2.4, // slight stretch — they're being pulled up
      duration: 600,
      ease: 'Sine.easeOut',
    })

    this.cameras.main.fadeOut(700, 0, 0, 0)
    this.cameras.main.once('camerafadeoutcomplete', () => {
      const state = getState()
      state.inWaitingRoom = false
      saveGame()
      this.scene.start('Hospital')
    })
  }
}
