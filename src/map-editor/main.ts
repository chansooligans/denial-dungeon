// Map editor — view & tweak object placement / orientation for level1.
//
// What this tool is:
//   - A standalone Vite page (mounted at /map-editor.html) that loads
//     the live LEVEL_1_MAP and renders a top-down view of every tile.
//   - Each object tile draws the actual sprite PNG, flipped exactly
//     as it would appear in HospitalScene.
//   - You can click any object to select it, flip it horizontally
//     (F), drag it to a new tile, or delete it (Del).
//   - The right panel shows a "paste-back" snippet of `tileMeta` and
//     `tileOverrides` — copy that back into level1.ts to commit the
//     edits.
//
// Why a separate tool:
//   The room-relative items[] arrays in level1.ts work great for
//   describing the rough layout, but tweaking individual placements
//   visually is awkward in code. This editor lets you do it on the
//   rendered map and outputs a sidecar that the renderer applies on
//   top of the procedural layout.
//
// Note on rotation: an earlier version of this editor exposed
// rotation controls (Q/E/R) but rotating isometric-perspective
// sprites distorted their look. Rotation was removed; if you need a
// piece facing a different direction, author a rotated variant in
// the source art instead.
//
// Output sidecars (round-trip into level1.ts):
//   - tileMeta:      Record<"x,y", {flipX?: boolean}>
//                    Already wired into MapDef. Drives setFlipX in
//                    HospitalScene + WaitingRoomScene.
//   - tileOverrides: Array<{x, y, ch}> — "place glyph ch at world
//                    (x,y), replacing whatever glyph was there."
//                    Empty `ch` means "remove the object, keep
//                    floor." Applied in level1.ts after buildMap()
//                    via applyTileOverrides() — see the helper at
//                    the bottom of mapBuilder.ts.

import { LEVEL_1_MAP } from '../content/maps/level1'
import {
  GLYPH_TO_OBJ_KEY,
  OBJ_KEY_TO_SRC,
  GLYPH_LABEL,
} from './data'

const TILE = 24 // CSS px per tile in the editor view

interface PlacedObj {
  x: number
  y: number
  /** Original glyph from the layout — we never mutate it; placement
   *  changes go into the `tileOverrides` sidecar instead so we can
   *  emit a clean diff at export time. */
  ch: string
  flipX?: boolean
}

interface EditorState {
  /** All rendered objects keyed by `"x,y"` — both layout-derived
   *  and freshly-added via the palette. */
  objects: Map<string, PlacedObj>
  /** Tiles whose object has been removed by the user (so the export
   *  can emit `{ ch: '' }` overrides for them). */
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
 *  previous flips). */
function bootstrap() {
  const { layout, width: mw, height: mh, tileMeta } = LEVEL_1_MAP
  for (let y = 0; y < mh; y++) {
    const row = layout[y] || ''
    for (let x = 0; x < mw; x++) {
      const ch = row[x]
      if (!ch || !(ch in GLYPH_TO_OBJ_KEY)) continue
      const key = `${x},${y}`
      const meta = tileMeta?.[key]
      state.objects.set(key, { x, y, ch, flipX: meta?.flipX })
    }
  }
}

// ===== Rendering =========================================================

const canvas = document.getElementById('map') as HTMLDivElement
const statusLine = document.getElementById('status') as HTMLDivElement
const exportBox = document.getElementById('export') as HTMLTextAreaElement
const palette = document.getElementById('palette') as HTMLDivElement

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
    const src = OBJ_KEY_TO_SRC[GLYPH_TO_OBJ_KEY[obj.ch] || ''] || ''
    const img = document.createElement('img')
    img.className = 'obj'
    img.src = `${import.meta.env.BASE_URL}${src}`
    // Bottom-anchored at the tile's bottom edge, 2× tile-size — same
    // anchoring HospitalScene uses so the editor visual matches in-game.
    img.style.left = `${obj.x * TILE - TILE / 2}px`
    img.style.top = `${(obj.y + 1) * TILE - TILE * 2}px`
    img.style.width = `${TILE * 2}px`
    img.style.height = `${TILE * 2}px`
    img.dataset.x = String(obj.x)
    img.dataset.y = String(obj.y)
    if (obj.flipX) {
      img.style.transform = 'scaleX(-1)'
      img.style.transformOrigin = '50% 75%' // approximately the bottom-anchor
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

  updateStatus()
  updateExport()
}

