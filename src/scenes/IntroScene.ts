import Phaser from 'phaser'

interface Beat {
  type: 'text' | 'scene' | 'wait' | 'title'
  lines?: string[]
  color?: string
  duration?: number
  action?: (scene: IntroScene) => void
}

const BEATS: Beat[] = [
  // Beat 1: The Hook
  { type: 'text', lines: [
    'In the United States, it costs $215 in',
    'administrative work to process a single',
    'hospital bill.',
  ], color: '#e6edf3' },
  { type: 'wait', duration: 2200 },
  { type: 'text', lines: ['In Canada, it costs $6.'], color: '#f0a868' },
  { type: 'wait', duration: 2000 },
  { type: 'text', lines: ["That's not a typo."], color: '#ef5b7b' },
  { type: 'wait', duration: 2500 },

  // Beat 2: The System
  { type: 'scene', action: (s) => s.showHospitalPan() },
  { type: 'text', lines: [
    'Every day, thousands of claims move through',
    'a system so complex that no single person',
    'understands all of it.',
  ], color: '#8b95a5' },
  { type: 'wait', duration: 3000 },
  { type: 'text', lines: [
    'Doctors document. Coders translate.',
    'Billers submit. Payers decide. Patients pay.',
  ], color: '#8b95a5' },
  { type: 'wait', duration: 3000 },
  { type: 'text', lines: [
    'And somewhere between all of them,',
    'claims get lost.',
  ], color: '#e6edf3' },
  { type: 'wait', duration: 2500 },

  // Beat 3: Your Desk
  { type: 'scene', action: (s) => s.showDesk() },
  { type: 'text', lines: [
    'You are a revenue cycle analyst',
    'at Mercy General Hospital.',
  ], color: '#e6edf3' },
  { type: 'wait', duration: 2000 },
  { type: 'text', lines: [
    "It's Friday. It's late.",
    'You should have gone home hours ago.',
  ], color: '#8b95a5' },
  { type: 'wait', duration: 2500 },

  // Beat 4: The Vanishing
  { type: 'scene', action: (s) => s.showClaimVanish() },
  { type: 'text', lines: [
    'One claim. Routine knee replacement.',
    'Filed correctly — you think.',
  ], color: '#e6edf3' },
  { type: 'wait', duration: 2000 },
  { type: 'text', lines: [
    'But when you look for it in the system...',
  ], color: '#e6edf3' },
  { type: 'wait', duration: 1500 },
  { type: 'text', lines: [
    "It's gone.",
  ], color: '#ef5b7b' },
  { type: 'wait', duration: 1200 },
  { type: 'text', lines: [
    'Not denied. Not rejected. Not pending.',
    'Gone.',
  ], color: '#ef5b7b' },
  { type: 'wait', duration: 2500 },

  // Beat 5: The Crack
  { type: 'scene', action: (s) => s.showCrack() },
  { type: 'wait', duration: 2000 },

  // Beat 6: The Fall
  { type: 'scene', action: (s) => s.showFall() },
  { type: 'wait', duration: 3500 },

  // Beat 7: The Waiting Room
  { type: 'scene', action: (s) => s.showWaitingRoom() },
  { type: 'text', lines: [
    'Below the hospital you know,',
    'there is another place.',
  ], color: '#e6edf3' },
  { type: 'wait', duration: 2500 },
  { type: 'text', lines: [
    'A place where every claim that was',
    'ever filed still exists — waiting.',
  ], color: '#8b95a5' },
  { type: 'wait', duration: 2500 },
  { type: 'text', lines: [
    'The chairs stretch on forever.',
    'The number on the ticket counter',
    'never seems to change.',
  ], color: '#8b95a5' },
  { type: 'wait', duration: 2500 },
  { type: 'text', lines: [
    'Forms fill out themselves, then unfill.',
    'Somewhere, a phone rings',
    'that no one answers.',
  ], color: '#8b95a5' },
  { type: 'wait', duration: 2500 },
  { type: 'text', lines: [
    'They call it',
  ], color: '#e6edf3' },
  { type: 'wait', duration: 1000 },
  { type: 'text', lines: [
    'The Waiting Room.',
  ], color: '#f0a868' },
  { type: 'wait', duration: 2000 },
  { type: 'text', lines: [
    'Nobody comes here on purpose.',
  ], color: '#8b95a5' },
  { type: 'wait', duration: 2500 },

  // Beat 8: Title
  { type: 'title' },
]

