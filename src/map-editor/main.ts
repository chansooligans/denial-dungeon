// Map editor — view & tweak object placement / size / orientation
// for level1.
//
// Mounted at /map-editor.html. Loads the live LEVEL_1_MAP, renders a
// top-down view of every tile with each object's actual sprite PNG,
// and lets you:
//
//   - Click an object to select it; drag to move; Del to remove.
//   - F flip horizontally; 0 reset orientation.
//   - +/- (or [/]) resize the selected object; 1 reset to default size.
//   - Click empty floor → palette of every available sprite (active
//     glyph-mapped textures AND inactive ones whose key isn't yet
//     bound to a glyph). Pick one to drop it on the tile.
//   - Mouse wheel + Cmd/Ctrl, or the +/- buttons in the toolbar, to
//     zoom the canvas in/out.
//
// Output is a paste-back tileMeta + tileOverrides snippet for
// src/content/maps/level1.ts. tileMeta carries sprite overrides,
// size, and flipX; tileOverrides only emits when an object was
// removed (clears the default obj layer).

import { LEVEL_1_MAP } from '../content/maps/level1'
import {
  GLYPH_TO_OBJ_KEY,
  OBJ_KEY_TO_SRC,
  VARIANT_KEY_TO_SRC,
  GLYPH_LABEL,
} from './data'

const TILE = 24 // CSS px per tile in the editor view at zoom 1.0

// All sprite keys the editor knows how to render. Combines:
//   - OBJ_KEY_TO_SRC (canonical hospital + waiting-room textures
//     mapped to their LoRA cell PNGs)
//   - VARIANT_KEY_TO_SRC (h_desk_1..12 + h_plant_1..20)
// The palette lists every key in here, so users can place objects
// whose texture isn't yet glyph-bound (the "inactive" ones).
const ALL_SPRITES: Record<string, string> = {
  ...OBJ_KEY_TO_SRC,
  ...VARIANT_KEY_TO_SRC,
}

// Reverse of GLYPH_TO_OBJ_KEY — used at bootstrap to derive each
// existing tile's default sprite from its layout glyph.
const OBJ_KEY_BY_GLYPH = GLYPH_TO_OBJ_KEY

interface PlacedObj {
  x: number
  y: number
  /** Tile glyph at this position from the original layout. We don't
   *  mutate the glyph through normal placement — sprite overrides go
   *  through tileMeta. Only "remove" emits a tileOverrides entry. */
  ch: string
  /** Sprite texture key — what actually renders. Defaults to the
   *  glyph's default obj at bootstrap; user palette picks override. */
  sprite: string
  flipX?: boolean
  /** Display-size multiplier vs the standard 2-tile object size.
   *  Default 1.0; range clamped to [0.4, 2.5]. */
  size?: number
}

interface EditorState {
  /** All rendered objects keyed by `"x,y"` — both layout-derived
   *  and freshly-added via the palette. */
  objects: Map<string, PlacedObj>
  /** Tiles whose default obj has been removed by the user. Emit as
   *  tileOverrides ch:'' so the running game clears the default. */
  removed: Set<string>
  /** Selected object position, if any. */
  selectedKey: string | null
}

const state: EditorState = {
  objects: new Map(),
  removed: new Set(),
  selectedKey: null,
}

/** Load the layout into state.objects, applying any tileMeta from
 *  level1.ts so we open the editor mid-edit-friendly (you see your
 *  previous flips, sprite overrides, and resizes). */
function bootstrap() {
  const { layout, width: mw, height: mh, tileMeta } = LEVEL_1_MAP
  for (let y = 0; y < mh; y++) {
    const row = layout[y] || ''
    for (let x = 0; x < mw; x++) {
      const ch = row[x]
      if (!ch) continue
      const key = `${x},${y}`
      const meta = tileMeta?.[key]
      // Sprite resolution: tileMeta sprite override wins; otherwise
      // the glyph's default obj. Tiles with neither (walls, empty
      // floor) don't get a PlacedObj.
      const defaultSprite = OBJ_KEY_BY_GLYPH[ch]
      const sprite = meta?.sprite ?? defaultSprite
      if (!sprite) continue
      state.objects.set(key, {
        x, y, ch, sprite,
        flipX: meta?.flipX,
        size: meta?.size,
      })
    }
  }
}

