import Phaser from 'phaser'
import { FACTION_COLOR } from '../types'
import type { Faction } from '../types'

/** Mix a hex color toward white by `amt` (0..1). Used for highlight ramps. */
function lighten(hex: number, amt: number): number {
  const r = (hex >> 16) & 0xff
  const g = (hex >> 8) & 0xff
  const b = hex & 0xff
  return (
    (Math.min(255, Math.round(r + (255 - r) * amt)) << 16) |
    (Math.min(255, Math.round(g + (255 - g) * amt)) << 8) |
    Math.min(255, Math.round(b + (255 - b) * amt))
  )
}
/** Mix a hex color toward black by `amt` (0..1). Used for shadow ramps. */
function darken(hex: number, amt: number): number {
  const r = (hex >> 16) & 0xff
  const g = (hex >> 8) & 0xff
  const b = hex & 0xff
  return (
    (Math.max(0, Math.round(r * (1 - amt))) << 16) |
    (Math.max(0, Math.round(g * (1 - amt))) << 8) |
    Math.max(0, Math.round(b * (1 - amt)))
  )
}

/**
 * Mapping from the canonical `npc_<id>` texture key the game uses
 * to the source slot in `public/sprites/npcs-raw/`. The slot name
 * encodes which LoRA-generated sheet + row the character was on
 * (npc1..npc5 × rows 0..3). Front-facing pose is column 0; other
 * columns (1=left, 2=right, 3=up) are wired to `npc_<id>_<dir>`
 * keys for future directional rendering.
 *
 * 12 canonical NPCs (matched against `src/content/npcs.ts`) plus 8
 * customs registered for future content slots — see the per-row
 * picker on `/npcs-preview.html` for the assignment UI that
 * produced this mapping.
 */
const NPC_SOURCES: Record<string, string> = {
  // Canonical roster — drives existing dialogue + placement.
  dana:     'npc5_1',
  kim:      'npc3_1',
  jordan:   'npc3_2',
  pat:      'npc5_0',
  alex:     'npc5_2',
  sam:      'npc3_3',
  martinez: 'npc1_0',
  anjali:   'npc2_1',
  carl:     'npc5_3',
  chen:     'npc2_2',
  rivera:   'npc3_0',
  eddi:     'npc2_3',
  // Custom NPCs — sprite registered for future placement; not yet
  // referenced by gameplay content.
  liana:         'npc1_1', // nurse (blue scrubs)
  dr_priya:      'npc1_2', // surgeon (green scrubs)
  dev:           'npc1_3', // orderly (teal scrubs)
  walter:        'npc2_0', // elderly patient
  dr_ethan:      'npc4_0', // physician (white coat)
  officer_reyes: 'npc4_1', // security
  joe:           'npc4_2', // janitor
  noah:          'npc4_3', // visitor
}

/**
 * Mapping from canonical hospital / Waiting Room texture key to the
 * source slot in `public/sprites/objects-raw/`. Slot names encode
 * which LoRA-generated sheet + row + col (obj1..obj5 × rows 0..3 ×
 * cols 0..3 = 80 cells total, all 64×64 transparent PNGs).
 *
 * 11 canonical replacements override the procedural draws in
 * `BootScene.makeHospitalTiles`. The remaining 69 entries register
 * new texture keys (IV stand, wheelchair, AED, etc.) for future
 * placement — they aren't referenced by any tile char yet.
 *
 * Generated from the `Auto-fill suggestions` button on the
 * `/sprites.html` Objects section (manual visual inspection of each
 * cell). Override slot-by-slot in the picker if a different
 * assignment is desired, then update this dict.
 */
const OBJECT_SOURCES: Record<string, string> = {
  // ===== Canonical replacements (override procedural draws) =====
  h_counter:    'obj1_0_0', // reception desk
  // Canonical desk uses the new desks.png sheet (3rd in row 1: wood
  // desk + monitor + plant). The 12-desk sheet is registered below
  // as h_desk_1..h_desk_12 (row-major from desks.png) so we can swap
  // visual variants per-instance without re-importing.
  h_desk:       'desks_0_2',
  h_chair:      'obj1_0_2', // office chair
  h_cabinet:    'obj1_0_3', // filing cabinet (with plant on top)
  h_bulletin:   'obj1_1_0', // cork bulletin board
  h_plant:      'obj1_1_1', // potted fern
  h_water:      'obj1_2_1', // water cooler
  h_vending:    'obj1_2_2', // snack vending machine
  h_bed:        'obj3_0_0', // hospital bed
  h_equipment:  'obj3_1_3', // vital monitor on cart
  h_fax:        'obj5_1_0', // fax machine

  // ===== New keys registered for future placement =====
  // Sheet 1 — office / lobby
  h_computer:        'obj1_1_2',
  h_printer:         'obj1_1_3',
  h_box_stack:       'obj1_2_0',
  h_armchair:        'obj1_2_3',
  h_stanchion:       'obj1_3_0',
  h_clock_wall:      'obj1_3_1',
  h_supply_cart:     'obj1_3_2',
  h_kiosk:           'obj1_3_3',
  // Sheet 2 — waiting / lobby
  h_couch:           'obj2_0_0',
  h_bench:           'obj2_0_1',
  h_side_table:      'obj2_0_2',
  h_brochure:        'obj2_0_3',
  h_directory:       'obj2_1_0',
  h_sanitizer:       'obj2_1_1',
  h_coat_rack:       'obj2_1_2',
  h_trash:           'obj2_1_3',
  h_recycle:         'obj2_2_0',
  h_plant_lobby:     'obj2_2_1',
  h_reception_bell:  'obj2_2_2',
  h_atm:             'obj2_2_3',
  h_monitor_wall:    'obj2_3_0',
  h_tablet:          'obj2_3_1',
  h_umbrella_stand:  'obj2_3_2',
  h_signin:          'obj2_3_3',
  // Sheet 3 — clinical / medical
  h_exam_table:      'obj3_0_1',
  h_iv_stand:        'obj3_0_2',
  h_wheelchair:      'obj3_0_3',
  h_stool:           'obj3_1_0',
  h_bedside:         'obj3_1_1',
  h_screen:          'obj3_1_2',
  h_med_cart:        'obj3_2_0',
  h_crash_cart:      'obj3_2_1',
  h_sink:            'obj3_2_2',
  h_biohazard:       'obj3_2_3',
  h_linen_cart:      'obj3_3_0',
  h_step:            'obj3_3_1',
  h_equip_cart:      'obj3_3_2',
  h_gurney:          'obj3_3_3',
  // Sheet 4 — facilities / safety
  h_cleaning_cart:   'obj4_0_0',
  h_mop_bucket:      'obj4_0_1',
  h_wet_floor:       'obj4_0_2',
  h_bin_cart:        'obj4_0_3',
  h_supply_cart_2:   'obj4_1_0',
  h_bin_cart_full:   'obj4_1_1',
  h_biohazard_sm:    'obj4_1_2',
  h_linen_bin:       'obj4_1_3',
  h_paper_towels:    'obj4_2_0',
  h_elevator:        'obj4_2_1',
  h_drink_counter:   'obj4_2_2',
  h_fountain:        'obj4_2_3',
  h_aed:             'obj4_3_0',
  h_payphone:        'obj4_3_1',
  h_arrow_sign:      'obj4_3_2',
  h_clock_office:    'obj4_3_3',
  // Sheet 5 — admin / records
  h_bookshelf:       'obj5_0_0',
  h_file_cart:       'obj5_0_1',
  h_cabinet_open:    'obj5_0_2',
  h_lamp:            'obj5_0_3',
  h_kiosk_admin:     'obj5_1_1',
  h_intercom:        'obj5_1_2',
  h_pneumatic:       'obj5_1_3',
  h_test_tubes:      'obj5_2_0',
  h_printer_lab:     'obj5_2_1',
  h_shredder:        'obj5_2_2',
  h_cashbox:         'obj5_2_3',
  h_med_vending:     'obj5_3_0',
  h_reception_admin: 'obj5_3_1',
  h_ticker:          'obj5_3_2',
  h_paper_stack:     'obj5_3_3',

  // Desk variants — full 4×3 grid from desks.png (12 visual styles).
  // Numbered row-major (1-indexed): row 0 → 1,2,3; row 1 → 4,5,6;
  // row 2 → 7,8,9; row 3 → 10,11,12. The canonical h_desk above
  // points at desks_0_2 (a.k.a. h_desk_3); register the rest so a
  // future tile-mapping pass can pick a different style per room.
  h_desk_1:          'desks_0_0',
  h_desk_2:          'desks_0_1',
  h_desk_3:          'desks_0_2',
  h_desk_4:          'desks_1_0',
  h_desk_5:          'desks_1_1',
  h_desk_6:          'desks_1_2',
  h_desk_7:          'desks_2_0',
  h_desk_8:          'desks_2_1',
  h_desk_9:          'desks_2_2',
  h_desk_10:         'desks_3_0',
  h_desk_11:         'desks_3_1',
  h_desk_12:         'desks_3_2',
}

