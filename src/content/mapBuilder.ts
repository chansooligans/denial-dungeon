// Map types and structured map builder.

/** Per-tile object overrides keyed by `"x,y"` (world coords).
 *  Authors place items by character glyph and the renderer picks a
 *  default texture per glyph; this sidecar lets specific tiles
 *  override the sprite, scale, or mirror it horizontally — without
 *  changing the underlying layout grid.
 *
 *  Built either by `buildMapLayout` (lifting per-item fields from
 *  `RoomItem`) or pasted in by hand from `/map-editor.html`.
 *
 *  Fields:
 *    - `sprite` — texture key to render INSTEAD of the glyph's
 *      default. Lets you place objects whose texture key isn't yet
 *      reachable from any glyph in `TILE_TEXTURES` (e.g. a future-
 *      tier h_pneumatic on a regular floor tile). The tile's floor
 *      still comes from its glyph; only the obj layer is swapped.
 *    - `size` — display-size multiplier. Default 1.0 (= 2× tile,
 *      the standard "object overflows up into the tile above" look).
 *      0.5 makes a half-size sprite, 1.5 a hero-size piece.
 *    - `flipX` — horizontal mirror, for facing a side-view sprite
 *      the other direction without authoring a new variant.
 *
 *  Rotation isn't supported — CSS-rotating isometric sprites
 *  distorts their perspective. Author rotated variants in source
 *  art instead. */
export type TileMeta = Record<string, {
  flipX?: boolean
  sprite?: string
  size?: number
}>

export interface MapDef {
  width: number
  height: number
  layout: string[]
  /** Optional per-tile orientation overrides — `undefined` means
   *  every object renders at its authored 0° angle (current default). */
  tileMeta?: TileMeta
  playerStart: { x: number; y: number }
  /** NPC placements. Each placement is a single position; if the same
   *  NPC needs to be in different rooms across levels, supply multiple
   *  placements with `levels` filters set so only the relevant one
   *  spawns. Placements without `levels` apply to every level. */
  npcPlacements: {
    npcId: string
    tileX: number
    tileY: number
    /** If set, this placement is only used when `currentLevel` is in the list. */
    levels?: number[]
    /** Ambient NPCs (background populace — janitors, visitors, etc.)
     *  bypass the per-level `npcsActive` filter and appear regardless
     *  of which level the player is on. Story-relevant NPCs leave
     *  this unset so they're gated by `npcsActive`. */
    ambient?: boolean
  }[]
  /** Optional room labels for the minimap. Drawn at the room center
   *  when at least one tile of the room has been seen.
   *  - `name` is the full label, shown when the minimap is expanded.
   *  - `shortName` (optional) is the compact abbreviation shown by
   *    default. If omitted, the full name is used in both states. */
  rooms?: { name: string; shortName?: string; x: number; y: number; w: number; h: number }[]
  /** Optional teleport pairs. When the player ends a move on a `from`
   *  tile, the scene fades and snaps them to the corresponding `to`
   *  tile. Symmetric — each entry is one-way; pair them up in source
   *  for round-trips. Used for stairs (between floors) and exits
   *  (lobby ↔ outdoor parking lot) so we can keep one big tilemap
   *  instead of juggling separate scenes per area.
   *  `label` is rendered as a floating text widget over the source
   *  tile so the player knows where it leads ("↑ 2F", "EXIT"). */
  stairs?: { from: { x: number; y: number }; to: { x: number; y: number }; label?: string }[]
}

// ---------------------------------------------------------------------------
// Structured map builder.
//
// Hand-authoring large ASCII maps in a single file made `Edit` operations
// fragile (many near-identical rows, easy to mis-match). This builder lets
// each level describe its rooms and corridors as data, and compiles them
// down to the same string[] layout the renderer already consumes.
//
// The builder produces only the tile grid. The surrounding `MapDef`
// (playerStart, gapTile, npcPlacements) is still authored alongside.

