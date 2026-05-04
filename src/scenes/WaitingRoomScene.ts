import Phaser from 'phaser'
import { getState, saveGame } from '../state'
import { LEVELS } from '../content/levels'

const TILE = 32
const MAP_W = 30
const MAP_H = 20

const LAYOUT = [
  'WWWWWWWWWWWWWWWWWWWWWWWWWWWWWW',
  'W............................W',
  'W..CC..CC..CC..CC..CC..CC...W',
  'W............................W',
  'W..CC..CC..CC..CC..CC..CC...W',
  'W............................W',
  'W............................W',
  'W.........TTTTTT............W',
  'W.........T....T............W',
  'W.........T....T............W',
  'W.........TTTTTT............W',
  'W............................W',
  'W..CC..CC..CC..CC..CC..CC...W',
  'W............................W',
  'W..CC..CC..CC..CC..CC..CC...W',
  'W............................W',
  'W............................W',
  'W...........D................W',
  'W............................W',
  'WWWWWWWWWWWWWWWWWWWWWWWWWWWWWW',
]

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

  constructor() {
    super('WaitingRoom')
  }

  create() {
    this.cameras.main.setBackgroundColor(0x0a0d12)
    this.canMove = true
    this.floatingPapers = []

    this.buildMap()
    this.placePlayer()
    this.addAtmosphere()
    this.setupInput()
    this.buildHUD()

    this.cameras.main.startFollow(this.player, true, 0.08, 0.08)
    this.cameras.main.setZoom(1.5)

    this.events.on('resume', () => { this.canMove = true })
  }

  private buildMap() {
    for (let y = 0; y < MAP_H; y++) {
      for (let x = 0; x < MAP_W; x++) {
        const ch = LAYOUT[y][x]
        const px = x * TILE + TILE / 2
        const py = y * TILE + TILE / 2

        this.add.image(px, py, 'wr_floor').setScale(2)

        if (ch === 'W') {
          this.add.image(px, py, 'wr_wall').setScale(2)
        } else if (ch === 'C') {
          this.add.image(px, py, 'wr_chair').setScale(2).setAlpha(0.7)
        } else if (ch === 'T') {
          this.add.image(px, py, 'wr_counter').setScale(2)
        } else if (ch === 'D') {
          this.add.image(px, py, 'h_door').setScale(2).setTint(0x6a4a8a)
        }
      }
    }

    // Ticket counter display
    const counterX = 12 * TILE + TILE / 2
    const counterY = 8 * TILE + TILE / 2
    this.ticketText = this.add.text(counterX, counterY, 'NOW SERVING\n    037', {
      fontSize: '8px', fontFamily: 'monospace', color: '#ef5b7b',
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
    // Floating papers drifting slowly
    for (let i = 0; i < 20; i++) {
      const paper = this.add.image(
        Phaser.Math.Between(2 * TILE, (MAP_W - 2) * TILE),
        Phaser.Math.Between(2 * TILE, (MAP_H - 2) * TILE),
        'wr_paper'
      ).setScale(Phaser.Math.FloatBetween(2, 4))
        .setAlpha(Phaser.Math.FloatBetween(0.05, 0.15))
        .setDepth(1)
        .setAngle(Phaser.Math.Between(-30, 30))

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

    // Subtle ambient color pulse on the camera
    this.tweens.add({
      targets: this.cameras.main,
      alpha: 0.95,
      duration: 4000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    })

    // Exit door prompt
    this.exitPrompt = this.add.text(0, 0, '[E] Return to Hospital', {
      fontSize: '9px', fontFamily: 'monospace', color: '#b18bd6',
      backgroundColor: '#0a0d12',
      padding: { x: 4, y: 2 },
    }).setOrigin(0.5).setDepth(20).setVisible(false)
  }

  private setupInput() {
    this.cursors = this.input.keyboard!.createCursorKeys()
    this.wasdKeys = {
      W: this.input.keyboard!.addKey('W'),
      A: this.input.keyboard!.addKey('A'),
      S: this.input.keyboard!.addKey('S'),
      D: this.input.keyboard!.addKey('D'),
    }
    this.input.keyboard!.on('keydown-E', () => this.tryExit())
    this.input.keyboard!.on('keydown-SPACE', () => this.tryExit())
  }

  private buildHUD() {
    const state = getState()
    const level = LEVELS[state.currentLevel - 1]

    this.hudLevel = this.add.text(10, 10, `THE WAITING ROOM — ${level?.title ?? ''}`, {
      fontSize: '10px', fontFamily: 'monospace', color: '#b18bd6',
      backgroundColor: '#0a0d1280',
      padding: { x: 4, y: 2 },
    }).setScrollFactor(0).setDepth(100)

    this.add.text(10, 28, '"Your number will be called."', {
      fontSize: '9px', fontFamily: 'monospace', color: '#5a4a6a',
      fontStyle: 'italic',
      backgroundColor: '#0a0d1280',
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