export class BootScene extends Phaser.Scene {
  constructor() {
    super('Boot')
  }

  preload() {
    // Comic-page intro art. Five images:
    //   - cover  : opening title splash
    //   - page5  : "the gap" reveal (Beat 5)
    //   - page6  : "the waiting room" reveal (Beat 7)
    //   - page7  : Mercy General corridor closer (gothic figures, plague
    //              doctor, ghost — the Waiting Room bleeding into the day job)
    //   - page8  : Chloe at her desk surrounded by claims (back to work)
    // Other pages are intentionally not loaded — beats 1-4 stay procedural
    // so typed text stays clearly readable.
    this.load.image('intro_cover', 'intro/cover.png')
    this.load.image('intro_page5', 'intro/page5.png')
    this.load.image('intro_page6', 'intro/page6.png')
    this.load.image('intro_page7', 'intro/page7.jpg')
    this.load.image('intro_page8', 'intro/page8.jpg')

    // Voiceover for the cinematic IntroScene — one MP3 per text beat,
    // pre-split via whisper transcription so each line plays its own
    // audio. Keys are 'intro_voice_NN' where NN matches the text-beat
    // index (1-based, zero-padded). 18 beats total.
    for (let i = 1; i <= 18; i++) {
      const nn = String(i).padStart(2, '0')
      this.load.audio(`intro_voice_${nn}`, `audio/intro/${nn}.mp3`)
    }
    // Intro song — fades in when the user advances past the title
    // splash and runs underneath the rest of the cinematic.
    this.load.audio('intro_song', 'audio/intro/intro_song.mp3')

    // Player walk-cycle frames — 4 directions × 4 frames each, all
    // 64×64 transparent PNGs. Authored by the LoRA pipeline (see
    // reference/art-direction-roadmap.md). Loaded as individual
    // textures keyed `player_<dir>_<frame>` and stitched into
    // animations in create() below.
    const directions = ['down', 'up', 'left', 'right'] as const
    for (const dir of directions) {
      for (let i = 0; i < 4; i++) {
        this.load.image(`player_${dir}_${i}`, `sprites/player/${dir}_walk_${i}.png`)
      }
      // Per-direction idle pose (standing still). Used when the
      // player isn't moving — looks better than freezing on walk
      // frame 0 which is mid-stride.
      this.load.image(`player_idle_${dir}`, `sprites/player/idle_${dir}.png`)
    }

    // NPC sprites — same LoRA pipeline as the player, mapped from
    // public/sprites/npcs-raw/<sheet>_<row>_<col>.png to the
    // canonical `npc_<id>` texture key the rest of the game uses.
    // The 4 columns per row are the directional poses
    // (col 0 = front/down, col 1 = left, col 2 = right, col 3 = back/up).
    // For now we wire the front-facing pose to `npc_<id>` (matching
    // the existing procedural texture key) and ALSO load the other
    // three directions to dedicated keys for future use when NPCs
    // gain orientation. BootScene.makeNPCSprites checks for an
    // existing texture and skips procedural generation per-key, so
    // the LoRA art wins over the procedural fallback.
    for (const [id, slot] of Object.entries(NPC_SOURCES)) {
      this.load.image(`npc_${id}`,       `sprites/npcs-raw/${slot}_0.png`)
      this.load.image(`npc_${id}_down`,  `sprites/npcs-raw/${slot}_0.png`)
      this.load.image(`npc_${id}_left`,  `sprites/npcs-raw/${slot}_1.png`)
      this.load.image(`npc_${id}_right`, `sprites/npcs-raw/${slot}_2.png`)
      this.load.image(`npc_${id}_up`,    `sprites/npcs-raw/${slot}_3.png`)
    }

    // Hospital objects — LoRA-generated 64×64 transparent PNGs from
    // the Object contact sheet (5 sheets × 16 cells = 80 total).
    // 11 keys override existing procedural draws; the rest register
    // new texture keys for future placement. makeHospitalTiles skips
    // its procedural draw per-key when the loaded texture already
    // claimed that key (same pattern as makeNPCSprites).
    for (const [key, slot] of Object.entries(OBJECT_SOURCES)) {
      this.load.image(key, `sprites/objects-raw/${slot}.png`)
    }

    // The Hospital ambient tracks (~12MB) and Waiting Room red-room
    // tracks (~16MB) used to load here too. Moved to per-scene
    // preload (HospitalScene / WaitingRoomScene) — they're not needed
    // until the player reaches those scenes, and eager-loading them
    // delayed first paint by ~28MB of downloads on a cold start.
  }

