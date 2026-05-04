import Phaser from 'phaser'
import { ENEMIES } from '../content/enemies'
import { PHASE_NAMES, FACTION_COLOR, FACTION_LABEL } from '../types'
import type { RunState, Faction } from '../types'

export class SummaryScene extends Phaser.Scene {
  private run!: RunState

  constructor() {
    super('Summary')
  }

  init(data: { run: RunState }) {
    this.run = data.run
  }

  create() {
    const { width, height } = this.scale

    const won = this.run.status === 'won'

    // Title
    this.add.text(width / 2, 40, won ? 'RUN COMPLETE' : 'RUN FAILED', {
      fontSize: '24px',
      fontFamily: 'monospace',
      color: won ? '#7ee2c1' : '#ef5b7b',
    }).setOrigin(0.5)

    this.add.text(width / 2, 68, `Seed: ${this.run.seed} · ${this.run.classId}`, {
      fontSize: '11px', fontFamily: 'monospace', color: '#8b95a5',
    }).setOrigin(0.5)

    // Score
    const score = this.calculateScore()
    this.add.text(width / 2, 110, String(score), {
      fontSize: '48px',
      fontFamily: 'monospace',
      color: '#7ee2c1',
      fontStyle: 'bold',
    }).setOrigin(0.5)

    this.add.text(width / 2, 145, 'SCORE', {
      fontSize: '11px', fontFamily: 'monospace', color: '#8b95a5',
    }).setOrigin(0.5)

    // Stats
    const stats = [
      `Rooms cleared: ${this.run.rooms.filter(r => r.cleared).length} / ${this.run.rooms.length}`,
      `Denials discovered: ${this.run.discovered.length} / ${Object.keys(ENEMIES).length}`,
      `Final HP: ${Math.max(0, this.run.resources.hp)} / ${this.run.resources.maxHp}`,
      `Cash: $${this.run.resources.cash}`,
      `Reputation: ${this.run.resources.reputation}`,
      `Audit Risk: ${this.run.resources.auditRisk}`,
      `Phase reached: ${PHASE_NAMES[this.run.phase] || 'Unknown'}`,
    ]

    stats.forEach((stat, i) => {
      this.add.text(width / 2, 180 + i * 22, stat, {
        fontSize: '12px', fontFamily: 'monospace', color: '#e6edf3',
      }).setOrigin(0.5)
    })

    // Codex preview
    if (this.run.discovered.length > 0) {
      this.add.text(width / 2, 360, 'DENIAL CODEX (discovered this run)', {
        fontSize: '12px', fontFamily: 'monospace', color: '#f0a868',
      }).setOrigin(0.5)

      const codexY = 385
      this.run.discovered.slice(0, 6).forEach((id, i) => {
        const enemy = ENEMIES[id]
        if (!enemy) return
        const color = FACTION_COLOR[enemy.surfaceFaction]
        const colorStr = '#' + color.toString(16).padStart(6, '0')

        this.add.text(80, codexY + i * 28, `${enemy.carcCode}`, {
          fontSize: '11px', fontFamily: 'monospace', color: colorStr,
        })
        this.add.text(160, codexY + i * 28, enemy.name, {
          fontSize: '11px', fontFamily: 'monospace', color: '#e6edf3',
        })
        this.add.text(500, codexY + i * 28, `Root: ${FACTION_LABEL[enemy.rootFaction]}`, {
          fontSize: '10px', fontFamily: 'monospace', color: '#8b95a5',
        })
        this.add.text(80, codexY + i * 28 + 13, enemy.watchpoint, {
          fontSize: '9px', fontFamily: 'monospace', color: '#8b95a5', fontStyle: 'italic',
        })
      })
    }

    // Buttons
    const retryBtn = this.add.text(width / 2 - 80, height - 50, '[ RETRY ]', {
      fontSize: '14px', fontFamily: 'monospace', color: '#7ee2c1',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true })

    retryBtn.on('pointerdown', () => {
      this.scene.start('Title')
    })

    const shareBtn = this.add.text(width / 2 + 80, height - 50, '[ COPY SCORE ]', {
      fontSize: '14px', fontFamily: 'monospace', color: '#f0a868',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true })

    shareBtn.on('pointerdown', () => {
      const shareText = [
        `DENIAL DUNGEON ${won ? '✓' : '✗'}`,
        `Seed: ${this.run.seed}`,
        `Score: ${score}`,
        `Rooms: ${this.run.rooms.filter(r => r.cleared).length}/${this.run.rooms.length}`,
        `Codex: ${this.run.discovered.length}/${Object.keys(ENEMIES).length}`,
        `Phase: ${PHASE_NAMES[this.run.phase]}`,
      ].join('\n')
      navigator.clipboard.writeText(shareText)
      shareBtn.setText('[ COPIED! ]')
    })
  }

  private calculateScore(): number {
    const r = this.run.resources
    const roomPct = this.run.rooms.filter(rm => rm.cleared).length / this.run.rooms.length
    const codexPct = this.run.discovered.length / Object.keys(ENEMIES).length
    const hpPct = Math.max(0, r.hp) / r.maxHp
    const repScore = Math.max(0, r.reputation) / 100
    const auditPenalty = Math.max(0, 1 - r.auditRisk / 100)

    const raw = (roomPct * 0.3 + codexPct * 0.25 + hpPct * 0.15 + repScore * 0.15 + auditPenalty * 0.15) * 1000
    return Math.round(raw)
  }
}
