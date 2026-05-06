import Phaser from 'phaser'
import { FACTION_COLOR } from '../types'
import type { Faction } from '../types'

export class BootScene extends Phaser.Scene {
  constructor() {
    super('Boot')
  }

  preload() {
    // Comic-page intro art. We use only three images:
    //   - cover  : opening title splash
    //   - page5  : "the gap" reveal (Beat 5)
    //   - page6  : "the waiting room" reveal (Beat 7)
    // Other pages are intentionally not loaded — beats 1-4 stay procedural
    // so typed text stays clearly readable.
    this.load.image('intro_cover', 'intro/cover.png')
    this.load.image('intro_page5', 'intro/page5.png')
    this.load.image('intro_page6', 'intro/page6.png')
  }

  create() {
    this.generateSprites()
    this.scene.start('Intro')
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

  private drawCharacter(g: Phaser.GameObjects.Graphics, shirt: number, hair: number, skin: number) {
    // Hair (top of head + sides)
    g.fillStyle(hair)
    g.fillRect(4, 0, 8, 3)
    g.fillRect(3, 1, 1, 3)
    g.fillRect(12, 1, 1, 3)
    // Head
    g.fillStyle(skin)
    g.fillRect(4, 2, 8, 6)
    // Eyes
    g.fillStyle(0x1a1a2e)
    g.fillRect(5, 4, 2, 2)
    g.fillRect(9, 4, 2, 2)
    // Eye highlights
    g.fillStyle(0xffffff)
    g.fillRect(5, 4, 1, 1)
    g.fillRect(9, 4, 1, 1)
    // Torso
    g.fillStyle(shirt)
    g.fillRect(3, 8, 10, 5)
    // Shirt highlight
    g.fillStyle(0xffffff, 0.12)
    g.fillRect(4, 8, 4, 2)
    // Arms
    g.fillStyle(shirt)
    g.fillRect(1, 8, 2, 4)
    g.fillRect(13, 8, 2, 4)
    // Hands
    g.fillStyle(skin)
    g.fillRect(1, 12, 2, 1)
    g.fillRect(13, 12, 2, 1)
    // Pants
    g.fillStyle(0x2a323d)
    g.fillRect(4, 13, 3, 3)
    g.fillRect(9, 13, 3, 3)
  }

  private makePlayerSprite() {
    const g = this.make.graphics({ x: 0, y: 0 })
    this.drawCharacter(g, 0x4a9e8e, 0x3a3a3a, 0xf5deb3)
    // Badge on shirt
    g.fillStyle(0xf4d06f)
    g.fillRect(10, 9, 2, 2)
    g.generateTexture('player', 16, 16)
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
      const g = this.make.graphics({ x: 0, y: 0 })
      this.drawCharacter(g, npc.shirt, npc.hair, npc.skin)
      if (npc.accessory === 'glasses') {
        g.lineStyle(1, 0xc0c0c0)
        g.strokeRect(4, 3, 4, 3)
        g.strokeRect(8, 3, 4, 3)
      } else if (npc.accessory === 'stethoscope') {
        g.lineStyle(1, 0x808890)
        g.lineBetween(7, 8, 7, 10)
        g.lineBetween(9, 8, 9, 10)
      }
      g.generateTexture(npc.key, 16, 16)
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
    g.generateTexture('h_desk', 16, 16)
    g.destroy()

    // Chair — office with wheels
    g = this.make.graphics({ x: 0, y: 0 })
    g.fillStyle(0x405080)
    g.fillRect(3, 2, 10, 8)
    g.fillStyle(0x4a5a90, 0.4)
    g.fillRect(4, 2, 8, 2)
    g.fillStyle(0x303840)
    g.fillRect(6, 10, 4, 3)
    g.fillStyle(0x505860)
    g.fillRect(4, 13, 2, 2)
    g.fillRect(10, 13, 2, 2)
    g.generateTexture('h_chair', 16, 16)
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
    g.generateTexture('h_equipment', 16, 16)
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
    g.generateTexture('h_plant', 16, 16)
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
    g.generateTexture('h_water', 16, 16)
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
    g.generateTexture('h_cabinet', 16, 16)
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
    g.generateTexture('h_counter', 16, 16)
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
    g.generateTexture('h_vending', 16, 16)
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
    g.generateTexture('h_bulletin', 16, 16)
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
    g.generateTexture('h_bed', 16, 16)
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
    g.generateTexture('h_fax', 16, 16)
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