  create() {
    this.generateSprites()
    this.registerPlayerWalkAnimations()
    // Every page reload lands on the cover — which is the splash at
    // the start of the cinematic intro. Players can hit Skip on the
    // splash to jump to the title menu.
    this.scene.start('Intro')
  }

  /** Register the four directional walk-cycle animations. Anims are
   *  global (live on AnimationManager, not per-scene), so once this
   *  fires every scene can `sprite.play('player_down_walk')` etc. */
  private registerPlayerWalkAnimations() {
    const directions = ['down', 'up', 'left', 'right'] as const
    for (const dir of directions) {
      const key = `player_${dir}_walk`
      if (this.anims.exists(key)) continue
      this.anims.create({
        key,
        frames: [0, 1, 2, 3].map(i => ({ key: `player_${dir}_${i}` })),
        frameRate: 8,
        repeat: -1,
      })
    }
  }

  private hasExistingSave(): boolean {
    try {
      return !!localStorage.getItem('denial_dungeon_save')
    } catch {
      return false
    }
  }

  private generateSprites() {
    this.makePlayerSprite()
    this.makeNPCSprites()
    this.makeHospitalTiles()
    this.makeWaitingRoomTiles()
    this.makeUIElements()
    this.makeDocumentSprites()
    this.makeEncounterPortraits()
  }

  /**
   * Higher-fidelity 32×32 character draw. More pixels per element so
   * each character can carry recognizable features (eye shape, hair
   * texture, collar, pant fold) instead of reading as a colored
   * rectangle. Generic NPC body — accessories are added on top by
   * the caller.
   */
  private drawCharacter(
    g: Phaser.GameObjects.Graphics,
    shirt: number,
    hair: number,
    skin: number,
    pants = 0x1a1a2e,
  ) {
    const HAIR_DARK = darken(hair, 0.5)
    const SHIRT_HI = lighten(shirt, 0.18)
    const SHIRT_LO = darken(shirt, 0.25)
    const SKIN_LO = darken(skin, 0.18)
    const PANTS_LO = darken(pants, 0.35)
    const SHOE = 0x1a1208
    const EYE = 0x1a1a2e
    const MOUTH = 0x6a3030

    // -- Head dome / hair cap --
    g.fillStyle(hair)
    g.fillRect(11, 1, 10, 2)
    g.fillRect(9, 2, 14, 2)
    g.fillRect(8, 3, 16, 4)
    g.fillRect(7, 4, 1, 5)
    g.fillRect(24, 4, 1, 5)
    g.fillStyle(HAIR_DARK)
    g.fillRect(8, 7, 16, 1) // hair shadow strip above forehead

    // -- Face --
    g.fillStyle(skin)
    g.fillRect(9, 8, 14, 8)
    // Cheek shading
    g.fillStyle(SKIN_LO)
    g.fillRect(9, 14, 14, 1)

    // -- Eyes --
    g.fillStyle(0xffffff)
    g.fillRect(11, 10, 3, 2) // left eye white
    g.fillRect(18, 10, 3, 2) // right eye white
    g.fillStyle(EYE)
    g.fillRect(12, 10, 2, 2) // left iris
    g.fillRect(19, 10, 2, 2) // right iris
    g.fillStyle(0xffffff)
    g.fillRect(12, 10, 1, 1) // left highlight
    g.fillRect(19, 10, 1, 1) // right highlight

    // -- Mouth --
    g.fillStyle(MOUTH)
    g.fillRect(14, 14, 4, 1)

    // -- Neck --
    g.fillStyle(SKIN_LO)
    g.fillRect(13, 16, 6, 1)

    // -- Torso (shirt) --
    g.fillStyle(shirt)
    g.fillRect(6, 17, 20, 9)
    // Shoulder slope
    g.fillStyle(SHIRT_LO)
    g.fillRect(6, 17, 1, 9)
    g.fillRect(25, 17, 1, 9)
    // Collar V
    g.fillStyle(SHIRT_LO)
    g.fillRect(15, 17, 2, 2)
    g.fillStyle(skin)
    g.fillRect(15, 17, 2, 1)
    // Light highlight on the chest
    g.fillStyle(SHIRT_HI, 1)
    g.fillRect(8, 18, 5, 4)

    // -- Arms --
    g.fillStyle(shirt)
    g.fillRect(4, 17, 2, 8)
    g.fillRect(26, 17, 2, 8)
    g.fillStyle(SHIRT_LO)
    g.fillRect(4, 24, 2, 1)
    g.fillRect(26, 24, 2, 1)
    // Hands
    g.fillStyle(skin)
    g.fillRect(4, 25, 2, 2)
    g.fillRect(26, 25, 2, 2)
    g.fillStyle(SKIN_LO)
    g.fillRect(4, 26, 2, 1)
    g.fillRect(26, 26, 2, 1)

    // -- Pants --
    g.fillStyle(pants)
    g.fillRect(8, 26, 7, 5)
    g.fillRect(17, 26, 7, 5)
    g.fillStyle(PANTS_LO)
    g.fillRect(8, 30, 7, 1) // pant cuff
    g.fillRect(17, 30, 7, 1)

    // -- Shoes --
    g.fillStyle(SHOE)
    g.fillRect(8, 31, 7, 1)
    g.fillRect(17, 31, 7, 1)
  }

  private makePlayerSprite() {
    // Protagonist matches the intro cover + page-5 illustration:
    // young woman, dark brown hair tied up in a messy bun, pale skin,
    // warm sepia sweater, dark trousers, hospital ID badge.
    //
    // Three textures: 'player' (front/down), 'player_up' (back),
    // 'player_side' (profile facing right; flipped via setFlipX for
    // left-facing). Movement code swaps the texture based on the last
    // direction the player walked.
    this.makePlayerDirection('player', 'down')
    this.makePlayerDirection('player_up', 'up')
    this.makePlayerDirection('player_side', 'side')
  }