// ===== Rendering =========================================================

const canvas = document.getElementById('map') as HTMLDivElement
const statusLine = document.getElementById('status') as HTMLDivElement
const exportBox = document.getElementById('export') as HTMLTextAreaElement
const palette = document.getElementById('palette') as HTMLDivElement

// Zoom state. 1.0 = base. Clamped [0.5, 3]. Persisted in
// localStorage so reloads keep the user where they were.
const ZOOM_KEY = 'map-editor-zoom-v1'
let zoomLevel = (() => {
  try { return parseFloat(localStorage.getItem(ZOOM_KEY) || '1') || 1 }
  catch { return 1 }
})()
function setZoom(z: number) {
  zoomLevel = Math.max(0.5, Math.min(3, z))
  canvas.style.transform = `scale(${zoomLevel})`
  canvas.style.transformOrigin = '0 0'
  // Resize the wrapper so scrollbars know the new content size — the
  // CSS scale doesn't update layout dimensions.
  const wrapInner = canvas.parentElement
  if (wrapInner) {
    const { width: mw, height: mh } = LEVEL_1_MAP
    wrapInner.style.minWidth = `${mw * TILE * zoomLevel}px`
    wrapInner.style.minHeight = `${mh * TILE * zoomLevel}px`
  }
  try { localStorage.setItem(ZOOM_KEY, String(zoomLevel)) } catch {}
  updateStatus()
}

/** Draw the full map. Recreates DOM each call — small enough (60×72
 *  ≈ 4320 cells, only the few hundred non-floor cells get sprites). */
function render() {
  const { layout, width: mw, height: mh } = LEVEL_1_MAP
  canvas.style.width = `${mw * TILE}px`
  canvas.style.height = `${mh * TILE}px`
  canvas.innerHTML = ''

  // Floor / walls / corridors as colored DIVs.
  for (let y = 0; y < mh; y++) {
    const row = layout[y] || ''
    for (let x = 0; x < mw; x++) {
      const ch = row[x] || '.'
      const cell = document.createElement('div')
      cell.className = 'cell'
      cell.style.left = `${x * TILE}px`
      cell.style.top = `${y * TILE}px`
      cell.style.width = `${TILE}px`
      cell.style.height = `${TILE}px`
      cell.dataset.x = String(x)
      cell.dataset.y = String(y)
      // Color by glyph type — quick visual cue, not pixel-accurate.
      if (ch === 'W') cell.classList.add('wall')
      else if (ch === 'D' || ch === 'L') cell.classList.add('door')
      else cell.classList.add('floor')
      cell.addEventListener('mousedown', onCellMouseDown)
      canvas.appendChild(cell)
    }
  }

  // Object sprites on top.
  for (const [key, obj] of state.objects) {
    if (state.removed.has(key)) continue
    const src = ALL_SPRITES[obj.sprite]
    if (!src) continue
    const img = document.createElement('img')
    img.className = 'obj'
    img.src = `${import.meta.env.BASE_URL}${src}`
    // Bottom-anchored at the tile's bottom edge, scaled by the
    // size multiplier — same anchoring HospitalScene uses so the
    // editor visual matches in-game. `obj.size` defaults to 1.0
    // = 2× tile (the standard "overflows up into tile above" look).
    const sizeMult = obj.size ?? 1
    const dispPx = TILE * 2 * sizeMult
    img.style.left = `${(obj.x + 0.5) * TILE - dispPx / 2}px`
    img.style.top = `${(obj.y + 1) * TILE - dispPx}px`
    img.style.width = `${dispPx}px`
    img.style.height = `${dispPx}px`
    img.dataset.x = String(obj.x)
    img.dataset.y = String(obj.y)
    if (obj.flipX) {
      img.style.transform = 'scaleX(-1)'
      img.style.transformOrigin = '50% 75%'
    }
    if (state.selectedKey === key) img.classList.add('selected')
    img.addEventListener('mousedown', onObjMouseDown)
    canvas.appendChild(img)
  }

  // Selection ring on the underlying tile.
  if (state.selectedKey) {
    const obj = state.objects.get(state.selectedKey)
    if (obj && !state.removed.has(state.selectedKey)) {
      const ring = document.createElement('div')
      ring.className = 'sel-ring'
      ring.style.left = `${obj.x * TILE}px`
      ring.style.top = `${obj.y * TILE}px`
      ring.style.width = `${TILE}px`
      ring.style.height = `${TILE}px`
      canvas.appendChild(ring)
    }
  }

  setZoom(zoomLevel) // re-apply zoom transform after DOM rebuild
  updateStatus()
  updateExport()
}

