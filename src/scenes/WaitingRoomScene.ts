import Phaser from 'phaser'
import { getState, saveGame } from '../state'
import { LEVELS } from '../content/levels'
import { ENCOUNTERS } from '../content/enemies'

const TILE = 32
const MAP_W = 30
const MAP_H = 20

// Layout reorganized into a north hub and four south wings —
// Eligibility / Coding / Billing / Appeals — separated by light
// dividers (still walkable on the original chair-row positions but
// visually grouped). Obstacles are clustered by their `wing` field so
// each fight feels like it belongs somewhere.
const LAYOUT = [
  'WWWWWWWWWWWWWWWWWWWWWWWWWWWWWW',  // 0
  'W............................W',  // 1
  'W............................W',  // 2  (north margin)
  'W..........TTTTTT............W',  // 3  (counter)
  'W..........T....T............W',  // 4
  'W..........T....T............W',  // 5
  'W..........TTTTTT............W',  // 6
  'W............................W',  // 7
  'W..CC..CC..CC..CC..CC..CC...W',  // 8  (hub chairs)
  'W............................W',  // 9
  'W............................W',  // 10 (wing label band — text overlay drawn over here)
  'W............................W',  // 11
  'W..O........O........O.......W',  // 12 (front-row obstacles)
  'W............................W',  // 13
  'W..O............O............W',  // 14 (mid-row: elig#2, billing#1)
  'W............................W',  // 15
  'W............O.....O....O....W',  // 16 (back-row: coding-extras / appeals 2-3)
  'W...........D................W',  // 17 (exit door)
  'W............................W',  // 18
  'WWWWWWWWWWWWWWWWWWWWWWWWWWWWWW',  // 19
]

/**
 * Obstacle markers placed in the Waiting Room. Walking near one and
 * pressing E starts the matching battle, returning to the Waiting Room
 * on completion. Defeated obstacles (state.defeatedObstacles) are
 * hidden so each can only be fought once per save.
 */
interface ObstacleMarker {
  tileX: number
  tileY: number
  encounterId: string
}

/**
 * Obstacles clustered by `wing`. Layout columns:
 *   ELIGIBILITY: cols 1–6   (markers at x=3)
 *   CODING:      cols 8–14  (markers at x=11/12)
 *   BILLING:     cols 15–20 (markers at x=20)
 *   APPEALS:     cols 22–28 (markers at x=23/27)
 */
const OBSTACLES: ObstacleMarker[] = [
  // --- Eligibility wing (north-west) ---
  { tileX: 3,  tileY: 12, encounterId: 'eligibility_fog' },
  { tileX: 3,  tileY: 14, encounterId: 'oa_23_hydra' },
  // --- Coding wing ---
  { tileX: 12, tileY: 12, encounterId: 'co_97' },
  { tileX: 11, tileY: 14, encounterId: 'co_16_swarm' }, // Sprite Swarm
  // --- Billing wing ---
  { tileX: 20, tileY: 12, encounterId: 'co_18_doppelganger' },
  // --- Appeals wing (east) — three obstacles ---
  { tileX: 23, tileY: 14, encounterId: 'co_50' },         // Wraith
  { tileX: 27, tileY: 14, encounterId: 'co_29_reaper' },  // Reaper
  { tileX: 25, tileY: 16, encounterId: 'co_197' },        // Gatekeeper
]

/** Per-wing label rendered as a floating text widget over the wing area. */
interface WingLabel {
  text: string
  tileX: number  // center of label
  tileY: number
  /** Hex color for the label. */
  color: string
}

const WING_LABELS: WingLabel[] = [
  { text: 'ELIGIBILITY', tileX: 3,  tileY: 10, color: '#7ee2c1' },
  { text: 'CODING',      tileX: 12, tileY: 10, color: '#f0a868' },
  { text: 'BILLING',     tileX: 20, tileY: 10, color: '#ef5b7b' },
  { text: 'APPEALS',     tileX: 25, tileY: 10, color: '#b18bd6' },
]

interface ObstacleSprite {
  marker: ObstacleMarker
  graphics: Phaser.GameObjects.Graphics
  label: Phaser.GameObjects.Text
}