export class IntroScene extends Phaser.Scene {
  private currentBeat = 0
  private textObjects: Phaser.GameObjects.Text[] = []
  private sceneContainer!: Phaser.GameObjects.Container
  private skipText!: Phaser.GameObjects.Text
  private pendingTimer?: Phaser.Time.TimerEvent
  private done = false

  constructor() {
    super('Intro')
  }

  create() {
    this.currentBeat = 0
    this.done = false
    this.textObjects = []
    this.pendingTimer = undefined

    const { width, height } = this.scale

    this.sceneContainer = this.add.container(0, 0)

    this.skipText = this.add.text(width - 20, height - 20, '[SPACE / CLICK to advance · ESC to skip]', {
      fontSize: '10px', fontFamily: 'monospace', color: '#3a4a5d',
    }).setOrigin(1, 1).setDepth(100)

    this.input.keyboard!.on('keydown-SPACE', () => this.advance())
    this.input.keyboard!.on('keydown-ESC', () => this.skipToTitle())
    this.input.on('pointerdown', () => this.advance())

    this.playBeat()
  }

  private advance() {
    if (this.done) return

    if (this.pendingTimer) {
      this.pendingTimer.remove(false)
      this.pendingTimer = undefined
    }

    // Skip forward to the next wait or terminal beat
    while (this.currentBeat < BEATS.length) {
      const beat = BEATS[this.currentBeat]
      if (beat.type === 'wait') {
        this.currentBeat++
        break
      }
      if (beat.type === 'title') break
      this.currentBeat++
    }

    this.playBeat()
  }

  private playBeat() {
    if (this.done) return

    if (this.currentBeat >= BEATS.length) {
      this.skipToTitle()
      return
    }

    const beat = BEATS[this.currentBeat]

    switch (beat.type) {
      case 'text':
        this.showText(beat.lines!, beat.color || '#e6edf3')
        this.currentBeat++
        this.playBeat()
        break

      case 'wait':
        this.pendingTimer = this.time.delayedCall(beat.duration!, () => {
          this.pendingTimer = undefined
          if (!this.done && this.currentBeat < BEATS.length) {
            this.currentBeat++
            this.playBeat()
          }
        })
        break

      case 'scene':
        beat.action!(this)
        this.currentBeat++
        this.playBeat()
        break

      case 'title':
        this.skipToTitle()
        break
    }
  }

  private showText(lines: string[], color: string) {
    for (const t of this.textObjects) t.destroy()
    this.textObjects = []

    const { width, height } = this.scale
    const startY = height / 2 - (lines.length * 22) / 2

    lines.forEach((line, i) => {
      const t = this.add.text(width / 2, startY + i * 22, '', {
        fontSize: '16px', fontFamily: 'monospace', color,
        align: 'center',
      }).setOrigin(0.5).setAlpha(0).setDepth(50)

      // Typewriter effect
      this.tweens.add({ targets: t, alpha: 1, duration: 300, delay: i * 100 })

      let charIndex = 0
      this.time.addEvent({
        delay: 30,
        repeat: line.length - 1,
        startAt: i * 100,
        callback: () => {
          charIndex++
          t.setText(line.substring(0, charIndex))
        },
      })

      this.textObjects.push(t)
    })
  }

  showHospitalPan() {
    this.sceneContainer.removeAll(true)
    const { width, height } = this.scale

    // Draw a simple hospital corridor
    for (let x = 0; x < 60; x++) {
      for (let y = 0; y < 40; y++) {
        const isWall = y < 8 || y > 32 || x < 2 || x > 57
        const tile = this.add.image(
          x * 16 + 8, y * 16 + 8,
          isWall ? 'h_wall' : 'h_floor'
        ).setAlpha(0)
        this.sceneContainer.add(tile)
        this.tweens.add({ targets: tile, alpha: isWall ? 0.6 : 0.3, duration: 1000, delay: x * 10 })
      }
    }

    // Some desks scattered
    const deskPositions = [[10, 15], [20, 20], [30, 14], [40, 22], [50, 18]]
    for (const [dx, dy] of deskPositions) {
      const desk = this.add.image(dx * 16, dy * 16, 'h_desk').setScale(2).setAlpha(0)
      this.sceneContainer.add(desk)
      this.tweens.add({ targets: desk, alpha: 0.5, duration: 800, delay: 500 })
    }

    // Slow camera pan
    this.cameras.main.setBounds(0, 0, 960, 640)
  }

