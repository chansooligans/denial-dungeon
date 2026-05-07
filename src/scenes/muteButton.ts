import Phaser from 'phaser'

// Mute / unmute toggle. Phaser exposes a global sound manager at
// `game.sound`; setting `mute = true` silences every active and
// future sound (intro song, hospital ambience, WR red-room ambience,
// puzzle-submit FX, etc.) without us having to track them.
//
// Why a DOM button (same reason as fullscreenButton): the mute state
// is per-game, not per-scene, and a fixed-position DOM element gives
// it a single mount point that survives scene transitions. Persists
// across page reloads via localStorage.
//
// Singleton: idempotent across scenes.

const BUTTON_ID = 'mute-toggle'
const STORAGE_KEY = 'wr_muted'

function readMuted(): boolean {
  try { return localStorage.getItem(STORAGE_KEY) === '1' } catch { return false }
}
function writeMuted(v: boolean) {
  try { localStorage.setItem(STORAGE_KEY, v ? '1' : '0') } catch { /* ignore */ }
}

function applyMute(muted: boolean) {
  const game = (window as unknown as { __PHASER_GAME__?: Phaser.Game }).__PHASER_GAME__
  if (!game) return
  // Prefer setMute if available (newer Phaser); fall back to direct
  // assignment which has been stable for many versions.
  const sm = game.sound as Phaser.Sound.BaseSoundManager & { setMute?: (m: boolean) => void }
  if (typeof sm.setMute === 'function') sm.setMute(muted)
  else sm.mute = muted
}

function setIcon(btn: HTMLButtonElement, muted: boolean) {
  btn.textContent = muted ? '🔇' : '🔊'
  btn.setAttribute('aria-label', muted ? 'Unmute' : 'Mute')
}

export function addMuteButton(_scene: Phaser.Scene) {
  if (typeof document === 'undefined') return
  if (document.getElementById(BUTTON_ID)) return

  const btn = document.createElement('button')
  btn.id = BUTTON_ID
  btn.type = 'button'
  btn.style.cssText = [
    'position:fixed', 'top:10px', 'left:60px', 'z-index:10000',
    'background:rgba(14,17,22,0.8)', 'color:#7ee2c1',
    'border:1px solid #3a4a5d', 'border-radius:4px',
    'padding:6px 10px', 'font:bold 18px monospace',
    'line-height:1', 'cursor:pointer',
    '-webkit-user-select:none', 'user-select:none',
    '-webkit-touch-callout:none',
    '-webkit-tap-highlight-color:transparent',
    'touch-action:manipulation',
  ].join(';')
  // Bigger tap target on touch devices.
  const css = document.createElement('style')
  css.textContent = `
    @media (pointer: coarse) {
      #${BUTTON_ID} { padding: 10px 14px; font-size: 22px; }
    }
  `
  document.head.appendChild(css)

  let muted = readMuted()
  setIcon(btn, muted)
  applyMute(muted)

  btn.addEventListener('click', () => {
    muted = !muted
    writeMuted(muted)
    applyMute(muted)
    setIcon(btn, muted)
  })

  document.body.appendChild(btn)

  // The game may not exist yet on first mount (BootScene's preload
  // can run before this is called). Re-apply the saved mute once
  // it's ready so audio assets that load lazily inherit the state.
  const game = (window as unknown as { __PHASER_GAME__?: Phaser.Game }).__PHASER_GAME__
  if (game && !game.sound) {
    game.events.once(Phaser.Core.Events.READY, () => applyMute(muted))
  }
}
