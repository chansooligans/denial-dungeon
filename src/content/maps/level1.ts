// Hospital floor plan. Used for every level — different rooms become
// "active" depending on currentLevel via NPC placement filters and
// the per-level dialogue overrides in content/dialogue.ts.
//
// Layout intent:
//
//   NORTH (level 1-3 — orientation, registration, prior auth)
//     - LOBBY at the south-center (player spawn).
//     - L-shaped CORRIDOR exits north toward the MAIN HUB at the top.
//     - PATIENT SVC and REGISTRATION branch off the corridor.
//     - ELIGIBILITY hangs off Registration (sub-room).
//     - PRIOR AUTH GATE sits east of the Main Hub behind a LOCKED door.
//
//   SOUTH WING (level 4-10 — added later, expands as the player learns
//   more of the hospital)
//     - HIM (Health Information Mgmt / coding)
//     - BILLING (claim queue / clearinghouse)
//     - PFS (Patient Financial Services / phone bank)
//     - AUDIT CONFERENCE ROOM (the boss room — taller than the others)
//
// All wings share a single map so the player feels the hospital as one
// place. Per-level NPC placements (`levels` filter) put the right
// staffer in the right room for each level.

import { buildMap, type MapDef } from '../mapBuilder'

const WIDTH = 60
const HEIGHT = 72  // bumped from 46 to fit the south wing

// === North wing — level 1-3 ===
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

// === South wing — level 4-10 ===
const HIM      = { x: 4,  y: 50, w: 14, h: 10 } // coding / CDI floor
const BILLING  = { x: 22, y: 50, w: 14, h: 10 } // clearinghouse / claim queue
const PFS      = { x: 40, y: 50, w: 16, h: 10 } // patient financial services / phones
const AUDIT    = { x: 18, y: 62, w: 28, h: 8  } // conference room — boss level

// Door world-coords (used to plan corridor endpoints).
const HUB_SOUTH_DOOR    = { x: MAIN_HUB.x + 10,    y: MAIN_HUB.y + MAIN_HUB.h - 1 } // (30, 12)
const LOBBY_NORTH_DOOR  = { x: LOBBY.x + 10,        y: LOBBY.y }                    // (14, 32)
const LOBBY_SOUTH_DOOR  = { x: LOBBY.x + 14,        y: LOBBY.y + LOBBY.h - 1 }      // (18, 41)
const CORRIDOR_BEND     = { x: LOBBY_NORTH_DOOR.x,  y: HUB_SOUTH_DOOR.y + 1 }       // (14, 13)

// South-wing corridor anchors.
const SW_TROUGH_Y       = 49 // east-west corridor running just north of the south-wing rooms
const SW_BAY_Y          = 60 // shorter corridor between the upper south-wing rooms and AUDIT

