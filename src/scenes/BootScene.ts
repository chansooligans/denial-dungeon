import Phaser from 'phaser'
import { FACTION_COLOR } from '../types'
import type { Faction } from '../types'

export class BootScene extends Phaser.Scene {
  constructor() {
    super('Boot')
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
  }

  private makePlayerSprite() {
    const g = this.make.graphics({ x: 0, y: 0 })
    // Analyst — teal/cyan shirt, dark pants, friendly
    g.fillStyle(0xf5deb3) // skin
    g.fillRect(5, 0, 6, 5) // head
    g.fillStyle(0x4a9e8e) // teal shirt
    g.fillRect(3, 5, 10, 7) // torso
    g.fillRect(1, 6, 2, 5) // left arm
    g.fillRect(13, 6, 2, 5) // right arm
    g.fillStyle(0x2a323d) // dark pants
    g.fillRect(4, 12, 3, 4) // left leg
    g.fillRect(9, 12, 3, 4) // right leg
    g.fillStyle(0x3a3a3a) // hair
    g.fillRect(5, 0, 6, 2)
    g.generateTexture('player', 16, 16)
    g.destroy()
  }

  private makeNPCSprites() {
    const npcs: { key: string; shirt: number; hair: number; skin: number }[] = [
      { key: 'npc_dana', shirt: 0x6da9e3, hair: 0xc4a35a, skin: 0xf5deb3 },
      { key: 'npc_martinez', shirt: 0xffffff, hair: 0x2a2a2a, skin: 0xc68642 },
      { key: 'npc_kim', shirt: 0xa8d8a8, hair: 0x1a1a1a, skin: 0xf0c8a0 },
      { key: 'npc_jordan', shirt: 0xd4a0d4, hair: 0x8b4513, skin: 0x8d5524 },
      { key: 'npc_eddi', shirt: 0x808080, hair: 0x808080, skin: 0xb0b0b0 },
      { key: 'npc_pat', shirt: 0x3a3a6a, hair: 0xc0c0c0, skin: 0xf5deb3 },
      { key: 'npc_alex', shirt: 0x2a2a2a, hair: 0x4a2a0a, skin: 0xdeb887 },
      { key: 'npc_sam', shirt: 0xf0a868, hair: 0x6a3a1a, skin: 0xc68642 },
      { key: 'npc_carl', shirt: 0x6a6a6a, hair: 0x5a5a5a, skin: 0xf5deb3 },
      { key: 'npc_chen', shirt: 0x4a4a7a, hair: 0x1a1a1a, skin: 0xf0c8a0 },
      { key: 'npc_rivera', shirt: 0x2a4a6a, hair: 0x3a3a3a, skin: 0xc68642 },
    ]

    for (const npc of npcs) {
      const g = this.make.graphics({ x: 0, y: 0 })
      g.fillStyle(npc.skin)
      g.fillRect(5, 0, 6, 5)
      g.fillStyle(npc.shirt)
      g.fillRect(3, 5, 10, 7)
      g.fillRect(1, 6, 2, 5)
      g.fillRect(13, 6, 2, 5)
      g.fillStyle(0x2a323d)
      g.fillRect(4, 12, 3, 4)
      g.fillRect(9, 12, 3, 4)
      g.fillStyle(npc.hair)
      g.fillRect(5, 0, 6, 2)
      g.generateTexture(npc.key, 16, 16)
      g.destroy()
    }
  }

