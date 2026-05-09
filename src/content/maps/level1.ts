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
//   SOUTH WING (level 4-10)
//     - HIM (Health Information Mgmt / coding)
//     - BILLING (claim queue / clearinghouse)
//     - PFS (Patient Financial Services / phone bank)
//   (AUDIT used to live here — moved up to the second floor as part
//   of the "summoned to the top" reading: above = decisions, ground =
//   labor, below = where things go to die.)
//
//   EAST WING (atmosphere — explorable rooms, no level-specific cases)
//     - RADIOLOGY (imaging — referenced in some L4+ dialogue)
//     - PHARMACY  (formulary / dispense)
//     - MEDICAL RECORDS (chart room — overflow from HIM)
//   The east wing is reached via Registration's east door and a short
//   corridor to a vertical trunk that runs the length of the wing.
//
//   OUTDOOR — parking lot off the lobby. Reached via an 'O' teleport
//   tile inside the lobby (not a continuous corridor). Sparse for now;
//   to be filled with ambient NPCs (smoker, taxi-cab, security) later.
//
//   SECOND FLOOR — exec / compliance / payer interface.
//     - LANDING_2F (small foyer where the stairs deposit you)
//     - AUDIT (relocated)
//     - PAYER (the Aetna/Anthem-equivalent office; the missing fifth
//             actor from the intro's "Doctors document. Coders
//             translate. Billers submit. Payers decide. Patients pay.")
//     - COMPLIANCE (placeholder; HIPAA / audit binders / dragon at the
//             top of the tower)
//   Reached via 'S' teleport in Main Hub. Floor 2 is laid out as a
//   separate region of the same big tilemap; teleport-tile pairs in
//   MapDef.stairs handle the fade-and-snap.
//
// All areas share a single map so the player feels Mercy General as
// one place — the WR layer auto-mirrors any expansion since both
// scenes consume the same MapDef. Per-level NPC placements (`levels`
// filter) put the right staffer in the right room for each level.

import { buildMap, applyTileOverrides, type MapDef } from '../mapBuilder'

const WIDTH = 80   // bumped from 66 to fit outdoor + payer office
const HEIGHT = 130 // bumped from 72 to fit outdoor + second floor

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

// === East wing — atmosphere rooms ===
// Three rooms stacked vertically east of Registration. Each opens west
// onto a single trunk corridor at x=50; the trunk connects to
// Registration's east wall via a short east-running spur.
const RADIOLOGY   = { x: 51, y: 15, w: 14, h: 10 } // imaging suite
const PHARMACY    = { x: 51, y: 27, w: 14, h: 8  } // dispense / formulary
const MED_RECORDS = { x: 51, y: 37, w: 14, h: 10 } // chart room

// === South wing — level 4-9 (AUDIT moved to second floor) ===
const HIM      = { x: 4,  y: 50, w: 14, h: 10 } // coding / CDI floor
const BILLING  = { x: 22, y: 50, w: 14, h: 10 } // clearinghouse / claim queue
const PFS      = { x: 40, y: 50, w: 16, h: 10 } // patient financial services / phones

// === West wing — north of Patient Services, west of MAIN_HUB.
//     Reached by extending the main north-south corridor past the
//     bend, then branching west. Three rooms cluster around that
//     branch:
//   - CAFETERIA: public dining area in the NW corner (big).
//   - KITCHEN:   back-of-house prep room below cafeteria. Used to
//                be a generic LAB before — kitchen reads more
//                naturally next to a cafeteria + lounge.
//   - LOUNGE:    staff break room east of the kitchen.
//
// Cafeteria expanded from 12×8 → 12×10 by pushing its south wall
// down two rows; kitchen + lounge shrunk from h=6 → h=4 to make
// room. Cross-corridor moved from y=10 → y=12 to keep the topology.
const CAFETERIA = { x: 2,  y: 2,  w: 12, h: 10 } // 10×8 interior
const KITCHEN   = { x: 2,  y: 13, w: 6,  h: 4  } // 4×2 interior
const LOUNGE    = { x: 8,  y: 13, w: 6,  h: 4  } // 4×2 interior

// === Outdoor — parking lot, reached via 'O' teleport from the lobby ===
const OUTDOOR  = { x: 4,  y: 65, w: 50, h: 22 } // big sparse exterior

// === Stairwells — small dedicated rooms holding the 'S' teleport
//     tiles, symmetric on both floors. STAIRWELL_1F is an annex on
//     Main Hub's west wall (5×6, shared east-west wall with Main
//     Hub via a connecting door). LANDING_2F is the equivalent on
//     the second floor — small foyer that opens onto the 2F
//     corridor leading to AUDIT / PAYER / COMPLIANCE.
const STAIRWELL_1F = { x: 16, y: 4,  w: 5,  h: 6  } // 1F stair annex
// === Second floor — reached via 'S' teleport from STAIRWELL_1F ===
// Spatially placed far south of the ground floor so the same big
// tilemap holds both. The player never walks the gap; teleport tiles
// in MapDef.stairs fade-and-snap.
const LANDING_2F  = { x: 30, y: 94,  w: 8,  h: 5  } // small stair foyer
const AUDIT       = { x: 4,  y: 100, w: 28, h: 10 } // relocated from y=62
const PAYER       = { x: 36, y: 100, w: 18, h: 10 } // Aetna/Anthem-equivalent office
const COMPLIANCE  = { x: 18, y: 113, w: 28, h: 10 } // HIPAA / binders / boss-prep

