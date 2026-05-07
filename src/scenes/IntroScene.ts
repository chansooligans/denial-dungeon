import Phaser from 'phaser'
import { addFullscreenButton } from './fullscreenButton'

interface Beat {
  type: 'text' | 'scene' | 'wait' | 'title' | 'cover' | 'backdrop'
  lines?: string[]
  color?: string
  duration?: number
  action?: (scene: IntroScene) => void
  key?: string         // texture key for 'cover' and 'backdrop'
  alpha?: number       // target alpha for 'backdrop' (default 0.35)
}

const BEATS: Beat[] = [
  // Cover splash — full-bleed title page art before narration begins.
  { type: 'cover', key: 'intro_cover', duration: 3200 },

  // Beat 1: The Hook — text only over plain dark background.
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
    'You are a part-time intern',
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

  // Beat 5: The Gap (procedural only; comic art shown as full reveal at end).
  { type: 'scene', action: (s) => s.showGap() },
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

  // End reveal: full-bleed comic pages — the gap, then the waiting room.
  { type: 'cover', key: 'intro_page5', duration: 4200 },
  { type: 'cover', key: 'intro_page6', duration: 4800 },

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
  // Comic-page atmosphere layer (low alpha, behind procedural visuals + text).
  private backdrop?: Phaser.GameObjects.Image
  // Full-bleed cover image used as opening splash; destroyed after fade.
  private coverImage?: Phaser.GameObjects.Image

  // Click-to-advance state.
  private isTyping = false
  private canAdvance = false
  // When set, replaces the default "currentBeat++ then playBeat" advance.
  // Used by cover beats so the click-handler can fade the cover out before
  // moving to the next beat.
  private advanceCallback?: () => void
  // Per-text-beat typing state, so a click during typing can fast-forward.
  private typingEvents: Phaser.Time.TimerEvent[] = []
  private typingTextData: { t: Phaser.GameObjects.Text; line: string }[] = []
  private typingFinishedTimer?: Phaser.Time.TimerEvent
  // Pulsing "click to continue" indicator at bottom of screen.
  private continuePrompt!: Phaser.GameObjects.Text

  constructor() {
    super('Intro')
  }

  create() {
    this.currentBeat = 0
    this.done = false
    this.textObjects = []
    this.pendingTimer = undefined
    this.backdrop = undefined
    this.coverImage = undefined
    this.isTyping = false
    this.canAdvance = false
    this.advanceCallback = undefined
    this.typingEvents = []
    this.typingTextData = []
    this.typingFinishedTimer = undefined

    const { width, height } = this.scale

    this.sceneContainer = this.add.container(0, 0)

    this.skipText = this.add.text(width - 16, height - 16, '⏭ skip intro', {
      fontSize: '14px', fontFamily: 'monospace', color: '#7ee2c1',
      backgroundColor: '#0e1116cc',
      padding: { left: 10, right: 10, top: 6, bottom: 6 },
    }).setOrigin(1, 1).setDepth(1100).setInteractive({ useHandCursor: true })
    this.skipText.on('pointerdown', (
      _p: Phaser.Input.Pointer, _x: number, _y: number,
      event?: { stopPropagation?: () => void },
    ) => {
      event?.stopPropagation?.()
      this.skipToTitle()
    })

    addFullscreenButton(this)

    this.continuePrompt = this.add.text(
      width / 2, height - 30,
      '▼  click or SPACE to continue',
      {
        fontSize: '12px', fontFamily: 'monospace', color: '#7ee2c1',
        stroke: '#05070a', strokeThickness: 2,
      }
    ).setOrigin(0.5).setDepth(110).setAlpha(0)

    this.input.keyboard!.on('keydown-ESC', () => this.skipToTitle())
    this.input.keyboard!.on('keydown-SPACE', () => this.userAdvance())
    this.input.keyboard!.on('keydown-ENTER', () => this.userAdvance())
    this.input.on('pointerdown', () => this.userAdvance())

    this.playBeat()
  }

  /** Click / SPACE / ENTER handler. */
  private userAdvance() {
    if (this.done) return
    // Mid-typing: collapse all currently-animating text to its final form
    // and let the auto-advance fire normally a moment later. Don't skip
    // the beat itself in this case — the user is still reading.
    if (this.isTyping) {
      this.fastForwardTyping()
      return
    }
    if (!this.canAdvance) return
    this.canAdvance = false
    this.hideContinuePrompt()

    if (this.advanceCallback) {
      const cb = this.advanceCallback
      this.advanceCallback = undefined
      cb()
      return
    }

    this.currentBeat++
    this.playBeat()
  }

  private showContinuePrompt() {
    this.tweens.killTweensOf(this.continuePrompt)
    this.continuePrompt.setAlpha(0)
    this.tweens.add({
      targets: this.continuePrompt,
      alpha: 0.85,
      duration: 600,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    })
  }

  private hideContinuePrompt() {
    this.tweens.killTweensOf(this.continuePrompt)
    this.continuePrompt.setAlpha(0)
  }

  private fastForwardTyping() {
    for (const ev of this.typingEvents) ev.remove(false)
    this.typingEvents = []
    if (this.typingFinishedTimer) {
      this.typingFinishedTimer.remove(false)
      this.typingFinishedTimer = undefined
    }
    for (const { t, line } of this.typingTextData) t.setText(line)
    // Fire the typing-complete logic now (advance from text beat to wait beat).
    this.onTypingComplete()
  }

  private onTypingComplete() {
    if (this.done) return
    this.isTyping = false
    this.currentBeat++
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
      case 'cover':
        // Cover handles its own fade-in and then waits for the user.
        this.showCover(beat.key!)
        break

      case 'backdrop':
        this.setBackdrop(beat.key!, beat.alpha ?? 0.35)
        this.currentBeat++
        this.playBeat()
        break

      case 'text':
        // Show + type the lines. When typing finishes (or user fast-forwards),
        // onTypingComplete advances to the next beat (typically a 'wait').
        this.showText(beat.lines!, beat.color || '#e6edf3')
        break

      case 'wait':
        // Click-driven: wait for the user instead of a timer. Original
        // duration is preserved on the beat data but ignored here.
        this.canAdvance = true
        this.showContinuePrompt()
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

  /**
   * Cover splash: full-bleed comic page on a pure-black background. Hides
   * any active procedural visuals and backdrop so the image is alone on
   * screen. Fades in, waits for the user, fades out, then advances.
   */
  private showCover(key: string) {
    const { width, height } = this.scale

    // Hide procedural scene visuals and any active backdrop so only the
    // cover image (over solid black) is on screen.
    this.sceneContainer.setVisible(false)
    if (this.backdrop) {
      const oldBackdrop = this.backdrop
      this.backdrop = undefined
      this.tweens.add({
        targets: oldBackdrop, alpha: 0, duration: 300,
        onComplete: () => oldBackdrop.destroy(),
      })
    }
    // Clear any narration text from the previous beat (e.g. "The Waiting
    // Room.") so the cover image is alone on screen.
    for (const t of this.textObjects) t.destroy()
    this.textObjects = []
    this.typingTextData = []

    // Solid black panel sits behind the cover image so the letterboxed
    // bars of any portrait-aspect image are pure black, not the camera bg.
    const blackout = this.add.rectangle(width / 2, height / 2, width, height, 0x000000)
      .setDepth(75).setAlpha(0)

    const tex = this.textures.get(key).getSourceImage() as HTMLImageElement
    const scale = Math.min(width / tex.width, height / tex.height)

    const image = this.add.image(width / 2, height / 2, key)
      .setScale(scale).setAlpha(0).setDepth(80)
    this.coverImage = image

    const fadeIn = 700
    const fadeOut = 700

    this.tweens.add({
      targets: blackout, alpha: 1, duration: 300, ease: 'Sine.easeOut',
    })
    this.tweens.add({
      targets: image, alpha: 1, duration: fadeIn, delay: 200, ease: 'Sine.easeOut',
      onComplete: () => {
        if (this.done) {
          blackout.destroy()
          return
        }
        this.canAdvance = true
        this.showContinuePrompt()
        this.advanceCallback = () => {
          this.tweens.add({
            targets: [image, blackout], alpha: 0,
            duration: fadeOut, ease: 'Sine.easeIn',
            onComplete: () => {
              image.destroy()
              blackout.destroy()
              if (this.coverImage === image) this.coverImage = undefined
              // Restore procedural-visuals layer for any later beats.
              this.sceneContainer.setVisible(true)
              if (this.done) return
              this.currentBeat++
              this.playBeat()
            },
          })
        }
      },
    })
  }

  /**
   * Set or cross-fade the atmospheric backdrop. Backdrop sits at low depth
   * (-10) and low alpha so procedural visuals and text remain primary.
   */
  private setBackdrop(key: string, alpha: number) {
    const { width, height } = this.scale
    const old = this.backdrop

    const tex = this.textures.get(key).getSourceImage() as HTMLImageElement
    // Cover-fit so the image fills the viewport (some cropping is ok).
    const scale = Math.max(width / tex.width, height / tex.height)

    this.backdrop = this.add.image(width / 2, height / 2, key)
      .setScale(scale).setAlpha(0).setDepth(-10)

    this.tweens.add({
      targets: this.backdrop, alpha, duration: 1200, ease: 'Sine.easeOut',
    })

    if (old) {
      this.tweens.add({
        targets: old, alpha: 0, duration: 1200, ease: 'Sine.easeIn',
        onComplete: () => old.destroy(),
      })
    }
  }

  private showText(lines: string[], color: string) {
    // Reset previous beat's typing state.
    for (const t of this.textObjects) t.destroy()
    this.textObjects = []
    for (const ev of this.typingEvents) ev.remove(false)
    this.typingEvents = []
    this.typingTextData = []
    if (this.typingFinishedTimer) {
      this.typingFinishedTimer.remove(false)
      this.typingFinishedTimer = undefined
    }

    this.isTyping = true

    const { width, height } = this.scale
    const lineHeight = 28
    const startY = height / 2 - (lines.length * lineHeight) / 2

    const charDelay = 30
    const lineStagger = 80
    let maxCompletionTime = 0

    lines.forEach((line, i) => {
      const t = this.add.text(width / 2, startY + i * lineHeight, '', {
        fontSize: '20px', fontFamily: 'monospace', color,
        align: 'center',
        // Dark band + dark stroke keep text legible regardless of what
        // procedural visuals or comic art might be drawing behind it.
        backgroundColor: '#0e1116',
        padding: { x: 10, y: 4 },
        stroke: '#05070a',
        strokeThickness: 3,
      }).setOrigin(0.5).setDepth(50)

      let charIndex = 0
      const ev = this.time.addEvent({
        delay: charDelay,
        repeat: line.length - 1,
        startAt: i * lineStagger,
        callback: () => {
          charIndex++
          t.setText(line.substring(0, charIndex))
        },
      })

      this.textObjects.push(t)
      this.typingEvents.push(ev)
      this.typingTextData.push({ t, line })

      const lineCompletion = i * lineStagger + line.length * charDelay + 40
      if (lineCompletion > maxCompletionTime) maxCompletionTime = lineCompletion
    })

    // Schedule the auto-advance once the slowest line finishes typing. A
    // user click during typing (fastForwardTyping) will fire this earlier.
    this.typingFinishedTimer = this.time.delayedCall(maxCompletionTime, () => {
      this.typingFinishedTimer = undefined
      if (this.done) return
      if (!this.isTyping) return // already advanced via fast-forward
      this.onTypingComplete()
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

    // Anchor the desk grouping in the lower third of the screen so it sits
    // below the centered narration text instead of crowding it.
    const deskY = height / 2 + 130

    const desk = this.add.image(width / 2, deskY, 'h_desk').setScale(6).setAlpha(0)
    this.sceneContainer.add(desk)

    const chair = this.add.image(width / 2, deskY + 50, 'h_chair').setScale(4).setAlpha(0)
    this.sceneContainer.add(chair)

    // Monitor glow over the desk
    const glow = this.add.rectangle(width / 2 - 10, deskY - 25, 40, 30, 0x7ee2c1, 0.15).setAlpha(0)
    this.sceneContainer.add(glow)

    // Sticky note beside the monitor
    const sticky = this.add.text(width / 2 + 50, deskY - 50, '835 DOESN\'T\nMATCH — CHECK\nMONDAY', {
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

  showGap() {
    this.sceneContainer.removeAll(true)
    const { width, height } = this.scale

    // Dim foreground panel — keeps the comic backdrop subtly visible behind.
    const darkness = this.add.rectangle(width / 2, height / 2, width, height, 0x0e1116, 0.55)
    this.sceneContainer.add(darkness)

    // Floor around gap
    for (let x = 10; x < 50; x++) {
      for (let y = 15; y < 25; y++) {
        const tile = this.add.image(x * 16 + 8, y * 16 + 8, 'h_floor').setAlpha(0.2)
        this.sceneContainer.add(tile)
      }
    }

    // The gap — a jagged line of light
    const gap = this.add.graphics()
    gap.lineStyle(2, 0xf0a868, 0)
    const points = [
      { x: width / 2 - 30, y: height / 2 - 10 },
      { x: width / 2 - 10, y: height / 2 + 5 },
      { x: width / 2 + 5, y: height / 2 - 3 },
      { x: width / 2 + 20, y: height / 2 + 8 },
      { x: width / 2 + 35, y: height / 2 },
    ]
    this.sceneContainer.add(gap)

    // Animate gap appearing
    this.tweens.addCounter({
      from: 0, to: 1, duration: 1500,
      onUpdate: (tween) => {
        const val = tween.getValue() ?? 0
        gap.clear()
        gap.lineStyle(2, 0xf0a868, val)
        gap.beginPath()
        gap.moveTo(points[0].x, points[0].y)
        for (let i = 1; i < points.length; i++) {
          if (i / points.length <= val) {
            gap.lineTo(points[i].x, points[i].y)
          }
        }
        gap.strokePath()
      },
    })

    // Light pulsing from gap
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

    // Player falls vertically from above, accelerates down, exits past the
    // bottom of the viewport (gravity feel).
    const player = this.add.image(width / 2, -40, 'player').setScale(4).setAlpha(0)
    this.sceneContainer.add(player)
    // Quick fade-in so the character is visible during the drop.
    this.tweens.add({
      targets: player, alpha: 1, duration: 500,
    })
    // Drop straight down past the bottom of the screen.
    this.tweens.add({
      targets: player, y: height + 80,
      duration: 3200, ease: 'Sine.easeIn',
    })
    // Slight fade near the very end as the character disappears off-screen.
    this.tweens.add({
      targets: player, alpha: 0,
      duration: 400, delay: 2850,
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

    // Dim foreground over the comic backdrop so chairs read clearly.
    const bg = this.add.rectangle(width / 2, height / 2, width, height, 0x12151c, 0.6)
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
    if (this.typingFinishedTimer) {
      this.typingFinishedTimer.remove(false)
      this.typingFinishedTimer = undefined
    }
    for (const ev of this.typingEvents) ev.remove(false)
    this.typingEvents = []
    this.advanceCallback = undefined
    this.canAdvance = false
    this.scene.start('Title')
  }
}
