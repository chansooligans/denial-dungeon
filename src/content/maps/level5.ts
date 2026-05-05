// Level 5 — The Library: Payer Policy Office.
// Existing ASCII layout, isolated for safer surgical edits.

import { type MapDef } from '../mapBuilder'

function normalize(layout: string[], w: number): string[] {
  return layout.map(row => {
    if (row.length === w) return row
    if (row.length < w) return row.slice(0, -1) + '.'.repeat(w - row.length) + row[row.length - 1]
    return row.slice(0, w - 1) + row[row.length - 1]
  })
}

export const LEVEL_5_MAP: MapDef = {
  width: 65,
  height: 45,
  layout: normalize([
    'WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW',
    'W...............................................................W',
    'W..P............b................................b.........P..W',
    'W..WWWWWWWWWWWWWWWWWWWWWW...............WWWWWWWWWWWWWWWWWWWWWWW..W',
    'W..W....................W...............W....................W..W',
    'W..W..F..F..F..F..F.....W...............W..c..h.....c..h.....W..W',
    'W..W....................W...............W....................W..W',
    'W..W..F..F..F..F..F.....W...............W..B..............X..W..W',
    'W..W....................W...............W....................W..W',
    'W..WWWWWWWWWWWDWWWWWWWWWW...............WWWWWWWWWWDWWWWWWWWWWW..W',
    'W...............................................................W',
    'W......b...........................................b...........W',
    'W...............................................................W',
    'W..WWWWWWWWWWWDWWWWWWWWWW...............WWWWWWWWWWDWWWWWWWWWWW..W',
    'W..W....................W...............W....................W..W',
    'W..W..F..F..F..F..F.....W...............W..c..h.............F..W..W',
    'W..W....................W...............W....................W..W',
    'W..W..F..F..F..F..F.....W...............W....................W..W',
    'W..W....................W...............W..B..............X..W..W',
    'W..W....................W...............W....................W..W',
    'W..WWWWWWWWWWWDWWWWWWWWWW...............WWWWWWWWWWDWWWWWWWWWWW..W',
    'W...............................................................W',
    'W....P.......w.............................V.............P.....W',
    'W...............................................................W',
    'W..WWWWWWWWWWWDWWWWWWWWWW...............WWWWWWWWWWDWWWWWWWWWWW..W',
    'W..W....................W...............W....................W..W',
    'W..W...h..h..h..h.......W...............W..RRRRRRRRRRRRRR....W..W',
    'W..W....................W...............W....................W..W',
    'W..W...h..h..h..h.......W...............W...h..h..h..h.......W..W',
    'W..W..........P.........W...............W..........B.........W..W',
    'W..W....................W...............W....................W..W',
    'W..WWWWWWWWWWWDWWWWWWWWWW...............WWWWWWWWWWDWWWWWWWWWWW..W',
    'W...............................................................W',
    'W......b...........................................b...........W',
    'W...............................................................W',
    'W..WWWWWWWWWWWWWWWWWWWWWWWWWWWWDWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW..W',
    'W..W.........................................................W..W',
    'W..W..RRRRRRRRRRRRRRRRRRRR.............................P.....W..W',
    'W..W.........................................................W..W',
    'W..W..P......b.....................P.......b.................W..W',
    'W..W.........................................................W..W',
    'W..W......h..h..h..h..h..........h..h..h..h..h..............W..W',
    'W..W......h..h..h..h..h..........h..h..h..h..h..............W..W',
    'WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW',
  ], 65),
  playerStart: { x: 32, y: 41 },
  gapTile: { x: 32, y: 1 },
  npcPlacements: [
    { npcId: 'dana', tileX: 12, tileY: 38 },
    { npcId: 'sam', tileX: 12, tileY: 16 },
  ],
}
