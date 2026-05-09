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
  KEY_TO_COLOR_CSS,
  DEFAULT_OBJECT_COLOR_CSS,
  GLYPH_LABEL,
} from './data'
import { NPC_SOURCES } from '../scenes/npcSources'

const TILE = 24 // CSS px per tile in the editor view at zoom 1.0

// Per-page-load cache buster for sprite URLs — appended as `?v=N`
// so the browser reloads NPC sprites every editor open. Without
// this, freshly-cleaned PNGs from a process-npc-sheets.sh run
// keep their old cached versions until a manual hard-refresh.
const SESSION_CACHE_BUST = Date.now()

// Match HospitalScene.OBJECT_DISPLAY_MULT — keeps the editor's
// box-sizing aligned with the in-game render. Bump in lockstep
// with the scene constants if the visual budget changes.
const OBJECT_DISPLAY_MULT = 1.5

// All texture keys the editor can place. Procedural era — there are
// no sprite PNGs; every entry in KEY_TO_COLOR_CSS renders as a
// tinted box. Build the palette from this lookup so glyph-mapped
// keys + any extras with a fallback color are all available.
const ALL_KEYS: string[] = Object.keys(KEY_TO_COLOR_CSS)

// Reverse of GLYPH_TO_OBJ_KEY — used at bootstrap to derive each
// existing tile's default sprite from its layout glyph.
const OBJ_KEY_BY_GLYPH = GLYPH_TO_OBJ_KEY

/** CSS color for a texture key, with sensible default for unknowns. */
function colorForKey(key: string): string {
  return KEY_TO_COLOR_CSS[key] ?? DEFAULT_OBJECT_COLOR_CSS
}

/** Glyph that maps to this texture key, or undefined if it's a
 *  no-glyph (would-be-inactive) key. */
function glyphForKey(key: string): string | undefined {
  for (const [g, k] of Object.entries(OBJ_KEY_BY_GLYPH)) if (k === key) return g
  return undefined
}

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

interface PlacedNpc {
  /** Stable id used as the editor's selection key — `npc:<index>`
   *  where index is the position in the original npcPlacements
   *  array. NPCs sometimes co-locate (e.g. two NPCs on the same
   *  bench) so we can't key by tile position. */
  id: string
  /** Index in the original npcPlacements array. Drives export
   *  ordering so paste-back doesn't reshuffle. */
  origIndex: number
  npcId: string
  x: number
  y: number
  /** Pass-through fields from npcPlacements — preserved on export. */
  levels?: number[]
  ambient?: boolean
  /** Resolved sprite slot from NPC_SOURCES (e.g. 'npc7_0'). When
   *  present, the editor renders the actual PNG at
   *  `/sprites/npcs-raw/{slot}_0.png`. Missing → placeholder dot. */
  spriteSlot?: string
}

interface EditorState {
  /** All rendered objects keyed by `"x,y"` — both layout-derived
   *  and freshly-added via the palette. */
  objects: Map<string, PlacedObj>
  /** Tiles whose default obj has been removed by the user. Emit as
   *  tileOverrides ch:'' so the running game clears the default. */
  removed: Set<string>
  /** All NPC placements, keyed by their stable `id`. */
  npcs: Map<string, PlacedNpc>
  /** Selected object key (`"x,y"`) OR npc key (`npc:<n>`), if any. */
  selectedKey: string | null
}

const state: EditorState = {
  objects: new Map(),
  removed: new Set(),
  npcs: new Map(),
  selectedKey: null,
}

/** Distinguish object tile-keys ("12,34") from NPC keys ("npc:5"). */
function isNpcKey(key: string): boolean {
  return key.startsWith('npc:')
}

/** Load the layout into state.objects, applying any tileMeta from
 *  level1.ts so we open the editor mid-edit-friendly (you see your
 *  previous flips, sprite overrides, and resizes). */
