export interface MapDef {
  width: number
  height: number
  layout: string[]
  playerStart: { x: number; y: number }
  crackTile: { x: number; y: number }
  npcPlacements: { npcId: string; tileX: number; tileY: number }[]
}

// Tile legend:
// W = wall, D = door, . = floor, ~ = floor2 variant, _ = carpet
// c = desk, h = chair, E = equipment, P = plant, w = water cooler
// F = filing cabinet, B = whiteboard, R = reception counter
// V = vending machine, b = bulletin board, H = bed, X = fax machine

export const HOSPITAL_MAPS: MapDef[] = [
  // === Level 1: Orientation — small revenue cycle office ===
  {
    width: 40,
    height: 25,
    layout: [
      'WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW',
      'W......................................W',
      'W..P.....b.......P........b........P..W',
      'W......................................W',
      'W..WWWDWWWW....WWWDWWW....WWWWDWWWW...W',
      'W..W.......W...W......W...W........W..W',
      'W..W.c.h...W...W.c.h..W...W..E..H..W..W',
      'W..W.......W...W......W...W........W..W',
      'W..W..F..c.W...W..F...W...W..c..F..W..W',
      'W..WWWWWWWWW...WWWWWWWW...WWWWWWWWWW..W',
      'W......................................W',
      'W....w.......V.........w.............PW',
      'W......................................W',
      'W..RRRRRRRRR.....RRRRRRRR.............W',
      'W..........~.....~.......~............W',
      'W..__________....._________...........W',
      'W.._..h.h.h._...._.h.h.h.._..........W',
      'W.._..h.h.h._...._.h.h.h.._....P.....W',
      'W.._........._...._......._.....w.....W',
      'W..__________....._________...........W',
      'W......................................W',
      'W..P.....X.......P........b........P..W',
      'W......................................W',
      'W..B...........B...........B..........W',
      'WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW',
    ],
    playerStart: { x: 20, y: 14 },
    crackTile: { x: 35, y: 12 },
    npcPlacements: [
      { npcId: 'dana', tileX: 5, tileY: 2 },
      { npcId: 'kim', tileX: 5, tileY: 7 },
      { npcId: 'jordan', tileX: 16, tileY: 7 },
    ],
  },

  // === Level 2: The Front Door — registration area with front desk ===
  {
    width: 45,
    height: 28,
    layout: [
      'WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW',
      'W...........................................W',
      'W..P...b.......RRRRRRRRRRRRRRRR.......P...W',
      'W..............R................R..........W',
      'W..............D................D..........W',
      'W..............R................R..........W',
      'W..............RRRRRRRRRRRRRRRR..........PW',
      'W...........................................W',
      'W..______________.....______________......W',
      'W.._..h..h..h..._...._.h..h..h..h.._...V.W',
      'W.._..h..h..h..._...._.h..h..h..h.._...w.W',
      'W.._............._...._............._.....W',
      'W..______________.....______________......W',
      'W...........................................W',
      'W..WWWDWWWWW...WWWDWWWWW...WWWDWWWWWW.....W',
      'W..W........W..W........W..W.........W....W',
      'W..W..c..F..W..W..c..E..W..W..c..c...W....W',
      'W..W..h.....W..W..h.....W..W..h..h...W....W',
      'W..W........W..W........W..W.........W....W',
      'W..W..P..B..W..W..X..B..W..W..F..B...W....W',
      'W..WWWWWWWWWW..WWWWWWWWWW..WWWWWWWWWWW....W',
      'W...........................................W',
      'W....P....w........V.........P.......b....W',
      'W...........................................W',
      'W.....b..........P............b...........W',
      'W...........................................W',
      'W..P........B...........B..........P......W',
      'WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW',
    ],
    playerStart: { x: 22, y: 13 },
    crackTile: { x: 40, y: 22 },
    npcPlacements: [
      { npcId: 'dana', tileX: 4, tileY: 2 },
      { npcId: 'kim', tileX: 20, tileY: 3 },
      { npcId: 'alex', tileX: 5, tileY: 17 },
    ],
  },

  // === Level 3: The Gate — precert office, lots of fax machines ===
  {
    width: 42,
    height: 26,
    layout: [
      'WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW',
      'W........................................W',
      'W..P....b.............P............b...PW',
      'W........................................W',
      'W..WWWWWDWWWWWWWWWWWWWWWWWDWWWWWWWWWW...W',
      'W..W...........X.X.X...........W.......W',
      'W..W..c..c..c..........c..c..c.DW..P...W',
      'W..W..h..h..h..........h..h..h.WW......W',
      'W..W..............................W......W',
      'W..W..F..F..F..B..B..F..F..F.WW......W',
      'W..WWWWWWWWWWWWWWWWWWWWWWWWWWWWWW......W',
      'W........................................W',
      'W....w.........V..........w..............W',
      'W........................................W',
      'W..____________________.................W',
      'W.._..h..h..h..h..h..h_........WWDWW...W',
      'W.._...................._.......W....W...W',
      'W.._..h..h..h..h..h..h_......W..E..W...W',
      'W..____________________.......W..H..W...W',
      'W.................................W....W...W',
      'W..P............P...........b..WWWWWW...W',
      'W........................................W',
      'W....b..........P.........X...........PW',
      'W........................................W',
      'W..B.............B..........B...........W',
      'WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW',
    ],
    playerStart: { x: 20, y: 12 },
    crackTile: { x: 38, y: 20 },
    npcPlacements: [
      { npcId: 'dana', tileX: 4, tileY: 2 },
      { npcId: 'martinez', tileX: 10, tileY: 6 },
      { npcId: 'sam', tileX: 5, tileY: 16 },
    ],
  },

  // === Level 4: The Copy — HIM department, charts everywhere ===
  {
    width: 44,
    height: 28,
    layout: [
      'WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW',
      'W..........................................W',
      'W..P.....b.........P...........b......P..W',
      'W..........................................W',
      'W..WWDWWW..WWDWWW..WWDWWW..WWDWWW........W',
      'W..W....W..W....W..W....W..W....W........W',
      'W..W.c..W..W.c..W..W.c..W..W.c..W....P..W',
      'W..W.F..W..W.F..W..W.F..W..W.F..W........W',
      'W..WWWWWW..WWWWWW..WWWWWW..WWWWWW........W',
      'W..........................................W',
      'W....FFFFFFFFFFFFFFFFFFF.................W',
      'W..........................................W',
      'W..WWWWWWWWWDWWWWWWWWWWWWWWWWDWWWWWWWW....W',
      'W..W...................W..............W....W',
      'W..W..c..c..c..c..c..W..c..c..c..c..W....W',
      'W..W..h..h..h..h..h..W..h..h..h..h..D....W',
      'W..W...................D..............W....W',
      'W..W..B.....B.....B..W..B.....B.....W....W',
      'W..WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW....W',
      'W..........................................W',
      'W....w.......V.........w..........P......W',
      'W..........................................W',
      'W..___________..........___________......W',
      'W.._..h..h..h_.........._.h..h..h._......W',
      'W.._..h..h..h_....P....._.h..h..h._......W',
      'W..___________..........___________......W',
      'W..........................................W',
      'WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW',
    ],
    playerStart: { x: 22, y: 11 },
    crackTile: { x: 40, y: 20 },
    npcPlacements: [
      { npcId: 'martinez', tileX: 5, tileY: 6 },
      { npcId: 'pat', tileX: 10, tileY: 15 },
    ],
  },

  // === Level 5: The Library — payer policy office ===
  {
    width: 40,
    height: 25,
    layout: [
      'WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW',
      'W......................................W',
      'W..FFFFFFFFFFFF...FFFFFFFFFFFF........W',
      'W......................................W',
      'W..FFFFFFFFFFFF...FFFFFFFFFFFF........W',
      'W......................................W',
      'W..FFFFFFFFFFFF...FFFFFFFFFFFF........W',
      'W......................................W',
      'W..WWWDWWWWW.......WWWDWWWWW..........W',
      'W..W........W......W........W.....P...W',
      'W..W..c..c..W......W..c..c..W.........W',
      'W..W..h..h..D......D..h..h..W.....w...W',
      'W..W..B.....W......W.....B..W.........W',
      'W..WWWWWWWWWW......WWWWWWWWWW.........W',
      'W......................................W',
      'W....P.............P..........V.......W',
      'W......................................W',
      'W.._______________.._______________...W',
      'W.._..h..h..h..h._.._.h..h..h..h.._...W',
      'W.._.............._.._............._...W',
      'W.._______________.._______________...W',
      'W......................................W',
      'W..P...b.......b.......b........P.....W',
      'W......................................W',
      'WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW',
    ],
    playerStart: { x: 20, y: 15 },
    crackTile: { x: 36, y: 7 },
    npcPlacements: [
      { npcId: 'dana', tileX: 5, tileY: 15 },
      { npcId: 'sam', tileX: 5, tileY: 11 },
    ],
  },
]

export function getMapForLevel(level: number): MapDef {
  const idx = Math.min(level - 1, HOSPITAL_MAPS.length - 1)
  return HOSPITAL_MAPS[idx]
}
