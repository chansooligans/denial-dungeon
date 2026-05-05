// Public map API. Per-level layouts now live in ./maps/levelN.ts; the
// builder + types live in ./mapBuilder.ts. Edits target small files
// instead of one giant ASCII grid, so Edit-tool collisions are rare.
//
// Tile legend:
//   W = wall, D = door, L = locked door, . = floor, ~ = floor variant,
//   _ = carpet, c = desk, h = chair, E = equipment, P = plant,
//   w = water cooler, F = filing cabinet, B = whiteboard,
//   R = reception counter, V = vending, b = bulletin, H = bed, X = fax

import { type MapDef } from './mapBuilder'
import { LEVEL_1_MAP } from './maps/level1'
import { LEVEL_2_MAP } from './maps/level2'
import { LEVEL_3_MAP } from './maps/level3'
import { LEVEL_4_MAP } from './maps/level4'
import { LEVEL_5_MAP } from './maps/level5'

export type { MapDef }

export const HOSPITAL_MAPS: MapDef[] = [
  LEVEL_1_MAP,
  LEVEL_2_MAP,
  LEVEL_3_MAP,
  LEVEL_4_MAP,
  LEVEL_5_MAP,
]

export function getMapForLevel(level: number): MapDef {
  const idx = Math.min(level - 1, HOSPITAL_MAPS.length - 1)
  return HOSPITAL_MAPS[Math.max(0, idx)]
}