// Door world-coords (used to plan corridor endpoints).
const HUB_SOUTH_DOOR    = { x: MAIN_HUB.x + 10,    y: MAIN_HUB.y + MAIN_HUB.h - 1 } // (30, 12)
const LOBBY_NORTH_DOOR  = { x: LOBBY.x + 10,        y: LOBBY.y }                    // (14, 32)
const LOBBY_SOUTH_DOOR  = { x: LOBBY.x + 14,        y: LOBBY.y + LOBBY.h - 1 }      // (18, 41)
const CORRIDOR_BEND     = { x: LOBBY_NORTH_DOOR.x,  y: HUB_SOUTH_DOOR.y + 1 }       // (14, 13)

// South-wing corridor anchor (audit stub gone with audit; trough still
// connects HIM/BILLING/PFS).
const SW_TROUGH_Y       = 49 // east-west corridor running just north of the south-wing rooms

// === Stair / exit teleport pairs ===
// Each entry is one-way; pair them to make round-trips. The 'S' / 'O'
// glyphs render as tinted floors and trigger teleport in
// HospitalScene.tryMove.
// Stair tile lives in STAIRWELL_1F (interior dx=1, dy=2 → world
// (18, 7)) — moved out of Main Hub once we gave it a dedicated
// stairwell room. The 2F landing tile stays where it was at (33, 96).
const STAIR_HUB_TO_2F   = { from: { x: 18, y: 7  }, to: { x: 33, y: 96 }, label: '↑ 2F' }
const STAIR_2F_TO_HUB   = { from: { x: 33, y: 96 }, to: { x: 18, y: 7  }, label: '↓ 1F' }
// Lobby ↔ outdoor parking-lot teleport. The lobby endpoint sits on
// the *west* interior column (LOBBY dx=1, dy=4 → world (5, 36)) so
// the parking-lot entrance reads as a side door, not a south
// corridor (the south door already leads to the south wing). The
// outdoor arrival tile stays where it was — geographically the
// parking lot is south of everything else, but the teleport hides
// that distance.
const EXIT_LOBBY_OUT    = { from: { x: 5,  y: 36 }, to: { x: 16, y: 67 }, label: '← EXIT' }
const EXIT_OUT_LOBBY    = { from: { x: 16, y: 67 }, to: { x: 5,  y: 36 }, label: '← LOBBY' }

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
        { side: 'W', offset: 4 },                // west door → STAIRWELL_1F
      ],
      items: [
        { dx: 7,  dy: 3, ch: 'w' },  // fountain (water cooler stand-in)
        { dx: 2,  dy: 1, ch: 'P' },
        { dx: 13, dy: 1, ch: 'P' },
        { dx: 2,  dy: 6, ch: 'P' },
        { dx: 13, dy: 6, ch: 'P' },
        { dx: 5,  dy: 5, ch: 'b' },  // signage
        // (Stair-up tile moved out of Main Hub into STAIRWELL_1F —
        // see the stairwell room def.)
      ],
    },
    {
      id: 'stairwell1F',
      ...STAIRWELL_1F,
      // East door at offset 3 → world (20, 7). Same tile as the
      // Main Hub west door at offset 4 — they share the boundary
      // wall column. The builder is idempotent on this overlap.
      doors: [{ side: 'E', offset: 3 }],
      // Inside: the 'S' stair tile at the center, plus a couple of
      // plants for atmosphere. The stair tile is paired with the
      // 2F landing's 'S' in stairs[] above. Walking onto it fade-
      // and-snaps to LANDING_2F.
      items: [
        // Center: stair tile. Interior dx=1, dy=2 → world (18, 7),
        // matching STAIR_HUB_TO_2F.from.
        { dx: 1, dy: 2, ch: 'S' },
        // Stairwell is 5×6 (interior 3×4) — valid item dx is 1..2,
        // dy is 1..3. Two flanking plants for atmosphere.
        { dx: 1, dy: 1, ch: 'P' },
        { dx: 2, dy: 3, ch: 'P' },
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

    // ===== West wing — north of Patient Services =====
    {
      id: 'cafeteria',
      ...CAFETERIA,
      // East door at offset 2 → world (13, 4). Connects to the
      // main north-south corridor (extended north from the bend
      // at (14, 13) up to (14, 4)).
      doors: [{ side: 'E', offset: 2 }],
      // Public dining area. Service counter (R) on the north
      // interior row, three rows of tables (1 added when the
      // room grew from h=8 → h=10), vending + water cooler on
      // the east interior column. 12×10 footprint = 10×8 interior;
      // valid item dx is 1..9, dy is 1..8.
      items: [
        // Service counter — north row, west cluster.
        { dx: 1, dy: 1, ch: 'R' }, { dx: 2, dy: 1, ch: 'R' }, { dx: 3, dy: 1, ch: 'R' },
        // Hot-line / steam tray (cabinet stand-in).
        { dx: 5, dy: 1, ch: 'F' },
        // Whiteboard with daily menu.
        { dx: 7, dy: 1, ch: 'B' },
        // Bulletin (community board).
        { dx: 9, dy: 1, ch: 'b' },
        // Dining tables — three rows of paired desk + chair.
        // Row 1
        { dx: 1, dy: 3, ch: 'c' }, { dx: 1, dy: 4, ch: 'h' },
        { dx: 4, dy: 3, ch: 'c' }, { dx: 4, dy: 4, ch: 'h' },
        { dx: 7, dy: 3, ch: 'c' }, { dx: 7, dy: 4, ch: 'h' },
        // Row 2 — chairs north of desks for variety.
        { dx: 1, dy: 6, ch: 'h' }, { dx: 1, dy: 7, ch: 'c' },
        { dx: 4, dy: 6, ch: 'h' }, { dx: 4, dy: 7, ch: 'c' },
        { dx: 7, dy: 6, ch: 'h' }, { dx: 7, dy: 7, ch: 'c' },
        // East-side amenities: vending, water cooler, plant.
        { dx: 9, dy: 3, ch: 'V' },
        { dx: 9, dy: 5, ch: 'w' },
        { dx: 9, dy: 7, ch: 'P' },
      ],
    },
    {
      id: 'kitchen',
      ...KITCHEN,
      // North door at offset 3 → world (5, 13). Opens onto the
      // east-west cross-corridor at y=12.
      doors: [{ side: 'N', offset: 3 }],
      // Back-of-house prep area for the cafeteria. Counter row
      // + fridge + ice machine. Door is at offset 3 → interior
      // dx=2 dy=0, so that cell stays open (player walks straight
      // through). Interior is 4×2 (valid dx 0..3, dy 0..1).
      items: [
        { dx: 0, dy: 0, ch: 'R' }, { dx: 1, dy: 0, ch: 'R' }, // prep counters (left of entry)
        { dx: 3, dy: 0, ch: 'F' },                            // fridge in the back corner
        { dx: 3, dy: 1, ch: 'V' },                            // ice / drinks machine
      ],
    },
    {
      id: 'lounge',
      ...LOUNGE,
      // North door at offset 3 → world (11, 13).
      doors: [{ side: 'N', offset: 3 }],
      // Staff break room. Two soft chairs ('h' stand-in), a water
      // cooler in the corner, a plant in the back. Interior 4×2.
      items: [
        { dx: 0, dy: 0, ch: 'h' }, { dx: 1, dy: 0, ch: 'h' },
        { dx: 3, dy: 0, ch: 'w' }, // water cooler
        { dx: 3, dy: 1, ch: 'P' }, // corner plant
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
        { side: 'E', offset: 4 },                                                  // east into the east-wing spur corridor
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
    // ===== East wing =====
    {
      id: 'radiology',
      ...RADIOLOGY,
      // West door at world y = 15+6 = 21, aligned with the spur corridor
      // running east from Registration's east door.
      doors: [{ side: 'W', offset: 6 }],
      // Imaging suite: a couple of read-stations (desk + chair),
      // file cabinets for film jackets, a hospital bed for patient
      // hand-off, plus plants for that "waiting just outside the
      // scanner" feel. (No imaging-specific glyphs exist; reusing the
      // 12 procedural keys.)
      items: [
        { dx: 1, dy: 1, ch: 'c' }, { dx: 1, dy: 2, ch: 'h' }, // read-station 1
        { dx: 4, dy: 1, ch: 'c' }, { dx: 4, dy: 2, ch: 'h' }, // read-station 2
        { dx: 8, dy: 1, ch: 'B' },                            // light-board / monitor
        { dx: 1, dy: 6, ch: 'F' }, { dx: 4, dy: 6, ch: 'F' }, // film cabinets
        { dx: 8, dy: 6, ch: 'H' },                            // exam bed (patient hand-off)
        { dx: 11, dy: 1, ch: 'P' },
        { dx: 11, dy: 7, ch: 'P' },
      ],
    },
    {
      id: 'pharmacy',
      ...PHARMACY,
      // West door at world y = 27+3 = 30.
      doors: [{ side: 'W', offset: 3 }],
      // Dispense window + shelves of binders (formulary stand-in).
      items: [
        { dx: 1, dy: 1, ch: 'R' }, { dx: 2, dy: 1, ch: 'R' }, { dx: 3, dy: 1, ch: 'R' }, // dispense counter
        { dx: 5, dy: 1, ch: 'B' },                                                       // formulary board
        { dx: 1, dy: 5, ch: 'F' }, { dx: 4, dy: 5, ch: 'F' }, { dx: 7, dy: 5, ch: 'F' }, // shelves
        { dx: 11, dy: 1, ch: 'c' }, { dx: 11, dy: 2, ch: 'h' },                          // pharmacist desk
        { dx: 11, dy: 5, ch: 'P' },
      ],
    },
    {
      id: 'medRecords',
      ...MED_RECORDS,
      // West door at world y = 37+5 = 42.
      doors: [{ side: 'W', offset: 5 }],
      // Chart room — the wall-of-binders look. Two desks for staff
      // pulling charts, otherwise dense rows of file cabinets.
      items: [
        { dx: 1, dy: 1, ch: 'F' }, { dx: 2, dy: 1, ch: 'F' }, { dx: 3, dy: 1, ch: 'F' },
        { dx: 4, dy: 1, ch: 'F' }, { dx: 5, dy: 1, ch: 'F' }, { dx: 6, dy: 1, ch: 'F' },
        { dx: 8, dy: 1, ch: 'F' }, { dx: 9, dy: 1, ch: 'F' }, { dx: 10, dy: 1, ch: 'F' },
        { dx: 11, dy: 1, ch: 'F' }, { dx: 12, dy: 1, ch: 'F' },
        { dx: 1, dy: 7, ch: 'F' }, { dx: 2, dy: 7, ch: 'F' }, { dx: 3, dy: 7, ch: 'F' },
        { dx: 4, dy: 7, ch: 'F' }, { dx: 5, dy: 7, ch: 'F' }, { dx: 6, dy: 7, ch: 'F' },
        { dx: 8, dy: 7, ch: 'F' }, { dx: 9, dy: 7, ch: 'F' }, { dx: 10, dy: 7, ch: 'F' },
        { dx: 11, dy: 7, ch: 'F' }, { dx: 12, dy: 7, ch: 'F' },
        { dx: 4, dy: 4, ch: 'c' }, { dx: 4, dy: 5, ch: 'h' },
        { dx: 9, dy: 4, ch: 'c' }, { dx: 9, dy: 5, ch: 'h' },
        { dx: 12, dy: 4, ch: 'X' }, // fax / records terminal
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
        // Side-door exit mat — teleports to the outdoor parking
        // lot (paired in stairs[]). Sits on the WEST interior wall
        // column. The lobby's south door still leads to the south
        // wing; this 'O' tile is a separate side exit. Officer
        // Reyes stands one tile east, watching it.
        // (Lobby origin is (4, 32); dx=1/dy=4 → world (5, 36),
        // matching EXIT_LOBBY_OUT.from.)
        { dx: 1, dy: 4, ch: 'O' },
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
    // ===== Outdoor — parking lot =====
    {
      id: 'outdoor',
      ...OUTDOOR,
      // No doors — the player arrives + leaves via 'O' teleport tile.
      // The room is a sealed walled rectangle so the perimeter reads
      // as building-edge / fence.
      items: [
        // Arrival tile (teleport partner of the lobby 'O').
        // Outdoor origin is (4,65); dx=11/dy=1 → world (16, 67),
        // matching EXIT_OUT_LOBBY.from.
        { dx: 11, dy: 1, ch: 'O' },
        // Sparse decoration — trees along the perimeter, a couple of
        // benches in the middle. Real population (smoker NPC, security
        // guard, ambient cars) lands in a follow-up.
        { dx: 2,  dy: 2, ch: 'P' }, { dx: 6,  dy: 2, ch: 'P' },
        { dx: 22, dy: 2, ch: 'P' }, { dx: 32, dy: 2, ch: 'P' },
        { dx: 42, dy: 2, ch: 'P' }, { dx: 46, dy: 2, ch: 'P' },
        { dx: 2,  dy: 18, ch: 'P' }, { dx: 6,  dy: 18, ch: 'P' },
        { dx: 22, dy: 18, ch: 'P' }, { dx: 32, dy: 18, ch: 'P' },
        { dx: 42, dy: 18, ch: 'P' }, { dx: 46, dy: 18, ch: 'P' },
        // Benches (using chair glyph) facing the entrance
        { dx: 8,  dy: 8,  ch: 'h' }, { dx: 10, dy: 8,  ch: 'h' },
        { dx: 36, dy: 8,  ch: 'h' }, { dx: 38, dy: 8,  ch: 'h' },
        // A pair of "lampposts" using water-cooler glyph (warm tint
        // already reads as a standing lamp). Real lamppost art TBD.
        { dx: 4,  dy: 10, ch: 'w' }, { dx: 44, dy: 10, ch: 'w' },
      ],
    },

    // ===== Second floor =====
    {
      id: 'landing2F',
      ...LANDING_2F,
      // South door connects to the 2F corridor that runs out to
      // AUDIT, PAYER, and COMPLIANCE.
      doors: [{ side: 'S', offset: 4 }],
      items: [
        // Stair landing tile — teleport partner of the Main Hub 'S'.
        // Landing origin is (30,94); dx=2/dy=1 → world (33, 96),
        // matching STAIR_2F_TO_HUB.from.
        { dx: 2, dy: 1, ch: 'S' },
        { dx: 4, dy: 1, ch: 'P' },
        { dx: 4, dy: 2, ch: 'P' },
      ],
    },
    {
      id: 'audit',
      ...AUDIT,
      // North door at offset 22 lines up with the 2F corridor running
      // east-west at y=99. Old (south wing) audit door + corridor stub
      // are gone with the move.
      doors: [{ side: 'N', offset: 22 }],
      // Conference room contents preserved from the south-wing era.
      items: [
        { dx: 4,  dy: 2, ch: 'h' }, { dx: 7,  dy: 2, ch: 'h' },
        { dx: 10, dy: 2, ch: 'h' }, { dx: 13, dy: 2, ch: 'h' },
        { dx: 16, dy: 2, ch: 'h' }, { dx: 19, dy: 2, ch: 'h' },
        { dx: 22, dy: 2, ch: 'h' },
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
        { dx: 4,  dy: 4, ch: 'h' }, { dx: 7,  dy: 4, ch: 'h' },
        { dx: 10, dy: 4, ch: 'h' }, { dx: 13, dy: 4, ch: 'h' },
        { dx: 16, dy: 4, ch: 'h' }, { dx: 19, dy: 4, ch: 'h' },
        { dx: 22, dy: 4, ch: 'h' },
        { dx: 1,  dy: 3, ch: 'B' },
        { dx: 25, dy: 3, ch: 'w' },
        { dx: 25, dy: 5, ch: 'P' },
        { dx: 1,  dy: 5, ch: 'F' },
      ],
    },
    {
      id: 'payer',
      ...PAYER,
      // North door at offset 4 onto the 2F corridor.
      doors: [{ side: 'N', offset: 4 }],
      // Aetna/Anthem-equivalent: phone bank, fax wall, claim queue
      // monitors. The "missing fifth actor" from the intro narration
      // ("Doctors document. Coders translate. Billers submit. Payers
      // decide. Patients pay.") finally has a room.
      items: [
        { dx: 1, dy: 1, ch: 'c' }, { dx: 1, dy: 2, ch: 'h' },
        { dx: 4, dy: 1, ch: 'c' }, { dx: 4, dy: 2, ch: 'h' },
        { dx: 8, dy: 1, ch: 'c' }, { dx: 8, dy: 2, ch: 'h' },
        { dx: 12, dy: 1, ch: 'c' }, { dx: 12, dy: 2, ch: 'h' },
        // Wall of fax machines — payer's preferred denial-delivery
        // medium even in 2026.
        { dx: 1, dy: 7, ch: 'X' }, { dx: 4, dy: 7, ch: 'X' },
        { dx: 8, dy: 7, ch: 'X' }, { dx: 12, dy: 7, ch: 'X' },
        // Claim-queue / decision board.
        { dx: 15, dy: 4, ch: 'B' },
        { dx: 15, dy: 7, ch: 'F' },
      ],
    },
    {
      id: 'compliance',
      ...COMPLIANCE,
      // North door at offset 16 onto a vertical stub from the 2F
      // corridor.
      doors: [{ side: 'N', offset: 16 }],
      // Compliance / HIPAA / binders. Sparse for now; meant to be a
      // dragon's-lair vibe with rows of audit binders. Real population
      // in a follow-up.
      items: [
        // North-wall binders (dx <= w-3 = 25 to stay inside interior).
        { dx: 1, dy: 1, ch: 'F' }, { dx: 2, dy: 1, ch: 'F' }, { dx: 3, dy: 1, ch: 'F' },
        { dx: 4, dy: 1, ch: 'F' }, { dx: 5, dy: 1, ch: 'F' },
        { dx: 21, dy: 1, ch: 'F' }, { dx: 22, dy: 1, ch: 'F' }, { dx: 23, dy: 1, ch: 'F' },
        { dx: 24, dy: 1, ch: 'F' }, { dx: 25, dy: 1, ch: 'F' },
        { dx: 5, dy: 4, ch: 'c' }, { dx: 5, dy: 5, ch: 'h' },
        { dx: 12, dy: 4, ch: 'c' }, { dx: 12, dy: 5, ch: 'h' },
        { dx: 20, dy: 4, ch: 'c' }, { dx: 20, dy: 5, ch: 'h' },
        { dx: 13, dy: 7, ch: 'B' }, // policy-of-the-week board
        { dx: 1, dy: 7, ch: 'P' }, { dx: 25, dy: 7, ch: 'P' },
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
        [HIM.x + 7, SW_TROUGH_Y], // east-west cross-corridor, anchored to HIM's door col
        [PFS.x + 8, SW_TROUGH_Y], // ... extends to PFS's door col
      ],
      width: 1,
    },
    // West-wing corridors. The main lobby↔hub corridor used to dead-
    // end at the bend (14, 13). Two new segments extend it into the
    // new wing:
    //   1. North extension at x=14 from the bend (14, 13) up to
    //      (14, 4) — passes the cafeteria's east door at (13, 4).
    //   2. East-west cross-corridor at y=12, from the main corridor
    //      west to (5, 12) — connects the kitchen + lounge north
    //      doors. (Was y=10 when the cafeteria was shorter; moved
    //      with the cafeteria south wall when it expanded.)
    {
      points: [
        [CORRIDOR_BEND.x, CORRIDOR_BEND.y], // (14, 13) — bend (already on the lobby↔hub corridor)
        [CORRIDOR_BEND.x, CAFETERIA.y + 2], // (14, 4) — just east of the cafeteria east door
      ],
      width: 1,
    },
    {
      points: [
        [CORRIDOR_BEND.x, KITCHEN.y - 1], // (14, 12) — junction with the north-extension
        [KITCHEN.x + 3,   KITCHEN.y - 1], // (5, 12)  — just north of the kitchen N door
      ],
      width: 1,
    },
    // (Old AUDIT stub corridor removed — AUDIT moved to second floor.)

    // East-wing spur: from Registration's east door east to the trunk.
    // Registration east door world coords: (REGISTRATION.x + REGISTRATION.w - 1,
    // REGISTRATION.y + 4) = (37, 21). Trunk is at x=50.
    {
      points: [
        [REGISTRATION.x + REGISTRATION.w, REGISTRATION.y + 4], // (37, 21) — just east of door
        [RADIOLOGY.x - 1,                 REGISTRATION.y + 4], // (50, 21) — junction with trunk
      ],
      width: 1,
    },
    // East-wing trunk: vertical corridor at x=50 connecting all three
    // east-wing rooms' west doors.
    {
      points: [
        [RADIOLOGY.x - 1,   RADIOLOGY.y + 6],   // (50, 21) — radiology door row
        [MED_RECORDS.x - 1, MED_RECORDS.y + 5], // (50, 42) — med-records door row
      ],
      width: 1,
    },
    // Second-floor connectors. The 2F is a separate region of the
    // tilemap reached via 'S' teleport; once you arrive at the
    // landing, you walk these corridors to the rooms.
    // Stub from landing's south door to the trunk.
    {
      points: [
        [LANDING_2F.x + 4, LANDING_2F.y + LANDING_2F.h], // (34, 99)
        [LANDING_2F.x + 4, AUDIT.y - 1],                 // (34, 99) — same tile (corridor stub anchor)
      ],
      width: 1,
    },
    // East-west trunk on 2F at y=99 connecting AUDIT-N + PAYER-N doors.
    {
      points: [
        [AUDIT.x + 22, AUDIT.y - 1],   // (26, 99)
        [PAYER.x + 4,  PAYER.y - 1],   // (40, 99)
      ],
      width: 1,
    },
    // Vertical drop from the trunk down to COMPLIANCE's N door.
    // Threads the gap between AUDIT (ends x=31) and PAYER (starts x=36).
    {
      points: [
        [LANDING_2F.x + 4, AUDIT.y - 1],         // (34, 99)
        [COMPLIANCE.x + 16, COMPLIANCE.y - 1],   // (34, 112) — just north of compliance door
      ],
      width: 1,
    },
  ],
})

// Per-cell layout overrides emitted from the map editor — empties out
// specific tiles' default obj layer (the editor's "delete" verb).
// Most maps don't need this; included here as Chansoo cleared a row
// of placeholder cells in registration + lobby during a layout pass
// (see /map-editor.html session export 2026-05-09).
const tileOverrides: Array<{ x: number; y: number; ch: string }> = [
  { x: 18, y: 19, ch: '' },
  { x: 19, y: 19, ch: '' },
  { x: 20, y: 19, ch: '' },
  { x: 21, y: 19, ch: '' },
  { x: 7,  y: 34, ch: '' },
]

export const LEVEL_1_MAP: MapDef = {
  width: WIDTH,
  height: HEIGHT,
  layout: applyTileOverrides(layout, tileOverrides),
  tileMeta,
  // Player spawns near the south of the lobby, looking up toward the chairs.
  playerStart: { x: LOBBY.x + 10, y: LOBBY.y + LOBBY.h - 3 },
  // Minimap labels — abbreviated by default, full names on click.
  rooms: [
    { name: 'MAIN HUB',         shortName: 'HUB',  ...MAIN_HUB },
    { name: 'STAIRWELL',        shortName: 'STR',  ...STAIRWELL_1F },
    { name: 'PRIOR AUTH',       shortName: 'AUTH', ...PRIOR_AUTH },
    // West wing (north-of-PS).
    { name: 'CAFETERIA',        shortName: 'CAF',  ...CAFETERIA },
    { name: 'KITCHEN',          shortName: 'KIT',  ...KITCHEN },
    { name: 'LOUNGE',           shortName: 'LNG',  ...LOUNGE },
    // Mid + south rows.
    { name: 'PATIENT SERVICES', shortName: 'PT',   ...PATIENT_SVC },
    { name: 'REGISTRATION',     shortName: 'REG',  ...REGISTRATION },
    { name: 'ELIGIBILITY',      shortName: 'ELIG', ...ELIGIBILITY },
    { name: 'LOBBY',            shortName: 'LBY',  ...LOBBY },
    { name: 'HIM / CODING',     shortName: 'HIM',  ...HIM },
    { name: 'BILLING',          shortName: 'BIL',  ...BILLING },
    { name: 'PFS / PHONES',     shortName: 'PFS',  ...PFS },
    { name: 'RADIOLOGY',        shortName: 'RAD',  ...RADIOLOGY },
    { name: 'PHARMACY',         shortName: 'PHA',  ...PHARMACY },
    { name: 'MEDICAL RECORDS',  shortName: 'REC',  ...MED_RECORDS },
    // Outdoor — parking lot, reached via 'O' teleport from lobby.
    { name: 'PARKING LOT',      shortName: 'OUT',  ...OUTDOOR },
    // Second floor.
    { name: '2F LANDING',       shortName: '2F',   ...LANDING_2F },
    { name: 'AUDIT CONFERENCE', shortName: 'AUD',  ...AUDIT },
    { name: 'PAYER OFFICE',     shortName: 'PAY',  ...PAYER },
    { name: 'COMPLIANCE',       shortName: 'CMP',  ...COMPLIANCE },
  ],
  stairs: [
    STAIR_HUB_TO_2F, STAIR_2F_TO_HUB,
    EXIT_LOBBY_OUT,  EXIT_OUT_LOBBY,
  ],
  npcPlacements: [
    // === Facing convention ===
    // `facing` defaults to 'down' (front-facing toward the camera)
    // when omitted. We avoid 'up' (back-of-head) on placement —
    // back-facing reads weird unless an NPC is genuinely working
    // at a wall-mounted thing, which none currently are. Facing
    // is static — applied once at spawn from this field.

    // === Always-present (level-agnostic) placements ===
    // Anjali walks in during the level-1 opening sequence and lands
    // on the player's column, three tiles north of spawn. Default
    // 'down' so she greets Chloe head-on.
    { npcId: 'anjali',   tileX: LOBBY.x + 10,       tileY: LOBBY.y + 4 },
    // Kim sits at the registration counter (interior dy=2, just
    // south of the public-facing R counter row). Default 'down' so
    // she faces the lobby-side approach.
    { npcId: 'kim',      tileX: REGISTRATION.x + 4, tileY: REGISTRATION.y + 2 },
    // Martinez looks 'left' across the hub toward Alex / the
    // bulletin board, not back at the wall.
    { npcId: 'martinez', tileX: MAIN_HUB.x + 14,    tileY: MAIN_HUB.y + 4, facing: 'left' },

    // === Per-level placements ===
    // Dana — Patient Services (L1-9) at the west side of the room
    // near the door + intake desks; Audit conference room (L10),
    // south of the table looking west toward the rest of the team.
    { npcId: 'dana', tileX: PATIENT_SVC.x + 3, tileY: PATIENT_SVC.y + 4,
      levels: [1, 2, 3, 4, 5, 6, 7, 8, 9] },
    { npcId: 'dana', tileX: AUDIT.x + 14, tileY: AUDIT.y + 5, facing: 'left',
      levels: [10] },

    // Jordan — Eligibility (L1-7) at the kiosk; PFS (L8+) at the
    // desk row. Both spots she's facing right (the F cabinet at
    // eligibility, the water cooler at PFS).
    { npcId: 'jordan', tileX: ELIGIBILITY.x + 5, tileY: ELIGIBILITY.y + 3, facing: 'right',
      levels: [1, 2, 3, 4, 5, 6, 7] },
    { npcId: 'jordan', tileX: PFS.x + 6, tileY: PFS.y + 5, facing: 'right',
      levels: [8, 9, 10] },

    // Pat — Registration (L1-3) faces left toward Kim; HIM (L4+)
    // default 'down' (sits at the desk row on entry, not yet
    // turned to a particular workstation).
    { npcId: 'pat', tileX: REGISTRATION.x + 14, tileY: REGISTRATION.y + 4, facing: 'left',
      levels: [1, 2, 3] },
    { npcId: 'pat', tileX: HIM.x + 5, tileY: HIM.y + 5,
      levels: [4, 5, 6, 7, 8, 9, 10] },

    // Alex — Main Hub (default for most levels) faces right toward
    // Martinez; Billing (L6) default 'down' at the EDI desk row.
    { npcId: 'alex', tileX: MAIN_HUB.x + 4, tileY: MAIN_HUB.y + 4, facing: 'right',
      levels: [1, 2, 3, 4, 5, 7, 8, 9, 10] },
    { npcId: 'alex', tileX: BILLING.x + 5, tileY: BILLING.y + 5,
      levels: [6] },

    // Sam — Patient Services. Repositioned north of her old desk
    // tile (closer to the door) so Chloe meets her on entry rather
    // than at the back wall.
    { npcId: 'sam', tileX: PATIENT_SVC.x + 9, tileY: PATIENT_SVC.y + 2 },

    // L10 audit team — north chair row (AUDIT interior dy=2, world
    // y=102). Default 'down' faces south toward the conference
    // table where Chloe sits.
    { npcId: 'auditor_carl',   tileX: AUDIT.x + 7,  tileY: AUDIT.y + 2, levels: [10] },
    { npcId: 'auditor_chen',   tileX: AUDIT.x + 13, tileY: AUDIT.y + 2, levels: [10] },
    { npcId: 'auditor_rivera', tileX: AUDIT.x + 19, tileY: AUDIT.y + 2, levels: [10] },
    { npcId: 'auditor_eddi',   tileX: AUDIT.x + 22, tileY: AUDIT.y + 2, levels: [10] },

    // === Ambient populace — atmosphere NPCs spread across the
    //     hospital. `ambient: true` bypasses the per-level
    //     npcsActive filter so they appear at every level. Each
    //     gets a single one-line dialogue (see `dialogue.ts`). ===

    // Lobby — repositioned during the editor pass. Greta (flowers)
    // is now on the east side mid-conversation; Mr. Beck is near
    // the west wall; Officer Reyes covers the SW corner; Walter
    // and Noah occupy the northern half.
    { npcId: 'walter',         tileX: LOBBY.x + 20, tileY: LOBBY.y + 2, ambient: true },
    { npcId: 'noah',           tileX: LOBBY.x + 18, tileY: LOBBY.y + 7, facing: 'left', ambient: true },
    // Officer Reyes shifted one tile east of his old spot — the
    // 'O' exit-mat tile now sits at (LOBBY.x+1, LOBBY.y+4), and
    // having him on top of it would block the teleport. Faces
    // 'left' toward the door, watching who comes through.
    { npcId: 'officer_reyes',  tileX: LOBBY.x + 2,  tileY: LOBBY.y + 4, facing: 'left', ambient: true },
    { npcId: 'flower_visitor', tileX: LOBBY.x + 24, tileY: LOBBY.y + 5, facing: 'left', ambient: true },
    { npcId: 'elder_patient',  tileX: LOBBY.x + 5,  tileY: LOBBY.y + 3, ambient: true },

    // PFS — Dev faces 'left' toward the water cooler at PFS dy=5
    // dx=9 (one tile west + one tile south of him).
    { npcId: 'dev', tileX: PFS.x + 11, tileY: PFS.y + 5, facing: 'left', ambient: true },

    // Main Hub — physician floor. Priya defaults to 'down' (she's
    // standing south-of-center, easy to read). Ethan still looks
    // left toward her (mid-conversation about a discharge).
    { npcId: 'dr_priya', tileX: MAIN_HUB.x + 9,  tileY: MAIN_HUB.y + 6, ambient: true },
    { npcId: 'dr_ethan', tileX: MAIN_HUB.x + 14, tileY: MAIN_HUB.y + 8, facing: 'left', ambient: true },

    // East wing.
    //  - Rad tech faces 'right' toward the H (hospital bed) on the
    //    east side of the imaging suite.
    //  - Liana defaults to 'down' (working at the dispense counter
    //    facing the patient side).
    //  - Joe (janitor) faces 'right' toward the pull-desks.
    //  - Marisol the records clerk faces 'right' toward the
    //    pull-desk one tile east (where charts get reviewed).
    { npcId: 'rad_tech',      tileX: RADIOLOGY.x + 6,   tileY: RADIOLOGY.y + 5,   facing: 'right', ambient: true },
    { npcId: 'liana',         tileX: PHARMACY.x + 6,    tileY: PHARMACY.y + 4,    ambient: true },
    { npcId: 'joe',           tileX: MED_RECORDS.x + 7, tileY: MED_RECORDS.y + 5, facing: 'right', ambient: true },
    { npcId: 'records_clerk', tileX: MED_RECORDS.x + 4, tileY: MED_RECORDS.y + 5, facing: 'right', ambient: true },

    // 2F.
    //  - Theresa (payer rep) faces 'right' toward Diane.
    //  - Diane (supervisor) faces 'left' toward Theresa, mirror.
    //  - Theo faces 'right' toward the east cluster of binders.
    { npcId: 'payer_rep',          tileX: PAYER.x + 5,      tileY: PAYER.y + 3,      facing: 'right', ambient: true },
    { npcId: 'payer_supervisor',   tileX: PAYER.x + 12,     tileY: PAYER.y + 3,      facing: 'left',  ambient: true },
    { npcId: 'compliance_officer', tileX: COMPLIANCE.x + 6, tileY: COMPLIANCE.y + 5, facing: 'right', ambient: true },

    // Outdoor — parking lot ambient. Smoker NPCs are *outdoor-only*
    // by design (cigarette is part of the sprite); placing them
    // indoors would read as a HIPAA violation, not atmosphere.
    //  - Earl looks 'left' (random — out into the lot).
    //  - Sandra looks 'right' (different direction from Earl for
    //    visual variety).
    //  - Cassie the paramedic looks 'right' across the lot.
    //  - Chase the bike EMT just rolled in on his bike — looks
    //    'left' away from Cassie's rig.
    { npcId: 'smoker_visitor',   tileX: OUTDOOR.x + 25, tileY: OUTDOOR.y + 10, facing: 'left',  ambient: true },
    { npcId: 'smoker_outdoor_b', tileX: OUTDOOR.x + 35, tileY: OUTDOOR.y + 14, facing: 'right', ambient: true },
    { npcId: 'paramedic',        tileX: OUTDOOR.x + 8,  tileY: OUTDOOR.y + 14, facing: 'right', ambient: true },
    { npcId: 'bike_emt',         tileX: OUTDOOR.x + 14, tileY: OUTDOOR.y + 8,  facing: 'left',  ambient: true },

    // Cafeteria — service staff behind the counter, a server
    // working the dining floor. Cafeteria moved from a 22×13 SE
    // footprint to a 12×8 NW one; positions resized to match.
    //  - Manny mans the hot line on the north counter row.
    //  - Yvette sits at the register on the same row, faces
    //    'left' toward the counter line.
    //  - Reggie roams the dining floor.
    { npcId: 'cafeteria_worker', tileX: CAFETERIA.x + 3, tileY: CAFETERIA.y + 2, ambient: true },
    { npcId: 'cashier',          tileX: CAFETERIA.x + 9, tileY: CAFETERIA.y + 2, facing: 'left', ambient: true },
    { npcId: 'server',           tileX: CAFETERIA.x + 7, tileY: CAFETERIA.y + 5, ambient: true },

    // (Kitchen + Lounge are unpopulated for now — small rooms,
    // saving for a future cast. Roni / lab_tech is still defined
    // in npcSources + npcs.ts but unplaced; relocate her when a
    // future room fits.)

    // Main Hub — extra hospitalist, joins the existing physician
    // crowd. Faces 'right' toward the hub bulletin / colleagues.
    { npcId: 'dr_park',          tileX: MAIN_HUB.x + 3,  tileY: MAIN_HUB.y + 2, facing: 'right', ambient: true },
  ],
}