export class WaitingRoomScene extends Phaser.Scene {
  private player!: Phaser.GameObjects.Image
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys
  private wasdKeys!: Record<string, Phaser.Input.Keyboard.Key>
  private canMove = true
  private playerTileX = 14
  private playerTileY = 17
  private floatingPapers: Phaser.GameObjects.Image[] = []
  private ticketText!: Phaser.GameObjects.Text
  private hudLevel!: Phaser.GameObjects.Text
  private exitPrompt!: Phaser.GameObjects.Text
  private obstacleSprites: ObstacleSprite[] = []
  private engagePrompt!: Phaser.GameObjects.Text
  private nearbyObstacle: ObstacleSprite | null = null

  constructor() {
    super('WaitingRoom')
  }

  create() {
    // Red Room (Twin Peaks) treatment — deep burgundy stage,
    // checkerboard floor, curtain-red walls, warm uncanny glow.
    // The aesthetic-inspirations doc cites the Red Room as the
    // canonical reference for the Waiting Room's "between" quality;
    // this is the visual side of that.
    this.cameras.main.setBackgroundColor(0x1a0608)
    this.canMove = true
    this.floatingPapers = []
    this.obstacleSprites = []
    this.nearbyObstacle = null

    this.buildMap()
    this.placePlayer()
    this.addAtmosphere()
    this.placeWingLabels()
    this.placeObstacles()
    this.setupInput()
    this.buildHUD()

    this.cameras.main.startFollow(this.player, true, 0.08, 0.08)
    this.cameras.main.setZoom(1.5)

    // When a battle returns control, refresh obstacle visibility (defeated
    // obstacles disappear) and re-enable movement.
    this.events.on('resume', () => {
      this.canMove = true
      this.refreshObstacleVisibility()
    })

    // Mobile / accessibility: virtual D-pad + E button.
    if (!this.scene.isActive('TouchOverlay')) this.scene.launch('TouchOverlay')
    // See HospitalScene for the rationale on this deferred stop.
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
    for (let y = 0; y < MAP_H; y++) {
      for (let x = 0; x < MAP_W; x++) {
        const ch = LAYOUT[y][x]
        const px = x * TILE + TILE / 2
        const py = y * TILE + TILE / 2

        // Red Room floor — alternating black + bone-white checkerboard
        // (a stand-in for the iconic chevron, since we don't have
        // diagonal-pattern tiles). Tinted on existing wr_floor textures
        // so we don't need new art.
        const floor = this.add.image(px, py, 'wr_floor').setScale(2)
        const isBoneTile = (x + y) % 2 === 0
        floor.setTint(isBoneTile ? 0xd8cfc4 : 0x141014)

        if (ch === 'W') {
          // Walls become red curtain panels. Vertical "fold" alternation
          // gives a subtle drape texture on top of the existing wall
          // sprite.
          const isFold = (x + y) % 2 === 0
          this.add.image(px, py, 'wr_wall').setScale(2)
            .setTint(isFold ? 0x6a0d10 : 0x4a0709)
        } else if (ch === 'C') {
          this.add.image(px, py, 'wr_chair').setScale(2).setAlpha(0.85)
            .setTint(0x3a0608)
        } else if (ch === 'T') {
          this.add.image(px, py, 'wr_counter').setScale(2)
            .setTint(0x2a0608)
        } else if (ch === 'D') {
          this.add.image(px, py, 'h_door').setScale(2).setTint(0x8a1a1a)
        }
        // 'O' tiles: walkable, marker drawn separately by placeObstacles().
      }
    }

    // Ticket counter display — red on red still reads, but lift the
    // hue toward the Red-Room neon-ish saturation.
    const counterX = 12 * TILE + TILE / 2
    const counterY = 8 * TILE + TILE / 2
    this.ticketText = this.add.text(counterX, counterY, 'NOW SERVING\n    037', {
      fontSize: '8px', fontFamily: 'monospace', color: '#ff8090',
    }).setOrigin(0.5).setDepth(5)

    // Flicker the ticket number
    this.time.addEvent({
      delay: 3000,
      loop: true,
      callback: () => {
        this.ticketText.setAlpha(0.3)
        this.time.delayedCall(150, () => this.ticketText.setAlpha(1))
      },
    })
  }

