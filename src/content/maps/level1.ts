// Level 1 — Orientation: North Wing of Mercy General.
//
// Layout intent:
//   - Player spawns inside a wide LOBBY at the south.
//   - L-shaped CORRIDOR exits the lobby's north door, runs north along the
//     west side, then bends east toward the MAIN HUB at the top-center.
//     The bend creates a natural T-junction where Patient Services and
//     Registration branch off.
//   - ELIGIBILITY is a small kiosk reached only through Registration —
//     a sub-room, not a peer.
//   - PRIOR AUTH GATE sits east of the Main Hub behind a LOCKED door —
//     visible foreshadowing for Level 3.
//   - The GAP (Waiting Room portal) is in the Main Hub.
//
// Every room has a single door (except Main Hub, which has the southern
// staff entrance plus the locked east door). Every dead-end terminates
// in either a locked feature or content.

import { buildMapLayout, type MapDef } from '../mapBuilder'

const WIDTH = 60
const HEIGHT = 46

// Anchors used by both layout and MapDef metadata.
const MAIN_HUB     = { x: 20, y: 3,  w: 18, h: 10 } // interior 16×8
const PRIOR_AUTH   = { x: 37, y: 3,  w: 14, h: 10 } // shares east wall of Main Hub
const PATIENT_SVC  = { x: 2,  y: 17, w: 12, h: 8  }
const REGISTRATION = { x: 15, y: 17, w: 22, h: 8  }
const ELIGIBILITY  = { x: 24, y: 24, w: 10, h: 6  } // hangs off Registration's south wall
// Lobby: cozier than the original 52×14 cavern. Per user feedback the
// starting room read as too big — it's the player's first impression
// and should feel like a room you stand IN, not a corridor you cross.
// The corridor still lands at x=14, so the door offset of 10 keeps
// the geometry connected.
const LOBBY        = { x: 4,  y: 32, w: 26, h: 10 }

// Door world-coords (used to plan corridor endpoints).
const HUB_SOUTH_DOOR    = { x: MAIN_HUB.x + 10,    y: MAIN_HUB.y + MAIN_HUB.h - 1 } // (30, 12)
const LOBBY_NORTH_DOOR  = { x: LOBBY.x + 10,        y: LOBBY.y }                    // (14, 32)
const CORRIDOR_BEND     = { x: LOBBY_NORTH_DOOR.x,  y: HUB_SOUTH_DOOR.y + 1 }       // (14, 13)

