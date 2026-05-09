// Editor-side mirror of the two mapping tables that drive in-game
// rendering. Glyph→key duplicates HospitalScene.TILE_TEXTURES (kept
// here because the Phaser-laden scene module would bloat the editor
// bundle). Key→sprite-path is now derived from the canonical
// `OBJECT_SOURCES` table in `../scenes/objectSources`, so the editor
// and BootScene can't drift on which slot backs each texture key.

import { OBJECT_SOURCES } from '../scenes/objectSources'

/** Map glyph → object texture key (matches HospitalScene.TILE_TEXTURES).
 *  Keep in sync if a new glyph or object key is added there. */
export const GLYPH_TO_OBJ_KEY: Record<string, string> = {
  c: 'h_desk',
  h: 'h_chair',
  E: 'h_equipment',
  P: 'h_plant',
  w: 'h_water',
  F: 'h_cabinet',
  B: 'h_whiteboard',
  R: 'h_counter',
  V: 'h_vending',
  b: 'h_bulletin',
  H: 'h_bed',
  X: 'h_fax',
  // Phase-C
  A: 'h_aed',
  a: 'h_sanitizer',
  C: 'h_couch',
  d: 'h_bench',
  r: 'h_brochure',
  i: 'h_signin',
  p: 'h_payphone',
  '>': 'h_arrow_sign',
  T: 'h_trash',
  I: 'h_iv_stand',
  y: 'h_wheelchair',
  g: 'h_gurney',
  K: 'h_bookshelf',
  s: 'h_shredder',
  k: 'h_kiosk',
  '#': 'h_directory',
  '%': 'h_pneumatic',
  e: 'h_elevator',
  f: 'h_fountain',
  '!': 'h_wet_floor',
  M: 'h_mop_bucket',
}

/** Reverse — used by the palette. */
export const OBJ_KEY_TO_GLYPH: Record<string, string> = Object.fromEntries(
  Object.entries(GLYPH_TO_OBJ_KEY).map(([g, k]) => [k, g])
)

/** Map object texture key → relative sprite path under `/public/`.
 *  Auto-derived from the canonical OBJECT_SOURCES so the editor
 *  always renders whatever cell BootScene is currently loading.
 *  Includes the 12 desk variants + 20 plant variants since
 *  OBJECT_SOURCES merges those in. */
export const OBJ_KEY_TO_SRC: Record<string, string> = Object.fromEntries(
  Object.entries(OBJECT_SOURCES).map(([key, slot]) =>
    [key, `sprites/objects-raw/${slot}.png`]
  )
)

/** Variant-only keys (h_desk_1..12, h_plant_1..20). Subset of
 *  OBJ_KEY_TO_SRC, exposed separately for the variant browsers in
 *  the intro / map editors that want them grouped. */
export const VARIANT_KEY_TO_SRC: Record<string, string> = Object.fromEntries(
  Object.entries(OBJ_KEY_TO_SRC).filter(([key]) =>
    /^h_(desk|plant)_\d+$/.test(key)
  )
)

/** Human label per glyph for the palette / status line. */
export const GLYPH_LABEL: Record<string, string> = {
  c: 'Desk',
  h: 'Chair',
  E: 'Equipment',
  P: 'Plant',
  w: 'Water cooler',
  F: 'Filing cabinet',
  B: 'Whiteboard',
  R: 'Counter',
  V: 'Vending',
  b: 'Bulletin',
  H: 'Hospital bed',
  X: 'Fax / kiosk',
  A: 'AED',
  a: 'Sanitizer',
  C: 'Couch',
  d: 'Bench',
  r: 'Brochure rack',
  i: 'Sign-in stand',
  p: 'Payphone',
  '>': 'Arrow sign',
  T: 'Trash',
  I: 'IV stand',
  y: 'Wheelchair',
  g: 'Gurney',
  K: 'Bookshelf',
  s: 'Shredder',
  k: 'Kiosk',
  '#': 'Directory',
  '%': 'Pneumatic tube',
  e: 'Elevator',
  f: 'Fountain',
  '!': 'Wet floor',
  M: 'Mop bucket',
}