export interface DoorDef {
  side: 'N' | 'S' | 'E' | 'W'
  /**
   * Offset along that side, measured from the room's top or left wall
   * (inclusive of the corner walls). For a 12-wide room with door on
   * the south side, valid offsets are 1..10 (offset 0 / 11 are corners).
   */
  offset: number
  locked?: boolean
}

export interface RoomItem {
  /** Position relative to the room's INTERIOR top-left (i.e. inside walls). */
  dx: number
  dy: number
  ch: string
  /** Optional horizontal mirror — easiest way to make a side-facing
   *  desk face the opposite direction without authoring new art. For
   *  any other re-orientation, author a new sprite variant rather
   *  than CSS-rotating at render time (rotation distorted the
   *  isometric perspective). */
  flipX?: boolean
  /** Optional sprite-key override — render this specific texture
   *  here instead of the glyph's default obj. Use to place objects
   *  whose texture key isn't yet bound to a glyph in `TILE_TEXTURES`
   *  (e.g. an inactive h_pneumatic placed on a plain floor tile). */
  sprite?: string
  /** Optional display-size multiplier (default 1.0 = 2 tiles tall,
   *  the standard look). Useful for highlighting a hero object or
   *  shrinking a detail prop. */
  size?: number
}

export interface RoomDef {
  /** Optional id, useful when one room references another (sub-rooms). */
  id?: string
  /** Top-left corner of the room (inclusive of the wall). */
  x: number
  y: number
  /** Outer dimensions, walls included. Minimum 3×3 for a usable interior. */
  w: number
  h: number
  doors?: DoorDef[]
  /** Interior tile fill. Defaults to '.' (floor). */
  fill?: string
  /** Decorations placed inside the room interior. */
  items?: RoomItem[]
}

/**
 * A corridor as a polyline of axis-aligned segments. Each segment runs from
 * one point to the next; bends create L-shaped or zig-zag corridors. The
 * corridor is `width` tiles wide; default 1.
 */
export interface CorridorDef {
  points: [number, number][]
  width?: number
  fill?: string
}

export interface MapSpec {
  width: number
  height: number
  /** Background fill for any tile not part of a room or corridor. Default 'W' (wall). */
  background?: string
  rooms: RoomDef[]
  corridors?: CorridorDef[]
}

/**
 * Compile a structured map spec into a string[] tile layout.
 *
 * Order of operations:
 *   1. Fill grid with background (default 'W' — solid wall).
 *   2. Carve corridors as floor.
 *   3. Stamp rooms: outer ring of 'W', interior filled.
 *   4. Punch doors through room walls.
 *   5. Stamp room items inside interiors.
 *   6. Force the outermost map border to 'W'.
 */
export function buildMapLayout(spec: MapSpec): string[] {
  return buildMap(spec).layout
}

/**
 * Like `buildMapLayout` but also returns the per-tile orientation
 * sidecar lifted from any `rot` / `flipX` fields on `RoomItem`. Use
 * this when the level needs rotated objects; legacy levels can keep
 * calling `buildMapLayout` and ignore the meta.
 */
export function buildMap(spec: MapSpec): { layout: string[]; tileMeta: TileMeta } {
  const { width, height } = spec
  const bg = spec.background ?? 'W'
  const grid: string[][] = []
  for (let y = 0; y < height; y++) {
    grid.push(new Array(width).fill(bg))
  }
  const tileMeta: TileMeta = {}

  // 2. Carve corridors
  for (const c of spec.corridors ?? []) {
    carveCorridor(grid, c, width, height)
  }

  // 3-5. Stamp rooms
  for (const r of spec.rooms) {
    stampRoom(grid, r, width, height, tileMeta)
  }

  // 6. Outer border
  for (let x = 0; x < width; x++) {
    grid[0][x] = 'W'
    grid[height - 1][x] = 'W'
  }
  for (let y = 0; y < height; y++) {
    grid[y][0] = 'W'
    grid[y][width - 1] = 'W'
  }

  return { layout: grid.map(row => row.join('')), tileMeta }
}

