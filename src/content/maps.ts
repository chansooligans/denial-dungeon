export interface MapDef {
  width: number
  height: number
  layout: string[]
  playerStart: { x: number; y: number }
  crackTile: { x: number; y: number }
  npcPlacements: { npcId: string; tileX: number; tileY: number }[]
}

// Pad or trim each row to exact width (safety net for hand-authored ASCII maps)
function normalize(layout: string[], w: number): string[] {
  return layout.map(row => {
    if (row.length === w) return row
    if (row.length < w) return row.slice(0, -1) + '.'.repeat(w - row.length) + row[row.length - 1]
    return row.slice(0, w - 1) + row[row.length - 1]
  })
}

// Tile legend:
// W = wall, D = door, . = floor, ~ = floor2 variant, _ = carpet
// c = desk, h = chair, E = equipment, P = plant, w = water cooler
// F = filing cabinet, B = whiteboard, R = reception counter
// V = vending machine, b = bulletin board, H = bed, X = fax machine
//
// LAYOUT TEMPLATE — based on the hospital design doc.
// Each map is a 3-column × 2-row grid of rooms with a connecting corridor:
//
//     [TOP-LEFT]====[TOP-CENTER]====[TOP-RIGHT]
//        ||                              ||
//     [BOT-LEFT]====[BOT-MIDDLE]====[BOT-RIGHT]
//
// Vertical corridors only on left and right (no center vertical passage —
// forces traversal through perimeter rooms). Player starts in BOT-LEFT
// (lobby). Crack to The Waiting Room is in TOP-CENTER (the hub).

// Standard wing template (70 wide × 32 tall):
//   cols 3-20  : left room column (18 wide, 16 interior)
//   cols 21-25 : horizontal corridor (5 wide)
//   cols 26-43 : center room column (18 wide, 16 interior)
//   cols 44-48 : horizontal corridor
//   cols 49-66 : right room column (18 wide, 16 interior)
//   rows 4-12  : top room row
//   rows 13-15 : middle horizontal corridor (3 tall)
//   rows 16-24 : bottom room row
//   East-west doors at row 8 (top rooms) and row 20 (bottom rooms)
//   South doors of top rooms at col 11 and col 57 (vertical passages)
//   North doors of bottom rooms mirror at col 11 and col 57