  private makePlayerDirection(key: string, dir: 'down' | 'up' | 'side') {
    const g = this.make.graphics({ x: 0, y: 0 })
    const HAIR = 0x2a1a0e
    const HAIR_HI = lighten(HAIR, 0.18)
    const HAIR_LO = darken(HAIR, 0.4)
    const SKIN = 0xf0d9be
    const SKIN_LO = darken(SKIN, 0.18)
    const SWEATER = 0x5a4030
    const SWEATER_HI = lighten(SWEATER, 0.16)
    const SWEATER_LO = darken(SWEATER, 0.28)
    const PANTS = 0x1a1a2e
    const PANTS_LO = darken(PANTS, 0.4)
    const SHOE = 0x1a1208
    const EYE = 0x1a1a2e
    const MOUTH = 0x6a3030

    // Messy bun on top of the head (visible from every angle).
    g.fillStyle(HAIR)
    g.fillRect(14, 0, 4, 2)
    g.fillRect(13, 1, 6, 1)
    g.fillStyle(HAIR_HI)
    g.fillRect(15, 0, 2, 1)
    // Stray hair strands escaping the bun
    g.fillStyle(HAIR_LO)
    g.fillRect(11, 1, 1, 2)
    g.fillRect(20, 1, 1, 2)

    if (dir === 'up') {
      // Back of head: hair covers the face area entirely + side strands.
      g.fillStyle(HAIR)
      g.fillRect(11, 2, 10, 2)
      g.fillRect(9, 3, 14, 4)
      g.fillRect(8, 4, 16, 11)
      g.fillRect(7, 6, 1, 7)
      g.fillRect(24, 6, 1, 7)
      g.fillStyle(HAIR_LO)
      g.fillRect(8, 14, 16, 1) // shadow at the nape
      // Tiny strip of skin where the neck peeks out
      g.fillStyle(SKIN_LO)
      g.fillRect(13, 15, 6, 2)
    } else if (dir === 'side') {
      // Profile facing right. Hair on the left half (back of head),
      // face/skin on the right. One eye visible on the right.
      g.fillStyle(HAIR)
      g.fillRect(8, 3, 16, 4) // hair cap
      g.fillRect(7, 4, 1, 9)
      g.fillRect(8, 4, 8, 12) // back of head all hair
      g.fillStyle(SKIN)
      g.fillRect(16, 8, 8, 8) // face (right side only)
      // Bangs falling
      g.fillStyle(HAIR)
      g.fillRect(16, 6, 8, 2)
      g.fillRect(22, 8, 2, 3)
      // Single eye + brow
      g.fillStyle(0xffffff)
      g.fillRect(19, 10, 3, 2)
      g.fillStyle(EYE)
      g.fillRect(20, 10, 2, 2)
      g.fillStyle(0xffffff)
      g.fillRect(20, 10, 1, 1)
      g.fillStyle(MOUTH)
      g.fillRect(21, 14, 2, 1)
      // Neck
      g.fillStyle(SKIN_LO)
      g.fillRect(16, 16, 6, 1)
    } else {
      // Front (down)
      g.fillStyle(HAIR)
      g.fillRect(11, 2, 10, 2) // crown
      g.fillRect(9, 3, 14, 2)
      g.fillRect(8, 4, 16, 4)
      g.fillRect(7, 5, 1, 7)
      g.fillRect(24, 5, 1, 7)
      g.fillRect(8, 7, 16, 1) // bangs across forehead
      g.fillRect(7, 12, 1, 2) // wisp by left ear
      g.fillRect(24, 12, 1, 2) // wisp by right ear
      g.fillStyle(HAIR_LO)
      g.fillRect(8, 7, 16, 1) // bang shadow
      // Face
      g.fillStyle(SKIN)
      g.fillRect(9, 8, 14, 8)
      g.fillStyle(SKIN_LO)
      g.fillRect(9, 14, 14, 1) // cheek shading
      // Eyes
      g.fillStyle(0xffffff)
      g.fillRect(11, 10, 3, 2)
      g.fillRect(18, 10, 3, 2)
      g.fillStyle(EYE)
      g.fillRect(12, 10, 2, 2)
      g.fillRect(19, 10, 2, 2)
      g.fillStyle(0xffffff)
      g.fillRect(12, 10, 1, 1)
      g.fillRect(19, 10, 1, 1)
      // Mouth
      g.fillStyle(MOUTH)
      g.fillRect(14, 14, 4, 1)
      // Neck
      g.fillStyle(SKIN_LO)
      g.fillRect(13, 16, 6, 1)
    }

    // -- Sweater (torso) --
    g.fillStyle(SWEATER)
    g.fillRect(6, 17, 20, 9)
    g.fillStyle(SWEATER_LO)
    g.fillRect(6, 17, 1, 9)
    g.fillRect(25, 17, 1, 9)
    if (dir === 'down') {
      // Collar V + ID lanyard hint
      g.fillStyle(SWEATER_LO)
      g.fillRect(15, 17, 2, 2)
      g.fillStyle(SKIN)
      g.fillRect(15, 17, 2, 1)
      // Highlight stripe
      g.fillStyle(SWEATER_HI)
      g.fillRect(8, 18, 5, 4)
      // Hospital ID badge (yellow)
      g.fillStyle(0xf4d06f)
      g.fillRect(18, 21, 3, 3)
      g.fillStyle(0xc28a3e)
      g.fillRect(18, 23, 3, 1)
    } else if (dir === 'up') {
      // Spine shadow
      g.fillStyle(SWEATER_LO)
      g.fillRect(15, 17, 2, 9)
    } else {
      // Side: highlight on the front side, shadow on the back
      g.fillStyle(SWEATER_HI)
      g.fillRect(15, 18, 8, 5)
      g.fillStyle(SWEATER_LO)
      g.fillRect(7, 18, 4, 6)
    }

    // -- Arms / hands --
    g.fillStyle(SWEATER)
    g.fillRect(4, 17, 2, 8)
    g.fillRect(26, 17, 2, 8)
    g.fillStyle(SWEATER_LO)
    g.fillRect(4, 24, 2, 1)
    g.fillRect(26, 24, 2, 1)
    g.fillStyle(SKIN)
    g.fillRect(4, 25, 2, 2)
    g.fillRect(26, 25, 2, 2)
    g.fillStyle(SKIN_LO)
    g.fillRect(4, 26, 2, 1)
    g.fillRect(26, 26, 2, 1)

    // -- Pants --
    g.fillStyle(PANTS)
    g.fillRect(8, 26, 7, 5)
    g.fillRect(17, 26, 7, 5)
    g.fillStyle(PANTS_LO)
    g.fillRect(8, 30, 7, 1)
    g.fillRect(17, 30, 7, 1)

    // -- Shoes --
    g.fillStyle(SHOE)
    g.fillRect(8, 31, 7, 1)
    g.fillRect(17, 31, 7, 1)

    g.generateTexture(key, 32, 32)
    g.destroy()
  }

