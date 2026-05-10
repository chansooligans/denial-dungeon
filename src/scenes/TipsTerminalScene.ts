// TipsTerminalScene — the Data Sandbox documentation terminal.
//
// Triggered from HospitalScene.examineFacingTile when the player is
// facing the Sandbox whiteboard ('B' at the top of DATA_SANDBOX).
// Renders an HTML overlay that surfaces:
//   1. Per-level orientation (always shown, keyed to currentLevel).
//   2. Per-encounter hints for encounters the player has *seen* but
//      not yet *defeated*. Defeated ones collapse to a "✓ solved"
//      line so the wiki feels like it remembers.
//
// Pause Hospital while we're up; resume on close. ESC / E / click
// outside the panel close the terminal.
//
// Visual register: NOT Dana's notebook (that's the briefing voice).
// This is the team's wiki — collaborative, slightly tech-witty,
// readable.

import Phaser from 'phaser'
import { getState } from '../state'
import { LEVELS } from '../content/levels'
import { ENCOUNTERS } from '../content/enemies'
import { LEVEL_GUIDANCE, ENCOUNTER_HINTS } from '../content/sandbox-tips'

const OVERLAY_ID = '__tips_overlay__'
const STYLE_ID = '__tips_style__'

interface InitData {
  callingScene?: string
}

export class TipsTerminalScene extends Phaser.Scene {
  private callingScene!: string
  private overlay!: HTMLDivElement
  private styleTag!: HTMLStyleElement
  private clickHandler!: (e: MouseEvent) => void
  private keyHandler!: (e: KeyboardEvent) => void

  constructor() {
    super('TipsTerminal')
  }

  init(data: InitData) {
    this.callingScene = data.callingScene ?? 'Hospital'
  }

  create() {
    this.installStyles()
    this.installOverlay()
    this.attachHandlers()
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.teardown())
  }

  private installStyles() {
    let styleTag = document.getElementById(STYLE_ID) as HTMLStyleElement | null
    if (!styleTag) {
      styleTag = document.createElement('style')
      styleTag.id = STYLE_ID
      document.head.appendChild(styleTag)
    }
    styleTag.textContent = TIPS_CSS
    this.styleTag = styleTag
  }

  private installOverlay() {
    let overlay = document.getElementById(OVERLAY_ID) as HTMLDivElement | null
    if (!overlay) {
      overlay = document.createElement('div')
      overlay.id = OVERLAY_ID
      overlay.className = 'tips-overlay-backdrop'
      const game = document.getElementById('game')
      ;(game ?? document.body).appendChild(overlay)
    }
    this.overlay = overlay
    overlay.innerHTML = this.render()
  }

  private attachHandlers() {
    this.clickHandler = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      // Click on backdrop = close. Clicks on the inner panel are
      // swallowed by .tips-panel listening below.
      if (target.classList.contains('tips-overlay-backdrop')) {
        this.close()
        return
      }
      const action = target.closest('[data-tips-action]') as HTMLElement | null
      if (!action) return
      const which = action.dataset.tipsAction
      if (which === 'close') this.close()
    }
    this.overlay.addEventListener('click', this.clickHandler)

    this.keyHandler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'e' || e.key === 'E' || e.key === ' ') {
        e.preventDefault()
        this.close()
      }
    }
    window.addEventListener('keydown', this.keyHandler)
  }

  private close() {
    // Resume the calling scene. Mirrors DialogueScene.close().
    this.scene.stop()
    this.scene.resume(this.callingScene)
  }

  private render(): string {
    const state = getState()
    const level = state.currentLevel
    const levelDef = LEVELS[level - 1]
    const guidance = LEVEL_GUIDANCE[level] ?? []

    // Encounter classification:
    //   - "open": seen, not yet defeated, has hints in the library.
    //   - "solved": in defeatedObstacles, has hints in the library.
    //   - "upcoming": in this level's encounters list but not yet seen.
    const seen = new Set(state.obstaclesSeen)
    const defeated = new Set(state.defeatedObstacles)
    const open: string[] = []
    const solved: string[] = []
    const upcoming: string[] = []

    for (const id of Object.keys(ENCOUNTER_HINTS)) {
      if (defeated.has(id)) {
        solved.push(id)
      } else if (seen.has(id)) {
        open.push(id)
      } else if ((levelDef?.encounters ?? []).includes(id)) {
        upcoming.push(id)
      }
    }

    return `
      <div class="tips-panel" data-tips-stop>
        <button class="tips-close" data-tips-action="close" aria-label="Close terminal">×</button>
        <header class="tips-h">
          <div class="tips-tag">TEAM DOCS · DATA SANDBOX</div>
          <h1>Internal wiki</h1>
          <p class="tips-blurb">
            Notes from the team. We update this as we learn. If something here
            is wrong, find Monika and tell her — she'll fix it before lunch.
          </p>
        </header>

        <section class="tips-section">
          <h2>Currently on Level ${level} — ${escape(levelDef?.title ?? '?')}</h2>
          <p class="tips-subtitle">${escape(levelDef?.subtitle ?? '')}</p>
          ${guidance.length > 0 ? `
            <ul class="tips-bullets">
              ${guidance.map(g => `<li>${escape(g)}</li>`).join('')}
            </ul>
          ` : `
            <p class="tips-empty">No level notes yet. Tell us if you find a snag.</p>
          `}
        </section>

        ${open.length > 0 ? `
          <section class="tips-section">
            <h2>Open cases</h2>
            ${open.map(id => renderEncounter(id, 'open')).join('')}
          </section>
        ` : ''}

        ${upcoming.length > 0 ? `
          <section class="tips-section">
            <h2>Coming up</h2>
            ${upcoming.map(id => renderEncounter(id, 'upcoming')).join('')}
          </section>
        ` : ''}

        ${solved.length > 0 ? `
          <section class="tips-section">
            <h2>Solved</h2>
            <ul class="tips-solved">
              ${solved.map(id => `
                <li>
                  <span class="tips-check">✓</span>
                  ${escape(ENCOUNTER_HINTS[id]?.name ?? id)}
                </li>
              `).join('')}
            </ul>
          </section>
        ` : ''}

        <footer class="tips-footer">
          <button class="tips-btn" data-tips-action="close">
            Close (Esc / E / Space)
          </button>
        </footer>
      </div>
    `
  }

  private teardown() {
    if (this.clickHandler && this.overlay) {
      this.overlay.removeEventListener('click', this.clickHandler)
    }
    if (this.keyHandler) {
      window.removeEventListener('keydown', this.keyHandler)
    }
    const overlay = document.getElementById(OVERLAY_ID)
    if (overlay && overlay.parentElement) overlay.parentElement.removeChild(overlay)
    const styleTag = document.getElementById(STYLE_ID)
    if (styleTag && styleTag.parentElement) styleTag.parentElement.removeChild(styleTag)
  }
}

