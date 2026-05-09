// Editor-side data tables. The map editor renders objects as
// CSS-tinted boxes (no PNG `<img>` tags) since the game is back to
// fully-procedural object rendering — there are no sprite files
// to load. Each table mirrors a source-of-truth in the scenes
// module:
//   - GLYPH_TO_OBJ_KEY mirrors HospitalScene.TILE_TEXTURES (glyph
//     → object texture key). Hand-maintained.
//   - KEY_TO_COLOR_CSS is derived from OBJECT_FALLBACK_COLORS in
//     `../scenes/objectSources`, converted to CSS hex strings.

import { OBJECT_FALLBACK_COLORS } from '../scenes/objectSources'

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

/** Texture key → CSS hex color for the editor's box rendering.
 *  Derived from the runtime fallback colors so editor + game can't
 *  drift on what each object's tint should be. */
export const KEY_TO_COLOR_CSS: Record<string, string> = Object.fromEntries(
  Object.entries(OBJECT_FALLBACK_COLORS).map(([k, n]) =>
    [k, '#' + n.toString(16).padStart(6, '0')]
  )
)

/** Default CSS color when the editor encounters an unknown key.
 *  Should rarely fire — every key in `GLYPH_TO_OBJ_KEY` is also in
 *  `OBJECT_FALLBACK_COLORS`. */
export const DEFAULT_OBJECT_COLOR_CSS = '#6a7a8a'

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
