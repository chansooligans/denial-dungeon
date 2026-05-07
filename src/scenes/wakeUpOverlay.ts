// Cinematic 'CLAIM SUBMITTED' wake-up overlay shown when the player
// returns to the Hospital after solving a puzzle. DOM overlay only —
// sidesteps Phaser's camera transforms, GPU compositing quirks, and
// any backdrop-filter rendering edge cases (the panel previously
// failed to appear on some mobile browsers).
//
// Inline styles, no @keyframes, opacity starts at 1 so the panel is
// visible the moment the node mounts. Click-to-skip with a debounce
// against synthetic touch-replay clicks. Three independent triggers
// route through one idempotent finish():
//   1. user click on the overlay
//   2. scene-clock timer (2.4s) — the natural cinematic length
//   3. window-clock backstop (5s) — fires even if the scene clock
//      pauses or shuts down before its delayedCall resolves

import Phaser from 'phaser'

const OVERLAY_ID = '__wake_up_overlay__'

export function runWakeUpTransition(
  scene: Phaser.Scene,
  claimId: string | null,
  onComplete: () => void,
) {
  // Tear down any orphaned overlay from a prior invocation. Some
  // browsers can leave the previous one in the DOM if the scene shut
  // down before its remove() ran.
  document.getElementById(OVERLAY_ID)?.remove()

  const overlay = document.createElement('div')
  overlay.id = OVERLAY_ID
  overlay.style.cssText = [
    'position: fixed',
    'inset: 0',
    'z-index: 700',
    'background: rgba(20, 10, 5, 0.55)',
    'display: flex',
    'align-items: center',
    'justify-content: center',
    'opacity: 1',
    'transition: opacity 350ms ease',
    'cursor: pointer',
  ].join('; ')

  const panel = document.createElement('div')
  panel.style.cssText = [
    'background: #f5e6c8',
    'color: #1a1208',
    'border: 2px solid #2a1a0e',
    'border-radius: 4px',
    'padding: 22px 30px',
    'font: 700 18px/1.3 ui-monospace, "SF Mono", Menlo, Consolas, monospace',
    'letter-spacing: 0.06em',
    'box-shadow: 0 12px 40px rgba(0, 0, 0, 0.5)',
    'text-align: center',
  ].join('; ')
  const checkColor = '#1a6e52'
  panel.innerHTML = `
    <div><span style="color:${checkColor};margin-right:8px;">✓</span>CLAIM SUBMITTED</div>
    ${claimId
      ? `<div style="margin-top:6px;font-size:11px;font-weight:400;letter-spacing:0.08em;color:#5a3a1a;">${claimId}</div>`
      : ''}
  `
  overlay.appendChild(panel)
  document.body.appendChild(overlay)

  let done = false
  const finish = () => {
    if (done) return
    done = true
    overlay.style.opacity = '0'
    window.setTimeout(() => {
      overlay.remove()
      onComplete()
    }, 380)
  }

  // Click-to-skip — debounced 600ms so a synthetic click leftover
  // from the puzzle submit (mobile touch can replay a click after
  // touchstart→touchend on a freshly-mounted overlay) doesn't
  // dismiss the panel before the player sees it.
  const createdAt = Date.now()
  overlay.addEventListener('click', () => {
    if (Date.now() - createdAt < 600) return
    finish()
  })

  scene.time.delayedCall(2400, finish)
  window.setTimeout(finish, 5000)
}