const layout = buildMapLayout({
  width: WIDTH,
  height: HEIGHT,
  background: 'W',
  rooms: [
    {
      id: 'mainHub',
      ...MAIN_HUB,
      doors: [
        { side: 'S', offset: 10 },               // bottom door to corridor
        { side: 'E', offset: 5, locked: true },  // locked door east → Prior Auth
      ],
      items: [
        { dx: 7,  dy: 3, ch: 'w' },  // fountain (water cooler stand-in)
        { dx: 2,  dy: 1, ch: 'P' },
        { dx: 13, dy: 1, ch: 'P' },
        { dx: 2,  dy: 6, ch: 'P' },
        { dx: 13, dy: 6, ch: 'P' },
        { dx: 5,  dy: 5, ch: 'b' },  // signage
      ],
    },
    {
      id: 'priorAuth',
      ...PRIOR_AUTH,
      // West door is shared with Main Hub's east locked door — same world
      // tile. Re-declaring it keeps the room self-describing; the builder
      // will overwrite the same cell with 'L', which is idempotent.
      doors: [{ side: 'W', offset: 5, locked: true }],
      items: [
        { dx: 2, dy: 2, ch: 'c' }, { dx: 2, dy: 3, ch: 'h' },
        { dx: 5, dy: 2, ch: 'c' }, { dx: 5, dy: 3, ch: 'h' },
        { dx: 8, dy: 6, ch: 'X' }, // fax
        { dx: 1, dy: 6, ch: 'F' },
      ],
    },
    {
      id: 'patientServices',
      ...PATIENT_SVC,
      doors: [{ side: 'E', offset: 3 }],
      items: [
        { dx: 1, dy: 1, ch: 'c' }, { dx: 1, dy: 2, ch: 'h' },
        { dx: 5, dy: 1, ch: 'B' },
        { dx: 8, dy: 5, ch: 'F' },
        { dx: 3, dy: 5, ch: 'P' },
      ],
    },
    {
      id: 'registration',
      ...REGISTRATION,
      doors: [
        { side: 'W', offset: 3 },                                                  // west into corridor
        { side: 'S', offset: ELIGIBILITY.x + 4 - REGISTRATION.x },                 // south into Eligibility
      ],
      items: [
        { dx: 1, dy: 1, ch: 'R' }, { dx: 2, dy: 1, ch: 'R' }, { dx: 3, dy: 1, ch: 'R' },
        { dx: 4, dy: 1, ch: 'R' }, { dx: 5, dy: 1, ch: 'R' }, { dx: 6, dy: 1, ch: 'R' },
        { dx: 1, dy: 5, ch: 'c' }, { dx: 1, dy: 6, ch: 'h' },
        { dx: 4, dy: 5, ch: 'c' }, { dx: 4, dy: 6, ch: 'h' },
        { dx: 14, dy: 1, ch: 'B' },
      ],
    },
    {
      id: 'eligibility',
      ...ELIGIBILITY,
      // North door shared with Registration's south door — same world tile.
      doors: [{ side: 'N', offset: 4 }],
      items: [
        { dx: 1, dy: 1, ch: 'c' }, { dx: 1, dy: 2, ch: 'h' },
        { dx: 4, dy: 1, ch: 'X' }, // fax / kiosk terminal
        { dx: 6, dy: 3, ch: 'F' },
      ],
    },
    {
      id: 'lobby',
      ...LOBBY,
      doors: [{ side: 'N', offset: 10 }],
      // 70s-Lynch lobby — packed warmer + denser than the old cavern.
      // Reuses existing prop chars (lamps stand-in: water-cooler 'w';
      // side tables: 'c'; framed art: 'b'). The HospitalScene tints
      // give the room its register; the props give it its density.
      items: [
        // Counter spans three columns west of the door
        { dx: 1, dy: 1, ch: 'R' }, { dx: 2, dy: 1, ch: 'R' }, { dx: 3, dy: 1, ch: 'R' },
        // Bulletin board + a small framed print north wall
        { dx: 5,  dy: 1, ch: 'b' },
        { dx: 18, dy: 1, ch: 'b' }, // second bulletin (like a print)
        // Plants flanking — north corners + by the door
        { dx: 7,  dy: 1, ch: 'P' },
        { dx: 12, dy: 1, ch: 'P' }, // by door
        { dx: 22, dy: 1, ch: 'P' },
        // Side tables (with magazines / ashtrays — implied)
        { dx: 5,  dy: 4, ch: 'c' },
        { dx: 19, dy: 4, ch: 'c' },
        // Two rows of chairs, denser than before; centered on the room
        { dx: 7,  dy: 4, ch: 'h' }, { dx: 9,  dy: 4, ch: 'h' }, { dx: 11, dy: 4, ch: 'h' },
        { dx: 14, dy: 4, ch: 'h' }, { dx: 16, dy: 4, ch: 'h' },
        { dx: 7,  dy: 6, ch: 'h' }, { dx: 9,  dy: 6, ch: 'h' }, { dx: 11, dy: 6, ch: 'h' },
        { dx: 14, dy: 6, ch: 'h' }, { dx: 16, dy: 6, ch: 'h' },
        // South wall amenities — vending, water cooler ("lamp"), bulletin
        { dx: 2,  dy: 7, ch: 'V' },
        { dx: 22, dy: 7, ch: 'w' }, // doubles as a tall lamp visually with the warm tint
        { dx: 24, dy: 7, ch: 'P' }, // corner plant
        { dx: 13, dy: 8, ch: 'b' }, // framed print over a chair row
      ],
    },
  ],
  corridors: [
    // L-shaped staff corridor: lobby door → north → bend east → Main Hub door.
    {
      points: [
        [LOBBY_NORTH_DOOR.x, LOBBY_NORTH_DOOR.y - 1], // (14, 29) — just north of lobby door
        [CORRIDOR_BEND.x,    CORRIDOR_BEND.y],        // (14, 13) — bend point
        [HUB_SOUTH_DOOR.x,   CORRIDOR_BEND.y],        // (30, 13) — just south of hub door
      ],
      width: 1,
    },
    // Short stub at the T-junction so doors at (13,20) and (15,20) connect
    // to the corridor on both sides; the corridor at x=14 already covers
    // the door tile gap.
  ],
})

export const LEVEL_1_MAP: MapDef = {
  width: WIDTH,
  height: HEIGHT,
  layout,
  // Player spawns near the south of the lobby, looking up toward the chairs.
  playerStart: { x: LOBBY.x + 10, y: LOBBY.y + LOBBY.h - 3 },
  // Gap inside Main Hub, near the fountain.
  gapTile: { x: MAIN_HUB.x + 8, y: MAIN_HUB.y + 5 },
  npcPlacements: [
    // Anjali waits in the lobby with her ER bill — first NPC the player
    // sees on entry. She hands off the level-1 intro case.
    { npcId: 'anjali', tileX: LOBBY.x + 8,        tileY: LOBBY.y + 4 },
    { npcId: 'dana',   tileX: PATIENT_SVC.x + 6,  tileY: PATIENT_SVC.y + 4 },
    { npcId: 'kim',    tileX: REGISTRATION.x + 4, tileY: REGISTRATION.y + 4 },
    { npcId: 'jordan', tileX: ELIGIBILITY.x + 5,  tileY: ELIGIBILITY.y + 3 },
  ],
}
