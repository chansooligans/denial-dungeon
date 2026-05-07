import Phaser from 'phaser'
import { newGame } from '../state'
import { addFullscreenButton } from './fullscreenButton'
import { addMuteButton } from './muteButton'

export class TitleScene extends Phaser.Scene {
  constructor() {
    super('Title')
  }

  create() {
    const { width, height } = this.scale
    addFullscreenButton(this)
    addMuteButton(this)

    // If the player reached the title without ever advancing past the
    // splash (i.e. they hit Skip from the beginning), the intro song
    // hasn't started yet. Kick it off here with a 2s fade-in so the
    // menu still has a music bed.
    this.maybeStartIntroSong()

    // Floating papers in background
    for (let i = 0; i < 12; i++) {
      const paper = this.add.image(
        Phaser.Math.Between(50, width - 50),
        Phaser.Math.Between(50, height - 50),
        'wr_paper'
      ).setScale(Phaser.Math.FloatBetween(1.5, 3)).setAlpha(0.1)

      this.tweens.add({
        targets: paper,
        y: paper.y - 10,
        x: paper.x + Phaser.Math.Between(-8, 8),
        duration: Phaser.Math.Between(3000, 5000),
        yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
        delay: i * 400,
      })
    }

    // Title
    this.add.text(width / 2, 120, 'THE WAITING ROOM', {
      fontSize: '32px', fontFamily: 'monospace', color: '#ef5b7b',
      fontStyle: 'bold',
    }).setOrigin(0.5)

    this.add.text(width / 2, 155, 'a revenue cycle RPG', {
      fontSize: '13px', fontFamily: 'monospace', color: '#8b95a5',
    }).setOrigin(0.5)

    // Menu options. CONTINUE only shows when a save exists — on a
    // fresh boot there's nothing to resume.
    const hasSave = this.hasExistingSave()
    const menuItems: { label: string; action: () => void }[] = []
    if (hasSave) menuItems.push({ label: 'CONTINUE', action: () => this.continueGame() })
    menuItems.push({ label: 'NEW GAME', action: () => this.startGame() })
    menuItems.push({ label: 'CODEX', action: () => this.openCodex() })
    menuItems.push({ label: 'REPLAY INTRO', action: () => this.replayIntro() })

    menuItems.forEach((item, i) => {
      const y = 260 + i * 50
      const btn = this.add.text(width / 2, y, `[ ${item.label} ]`, {
        fontSize: '16px', fontFamily: 'monospace', color: '#7ee2c1',
      }).setOrigin(0.5).setInteractive({ useHandCursor: true })

      btn.on('pointerover', () => btn.setColor('#ffffff'))
      btn.on('pointerout', () => btn.setColor('#7ee2c1'))
      btn.on('pointerdown', item.action)
    })

    // Flavor text
    this.add.text(width / 2, height - 80, 'Chase a lost claim through The Waiting Room.\nLearn how healthcare billing actually works.', {
      fontSize: '11px', fontFamily: 'monospace', color: '#3a4a5d',
      align: 'center',
    }).setOrigin(0.5)

    this.add.text(width / 2, height - 30, 'An open-source educational game', {
      fontSize: '10px', fontFamily: 'monospace', color: '#2a323d',
    }).setOrigin(0.5)

    // Keyboard nav. Numbering shifts when CONTINUE is shown so 1
    // always maps to the topmost menu item.
    const keys = this.input.keyboard!
    if (hasSave) {
      keys.on('keydown-ONE', () => this.continueGame())
      keys.on('keydown-TWO', () => this.startGame())
      keys.on('keydown-THREE', () => this.openCodex())
      keys.on('keydown-FOUR', () => this.replayIntro())
    } else {
      keys.on('keydown-ONE', () => this.startGame())
      keys.on('keydown-TWO', () => this.openCodex())
      keys.on('keydown-THREE', () => this.replayIntro())
    }
  }

  private hasExistingSave(): boolean {
    try {
      return !!localStorage.getItem('denial_dungeon_save')
    } catch {
      return false
    }
  }

  private continueGame() {
    this.fadeOutIntroSong()
    this.scene.start('Hospital')
  }

  private startGame() {
    this.fadeOutIntroSong()
    newGame()
    this.scene.start('Hospital')
  }

  private openCodex() {
    this.fadeOutIntroSong()
    this.scene.start('Codex')
  }

  /** Stop any in-flight intro song before starting the cinematic
   *  again — otherwise the old song would overlap with the new one
   *  IntroScene starts when the player advances past the splash.
   *  Stop synchronously (no fade) so there's no overlap window. */
  private replayIntro() {
    const song = this.sound.get('intro_song')
    if (song) {
      song.stop()
      song.destroy()
    }
    this.scene.start('Intro')
  }

  /** If the intro song isn't already playing (e.g. the player skipped
   *  the cinematic before its splash advance kicked the song off),
   *  start it from zero with a fade-in so the menu has music. */
  private maybeStartIntroSong() {
    const existing = this.sound.get('intro_song')
    if (existing && existing.isPlaying) return
    if (!this.cache.audio.exists('intro_song')) return
    const song = this.sound.add('intro_song', { volume: 0 })
    song.play()
    this.tweens.add({
      targets: song,
      volume: 0.35,
      duration: 5000,
    })
  }

  /** The intro song persists from IntroScene into the title menu (it's
   *  on the global sound manager). When the player commits to a real
   *  scene transition, fade it out so the gameplay scene gets silence
   *  to start over. */
  private fadeOutIntroSong() {
    const song = this.sound.get('intro_song')
    if (!song || !song.isPlaying) return
    this.tweens.add({
      targets: song,
      volume: 0,
      duration: 700,
      onComplete: () => {
        song.stop()
        song.destroy()
      },
    })
  }
}
