// Always-on diagnostic ribbon at the top of the viewport. DOM-only,
// can't be hidden by canvas / WebGL issues. Shows the active scene,
// currentLevel, and a short event tail so when the player reports
// "blank screen", we can tell from a screenshot whether the page is
// still alive and which scene is running.
//
// Visible only when `?dev=1` is set on the URL OR the game is running
// in vite dev mode. Mirrors the dev-panel gate in src/dev/devPanel.ts
// so prod builds without `?dev=1` are unaffected.

const RIBBON_ID = '__debug_ribbon__'
const STYLE_ID = '__debug_ribbon_style__'

function isEnabled(): boolean {
  if (import.meta.env.DEV) return true
  try {
    const v = new URLSearchParams(location.search).get('dev')
    if (v === null) return false
    return v !== '0' && v.toLowerCase() !== 'false' && v !== ''
  } catch { return false }
}

let installed = false
let ribbon: HTMLDivElement | null = null
const events: string[] = []

function ensureStyle() {
  if (document.getElementById(STYLE_ID)) return
  const style = document.createElement('style')
  style.id = STYLE_ID
  style.textContent = `
    #${RIBBON_ID} {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      z-index: 99999;
      pointer-events: none;
      font: 10px/1.3 ui-monospace, "SF Mono", Menlo, Consolas, monospace;
      color: #7ee2c1;
      background: rgba(14, 17, 22, 0.85);
      border-bottom: 1px solid #2a3142;
      padding: 4px 8px;
      letter-spacing: 0.04em;
    }
    @media (pointer: coarse) {
      #${RIBBON_ID} { font-size: 11px; padding: 5px 10px; }
    }
    #${RIBBON_ID} .row { display: flex; justify-content: space-between; gap: 8px; align-items: center; }
    #${RIBBON_ID} .right { color: #c8a040; opacity: 0.85; max-width: 60%;
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    /* Copy button — sole tappable element in the ribbon. Everything
       else stays pointer-events:none so it doesn't block game input. */
    #${RIBBON_ID} .copy-btn {
      pointer-events: auto;
      cursor: pointer;
      background: rgba(126, 226, 193, 0.12);
      color: #7ee2c1;
      border: 1px solid #3a6b58;
      border-radius: 3px;
      padding: 2px 8px;
      font: inherit;
      font-size: 10px;
      letter-spacing: 0.06em;
      flex-shrink: 0;
    }
    #${RIBBON_ID} .copy-btn:hover, #${RIBBON_ID} .copy-btn:active {
      background: rgba(126, 226, 193, 0.24);
    }
    #${RIBBON_ID} .copy-btn.flash {
      background: #7ee2c1;
      color: #0e1116;
    }
    @media (pointer: coarse) {
      #${RIBBON_ID} .copy-btn { padding: 4px 12px; font-size: 11px; min-height: 28px; }
    }
    /* Modal — opens when the player taps "Copy" so the full event tail
       is visible + selectable, with explicit copy + dismiss buttons.
       Useful on iOS where clipboard write requires a user gesture. */
    #${RIBBON_ID}-modal {
      position: fixed;
      inset: 0;
      z-index: 99998;
      background: rgba(8, 11, 16, 0.92);
      display: none;
      align-items: center;
      justify-content: center;
      padding: 24px;
      font: 13px/1.45 -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif;
    }
    #${RIBBON_ID}-modal.open { display: flex; }
    #${RIBBON_ID}-modal .card {
      width: min(560px, 100%);
      background: #0e1420;
      border: 1px solid #2a3142;
      border-left: 4px solid #7ee2c1;
      border-radius: 8px;
      padding: 18px 20px;
      color: #d8dee9;
      max-height: 80vh;
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    #${RIBBON_ID}-modal h2 {
      margin: 0; font-size: 13px; font-weight: 700;
      color: #7ee2c1; letter-spacing: 0.1em;
    }
    #${RIBBON_ID}-modal textarea {
      width: 100%; min-height: 200px; flex: 1;
      background: #07090e; color: #d8dee9; border: 1px solid #2a3142;
      border-radius: 4px; padding: 10px;
      font: 11px/1.5 ui-monospace, "SF Mono", Menlo, monospace;
      resize: vertical;
      -webkit-user-select: text; user-select: text;
    }
    #${RIBBON_ID}-modal .actions {
      display: flex; gap: 8px; justify-content: flex-end;
    }
    #${RIBBON_ID}-modal button {
      padding: 8px 14px; border-radius: 4px;
      font: inherit; font-size: 12px; cursor: pointer;
      background: #15191f; color: #d8dee9; border: 1px solid #2a3142;
    }
    #${RIBBON_ID}-modal button.primary {
      background: rgba(126, 226, 193, 0.16); color: #7ee2c1; border-color: #3a6b58;
    }
    #${RIBBON_ID}-modal button.primary.flash { background: #7ee2c1; color: #0e1116; }
  `
  document.head.appendChild(style)
}

