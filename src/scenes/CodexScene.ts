import Phaser from 'phaser'
import { CODEX_ENTRIES, CODEX_LIST } from '../content/codex'
import { getState } from '../state'
import type { CodexEntry, CodexCategory } from '../types'

// All declared CodexCategory values get a tab. The runtime filters
// out empty categories (no codex entries authored yet) so the UI only
// shows tabs that have content. Adding a new category here is enough
// to surface it as soon as any entry adopts it.
const CATEGORIES_ALL: { key: CodexCategory; label: string; color: string }[] = [
  { key: 'codes',        label: 'CODES',        color: '#ef5b7b' },
  { key: 'forms',        label: 'FORMS',        color: '#6da9e3' },
  { key: 'transactions', label: 'TRANS',        color: '#6cd49a' },
  { key: 'concepts',     label: 'CONCEPTS',     color: '#f4d06f' },
  { key: 'obstacles',    label: 'OBSTACLES',    color: '#b18bd6' },
  { key: 'stats',        label: 'STATS',        color: '#a3aab5' },
]

export class CodexScene extends Phaser.Scene {
  private entries: CodexEntry[] = []
  private unlockedIds: Set<string> = new Set()
  private selectedIndex = 0
  private activeCategory: CodexCategory = 'codes'
  private listTexts: Phaser.GameObjects.Text[] = []
  private detailName!: Phaser.GameObjects.Text
  private detailDesc!: Phaser.GameObjects.Text
  private detailBody!: Phaser.GameObjects.Text
  private detailLock!: Phaser.GameObjects.Text
  private categoryTabs: Phaser.GameObjects.Text[] = []
  private categories: typeof CATEGORIES_ALL = []
  private counterText!: Phaser.GameObjects.Text

  constructor() {
    super('Codex')
  }

  create() {
    const { width, height } = this.scale
    this.cameras.main.setBackgroundColor(0x0e1116)

    const state = getState()
    this.unlockedIds = new Set(state.codexUnlocked)

    // Title
    this.add.text(width / 2, 25, 'CODEX', {
      fontSize: '20px', fontFamily: 'monospace', color: '#7ee2c1', fontStyle: 'bold',
    }).setOrigin(0.5)

    this.add.text(width / 2, 45, 'Everything you\'ve learned about the revenue cycle', {
      fontSize: '10px', fontFamily: 'monospace', color: '#5a6a7a',
    }).setOrigin(0.5)

    // Counter
    this.counterText = this.add.text(width - 30, 25, '', {
      fontSize: '10px', fontFamily: 'monospace', color: '#5a6a7a',
    }).setOrigin(1, 0.5)

    // Category tabs — show only categories that have at least one
    // entry. Keeps the strip from advertising empty sections (e.g.
    // 'stats' before any stat entries land).
    this.categories = CATEGORIES_ALL.filter(cat =>
      CODEX_LIST.some(e => e.category === cat.key)
    )
    // If our default activeCategory was filtered out (empty), pick the
    // first available one.
    if (!this.categories.some(c => c.key === this.activeCategory)) {
      this.activeCategory = this.categories[0]?.key ?? 'codes'
    }
    // Tab spacing scales with count so 6 tabs still fit in the header.
    const TAB_SPACING = this.categories.length <= 4 ? 130 : 110
    const TAB_X0 = 80
    this.categories.forEach((cat, i) => {
      const x = TAB_X0 + i * TAB_SPACING
      const tab = this.add.text(x, 72, cat.label, {
        fontSize: '11px', fontFamily: 'monospace',
        color: cat.key === this.activeCategory ? cat.color : '#3a4a5d',
      }).setOrigin(0.5).setInteractive({ useHandCursor: true })

      tab.on('pointerdown', () => this.switchCategory(cat.key))
      tab.on('pointerover', () => {
        if (cat.key !== this.activeCategory) tab.setColor('#8b95a5')
      })
      tab.on('pointerout', () => {
        if (cat.key !== this.activeCategory) tab.setColor('#3a4a5d')
      })

      this.categoryTabs.push(tab)
    })

    // Divider
    this.add.rectangle(width / 2, 88, width - 40, 1, 0x2a323d)

    // Left panel — entry list
    // Right panel — detail view
    this.detailName = this.add.text(340, 105, '', {
      fontSize: '16px', fontFamily: 'monospace', color: '#ffffff', fontStyle: 'bold',
    })

    this.detailDesc = this.add.text(340, 130, '', {
      fontSize: '11px', fontFamily: 'monospace', color: '#7ee2c1',
      wordWrap: { width: 580 },
    })

    this.detailBody = this.add.text(340, 165, '', {
      fontSize: '11px', fontFamily: 'monospace', color: '#d0d8e0',
      wordWrap: { width: 580 }, lineSpacing: 4,
    })

    this.detailLock = this.add.text(340, 165, '[ LOCKED ]\n\nDiscover this entry by exploring the hospital.', {
      fontSize: '12px', fontFamily: 'monospace', color: '#3a4a5d',
    })

    this.refreshList()

    // Back button
    const backBtn = this.add.text(30, 25, '< BACK', {
      fontSize: '11px', fontFamily: 'monospace', color: '#5a6a7a',
    }).setOrigin(0, 0.5).setInteractive({ useHandCursor: true })

    backBtn.on('pointerover', () => backBtn.setColor('#ffffff'))
    backBtn.on('pointerout', () => backBtn.setColor('#5a6a7a'))
    backBtn.on('pointerdown', () => this.scene.start('Title'))

    // Keyboard nav
    this.input.keyboard!.on('keydown-UP', () => this.navigate(-1))
    this.input.keyboard!.on('keydown-DOWN', () => this.navigate(1))
    this.input.keyboard!.on('keydown-ESC', () => this.scene.start('Title'))
  }