  private makeNPCSprites() {
    const npcs: { key: string; shirt: number; hair: number; skin: number; accessory?: string }[] = [
      { key: 'npc_dana', shirt: 0x6da9e3, hair: 0xc4a35a, skin: 0xf5deb3, accessory: 'glasses' },
      { key: 'npc_martinez', shirt: 0xffffff, hair: 0x2a2a2a, skin: 0xc68642, accessory: 'stethoscope' },
      { key: 'npc_kim', shirt: 0xa8d8a8, hair: 0x1a1a1a, skin: 0xf0c8a0 },
      { key: 'npc_jordan', shirt: 0xd4a0d4, hair: 0x8b4513, skin: 0x8d5524 },
      { key: 'npc_eddi', shirt: 0x808080, hair: 0x808080, skin: 0xb0b0b0 },
      { key: 'npc_pat', shirt: 0x3a3a6a, hair: 0xc0c0c0, skin: 0xf5deb3, accessory: 'glasses' },
      { key: 'npc_alex', shirt: 0x2a2a2a, hair: 0x4a2a0a, skin: 0xdeb887 },
      { key: 'npc_sam', shirt: 0xf0a868, hair: 0x6a3a1a, skin: 0xc68642 },
      { key: 'npc_carl', shirt: 0x6a6a6a, hair: 0x5a5a5a, skin: 0xf5deb3 },
      { key: 'npc_chen', shirt: 0x4a4a7a, hair: 0x1a1a1a, skin: 0xf0c8a0 },
      { key: 'npc_rivera', shirt: 0x2a4a6a, hair: 0x3a3a3a, skin: 0xc68642 },
      // Patient (Anjali) — softer palette than staff so the visitor reads
      // as a visitor, not as another desk.
      { key: 'npc_anjali', shirt: 0xb8d4e8, hair: 0x2a1a0e, skin: 0xc8a070 },
    ]

    for (const npc of npcs) {
      // Skip procedural generation when a LoRA-loaded PNG already
      // claimed this texture key in preload — the PNG is what we
      // actually want to render. Procedural draws are fallback only.
      if (this.textures.exists(npc.key)) continue
      const g = this.make.graphics({ x: 0, y: 0 })
      this.drawCharacter(g, npc.shirt, npc.hair, npc.skin)
      if (npc.accessory === 'glasses') {
        g.lineStyle(1, 0xe0e0e0)
        g.strokeRect(11, 9, 4, 4)
        g.strokeRect(17, 9, 4, 4)
        g.lineBetween(15, 11, 17, 11) // bridge
      } else if (npc.accessory === 'stethoscope') {
        // Tubing draped around the neck, dipping into the chest
        g.lineStyle(1, 0x9098a0)
        g.lineBetween(13, 16, 13, 21)
        g.lineBetween(19, 16, 19, 21)
        g.lineBetween(13, 21, 16, 24)
        g.lineBetween(19, 21, 16, 24)
        g.fillStyle(0x6a7280)
        g.fillRect(15, 24, 3, 2) // bell
      }
      g.generateTexture(npc.key, 32, 32)
      g.destroy()
    }
  }

