import Phaser from 'phaser'
import { NPCS } from '../content/npcs'
import { LEVELS } from '../content/levels'
import { HOSPITAL_MAP } from '../content/maps'
import type { MapDef } from '../content/maps'
import { getState, saveGame, consumePendingLevelBanner } from '../state'
import { showNarration } from './narration'
import { isTouchDevice } from './device'
import { ENCOUNTERS } from '../content/enemies'
import { LEVEL_NPC_DIALOGUES } from '../content/dialogue'
import { PUZZLE_SPECS } from '../runtime/puzzle/specs'
import { flavorForTile, LEVEL_ORIENTATION_HINTS } from './hospitalFlavor'
import { runWakeUpTransition } from './wakeUpOverlay'
import { showClaimPreview } from './claimPreview'
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
  chair:    0x4a6878, // slate teal (contrasts the sepia sweater)
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
  'c': { floor: 'h_floor', obj: 'h_desk',       solid: true, floorTint: TINT.floor, objTint: TINT.desk },
  'h': { floor: 'h_floor', obj: 'h_chair',      floorTint: TINT.floor, objTint: TINT.chair },
  'E': { floor: 'h_floor', obj: 'h_equipment',  floorTint: TINT.floor, objTint: TINT.equip },
  'P': { floor: 'h_floor', obj: 'h_plant',      solid: true, floorTint: TINT.floor, objTint: TINT.plant },
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

