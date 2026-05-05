// TouchOverlay — virtual D-pad + interact button for mobile play.
//
// Implementation: native DOM <button> elements, NOT Phaser GameObjects.
// Why: Phaser queues pointer events to the next update tick, which on
// mobile causes laggy / dropped touches and breaks transient activation
// for things like fullscreen requests. Native DOM listeners run inside
// the real touch event, so taps and holds register reliably.
//
// Each button dispatches synthetic KeyboardEvent("keydown" / "keyup")
// to window so the underlying scene's `cursors.left.isDown`-style
// checks behave exactly as if a real key were held.

import Phaser from 'phaser'
import { addFullscreenButton } from './fullscreenButton'

const ROOT_ID = 'touch-overlay-root'

interface BtnSpec {
  label: string
  key: string
  code: string
  /**
   * Numeric keyCode for the synthetic KeyboardEvent. Phaser's
   * KeyboardPlugin looks up its Key objects by event.keyCode — without
   * this, synthetic events match nothing and arrow taps do nothing.
   */
  keyCode: number
  className: string
  hold: boolean
}

const BUTTONS: BtnSpec[] = [
  { label: '▲', key: 'ArrowUp',    code: 'ArrowUp',    keyCode: 38, className: 'tc-up',    hold: true  },
  { label: '▼', key: 'ArrowDown',  code: 'ArrowDown',  keyCode: 40, className: 'tc-down',  hold: true  },
  { label: '◀', key: 'ArrowLeft',  code: 'ArrowLeft',  keyCode: 37, className: 'tc-left',  hold: true  },
  { label: '▶', key: 'ArrowRight', code: 'ArrowRight', keyCode: 39, className: 'tc-right', hold: true  },
  { label: 'E', key: 'e',          code: 'KeyE',       keyCode: 69, className: 'tc-e',     hold: false },
  { label: 'ESC', key: 'Escape',   code: 'Escape',     keyCode: 27, className: 'tc-esc',   hold: false },
]

// Tracks live keys per button so we can synthesize keyup if the button
// is removed mid-press (e.g. on scene shutdown).
const heldKeys = new Map<string, BtnSpec>()

function fireKey(type: 'keydown' | 'keyup', spec: BtnSpec) {
  // keyCode and which are read-only on KeyboardEvent in some browsers,
  // so set them via Object.defineProperty after construction. Phaser's
  // KeyboardPlugin matches Key objects by event.keyCode.
  const event = new KeyboardEvent(type, {
    key: spec.key, code: spec.code, bubbles: true, cancelable: true,
    keyCode: spec.keyCode, which: spec.keyCode,
  } as KeyboardEventInit)
  if (event.keyCode !== spec.keyCode) {
    Object.defineProperty(event, 'keyCode', { get: () => spec.keyCode })
    Object.defineProperty(event, 'which',   { get: () => spec.keyCode })
  }
  window.dispatchEvent(event)
}

function ensureStyles() {
  if (document.getElementById('touch-overlay-styles')) return
  const style = document.createElement('style')
  style.id = 'touch-overlay-styles'
  style.textContent = `
    #${ROOT_ID} {
      position: fixed; inset: 0; pointer-events: none; z-index: 9000;
      font-family: monospace;
    }
    #${ROOT_ID} button {
      position: fixed; pointer-events: auto;
      background: rgba(14,17,22,0.55);
      color: #7ee2c1; border: 1px solid rgba(58,74,93,0.9);
      font: bold 18px monospace; line-height: 1;
      cursor: pointer; user-select: none;
      -webkit-tap-highlight-color: transparent;
      touch-action: manipulation;
    }
    #${ROOT_ID} button:active { background: rgba(31,42,54,0.85); }
    #${ROOT_ID} .tc-dpad-btn {
      width: 56px; height: 56px; border-radius: 50%;
    }
    #${ROOT_ID} .tc-up    { left: 62px;  bottom: 146px; }
    #${ROOT_ID} .tc-down  { left: 62px;  bottom: 34px;  }
    #${ROOT_ID} .tc-left  { left: 6px;   bottom: 90px;  }
    #${ROOT_ID} .tc-right { left: 118px; bottom: 90px;  }
    #${ROOT_ID} .tc-e {
      right: 16px; bottom: 64px;
      width: 108px; height: 108px; border-radius: 50%;
      font-size: 32px;
    }
    #${ROOT_ID} .tc-esc {
      right: 16px; top: 12px;
      padding: 6px 10px; font-size: 14px;
      color: #3a4a5d; border-radius: 4px;
      background: rgba(14,17,22,0.8);
    }
  `
  document.head.appendChild(style)
}

function mountRoot(): HTMLDivElement {
  let root = document.getElementById(ROOT_ID) as HTMLDivElement | null
  if (root) return root
  ensureStyles()
  root = document.createElement('div')
  root.id = ROOT_ID
  document.body.appendChild(root)
  return root
}

function makeButton(spec: BtnSpec): HTMLButtonElement {
  const btn = document.createElement('button')
  btn.type = 'button'
  btn.textContent = spec.label
  btn.setAttribute('aria-label', spec.label)
  btn.className = spec.className + (spec.hold ? ' tc-dpad-btn' : '')

  if (spec.hold) {
    const press = (e: Event) => {
      e.preventDefault()
      if (heldKeys.has(spec.code)) return
      heldKeys.set(spec.code, spec)
      fireKey('keydown', spec)
    }
    const release = (e: Event) => {
      e.preventDefault()
      if (!heldKeys.has(spec.code)) return
      heldKeys.delete(spec.code)
      fireKey('keyup', spec)
    }
    btn.addEventListener('pointerdown', press)
    btn.addEventListener('pointerup', release)
    btn.addEventListener('pointercancel', release)
    btn.addEventListener('pointerleave', release)
  } else {
    // Tap-style: fire a synthetic keydown immediately followed by keyup
    // on a real click, so SpaceBar-/Escape-/E-style listeners that check
    // `keydown-X` events fire once.
    btn.addEventListener('click', (e) => {
      e.preventDefault()
      fireKey('keydown', spec)
      fireKey('keyup', spec)
    })
  }

  return btn
}

export class TouchOverlay extends Phaser.Scene {
  private buttons: HTMLButtonElement[] = []

  constructor() {
    super('TouchOverlay')
  }

  create() {
    const root = mountRoot()
    this.buttons = BUTTONS.map(spec => {
      const btn = makeButton(spec)
      root.appendChild(btn)
      return btn
    })

    addFullscreenButton(this)

    this.events.once('shutdown', () => this.teardown())
    this.events.once('destroy', () => this.teardown())
  }

  private teardown() {
    // Synthesize keyup for any keys still held so the underlying scene
    // doesn't get a stuck-direction bug.
    for (const spec of heldKeys.values()) fireKey('keyup', spec)
    heldKeys.clear()
    for (const btn of this.buttons) btn.remove()
    this.buttons = []
  }
}