  private makeHospitalTiles() {
    let g: Phaser.GameObjects.Graphics

    // Floor — warm beige linoleum
    g = this.make.graphics({ x: 0, y: 0 })
    g.fillStyle(0x8a7e6e)
    g.fillRect(0, 0, 16, 16)
    g.fillStyle(0x908474, 0.3)
    g.fillRect(0, 0, 8, 8)
    g.fillRect(8, 8, 8, 8)
    g.lineStyle(1, 0x7a7060, 0.25)
    g.strokeRect(0, 0, 16, 16)
    g.generateTexture('h_floor', 16, 16)
    g.destroy()

    // Floor variant — greenish hospital tile
    g = this.make.graphics({ x: 0, y: 0 })
    g.fillStyle(0x7a8070)
    g.fillRect(0, 0, 16, 16)
    g.fillStyle(0x808878, 0.3)
    g.fillRect(0, 8, 8, 8)
    g.fillRect(8, 0, 8, 8)
    g.lineStyle(1, 0x6a7060, 0.25)
    g.strokeRect(0, 0, 16, 16)
    g.generateTexture('h_floor2', 16, 16)
    g.destroy()

    // Carpet — soft blue-gray waiting area
    g = this.make.graphics({ x: 0, y: 0 })
    g.fillStyle(0x5a6878)
    g.fillRect(0, 0, 16, 16)
    g.fillStyle(0x627080, 0.4)
    g.fillRect(0, 0, 4, 4)
    g.fillRect(8, 0, 4, 4)
    g.fillRect(4, 4, 4, 4)
    g.fillRect(12, 4, 4, 4)
    g.fillRect(0, 8, 4, 4)
    g.fillRect(8, 8, 4, 4)
    g.fillRect(4, 12, 4, 4)
    g.fillRect(12, 12, 4, 4)
    g.generateTexture('h_carpet', 16, 16)
    g.destroy()

    // Wall — cream with baseboard
    g = this.make.graphics({ x: 0, y: 0 })
    g.fillStyle(0x98a0a8)
    g.fillRect(0, 0, 16, 16)
    g.fillStyle(0xa0a8b0, 0.5)
    g.fillRect(0, 0, 16, 2)
    g.fillStyle(0x706050)
    g.fillRect(0, 14, 16, 2)
    g.lineStyle(1, 0x8890a0, 0.4)
    g.lineBetween(0, 13, 16, 13)
    g.generateTexture('h_wall', 16, 16)
    g.destroy()

    // Door — wood panel with handle
    g = this.make.graphics({ x: 0, y: 0 })
    g.fillStyle(0x8a6a40)
    g.fillRect(0, 0, 16, 16)
    g.fillStyle(0x9a7a50, 0.5)
    g.fillRect(2, 1, 12, 6)
    g.fillRect(2, 9, 12, 6)
    g.lineStyle(1, 0x7a5a30)
    g.strokeRect(2, 1, 12, 6)
    g.strokeRect(2, 9, 12, 6)
    g.fillStyle(0xd0b060)
    g.fillRect(11, 7, 3, 2)
    g.generateTexture('h_door', 16, 16)
    g.destroy()

    // Desk — wood with monitor
    g = this.make.graphics({ x: 0, y: 0 })
    g.fillStyle(0x7a6040)
    g.fillRect(0, 6, 16, 10)
    g.fillStyle(0x8a7050, 0.5)
    g.fillRect(1, 6, 14, 2)
    g.fillStyle(0x303840)
    g.fillRect(2, 0, 6, 5)
    g.fillStyle(0x5090c0)
    g.fillRect(3, 1, 4, 3)
    g.fillStyle(0x404850)
    g.fillRect(4, 5, 2, 1)
    if (!this.textures.exists('h_desk')) g.generateTexture('h_desk', 16, 16)
    g.destroy()

    // Chair — neutral body so TINT.chair in HospitalScene controls
    // the actual color (Phaser tints multiply against the texture).
    g = this.make.graphics({ x: 0, y: 0 })
    g.fillStyle(0xffffff)
    g.fillRect(3, 2, 10, 8)
    g.fillStyle(0xd8d8d8, 0.4)
    g.fillRect(4, 2, 8, 2)
    g.fillStyle(0x404040)
    g.fillRect(6, 10, 4, 3)
    g.fillStyle(0x808080)
    g.fillRect(4, 13, 2, 2)
    g.fillRect(10, 13, 2, 2)
    if (!this.textures.exists('h_chair')) g.generateTexture('h_chair', 16, 16)
    g.destroy()

    // Medical equipment — vitals monitor on stand
    g = this.make.graphics({ x: 0, y: 0 })
    g.fillStyle(0xc0c8d0)
    g.fillRect(4, 0, 8, 10)
    g.fillStyle(0x1a2a1a)
    g.fillRect(5, 1, 6, 5)
    g.fillStyle(0x40d080)
    g.lineBetween(6, 4, 7, 2)
    g.lineBetween(7, 2, 8, 5)
    g.lineBetween(8, 5, 9, 3)
    g.lineBetween(9, 3, 10, 4)
    g.fillStyle(0x909898)
    g.fillRect(6, 10, 4, 2)
    g.fillRect(5, 12, 6, 1)
    g.fillRect(4, 13, 8, 3)
    if (!this.textures.exists('h_equipment')) g.generateTexture('h_equipment', 16, 16)
    g.destroy()

    // Plant — potted fern with detail
    g = this.make.graphics({ x: 0, y: 0 })
    g.fillStyle(0x8a5a30)
    g.fillRect(5, 10, 6, 5)
    g.fillStyle(0x9a6a40, 0.5)
    g.fillRect(6, 10, 4, 1)
    g.fillStyle(0x508040)
    g.fillCircle(8, 7, 5)
    g.fillStyle(0x60a050)
    g.fillCircle(6, 5, 3)
    g.fillCircle(10, 6, 3)
    g.fillStyle(0x70b060, 0.5)
    g.fillCircle(8, 4, 2)
    g.fillRect(5, 15, 6, 1)
    if (!this.textures.exists('h_plant')) g.generateTexture('h_plant', 16, 16)
    g.destroy()

    // Water cooler
    g = this.make.graphics({ x: 0, y: 0 })
    g.fillStyle(0xd8e0e8)
    g.fillRect(5, 0, 6, 12)
    g.fillStyle(0x70b8e8)
    g.fillRect(6, 1, 4, 4)
    g.fillStyle(0x90d0f0, 0.3)
    g.fillRect(6, 1, 2, 2)
    g.fillStyle(0x909898)
    g.fillRect(4, 12, 8, 4)
    g.fillStyle(0xf05050)
    g.fillRect(9, 7, 2, 1)
    g.fillStyle(0x5080e0)
    g.fillRect(5, 7, 2, 1)
    if (!this.textures.exists('h_water')) g.generateTexture('h_water', 16, 16)
    g.destroy()

    // Filing cabinet — metal with handles
    g = this.make.graphics({ x: 0, y: 0 })
    g.fillStyle(0x708090)
    g.fillRect(2, 0, 12, 16)
    g.lineStyle(1, 0x607080)
    g.lineBetween(3, 5, 13, 5)
    g.lineBetween(3, 10, 13, 10)
    g.fillStyle(0xa0a8b0)
    g.fillRect(7, 2, 3, 1)
    g.fillRect(7, 7, 3, 1)
    g.fillRect(7, 12, 3, 1)
    g.fillStyle(0x7888a0, 0.3)
    g.fillRect(3, 0, 2, 5)
    if (!this.textures.exists('h_cabinet')) g.generateTexture('h_cabinet', 16, 16)
    g.destroy()

    // Whiteboard — with colored notes
    g = this.make.graphics({ x: 0, y: 0 })
    g.fillStyle(0xf0f0e8)
    g.fillRect(1, 1, 14, 12)
    g.lineStyle(1, 0xa0a0a0)
    g.strokeRect(1, 1, 14, 12)
    g.fillStyle(0x606060)
    g.fillRect(1, 13, 14, 2)
    g.fillStyle(0xe05050, 0.6)
    g.fillRect(3, 3, 7, 1)
    g.fillStyle(0x3080e0, 0.6)
    g.fillRect(3, 5, 5, 1)
    g.fillStyle(0x40a050, 0.6)
    g.fillRect(3, 7, 9, 1)
    g.fillStyle(0xe0a020, 0.6)
    g.fillRect(3, 9, 4, 1)
    g.generateTexture('h_whiteboard', 16, 16)
    g.destroy()

    // Reception counter — polished wood
    g = this.make.graphics({ x: 0, y: 0 })
    g.fillStyle(0x6a5030)
    g.fillRect(0, 4, 16, 10)
    g.fillStyle(0x7a6040, 0.6)
    g.fillRect(0, 4, 16, 3)
    g.fillStyle(0x8a7050, 0.2)
    g.fillRect(2, 5, 12, 1)
    g.lineStyle(1, 0x5a4020, 0.6)
    g.strokeRect(0, 4, 16, 10)
    if (!this.textures.exists('h_counter')) g.generateTexture('h_counter', 16, 16)
    g.destroy()

    // Vending machine — bright and inviting
    g = this.make.graphics({ x: 0, y: 0 })
    g.fillStyle(0x4050a0)
    g.fillRect(2, 0, 12, 16)
    g.fillStyle(0x6080c0, 0.5)
    g.fillRect(4, 1, 8, 8)
    g.fillStyle(0xe06040)
    g.fillRect(5, 2, 2, 2)
    g.fillStyle(0x40c060)
    g.fillRect(9, 2, 2, 2)
    g.fillStyle(0xe0c040)
    g.fillRect(5, 5, 2, 2)
    g.fillStyle(0x4090e0)
    g.fillRect(9, 5, 2, 2)
    g.fillStyle(0x303840)
    g.fillRect(5, 10, 6, 3)
    g.fillStyle(0x40d080, 0.6)
    g.fillRect(11, 13, 2, 2)
    if (!this.textures.exists('h_vending')) g.generateTexture('h_vending', 16, 16)
    g.destroy()

    // Bulletin board — cork with colorful notes
    g = this.make.graphics({ x: 0, y: 0 })
    g.fillStyle(0x9a7a50)
    g.fillRect(1, 1, 14, 14)
    g.lineStyle(1, 0x705830)
    g.strokeRect(1, 1, 14, 14)
    g.fillStyle(0xf0e060)
    g.fillRect(3, 3, 4, 3)
    g.fillStyle(0xf08080)
    g.fillRect(9, 3, 4, 4)
    g.fillStyle(0xe0e8f0)
    g.fillRect(3, 8, 5, 4)
    g.fillStyle(0x80c0f0)
    g.fillRect(9, 9, 4, 3)
    g.fillStyle(0xe04040)
    g.fillRect(4, 3, 1, 1)
    g.fillRect(10, 3, 1, 1)
    g.fillRect(5, 8, 1, 1)
    g.fillRect(10, 9, 1, 1)
    if (!this.textures.exists('h_bulletin')) g.generateTexture('h_bulletin', 16, 16)
    g.destroy()

    // Bed — hospital with pillow and blanket
    g = this.make.graphics({ x: 0, y: 0 })
    g.fillStyle(0xe0e8f0)
    g.fillRect(1, 3, 14, 11)
    g.fillStyle(0x80b8e0)
    g.fillRect(1, 6, 14, 8)
    g.fillStyle(0xf0f0f0)
    g.fillRect(2, 3, 5, 3)
    g.fillStyle(0x505860)
    g.fillRect(0, 14, 3, 2)
    g.fillRect(13, 14, 3, 2)
    g.fillRect(0, 2, 3, 2)
    g.fillRect(13, 2, 3, 2)
    if (!this.textures.exists('h_bed')) g.generateTexture('h_bed', 16, 16)
    g.destroy()

    // Fax machine — with paper feed
    g = this.make.graphics({ x: 0, y: 0 })
    g.fillStyle(0xd8d8d0)
    g.fillRect(2, 6, 12, 8)
    g.fillStyle(0xf0f0e8)
    g.fillRect(4, 1, 8, 5)
    g.fillStyle(0x505860)
    g.fillRect(5, 8, 6, 2)
    g.fillStyle(0x40d080)
    g.fillRect(10, 11, 2, 2)
    g.fillStyle(0x606868)
    g.fillRect(4, 11, 4, 1)
    if (!this.textures.exists('h_fax')) g.generateTexture('h_fax', 16, 16)
    g.destroy()
  }

