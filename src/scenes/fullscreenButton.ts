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

    // The click handler must call requestFullscreen synchronously to
    // hold the user-gesture context. We try documentElement first
    // (more reliable across browsers than a child element), with a
    // single fallback to #game. Errors are logged so the cause is
    // visible in devtools instead of disappearing into a swallowed
    // .catch().
    const docEl = document.documentElement as HTMLElement & {
      webkitRequestFullscreen?: (flag?: number) => Promise<void> | void
    }
    const game = document.getElementById('game') as (HTMLElement & {
      webkitRequestFullscreen?: (flag?: number) => Promise<void> | void
    }) | null

    const tryRequest = (
      target: HTMLElement & {
        webkitRequestFullscreen?: (flag?: number) => Promise<void> | void
      },
      label: string,
    ): Promise<void> | null => {
      try {
        if (target.requestFullscreen) {
          // Don't pass navigationUI — some Chrome versions reject the
          // call entirely when an unknown option is present, even
          // though the option is in the spec. The default behavior
          // already hides browser chrome where allowed.
          const p = target.requestFullscreen()
          return p ?? Promise.resolve()
        }
        if (target.webkitRequestFullscreen) {
          target.webkitRequestFullscreen()
          return Promise.resolve()
        }
      } catch (err) {
        console.warn('[fullscreen] sync error on', label, err)
        return null
      }
      console.warn('[fullscreen] no API on', label)
      return null
    }

    const p = tryRequest(docEl, 'documentElement')
    if (p) {
      p.catch((err: unknown) => {
        console.warn('[fullscreen] documentElement rejected:', err)
        // Note: the user gesture has been spent on the failed call,
        // so a retry with #game will likely also fail with
        // "Permissions check failed." We try anyway in case the
        // first attempt was rejected for a target-specific reason.
        if (game) {
          const p2 = tryRequest(game, 'game')
          p2?.catch((err2: unknown) => {
            console.warn('[fullscreen] game rejected:', err2)
            console.warn('[fullscreen] Likely causes: deployed page in an iframe without allow="fullscreen", a Permissions-Policy response header excluding fullscreen, or Chrome on iOS (which is WebKit and has limited fullscreen support).')
          })
        }
      })
    }
  })

  document.body.appendChild(btn)
}
