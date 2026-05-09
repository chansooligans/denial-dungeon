// Lightweight narration overlay used by HospitalScene + WaitingRoomScene.
// Renders a translucent box at the bottom of the viewport (HTML overlay,
// not Phaser canvas), fades each line in/out in sequence, then calls
// onComplete and tears the elements down.
//
// HTML overlay sidesteps the Phaser camera transforms — narration always
// lands at the intended screen position regardless of which scene's
// camera (zoomed or not) is rendering. Plus the browser handles font
// rendering / accessibility / device-pixel scaling cleanly on mobile.

import Phaser from 'phaser'
import { isTouchDevice } from './device'
import { setTouchOverlayHidden } from './TouchOverlay'

const STYLE_ID = '__narration_style__'
const OVERLAY_ID = '__narration_overlay__'

function ensureStyle() {
  if (document.getElementById(STYLE_ID)) return
  const style = document.createElement('style')
  style.id = STYLE_ID
  style.textContent = `
    #${OVERLAY_ID} {
      position: fixed;
      left: 50%;
      bottom: 24px;
      transform: translateX(-50%);
      z-index: 650;
      box-sizing: border-box;
      max-width: min(960px, calc(100vw - 32px));
      width: calc(100vw - 32px);
      padding: 18px 28px;
      background: rgba(14, 17, 22, 0.92);
      border: 1px solid #2a323d;
      color: #e6edf3;
      font: 17px/1.4 ui-monospace, "SF Mono", Menlo, Consolas, monospace;
      text-align: center;
      cursor: pointer;
      opacity: 1;
      transition: opacity 280ms ease;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.5);
    }
    @media (pointer: coarse) {
      #${OVERLAY_ID} {
        font-size: 21px;
        padding: 22px 28px;
        bottom: 40px;
      }
    }
    #${OVERLAY_ID}.fading { opacity: 0; }
    #${OVERLAY_ID} .hint {
      display: block;
      margin-top: 10px;
      font-size: 12px;
      color: #5a6a7a;
      letter-spacing: 0.08em;
      opacity: 0;
      transition: opacity 200ms ease;
    }
    #${OVERLAY_ID}.idle .hint { opacity: 1; }
  `
  document.head.appendChild(style)
}

export function showNarration(
  scene: Phaser.Scene,
  lines: string[],
  onComplete: () => void,
  options?: {
    color?: string
    /** Legacy parameter; ignored. The overlay is DOM-based now and
     *  isn't affected by Phaser cameras. */
    ignoreCameras?: Phaser.Cameras.Scene2D.Camera[]
  },
) {
  void options?.ignoreCameras // legacy, ignored
  ensureStyle()

  // Tear down any orphaned narration overlay before creating a new one.
  document.getElementById(OVERLAY_ID)?.remove()

  // Hide mobile touch d-pad while narration is up — the overlay sits
  // at the bottom of the viewport, exactly where the d-pad lives.
  // Restored in finish() once narration tears down.
  setTouchOverlayHidden(true)

  const overlay = document.createElement('div')
  overlay.id = OVERLAY_ID
  if (options?.color) overlay.style.color = options.color
  document.body.appendChild(overlay)

  // Touch the layout once so the opacity transition runs from 0 → 1.
  void overlay.offsetWidth

  let i = 0
  let done = false
  let onKey: ((e: KeyboardEvent) => void) | null = null

  const finish = () => {
    if (done) return
    done = true
    if (onKey) window.removeEventListener('keydown', onKey)
    setTouchOverlayHidden(false)
    overlay.classList.add('fading')
    overlay.classList.remove('idle')
    window.setTimeout(() => {
      overlay.remove()
      onComplete()
    }, 280)
  }

  const showNext = () => {
    if (done) return
    if (i >= lines.length) {
      finish()
      return
    }
    const line = lines[i]
    i += 1
    overlay.classList.remove('idle')
    overlay.innerHTML = `<div>${line}</div><span class="hint">click ▸</span>`
    // After a brief read pause, surface the click hint.
    window.setTimeout(() => {
      if (done) return
      overlay.classList.add('idle')
    }, 350)
  }

  // Advance handler — same logic for click and Space/Enter. Ignore
  // input in the first ~500ms so a synthetic click from the preceding
  // scene's touch-end doesn't blow past the first line on mobile.
  const createdAt = Date.now()
  const advance = () => {
    if (Date.now() - createdAt < 500) return
    if (done) return
    if (i >= lines.length) {
      finish()
      return
    }
    showNext()
  }
  overlay.addEventListener('click', advance)

  onKey = (e: KeyboardEvent) => {
    if (e.code === 'Space' || e.code === 'Enter') {
      e.preventDefault()
      advance()
    }
  }
  window.addEventListener('keydown', onKey)

  // Backstop: if the scene shuts down while narration is up, tear it
  // down on the global clock so the overlay can never linger.
  scene.events.once(Phaser.Scenes.Events.SHUTDOWN, finish)
  scene.events.once(Phaser.Scenes.Events.DESTROY, finish)

  showNext()
}