export const HOSPITAL_MAPS: MapDef[] = [

  // =====================================================================
  // LEVEL 1: Orientation — Asymmetric North Wing
  // North zone:  Main Hub (crack) — open atrium with locked Prior Auth
  //              Gate east (foreshadows Lvl 3)
  // Mid zone:    Patient Services (small, west) ─corridor─ Reception
  //              (T-desk) ─corridor─ Registration (wide, with counter)
  //              ─stub─ Eligibility kiosk (tiny, east of Reg)
  // Staff corridor: narrow 3-wide passage links Reception to Main Hub
  // South zone:  Lobby — wide rectangle with chair clusters, vending,
  //              counter, plants. Three north doors give multiple entry
  //              paths up. Main entrance door visible on south wall.
  // =====================================================================
  {
    width: 80,
    height: 36,
    layout: normalize([
      // 0: top exterior wall
      'WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW',
      // 1: outdoor margin
      'W..............................................................................W',
      // 2: outdoor decor
      'W....P.............b..............................b............P...............W',
      // 3: Main Hub top wall (cols 25-51)
      'W........................WWWWWWWWWWWWWWWWWWWWWWWWWWW...........................W',
      // 4: Main Hub interior + Prior Auth top wall (cols 56-73)
      'W........................W.........................W....WWWWWWWWWWWWWWWWWW.....W',
      // 5: Main Hub + Prior Auth interior
      'W........................W.........................W....W................W.....W',
      // 6: fountain in Main Hub + chair/desk in Prior Auth
      'W........................W............w............W....W..c..h..........W.....W',
      // 7: open
      'W........................W.........................W....W................W.....W',
      // 8: locked door from Main Hub to Prior Auth Gate
      'W........................W...........b.............L....L..F............XW.....W',
      // 9: open
      'W........................W.........................W....W................W.....W',
      // 10: plant in Main Hub, whiteboard in Prior Auth
      'W........................W..........P..............W....W..B.............W.....W',
      // 11: Prior Auth bottom wall (Main Hub continues)
      'W........................W.........................W....WWWWWWWWWWWWWWWWWW.....W',
      // 12: Main Hub interior (Prior Auth ended)
      'W........................W.........................W...........................W',
      // 13: Main Hub bottom wall, south door at col 38 (staff corridor)
      'W........................WWWWWWWWWWWWWDWWWWWWWWWWWWW...........................W',
      // 14-15: narrow staff-only corridor (only cols 37-39 walkable)
      'WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW...WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW',
      'WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW...WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW',
      // 16: top walls of mid-row rooms; Reception north door at col 38
      'W....WWWWWWWWWWWWWWWWW......WWWWWWWWWWDWWWWWWWW..WWWWWWWWWWWWWWWWWWWWWW........W',
      // 17: interior of mid-row rooms
      'W....W...............W......W.................W..W....................W........W',
      // 18: + Eligibility kiosk top wall (cols 72-77)
      'W....W...............W......W.................W..W....................W.WWWWWW.W',
      // 19: east-west doors at col 21, 28, 46, 49 (PS↔Reception↔Reg)
      'W....W.c..h..........D......D....RRRR..RRRR...D..D...c..c..c..c.......W.W....W.W',
      // 20: Reg east door (col 70) ↔ Eligib west door (col 72)
      'W....W...............W......W..h..h..h..h.....W..W..h..h..h..h..h.....D.D....W.W',
      // 21: chairs/desks
      'W....W..F............W......W..h..h..h..h.....W..W....................W.W.c..W.W',
      // 22: Eligib bottom wall closes kiosk
      'W....W..B............W......W..........P......W..W..B................XW.WWWWWW.W',
      // 23: bottom walls of mid-row rooms with south doors at cols 12, 38, 60
      'W....WWWWWWWDWWWWWWWWW......WWWWWWWWWWDWWWWWWWW..WWWWWWWWWWWDWWWWWWWWWW........W',
      // 24-26: corridor between mid-row rooms and Lobby
      'W..............................................................................W',
      'W......b................................................................b......W',
      'W..............................................................................W',
      // 27: Lobby top wall (cols 5-72) with 3 doors at cols 12, 38, 60
      'W....WWWWWWWDWWWWWWWWWWWWWWWWWWWWWWWWWDWWWWWWWWWWWWWWWWWWWWWDWWWWWWWWWWWW......W',
      // 28-34: Lobby interior (66 cols × 7 rows)
      'W....W..................................................................W......W',
      'W....W..h..h..h..h..h.......h..h..h..h..h...........RRRRRRRR............W......W',
      'W....W..h..h..h..h..h.......h..h..h..h..h...............................W......W',
      'W....W..................................................................W......W',
      'W....W..P.....b......................V......w...........................W......W',
      'W....W..h..h..h..h..h.......h..h..h..h..h...............................W......W',
      'W....W..................................................................W......W',
      // 35: south wall (building exterior) with main entrance door at col 38
      'WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWDWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW',
    ], 80),
    playerStart: { x: 38, y: 32 },
    crackTile: { x: 38, y: 8 },
    npcPlacements: [
      { npcId: 'dana', tileX: 13, tileY: 19 },
      { npcId: 'kim', tileX: 60, tileY: 19 },
      { npcId: 'jordan', tileX: 75, tileY: 20 },
    ],
  },

  // =====================================================================
  // LEVEL 2: The Front Door — Registration Wing
  // Top:  Records Office  | Intake Hub (crack) | Insurance Verification
  // Bot:  Patient Lobby   | Registration Desk  | Eligibility Check
  // =====================================================================
  {
    width: 70,
    height: 32,
    layout: normalize([
      'WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW',
      'W....................................................................W',
      'W..P............b.................................b...............P..W',
      'W....................................................................W',
      'W..WWWWWWWWWWWWWWWWWW.....WWWWWWWWWWWWWWWWWW.....WWWWWWWWWWWWWWWWWW..W',
      'W..W................W.....W................W.....W................W..W',
      'W..W..F..F..F.......W.....W..c..h..........W.....W..c..h..........W..W',
      'W..W................W.....W................W.....W................W..W',
      'W..W..F..F..F.......D.....D................D.....D..B.............W..W',
      'W..W................W.....W................W.....W................W..W',
      'W..W..B.............W.....W..............X.W.....W..F............X.W..W',
      'W..W................W.....W................W.....W................W..W',
      'W..WWWWWWWWDWWWWWWWWW.....WWWWWWWWWWWWWWWWWW.....WWWWWWWWDWWWWWWWWW..W',
      'W....................................................................W',
      'W......b......................................................b......W',
      'W....................................................................W',
      'W..WWWWWWWWDWWWWWWWWW.....WWWWWWWWWWWWWWWWWW.....WWWWWWWWDWWWWWWWWW..W',
      'W..W................W.....W................W.....W................W..W',
      'W..W..h..h..h.......W.....W..R..R..R..R....W.....W..c..h..........W..W',
      'W..W..h..h..h.......W.....W..c..h..c..h....W.....W..c..h..........W..W',
      'W..W................D.....D................D.....D................W..W',
      'W..W..h..h..h.......W.....W..c..h..c..h....W.....W..B.............W..W',
      'W..W..h..h..h.......W.....W................W.....W................W..W',
      'W..W..........P.....W.....W..........P.....W.....W..............X.W..W',
      'W..WWWWWWWWWWWWWWWWWW.....WWWWWWWWWWWWWWWWWW.....WWWWWWWWWWWWWWWWWW..W',
      'W....................................................................W',
      'W....................................................................W',
      'W....P......b........h..h..h..h..h.................b...........P....W',
      'W.....................h..h..h..h..h..................................W',
      'W....................................................................W',
      'WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW',
    ], 70),
    playerStart: { x: 11, y: 20 },
    crackTile: { x: 35, y: 8 },
    npcPlacements: [
      { npcId: 'dana', tileX: 12, tileY: 19 },
      { npcId: 'kim', tileX: 35, tileY: 19 },
      { npcId: 'alex', tileX: 58, tileY: 19 },
    ],
  },

  // =====================================================================
  // LEVEL 3: The Gate — Prior Authorization Wing
  // Top:  Appeals Office  | Auth Review Hub (crack) | Fax/Phone Room
  // Bot:  Patient Lobby   | Reviewer Desks          | Records
  // =====================================================================
  {
    width: 70,
    height: 32,
    layout: normalize([
      'WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW',
      'W....................................................................W',
      'W..P............b.................................b...............P..W',
      'W....................................................................W',
      'W..WWWWWWWWWWWWWWWWWW.....WWWWWWWWWWWWWWWWWW.....WWWWWWWWWWWWWWWWWW..W',
      'W..W................W.....W................W.....W................W..W',
      'W..W..c..h..........W.....W................W.....W..X..X..X..X....W..W',
      'W..W................W.....W................W.....W................W..W',
      'W..W..B............X.D.....D................D.....D..X..X..X..X....W..W',
      'W..W................W.....W................W.....W................W..W',
      'W..W..F.............W.....W..............X.W.....W..F.............W..W',
      'W..W................W.....W................W.....W................W..W',
      'W..WWWWWWWWDWWWWWWWWW.....WWWWWWWWWWWWWWWWWW.....WWWWWWWWDWWWWWWWWW..W',
      'W....................................................................W',
      'W......b......................................................b......W',
      'W....................................................................W',
      'W..WWWWWWWWDWWWWWWWWW.....WWWWWWWWWWWWWWWWWW.....WWWWWWWWDWWWWWWWWW..W',
      'W..W................W.....W................W.....W................W..W',
      'W..W..h..h..h.......W.....W..c..c..c..c....W.....W..F..F..F..F....W..W',
      'W..W..h..h..h.......W.....W..h..h..h..h....W.....W................W..W',
      'W..W................D.....D................D.....D................W..W',
      'W..W..h..h..h.......W.....W..c..c..c..c....W.....W..F..F..F..F....W..W',
      'W..W..h..h..h.......W.....W..h..h..h..h....W.....W................W..W',
      'W..W..........P.....W.....W................W.....W................W..W',
      'W..WWWWWWWWWWWWWWWWWW.....WWWWWWWWWWWWWWWWWW.....WWWWWWWWWWWWWWWWWW..W',
      'W....................................................................W',
      'W....................................................................W',
      'W....P......b........h..h..h..h..h.................b...........P....W',
      'W.....................h..h..h..h..h..................................W',
      'W....................................................................W',
      'WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW',
    ], 70),
    playerStart: { x: 11, y: 20 },
    crackTile: { x: 35, y: 8 },
    npcPlacements: [
      { npcId: 'dana', tileX: 12, tileY: 19 },
      { npcId: 'martinez', tileX: 35, tileY: 19 },
      { npcId: 'sam', tileX: 58, tileY: 19 },
    ],
  },

  // =====================================================================
  // LEVEL 4: The Copy — HIM / Coding Wing (Central Clinical)
  // Top:  Audit Office  | CDI Hub (crack)  | Coding Stations
  // Bot:  Chart Lobby   | Records Storage  | Quality / EHR Room
  // =====================================================================
  {
    width: 70,
    height: 32,
    layout: normalize([
      'WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW',
      'W....................................................................W',
      'W..P............b.................................b...............P..W',
      'W....................................................................W',
      'W..WWWWWWWWWWWWWWWWWW.....WWWWWWWWWWWWWWWWWW.....WWWWWWWWWWWWWWWWWW..W',
      'W..W................W.....W................W.....W................W..W',
      'W..W..c..h..........W.....W..c..h..........W.....W..c..c..c..c....W..W',
      'W..W................W.....W................W.....W..h..h..h..h....W..W',
      'W..W..B............X.D.....D..............X.D.....D................W..W',
      'W..W................W.....W................W.....W..c..c..c..c....W..W',
      'W..W..F..F..F.......W.....W..B.............W.....W..h..h..h..h....W..W',
      'W..W................W.....W................W.....W................W..W',
      'W..WWWWWWWWDWWWWWWWWW.....WWWWWWWWWWWWWWWWWW.....WWWWWWWWDWWWWWWWWW..W',
      'W....................................................................W',
      'W......b......................................................b......W',
      'W....................................................................W',
      'W..WWWWWWWWDWWWWWWWWW.....WWWWWWWWWWWWWWWWWW.....WWWWWWWWDWWWWWWWWW..W',
      'W..W................W.....W................W.....W................W..W',
      'W..W..h..h..h.......W.....W..F..F..F..F....W.....W..c..h..........W..W',
      'W..W..h..h..h.......W.....W................W.....W................W..W',
      'W..W................D.....D..F..F..F..F....D.....D..............X.W..W',
      'W..W..h..h..h.......W.....W................W.....W..B.............W..W',
      'W..W..h..h..h.......W.....W..F..F..F..F....W.....W..F.............W..W',
      'W..W..........P.....W.....W................W.....W................W..W',
      'W..WWWWWWWWWWWWWWWWWW.....WWWWWWWWWWWWWWWWWW.....WWWWWWWWWWWWWWWWWW..W',
      'W....................................................................W',
      'W....................................................................W',
      'W....P......b........h..h..h..h..h.................b...........P....W',
      'W.....................h..h..h..h..h..................................W',
      'W....................................................................W',
      'WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW',
    ], 70),
    playerStart: { x: 11, y: 20 },
    crackTile: { x: 35, y: 8 },
    npcPlacements: [
      { npcId: 'martinez', tileX: 35, tileY: 19 },
      { npcId: 'pat', tileX: 58, tileY: 19 },
    ],
  },

  // =====================================================================
  // LEVEL 5: The Library — Payer Policy / Compliance Wing
  // Top:  Policy Archive | Research Hub (crack) | Reading Room
  // Bot:  Lobby          | Reference Stacks     | Meeting Room
  // =====================================================================
  {
    width: 70,
    height: 32,
    layout: normalize([
      'WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW',
      'W....................................................................W',
      'W..P............b.................................b...............P..W',
      'W....................................................................W',
      'W..WWWWWWWWWWWWWWWWWW.....WWWWWWWWWWWWWWWWWW.....WWWWWWWWWWWWWWWWWW..W',
      'W..W................W.....W................W.....W................W..W',
      'W..W..F..F..F..F....W.....W..c..h..c..h....W.....W..c..h..........W..W',
      'W..W................W.....W................W.....W................W..W',
      'W..W..F..F..F..F....D.....D................D.....D..c..h..........W..W',
      'W..W................W.....W................W.....W................W..W',
      'W..W..F..F..F..F....W.....W..B...........X.W.....W..B............X.W..W',
      'W..W................W.....W................W.....W................W..W',
      'W..WWWWWWWWDWWWWWWWWW.....WWWWWWWWWWWWWWWWWW.....WWWWWWWWDWWWWWWWWW..W',
      'W....................................................................W',
      'W......b......................................................b......W',
      'W....................................................................W',
      'W..WWWWWWWWDWWWWWWWWW.....WWWWWWWWWWWWWWWWWW.....WWWWWWWWDWWWWWWWWW..W',
      'W..W................W.....W................W.....W................W..W',
      'W..W..h..h..h.......W.....W..F..F..F..F....W.....W..RRRRRRRRRRR...W..W',
      'W..W..h..h..h.......W.....W................W.....W................W..W',
      'W..W................D.....D..F..F..F..F....D.....D..h..h..h..h....W..W',
      'W..W..h..h..h.......W.....W................W.....W..h..h..h..h....W..W',
      'W..W..h..h..h.......W.....W..F..F..F..F....W.....W................W..W',
      'W..W..........P.....W.....W................W.....W..........B.....W..W',
      'W..WWWWWWWWWWWWWWWWWW.....WWWWWWWWWWWWWWWWWW.....WWWWWWWWWWWWWWWWWW..W',
      'W....................................................................W',
      'W....................................................................W',
      'W....P......b........h..h..h..h..h.................b...........P....W',
      'W.....................h..h..h..h..h..................................W',
      'W....................................................................W',
      'WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW',
    ], 70),
    playerStart: { x: 11, y: 20 },
    crackTile: { x: 35, y: 8 },
    npcPlacements: [
      { npcId: 'dana', tileX: 12, tileY: 19 },
      { npcId: 'sam', tileX: 35, tileY: 19 },
    ],
  },
]

export function getMapForLevel(level: number): MapDef {
  const idx = Math.min(level - 1, HOSPITAL_MAPS.length - 1)
  return HOSPITAL_MAPS[idx]
}