// Object flavor text + level orientation hints live in a sibling
// module (./hospitalFlavor) — pure data + a stable-hash picker, no
// scene state.

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
  private miniMapLabels: Phaser.GameObjects.Text[] = []
  private miniMapHitZone?: Phaser.GameObjects.Zone
  private miniMapDim?: Phaser.GameObjects.Rectangle
  private miniMapCloseHint?: Phaser.GameObjects.Text
  private miniMapExpanded = false
  private lockedToast?: Phaser.GameObjects.Text
  private lockedToastTween?: Phaser.Tweens.Tween
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
    const wasReturnFromWr = state.pendingHospitalSpawn != null
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

    // Hospital ambience — Lynch-y / sci-fi melancholy. Only kicks in
    // once the cinematic intro song is done so the two don't fight.
    this.startHospitalAmbience()

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
      // Always re-enable movement first — interact() set canMove=false
      // when it launched the dialogue, and descendThroughGap below
      // expects canMove to be true (it early-returns otherwise).
      this.canMove = true
      this.refreshHUD()
      // A dialogue handoff may have flagged a descent. Save the
      // player's current position so we can return them here. Show
      // the claim preview first (player gets to see what's broken
      // before falling), then descend.
      const s = getState()
      if (s.pendingDescent) {
        const descent = s.pendingDescent
        s.pendingDescent = null
        s.pendingHospitalSpawn = { x: this.playerTileX, y: this.playerTileY }
        saveGame()
        this.canMove = false
        showClaimPreview(this, descent.encounterId, () => {
          this.descendThroughGap(descent.encounterId)
        })
      }
      // After the thanks dialogue closes, walk Anjali out.
      if (s.pendingAnjaliLeave) {
        s.pendingAnjaliLeave = false
        saveGame()
        this.runAnjaliLeave()
      }
    })

    // Level-1 atmosphere: occasionally a sheet of paper scuttles across
    // the floor — a hint that the Waiting Room is bleeding through. No
    // interaction, no codex; just sensation. Higher levels skip this.
    if (state.currentLevel === 1) {
      this.scheduleGhostPaper()
    }

    // First-time level-1 opening: narrate the intern's situation, walk
    // Anjali into the lobby, auto-launch her dialogue. Runs once per
    // save (gated by state.introOpeningPlayed).
    if (!state.introOpeningPlayed && state.currentLevel === 1) {
      this.runOpeningSequence()
    } else if (state.pendingClaimSubmitted) {
      // Just submitted a puzzle. Run the wake-up transition (CSS blur
      // unblurring with a CLAIM SUBMITTED indicator) and only then
      // hand off to Anjali's thank-you dialogue.
      const sub = state.pendingClaimSubmitted
      state.pendingClaimSubmitted = null
      saveGame()
      this.runWakeUpTransition(sub.claimId, () => this.maybeRunAnjaliThanks())
    } else if (wasReturnFromWr) {
      // Returning from a puzzle round-trip. If the case Anjali handed
      // over has been solved and she hasn't said her piece yet, auto-
      // launch the thank-you dialogue so the moment doesn't depend on
      // the player walking back to her.
      this.maybeRunAnjaliThanks()
    }

    // Mobile / accessibility: parallel scene with virtual D-pad + E + ESC.
    // Only launched on touch-primary devices — desktop keyboards don't
    // need the on-screen controls cluttering the view.
    if (isTouchDevice() && !this.scene.isActive('TouchOverlay')) {
      this.scene.launch('TouchOverlay')
    }
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
    const hintText = LEVEL_ORIENTATION_HINTS[newLevel]

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

    const banners: Phaser.GameObjects.Text[] = [title, subtitle]
    if (hintText) {
      const hint = this.add.text(vw / 2, 148, hintText, {
        fontSize: '11px', fontFamily: 'monospace', color: '#7ee2c1',
        backgroundColor: '#1a060880',
        padding: { x: 10, y: 4 },
        stroke: '#05070a', strokeThickness: 2,
        align: 'center',
      }).setOrigin(0.5).setScrollFactor(0).setDepth(200).setAlpha(0)
      banners.push(hint)
    }

    // Fade in (slightly delayed so it lands on a fresh hospital), hold,
    // then fade out + destroy.
    this.tweens.add({
      targets: banners, alpha: 1, duration: 400, delay: 600,
      ease: 'Sine.easeOut',
    })
    this.tweens.add({
      targets: banners, alpha: 0, duration: 500, delay: 4200,
      ease: 'Sine.easeIn',
      onComplete: () => { for (const b of banners) b.destroy() },
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

  private placePlayer() {
    this.player = this.add.image(
      this.playerTileX * TILE + TILE / 2,
      this.playerTileY * TILE + TILE / 2,
      'player'
    ).setScale(1).setDepth(10)
  }

  private placeNPCs() {
    const state = getState()
    const level = LEVELS[state.currentLevel - 1]
    const activeNpcs = [...(level?.npcsActive ?? Object.keys(NPCS))]
    // Anjali sticks around until her case is closed (the thanks
    // dialogue runs and she walks out). Solving her puzzle bumps the
    // player to level 2, which would otherwise drop her from the
    // active-NPC roster mid-conversation.
    if (!state.anjaliThanked && !activeNpcs.includes('anjali')) {
      activeNpcs.push('anjali')
    }

    // De-dupe NPCs that have multiple placements (different rooms per
    // level) so each NPC is placed exactly once. Per-NPC, prefer a
    // placement whose `levels` filter matches the current level; fall
    // back to a placement with no filter (the default).
    const placedSoFar = new Set<string>()
    for (const p of this.mapDef.npcPlacements) {
      if (placedSoFar.has(p.npcId)) continue
      if (p.levels && !p.levels.includes(state.currentLevel)) continue
      if (!activeNpcs.includes(p.npcId)) continue
      const npc = NPCS[p.npcId]
      if (!npc) continue
      placedSoFar.add(p.npcId)

      const px = p.tileX * TILE + TILE / 2
      const py = p.tileY * TILE + TILE / 2

      const sprite = this.add.image(px, py, npc.spriteKey).setScale(1).setDepth(5).setAlpha(0)

      const label = this.add.text(px, py - 22, npc.name, {
        fontSize: '8px', fontFamily: 'monospace', color: '#7ee2c1',
      }).setOrigin(0.5).setDepth(6).setAlpha(0)

      this.npcSprites.push({ sprite, npc, label, tileX: p.tileX, tileY: p.tileY })
    }
  }

  /**
   * Level-1 opening: narrate the intern's mood, walk Anjali in from the
   * lobby's north door, auto-launch her dialogue. Runs once per save.
   */
  private runOpeningSequence() {
    const anjali = this.npcSprites.find(n => n.npc.id === 'anjali')
    if (!anjali) return

    // Stash her destination, hide her until the narration ends.
    const destX = anjali.tileX * TILE + TILE / 2
    const destY = anjali.tileY * TILE + TILE / 2
    anjali.sprite.setVisible(false)
    anjali.label.setVisible(false)

    this.canMove = false

    // Establish Dana through her notebook. The intern has never met her
    // — she's a presence-through-absence, a previous occupant of this
    // desk who left guidance behind. Sets up the briefing card as
    // "Dana's notebook" rather than an in-ear voice from a stranger.
    showNarration(this, [
      'There’s a notebook on your desk. Not yours.',
      'Someone named Dana wrote in it.',
      'Diagrams. Step-by-steps. Worked examples. Like a handover she never got to give in person.',
    ], () => {
      this.startAnjaliEntrance(anjali, destX, destY)
    }, { ignoreCameras: [this.cameras.main] })
  }

  private startAnjaliEntrance(
    anjali: NPCSprite,
    destX: number,
    destY: number,
  ) {
    this.time.delayedCall(400, () => {
      // Anjali enters from the lobby's north door and walks south to
      // her placement tile. Door tile is the player's spawn column,
      // y=32 (LOBBY's top edge).
      const startX = this.mapDef.playerStart.x * TILE + TILE / 2
      const startY = 32 * TILE + TILE / 2
      anjali.sprite.setPosition(startX, startY)
      anjali.label.setPosition(startX, startY - 22)
      anjali.sprite.setVisible(true).setAlpha(0)
      anjali.label.setVisible(true).setAlpha(0)
      anjali.sprite.setTexture('npc_anjali')

      this.tweens.add({
        targets: [anjali.sprite, anjali.label],
        alpha: 1,
        duration: 350,
      })
      // Walk the sprite down the lobby aisle.
      this.tweens.add({
        targets: anjali.sprite,
        x: destX,
        y: destY,
        duration: 1700,
        delay: 200,
        ease: 'Sine.easeInOut',
      })
      // Label tracks the sprite, offset 22px above it.
      this.tweens.add({
        targets: anjali.label,
        x: destX,
        y: destY - 22,
        duration: 1700,
        delay: 200,
        ease: 'Sine.easeInOut',
        onComplete: () => {
          // Mark the sequence done so it doesn't replay.
          const s = getState()
          s.introOpeningPlayed = true
          saveGame()
          // Auto-launch the dialogue, mirroring what interact() does.
          this.canMove = false
          this.scene.pause()
          this.scene.launch('Dialogue', {
            dialogueKey: 'anjali_intro',
            callingScene: 'Hospital',
          })
        },
      })
    })
  }

  /**
   * Auto-launch Anjali's thank-you dialogue if she's still here, the
   * intro case is solved, and we haven't done it yet. Fires on the
   * Hospital scene's create() right after a return-from-WR.
   */
  /**
   * Wake-up transition after a puzzle submit. The Hospital fades back
   * in heavily blurred (via a CSS backdrop-filter on a fixed overlay).
   * A "CLAIM SUBMITTED" panel pops in the center and fades; the blur
   * gradually clears. When it's done, the caller's onComplete fires —
   * typically Anjali's thank-you dialogue.
   */
  /**
   * Start a random Hospital ambient track on a 2.5s fade-in. If the
   * cinematic intro song is still playing, defer until it ends so the
   * two music beds don't fight. Skips if any hospital_* track is
   * already playing globally (e.g. we re-entered Hospital from a WR
   * round-trip and the prior track is still going).
   */
  private startHospitalAmbience() {
    const tracks = ['hospital_twin_peaks', 'hospital_mulholland', 'hospital_blade_runner']
    if (tracks.some(k => this.sound.get(k)?.isPlaying)) return

    const introSong = this.sound.get('intro_song')
    if (introSong && introSong.isPlaying) {
      // Wait for the cinematic song to finish, then start the bed.
      introSong.once('complete', () => {
        if (this.scene.isActive()) this.startHospitalAmbience()
      })
      return
    }

    const key = tracks[Math.floor(Math.random() * tracks.length)]
    if (!this.cache.audio.exists(key)) return
    const ambient = this.sound.add(key, { volume: 0, loop: true })
    ambient.play()
    this.tweens.add({
      targets: ambient,
      volume: 0.35,
      duration: 2500,
    })
  }

  /** Fade out any hospital_* ambience that's playing globally. Used
   *  when leaving the Hospital (descent into the WR). */
  private fadeOutHospitalAmbience(durationMs: number) {
    for (const key of ['hospital_twin_peaks', 'hospital_mulholland', 'hospital_blade_runner']) {
      const s = this.sound.get(key)
      if (!s || !s.isPlaying) continue
      this.tweens.add({
        targets: s,
        volume: 0,
        duration: durationMs,
        onComplete: () => {
          s.stop()
          s.destroy()
        },
      })
    }
  }

  private runWakeUpTransition(claimId: string | null, onComplete: () => void) {
    this.canMove = false
    runWakeUpTransition(this, claimId, onComplete)
  }

  private maybeRunAnjaliThanks() {
    const state = getState()
    // Defensive: if any precondition isn't met we still want movement
    // re-enabled (the wake-up transition disabled it expecting we'd
    // hand off to a dialogue here).
    if (state.anjaliThanked) {
      this.canMove = true
      return
    }
    if (!state.defeatedObstacles.includes('intro_wrong_card')) {
      this.canMove = true
      return
    }
    const anjali = this.npcSprites.find(n => n.npc.id === 'anjali')
    if (!anjali) {
      this.canMove = true
      return
    }

    this.canMove = false
    this.time.delayedCall(700, () => {
      this.scene.pause()
      this.scene.launch('Dialogue', {
        dialogueKey: 'anjali_thanks',
        callingScene: 'Hospital',
        onComplete: () => {
          // Mark thanked + flag the leave; the resume handler will
          // pick up pendingAnjaliLeave and run the walk-out.
          const s = getState()
          s.anjaliThanked = true
          s.pendingAnjaliLeave = true
          saveGame()
        },
      })
    })
  }

  /** Walk Anjali back out the lobby's north door, fading as she goes,
   *  then drop her sprite + label so she stops being engageable. */
  private runAnjaliLeave() {
    const anjali = this.npcSprites.find(n => n.npc.id === 'anjali')
    if (!anjali) return
    this.canMove = false
    const exitX = this.mapDef.playerStart.x * TILE + TILE / 2
    const exitY = (32 - 1) * TILE + TILE / 2
    this.tweens.add({
      targets: anjali.sprite,
      x: exitX,
      y: exitY,
      alpha: 0,
      duration: 1500,
      ease: 'Sine.easeIn',
      onComplete: () => {
        anjali.sprite.destroy()
        anjali.label.destroy()
        this.npcSprites = this.npcSprites.filter(n => n.npc.id !== 'anjali')
        this.canMove = true
      },
    })
    this.tweens.add({
      targets: anjali.label,
      x: exitX,
      y: exitY - 22,
      alpha: 0,
      duration: 1500,
      ease: 'Sine.easeIn',
    })
  }

  // showClaimPreview lives in ./claimPreview — pure DOM overlay, no
  // scene state.

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

    // Toast that flashes when the player bumps a solid object or
    // examines a tile. Anchored to the bottom-center of the viewport,
    // hidden until triggered. Larger font on touch devices so it's
    // legible without fullscreen.
    const screenW = this.scale.width
    const screenH = this.scale.height
    const mobile = isTouchDevice()
    this.lockedToast = this.add.text(
      screenW / 2,
      screenH - (mobile ? 80 : 60),
      '',
      {
        fontSize: mobile ? '15px' : '12px',
        fontFamily: 'monospace',
        color: '#f4d06f',
        backgroundColor: '#1f1208cc',
        padding: { x: mobile ? 12 : 8, y: mobile ? 6 : 4 },
        align: 'center',
      },
    ).setOrigin(0.5).setScrollFactor(0).setDepth(120).setAlpha(0)

    this.refreshHUD()
  }

  private buildMiniMap() {
    const screenW = this.scale.width
    const screenH = this.scale.height

    // Full-screen dim backdrop shown only in expanded mode.
    this.miniMapDim = this.add.rectangle(0, 0, screenW, screenH, 0x000000, 0.7)
      .setOrigin(0, 0).setDepth(98).setVisible(false)
      .setInteractive() // swallows clicks behind the expanded map

    this.miniMapBg = this.add.graphics().setDepth(99)
    this.miniMapTiles = this.add.graphics().setDepth(100)
    this.miniMapPlayer = this.add.graphics().setDepth(101)

    // Pre-create one label per room. Position, font, and text are
    // re-applied in applyMiniMapLayout based on collapsed/expanded.
    for (const _ of this.mapDef.rooms ?? []) {
      const label = this.add.text(0, 0, '', {
        fontFamily: 'monospace',
        color: '#fff7e0',
        fontStyle: 'bold',
        align: 'center',
        stroke: '#1f1208',
        strokeThickness: 2,
      }).setOrigin(0.5).setDepth(102).setVisible(false)
      this.miniMapLabels.push(label)
    }

    // Hit zone over the minimap rect — click to toggle expand/collapse.
    this.miniMapHitZone = this.add.zone(0, 0, 1, 1)
      .setOrigin(0, 0).setDepth(103).setInteractive({ useHandCursor: true })
    this.miniMapHitZone.on('pointerdown', () => this.toggleMiniMapExpanded())

    // Expanded-mode close hint (top of screen).
    this.miniMapCloseHint = this.add.text(screenW / 2, 14,
      'click anywhere to close', {
        fontFamily: 'monospace', fontSize: '11px',
        color: '#c8a040',
      }).setOrigin(0.5, 0).setDepth(104).setVisible(false)

    const miniMapObjs: Phaser.GameObjects.GameObject[] = [
      this.miniMapDim, this.miniMapBg, this.miniMapTiles, this.miniMapPlayer,
      ...this.miniMapLabels, this.miniMapHitZone, this.miniMapCloseHint,
    ]
    if (this.lockedToast) miniMapObjs.push(this.lockedToast)

    // Main camera ignores the minimap; UI camera ignores everything else.
    this.cameras.main.ignore(miniMapObjs)
    this.uiCamera.ignore(this.children.list.filter(c => !miniMapObjs.includes(c)))

    this.applyMiniMapLayout()
  }

  /** Resolve cell size, position, frame, label fonts, and hit zone
   *  bounds based on the current expand state. Called on build and
   *  on every toggle. */
  private applyMiniMapLayout() {
    const { width: mw, height: mh } = this.mapDef
    const screenW = this.scale.width
    const screenH = this.scale.height

    if (this.miniMapExpanded) {
      // Fit to viewport with comfortable margins.
      this.miniMapCell = Math.max(4, Math.min(
        Math.floor((screenW - 80) / mw),
        Math.floor((screenH - 100) / mh),
      ))
    } else {
      this.miniMapCell = Math.max(1, Math.min(3, Math.floor(180 / mw))) || 1
    }
    const cell = this.miniMapCell
    const innerW = mw * cell
    const innerH = mh * cell
    const pad = this.miniMapExpanded ? 12 : 4
    const totalW = innerW + pad * 2
    const totalH = innerH + pad * 2

    if (this.miniMapExpanded) {
      this.miniMapX = Math.floor((screenW - totalW) / 2)
      this.miniMapY = Math.floor((screenH - totalH) / 2)
    } else {
      this.miniMapX = screenW - totalW - 8
      this.miniMapY = 8
    }

    // Frame + fill.
    this.miniMapBg.clear()
    this.miniMapBg.fillStyle(0x140a05, 0.92)
    this.miniMapBg.fillRect(this.miniMapX, this.miniMapY, totalW, totalH)
    this.miniMapBg.lineStyle(this.miniMapExpanded ? 2 : 1, 0xc8a040, 0.7)
    this.miniMapBg.strokeRect(
      this.miniMapX + 0.5, this.miniMapY + 0.5, totalW - 1, totalH - 1,
    )

    // Hit zone — covers full screen in expanded mode (click outside
    // to close), or just the minimap rect in collapsed mode.
    if (this.miniMapHitZone) {
      if (this.miniMapExpanded) {
        this.miniMapHitZone.setPosition(0, 0).setSize(screenW, screenH)
      } else {
        this.miniMapHitZone.setPosition(this.miniMapX, this.miniMapY)
          .setSize(totalW, totalH)
      }
      this.miniMapHitZone.input!.hitArea.setTo(
        0, 0,
        this.miniMapHitZone.width, this.miniMapHitZone.height,
      )
    }

    this.miniMapDim?.setVisible(this.miniMapExpanded)
    this.miniMapCloseHint?.setVisible(this.miniMapExpanded)

    // Reposition + restyle labels.
    const ox = this.miniMapX + pad
    const oy = this.miniMapY + pad
    const rooms = this.mapDef.rooms ?? []
    for (let i = 0; i < rooms.length; i++) {
      const r = rooms[i]
      const label = this.miniMapLabels[i]
      if (!label) continue
      const cx = ox + (r.x + r.w / 2) * cell
      const cy = oy + (r.y + r.h / 2) * cell
      label.setPosition(cx, cy)
      label.setText(this.miniMapExpanded ? r.name : (r.shortName ?? r.name))
      label.setFontSize(this.miniMapExpanded ? 14 : 7)
      label.setStyle({
        wordWrap: { width: Math.max(24, r.w * cell - 2), useAdvancedWrap: true },
      })
    }

    this.redrawMiniMapTiles()
  }

  private toggleMiniMapExpanded() {
    this.miniMapExpanded = !this.miniMapExpanded
    this.applyMiniMapLayout()
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

  private flashFlavorToast(message: string) {
    if (!this.lockedToast) return
    this.lockedToast.setText(message)
    this.lockedToastTween?.stop()
    this.lockedToast.setAlpha(1)
    // Hold longer when the message is multi-line — give the player
    // time to read each beat. Roughly 700ms per line, capped at 4s.
    const lineCount = message.split('\n').length
    const holdMs = Math.min(4000, 900 + lineCount * 700)
    this.lockedToastTween = this.tweens.add({
      targets: this.lockedToast,
      alpha: 0,
      delay: holdMs,
      duration: 500,
      ease: 'Sine.easeIn',
    })
  }

  /** Press-E examine: look up the tile in front of the player and
   *  show its flavor text if any. "In front" is determined by the
   *  player's current facing texture. */
  private examineFacingTile() {
    const dir = this.facingDelta()
    const tx = this.playerTileX + dir.dx
    const ty = this.playerTileY + dir.dy
    const ch = this.mapDef.layout[ty]?.[tx]
    const flavor = ch ? flavorForTile(ch, tx, ty) : undefined
    if (flavor) this.flashFlavorToast(flavor)
  }

  private facingDelta(): { dx: number; dy: number } {
    const tex = this.player.texture.key
    if (tex === 'player_up') return { dx: 0, dy: -1 }
    if (tex === 'player_side') return { dx: this.player.flipX ? -1 : 1, dy: 0 }
    return { dx: 0, dy: 1 } // 'player' = facing down
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

    // Face the direction of intent before checking blockers — so the
    // sprite reads as "looking that way" even when bonking a wall.
    this.faceDirection(dx, dy)

    if (this.isSolid(newX, newY)) {
      const ch = this.mapDef.layout[newY]?.[newX]
      const flavor = ch ? flavorForTile(ch, newX, newY) : undefined
      if (flavor) this.flashFlavorToast(flavor)
      return
    }

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
      scaleY: 0.92, // 8% squash from base 1
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

    // Reveal each room label once any tile inside it has been seen.
    const rooms = this.mapDef.rooms ?? []
    for (let i = 0; i < rooms.length; i++) {
      const r = rooms[i]
      const label = this.miniMapLabels[i]
      if (!label) continue
      let seen = false
      for (let yy = r.y; yy < r.y + r.h && !seen; yy++) {
        for (let xx = r.x; xx < r.x + r.w; xx++) {
          if (this.tileVisState[yy]?.[xx] !== VIS_HIDDEN) { seen = true; break }
        }
      }
      label.setVisible(seen)
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
  }

  private interact() {
    // Don't interact while frozen (e.g. during the opening notebook
    // narration, the claim preview, or a transition).
    if (!this.canMove) return
    if (this.nearbyNpc) {
      this.canMove = false
      this.interactPrompt.setVisible(false)

      // Per-level dialogue override: if the current level routes this
      // NPC to a different intake tree, use it. Falls back to the
      // NPC's default dialogueKey otherwise.
      const lvl = getState().currentLevel
      const override = LEVEL_NPC_DIALOGUES[lvl]?.[this.nearbyNpc.npc.id]
      const dialogueKey = override ?? this.nearbyNpc.npc.dialogueKey

      this.scene.pause()
      this.scene.launch('Dialogue', {
        dialogueKey,
        callingScene: 'Hospital',
      })
      return
    }
    // No nearby NPC — try examining whatever the player is facing.
    this.examineFacingTile()
  }

  /**
   * Hospital → Waiting Room transition. Triggered from a dialogue
   * handoff (the player isn't supposed to *want* to descend; cases
   * pull them in). Animation reads as "the floor goes liquid":
   *   1. Three concentric red rings ripple outward from the player.
   *   2. The player rotates + drops + fades + squashes vertically.
   *   3. A red flash washes over the camera as the floor "claims" them.
   *   4. Camera fades to black; WR starts.
   * Total ~1100ms — long enough for the metaphor to read, short
   * enough that it doesn't get tiresome on repeat plays.
   */
  private descendThroughGap(activeEncounterId: string) {
    // Descent is dialogue-driven now; canMove is intentionally false
    // when we get here (set by the claim-preview step that runs
    // before us). No guard needed.
    this.canMove = false

    // Cross-fade hospital ambience out so the WR's red_room track can
    // fade in without overlap.
    this.fadeOutHospitalAmbience(900)

    const px = this.player.x
    const py = this.player.y

    // Floor ripple — three concentric magenta/red rings expanding from
    // the player's tile. World-space, so they read as physical waves
    // on the floor instead of a screen-space FX flash.
    for (let i = 0; i < 3; i++) {
      const ring = this.add.graphics().setDepth(20).setAlpha(0)
      ring.lineStyle(2, 0xb13050, 1)
      ring.strokeCircle(px, py, 4)
      this.tweens.add({
        targets: ring,
        alpha: 0.9,
        duration: 120,
        delay: i * 110,
        yoyo: true,
        hold: 280,
        onComplete: () => ring.destroy(),
      })
      this.tweens.add({
        targets: ring,
        scale: 6,
        duration: 700,
        delay: i * 110,
        ease: 'Cubic.easeOut',
      })
    }

    // Player drops, slow rotation, squash, fade. Slight delay so the
    // ripple lands first.
    this.tweens.add({
      targets: this.player,
      y: py + TILE * 4,
      alpha: 0,
      scaleY: 0.6, // ~40% squash from base 1
      angle: 220,
      duration: 800,
      delay: 150,
      ease: 'Sine.easeIn',
    })

    // Red flash overlay (screen-space) just before the camera fade —
    // a moment of "the WR is bleeding through" before the cut.
    const { width, height } = this.scale
    const flash = this.add.rectangle(width / 2, height / 2, width, height, 0x6a0d10, 0)
      .setScrollFactor(0).setDepth(50)
    this.tweens.add({
      targets: flash,
      alpha: 0.55,
      delay: 700,
      duration: 200,
      yoyo: true,
      hold: 80,
      onComplete: () => flash.destroy(),
    })

    // Camera fade-to-black + start WR on completion. Pass the
    // player's current Hospital tile so the WR layer drops them at
    // the corresponding tile in the parallel layer (same map, same
    // room, same coords) instead of teleporting to the map's gapTile.
    const spawnTileX = this.playerTileX
    const spawnTileY = this.playerTileY
    this.cameras.main.fadeOut(900, 0, 0, 0)
    this.cameras.main.once('camerafadeoutcomplete', () => {
      const state = getState()
      state.inWaitingRoom = true
      saveGame()
      this.scene.start('WaitingRoom', { activeEncounterId, spawnTileX, spawnTileY })
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
