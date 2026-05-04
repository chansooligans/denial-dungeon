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

// All maps flow south → north: player starts in lobby (south), crack is at far north.
// Main corridor runs north-south with rooms branching off left and right.

export const HOSPITAL_MAPS: MapDef[] = [

  // =====================================================================
  // LEVEL 1: Orientation — Revenue Cycle Office (60 wide × 45 tall)
  // Layout: Lobby → Waiting/Break → Offices → Storage/Equipment → Crack
  // Left rooms: 19 interior, Corridor: 12, Right rooms: 19 interior
  // =====================================================================
  {
    width: 60,
    height: 45,
    layout: normalize([
      // Row 0: top wall
      'WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW',
      // Rows 1-2: north margin (crack area)
      'W..........................................................W',
      'W..P..........b..............................b.........P..W',
      // Rows 3-9: NORTH ROOMS — Storage (left) + Equipment Room (right)
      'W..WWWWWWWWWWWWWWWWWWWWW............WWWWWWWWWWWWWWWWWWWWW..W',
      'W..W...................W............W...................W..W',
      'W..W..F..F..F..F.......W............W..E.....E..H.......W..W',
      'W..W...................W............W...................W..W',
      'W..W..F..F..F..F.......W............W..E.....E..H.......W..W',
      'W..W...................W............W...................W..W',
      'W..WWWWWWWWWWDWWWWWWWWWW............WWWWWWWWWWDWWWWWWWWWW..W',
      // Rows 10-12: corridor
      'W..........................................................W',
      'W......b.......................................b...........W',
      'W..........................................................W',
      // Rows 13-19: MIDDLE ROOMS — Kim's Office (left) + Jordan's Office (right)
      'W..WWWWWWWWWWDWWWWWWWWWW............WWWWWWWWWWDWWWWWWWWWW..W',
      'W..W...................W............W...................W..W',
      'W..W..c..h..........F..W............W..c..h.....c..h....W..W',
      'W..W...................W............W...................W..W',
      'W..W...................W............W...................W..W',
      'W..W..B.............X..W............W..B.............F..W..W',
      'W..W...................W............W...................W..W',
      'W..WWWWWWWWWWDWWWWWWWWWW............WWWWWWWWWWDWWWWWWWWWW..W',
      // Rows 21-23: corridor with amenities
      'W..........................................................W',
      'W....P.......w.........................V.............P.....W',
      'W..........................................................W',
      // Rows 24-30: SOUTH ROOMS — Waiting Room (left) + Break Room (right)
      'W..WWWWWWWWWWDWWWWWWWWWW............WWWWWWWWWWDWWWWWWWWWW..W',
      'W..W...................W............W...................W..W',
      'W..W...h..h..h..h......W............W...c..c............W..W',
      'W..W...................W............W...h..h............W..W',
      'W..W...h..h..h..h......W............W...................W..W',
      'W..W..........P........W............W...V.....w.........W..W',
      'W..W...................W............W...................W..W',
      'W..WWWWWWWWWWDWWWWWWWWWW............WWWWWWWWWWDWWWWWWWWWW..W',
      // Rows 32-34: south corridor
      'W..........................................................W',
      'W......b.......................................b...........W',
      'W..........................................................W',
      // Row 35: lobby top wall (door at col 30)
      'W..WWWWWWWWWWWWWWWWWWWWWWWWWDWWWWWWWWWWWWWWWWWWWWWWWWWWW..W',
      // Rows 36-43: LOBBY
      'W..W....................................................W..W',
      'W..W..RRRRRRRRRRRRRRRRRRRR............................P.W..W',
      'W..W....................................................W..W',
      'W..W..P......b...................P.......b...............W..W',
      'W..W....................................................W..W',
      'W..W......h..h..h..h..h..........h..h..h..h..h..........W..W',
      'W..W......h..h..h..h..h..........h..h..h..h..h..........W..W',
      'W..W....................................................W..W',
      // Row 44: bottom wall
      'WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW',
    ], 60),
    playerStart: { x: 30, y: 40 },
    crackTile: { x: 30, y: 1 },
    npcPlacements: [
      { npcId: 'dana', tileX: 12, tileY: 38 },
      { npcId: 'kim', tileX: 10, tileY: 16 },
      { npcId: 'jordan', tileX: 46, tileY: 16 },
    ],
  },

  // =====================================================================
  // LEVEL 2: The Front Door — Registration Area (70 wide × 50 tall)
  // Layout: Lobby → Waiting/Break → Intake → Registration → Records → Crack
  // Left rooms: 22 interior, Corridor: 16, Right rooms: 22 interior
  // =====================================================================
  {
    width: 70,
    height: 50,
    layout: normalize([
      // Row 0: top wall
      'WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW',
      // Rows 1-2: north margin
      'W....................................................................W',
      'W..P............b....................................b...........P..W',
      // Rows 3-9: NORTH ROOMS — Records (left) + Exam Room (right)
      'W..WWWWWWWWWWWWWWWWWWWWWWWW................WWWWWWWWWWWWWWWWWWWWWWWWW..W',
      'W..W......................W................W......................W..W',
      'W..W..F..F..F..F..F.......W................W..E.....E.....H.......W..W',
      'W..W......................W................W......................W..W',
      'W..W..F..F..F..F..F.......W................W..E.....E.....H.......W..W',
      'W..W......................W................W......................W..W',
      'W..WWWWWWWWWWWWDWWWWWWWWWWW................WWWWWWWWWWWDWWWWWWWWWWWWW..W',
      // Rows 10-12: corridor
      'W....................................................................W',
      'W......b...............................................b...............W',
      'W....................................................................W',
      // Rows 13-19: UPPER ROOMS — Registration Office (left) + Admin (right)
      'W..WWWWWWWWWWWWDWWWWWWWWWWW................WWWWWWWWWWWDWWWWWWWWWWWWW..W',
      'W..W......................W................W......................W..W',
      'W..W..c..h.............F..W................W..c..h..............F..W..W',
      'W..W......................W................W......................W..W',
      'W..W......................W................W......................W..W',
      'W..W..B...............X...W................W..B................X..W..W',
      'W..W......................W................W......................W..W',
      'W..WWWWWWWWWWWWDWWWWWWWWWWW................WWWWWWWWWWWDWWWWWWWWWWWWW..W',
      // Rows 21-23: corridor
      'W....................................................................W',
      'W....P.......w...................................V.............P.....W',
      'W....................................................................W',
      // Rows 24-30: LOWER ROOMS — Intake (left) + Office (right)
      'W..WWWWWWWWWWWWDWWWWWWWWWWW................WWWWWWWWWWWDWWWWWWWWWWWWW..W',
      'W..W......................W................W......................W..W',
      'W..W..c..h..c..h..........W................W..c..h..............F..W..W',
      'W..W......................W................W......................W..W',
      'W..W......................W................W......................W..W',
      'W..W..B.....F.............W................W..B.................X..W..W',
      'W..W......................W................W......................W..W',
      'W..WWWWWWWWWWWWDWWWWWWWWWWW................WWWWWWWWWWWDWWWWWWWWWWWWW..W',
      // Rows 32-34: corridor
      'W....................................................................W',
      'W......b...............................................b...............W',
      'W....................................................................W',
      // Rows 35-41: SOUTH ROOMS — Waiting (left) + Break (right)
      'W..WWWWWWWWWWWWDWWWWWWWWWWW................WWWWWWWWWWWDWWWWWWWWWWWWW..W',
      'W..W......................W................W......................W..W',
      'W..W...h..h..h..h..h......W................W...c..c..c.............W..W',
      'W..W......................W................W...h..h..h.............W..W',
      'W..W...h..h..h..h..h......W................W......................W..W',
      'W..W..........P...........W................W...V.....w.............W..W',
      'W..W......................W................W......................W..W',
      'W..WWWWWWWWWWWWDWWWWWWWWWWW................WWWWWWWWWWWDWWWWWWWWWWWWW..W',
      // Row 43: lobby top wall (door at col 34)
      'W..WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWDWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW..W',
      // Rows 44-48: LOBBY
      'W..W..............................................................W..W',
      'W..W..RRRRRRRRRRRRRRRRRRRRRRRRRRR..........................P.....W..W',
      'W..W..............................................................W..W',
      'W..W..P......b.........................P.......b.................W..W',
      'W..W......h..h..h..h..h..h............h..h..h..h..h..h..........W..W',
      // Row 49: bottom wall
      'WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW',
    ], 70),
    playerStart: { x: 35, y: 47 },
    crackTile: { x: 35, y: 1 },
    npcPlacements: [
      { npcId: 'dana', tileX: 14, tileY: 46 },
      { npcId: 'kim', tileX: 12, tileY: 16 },
      { npcId: 'alex', tileX: 54, tileY: 27 },
    ],
  },

  // =====================================================================
  // LEVEL 3: The Gate — Precert Office (70 wide × 48 tall)
  // Layout: Lobby → Waiting/Records → Review Stations → Fax Room → Crack
  // Same column template as Level 2
  // =====================================================================
  {
    width: 70,
    height: 48,
    layout: normalize([
      // Row 0: top wall
      'WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW',
      // Rows 1-2: north margin
      'W....................................................................W',
      'W..P............b....................................b...........P..W',
      // Rows 3-9: NORTH ROOMS — Appeals Office (left) + Fax Room (right)
      'W..WWWWWWWWWWWWWWWWWWWWWWWW................WWWWWWWWWWWWWWWWWWWWWWWWW..W',
      'W..W......................W................W......................W..W',
      'W..W..c..h.............F..W................W..X..X..X..X..X.......W..W',
      'W..W......................W................W......................W..W',
      'W..W..B................X..W................W..X..X..X..X..X.......W..W',
      'W..W......................W................W......................W..W',
      'W..WWWWWWWWWWWWDWWWWWWWWWWW................WWWWWWWWWWWDWWWWWWWWWWWWW..W',
      // Rows 10-12: corridor
      'W....................................................................W',
      'W......b...............................................b...............W',
      'W....................................................................W',
      // Rows 13-19: MIDDLE ROOMS — Review Stations (left) + Authorization Desk (right)
      'W..WWWWWWWWWWWWDWWWWWWWWWWW................WWWWWWWWWWWDWWWWWWWWWWWWW..W',
      'W..W......................W................W......................W..W',
      'W..W..c..c..c..c..........W................W..c..h..............F..W..W',
      'W..W..h..h..h..h..........W................W......................W..W',
      'W..W......................W................W......................W..W',
      'W..W..B.....B.............W................W..B................X..W..W',
      'W..W......................W................W......................W..W',
      'W..WWWWWWWWWWWWDWWWWWWWWWWW................WWWWWWWWWWWDWWWWWWWWWWWWW..W',
      // Rows 21-23: corridor
      'W....................................................................W',
      'W....P.......w...................................V.............P.....W',
      'W....................................................................W',
      // Rows 24-30: SOUTH ROOMS — Waiting Room (left) + Records (right)
      'W..WWWWWWWWWWWWDWWWWWWWWWWW................WWWWWWWWWWWDWWWWWWWWWWWWW..W',
      'W..W......................W................W......................W..W',
      'W..W...h..h..h..h..h......W................W..F..F..F..F..F.......W..W',
      'W..W......................W................W......................W..W',
      'W..W...h..h..h..h..h......W................W..F..F..F..F..F.......W..W',
      'W..W..........P...........W................W......................W..W',
      'W..W......................W................W......................W..W',
      'W..WWWWWWWWWWWWDWWWWWWWWWWW................WWWWWWWWWWWDWWWWWWWWWWWWW..W',
      // Rows 32-34: corridor
      'W....................................................................W',
      'W......b...............................................b...............W',
      'W....................................................................W',
      // Row 35: lobby top wall
      'W..WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWDWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW..W',
      // Rows 36-46: LOBBY (precert front desk, lots of waiting)
      'W..W..............................................................W..W',
      'W..W..RRRRRRRRRRRRRRRRRRRRRRR..............................P.....W..W',
      'W..W..............................................................W..W',
      'W..W..P......b...........................P.......b...............W..W',
      'W..W..............................................................W..W',
      'W..W......h..h..h..h..h..h............h..h..h..h..h..h..........W..W',
      'W..W......h..h..h..h..h..h............h..h..h..h..h..h..........W..W',
      'W..W..............................................................W..W',
      'W..W..............................................................W..W',
      'W..W......h..h..h..h..h..h............h..h..h..h..h..h..........W..W',
      'W..W..............................................................W..W',
      // Row 47: bottom wall
      'WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW',
    ], 70),
    playerStart: { x: 35, y: 44 },
    crackTile: { x: 35, y: 1 },
    npcPlacements: [
      { npcId: 'dana', tileX: 14, tileY: 38 },
      { npcId: 'martinez', tileX: 12, tileY: 16 },
      { npcId: 'sam', tileX: 54, tileY: 16 },
    ],
  },

  // =====================================================================
  // LEVEL 4: The Copy — HIM Department (75 wide × 52 tall)
  // Layout: Lobby → Waiting/Break → Chart Storage → Coding → Audit → Crack
  // Left rooms: 24 interior, Corridor: 17, Right rooms: 24 interior
  // =====================================================================
  {
    width: 75,
    height: 52,
    layout: normalize([
      // Row 0: top wall
      'WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW',
      // Rows 1-2: north margin
      'W.........................................................................W',
      'W..P..............b........................................b...........P..W',
      // Rows 3-9: NORTH ROOMS — Release of Info (left) + Audit Room (right)
      'W..WWWWWWWWWWWWWWWWWWWWWWWWWW.................WWWWWWWWWWWWWWWWWWWWWWWWWWW..W',
      'W..W........................W.................W........................W..W',
      'W..W..c..h...............F...W.................W..c..h.......B.........W..W',
      'W..W........................W.................W........................W..W',
      'W..W........................W.................W........................W..W',
      'W..W..B..................X...W.................W..F..F..F..F..F..F......W..W',
      'W..WWWWWWWWWWWWDWWWWWWWWWWWWW.................WWWWWWWWWWWWDWWWWWWWWWWWWW..W',
      // Rows 10-12: corridor
      'W.........................................................................W',
      'W......b.....................................................b...........W',
      'W.........................................................................W',
      // Rows 13-19: UPPER ROOMS — Coding Stations (left) + CDI Office (right)
      'W..WWWWWWWWWWWWDWWWWWWWWWWWWW.................WWWWWWWWWWWWDWWWWWWWWWWWWW..W',
      'W..W........................W.................W........................W..W',
      'W..W..c..c..c..c..c.........W.................W..c..h...............F..W..W',
      'W..W..h..h..h..h..h.........W.................W........................W..W',
      'W..W........................W.................W........................W..W',
      'W..W..B.....B...............W.................W..B.................X....W..W',
      'W..W........................W.................W........................W..W',
      'W..WWWWWWWWWWWWDWWWWWWWWWWWWW.................WWWWWWWWWWWWDWWWWWWWWWWWWW..W',
      // Rows 21-23: corridor
      'W.........................................................................W',
      'W....P.......w.......................................V.............P.....W',
      'W.........................................................................W',
      // Rows 24-30: LOWER ROOMS — Chart Storage A (left) + Chart Storage B (right)
      'W..WWWWWWWWWWWWDWWWWWWWWWWWWW.................WWWWWWWWWWWWDWWWWWWWWWWWWW..W',
      'W..W........................W.................W........................W..W',
      'W..W..F..F..F..F..F..F......W.................W..F..F..F..F..F..F......W..W',
      'W..W........................W.................W........................W..W',
      'W..W..F..F..F..F..F..F......W.................W..F..F..F..F..F..F......W..W',
      'W..W........................W.................W........................W..W',
      'W..W........................W.................W........................W..W',
      'W..WWWWWWWWWWWWDWWWWWWWWWWWWW.................WWWWWWWWWWWWDWWWWWWWWWWWWW..W',
      // Rows 32-34: corridor
      'W.........................................................................W',
      'W......b.....................................................b...........W',
      'W.........................................................................W',
      // Rows 35-41: SOUTH ROOMS — Waiting (left) + Break (right)
      'W..WWWWWWWWWWWWDWWWWWWWWWWWWW.................WWWWWWWWWWWWDWWWWWWWWWWWWW..W',
      'W..W........................W.................W........................W..W',
      'W..W...h..h..h..h..h..h.....W.................W...c..c..c..............W..W',
      'W..W........................W.................W...h..h..h..............W..W',
      'W..W...h..h..h..h..h..h.....W.................W........................W..W',
      'W..W..........P.............W.................W...V.....w..............W..W',
      'W..W........................W.................W........................W..W',
      'W..WWWWWWWWWWWWDWWWWWWWWWWWWW.................WWWWWWWWWWWWDWWWWWWWWWWWWW..W',
      // Row 43: lobby top wall
      'W..WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWDWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW..W',
      // Rows 44-50: LOBBY
      'W..W...................................................................W..W',
      'W..W..RRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR............................P.....W..W',
      'W..W...................................................................W..W',
      'W..W..P......b.................................P.......b...............W..W',
      'W..W......h..h..h..h..h..h..h............h..h..h..h..h..h..h..........W..W',
      'W..W......h..h..h..h..h..h..h............h..h..h..h..h..h..h..........W..W',
      'W..W...................................................................W..W',
      // Row 51: bottom wall
      'WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW',
    ], 75),
    playerStart: { x: 37, y: 49 },
    crackTile: { x: 37, y: 1 },
    npcPlacements: [
      { npcId: 'martinez', tileX: 14, tileY: 16 },
      { npcId: 'pat', tileX: 58, tileY: 27 },
    ],
  },

  // =====================================================================
  // LEVEL 5: The Library — Payer Policy Office (65 wide × 45 tall)
  // Layout: Lobby → Waiting/Meeting → Reference Stacks → Archive → Crack
  // Left rooms: 20 interior, Corridor: 15, Right rooms: 20 interior
  // =====================================================================
  {
    width: 65,
    height: 45,
    layout: normalize([
      // Row 0: top wall
      'WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW',
      // Rows 1-2: north margin
      'W...............................................................W',
      'W..P............b................................b.........P..W',
      // Rows 3-9: NORTH ROOMS — Policy Archive (left) + Research Lab (right)
      'W..WWWWWWWWWWWWWWWWWWWWWW...............WWWWWWWWWWWWWWWWWWWWWWW..W',
      'W..W....................W...............W....................W..W',
      'W..W..F..F..F..F..F.....W...............W..c..h.....c..h.....W..W',
      'W..W....................W...............W....................W..W',
      'W..W..F..F..F..F..F.....W...............W..B..............X..W..W',
      'W..W....................W...............W....................W..W',
      'W..WWWWWWWWWWWDWWWWWWWWWW...............WWWWWWWWWWDWWWWWWWWWWW..W',
      // Rows 10-12: corridor
      'W...............................................................W',
      'W......b...........................................b...........W',
      'W...............................................................W',
      // Rows 13-19: MIDDLE ROOMS — Reference Stacks (left) + Reading Room (right)
      'W..WWWWWWWWWWWDWWWWWWWWWW...............WWWWWWWWWWDWWWWWWWWWWW..W',
      'W..W....................W...............W....................W..W',
      'W..W..F..F..F..F..F.....W...............W..c..h.............F..W..W',
      'W..W....................W...............W....................W..W',
      'W..W..F..F..F..F..F.....W...............W....................W..W',
      'W..W....................W...............W..B..............X..W..W',
      'W..W....................W...............W....................W..W',
      'W..WWWWWWWWWWWDWWWWWWWWWW...............WWWWWWWWWWDWWWWWWWWWWW..W',
      // Rows 21-23: corridor
      'W...............................................................W',
      'W....P.......w.............................V.............P.....W',
      'W...............................................................W',
      // Rows 24-30: SOUTH ROOMS — Waiting (left) + Meeting Room (right)
      'W..WWWWWWWWWWWDWWWWWWWWWW...............WWWWWWWWWWDWWWWWWWWWWW..W',
      'W..W....................W...............W....................W..W',
      'W..W...h..h..h..h.......W...............W..RRRRRRRRRRRRRR....W..W',
      'W..W....................W...............W....................W..W',
      'W..W...h..h..h..h.......W...............W...h..h..h..h.......W..W',
      'W..W..........P.........W...............W..........B.........W..W',
      'W..W....................W...............W....................W..W',
      'W..WWWWWWWWWWWDWWWWWWWWWW...............WWWWWWWWWWDWWWWWWWWWWW..W',
      // Rows 32-34: corridor
      'W...............................................................W',
      'W......b...........................................b...........W',
      'W...............................................................W',
      // Row 35: lobby top wall
      'W..WWWWWWWWWWWWWWWWWWWWWWWWWWWWDWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW..W',
      // Rows 36-43: LOBBY
      'W..W.........................................................W..W',
      'W..W..RRRRRRRRRRRRRRRRRRRR.............................P.....W..W',
      'W..W.........................................................W..W',
      'W..W..P......b.....................P.......b.................W..W',
      'W..W.........................................................W..W',
      'W..W......h..h..h..h..h..........h..h..h..h..h..............W..W',
      'W..W......h..h..h..h..h..........h..h..h..h..h..............W..W',
      'W..W.........................................................W..W',
      // Row 44: bottom wall
      'WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW',
    ], 65),
    playerStart: { x: 32, y: 41 },
    crackTile: { x: 32, y: 1 },
    npcPlacements: [
      { npcId: 'dana', tileX: 12, tileY: 38 },
      { npcId: 'sam', tileX: 12, tileY: 16 },
    ],
  },
]

export function getMapForLevel(level: number): MapDef {
  const idx = Math.min(level - 1, HOSPITAL_MAPS.length - 1)
  return HOSPITAL_MAPS[idx]
}
