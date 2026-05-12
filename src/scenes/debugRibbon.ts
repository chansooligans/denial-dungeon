// Always-on diagnostic ribbon at the top of the viewport. DOM-only,
// can't be hidden by canvas / WebGL issues. Shows the active scene,
// currentLevel, and a short event tail so when the player reports
// "blank screen", we can tell from a screenshot whether the page is
// still alive and which scene is running.
//
// Visible only when `?dev=1` is set on the URL OR the game is running
// in vite dev mode. Mirrors the dev-panel gate in src/dev/devPanel.ts
// so prod builds without `?dev=1` are unaffected.

// Ribbon CSS lives in a sibling .css file for syntax highlighting +
// diffability. The CSS references `#__debug_ribbon__` directly (not
// template-interpolated) so the constants below have to match.
import ribbonCssRaw from './debugRibbon.css?raw'

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
  style.textContent = ribbonCssRaw
  document.head.appendChild(style)
}


export function installDebugRibbon() {
  if (installed) return
  if (!isEnabled()) return
  installed = true
  ensureStyle()
  installGlobalErrorListeners()
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

// ============================================================
// Global error overlay — surfaces uncaught JS errors as a visible
// red banner over the canvas. Without this, runtime errors during
// scene transitions blank the screen with no UI clue. Wired to
// window.onerror + unhandledrejection so it catches both sync and
// async crashes. Gated by isEnabled() (dev mode or ?dev=1).
// ============================================================

const ERROR_OVERLAY_ID = '__error_overlay__'
const errors: { msg: string; stack: string; at: string }[] = []
let errorsInstalled = false

function timestamp(): string {
  const t = new Date()
  return `${String(t.getMinutes()).padStart(2, '0')}:${String(t.getSeconds()).padStart(2, '0')}`
}

function ensureErrorOverlay() {
  if (document.getElementById(ERROR_OVERLAY_ID)) return
  const div = document.createElement('div')
  div.id = ERROR_OVERLAY_ID
  div.style.cssText = `
    position: fixed; left: 8px; right: 8px; bottom: 8px;
    z-index: 99998;
    background: rgba(40, 10, 16, 0.96);
    color: #f3a4b6;
    border: 1px solid #ef5b7b;
    border-radius: 6px;
    padding: 10px 14px;
    font: 11px/1.45 ui-monospace, "SF Mono", Menlo, Consolas, monospace;
    max-height: 50vh;
    overflow-y: auto;
    pointer-events: auto;
    display: none;
  `
  document.body.appendChild(div)
}

function renderErrors() {
  const div = document.getElementById(ERROR_OVERLAY_ID) as HTMLDivElement | null
  if (!div) return
  if (errors.length === 0) {
    div.style.display = 'none'
    return
  }
  div.style.display = 'block'
  // Show the most recent 3 errors. Older ones drop off.
  const recent = errors.slice(-3).reverse()
  const btnStyle = 'background:transparent;color:#f3a4b6;border:1px solid #6b3742;border-radius:3px;padding:2px 8px;cursor:pointer;font:inherit;font-size:10px;margin-left:6px;'
  div.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
      <span style="color:#ef5b7b;font-weight:700;letter-spacing:0.08em;">⚠ ERROR (${errors.length})</span>
      <span>
        <button type="button" data-err-act="copy" style="${btnStyle}">📋 copy</button>
        <button type="button" data-err-act="dismiss" style="${btnStyle}">dismiss</button>
      </span>
    </div>
    ${recent.map(e => `
      <div style="margin-bottom:6px;padding-bottom:6px;border-bottom:1px dashed #6b3742;">
        <div style="color:#f3a4b6;font-weight:700;">[${e.at}] ${escapeForHtml(e.msg)}</div>
        ${e.stack ? `<div style="color:#8a93a3;font-size:10px;margin-top:4px;white-space:pre-wrap;">${escapeForHtml(e.stack)}</div>` : ''}
      </div>
    `).join('')}
  `
  // Wire the buttons. innerHTML wipes prior listeners on every render
  // so we have to re-bind after each write — cheap given the overlay
  // is only visible when something already went wrong.
  const copyBtn = div.querySelector('button[data-err-act="copy"]') as HTMLButtonElement | null
  const dismissBtn = div.querySelector('button[data-err-act="dismiss"]') as HTMLButtonElement | null
  if (copyBtn) copyBtn.addEventListener('click', copyErrorsToClipboard)
  if (dismissBtn) dismissBtn.addEventListener('click', () => { div.style.display = 'none' })
}

/** Serialize all collected errors + the recent debug-ribbon event tail
 *  into a single multiline blob and copy to clipboard. Falls back to
 *  execCommand for non-HTTPS dev contexts where navigator.clipboard
 *  is unavailable. Briefly flashes the button on success. */
function copyErrorsToClipboard() {
  const lines: string[] = []
  lines.push(`ERROR REPORT (${errors.length})`)
  lines.push(`UA: ${navigator.userAgent}`)
  lines.push(`URL: ${location.href}`)
  lines.push('')
  for (const e of errors) {
    lines.push(`[${e.at}] ${e.msg}`)
    if (e.stack) lines.push(e.stack)
    lines.push('')
  }
  if (events.length > 0) {
    lines.push('--- recent events ---')
    lines.push(...events)
  }
  const text = lines.join('\n')
  const btn = document.querySelector(`#${ERROR_OVERLAY_ID} button[data-err-act="copy"]`) as HTMLButtonElement | null
  const flash = (ok: boolean) => {
    if (!btn) return
    const orig = btn.textContent
    btn.textContent = ok ? '✓ copied' : '✗ failed'
    setTimeout(() => { btn.textContent = orig }, 1200)
  }
  try {
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text).then(() => flash(true), () => flash(false))
      return
    }
  } catch { /* fall through to execCommand */ }
  // Non-secure-context fallback: hidden textarea + execCommand.
  const ta = document.createElement('textarea')
  ta.value = text
  ta.style.cssText = 'position:fixed;left:-9999px;top:0;'
  document.body.appendChild(ta)
  ta.select()
  let ok = false
  try { ok = document.execCommand('copy') } catch { ok = false }
  ta.remove()
  flash(ok)
}

function escapeForHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

/** Push a runtime error into the rolling list + render overlay. Also
 *  drops a `err:` line into the regular debug-ribbon event tail so
 *  the copy-paste log includes it. */
export function reportError(msg: string, stack?: string) {
  if (!isEnabled()) return
  ensureErrorOverlay()
  errors.push({ msg, stack: stack ?? '', at: timestamp() })
  while (errors.length > 12) errors.shift()
  renderErrors()
  // Also surface to the debug ribbon's event tail for copy.
  debugEvent(`err: ${msg.slice(0, 60)}`)
}

/** Install global window-level error listeners. Called from
 *  installDebugRibbon. Idempotent. */
function installGlobalErrorListeners() {
  if (errorsInstalled) return
  errorsInstalled = true
  window.addEventListener('error', e => {
    const stack = e.error?.stack?.split('\n').slice(0, 5).join('\n') ?? ''
    reportError(e.message || 'Uncaught error', stack)
  })
  window.addEventListener('unhandledrejection', e => {
    const reason = e.reason
    const msg = reason?.message ?? String(reason)
    const stack = reason?.stack?.split('\n').slice(0, 5).join('\n') ?? ''
    reportError(`Unhandled rejection: ${msg}`, stack)
  })
}