const { layout, tileMeta } = buildMap({
  width: WIDTH,
  height: HEIGHT,
  background: 'W',
  rooms: [
    // ===== North wing =====
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
      // North to the corridor / hospital interior, south to the new wing.
      doors: [
        { side: 'N', offset: 10 },
        { side: 'S', offset: 14 },
      ],
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
        // Two rows of patient chairs flanking Chloe's intern station.
        // Chloe's desk sits at (dx=9, dy=5) — between the rows on
        // the player's spawn column — with her chair directly south
        // at (dx=9, dy=6). The patient row at dy=6 leaves dx=9 open
        // so it reads as "her chair," not part of public seating.
        { dx: 7,  dy: 4, ch: 'h' }, { dx: 9,  dy: 4, ch: 'h' }, { dx: 11, dy: 4, ch: 'h' },
        { dx: 14, dy: 4, ch: 'h' }, { dx: 16, dy: 4, ch: 'h' },
        { dx: 9,  dy: 5, ch: 'c' }, // Chloe's desk
        { dx: 7,  dy: 6, ch: 'h' },                              { dx: 11, dy: 6, ch: 'h' },
        { dx: 14, dy: 6, ch: 'h' }, { dx: 16, dy: 6, ch: 'h' },
        { dx: 9,  dy: 6, ch: 'h' }, // Chloe's chair (player spawns here)
        // South wall amenities — vending, water cooler ("lamp"), bulletin.
        { dx: 2,  dy: 7, ch: 'V' },
        { dx: 22, dy: 7, ch: 'w' }, // doubles as a tall lamp visually with the warm tint
        { dx: 24, dy: 7, ch: 'P' }, // corner plant
      ],
    },

    // ===== South wing =====
    {
      id: 'him',
      ...HIM,
      doors: [{ side: 'N', offset: 7 }],
      // Coding / CDI: monitors, code books, charts.
      items: [
        { dx: 1, dy: 1, ch: 'c' }, { dx: 1, dy: 2, ch: 'h' },
        { dx: 4, dy: 1, ch: 'c' }, { dx: 4, dy: 2, ch: 'h' },
        { dx: 8, dy: 1, ch: 'c' }, { dx: 8, dy: 2, ch: 'h' },
        { dx: 1, dy: 5, ch: 'F' }, { dx: 4, dy: 5, ch: 'F' }, // file cabinets w/ chart binders
        { dx: 8, dy: 5, ch: 'B' }, // whiteboard with code-of-the-week
        { dx: 11, dy: 1, ch: 'P' },
        { dx: 11, dy: 7, ch: 'P' },
      ],
    },
    {
      id: 'billing',
      ...BILLING,
      doors: [{ side: 'N', offset: 7 }],
      // Clearinghouse / claim queue: terminals + scrubber screens.
      items: [
        { dx: 1, dy: 1, ch: 'c' }, { dx: 1, dy: 2, ch: 'h' },
        { dx: 4, dy: 1, ch: 'c' }, { dx: 4, dy: 2, ch: 'h' },
        { dx: 8, dy: 1, ch: 'c' }, { dx: 8, dy: 2, ch: 'h' },
        { dx: 1, dy: 5, ch: 'X' }, { dx: 4, dy: 5, ch: 'X' }, // fax / EDI terminals
        { dx: 8, dy: 5, ch: 'B' }, // claim-queue board
        { dx: 11, dy: 1, ch: 'F' },
        { dx: 11, dy: 7, ch: 'P' },
      ],
    },
    {
      id: 'pfs',
      ...PFS,
      doors: [{ side: 'N', offset: 8 }],
      // Patient Financial Services: phone bank + paperwork mountain.
      items: [
        { dx: 1, dy: 1, ch: 'c' }, { dx: 1, dy: 2, ch: 'h' },
        { dx: 4, dy: 1, ch: 'c' }, { dx: 4, dy: 2, ch: 'h' },
        { dx: 8, dy: 1, ch: 'c' }, { dx: 8, dy: 2, ch: 'h' },
        { dx: 12, dy: 1, ch: 'c' }, { dx: 12, dy: 2, ch: 'h' },
        { dx: 1, dy: 5, ch: 'B' }, // hold-time / call-volume board
        { dx: 5, dy: 5, ch: 'F' },
        { dx: 9, dy: 5, ch: 'w' },
        { dx: 13, dy: 7, ch: 'P' },
      ],
    },
    {
      id: 'audit',
      ...AUDIT,
      // North door connects to a stub corridor running south from the
      // south-wing trough. Door is offset to land in the gap between
      // BILLING (ends at x=35) and PFS (starts at x=40) so the
      // connector doesn't have to puncture another room's wall.
      doors: [{ side: 'N', offset: 19 }],
      // Conference room: long table (chairs flanking), whiteboard at
      // the head, a single plant, a water cooler. Sparse — the menace
      // is the empty space and the auditors who haven't arrived yet.
      items: [
        // Long row of conference chairs, north side
        { dx: 4,  dy: 2, ch: 'h' }, { dx: 7,  dy: 2, ch: 'h' },
        { dx: 10, dy: 2, ch: 'h' }, { dx: 13, dy: 2, ch: 'h' },
        { dx: 16, dy: 2, ch: 'h' }, { dx: 19, dy: 2, ch: 'h' },
        { dx: 22, dy: 2, ch: 'h' },
        // The conference table — a dense row of desks 'c' as a stand-in.
        { dx: 4,  dy: 3, ch: 'c' }, { dx: 5,  dy: 3, ch: 'c' },
        { dx: 6,  dy: 3, ch: 'c' }, { dx: 7,  dy: 3, ch: 'c' },
        { dx: 8,  dy: 3, ch: 'c' }, { dx: 9,  dy: 3, ch: 'c' },
        { dx: 10, dy: 3, ch: 'c' }, { dx: 11, dy: 3, ch: 'c' },
        { dx: 12, dy: 3, ch: 'c' }, { dx: 13, dy: 3, ch: 'c' },
        { dx: 14, dy: 3, ch: 'c' }, { dx: 15, dy: 3, ch: 'c' },
        { dx: 16, dy: 3, ch: 'c' }, { dx: 17, dy: 3, ch: 'c' },
        { dx: 18, dy: 3, ch: 'c' }, { dx: 19, dy: 3, ch: 'c' },
        { dx: 20, dy: 3, ch: 'c' }, { dx: 21, dy: 3, ch: 'c' },
        { dx: 22, dy: 3, ch: 'c' },
        // South side of the table — chairs facing north
        { dx: 4,  dy: 4, ch: 'h' }, { dx: 7,  dy: 4, ch: 'h' },
        { dx: 10, dy: 4, ch: 'h' }, { dx: 13, dy: 4, ch: 'h' },
        { dx: 16, dy: 4, ch: 'h' }, { dx: 19, dy: 4, ch: 'h' },
        { dx: 22, dy: 4, ch: 'h' },
        // Whiteboard at the west head, water cooler east, plant in corner
        { dx: 1,  dy: 3, ch: 'B' },
        { dx: 25, dy: 3, ch: 'w' },
        { dx: 25, dy: 5, ch: 'P' },
        { dx: 1,  dy: 5, ch: 'F' }, // a single audit binder cabinet
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
    // South-wing trough: a single east-west corridor at y=49 that
    // every south-wing room's north door opens onto, plus the
    // vertical run from the lobby's new south door down to it.
    {
      points: [
        [LOBBY_SOUTH_DOOR.x, LOBBY_SOUTH_DOOR.y + 1], // (18, 42) — just south of lobby south door
        [LOBBY_SOUTH_DOOR.x, SW_TROUGH_Y],             // (18, 49) — bend
      ],
      width: 1,
    },
    {
      points: [
        [HIM.x + 7,    SW_TROUGH_Y], // east-west cross-corridor, anchored to HIM's door col
        [PFS.x + 8,    SW_TROUGH_Y], // ... extends to PFS's door col
      ],
      width: 1,
    },
    // Stub from the trough down to AUDIT's north door (audit lives in
    // its own bay one row below the upper south-wing rooms). Routes
    // through the gap between BILLING and PFS so it doesn't punch
    // through anyone else's wall.
    {
      points: [
        [AUDIT.x + 19, SW_TROUGH_Y],     // (37, 49) — junction with trough
        [AUDIT.x + 19, AUDIT.y - 1],     // (37, 61) — just north of AUDIT door
      ],
      width: 1,
    },
  ],
})

