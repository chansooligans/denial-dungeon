// Canonical {textureKey: spriteSlot} mapping. EMPTY by design —
// the game uses pure procedural pixel art for every object texture
// it has. The 12 procedurally-drawn keys are generated at runtime
// in BootScene.makeHospitalTiles via Phaser's Graphics API; no
// PNG files are loaded for any object sprite.
//
// To bring back PNG-backed art for any single key, add an entry
// here mapping `texture_key → 'slot_filename'` (without the
// `.png`) and drop the cell into public/sprites/objects-raw/. The
// procedural fallback steps aside via a `if (!textures.exists(...))`
// guard so PNG always wins when present.

export const OBJECT_SOURCES: Record<string, string> = {}

/**
 * Per-key dominant fill color. Mirrors the colors used in the
 * detailed pixel-art generators in `BootScene.makeHospitalTiles`,
 * exposed as data so editors (map editor, intro editor) can render
 * each object as a tinted CSS box matching its in-game tone.
 *
 * Keys here = the 12 hospital object textures with full procedural
 * draws. Anything else is either a tile base (floor, wall, door)
 * or a glyph that doesn't exist anymore.
 */
export const OBJECT_FALLBACK_COLORS: Record<string, number> = {
  h_desk:       0x5a4a3a, // wood
  h_chair:      0x3a3a4a, // dark slate
  h_equipment:  0x6a6a8a, // pale blue-grey monitor
  h_plant:      0x4a6a4a, // potted-fern green
  h_water:      0xa0c4d4, // pale blue
  h_cabinet:    0x6a4a3a, // wood
  h_whiteboard: 0xb8b8b8, // off-white board
  h_counter:    0x5a5a6a, // counter slate
  h_vending:    0xa05050, // red vending
  h_bulletin:   0xa07a4a, // cork brown
  h_bed:        0xc8c8d0, // pale linen
  h_fax:        0x8a8a4a, // beige
}