/** Lookup a sprite key's display label for the status line + palette
 *  tooltips. Falls back to the bare key. */
function spriteLabel(spriteKey: string): string {
  // Try matching glyph label first.
  for (const [g, k] of Object.entries(OBJ_KEY_BY_GLYPH)) {
    if (k === spriteKey) return GLYPH_LABEL[g] || spriteKey
  }
  return spriteKey
}

function updateStatus() {
  const zoomTag = ` · zoom ${(zoomLevel * 100).toFixed(0)}%`
  if (!state.selectedKey) {
    statusLine.textContent =
      'Click an object to select. Drag to move. F flips, +/- resize, ' +
      '0 reset, 1 reset size, Del removes. Click empty floor to add.' +
      zoomTag
    return
  }
  const obj = state.objects.get(state.selectedKey)!
  const label = spriteLabel(obj.sprite)
  const flip = obj.flipX ? ' flipX' : ''
  const sz = obj.size && obj.size !== 1 ? ` size ${obj.size.toFixed(1)}×` : ''
  statusLine.textContent =
    `Selected: ${label} (${obj.sprite}) at (${obj.x},${obj.y})${flip}${sz}${zoomTag}`
}

// ===== Input =============================================================

let pendingPalettePlacement: { x: number; y: number } | null = null
let dragState: { key: string; offsetX: number; offsetY: number } | null = null

function onCellMouseDown(e: MouseEvent) {
  const cell = e.currentTarget as HTMLElement
  const x = Number(cell.dataset.x)
  const y = Number(cell.dataset.y)
  // If user clicks an empty floor tile, open the palette to add an
  // object there. Walls/doors do nothing.
  const layoutCh = LEVEL_1_MAP.layout[y]?.[x] || '.'
  if (layoutCh === 'W' || layoutCh === 'D' || layoutCh === 'L') {
    state.selectedKey = null
    render()
    return
  }
  // Was there already an obj here? Click selects it.
  const key = `${x},${y}`
  if (state.objects.has(key) && !state.removed.has(key)) {
    state.selectedKey = key
    render()
    return
  }
  // Empty floor — show palette and remember target tile.
  pendingPalettePlacement = { x, y }
  showPalette(e.clientX, e.clientY)
}

function onObjMouseDown(e: MouseEvent) {
  e.stopPropagation()
  const img = e.currentTarget as HTMLElement
  const x = Number(img.dataset.x)
  const y = Number(img.dataset.y)
  const key = `${x},${y}`
  state.selectedKey = key
  // Begin drag — record the cursor offset from the tile's pixel
  // origin so the drop-target uses cursor-tile, not click-tile.
  // Account for current zoom on coord conversion.
  const rect = canvas.getBoundingClientRect()
  dragState = {
    key,
    offsetX: (e.clientX - rect.left) / zoomLevel - x * TILE,
    offsetY: (e.clientY - rect.top) / zoomLevel - y * TILE,
  }
  render()
}