export const LEVEL_1_MAP: MapDef = {
  width: WIDTH,
  height: HEIGHT,
  layout,
  tileMeta,
  // Player spawns near the south of the lobby, looking up toward the chairs.
  playerStart: { x: LOBBY.x + 10, y: LOBBY.y + LOBBY.h - 3 },
  // Minimap labels — abbreviated by default, full names on click.
  rooms: [
    { name: 'MAIN HUB',         shortName: 'HUB',  ...MAIN_HUB },
    { name: 'PRIOR AUTH',       shortName: 'AUTH', ...PRIOR_AUTH },
    { name: 'PATIENT SERVICES', shortName: 'PT',   ...PATIENT_SVC },
    { name: 'REGISTRATION',     shortName: 'REG',  ...REGISTRATION },
    { name: 'ELIGIBILITY',      shortName: 'ELIG', ...ELIGIBILITY },
    { name: 'LOBBY',            shortName: 'LBY',  ...LOBBY },
    { name: 'HIM / CODING',     shortName: 'HIM',  ...HIM },
    { name: 'BILLING',          shortName: 'BIL',  ...BILLING },
    { name: 'PFS / PHONES',     shortName: 'PFS',  ...PFS },
    { name: 'AUDIT CONFERENCE', shortName: 'AUD',  ...AUDIT },
  ],
  npcPlacements: [
    // === Always-present (level-agnostic) placements ===
    // Anjali walks in during the level-1 opening sequence and lands
    // here — directly on the player's column, three tiles north of
    // spawn, between the lobby chair rows. (The opening sequence
    // animates her in from the lobby's north door at runtime.)
    { npcId: 'anjali',   tileX: LOBBY.x + 10,        tileY: LOBBY.y + 4 },
    { npcId: 'kim',      tileX: REGISTRATION.x + 4,  tileY: REGISTRATION.y + 4 },
    { npcId: 'martinez', tileX: MAIN_HUB.x + 14,     tileY: MAIN_HUB.y + 4 },

    // === Per-level placements ===
    // Dana — Patient Services for L1-9, then in the Audit conference
    // room for the L10 boss.
    { npcId: 'dana', tileX: PATIENT_SVC.x + 6, tileY: PATIENT_SVC.y + 4,
      levels: [1, 2, 3, 4, 5, 6, 7, 8, 9] },
    { npcId: 'dana', tileX: AUDIT.x + 14, tileY: AUDIT.y + 5,
      levels: [10] },

    // Jordan — Eligibility for L1-7 (covers the early-game
    // patient-side beats), then PFS for L8 (where her phone-bank
    // case lives).
    { npcId: 'jordan', tileX: ELIGIBILITY.x + 5, tileY: ELIGIBILITY.y + 3,
      levels: [1, 2, 3, 4, 5, 6, 7] },
    { npcId: 'jordan', tileX: PFS.x + 6, tileY: PFS.y + 5,
      levels: [8, 9, 10] },

    // Pat — Registration for L1-3 (close to the coding workflow at
    // the front), HIM for L4+ (where they actually work).
    { npcId: 'pat', tileX: REGISTRATION.x + 14, tileY: REGISTRATION.y + 4,
      levels: [1, 2, 3] },
    { npcId: 'pat', tileX: HIM.x + 5, tileY: HIM.y + 5,
      levels: [4, 5, 6, 7, 8, 9, 10] },

    // Alex — Main Hub by default, Billing on L6 (where the swarm
    // case lives).
    { npcId: 'alex', tileX: MAIN_HUB.x + 4, tileY: MAIN_HUB.y + 4,
      levels: [1, 2, 3, 4, 5, 7, 8, 9, 10] },
    { npcId: 'alex', tileX: BILLING.x + 5, tileY: BILLING.y + 5,
      levels: [6] },

    // Sam — Patient Services by default (L3 / L5 / L7 cases),
    // never moves out (the south wing all goes through her in
    // late-game too via Reaper).
    { npcId: 'sam', tileX: PATIENT_SVC.x + 9, tileY: PATIENT_SVC.y + 4 },

    // L10 audit team — seated around the conference table on the
    // north row of chairs (AUDIT interior dy=2, world y=64). Dana
    // sits across the room near the south wall to hand off the case.
    { npcId: 'auditor_carl',   tileX: AUDIT.x + 7,  tileY: AUDIT.y + 2, levels: [10] },
    { npcId: 'auditor_chen',   tileX: AUDIT.x + 13, tileY: AUDIT.y + 2, levels: [10] },
    { npcId: 'auditor_rivera', tileX: AUDIT.x + 19, tileY: AUDIT.y + 2, levels: [10] },
    { npcId: 'auditor_eddi',   tileX: AUDIT.x + 22, tileY: AUDIT.y + 2, levels: [10] },

    // === Ambient populace — atmosphere NPCs spread across the
    //     hospital. `ambient: true` bypasses the per-level
    //     npcsActive filter so they appear at every level. Each
    //     gets a single one-line dialogue (see `dialogue.ts`).
    //     Positions chosen for thematic fit, not specific to any
    //     case. Tweak as the world fills in. ===

    // Lobby — entrance + waiting area
    { npcId: 'walter',        tileX: LOBBY.x + 18, tileY: LOBBY.y + 5, ambient: true },
    { npcId: 'noah',          tileX: LOBBY.x + 14, tileY: LOBBY.y + 7, ambient: true },
    { npcId: 'officer_reyes', tileX: LOBBY.x + 22, tileY: LOBBY.y + 2, ambient: true },
    { npcId: 'dev',           tileX: LOBBY.x + 5,  tileY: LOBBY.y + 8, ambient: true },

    // Patient Services — clinical-adjacent staff
    { npcId: 'liana',         tileX: PATIENT_SVC.x + 3, tileY: PATIENT_SVC.y + 5, ambient: true },

    // Main Hub — physician floor (Martinez + Alex are here for
    // story; ambient docs sit further into the room)
    { npcId: 'dr_priya',      tileX: MAIN_HUB.x + 9,  tileY: MAIN_HUB.y + 6, ambient: true },
    { npcId: 'dr_ethan',      tileX: MAIN_HUB.x + 14, tileY: MAIN_HUB.y + 8, ambient: true },

    // Billing — back-office facilities
    { npcId: 'joe',           tileX: BILLING.x + 5,  tileY: BILLING.y + 5, ambient: true },
  ],
}