  showDesk() {
    this.sceneContainer.removeAll(true)
    const { width, height } = this.scale

    // Single desk with monitor glow, centered
    const desk = this.add.image(width / 2, height / 2 + 20, 'h_desk').setScale(6).setAlpha(0)
    this.sceneContainer.add(desk)

    const chair = this.add.image(width / 2, height / 2 + 70, 'h_chair').setScale(4).setAlpha(0)
    this.sceneContainer.add(chair)

    // Monitor glow
    const glow = this.add.rectangle(width / 2 - 10, height / 2 - 5, 40, 30, 0x7ee2c1, 0.15).setAlpha(0)
    this.sceneContainer.add(glow)

    // Sticky note
    const sticky = this.add.text(width / 2 + 50, height / 2 - 30, '835 DOESN\'T\nMATCH — CHECK\nMONDAY', {
      fontSize: '7px', fontFamily: 'monospace', color: '#2a2a2a',
      backgroundColor: '#f4d06f', padding: { x: 4, y: 3 },
    }).setAlpha(0).setAngle(-5)
    this.sceneContainer.add(sticky)

    this.tweens.add({ targets: [desk, chair, glow, sticky], alpha: 1, duration: 800, stagger: 200 })
  }

  showClaimVanish() {
    const { width, height } = this.scale

    // Show a claim number that blinks and vanishes
    const claimText = this.add.text(width / 2, height / 2 - 80, 'CLM-2026-04-28-00847', {
      fontSize: '14px', fontFamily: 'monospace', color: '#7ee2c1',
    }).setOrigin(0.5).setDepth(60)

    this.sceneContainer.add(claimText)

    // Blink then vanish
    this.time.delayedCall(1500, () => {
      this.tweens.add({
        targets: claimText,
        alpha: 0,
        duration: 150,
        yoyo: true,
        repeat: 3,
        onComplete: () => {
          claimText.setText('CLM-2026-04-28-?????')
          claimText.setColor('#ef5b7b')
          this.tweens.add({ targets: claimText, alpha: 0, duration: 500, delay: 800 })
        },
      })
    })
  }

  showCrack() {
    this.sceneContainer.removeAll(true)
    const { width, height } = this.scale

    // Dark room, crack forming in floor
    const darkness = this.add.rectangle(width / 2, height / 2, width, height, 0x0e1116)
    this.sceneContainer.add(darkness)

    // Floor around crack
    for (let x = 10; x < 50; x++) {
      for (let y = 15; y < 25; y++) {
        const tile = this.add.image(x * 16 + 8, y * 16 + 8, 'h_floor').setAlpha(0.2)
        this.sceneContainer.add(tile)
      }
    }

    // The crack — a jagged line of light
    const crack = this.add.graphics()
    crack.lineStyle(2, 0xf0a868, 0)
    const points = [
      { x: width / 2 - 30, y: height / 2 - 10 },
      { x: width / 2 - 10, y: height / 2 + 5 },
      { x: width / 2 + 5, y: height / 2 - 3 },
      { x: width / 2 + 20, y: height / 2 + 8 },
      { x: width / 2 + 35, y: height / 2 },
    ]
    this.sceneContainer.add(crack)

    // Animate crack appearing
    this.tweens.addCounter({
      from: 0, to: 1, duration: 1500,
      onUpdate: (tween) => {
        const val = tween.getValue() ?? 0
        crack.clear()
        crack.lineStyle(2, 0xf0a868, val)
        crack.beginPath()
        crack.moveTo(points[0].x, points[0].y)
        for (let i = 1; i < points.length; i++) {
          if (i / points.length <= val) {
            crack.lineTo(points[i].x, points[i].y)
          }
        }
        crack.strokePath()
      },
    })

    // Light pulsing from crack
    const light = this.add.rectangle(width / 2, height / 2, 80, 30, 0xf0a868, 0)
    this.sceneContainer.add(light)
    this.tweens.add({
      targets: light, alpha: 0.15, duration: 800, yoyo: true, repeat: -1, delay: 1000,
    })
  }