  private makeHospitalTiles() {
    let g: Phaser.GameObjects.Graphics

    // Floor — warm linoleum
    g = this.make.graphics({ x: 0, y: 0 })
    g.fillStyle(0x2a2e35)
    g.fillRect(0, 0, 16, 16)
    g.lineStyle(1, 0x323840, 0.3)
    g.strokeRect(0, 0, 16, 16)
    g.generateTexture('h_floor', 16, 16)
    g.destroy()

    // Floor variant — slightly different shade for visual variety
    g = this.make.graphics({ x: 0, y: 0 })
    g.fillStyle(0x282c33)
    g.fillRect(0, 0, 16, 16)
    g.lineStyle(1, 0x303840, 0.2)
    g.strokeRect(0, 0, 16, 16)
    g.generateTexture('h_floor2', 16, 16)
    g.destroy()

    // Carpet — for waiting areas
    g = this.make.graphics({ x: 0, y: 0 })
    g.fillStyle(0x2a3040)
    g.fillRect(0, 0, 16, 16)
    g.fillStyle(0x2e3448, 0.5)
    g.fillRect(0, 0, 8, 8)
    g.fillRect(8, 8, 8, 8)
    g.generateTexture('h_carpet', 16, 16)
    g.destroy()

    // Wall
    g = this.make.graphics({ x: 0, y: 0 })
    g.fillStyle(0x3d4550)
    g.fillRect(0, 0, 16, 16)
    g.lineStyle(1, 0x4d5560)
    g.strokeRect(0, 0, 16, 16)
    g.fillStyle(0x4d5560)
    g.fillRect(2, 2, 12, 2)
    g.generateTexture('h_wall', 16, 16)
    g.destroy()

    // Door
    g = this.make.graphics({ x: 0, y: 0 })
    g.fillStyle(0x6d5540)
    g.fillRect(0, 0, 16, 16)
    g.fillStyle(0xf0a868)
    g.fillRect(10, 6, 3, 3)
    g.lineStyle(1, 0x8d7560)
    g.strokeRect(0, 0, 16, 16)
    g.generateTexture('h_door', 16, 16)
    g.destroy()

    // Desk with monitor
    g = this.make.graphics({ x: 0, y: 0 })
    g.fillStyle(0x6d5540)
    g.fillRect(0, 4, 16, 10)
    g.fillStyle(0x7ee2c1, 0.4)
    g.fillRect(2, 5, 5, 4)
    g.generateTexture('h_desk', 16, 16)
    g.destroy()

    // Chair
    g = this.make.graphics({ x: 0, y: 0 })
    g.fillStyle(0x3a3a5a)
    g.fillRect(3, 2, 10, 10)
    g.fillStyle(0x2a2a3a)
    g.fillRect(6, 12, 4, 4)
    g.generateTexture('h_chair', 16, 16)
    g.destroy()

    // Medical equipment (vitals monitor)
    g = this.make.graphics({ x: 0, y: 0 })
    g.fillStyle(0xb0b8c0)
    g.fillRect(4, 0, 8, 14)
    g.fillStyle(0x6cd49a)
    g.fillRect(6, 2, 4, 4)
    g.generateTexture('h_equipment', 16, 16)
    g.destroy()

    // Plant — potted fern
    g = this.make.graphics({ x: 0, y: 0 })
    g.fillStyle(0x5a3a2a)
    g.fillRect(5, 10, 6, 6)
    g.fillStyle(0x3a6a3a)
    g.fillCircle(8, 6, 5)
    g.fillStyle(0x4a7a4a)
    g.fillCircle(6, 4, 3)
    g.fillCircle(10, 5, 3)
    g.generateTexture('h_plant', 16, 16)
    g.destroy()

    // Water cooler
    g = this.make.graphics({ x: 0, y: 0 })
    g.fillStyle(0xd0d8e0)
    g.fillRect(5, 0, 6, 12)
    g.fillStyle(0x6da9e3)
    g.fillRect(6, 1, 4, 4)
    g.fillStyle(0x808890)
    g.fillRect(4, 12, 8, 4)
    g.generateTexture('h_water', 16, 16)
    g.destroy()

    // Filing cabinet
    g = this.make.graphics({ x: 0, y: 0 })
    g.fillStyle(0x606870)
    g.fillRect(2, 0, 12, 16)
    g.lineStyle(1, 0x505860)
    g.lineBetween(4, 4, 12, 4)
    g.lineBetween(4, 8, 12, 8)
    g.lineBetween(4, 12, 12, 12)
    g.fillStyle(0x808890)
    g.fillRect(7, 1, 2, 2)
    g.fillRect(7, 5, 2, 2)
    g.fillRect(7, 9, 2, 2)
    g.generateTexture('h_cabinet', 16, 16)
    g.destroy()

    // Whiteboard
    g = this.make.graphics({ x: 0, y: 0 })
    g.fillStyle(0xe8e8e0)
    g.fillRect(1, 2, 14, 10)
    g.lineStyle(1, 0x808080)
    g.strokeRect(1, 2, 14, 10)
    g.fillStyle(0xef5b7b, 0.3)
    g.fillRect(3, 4, 8, 1)
    g.fillStyle(0x6da9e3, 0.3)
    g.fillRect(3, 6, 6, 1)
    g.fillStyle(0x6cd49a, 0.3)
    g.fillRect(3, 8, 10, 1)
    g.generateTexture('h_whiteboard', 16, 16)
    g.destroy()

    // Reception counter (long horizontal)
    g = this.make.graphics({ x: 0, y: 0 })
    g.fillStyle(0x5a4a3a)
    g.fillRect(0, 4, 16, 8)
    g.fillStyle(0x6d5a4a)
    g.fillRect(0, 4, 16, 3)
    g.lineStyle(1, 0x4a3a2a)
    g.strokeRect(0, 4, 16, 8)
    g.generateTexture('h_counter', 16, 16)
    g.destroy()

    // Vending machine
    g = this.make.graphics({ x: 0, y: 0 })
    g.fillStyle(0x3a3a5a)
    g.fillRect(2, 0, 12, 16)
    g.fillStyle(0x4a6a8a, 0.6)
    g.fillRect(4, 2, 8, 8)
    g.fillStyle(0xf0a868)
    g.fillRect(5, 11, 2, 2)
    g.fillStyle(0x6cd49a)
    g.fillRect(9, 11, 2, 2)
    g.generateTexture('h_vending', 16, 16)
    g.destroy()

    // Bulletin board
    g = this.make.graphics({ x: 0, y: 0 })
    g.fillStyle(0x6d5540)
    g.fillRect(1, 1, 14, 14)
    g.lineStyle(1, 0x8d7560)
    g.strokeRect(1, 1, 14, 14)
    g.fillStyle(0xf4d06f)
    g.fillRect(3, 3, 4, 4)
    g.fillStyle(0xef5b7b)
    g.fillRect(9, 4, 4, 3)
    g.fillStyle(0xd0d8e0)
    g.fillRect(4, 9, 5, 4)
    g.fillStyle(0x6da9e3)
    g.fillRect(10, 9, 3, 3)
    g.generateTexture('h_bulletin', 16, 16)
    g.destroy()

    // Bed (hospital)
    g = this.make.graphics({ x: 0, y: 0 })
    g.fillStyle(0xd0d8e0)
    g.fillRect(1, 2, 14, 12)
    g.fillStyle(0x8090a0)
    g.fillRect(1, 2, 14, 3)
    g.fillStyle(0x606870)
    g.fillRect(0, 14, 4, 2)
    g.fillRect(12, 14, 4, 2)
    g.generateTexture('h_bed', 16, 16)
    g.destroy()

    // Fax machine
    g = this.make.graphics({ x: 0, y: 0 })
    g.fillStyle(0xd0d0c8)
    g.fillRect(2, 6, 12, 8)
    g.fillStyle(0xe8e8e0)
    g.fillRect(4, 2, 8, 4)
    g.fillStyle(0x606060)
    g.fillRect(5, 8, 6, 2)
    g.fillStyle(0x6cd49a)
    g.fillRect(10, 11, 2, 2)
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
}