  private switchCategory(cat: CodexCategory) {
    this.activeCategory = cat
    this.selectedIndex = 0

    this.categories.forEach((c, i) => {
      const color = c.key === cat
        ? this.categories.find(cc => cc.key === cat)!.color
        : '#3a4a5d'
      this.categoryTabs[i].setColor(color)
    })

    this.refreshList()
  }

  private refreshList() {
    this.listTexts.forEach(t => t.destroy())
    this.listTexts = []

    this.entries = CODEX_LIST.filter(e => e.category === this.activeCategory)

    const totalInCat = this.entries.length
    const unlockedInCat = this.entries.filter(e => this.unlockedIds.has(e.id)).length
    this.counterText.setText(`${this.unlockedIds.size} / ${CODEX_LIST.length}`)

    this.entries.forEach((entry, i) => {
      const unlocked = this.unlockedIds.has(entry.id)
      const y = 105 + i * 28
      const displayName = unlocked ? entry.name : '???'
      const isSelected = i === this.selectedIndex

      const t = this.add.text(30, y, `${isSelected ? '>' : ' '} ${displayName}`, {
        fontSize: '11px', fontFamily: 'monospace',
        color: isSelected ? '#ffffff' : unlocked ? '#8b95a5' : '#2a323d',
      }).setInteractive({ useHandCursor: true })

      t.on('pointerdown', () => {
        this.selectedIndex = i
        this.refreshList()
      })

      this.listTexts.push(t)
    })

    this.showDetail()
  }

  private showDetail() {
    const entry = this.entries[this.selectedIndex]
    if (!entry) {
      this.detailName.setText('')
      this.detailDesc.setText('')
      this.detailBody.setText('')
      this.detailLock.setVisible(false)
      return
    }

    const unlocked = this.unlockedIds.has(entry.id)

    if (unlocked) {
      this.detailName.setText(entry.name)
      this.detailDesc.setText(entry.description)
      this.detailBody.setText(entry.detail)
      this.detailLock.setVisible(false)
    } else {
      this.detailName.setText('???')
      this.detailDesc.setText('')
      this.detailBody.setText('')
      this.detailLock.setVisible(true)
    }
  }

  private navigate(dir: number) {
    this.selectedIndex = Phaser.Math.Clamp(
      this.selectedIndex + dir,
      0,
      this.entries.length - 1
    )
    this.refreshList()
  }
}