window.addEventListener('mousemove', (e) => {
  if (!dragState) return
  const obj = state.objects.get(dragState.key)
  if (!obj) return
  const rect = canvas.getBoundingClientRect()
  // Divide by zoomLevel because canvas is CSS-scaled but coords are
  // in unscaled tile-grid units.
  const tx = Math.floor((e.clientX - rect.left) / zoomLevel / TILE)
  const ty = Math.floor((e.clientY - rect.top) / zoomLevel / TILE)
  if (tx === obj.x && ty === obj.y) return
  // Reject drop targets that aren't passable floor.
  const ch = LEVEL_1_MAP.layout[ty]?.[tx] || '.'
  if (ch === 'W' || ch === 'D' || ch === 'L') return
  // Move it. Update key. The sidecar export will emit the new pos.
  state.objects.delete(dragState.key)
  state.removed.delete(dragState.key)
  const newKey = `${tx},${ty}`
  state.objects.set(newKey, { ...obj, x: tx, y: ty })
  state.selectedKey = newKey
  dragState.key = newKey
  render()
})
window.addEventListener('mouseup', () => {
  dragState = null
})

window.addEventListener('keydown', (e) => {
  // Don't intercept keys when the export textarea is focused — let
  // the user copy / select / type freely.
  if (document.activeElement === exportBox) return

  // Zoom shortcuts work whether or not an object is selected.
  if ((e.key === '=' || e.key === '+') && (e.metaKey || e.ctrlKey)) {
    e.preventDefault(); setZoom(zoomLevel + 0.1); return
  }
  if (e.key === '-' && (e.metaKey || e.ctrlKey)) {
    e.preventDefault(); setZoom(zoomLevel - 0.1); return
  }
  if (e.key === '0' && (e.metaKey || e.ctrlKey)) {
    e.preventDefault(); setZoom(1); return
  }

  if (!state.selectedKey) return
  const obj = state.objects.get(state.selectedKey)
  if (!obj) return
  let dirty = false
  // Resize ([ ] for shrink/grow, plus +/- without modifier).
  if (e.key === ']' || e.key === '+' || (e.key === '=' && !e.shiftKey)) {
    obj.size = Math.min(2.5, (obj.size ?? 1) + 0.1)
    dirty = true
  } else if (e.key === '[' || e.key === '-') {
    obj.size = Math.max(0.4, (obj.size ?? 1) - 0.1)
    dirty = true
  } else if (e.key === '1') {
    obj.size = undefined
    dirty = true
  } else if (e.key === '0') {
    obj.flipX = undefined
    dirty = true
  } else if (e.key === 'f' || e.key === 'F') {
    obj.flipX = !obj.flipX
    dirty = true
  } else if (e.key === 'Delete' || e.key === 'Backspace') {
    state.removed.add(state.selectedKey)
    state.selectedKey = null
    dirty = true
  }
  if (dirty) {
    e.preventDefault()
    render()
  }
})

// Mouse-wheel zoom: only fires when Cmd/Ctrl is held so plain wheel
// keeps scrolling the canvas wrap. Using a small constant per tick.
canvas.addEventListener('wheel', (e) => {
  if (!e.ctrlKey && !e.metaKey) return
  e.preventDefault()
  const delta = e.deltaY > 0 ? -0.1 : 0.1
  setZoom(zoomLevel + delta)
}, { passive: false })

// Toolbar zoom buttons (wired in DOMContentLoaded so the elements
// exist by the time the listener is attached).
document.getElementById('zoom-in')?.addEventListener('click', () => setZoom(zoomLevel + 0.1))
document.getElementById('zoom-out')?.addEventListener('click', () => setZoom(zoomLevel - 0.1))
document.getElementById('zoom-reset')?.addEventListener('click', () => setZoom(1))

// ===== Palette ===========================================================

function showPalette(clientX: number, clientY: number) {
  palette.innerHTML = ''
  palette.style.left = `${clientX + 4}px`
  palette.style.top = `${clientY + 4}px`
  palette.style.display = 'grid'

  // Reverse-lookup so we can show the active glyph alongside each
  // palette cell (when one exists). Inactive textures display as
  // "no glyph" — they'll go through tileMeta.sprite at export time.
  const glyphForKey: Record<string, string> = {}
  for (const [g, k] of Object.entries(OBJ_KEY_BY_GLYPH)) glyphForKey[k] = g

  for (const [spriteKey, src] of Object.entries(ALL_SPRITES).sort()) {
    const cell = document.createElement('div')
    cell.className = 'palette-cell'
    const glyph = glyphForKey[spriteKey]
    cell.title = glyph
      ? `${spriteKey}  (active glyph '${glyph}')`
      : `${spriteKey}  (inactive — placed via tileMeta.sprite)`
    cell.innerHTML =
      `<img src="${import.meta.env.BASE_URL}${src}" />` +
      `<span>${spriteKey.replace(/^h_/, '')}</span>`
    if (!glyph) cell.classList.add('inactive')
    cell.addEventListener('click', () => placeFromPalette(spriteKey))
    palette.appendChild(cell)
  }
}

