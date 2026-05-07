// Dev jump panel. Toggled by `~` (backtick) or the small DEV chip.
// Lists every encounter that has a puzzleSpecId, plus scene shortcuts
// and a "clear save" button.
//
// Available automatically in dev (`vite dev`). In production builds
// it can be opted-in by appending `?dev=1` to the URL — useful for
// QA on the deployed site without shipping a new build. Anything
// other than `0`/`false`/empty enables it.

import { ENCOUNTERS } from '../content/enemies'
import { PUZZLE_SPECS } from '../runtime/puzzle/specs'

const PANEL_ID = '__dev_panel__'
const TOGGLE_ID = '__dev_panel_toggle__'
const STYLE_ID = '__dev_panel_style__'

function isDevPanelEnabled(): boolean {
  if (import.meta.env.DEV) return true
  try {
    const v = new URLSearchParams(location.search).get('dev')
    if (v === null) return false
    return v !== '0' && v.toLowerCase() !== 'false' && v !== ''
  } catch {
    return false
  }
}

export function installDevPanel() {
  if (!isDevPanelEnabled()) return
  if (document.getElementById(STYLE_ID)) return

  const style = document.createElement('style')
  style.id = STYLE_ID
  style.textContent = CSS
  document.head.appendChild(style)

  // Tiny always-on FAB for mobile (and as a desktop discoverability
  // hint). Clicking it has the same effect as pressing backtick.
  const toggle = document.createElement('button')
  toggle.id = TOGGLE_ID
  toggle.textContent = 'DEV'
  toggle.setAttribute('aria-label', 'Toggle dev panel')
  document.body.appendChild(toggle)

  const panel = document.createElement('div')
  panel.id = PANEL_ID
  panel.className = 'devp hidden'
  panel.innerHTML = renderPanel()
  document.body.appendChild(panel)

  const togglePanel = () => panel.classList.toggle('hidden')

  panel.addEventListener('click', e => {
    const target = e.target as HTMLElement
    const action = target.closest('[data-dev-action]') as HTMLElement | null
    if (!action) return
    handleAction(action.dataset.devAction!, action.dataset.devArg)
  })

  toggle.addEventListener('click', e => {
    e.preventDefault()
    e.stopPropagation()
    togglePanel()
  })

  document.addEventListener('keydown', e => {
    // `~` (or backtick) toggles the panel. Skip when the player is
    // typing somewhere — though there are no inputs in-game today.
    if (e.key !== '`' && e.key !== '~') return
    const t = e.target as HTMLElement | null
    if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA')) return
    e.preventDefault()
    togglePanel()
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
      <button class="devp-btn" data-dev-action="copy-save">Copy save (JSON)</button>
      <button class="devp-btn" data-dev-action="paste-save">Load save (paste JSON)</button>
      <button class="devp-btn warn" data-dev-action="clear-save">Clear save</button>
    </section>
  `
}

const SAVE_KEY = 'denial_dungeon_save'

function handleAction(action: string, arg?: string) {
  const game = (window as any).__PHASER_GAME__ as Phaser.Game | undefined
  if (!game) return
  const sm = game.scene
  switch (action) {
    case 'puzzle': {
      if (!arg) return
      const [encounterId, puzzleSpecId] = arg.split('|')
      // Return the player to whichever gameplay scene they were in
      // when they hit the dev panel. If neither is active (e.g. on
      // Title), fall back to WaitingRoom — that's where puzzles
      // organically live.
      const returnScene =
        sm.isActive('WaitingRoom') ? 'WaitingRoom'
          : sm.isActive('Hospital') ? 'Hospital'
          : 'WaitingRoom'
      stopAllScenes(sm)
      sm.start('PuzzleBattle', { encounterId, puzzleSpecId, returnScene })
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
        localStorage.removeItem(SAVE_KEY)
        alert('Save cleared. Reload to start fresh.')
      } catch {}
      return
    }
    case 'copy-save': {
      try {
        const raw = localStorage.getItem(SAVE_KEY) ?? ''
        if (!raw) {
          alert('No save in localStorage.')
          return
        }
        // Pretty-print so it's readable when pasted into a doc/snippet.
        const pretty = JSON.stringify(JSON.parse(raw), null, 2)
        navigator.clipboard.writeText(pretty).then(
          () => alert('Save copied to clipboard.'),
          () => {
            // Fallback: show in a textarea the user can manually copy
            // from. Some browsers (or non-https contexts) reject
            // navigator.clipboard.
            promptCopyFallback(pretty)
          },
        )
      } catch (err) {
        alert('Could not read save: ' + (err as Error).message)
      }
      return
    }
    case 'paste-save': {
      const incoming = prompt('Paste a save JSON blob:')
      if (!incoming) return
      try {
        // Validate it's parseable JSON before writing.
        JSON.parse(incoming)
        localStorage.setItem(SAVE_KEY, incoming)
        if (confirm('Save loaded. Reload now?')) {
          location.reload()
        }
      } catch (err) {
        alert('Invalid JSON: ' + (err as Error).message)
      }
      return
    }
  }
}

function promptCopyFallback(text: string) {
  const ta = document.createElement('textarea')
  ta.value = text
  ta.style.cssText =
    'position:fixed; inset:50% 0 0 50%; transform:translate(-50%,-50%); ' +
    'width:560px; height:300px; z-index:9999; padding:8px; ' +
    'font:11px/1.4 ui-monospace, Menlo, monospace; background:#0e1420; ' +
    'color:#d8dee9; border:1px solid #2a3142;'
  document.body.appendChild(ta)
  ta.select()
  alert("Couldn't copy automatically. Hit Cmd/Ctrl-C to copy from the textarea, then click OK to dismiss.")
  ta.remove()
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
  #${TOGGLE_ID} {
    position: fixed;
    top: 8px;
    right: 8px;
    z-index: 9998;
    background: rgba(14, 20, 32, 0.85);
    color: #f0a868;
    border: 1px solid #2a3142;
    border-radius: 999px;
    padding: 4px 10px;
    font: 700 10px/1 ui-monospace, "SF Mono", Menlo, Consolas, monospace;
    letter-spacing: 0.12em;
    cursor: pointer;
    opacity: 0.5;
    transition: opacity 0.15s;
  }
  #${TOGGLE_ID}:hover, #${TOGGLE_ID}:active {
    opacity: 1;
  }
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