  showFall() {
    this.sceneContainer.removeAll(true)
    const { width, height } = this.scale

    // Falling — dark background with floating documents
    const bg = this.add.rectangle(width / 2, height / 2, width, height, 0x0a0e14)
    this.sceneContainer.add(bg)

    // Player falling slowly in center
    const player = this.add.image(width / 2, height / 3, 'player').setScale(4).setAlpha(0)
    this.sceneContainer.add(player)
    this.tweens.add({
      targets: player, alpha: 1, y: height / 2, duration: 3000, ease: 'Sine.easeInOut',
    })

    // Floating documents passing by
    const docTypes = ['doc_cms1500', 'doc_ub04', 'doc_835', 'doc_eob']
    for (let i = 0; i < 20; i++) {
      const doc = this.add.image(
        Phaser.Math.Between(50, width - 50),
        height + 20,
        Phaser.Math.RND.pick(docTypes)
      ).setScale(Phaser.Math.FloatBetween(2, 4))
        .setAlpha(Phaser.Math.FloatBetween(0.2, 0.6))
        .setAngle(Phaser.Math.Between(-30, 30))

      this.sceneContainer.add(doc)
      this.tweens.add({
        targets: doc,
        y: -30,
        x: doc.x + Phaser.Math.Between(-40, 40),
        angle: doc.angle + Phaser.Math.Between(-20, 20),
        duration: Phaser.Math.Between(2000, 4000),
        delay: Phaser.Math.Between(0, 2500),
        ease: 'Sine.easeInOut',
      })
    }
  }

  showWaitingRoom() {
    this.sceneContainer.removeAll(true)
    const { width, height } = this.scale

    // The Waiting Room — infinite chairs, dim, surreal
    const bg = this.add.rectangle(width / 2, height / 2, width, height, 0x12151c)
    this.sceneContainer.add(bg)

    // Rows of chairs fading into distance
    for (let row = 0; row < 8; row++) {
      const y = 200 + row * 50
      const alpha = 0.6 - row * 0.07
      const scale = 2 - row * 0.15
      for (let col = 0; col < 14; col++) {
        const x = 30 + col * 70 + (row % 2 ? 35 : 0)
        const chair = this.add.image(x, y, 'wr_chair')
          .setScale(scale).setAlpha(0)
        this.sceneContainer.add(chair)
        this.tweens.add({
          targets: chair, alpha, duration: 800, delay: row * 150 + col * 30,
        })
      }
    }

    // Ticket counter at far end
    const counter = this.add.image(width / 2, 120, 'wr_counter').setScale(5).setAlpha(0)
    this.sceneContainer.add(counter)
    this.tweens.add({ targets: counter, alpha: 0.7, duration: 1000, delay: 500 })

    // Number display — frozen
    const numberText = this.add.text(width / 2, 115, 'NOW SERVING: 00000', {
      fontSize: '12px', fontFamily: 'monospace', color: '#ef5b7b',
    }).setOrigin(0.5).setAlpha(0).setDepth(51)
    this.sceneContainer.add(numberText)
    this.tweens.add({ targets: numberText, alpha: 0.8, duration: 1000, delay: 800 })

    // Floating papers
    for (let i = 0; i < 8; i++) {
      const paper = this.add.image(
        Phaser.Math.Between(50, width - 50),
        Phaser.Math.Between(100, height - 100),
        'wr_paper'
      ).setScale(2).setAlpha(0)
      this.sceneContainer.add(paper)

      this.tweens.add({ targets: paper, alpha: 0.3, duration: 500, delay: 1000 + i * 200 })
      this.tweens.add({
        targets: paper,
        y: paper.y - 15,
        duration: Phaser.Math.Between(2000, 4000),
        yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
        delay: i * 300,
      })
    }
  }

  private skipToTitle() {
    if (this.done) return
    this.done = true
    if (this.pendingTimer) {
      this.pendingTimer.remove(false)
      this.pendingTimer = undefined
    }
    this.scene.start('Title')
  }
}