function placeFromPalette(spriteKey: string) {
  if (!pendingPalettePlacement) return
  const { x, y } = pendingPalettePlacement
  const key = `${x},${y}`
  // Keep the underlying layout glyph (don't change ch). Sprite
  // overrides flow through tileMeta at export time. This is what
  // lets us place inactive textures (no glyph mapping) onto regular
  // floor tiles without polluting the layout grid.
  const layoutCh = LEVEL_1_MAP.layout[y]?.[x] || '.'
  state.objects.set(key, { x, y, ch: layoutCh, sprite: spriteKey })
  state.removed.delete(key)
  state.selectedKey = key
  pendingPalettePlacement = null
  palette.style.display = 'none'
  render()
}

document.addEventListener('mousedown', (e) => {
  if (palette.style.display === 'grid' && !palette.contains(e.target as Node)) {
    palette.style.display = 'none'
    pendingPalettePlacement = null
  }
})

// ===== Export ============================================================

function updateExport() {
  // tileMeta: per-object sprite/size/flipX that differs from the
  // glyph's defaults. We always emit `sprite` for objects whose
  // texture key isn't the default for their underlying glyph — that
  // covers both "user-placed inactive object on floor" and
  // "user remapped a default tile to a different sprite".
  const meta: Record<string, { sprite?: string; size?: number; flipX?: boolean }> = {}
  for (const [key, obj] of state.objects) {
    if (state.removed.has(key)) continue
    const m: { sprite?: string; size?: number; flipX?: boolean } = {}
    const defaultSprite = OBJ_KEY_BY_GLYPH[obj.ch]
    if (obj.sprite && obj.sprite !== defaultSprite) {
      m.sprite = obj.sprite
    }
    if (obj.size !== undefined && obj.size !== 1) {
      m.size = parseFloat(obj.size.toFixed(2))
    }
    if (obj.flipX) m.flipX = true
    if (Object.keys(m).length > 0) meta[key] = m
  }

  // tileOverrides: removals only (clear the default obj layer at
  // those positions). Placements no longer go here — they're all
  // tileMeta.sprite now.
  const overrides: Array<{ x: number; y: number; ch: string }> = []
  for (const key of state.removed) {
    const [xs, ys] = key.split(',')
    overrides.push({ x: Number(xs), y: Number(ys), ch: '' })
  }

  const metaLines = Object.entries(meta).map(([k, v]) => {
    const parts: string[] = []
    if (v.sprite !== undefined) parts.push(`sprite: '${v.sprite}'`)
    if (v.size !== undefined) parts.push(`size: ${v.size}`)
    if (v.flipX) parts.push('flipX: true')
    return `    '${k}': { ${parts.join(', ')} },`
  })
  const overrideLines = overrides.map(o =>
    `    { x: ${o.x}, y: ${o.y}, ch: '${o.ch.replace(/'/g, "\\'")}' },`
  )

  exportBox.value =
`// Paste these two blocks into src/content/maps/level1.ts.
//
// 1. Replace LEVEL_1_MAP.tileMeta with this object (or merge if
//    you also have build-time meta from RoomItem fields):

tileMeta: {
${metaLines.join('\n')}
},

// 2. Removals (only emitted when something was deleted): use
//    applyTileOverrides to clear those tiles' default obj layer.

import { applyTileOverrides } from '../mapBuilder'

const tileOverrides = [
${overrideLines.join('\n')}
]

// then inside LEVEL_1_MAP, replace \`layout,\` with:
//   layout: applyTileOverrides(layout, tileOverrides),
`
}

// ===== Boot ==============================================================

bootstrap()
render()
setZoom(zoomLevel) // restore persisted zoom on first render
