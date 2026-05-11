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
    #${RIBBON_ID} .row { display: flex; justify-content: space-between; gap: 8px; }
    #${RIBBON_ID} .right { color: #c8a040; opacity: 0.85; max-width: 60%;
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
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
  ribbon.innerHTML = '<div class="row"><span class="left">DBG</span><span class="right"></span></div>'
  document.body.appendChild(ribbon)
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
