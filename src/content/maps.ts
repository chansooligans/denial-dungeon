// Public map API. The hospital floor plan lives in ./maps/level1.ts;
// the builder + types live in ./mapBuilder.ts.
//
// Tile legend:
//   W = wall, D = door, L = locked door, . = floor, ~ = floor variant,
//   _ = carpet, c = desk, h = chair, E = equipment, P = plant,
//   w = water cooler, F = filing cabinet, B = whiteboard,
//   R = reception counter, V = vending, b = bulletin, H = bed, X = fax

import { type MapDef } from './mapBuilder'
import { LEVEL_1_MAP } from './maps/level1'

export type { MapDef }

/** The Hospital floor plan. Used by both HospitalScene and WaitingRoomScene
 *  (the WR is rendered as a parallel layer over the same geometry). */
export const HOSPITAL_MAP: MapDef = LEVEL_1_MAP