function renderEncounter(id: string, status: 'open' | 'upcoming'): string {
  const entry = ENCOUNTER_HINTS[id]
  if (!entry) return ''
  const enc = ENCOUNTERS[id]
  const archetype = enc?.archetype ? ` · ${enc.archetype}` : ''
  const upcomingNote = status === 'upcoming'
    ? `<p class="tips-upcoming-note"><em>Heads-up — you'll see this one soon.</em></p>`
    : ''
  return `
    <article class="tips-encounter">
      <h3>${escape(entry.name)}<span class="tips-archetype">${escape(archetype)}</span></h3>
      ${upcomingNote}
      <ul class="tips-bullets">
        ${entry.hints.map(h => `<li>${escape(h)}</li>`).join('')}
      </ul>
    </article>
  `
}

function escape(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

const TIPS_CSS = `
  .tips-overlay-backdrop {
    position: fixed; inset: 0;
    background: rgba(8, 11, 16, 0.78);
    backdrop-filter: blur(2px);
    -webkit-backdrop-filter: blur(2px);
    display: flex; align-items: center; justify-content: center;
    z-index: 600; padding: 32px 20px;
    overflow-y: auto;
    font: 14.5px/1.55 -apple-system, BlinkMacSystemFont, "Segoe UI", Inter, system-ui, sans-serif;
    color: #d8dee9;
  }
  .tips-panel {
    width: min(880px, 100%);
    background: #0e1420;
    border: 1px solid #2a3142;
    border-left: 4px solid #7ee2c1;
    border-radius: 8px;
    padding: 32px 36px 28px;
    box-shadow: 0 18px 48px rgba(0, 0, 0, 0.55);
    position: relative;
    margin: auto;
  }
  .tips-close {
    position: absolute; top: 10px; right: 14px;
    background: transparent; border: none; color: #6c7585;
    font-size: 28px; cursor: pointer; line-height: 1; padding: 4px 10px;
  }
  .tips-close:hover { color: #d8dee9; }
  .tips-h { margin-bottom: 22px; padding-bottom: 14px; border-bottom: 1px dashed #2a3142; }
  .tips-tag {
    font: 700 11px/1 ui-monospace, "SF Mono", Menlo, Consolas, monospace;
    letter-spacing: 0.16em; color: #7ee2c1;
    margin-bottom: 6px;
  }
  .tips-panel h1 { font-size: 22px; margin: 0 0 8px; color: #d8dee9; }
  .tips-blurb { color: #8a93a3; font-size: 13px; line-height: 1.55; margin: 0; max-width: 640px; }
  .tips-section { margin: 22px 0; }
  .tips-section h2 {
    font-size: 12.5px; text-transform: uppercase; letter-spacing: 0.12em;
    color: #8a93a3; margin: 0 0 10px; font-weight: 700;
  }
  .tips-subtitle { font-size: 13px; color: #8a93a3; font-style: italic; margin: 0 0 12px; }
  .tips-bullets { list-style: none; padding-left: 0; margin: 0; }
  .tips-bullets li {
    padding: 8px 12px; margin: 6px 0;
    background: #161b24; border-left: 3px solid #2a3142;
    border-radius: 3px; font-size: 13.5px; line-height: 1.55;
  }
  .tips-encounter { margin: 14px 0 18px; }
  .tips-encounter h3 {
    font-size: 14px; margin: 0 0 4px; color: #d8dee9; font-weight: 700;
  }
  .tips-archetype { color: #8a93a3; font-weight: 400; font-size: 12px; }
  .tips-upcoming-note { font-size: 12px; color: #f0a868; margin: 0 0 6px; }
  .tips-encounter .tips-bullets li { border-left-color: #f0a868; }
  .tips-solved { list-style: none; padding-left: 0; margin: 0; }
  .tips-solved li {
    padding: 4px 0; font-size: 12.5px; color: #6c7585;
    display: flex; gap: 8px; align-items: baseline;
  }
  .tips-check { color: #7ee2c1; font-weight: 700; }
  .tips-empty { color: #8a93a3; font-style: italic; font-size: 13px; }
  .tips-footer {
    margin-top: 18px; padding-top: 14px;
    border-top: 1px dashed #2a3142;
    text-align: right;
  }
  .tips-btn {
    background: transparent; color: #d8dee9;
    border: 1px solid #2a3142; border-radius: 4px;
    padding: 6px 14px; font: inherit; font-size: 12px;
    cursor: pointer; letter-spacing: 0.04em;
  }
  .tips-btn:hover { border-color: #7ee2c1; color: #7ee2c1; }
`