function bootstrap() {
  const { layout, width: mw, height: mh, tileMeta, npcPlacements } = LEVEL_1_MAP
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
  // NPC placements — keyed by `npc:<origIndex>` so co-located NPCs
  // don't collide on a tile-position key.
  for (let i = 0; i < npcPlacements.length; i++) {
    const p = npcPlacements[i]
    const id = `npc:${i}`
    state.npcs.set(id, {
      id,
      origIndex: i,
      npcId: p.npcId,
      x: p.tileX,
      y: p.tileY,
      levels: p.levels,
      ambient: p.ambient,
      spriteSlot: NPC_SOURCES[p.npcId],
    })
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

  // Object boxes on top. Procedural era — every object renders as
  // a tinted CSS div with the glyph centered (or '·' for no-glyph
  // keys). Same bottom-anchored geometry HospitalScene uses, so the
  // editor's drag/drop math + the in-game placement match exactly.
  for (const [key, obj] of state.objects) {
    if (state.removed.has(key)) continue
    const sizeMult = obj.size ?? 1
    const dispPx = TILE * OBJECT_DISPLAY_MULT * sizeMult
    const box = document.createElement('div')
    box.className = 'obj'
    box.style.left = `${(obj.x + 0.5) * TILE - dispPx / 2}px`
    box.style.top = `${(obj.y + 1) * TILE - dispPx}px`
    box.style.width = `${dispPx}px`
    box.style.height = `${dispPx}px`
    box.style.background = colorForKey(obj.sprite)
    // Inset to mirror the procedural draw's 12×12 inner box vs the
    // 16×16 cell — gives a small frame on each side so adjacent
    // objects don't visually merge.
    box.style.border = '2px solid rgba(0,0,0,0.55)'
    box.style.boxSizing = 'border-box'
    // Glyph in the center — clarifies what this is at a glance.
    box.textContent = glyphForKey(obj.sprite) ?? '·'
    box.dataset.x = String(obj.x)
    box.dataset.y = String(obj.y)
    if (obj.flipX) {
      box.style.transform = 'scaleX(-1)'
      box.style.transformOrigin = '50% 75%'
    }
    if (state.selectedKey === key) box.classList.add('selected')
    box.addEventListener('mousedown', onObjMouseDown)
    canvas.appendChild(box)
  }

  // NPCs on top of objects. Render the actual sprite PNG when
  // NPC_SOURCES has a slot for them (most cast NPCs do); otherwise
  // a placeholder badge. Smaller than objects (1-tile sprites
  // anchored bottom-center) since NPCs in-game don't tower over
  // furniture.
  for (const npc of state.npcs.values()) {
    const dispPx = TILE * 1.4
    const div = document.createElement('div')
    div.className = 'npc'
    div.style.position = 'absolute'
    div.style.left = `${(npc.x + 0.5) * TILE - dispPx / 2}px`
    div.style.top = `${(npc.y + 1) * TILE - dispPx}px`
    div.style.width = `${dispPx}px`
    div.style.height = `${dispPx}px`
    div.style.cursor = 'grab'
    div.style.userSelect = 'none'
    div.style.imageRendering = 'pixelated'
    div.dataset.npcKey = npc.id
    if (npc.spriteSlot) {
      const img = document.createElement('img')
      // Cache-bust per editor session so re-running the cleanup
      // pipeline (process-npc-sheets.sh) shows up on next reload
      // without a manual hard-refresh. Hashed against the page-
      // load timestamp so the same session reuses the cache.
      img.src = `/sprites/npcs-raw/${npc.spriteSlot}_0.png?v=${SESSION_CACHE_BUST}`
      img.style.width = '100%'
      img.style.height = '100%'
      img.style.imageRendering = 'pixelated'
      img.style.pointerEvents = 'none'
      div.appendChild(img)
    } else {
      div.textContent = npc.npcId.slice(0, 2).toUpperCase()
      div.style.background = '#7ee2c1'
      div.style.color = '#0a0e14'
      div.style.fontWeight = 'bold'
      div.style.display = 'flex'
      div.style.alignItems = 'center'
      div.style.justifyContent = 'center'
      div.style.fontSize = '11px'
      div.style.borderRadius = '3px'
    }
    if (state.selectedKey === npc.id) {
      div.style.filter = 'drop-shadow(0 0 4px #7ee2c1) brightness(1.2)'
    }
    div.addEventListener('mousedown', onNpcMouseDown)
    canvas.appendChild(div)
  }

  // Selection ring on the underlying tile (works for both objects
  // and NPCs).
  if (state.selectedKey) {
    let sx: number | null = null, sy: number | null = null
    if (isNpcKey(state.selectedKey)) {
      const npc = state.npcs.get(state.selectedKey)
      if (npc) { sx = npc.x; sy = npc.y }
    } else {
      const obj = state.objects.get(state.selectedKey)
      if (obj && !state.removed.has(state.selectedKey)) {
        sx = obj.x; sy = obj.y
      }
    }
    if (sx !== null && sy !== null) {
      const ring = document.createElement('div')
      ring.className = 'sel-ring'
      // Green ring for NPCs to distinguish from object selection.
      if (isNpcKey(state.selectedKey)) {
        ring.style.border = '2px solid #7ee2c1'
      }
      ring.style.left = `${sx * TILE}px`
      ring.style.top = `${sy * TILE}px`
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
      'Click an object/NPC to select. Drag to move. F flips, +/- resize, ' +
      '0 reset, 1 reset size, Del removes (object only). Click empty floor to add.' +
      zoomTag
    return
  }
  if (isNpcKey(state.selectedKey)) {
    const npc = state.npcs.get(state.selectedKey)!
    const lvls = npc.levels ? ` · levels [${npc.levels.join(',')}]` : ' · all levels'
    const amb = npc.ambient ? ' · ambient' : ''
    const slot = npc.spriteSlot ? ` (${npc.spriteSlot})` : ' (no sprite)'
    statusLine.textContent =
      `NPC: ${npc.npcId}${slot} at (${npc.x},${npc.y})${lvls}${amb}${zoomTag}`
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

function onNpcMouseDown(e: MouseEvent) {
  e.stopPropagation()
  const div = e.currentTarget as HTMLElement
  const key = div.dataset.npcKey!
  const npc = state.npcs.get(key)
  if (!npc) return
  state.selectedKey = key
  const rect = canvas.getBoundingClientRect()
  dragState = {
    key,
    offsetX: (e.clientX - rect.left) / zoomLevel - npc.x * TILE,
    offsetY: (e.clientY - rect.top) / zoomLevel - npc.y * TILE,
  }
  render()
}

window.addEventListener('mousemove', (e) => {
  if (!dragState) return
  const rect = canvas.getBoundingClientRect()
  const tx = Math.floor((e.clientX - rect.left) / zoomLevel / TILE)
  const ty = Math.floor((e.clientY - rect.top) / zoomLevel / TILE)
  // Reject drop targets that aren't passable floor.
  const ch = LEVEL_1_MAP.layout[ty]?.[tx] || '.'
  if (ch === 'W' || ch === 'D' || ch === 'L') return

  if (isNpcKey(dragState.key)) {
    const npc = state.npcs.get(dragState.key)
    if (!npc) return
    if (tx === npc.x && ty === npc.y) return
    npc.x = tx
    npc.y = ty
    render()
    return
  }
  // Object drag (existing behavior).
  const obj = state.objects.get(dragState.key)
  if (!obj) return
  if (tx === obj.x && ty === obj.y) return
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
  // Object-only keyboard verbs (resize / flip / delete). NPCs only
  // support drag in this MVP; their `levels` filter and `ambient`
  // flag belong with the in-code design pass, not the map editor.
  if (isNpcKey(state.selectedKey)) return
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

  for (const spriteKey of [...ALL_KEYS].sort()) {
    const cell = document.createElement('div')
    cell.className = 'palette-cell'
    const glyph = glyphForKey(spriteKey)
    cell.title = glyph
      ? `${spriteKey}  (active glyph '${glyph}')`
      : `${spriteKey}  (inactive — placed via tileMeta.sprite)`
    // Procedural-era palette: each cell is a tinted box matching
    // what the canvas + the in-game render show.
    const swatch = document.createElement('div')
    swatch.style.width = '32px'
    swatch.style.height = '32px'
    swatch.style.background = colorForKey(spriteKey)
    swatch.style.border = '2px solid rgba(0,0,0,0.55)'
    swatch.style.boxSizing = 'border-box'
    swatch.style.display = 'flex'
    swatch.style.alignItems = 'center'
    swatch.style.justifyContent = 'center'
    swatch.style.color = '#fff'
    swatch.style.fontSize = '14px'
    swatch.textContent = glyph ?? '·'
    cell.appendChild(swatch)
    const label = document.createElement('span')
    label.textContent = spriteKey.replace(/^h_/, '')
    cell.appendChild(label)
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

  // npcPlacements block — emitted only when at least one NPC has
  // moved from its original tile. Preserves levels / ambient and
  // original ordering. The output is the FULL replacement array;
  // paste it over LEVEL_1_MAP.npcPlacements wholesale.
  const orig = LEVEL_1_MAP.npcPlacements
  const movedNpcs: PlacedNpc[] = []
  for (const npc of state.npcs.values()) {
    const o = orig[npc.origIndex]
    if (!o) continue
    if (npc.x !== o.tileX || npc.y !== o.tileY) movedNpcs.push(npc)
  }
  const sortedNpcs = [...state.npcs.values()].sort((a, b) => a.origIndex - b.origIndex)
  const npcLines = sortedNpcs.map(n => {
    const parts = [`npcId: '${n.npcId}'`, `tileX: ${n.x}`, `tileY: ${n.y}`]
    if (n.levels) parts.push(`levels: [${n.levels.join(', ')}]`)
    if (n.ambient) parts.push(`ambient: true`)
    return `    { ${parts.join(', ')} },`
  })

  const npcBlock = movedNpcs.length === 0
    ? '// (no NPCs moved — npcPlacements unchanged)'
    : `// 3. NPC placements — ${movedNpcs.length} moved. Replace
//    LEVEL_1_MAP.npcPlacements with the full block below. Note that
//    this output strips the const-reference shorthand (LOBBY.x + 10
//    → 14); reapply by hand if you want the source-readable form.

npcPlacements: [
${npcLines.join('\n')}
],`

  exportBox.value =
`// Paste these blocks into src/content/maps/level1.ts.
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

${npcBlock}
`
}

// ===== Boot ==============================================================

bootstrap()
render()
setZoom(zoomLevel) // restore persisted zoom on first render