function carveCorridor(
  grid: string[][],
  c: CorridorDef,
  width: number,
  height: number
) {
  const w = Math.max(1, c.width ?? 1)
  const f = c.fill ?? '.'
  for (let i = 0; i < c.points.length - 1; i++) {
    const [x1, y1] = c.points[i]
    const [x2, y2] = c.points[i + 1]
    if (x1 !== x2 && y1 !== y2) {
      throw new Error(
        `Corridor segment ${i} is not axis-aligned: (${x1},${y1}) → (${x2},${y2})`
      )
    }
    const dx = Math.sign(x2 - x1)
    const dy = Math.sign(y2 - y1)
    let cx = x1
    let cy = y1
    while (true) {
      for (let oy = 0; oy < w; oy++) {
        for (let ox = 0; ox < w; ox++) {
          const px = cx + ox
          const py = cy + oy
          if (px >= 0 && px < width && py >= 0 && py < height) {
            grid[py][px] = f
          }
        }
      }
      if (cx === x2 && cy === y2) break
      cx += dx
      cy += dy
    }
  }
}

function stampRoom(
  grid: string[][],
  r: RoomDef,
  width: number,
  height: number,
  tileMeta: TileMeta
) {
  if (r.w < 3 || r.h < 3) {
    throw new Error(`Room ${r.id ?? '?'} too small (${r.w}×${r.h}); need 3×3 minimum`)
  }
  const fill = r.fill ?? '.'
  for (let yy = 0; yy < r.h; yy++) {
    for (let xx = 0; xx < r.w; xx++) {
      const px = r.x + xx
      const py = r.y + yy
      if (px < 0 || px >= width || py < 0 || py >= height) continue
      const onEdge = yy === 0 || yy === r.h - 1 || xx === 0 || xx === r.w - 1
      grid[py][px] = onEdge ? 'W' : fill
    }
  }
  for (const d of r.doors ?? []) {
    const [dx, dy] = doorWorldPos(r, d)
    if (dx >= 0 && dx < width && dy >= 0 && dy < height) {
      grid[dy][dx] = d.locked ? 'L' : 'D'
    }
  }
  for (const item of r.items ?? []) {
    const ix = r.x + 1 + item.dx
    const iy = r.y + 1 + item.dy
    if (ix > r.x && ix < r.x + r.w - 1 && iy > r.y && iy < r.y + r.h - 1) {
      grid[iy][ix] = item.ch
      // Lift any per-item visual overrides into the world-coord
      // tileMeta sidecar so they survive the buildMap → render hop.
      if (item.flipX !== undefined || item.sprite !== undefined || item.size !== undefined) {
        const m: { flipX?: boolean; sprite?: string; size?: number } = {}
        if (item.flipX !== undefined) m.flipX = item.flipX
        if (item.sprite !== undefined) m.sprite = item.sprite
        if (item.size !== undefined) m.size = item.size
        tileMeta[`${ix},${iy}`] = m
      }
    }
  }
}

/**
 * Apply post-build tile overrides emitted by `/map-editor.html`.
 * Each entry sets the glyph at `(x, y)`; an empty `ch` reverts the
 * tile to plain floor (`.`). Useful for visually moved/added/removed
 * objects whose changes don't fit neatly back into a room's items[]
 * (e.g. moved a chair across a corridor, added a kiosk to a hallway).
 */
export function applyTileOverrides(
  layout: string[],
  overrides: Array<{ x: number; y: number; ch: string }>
): string[] {
  if (overrides.length === 0) return layout
  const grid = layout.map(row => row.split(''))
  for (const o of overrides) {
    if (o.y < 0 || o.y >= grid.length) continue
    if (o.x < 0 || o.x >= grid[o.y].length) continue
    grid[o.y][o.x] = o.ch === '' ? '.' : o.ch
  }
  return grid.map(row => row.join(''))
}

function doorWorldPos(r: RoomDef, d: DoorDef): [number, number] {
  switch (d.side) {
    case 'N': return [r.x + d.offset, r.y]
    case 'S': return [r.x + d.offset, r.y + r.h - 1]
    case 'W': return [r.x, r.y + d.offset]
    case 'E': return [r.x + r.w - 1, r.y + d.offset]
  }
}
