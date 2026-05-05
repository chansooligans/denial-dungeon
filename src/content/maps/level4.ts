// Level 4 — The Copy: HIM Department.
// Existing ASCII layout, isolated for safer surgical edits.

import { type MapDef } from '../mapBuilder'

function normalize(layout: string[], w: number): string[] {
  return layout.map(row => {
    if (row.length === w) return row
    if (row.length < w) return row.slice(0, -1) + '.'.repeat(w - row.length) + row[row.length - 1]
    return row.slice(0, w - 1) + row[row.length - 1]
  })
}

export const LEVEL_4_MAP: MapDef = {
  width: 75,
  height: 52,
  layout: normalize([
    'WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW',
    'W.........................................................................W',
    'W..P..............b........................................b...........P..W',
    'W..WWWWWWWWWWWWWWWWWWWWWWWWWW.................WWWWWWWWWWWWWWWWWWWWWWWWWWW..W',
    'W..W........................W.................W........................W..W',
    'W..W..c..h...............F...W.................W..c..h.......B.........W..W',
    'W..W........................W.................W........................W..W',
    'W..W........................W.................W........................W..W',
    'W..W..B..................X...W.................W..F..F..F..F..F..F......W..W',
    'W..WWWWWWWWWWWWDWWWWWWWWWWWWW.................WWWWWWWWWWWWDWWWWWWWWWWWWW..W',
    'W.........................................................................W',
    'W......b.....................................................b...........W',
    'W.........................................................................W',
    'W..WWWWWWWWWWWWDWWWWWWWWWWWWW.................WWWWWWWWWWWWDWWWWWWWWWWWWW..W',
    'W..W........................W.................W........................W..W',
    'W..W..c..c..c..c..c.........W.................W..c..h...............F..W..W',
    'W..W..h..h..h..h..h.........W.................W........................W..W',
    'W..W........................W.................W........................W..W',
    'W..W..B.....B...............W.................W..B.................X....W..W',
    'W..W........................W.................W........................W..W',
    'W..WWWWWWWWWWWWDWWWWWWWWWWWWW.................WWWWWWWWWWWWDWWWWWWWWWWWWW..W',
    'W.........................................................................W',
    'W....P.......w.......................................V.............P.....W',
    'W.........................................................................W',
    'W..WWWWWWWWWWWWDWWWWWWWWWWWWW.................WWWWWWWWWWWWDWWWWWWWWWWWWW..W',
    'W..W........................W.................W........................W..W',
    'W..W..F..F..F..F..F..F......W.................W..F..F..F..F..F..F......W..W',
    'W..W........................W.................W........................W..W',
    'W..W..F..F..F..F..F..F......W.................W..F..F..F..F..F..F......W..W',
    'W..W........................W.................W........................W..W',
    'W..W........................W.................W........................W..W',
    'W..WWWWWWWWWWWWDWWWWWWWWWWWWW.................WWWWWWWWWWWWDWWWWWWWWWWWWW..W',
    'W.........................................................................W',
    'W......b.....................................................b...........W',
    'W.........................................................................W',
    'W..WWWWWWWWWWWWDWWWWWWWWWWWWW.................WWWWWWWWWWWWDWWWWWWWWWWWWW..W',
    'W..W........................W.................W........................W..W',
    'W..W...h..h..h..h..h..h.....W.................W...c..c..c..............W..W',
    'W..W........................W.................W...h..h..h..............W..W',
    'W..W...h..h..h..h..h..h.....W.................W........................W..W',
    'W..W..........P.............W.................W...V.....w..............W..W',
    'W..W........................W.................W........................W..W',
    'W..WWWWWWWWWWWWDWWWWWWWWWWWWW.................WWWWWWWWWWWWDWWWWWWWWWWWWW..W',
    'W..WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWDWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW..W',
    'W..W...................................................................W..W',
    'W..W..RRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR............................P.....W..W',
    'W..W...................................................................W..W',
    'W..W..P......b.................................P.......b...............W..W',
    'W..W......h..h..h..h..h..h..h............h..h..h..h..h..h..h..........W..W',
    'W..W......h..h..h..h..h..h..h............h..h..h..h..h..h..h..........W..W',
    'W..W...................................................................W..W',
    'WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW',
  ], 75),
  playerStart: { x: 37, y: 49 },
  gapTile: { x: 37, y: 1 },
  npcPlacements: [
    { npcId: 'martinez', tileX: 14, tileY: 16 },
    { npcId: 'pat', tileX: 58, tileY: 27 },
  ],
}
