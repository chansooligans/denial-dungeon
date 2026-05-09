import Phaser from 'phaser'
import { addFullscreenButton } from './fullscreenButton'
import { addMuteButton } from './muteButton'
import { BEATS, type SceneActionId } from './introBeats'

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
  // Voiceover state. textBeatCounter ticks once per `text` beat played,
  // so it lines up 1:1 with the pre-split intro_voice_NN audio assets.
  private textBeatCounter = 0
  private currentVoice?: Phaser.Sound.BaseSound
  // Intro song — fades in when the user advances past the title
  // splash and carries through the rest of the cinematic.
  private introSong?: Phaser.Sound.BaseSound
  private introSongBoosted = false

  // Set by init() when scene.start('Intro', { skipToBeat: N }) is
  // called from the dev panel. Lets QA jump into a specific beat
  // without sitting through the prior cinematic.
  private skipToBeatIndex = 0
  private skipPreloadVoiceCounter = 0

  constructor() {
    super('Intro')
  }

  init(data?: { skipToBeat?: number }) {
    // Allow the dev panel (or any caller) to jump straight to a
    // specific beat by passing { skipToBeat: N } to scene.start.
    // create() picks this up below.
    this.skipToBeatIndex = typeof data?.skipToBeat === 'number'
      ? Math.max(0, Math.min(BEATS.length - 1, data.skipToBeat))
      : 0
    // Pre-advance the text-beat counter so the right voiceover plays
    // when we land mid-cinematic. (Each 'text' beat ticks the counter.)
    let voiceCounter = 0
    for (let j = 0; j < this.skipToBeatIndex; j++) {
      if (BEATS[j].type === 'text') voiceCounter += 1
    }
    this.skipPreloadVoiceCounter = voiceCounter
  }

  create() {
    this.currentBeat = this.skipToBeatIndex ?? 0
    this.textBeatCounter = this.skipPreloadVoiceCounter ?? 0
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
    this.currentVoice = undefined
    this.introSong = undefined

    const { width, height } = this.scale

    this.sceneContainer = this.add.container(0, 0)

    this.skipText = this.add.text(width - 16, height - 16, '⏭ skip intro', {
      fontSize: '28px', fontFamily: 'monospace', color: '#7ee2c1',
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
    addMuteButton(this)

    this.continuePrompt = this.add.text(
      width / 2, height - 30,
      '▼  click or SPACE to continue',
      {
        fontSize: '24px', fontFamily: 'monospace', color: '#7ee2c1',
        stroke: '#05070a', strokeThickness: 4,
      }
    ).setOrigin(0.5).setDepth(110).setAlpha(0)

    this.input.keyboard!.on('keydown-ESC', () => this.skipToTitle())
    this.input.keyboard!.on('keydown-SPACE', () => this.userAdvance())
    this.input.keyboard!.on('keydown-ENTER', () => this.userAdvance())
    // "Any key" advance — useful for the title-splash hold. Skip ESC
    // since it's already wired to skipToTitle above.
    this.input.keyboard!.on('keydown', (e: KeyboardEvent) => {
      if (e.code === 'Escape') return
      this.userAdvance()
    })
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

  private showContinuePrompt(label?: string) {
    if (label) this.continuePrompt.setText(label)
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

  /** Resolve a scene-action id from BEATS data into the actual method
   *  call. Switching keeps the registry colocated with the methods so
   *  TypeScript catches any id that doesn't have a handler. */
  private runSceneAction(id: SceneActionId) {
    switch (id) {
      case 'showHospitalPan': this.showHospitalPan(); return
      case 'showDesk':         this.showDesk(); return
      case 'showClaimVanish':  this.showClaimVanish(); return
      case 'showFall':         this.showFall(); return
      case 'showGap':          this.showGap(); return
      case 'showWaitingRoom':  this.showWaitingRoom(); return
    }
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
        // If the beat is flagged with `voice: true`, fire the next
        // narration MP3 the moment the cover mounts so the line
        // plays over the comic image instead of before it.
        this.showCover(beat.key!)
        if (beat.voice) this.playBeatVoice()
        break

      case 'backdrop':
        this.setBackdrop(beat.key!, beat.alpha ?? 0.35)
        this.currentBeat++
        this.playBeat()
        break

      case 'text':
        // Play this beat's voiceover (one MP3 per text beat).
        this.playBeatVoice()
        // Optional concurrent scene visual (e.g. the falling animation
        // that should run while "Not denied. Not rejected. Not pending.
        // Gone." types out).
        if (beat.sceneActionId) this.runSceneAction(beat.sceneActionId)
        if (beat.silent) {
          // Voice-only beat — no visible text, no typing animation.
          // Advance immediately; the following 'wait' beat extends to
          // cover the voice's full duration via remainingVoiceMs().
          this.currentBeat++
          this.playBeat()
        } else {
          // Show + type the lines. When typing finishes (or user
          // fast-forwards), onTypingComplete advances to the next
          // beat (typically a 'wait').
          this.showText(beat.lines!, beat.color || '#e6edf3')
        }
        break

      case 'wait': {
        // Auto-advance after the beat's duration — but never before the
        // current voiceover has finished. If the narration audio is
        // longer than the original wait, extend the wait so we don't
        // cut the line off when the next beat starts (and calls
        // stopVoice on us).
        const dwell = Math.max(beat.duration ?? 0, this.remainingVoiceMs() + 200)
        this.pendingTimer = this.time.delayedCall(dwell, () => {
          this.pendingTimer = undefined
          this.currentBeat++
          this.playBeat()
        })
        break
      }

      case 'scene':
        // Clear any text from the prior beat so its dark text-bg
        // rectangles don't linger on top of the new procedural visual.
        this.clearLingeringText()
        if (beat.actionId) this.runSceneAction(beat.actionId)
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
    const isTitleSplash = this.currentBeat === 0

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
    const advanceFromCover = () => {
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

    this.tweens.add({
      targets: image, alpha: 1, duration: fadeIn, delay: 200, ease: 'Sine.easeOut',
      onComplete: () => {
        if (this.done) {
          blackout.destroy()
          return
        }
        if (isTitleSplash) {
          // Hold here until the user clicks / presses any key. On
          // advance, crossfade the cover audio into the intro song
          // and dismiss the splash.
          this.canAdvance = true
          this.showContinuePrompt('press any key to begin')
          this.advanceCallback = () => {
            this.fadeInIntroSong()
            this.hideContinuePrompt()
            advanceFromCover()
          }
        } else {
          // Auto-advance after the cover's duration — but never before
          // any active voiceover finishes. Skip button still cuts to title.
          const baseDwell = BEATS[this.currentBeat]?.duration ?? 3000
          const dwell = Math.max(baseDwell, this.remainingVoiceMs() + 200)
          this.pendingTimer = this.time.delayedCall(dwell, () => {
            this.pendingTimer = undefined
            advanceFromCover()
          })
        }
      },
    })
  }

  /** Fade the intro song in. Two-stage: first ramp to a quiet bed
   *  level (0.15) over 5s — that's the pre-narration hold, where the
   *  song would otherwise feel too loud sitting alone. Once the first
   *  voiceover beat fires, `boostIntroSongForVoice` bumps it up to
   *  the under-narration level (0.5).
   *
   *  Note on song-start vs cinematic-edits: when content was cut
   *  from the cinematic ("That's not a typo." plus its 2500ms wait,
   *  ~3s wall-clock total), we keep the song firing at the same
   *  trigger-point in the cinematic but trimmed 3000ms off the
   *  *front of the audio file* (intro_song.mp3) so the music's
   *  internal phrasing still lands on the same later beats. That's
   *  better than delaying play() — a delayed play() would leave the
   *  pre-narration hold silent. */
  private fadeInIntroSong() {
    if (!this.cache.audio.exists('intro_song')) return
    this.introSong = this.sound.add('intro_song')
    // Force volume to 0 BEFORE play() so the song never bursts at
    // the default 1.0 volume — some audio backends ignore the
    // sound.add config until after the first playback tick.
    ;(this.introSong as any).setVolume?.(0)
    this.introSong.play()
    ;(this.introSong as any).setVolume?.(0)
    this.tweens.add({
      targets: this.introSong,
      volume: 0.15,
      duration: 5000,
    })
  }

  /** Bump the intro song from its quiet pre-narration level up to
   *  the under-narration mix (0.5). Called once when the first
   *  voiceover beat plays. Subsequent calls are no-ops. */
  private boostIntroSongForVoice() {
    if (!this.introSong || this.introSongBoosted) return
    this.introSongBoosted = true
    // Kill the still-running 5s pre-VO fade-in tween before pushing
    // up to the under-narration mix. Otherwise the older tween keeps
    // overwriting `volume` back toward its target and the boost
    // appears to do nothing.
    this.tweens.killTweensOf(this.introSong)
    this.tweens.add({
      targets: this.introSong,
      volume: 0.5,
      duration: 5000,
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

  /** Cancel any in-flight typing and fade out + destroy lingering
   *  text from the previous beat. Used before a `scene` beat fires
   *  so the typed text's dark background rectangle doesn't sit on
   *  top of the new procedural visual. */
  private clearLingeringText() {
    if (this.textObjects.length === 0) return
    for (const ev of this.typingEvents) ev.remove(false)
    this.typingEvents = []
    this.typingTextData = []
    if (this.typingFinishedTimer) {
      this.typingFinishedTimer.remove(false)
      this.typingFinishedTimer = undefined
    }
    const targets = this.textObjects
    this.textObjects = []
    this.tweens.add({
      targets, alpha: 0, duration: 250, ease: 'Sine.easeIn',
      onComplete: () => { for (const t of targets) t.destroy() },
    })
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
    // Doubled from 28 to match the canvas-resolution upgrade (960×640
    // → 1920×1280). Same goes for fontSize / padding / strokeThickness
    // below — keeps the on-screen visual size consistent with what
    // the cinematic was authored against.
    const lineHeight = 56
    const startY = height / 2 - (lines.length * lineHeight) / 2

    const charDelay = 30
    const lineStagger = 80
    let maxCompletionTime = 0

    lines.forEach((line, i) => {
      const t = this.add.text(width / 2, startY + i * lineHeight, '', {
        fontSize: '40px', fontFamily: 'monospace', color,
        align: 'center',
        // Dark band + dark stroke keep text legible regardless of what
        // procedural visuals or comic art might be drawing behind it.
        backgroundColor: '#0e1116',
        padding: { x: 20, y: 8 },
        stroke: '#05070a',
        strokeThickness: 6,
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
    // Backdrop for the "Every day, thousands of claims..." beat.
    // Pure black to start — the scene opens against void so the
    // narration's first line lands on nothing. Then claim IDs fade
    // in one by one across the canvas, density growing over the
    // ~14s the beat sits on screen. By the third narration line
    // ("...claims get lost.") the field is full and a few are
    // tinted red, foreshadowing the loss the next scene shows.
    //
    // No walls, no floor tiles, no scattered desks. The previous
    // version drew a literal corridor with a few isolated sprites
    // that read as "this is supposed to be a hospital but the art
    // got abandoned." The system the narration is describing is
    // bigger than any one room, so the visual is now scale-of-data
    // rather than scale-of-architecture.
    this.sceneContainer.removeAll(true)
    const { width, height } = this.scale

    const bg = this.add.rectangle(width / 2, height / 2, width, height, 0x0a0e14)
    this.sceneContainer.add(bg)

    // Total spawn window — slightly less than the full beat duration
    // so the last few claims have a moment to settle before the
    // scene transitions to showDesk.
    const TOTAL_DURATION_MS = 12000
    const COUNT = 80

    for (let i = 0; i < COUNT; i++) {
      const id =
        `CLM-2026-${String(Phaser.Math.Between(1, 12)).padStart(2, '0')}` +
        `-${String(Phaser.Math.Between(1, 28)).padStart(2, '0')}` +
        `-${String(Phaser.Math.Between(1, 99999)).padStart(5, '0')}`

      // Tier roll — most claims are dim gray (routine), a small
      // fraction are orange (in-process), a smaller fraction red
      // (lost). Red ones spawn late so they line up with the third
      // narration line about claims getting lost.
      const r = Math.random()
      const tier = r < 0.85 ? 'normal' : r < 0.95 ? 'inProcess' : 'lost'
      const color = tier === 'normal' ? '#5a6a7a'
                  : tier === 'inProcess' ? '#f0a868'
                  : '#ef5b7b'
      const targetAlpha = tier === 'normal' ? 0.25
                        : tier === 'inProcess' ? 0.45
                        : 0.6

      // 60-px inset from edges so labels never clip the viewport.
      const x = Phaser.Math.Between(60, width - 60)
      const y = Phaser.Math.Between(60, height - 60)
      const fontSize = Phaser.Math.Between(14, 22)

      const t = this.add.text(x, y, id, {
        fontSize: `${fontSize}px`,
        fontFamily: 'monospace',
        color,
      }).setOrigin(0.5).setAlpha(0)
      this.sceneContainer.add(t)

      // Spawn-time distribution. Normal/in-process use a slight
      // power-curve bias so density visibly accelerates as the beat
      // progresses. Lost claims always spawn in the back third so
      // they hit on cue.
      const delay = tier === 'lost'
        ? Phaser.Math.Between(8000, 11000)
        : Math.pow(Math.random(), 1.5) * (TOTAL_DURATION_MS - 1500)

      this.tweens.add({
        targets: t,
        alpha: targetAlpha,
        duration: 700,
        delay,
      })

      // Subtle vertical drift so the field feels alive instead of
      // statically painted on. Starts after the fade-in completes.
      this.tweens.add({
        targets: t,
        y: y + Phaser.Math.FloatBetween(-12, 12),
        duration: Phaser.Math.Between(4000, 7000),
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
        delay: delay + 700,
      })
    }
  }

  showDesk() {
    this.sceneContainer.removeAll(true)
    const { width, height } = this.scale

    // Anchor the desk grouping in the lower third of the screen so it sits
    // below the centered narration text instead of crowding it.
    const deskY = height / 2 + 260

    // setDisplaySize fits regardless of source resolution — the
    // h_desk / h_chair textures are 16×16 procedural OR 64×64 LoRA
    // depending on which loaded.
    const desk = this.add.image(width / 2, deskY, 'h_desk')
      .setDisplaySize(192, 192).setAlpha(0)
    this.sceneContainer.add(desk)

    const chair = this.add.image(width / 2, deskY + 100, 'h_chair')
      .setDisplaySize(128, 128).setAlpha(0)
    this.sceneContainer.add(chair)

    // Monitor glow over the desk
    const glow = this.add.rectangle(width / 2 - 20, deskY - 50, 80, 60, 0x7ee2c1, 0.15).setAlpha(0)
    this.sceneContainer.add(glow)

    // Sticky note beside the monitor
    const sticky = this.add.text(width / 2 + 100, deskY - 100, '835 DOESN\'T\nMATCH — CHECK\nMONDAY', {
      fontSize: '14px', fontFamily: 'monospace', color: '#2a2a2a',
      backgroundColor: '#f4d06f', padding: { x: 8, y: 6 },
    }).setAlpha(0).setAngle(-5)
    this.sceneContainer.add(sticky)

    this.tweens.add({ targets: [desk, chair, glow, sticky], alpha: 1, duration: 800, stagger: 200 })
  }

  showClaimVanish() {
    const { width, height } = this.scale

    // Show a claim number that blinks and vanishes
    const claimText = this.add.text(width / 2, height / 2 - 160, 'CLM-2026-04-28-00847', {
      fontSize: '28px', fontFamily: 'monospace', color: '#7ee2c1',
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
    const player = this.add.image(width / 2, -80, 'player').setScale(8).setAlpha(0)
    this.sceneContainer.add(player)
    // Quick fade-in so the character is visible during the drop.
    this.tweens.add({
      targets: player, alpha: 1, duration: 500,
    })
    // Drop straight down past the bottom of the screen.
    this.tweens.add({
      targets: player, y: height + 160,
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
        Phaser.Math.Between(100, width - 100),
        height + 40,
        Phaser.Math.RND.pick(docTypes)
      ).setScale(Phaser.Math.FloatBetween(4, 8))
        .setAlpha(Phaser.Math.FloatBetween(0.2, 0.6))
        .setAngle(Phaser.Math.Between(-30, 30))

      this.sceneContainer.add(doc)
      this.tweens.add({
        targets: doc,
        y: -60,
        x: doc.x + Phaser.Math.Between(-80, 80),
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
      const y = 400 + row * 100
      const alpha = 0.6 - row * 0.07
      const scale = 4 - row * 0.3
      for (let col = 0; col < 14; col++) {
        const x = 60 + col * 140 + (row % 2 ? 70 : 0)
        const chair = this.add.image(x, y, 'wr_chair')
          .setScale(scale).setAlpha(0)
        this.sceneContainer.add(chair)
        this.tweens.add({
          targets: chair, alpha, duration: 800, delay: row * 150 + col * 30,
        })
      }
    }

    // Ticket counter at far end
    const counter = this.add.image(width / 2, 240, 'wr_counter').setScale(10).setAlpha(0)
    this.sceneContainer.add(counter)
    this.tweens.add({ targets: counter, alpha: 0.7, duration: 1000, delay: 500 })

    // Number display — frozen
    const numberText = this.add.text(width / 2, 230, 'NOW SERVING: 00000', {
      fontSize: '24px', fontFamily: 'monospace', color: '#ef5b7b',
    }).setOrigin(0.5).setAlpha(0).setDepth(51)
    this.sceneContainer.add(numberText)
    this.tweens.add({ targets: numberText, alpha: 0.8, duration: 1000, delay: 800 })

    // Floating papers
    for (let i = 0; i < 8; i++) {
      const paper = this.add.image(
        Phaser.Math.Between(100, width - 100),
        Phaser.Math.Between(200, height - 200),
        'wr_paper'
      ).setScale(4).setAlpha(0)
      this.sceneContainer.add(paper)

      this.tweens.add({ targets: paper, alpha: 0.3, duration: 500, delay: 1000 + i * 200 })
      this.tweens.add({
        targets: paper,
        y: paper.y - 30,
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
    this.stopVoice()
    // Intentionally do NOT stop the intro song — it carries from the
    // cinematic into the title screen as a single bed of music. The
    // sound persists because Phaser's sound manager is game-global.
    //
    // (If the player skipped before reaching the splash advance, the
    // song hasn't started yet. TitleScene.create kicks it off with a
    // fade-in in that case so the menu still gets a music bed.)
    this.scene.start('Title')
  }

  private stopIntroSong() {
    if (this.introSong) {
      this.introSong.stop()
      this.introSong.destroy()
      this.introSong = undefined
    }
    this.introSongBoosted = false
  }

  /** Play the voiceover for the current text beat (1-indexed). Stops
   *  any voice that was still playing from the previous beat. */
  private playBeatVoice() {
    this.textBeatCounter += 1
    this.stopVoice()
    const key = `intro_voice_${String(this.textBeatCounter).padStart(2, '0')}`
    if (!this.cache.audio.exists(key)) return
    this.currentVoice = this.sound.add(key)
    this.currentVoice.play()
    // Bring the music bed up to its under-narration mix the moment
    // narration starts. Idempotent — only fires on the first VO beat.
    this.boostIntroSongForVoice()
  }

  private stopVoice() {
    if (this.currentVoice) {
      this.currentVoice.stop()
      this.currentVoice.destroy()
      this.currentVoice = undefined
    }
  }

  /** Milliseconds left in the currently-playing voiceover (if any).
   *  Used by 'wait' / cover beats to ensure we don't advance — and
   *  thus call stopVoice on ourselves — before the line finishes. */
  private remainingVoiceMs(): number {
    const v = this.currentVoice as any
    if (!v || !v.isPlaying) return 0
    const dur = typeof v.duration === 'number' ? v.duration : 0
    const seek = typeof v.seek === 'number' ? v.seek : 0
    return Math.max(0, (dur - seek) * 1000)
  }
}