  private placePlayer() {
    this.player = this.add.image(
      this.playerTileX * TILE + TILE / 2,
      this.playerTileY * TILE + TILE / 2,
      'player'
    ).setScale(2).setDepth(10)
  }

  private addAtmosphere() {
    // Floating papers — slightly tinted toward warm so they don't
    // look out-of-place against the red-room palette.
    for (let i = 0; i < 20; i++) {
      const paper = this.add.image(
        Phaser.Math.Between(2 * TILE, (MAP_W - 2) * TILE),
        Phaser.Math.Between(2 * TILE, (MAP_H - 2) * TILE),
        'wr_paper'
      ).setScale(Phaser.Math.FloatBetween(2, 4))
        .setAlpha(Phaser.Math.FloatBetween(0.05, 0.15))
        .setDepth(1)
        .setAngle(Phaser.Math.Between(-30, 30))
        .setTint(0xf0c8a8)

      this.tweens.add({
        targets: paper,
        y: paper.y - Phaser.Math.Between(15, 40),
        x: paper.x + Phaser.Math.Between(-20, 20),
        angle: paper.angle + Phaser.Math.Between(-15, 15),
        alpha: { from: paper.alpha, to: paper.alpha * 0.5 },
        duration: Phaser.Math.Between(6000, 12000),
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
        delay: i * 300,
      })

      this.floatingPapers.push(paper)
    }

    // Edge-curtain bars — narrow burgundy panels along the left
    // and right of the camera that feel like drawn drapes framing
    // the stage. Fixed-position (scroll factor 0) so they stay at
    // the screen edges as the camera follows the player.
    const { width: vw, height: vh } = this.scale
    const curtain = this.add.graphics().setScrollFactor(0).setDepth(99)
    const cWidth = 36
    curtain.fillStyle(0x2a0608, 0.55)
    curtain.fillRect(0, 0, cWidth, vh)
    curtain.fillRect(vw - cWidth, 0, cWidth, vh)
    curtain.fillStyle(0x4a0a0c, 0.35)
    curtain.fillRect(cWidth, 0, 8, vh)
    curtain.fillRect(vw - cWidth - 8, 0, 8, vh)

    // Warm uncanny ambient pulse — slow, irregular, like a stage
    // lamp that isn't quite stable. Replaces the old cool alpha
    // breath. Cycle between 0.92 and 1.0.
    this.tweens.add({
      targets: this.cameras.main,
      alpha: 0.92,
      duration: 5200,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    })

    // Occasional sharp flicker — the lights stutter for a beat,
    // then recover. Twin-Peaks-y; not a constant strobe.
    this.time.addEvent({
      delay: 7000,
      loop: true,
      callback: () => {
        this.cameras.main.setAlpha(0.65)
        this.time.delayedCall(80, () => this.cameras.main.setAlpha(0.92))
      },
    })

    // Exit door prompt — burgundy panel for legibility.
    this.exitPrompt = this.add.text(0, 0, '[E] Return to Hospital', {
      fontSize: '9px', fontFamily: 'monospace', color: '#f0d090',
      backgroundColor: '#1a0608',
      padding: { x: 4, y: 2 },
    }).setOrigin(0.5).setDepth(20).setVisible(false)

    // Engage prompt (shown when standing next to an obstacle marker)
    this.engagePrompt = this.add.text(0, 0, '', {
      fontSize: '9px', fontFamily: 'monospace', color: '#f0d090',
      backgroundColor: '#1a0608',
      padding: { x: 4, y: 2 },
    }).setOrigin(0.5).setDepth(20).setVisible(false)
  }

  /**
   * Render the wing label band — text overlays in the gap between hub
   * and obstacle clusters so the player can see which department they
   * are about to walk into.
   */
  private placeWingLabels() {
    for (const wing of WING_LABELS) {
      const px = wing.tileX * TILE + TILE / 2
      const py = wing.tileY * TILE + TILE / 2
      this.add.text(px, py, wing.text, {
        fontSize: '11px',
        fontFamily: 'monospace',
        color: wing.color,
        fontStyle: 'bold',
        // Burgundy-on-burgundy panel so district colors still read
        // against the red room palette without losing contrast.
        backgroundColor: '#1a060880',
        padding: { x: 6, y: 3 },
      }).setOrigin(0.5).setDepth(3)
    }
  }

