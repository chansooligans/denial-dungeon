// Editor-side mirror of the two mapping tables that drive in-game
// rendering. Duplicated rather than imported from the scene modules
// because the editor doesn't have a Phaser context — we only need
// the static "glyph → texture key → sprite PNG" lookups and labels.
//
// Keep in sync with:
//   - HospitalScene.TILE_TEXTURES (glyph → object texture key)
//   - BootScene.OBJECT_SOURCES    (texture key → /sprites/objects-raw slot)
// If a new glyph or object key is added there, add it here too or
// the editor will render that tile as "missing".

/** Map glyph → object texture key (matches HospitalScene). */
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

/** Map object texture key → relative sprite path under /public/.
 *  Mirrors BootScene.OBJECT_SOURCES (only the keys reachable via a
 *  glyph; ambient/unused keys omitted). */
export const OBJ_KEY_TO_SRC: Record<string, string> = {
  h_counter: 'sprites/objects-raw/obj1_0_0.png',
  h_desk: 'sprites/objects-raw/desks_0_2.png', // canonical desk: row-1 col-3 of desks.png
  h_chair: 'sprites/objects-raw/obj1_0_2.png',
  h_cabinet: 'sprites/objects-raw/obj1_0_3.png',
  h_bulletin: 'sprites/objects-raw/obj1_1_0.png',
  h_plant: 'sprites/objects-raw/obj1_1_1.png',
  h_water: 'sprites/objects-raw/obj1_2_1.png',
  h_vending: 'sprites/objects-raw/obj1_2_2.png',
  h_bed: 'sprites/objects-raw/obj3_0_0.png',
  h_equipment: 'sprites/objects-raw/obj3_1_3.png',
  h_fax: 'sprites/objects-raw/obj5_1_0.png',
  // Phase-C — these texture keys exist in BootScene's OBJECT_SOURCES
  // but the renderer falls back to a blank silhouette if missing.
  h_aed: 'sprites/objects-raw/obj4_3_0.png',
  h_sanitizer: 'sprites/objects-raw/obj2_1_1.png',
  h_couch: 'sprites/objects-raw/obj2_0_0.png',
  h_bench: 'sprites/objects-raw/obj2_0_1.png',
  h_brochure: 'sprites/objects-raw/obj2_0_3.png',
  h_signin: 'sprites/objects-raw/obj2_3_3.png',
  h_payphone: 'sprites/objects-raw/obj4_3_1.png',
  h_arrow_sign: 'sprites/objects-raw/obj4_3_2.png',
  h_trash: 'sprites/objects-raw/obj2_1_3.png',
  h_iv_stand: 'sprites/objects-raw/obj3_0_2.png',
  h_wheelchair: 'sprites/objects-raw/obj3_0_3.png',
  h_gurney: 'sprites/objects-raw/obj3_3_3.png',
  h_bookshelf: 'sprites/objects-raw/obj5_0_0.png',
  h_shredder: 'sprites/objects-raw/obj5_2_2.png',
  h_kiosk: 'sprites/objects-raw/obj1_3_3.png',
  h_directory: 'sprites/objects-raw/obj2_1_0.png',
  h_pneumatic: 'sprites/objects-raw/obj5_1_3.png',
  h_elevator: 'sprites/objects-raw/obj4_2_1.png',
  h_fountain: 'sprites/objects-raw/obj4_2_3.png',
  h_wet_floor: 'sprites/objects-raw/obj4_0_2.png',
  h_mop_bucket: 'sprites/objects-raw/obj4_0_1.png',
  h_whiteboard: 'sprites/objects-raw/obj1_3_1.png', // fallback (no exact whiteboard sheet)
}

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