function updateStatus() {
  if (!state.selectedKey) {
    statusLine.textContent = 'Click an object to select. Drag to move. F flips, 0 clears, Del removes. Click empty floor + palette to add.'
    return
  }
  const obj = state.objects.get(state.selectedKey)!
  const label = GLYPH_LABEL[obj.ch] || obj.ch
  const flip = obj.flipX ? ' (flipX)' : ''
  statusLine.textContent = `Selected: ${label} '${obj.ch}' at (${obj.x},${obj.y})${flip}`
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
  dragState = {
    key,
    offsetX: e.clientX - canvas.getBoundingClientRect().left - x * TILE,
    offsetY: e.clientY - canvas.getBoundingClientRect().top - y * TILE,
  }
  render()
}

window.addEventListener('mousemove', (e) => {
  if (!dragState) return
  // Live drag preview — translate the selected sprite to the cursor.
  const obj = state.objects.get(dragState.key)
  if (!obj) return
  const rect = canvas.getBoundingClientRect()
  const tx = Math.floor((e.clientX - rect.left) / TILE)
  const ty = Math.floor((e.clientY - rect.top) / TILE)
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
  if (!state.selectedKey) return
  const obj = state.objects.get(state.selectedKey)
  if (!obj) return
  let dirty = false
  if (e.key === '0') { obj.flipX = undefined; dirty = true }
  else if (e.key === 'f' || e.key === 'F') { obj.flipX = !obj.flipX; dirty = true }
  else if (e.key === 'Delete' || e.key === 'Backspace') {
    state.removed.add(state.selectedKey)
    state.selectedKey = null
    dirty = true
  }
  if (dirty) {
    e.preventDefault()
    render()
  }
})

// ===== Palette ===========================================================

function showPalette(clientX: number, clientY: number) {
  palette.innerHTML = ''
  palette.style.left = `${clientX + 4}px`
  palette.style.top = `${clientY + 4}px`
  palette.style.display = 'grid'
  for (const [glyph, key] of Object.entries(GLYPH_TO_OBJ_KEY)) {
    const src = OBJ_KEY_TO_SRC[key]
    if (!src) continue
    const cell = document.createElement('div')
    cell.className = 'palette-cell'
    cell.title = `${GLYPH_LABEL[glyph] || glyph} ('${glyph}')`
    cell.innerHTML = `<img src="${import.meta.env.BASE_URL}${src}" /><span>${glyph}</span>`
    cell.addEventListener('click', () => placeFromPalette(glyph))
    palette.appendChild(cell)
  }
}

function placeFromPalette(glyph: string) {
  if (!pendingPalettePlacement) return
  const { x, y } = pendingPalettePlacement
  const key = `${x},${y}`
  state.objects.set(key, { x, y, ch: glyph })
  state.removed.delete(key)
  state.selectedKey = key
  pendingPalettePlacement = null
  palette.style.display = 'none'
  render()
}

document.addEventListener('mousedown', (e) => {
  // Click outside the palette closes it.
  if (palette.style.display === 'grid' && !palette.contains(e.target as Node)) {
    palette.style.display = 'none'
    pendingPalettePlacement = null
  }
})

// ===== Export ============================================================

function updateExport() {
  // tileMeta: only objects whose flipX differs from default.
  const meta: Record<string, { flipX?: boolean }> = {}
  for (const [key, obj] of state.objects) {
    if (state.removed.has(key)) continue
    if (obj.flipX) meta[key] = { flipX: true }
  }

  // tileOverrides: positional changes vs the layout from buildMap.
  // For each obj in state.objects, compare against LEVEL_1_MAP.layout
  // to detect new placements; for each removed key, emit an empty ch.
  const overrides: Array<{ x: number; y: number; ch: string }> = []
  for (const [key, obj] of state.objects) {
    if (state.removed.has(key)) continue
    const layoutCh = LEVEL_1_MAP.layout[obj.y]?.[obj.x] || '.'
    if (layoutCh !== obj.ch) {
      overrides.push({ x: obj.x, y: obj.y, ch: obj.ch })
    }
  }
  for (const key of state.removed) {
    const [xs, ys] = key.split(',')
    overrides.push({ x: Number(xs), y: Number(ys), ch: '' })
  }

  const metaLines = Object.entries(meta).map(([k, v]) => {
    const parts: string[] = []
    if (v.flipX) parts.push('flipX: true')
    return `    '${k}': { ${parts.join(', ')} },`
  })
  const overrideLines = overrides.map(o =>
    `    { x: ${o.x}, y: ${o.y}, ch: '${o.ch.replace(/'/g, "\\'")}' },`
  )

  exportBox.value =
`// Paste these two blocks into src/content/maps/level1.ts.
//
// 1. Add to MapDef alongside the existing \`tileMeta\` field
//    (replaces the auto-generated meta from buildMap):

tileMeta: {
${metaLines.join('\n')}
},

// 2. Add tileOverrides + the helper call from mapBuilder:

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