  private makeWaitingRoomTiles() {
    // Floor — slightly off, cracked
    let g = this.make.graphics({ x: 0, y: 0 })
    g.fillStyle(0x1a1e25)
    g.fillRect(0, 0, 16, 16)
    g.lineStyle(1, 0x252a33, 0.4)
    g.strokeRect(0, 0, 16, 16)
    g.lineStyle(1, 0x3a3a3a, 0.2)
    g.lineBetween(3, 0, 12, 16) // crack
    g.generateTexture('wr_floor', 16, 16)
    g.destroy()

    // Wall — darker, unsettling
    g = this.make.graphics({ x: 0, y: 0 })
    g.fillStyle(0x252833)
    g.fillRect(0, 0, 16, 16)
    g.lineStyle(1, 0x353845)
    g.strokeRect(0, 0, 16, 16)
    g.generateTexture('wr_wall', 16, 16)
    g.destroy()

    // Waiting chair — infinite repeating
    g = this.make.graphics({ x: 0, y: 0 })
    g.fillStyle(0x4a4a5a)
    g.fillRect(2, 4, 12, 8)
    g.fillStyle(0x3a3a4a)
    g.fillRect(4, 12, 3, 4)
    g.fillRect(9, 12, 3, 4)
    g.generateTexture('wr_chair', 16, 16)
    g.destroy()

    // Ticket counter
    g = this.make.graphics({ x: 0, y: 0 })
    g.fillStyle(0x3a3a4a)
    g.fillRect(0, 2, 16, 12)
    g.fillStyle(0xef5b7b)
    g.fillRect(4, 4, 8, 6) // red number display
    g.generateTexture('wr_counter', 16, 16)
    g.destroy()

    // Floating paper particle
    g = this.make.graphics({ x: 0, y: 0 })
    g.fillStyle(0xd0d0d0, 0.6)
    g.fillRect(0, 0, 6, 8)
    g.lineStyle(1, 0xa0a0a0, 0.4)
    g.lineBetween(1, 2, 5, 2)
    g.lineBetween(1, 4, 4, 4)
    g.generateTexture('wr_paper', 6, 8)
    g.destroy()
  }

  private makeUIElements() {
    // Text box background
    let g = this.make.graphics({ x: 0, y: 0 })
    g.fillStyle(0x0e1116, 0.92)
    g.fillRoundedRect(0, 0, 400, 120, 8)
    g.lineStyle(2, 0x2a323d)
    g.strokeRoundedRect(0, 0, 400, 120, 8)
    g.generateTexture('ui_textbox', 400, 120)
    g.destroy()

    // Heart icon
    g = this.make.graphics({ x: 0, y: 0 })
    g.fillStyle(0xef5b7b)
    g.fillCircle(4, 4, 3)
    g.fillCircle(10, 4, 3)
    g.fillTriangle(1, 5, 13, 5, 7, 12)
    g.generateTexture('ui_heart', 14, 13)
    g.destroy()

    // Cash icon
    g = this.make.graphics({ x: 0, y: 0 })
    g.fillStyle(0x6cd49a)
    g.fillCircle(6, 6, 6)
    g.fillStyle(0x1a1e25)
    g.fillRect(5, 2, 2, 8)
    g.generateTexture('ui_cash', 12, 12)
    g.destroy()

    // Battle action button bg
    g = this.make.graphics({ x: 0, y: 0 })
    g.fillStyle(0x1f262f)
    g.fillRoundedRect(0, 0, 180, 40, 6)
    g.lineStyle(1, 0x2a323d)
    g.strokeRoundedRect(0, 0, 180, 40, 6)
    g.generateTexture('ui_action_btn', 180, 40)
    g.destroy()

    // Battle action button hover
    g = this.make.graphics({ x: 0, y: 0 })
    g.fillStyle(0x1f262f)
    g.fillRoundedRect(0, 0, 180, 40, 6)
    g.lineStyle(2, 0x7ee2c1)
    g.strokeRoundedRect(0, 0, 180, 40, 6)
    g.generateTexture('ui_action_btn_hover', 180, 40)
    g.destroy()
  }

