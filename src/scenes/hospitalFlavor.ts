// In-world note text shown when the player bumps a solid object or
// presses E facing one. Pure data + a stable per-tile picker — extracted
// from HospitalScene to keep the scene file focused on lifecycle. The
// toast renderer (HospitalScene.flashFlavorToast) reads from here.
//
// Each tile char can map to a single string OR a list of variants. When
// a list is given, the variant is picked by a stable hash of the tile's
// (x, y) — so the same tile always reads the same line, but two
// neighboring desks won't say the same thing.
//
// Voice is Chloe's: dry, slightly tired, observant. Three lines tops.

export const TILE_FLAVOR: Record<string, string | string[]> = {
  L: 'LOCKED — KEYCARD REQUIRED\nThe reader sticker reads:\n"Authorized personnel only. Prior Auth team."',
  F: [
    'FILING CABINET\nDrawer locked. A peeling label:\nPRE-2018 / DO NOT PURGE.',
    'FILING CABINET\nTop drawer half-open. Manila folders\ntabbed: AETNA, AETNA, AETNA, OTHER.',
    'FILING CABINET\nLocked. The keyhole has been filled\nwith hot glue. Recently.',
    'FILING CABINET\nA dent in the side from a kicked foot.\nLabel: APPEALS / RESOLVED.',
  ],
  B: [
    'WHITEBOARD\n"DENIAL OF THE WEEK: CO-16"\nMissing remark code. Half-erased.',
    'WHITEBOARD\nA flowchart titled FRONT-END EDITS.\nThe last branch trails off into a question mark.',
    'WHITEBOARD\nKPI tracker. Clean Claim Rate: 84%.\n(Goal: 95%. The 84 has been there a month.)',
  ],
  R: [
    'RECEPTION COUNTER\nIntake clipboards stacked four deep.\nA ballpoint pen, chained.',
    'RECEPTION COUNTER\nA bell. A sign: "PLEASE RING ONCE."\nSomeone has rung it twice in pen.',
    'RECEPTION COUNTER\nA candy dish. Empty. Just wrappers.\nStrawberry — always the strawberry left.',
  ],
  V: 'VENDING MACHINE\nOUT OF ORDER — BILL VALIDATOR JAM.\nThe sign has been there all month.',
  w: [
    'WATER COOLER\nThe jug gurgles. A taped note reads:\n"Refill before you leave. — Mgmt"',
    'WATER COOLER\nNearly empty. The little cone cups\nare also nearly empty.',
  ],
  b: [
    'BULLETIN BOARD\n• OPEN ENROLLMENT ENDS NOV 15\n• "Lost: blue badge — Sam, ext. 4112"\n• Pizza Friday (last week\'s flyer)',
    'BULLETIN BOARD\nA payer policy update from 2019\npinned over a payer policy update from 2018.',
    'BULLETIN BOARD\n"WORKFLOW POTLUCK — Thursday 5pm —\nbring a side and a denial story."',
    'BULLETIN BOARD\nOSHA poster, faded. Someone has drawn\na tiny mustache on the regulator.',
    'BULLETIN BOARD\n"DENIAL CODE OF THE WEEK: CO-97"\nThree CO-97 jokes pinned beneath. Each worse than the last.',
  ],
  H: 'EXAM TABLE\nPaper liner crinkled from the last patient.\nA blood-pressure cuff dangles off the side.',
  X: [
    'FAX MACHINE\nStatus light blinking: NO LINE.\nThe out-tray has a single curled page.',
    'FAX MACHINE\nReceived: 1 page from UNKNOWN — 03:42 AM.\nThe page is upside down. You leave it.',
  ],
  c: [
    "DESK\nA half-eaten bagel on a napkin.\nOpen browser tab: \"Aetna PPO formulary 2024.\"",
    'DESK\nThe CRT hums. Photo of a corgi pinned\nto the monitor with packing tape.',
    'DESK\nSticky note on the keyboard:\n"CALL ANJALI BACK — RE: BILL."',
    'DESK\nA Rolodex. An actual Rolodex.\nMost cards are blank. First one: MERCY GENERAL — IT — ext. 3000.',
    'DESK\nStacks of EOBs sorted by payer.\nA half-finished crossword. 14-down: PARTITA.',
  ],
  h: [
    'WAITING-ROOM CHAIR\nVinyl. Cracked along the seam.\nThe foam underneath has gone hard.',
    'WAITING-ROOM CHAIR\nA worn paperback wedged between\nthe cushion and the armrest.',
    "WAITING-ROOM CHAIR\nA child's drawing taped to the back:\na hospital, but the windows are red.",
  ],
  P: [
    'POTTED PLANT\nPlastic. Dust on the leaves.\nNobody has watered it since you started.',
    'POTTED PLANT\nA philodendron. Real, somehow.\nLeaves yellow at the tips.',
    'POTTED PLANT\nFake. The pot is full of takeout receipts\nsomeone shoved in there.',
  ],
  E: 'VITALS MONITOR\nOn a wheeled stand. The screen pulses\na slow green sine wave. Probably idle.',
}

/** Stable per-tile variant pick. Same (x, y) → same line every time;
 *  different (x, y) with the same tile char → different line. */
export function flavorForTile(ch: string, x: number, y: number): string | undefined {
  const v = TILE_FLAVOR[ch]
  if (!v) return undefined
  if (typeof v === 'string') return v
  const h = ((x * 73856093) ^ (y * 19349663)) >>> 0
  return v[h % v.length]
}

/** Where the player should head when each level begins. Shown under
 *  the level-advance banner. Mentions the case-handing NPC + their
 *  rough location so the player isn't left scanning the whole map. */
export const LEVEL_ORIENTATION_HINTS: Record<number, string> = {
  1:  'Wait at your desk — Anjali is on her way.',
  2:  'Find Kim at the Registration desk.',
  3:  'Sam is in Patient Services. There\'s a denial.',
  4:  'Pat moved down to HIM / Coding — head south.',
  5:  'Sam is back in Patient Services with another wraith.',
  6:  'Alex is in Billing — south wing. The clearinghouse is bleeding.',
  7:  'Sam in Patient Services. The reaper has surfaced.',
  8:  'Jordan is now at the PFS phone bank. Patient on the line.',
  9:  'Kim at Registration. Three payers, one claim.',
  10: 'Dana is in the Audit Conference Room. The auditors have arrived.',
}
