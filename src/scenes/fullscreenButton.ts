import Phaser from 'phaser'

// Fullscreen toggle for mobile play.
//
// Why a DOM button instead of a Phaser Text object: the Fullscreen API
// requires "transient activation" — the call must happen synchronously
// inside a real user-input event handler. Phaser queues pointer events
// and dispatches them on the next update tick, by which time the browser
// has already discarded the user-gesture context, so requestFullscreen
// silently fails. A native <button> click listener stays inside that
// context.
//
// Singleton: idempotent across scenes. Calling addFullscreenButton from
// multiple scenes is safe and only mounts the button once.

const BUTTON_ID = 'fullscreen-toggle'

export function addFullscreenButton(_scene: Phaser.Scene) {
  if (typeof document === 'undefined') return
  if (document.getElementById(BUTTON_ID)) return

  const btn = document.createElement('button')
  btn.id = BUTTON_ID
  btn.type = 'button'
  btn.textContent = '⛶'
  btn.setAttribute('aria-label', 'Toggle fullscreen')
  btn.style.cssText = [
    'position:fixed', 'top:10px', 'left:10px', 'z-index:10000',
    'background:rgba(14,17,22,0.8)', 'color:#7ee2c1',
    'border:1px solid #3a4a5d', 'border-radius:4px',
    'padding:6px 10px', 'font:bold 20px monospace',
    'line-height:1', 'cursor:pointer',
    '-webkit-user-select:none', 'user-select:none',
    '-webkit-touch-callout:none',
    '-webkit-tap-highlight-color:transparent',
    'touch-action:manipulation',
  ].join(';')

  btn.addEventListener('click', () => {
    const doc = document as unknown as {
      fullscreenElement: Element | null
      webkitFullscreenElement?: Element | null
      exitFullscreen?: () => Promise<void>
      webkitExitFullscreen?: () => Promise<void>
    }
    const fsEl = doc.fullscreenElement || doc.webkitFullscreenElement
    if (fsEl) {
      const exit = doc.exitFullscreen || doc.webkitExitFullscreen
      exit?.call(document)
      return
    }
    const target = document.getElementById('game') || document.documentElement
    const wk = target as unknown as {
      webkitRequestFullscreen?: (flag?: number) => Promise<void> | void
    }
    if (target.requestFullscreen) {
      // Standard API. iOS 16.4+ supports this on arbitrary elements.
      target.requestFullscreen({ navigationUI: 'hide' }).catch(() => {})
    } else if (wk.webkitRequestFullscreen) {
      // Older WebKit (iOS Safari < 16.4). Only works on <video> in
      // practice, but call it anyway in case a future iOS exposes it.
      wk.webkitRequestFullscreen()
    }
  })

  document.body.appendChild(btn)
}
