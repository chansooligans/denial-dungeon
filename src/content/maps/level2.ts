// Level 2 — The Front Door: Registration Area.
// Existing ASCII layout, isolated for safer surgical edits.
//
// TODO: migrate to mapBuilder so this module follows the Level 1 pattern.

import { type MapDef } from '../mapBuilder'

// Pad/trim helper kept local; mirrors the original normalize() behavior.
function normalize(layout: string[], w: number): string[] {
  return layout.map(row => {
    if (row.length === w) return row
    if (row.length < w) return row.slice(0, -1) + '.'.repeat(w - row.length) + row[row.length - 1]
    return row.slice(0, w - 1) + row[row.length - 1]
  })
}

export const LEVEL_2_MAP: MapDef = {
  width: 70,
  height: 50,
  layout: normalize([
    'WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW',
    'W....................................................................W',
    'W..P............b....................................b...........P..W',
    'W..WWWWWWWWWWWWWWWWWWWWWWWW................WWWWWWWWWWWWWWWWWWWWWWWWW..W',
    'W..W......................W................W......................W..W',
    'W..W..F..F..F..F..F.......W................W..E.....E.....H.......W..W',
    'W..W......................W................W......................W..W',
    'W..W..F..F..F..F..F.......W................W..E.....E.....H.......W..W',
    'W..W......................W................W......................W..W',
    'W..WWWWWWWWWWWWDWWWWWWWWWWW................WWWWWWWWWWWDWWWWWWWWWWWWW..W',
    'W....................................................................W',
    'W......b...............................................b...............W',
    'W....................................................................W',
    'W..WWWWWWWWWWWWDWWWWWWWWWWW................WWWWWWWWWWWDWWWWWWWWWWWWW..W',
    'W..W......................W................W......................W..W',
    'W..W..c..h.............F..W................W..c..h..............F..W..W',
    'W..W......................W................W......................W..W',
    'W..W......................W................W......................W..W',
    'W..W..B...............X...W................W..B................X..W..W',
    'W..W......................W................W......................W..W',
    'W..WWWWWWWWWWWWDWWWWWWWWWWW................WWWWWWWWWWWDWWWWWWWWWWWWW..W',
    'W....................................................................W',
    'W....P.......w...................................V.............P.....W',
    'W....................................................................W',
    'W..WWWWWWWWWWWWDWWWWWWWWWWW................WWWWWWWWWWWDWWWWWWWWWWWWW..W',
    'W..W......................W................W......................W..W',
    'W..W..c..h..c..h..........W................W..c..h..............F..W..W',
    'W..W......................W................W......................W..W',
    'W..W......................W................W......................W..W',
    'W..W..B.....F.............W................W..B.................X..W..W',
    'W..W......................W................W......................W..W',
    'W..WWWWWWWWWWWWDWWWWWWWWWWW................WWWWWWWWWWWDWWWWWWWWWWWWW..W',
    'W....................................................................W',
    'W......b...............................................b...............W',
    'W....................................................................W',
    'W..WWWWWWWWWWWWDWWWWWWWWWWW................WWWWWWWWWWWDWWWWWWWWWWWWW..W',
    'W..W......................W................W......................W..W',
    'W..W...h..h..h..h..h......W................W...c..c..c.............W..W',
    'W..W......................W................W...h..h..h.............W..W',
    'W..W...h..h..h..h..h......W................W......................W..W',
    'W..W..........P...........W................W...V.....w.............W..W',
    'W..W......................W................W......................W..W',
    'W..WWWWWWWWWWWWDWWWWWWWWWWW................WWWWWWWWWWWDWWWWWWWWWWWWW..W',
    'W..WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWDWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW..W',
    'W..W..............................................................W..W',
    'W..W..RRRRRRRRRRRRRRRRRRRRRRRRRRR..........................P.....W..W',
    'W..W..............................................................W..W',
    'W..W..P......b.........................P.......b.................W..W',
    'W..W......h..h..h..h..h..h............h..h..h..h..h..h..........W..W',
    'WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW',
  ], 70),
  playerStart: { x: 35, y: 47 },
  gapTile: { x: 35, y: 1 },
  npcPlacements: [
    { npcId: 'dana', tileX: 14, tileY: 46 },
    { npcId: 'kim', tileX: 12, tileY: 16 },
    { npcId: 'alex', tileX: 54, tileY: 27 },
  ],
}