  private placeObstacles() {
    const state = getState()
    for (const marker of OBSTACLES) {
      const enc = ENCOUNTERS[marker.encounterId]
      if (!enc) continue
      const px = marker.tileX * TILE + TILE / 2
      const py = marker.tileY * TILE + TILE / 2

      // Procedural marker — purple swirling glyph, similar to the gap.
      const g = this.add.graphics().setDepth(4)
      g.lineStyle(2, 0xb18bd6, 0.7)
      g.strokeCircle(px, py, 14)
      g.lineStyle(1, 0xb18bd6, 0.5)
      g.strokeCircle(px, py, 9)
      g.fillStyle(0xb18bd6, 0.25)
      g.fillCircle(px, py, 6)

      // Pulse the marker so it reads as "interactable" in the dim room.
      this.tweens.add({
        targets: g, alpha: 0.55,
        duration: 1200, yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
      })

      const labelText = enc.archetype ?? enc.title
      const label = this.add.text(px, py - 26, labelText, {
        fontSize: '9px', fontFamily: 'monospace', color: '#f0d090',
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
    // If the player just defeated the obstacle they were near, clear the prompt.
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

  /** E / SPACE: engage a nearby obstacle if any, else try to exit. */
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
    if (!ENCOUNTERS[os.marker.encounterId]) return

    this.canMove = false
    this.engagePrompt.setVisible(false)
    saveGame()
    this.scene.start('Battle', {
      encounterId: os.marker.encounterId,
      returnScene: 'WaitingRoom',
    })
  }

  private buildHUD() {
    const state = getState()
    const level = LEVELS[state.currentLevel - 1]

    this.hudLevel = this.add.text(10, 10, `THE WAITING ROOM — ${level?.title ?? ''}`, {
      fontSize: '10px', fontFamily: 'monospace', color: '#f0d090',
      backgroundColor: '#1a060880',
      padding: { x: 4, y: 2 },
    }).setScrollFactor(0).setDepth(100)

    this.add.text(10, 28, '"Your number will be called."', {
      fontSize: '9px', fontFamily: 'monospace', color: '#a8806a',
      fontStyle: 'italic',
      backgroundColor: '#1a060880',
      padding: { x: 4, y: 2 },
    }).setScrollFactor(0).setDepth(100)

    // Player stat strip — same layout as Hospital so the player's
    // resources stay visible underground too.
    const r = state.resources
    this.add.text(10, 46, `HP: ${r.hp}/${r.maxHp}  Rep: ${r.reputation}  Audit: ${r.auditRisk}%  Stress: ${r.stress}`, {
      fontSize: '9px', fontFamily: 'monospace', color: '#ff8090',
      backgroundColor: '#1a060880',
      padding: { x: 4, y: 2 },
    }).setScrollFactor(0).setDepth(100)
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

    this.checkExitProximity()
    this.checkObstacleProximity()
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

  private tryMove(dx: number, dy: number) {
    const newX = this.playerTileX + dx
    const newY = this.playerTileY + dy

    if (newX < 0 || newX >= MAP_W || newY < 0 || newY >= MAP_H) return

    const ch = LAYOUT[newY][newX]
    if (ch === 'W' || ch === 'T') return

    this.playerTileX = newX
    this.playerTileY = newY

    this.canMove = false
    this.tweens.add({
      targets: this.player,
      x: newX * TILE + TILE / 2,
      y: newY * TILE + TILE / 2,
      duration: 140,
      ease: 'Linear',
      onComplete: () => { this.canMove = true },
    })
  }

  private checkExitProximity() {
    // Door is at tile (11, 17)
    const doorX = 11 * TILE + TILE / 2
    const doorY = 17 * TILE + TILE / 2
    const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, doorX, doorY)

    if (dist < TILE * 2) {
      this.exitPrompt.setPosition(doorX, doorY - 28)
      this.exitPrompt.setVisible(true)
    } else {
      this.exitPrompt.setVisible(false)
    }
  }

  private tryExit() {
    const doorX = 11 * TILE + TILE / 2
    const doorY = 17 * TILE + TILE / 2
    const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, doorX, doorY)

    if (dist < TILE * 2) {
      const state = getState()
      state.inWaitingRoom = false
      saveGame()
      this.scene.start('Hospital')
    }
  }
}