export function installDebugRibbon() {
  if (installed) return
  if (!isEnabled()) return
  installed = true
  ensureStyle()
  ribbon = document.createElement('div')
  ribbon.id = RIBBON_ID
  ribbon.innerHTML = `
    <div class="row">
      <span class="left">DBG</span>
      <span class="right"></span>
      <button class="copy-btn" type="button" aria-label="Show + copy debug log">📋 Log</button>
    </div>
  `
  document.body.appendChild(ribbon)

  // Modal — a long-form view of the event tail with explicit
  // selectable textarea + copy button. iOS clipboard writes need a
  // user gesture; tapping the modal's Copy button is that gesture.
  const modal = document.createElement('div')
  modal.id = `${RIBBON_ID}-modal`
  modal.innerHTML = `
    <div class="card">
      <h2>DEBUG LOG</h2>
      <textarea readonly></textarea>
      <div class="actions">
        <button type="button" data-act="close">Close</button>
        <button type="button" class="primary" data-act="copy">Copy to clipboard</button>
      </div>
    </div>
  `
  document.body.appendChild(modal)

  const openBtn = ribbon.querySelector('.copy-btn') as HTMLButtonElement
  const ta = modal.querySelector('textarea') as HTMLTextAreaElement
  const copyBtn = modal.querySelector('button[data-act="copy"]') as HTMLButtonElement
  const closeBtn = modal.querySelector('button[data-act="close"]') as HTMLButtonElement

  openBtn.addEventListener('click', e => {
    e.preventDefault()
    e.stopPropagation()
    ta.value = events.join('\n') || '(no events yet)'
    modal.classList.add('open')
    // Pre-select for one-tap copy from external menu.
    setTimeout(() => { ta.select() }, 0)
  })
  copyBtn.addEventListener('click', () => {
    ta.select()
    let ok = false
    try {
      // navigator.clipboard requires HTTPS context; fall back to
      // execCommand for non-secure contexts (e.g. local dev HTTP).
      if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(ta.value)
        ok = true
      } else {
        ok = document.execCommand('copy')
      }
    } catch { ok = false }
    if (ok) {
      copyBtn.classList.add('flash')
      copyBtn.textContent = '✓ Copied'
      setTimeout(() => {
        copyBtn.classList.remove('flash')
        copyBtn.textContent = 'Copy to clipboard'
      }, 1200)
    }
  })
  closeBtn.addEventListener('click', () => modal.classList.remove('open'))
  // Tap backdrop (not the card) to close.
  modal.addEventListener('click', e => {
    if (e.target === modal) modal.classList.remove('open')
  })
}

/** Push an event into the rolling tail. Trimmed to 4 most recent. */
export function debugEvent(label: string) {
  if (!installed) return
  const t = new Date()
  const ts = `${String(t.getMinutes()).padStart(2, '0')}:${String(t.getSeconds()).padStart(2, '0')}`
  // Sniff memory if the runtime exposes it. Chrome/Edge/Android Chrome
  // implement performance.memory (non-standard). iOS Safari does not,
  // so this is best-effort — when available, it gives a real signal on
  // mobile crashes that smell like memory pressure.
  let memTag = ''
  try {
    const m = (performance as any).memory
    if (m && m.usedJSHeapSize) {
      const mb = Math.round(m.usedJSHeapSize / (1024 * 1024))
      memTag = ` [${mb}MB]`
    }
  } catch {}
  events.push(`${ts} ${label}${memTag}`)
  while (events.length > 12) events.shift()
  refresh()
}

/** Update the left side. Called at most once per scene transition or
 *  pending-flag mutation. */
export function debugStatus(left: string) {
  if (!installed || !ribbon) return
  const leftEl = ribbon.querySelector('.left') as HTMLElement | null
  if (leftEl) leftEl.textContent = left
}

function refresh() {
  if (!ribbon) return
  const rightEl = ribbon.querySelector('.right') as HTMLElement | null
  if (rightEl) rightEl.textContent = events.slice(-6).join(' · ')
}
