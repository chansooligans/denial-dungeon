// Dev-only jump panel. Toggled by `~` (backtick). Lists every
// encounter that has a puzzleSpecId, plus shortcuts to the main
// scenes and a "clear save" button. DEV-only — installs only when
// `import.meta.env.DEV` is true, so it doesn't ship to prod builds.

import { ENCOUNTERS } from '../content/enemies'
import { PUZZLE_SPECS } from '../runtime/puzzle/specs'

const PANEL_ID = '__dev_panel__'
const STYLE_ID = '__dev_panel_style__'

export function installDevPanel() {
  if (!import.meta.env.DEV) return
  if (document.getElementById(STYLE_ID)) return

  const style = document.createElement('style')
  style.id = STYLE_ID
  style.textContent = CSS
  document.head.appendChild(style)

  const panel = document.createElement('div')
  panel.id = PANEL_ID
  panel.className = 'devp hidden'
  panel.innerHTML = renderPanel()
  document.body.appendChild(panel)

  panel.addEventListener('click', e => {
    const target = e.target as HTMLElement
    const action = target.closest('[data-dev-action]') as HTMLElement | null
    if (!action) return
    handleAction(action.dataset.devAction!, action.dataset.devArg)
  })

  document.addEventListener('keydown', e => {
    // `~` (or backtick) toggles the panel. Skip when the player is
    // typing somewhere — though there are no inputs in-game today.
    if (e.key !== '`' && e.key !== '~') return
    const t = e.target as HTMLElement | null
    if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA')) return
    e.preventDefault()
    panel.classList.toggle('hidden')
  })
}

function renderPanel(): string {
  const puzzleEncounters = Object.values(ENCOUNTERS)
    .filter(e => e.puzzleSpecId && PUZZLE_SPECS[e.puzzleSpecId])
    .map(e => ({
      encounterId: e.id,
      puzzleSpecId: e.puzzleSpecId!,
      title: e.title,
    }))

  return `
    <div class="devp-h">
      <span class="devp-tag">DEV PANEL</span>
      <span class="devp-hint">\` to toggle</span>
    </div>
    <section>
      <div class="devp-section-h">Jump to puzzle</div>
      ${puzzleEncounters.map(p => `
        <button class="devp-btn"
                data-dev-action="puzzle"
                data-dev-arg="${p.encounterId}|${p.puzzleSpecId}">
          ${p.title} <span class="devp-id">(${p.encounterId})</span>
        </button>
      `).join('')}
    </section>
    <section>
      <div class="devp-section-h">Jump to scene</div>
      <button class="devp-btn" data-dev-action="scene" data-dev-arg="Title">Title</button>
      <button class="devp-btn" data-dev-action="scene" data-dev-arg="Hospital">Hospital</button>
      <button class="devp-btn" data-dev-action="scene" data-dev-arg="WaitingRoom">Waiting Room</button>
    </section>
    <section>
      <div class="devp-section-h">State</div>
      <button class="devp-btn warn" data-dev-action="clear-save">Clear save</button>
    </section>
  `
}

function handleAction(action: string, arg?: string) {
  const game = (window as any).__PHASER_GAME__ as Phaser.Game | undefined
  if (!game) return
  const sm = game.scene
  switch (action) {
    case 'puzzle': {
      if (!arg) return
      const [encounterId, puzzleSpecId] = arg.split('|')
      stopAllScenes(sm)
      sm.start('PuzzleBattle', { encounterId, puzzleSpecId, returnScene: 'Hospital' })
      hidePanel()
      return
    }
    case 'scene': {
      if (!arg) return
      stopAllScenes(sm)
      sm.start(arg)
      hidePanel()
      return
    }
    case 'clear-save': {
      try {
        localStorage.removeItem('twr-save')
        // eslint-disable-next-line no-alert
        alert('Save cleared. Reload to start fresh.')
      } catch {}
      return
    }
  }
}

function stopAllScenes(sm: Phaser.Scenes.SceneManager) {
  // Stop everything that's currently active so the destination starts
  // clean. Otherwise overlays from the previous scene linger.
  const active = sm.getScenes(true)
  for (const s of active) sm.stop(s.scene.key)
}

function hidePanel() {
  document.getElementById(PANEL_ID)?.classList.add('hidden')
}

const CSS = `
  #${PANEL_ID} {
    position: fixed;
    top: 12px;
    right: 12px;
    width: 280px;
    max-height: calc(100vh - 24px);
    overflow: auto;
    z-index: 9999;
    background: #0e1420;
    color: #d8dee9;
    border: 1px solid #2a3142;
    border-radius: 8px;
    padding: 12px 14px;
    font: 12px/1.4 ui-monospace, "SF Mono", Menlo, Consolas, monospace;
    box-shadow: 0 12px 32px rgba(0,0,0,0.5);
  }
  #${PANEL_ID}.hidden { display: none; }
  #${PANEL_ID} .devp-h {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 10px;
    padding-bottom: 8px;
    border-bottom: 1px dashed #2a3142;
  }
  #${PANEL_ID} .devp-tag {
    font-weight: 700;
    color: #f0a868;
    letter-spacing: 0.08em;
  }
  #${PANEL_ID} .devp-hint {
    color: #6c7585;
    font-size: 10px;
  }
  #${PANEL_ID} section {
    margin-bottom: 10px;
  }
  #${PANEL_ID} .devp-section-h {
    color: #6c7585;
    font-size: 10px;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    margin-bottom: 6px;
  }
  #${PANEL_ID} .devp-btn {
    display: block;
    width: 100%;
    text-align: left;
    background: #1a2030;
    color: #d8dee9;
    border: 1px solid #2a3142;
    border-radius: 4px;
    padding: 6px 10px;
    margin-bottom: 4px;
    cursor: pointer;
    font: inherit;
  }
  #${PANEL_ID} .devp-btn:hover {
    background: #232b3a;
    border-color: #3a4658;
  }
  #${PANEL_ID} .devp-btn.warn {
    color: #ef5b7b;
    border-color: #4a2530;
  }
  #${PANEL_ID} .devp-id {
    color: #6c7585;
    font-size: 10.5px;
    margin-left: 4px;
  }
`