  private makeDocumentSprites() {
    // CMS-1500 form (simplified icon)
    let g = this.make.graphics({ x: 0, y: 0 })
    g.fillStyle(0xffffff)
    g.fillRect(0, 0, 12, 16)
    g.lineStyle(1, 0xcccccc)
    g.strokeRect(0, 0, 12, 16)
    g.fillStyle(0xef5b7b)
    g.fillRect(1, 1, 10, 2) // red header
    g.fillStyle(0xaaaaaa)
    g.fillRect(2, 5, 8, 1)
    g.fillRect(2, 7, 6, 1)
    g.fillRect(2, 9, 7, 1)
    g.fillRect(2, 11, 5, 1)
    g.fillRect(2, 13, 8, 1)
    g.generateTexture('doc_cms1500', 12, 16)
    g.destroy()

    // UB-04 form
    g = this.make.graphics({ x: 0, y: 0 })
    g.fillStyle(0xffffff)
    g.fillRect(0, 0, 12, 16)
    g.lineStyle(1, 0xcccccc)
    g.strokeRect(0, 0, 12, 16)
    g.fillStyle(0x6da9e3)
    g.fillRect(1, 1, 10, 2) // blue header
    g.fillStyle(0xaaaaaa)
    g.fillRect(2, 5, 8, 1)
    g.fillRect(2, 7, 6, 1)
    g.fillRect(2, 9, 7, 1)
    g.fillRect(2, 11, 5, 1)
    g.fillRect(2, 13, 8, 1)
    g.generateTexture('doc_ub04', 12, 16)
    g.destroy()

    // 835 remittance
    g = this.make.graphics({ x: 0, y: 0 })
    g.fillStyle(0xf0f0e8)
    g.fillRect(0, 0, 12, 16)
    g.lineStyle(1, 0xcccccc)
    g.strokeRect(0, 0, 12, 16)
    g.fillStyle(0x6cd49a)
    g.fillRect(1, 1, 10, 2)
    g.fillStyle(0xaaaaaa)
    g.fillRect(2, 5, 8, 1)
    g.fillRect(2, 7, 6, 1)
    g.fillRect(2, 9, 7, 1)
    g.generateTexture('doc_835', 12, 16)
    g.destroy()

    // EOB
    g = this.make.graphics({ x: 0, y: 0 })
    g.fillStyle(0xfff8e8)
    g.fillRect(0, 0, 12, 16)
    g.lineStyle(1, 0xcccccc)
    g.strokeRect(0, 0, 12, 16)
    g.fillStyle(0xf0a868)
    g.fillRect(1, 1, 10, 2)
    g.fillStyle(0xaaaaaa)
    g.fillRect(2, 5, 8, 1)
    g.fillRect(2, 9, 6, 1)
    g.generateTexture('doc_eob', 12, 16)
    g.destroy()

    // DENIED stamp overlay
    g = this.make.graphics({ x: 0, y: 0 })
    g.lineStyle(3, 0xef5b7b, 0.8)
    g.strokeRect(2, 6, 60, 20)
    g.generateTexture('stamp_denied', 64, 32)
    g.destroy()
  }

  private makeEncounterPortraits() {
    const factions: { key: string; color: number; accent: number; icon: (g: Phaser.GameObjects.Graphics) => void }[] = [
      {
        key: 'enc_payer', color: 0x6da9e3, accent: 0x4a7ab0,
        icon: (g) => {
          // Shield shape — insurance payer
          g.fillStyle(0x6da9e3)
          g.fillRect(12, 4, 24, 20)
          g.fillTriangle(12, 24, 36, 24, 24, 38)
          g.fillStyle(0x4a7ab0)
          g.fillRect(20, 8, 8, 12)
          g.fillStyle(0xffffff, 0.3)
          g.fillRect(14, 6, 6, 4)
        },
      },
      {
        key: 'enc_provider', color: 0xec8f6e, accent: 0xc06a48,
        icon: (g) => {
          // Clipboard — provider side
          g.fillStyle(0xec8f6e)
          g.fillRect(10, 2, 28, 36)
          g.fillStyle(0xf0f0e8)
          g.fillRect(13, 8, 22, 26)
          g.fillStyle(0xc06a48)
          g.fillRect(19, 0, 10, 4)
          g.fillRect(16, 12, 16, 2)
          g.fillRect(16, 18, 12, 2)
          g.fillRect(16, 24, 14, 2)
        },
      },
      {
        key: 'enc_vendor', color: 0x6cd49a, accent: 0x48a870,
        icon: (g) => {
          // Gear — vendor/system
          g.fillStyle(0x6cd49a)
          g.fillCircle(24, 22, 14)
          g.fillStyle(0x0e1116)
          g.fillCircle(24, 22, 7)
          g.fillStyle(0x6cd49a)
          g.fillRect(22, 4, 4, 8)
          g.fillRect(22, 32, 4, 8)
          g.fillRect(8, 20, 8, 4)
          g.fillRect(32, 20, 8, 4)
        },
      },
      {
        key: 'enc_patient', color: 0xf4d06f, accent: 0xc0a040,
        icon: (g) => {
          // Person silhouette — patient
          g.fillStyle(0xf4d06f)
          g.fillCircle(24, 10, 8)
          g.fillRect(14, 20, 20, 14)
          g.fillStyle(0xc0a040)
          g.fillRect(18, 26, 4, 2)
          g.fillRect(26, 26, 4, 2)
        },
      },
      {
        key: 'enc_system', color: 0xa3aab5, accent: 0x708090,
        icon: (g) => {
          // Terminal/screen — system error
          g.fillStyle(0x708090)
          g.fillRect(8, 4, 32, 24)
          g.fillStyle(0x1a2a1a)
          g.fillRect(10, 6, 28, 20)
          g.fillStyle(0x40d080)
          g.fillRect(13, 10, 12, 2)
          g.fillRect(13, 14, 18, 2)
          g.fillRect(13, 18, 8, 2)
          g.fillStyle(0x708090)
          g.fillRect(18, 30, 12, 4)
          g.fillRect(14, 34, 20, 2)
        },
      },
    ]

    for (const f of factions) {
      const g = this.make.graphics({ x: 0, y: 0 })
      g.fillStyle(0x1a2030)
      g.fillRect(0, 0, 48, 48)
      g.lineStyle(2, f.color, 0.6)
      g.strokeRect(1, 1, 46, 46)
      f.icon(g)
      g.generateTexture(f.key, 48, 48)
      g.destroy()
    }
  }
}
