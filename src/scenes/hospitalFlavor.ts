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
  L: [
    'LOCKED — KEYCARD REQUIRED\nThe reader sticker reads:\n"Authorized personnel only. Prior Auth team."',
    'LOCKED\nKeyhole filled with hot glue.\nThe handle still moves a quarter-inch.',
    'LOCKED\nA half-peeled Post-It on the door:\n"ASK ABOUT THE COMBO — DON\'T GUESS."',
    'LOCKED\nThe knob is warm. You don\'t know why.',
  ],
  F: [
    'FILING CABINET\nDrawer locked. A peeling label:\nPRE-2018 / DO NOT PURGE.',
    'FILING CABINET\nTop drawer half-open. Manila folders\ntabbed: AETNA, AETNA, AETNA, OTHER.',
    'FILING CABINET\nLocked. The keyhole has been filled\nwith hot glue. Recently.',
    'FILING CABINET\nA dent in the side from a kicked foot.\nLabel: APPEALS / RESOLVED.',
    'FILING CABINET\nA charm necklace looped over the handle.\nNobody has admitted to losing it.',
    'FILING CABINET\nA coffee ring on top, three layers deep.\nTop folder reads: 2019 / DESTROY 2026.',
    'FILING CABINET\nMagnet on the side: "WORLD\'S OK\'EST CODER."\nNobody owns up to that one either.',
  ],
  B: [
    'WHITEBOARD\n"DENIAL OF THE WEEK: CO-16"\nMissing remark code. Half-erased.',
    'WHITEBOARD\nA flowchart titled FRONT-END EDITS.\nThe last branch trails off into a question mark.',
    'WHITEBOARD\nKPI tracker. Clean Claim Rate: 84%.\n(Goal: 95%. The 84 has been there a month.)',
    'WHITEBOARD\n"Numerator / Denominator." Underlined\nthree times. No definitions given.',
    'WHITEBOARD\nA list: 14 names. Twelve crossed out.\nThe last two circled in red.',
    'WHITEBOARD\nAn arrow loops back into itself.\nLabel: APPEAL CYCLE.',
    'WHITEBOARD\nA birthday count for someone named\n"BARB" — three days. Taped over.',
  ],
  R: [
    'RECEPTION COUNTER\nIntake clipboards stacked four deep.\nA ballpoint pen, chained.',
    'RECEPTION COUNTER\nA bell. A sign: "PLEASE RING ONCE."\nSomeone has rung it twice in pen.',
    'RECEPTION COUNTER\nA candy dish. Empty. Just wrappers.\nStrawberry — always the strawberry left.',
    'RECEPTION COUNTER\nA visitor-badge sticker half-printed,\nname field still blank.',
    'RECEPTION COUNTER\nA tiny zen sand garden, with one rake.\nThe sand has been raked into one stripe.',
    'RECEPTION COUNTER\nClipboard with no pen.\nPen with no clipboard. Beside it.',
  ],
  V: [
    'VENDING MACHINE\nOUT OF ORDER — BILL VALIDATOR JAM.\nThe sign has been there all month.',
    'VENDING MACHINE\nA single bag of pretzels stuck at C-3.\nC-3 has been the problem since 2019.',
    'VENDING MACHINE\nA dollar bill taped to the glass:\n"FOR WHOEVER FIXES THIS."',
    'VENDING MACHINE\nThe coil for E-7 spins forever.\nNothing falls. Nothing has, in months.',
    'VENDING MACHINE\nThe display loops: PLS INSERT MORE COINS.\nYou haven\'t inserted any.',
  ],
  w: [
    'WATER COOLER\nThe jug gurgles. A taped note reads:\n"Refill before you leave. — Mgmt"',
    'WATER COOLER\nNearly empty. The little cone cups\nare also nearly empty.',
    'WATER COOLER\nA stack of paper cones, half tipped.\nThe top one has lipstick on it.',
    'WATER COOLER\nThe red tap drips, slow.\nA bucket. The bucket is half full.',
    'WATER COOLER\nNo cups. A handwritten sign:\n"BYO. — Reception."',
  ],
  b: [
    'BULLETIN BOARD\n• OPEN ENROLLMENT ENDS NOV 15\n• "Lost: blue badge — Sam, ext. 4112"\n• Pizza Friday (last week\'s flyer)',
    'BULLETIN BOARD\nA payer policy update from 2019\npinned over a payer policy update from 2018.',
    'BULLETIN BOARD\n"WORKFLOW POTLUCK — Thursday 5pm —\nbring a side and a denial story."',
    'BULLETIN BOARD\nOSHA poster, faded. Someone has drawn\na tiny mustache on the regulator.',
    'BULLETIN BOARD\n"DENIAL CODE OF THE WEEK: CO-97"\nThree CO-97 jokes pinned beneath.\nEach worse than the last.',
    'BULLETIN BOARD\nA running list of "WINS THIS QUARTER."\nIt has three entries. Two are typos.',
    'BULLETIN BOARD\n"FOUND: a single blue earring."\nBeneath it, in different handwriting:\n"FOUND: the matching one. Sept 14."',
  ],
  H: [
    'EXAM TABLE\nPaper liner crinkled from the last patient.\nA blood-pressure cuff dangles off the side.',
    'INFUSION RECLINER\nThe IV pole is empty.\nA folded blanket on the seat.',
    'EXAM TABLE\nThe stirrup hardware folded back in.\nA tongue depressor on the floor.',
    'INFUSION RECLINER\nThe armrest still has the pump-tape\nresidue from the last patient. Sticky.',
    'EXAM TABLE\nA pediatric height chart on the wall behind it.\nThe top sticker is a giraffe.',
  ],
  X: [
    'FAX MACHINE\nStatus light blinking: NO LINE.\nThe out-tray has a single curled page.',
    'FAX MACHINE\nReceived: 1 page from UNKNOWN — 03:42 AM.\nThe page is upside down. You leave it.',
    'FAX MACHINE\nThe paper tray is jammed.\nA half-printed authorization curls out.',
    'FAX MACHINE\n"FAX CONFIRMATION: SUCCESS."\nNobody remembers sending one.',
    'FAX MACHINE\nThe handset is gone. Just the cradle.\nIt rings anyway. Twice.',
  ],
  c: [
    "DESK\nA half-eaten bagel on a napkin.\nOpen browser tab: \"Aetna PPO formulary 2024.\"",
    'DESK\nThe CRT hums. Photo of a corgi pinned\nto the monitor with packing tape.',
    'DESK\nSticky note on the keyboard:\n"CALL ANJALI BACK — RE: BILL."',
    'DESK\nA Rolodex. An actual Rolodex.\nMost cards blank. First one:\nMERCY GENERAL — IT — ext. 3000.',
    'DESK\nStacks of EOBs sorted by payer.\nA half-finished crossword.\n14-down: PARTITA.',
    'DESK\nMonitor sticky-noted:\n"DON\'T MOVE — recording."\nNothing is recording.',
    'DESK\nA cup of coffee, cold.\nA second cup of coffee, behind the first.\nAlso cold.',
    'DESK\nThree empty Diet Coke cans.\nThe phone\'s message-waiting light\nhas been on for a week.',
  ],
  h: [
    'WAITING-ROOM CHAIR\nVinyl. Cracked along the seam.\nThe foam underneath has gone hard.',
    'WAITING-ROOM CHAIR\nA worn paperback wedged between\nthe cushion and the armrest.',
    "WAITING-ROOM CHAIR\nA child's drawing taped to the back:\na hospital, but the windows are red.",
    'WAITING-ROOM CHAIR\nA dollar coin wedged in the seam.\nIt was tails-up.',
    'WAITING-ROOM CHAIR\nA library book left behind.\nDue date: three years ago.',
    'WAITING-ROOM CHAIR\nA discharge instruction sheet\non the seat. Nobody picked it up.',
    'WAITING-ROOM CHAIR\nThe armrest is warm.\nThe room is empty.',
  ],
  P: [
    'POTTED PLANT\nPlastic. Dust on the leaves.\nNobody has watered it since you started.',
    'POTTED PLANT\nA philodendron. Real, somehow.\nLeaves yellow at the tips.',
    'POTTED PLANT\nFake. The pot is full of takeout receipts\nsomeone shoved in there.',
    'POTTED PLANT\nA spider plant with five baby plants\ndangling. Nobody to give them to.',
    'POTTED PLANT\nFake. A real spider has\nmade itself comfortable inside.',
    'POTTED PLANT\nGoogly eyes someone stuck on the trunk.\nThree pairs. All looking elsewhere.',
  ],
  E: [
    'VITALS MONITOR\nOn a wheeled stand. The screen pulses\na slow green sine wave. Probably idle.',
    'VITALS MONITOR\nThe BP cuff is tangled in its own tube.\nThe O2 sat clip dangles.',
    'VITALS MONITOR\nThe screen reads PATIENT DISCONNECTED.\nThe room is empty.',
    'VITALS MONITOR\nA Post-It on the screen:\n"DON\'T TURN OFF — calibrating."\nNot dated.',
  ],

  // ===== 2026-05 redraw set: cars, lampposts, lecture-hall props,
  // cafeteria props, parking-lot infrastructure =====

  '1': [
    'SEDAN\nWindshield needs replacing —\nspider crack from the rearview down.',
    'SEDAN\nA hospital parking pass on the dash,\nexpired four months.',
    'SEDAN\nThe back has a dog-stencil sticker\nAND a "BABY ON BOARD" sign.\nDoesn\'t add up.',
    'SEDAN\nA balled-up McDonald\'s bag in the wheel well.\nThe driver-side door is unlocked.',
    'SEDAN\nNew car smell. New car.\nFlorida plates.',
  ],
  '2': [
    'SUV\nMud-spattered to the wheel wells.\nLicense plate frame: "I\'D RATHER BE CODING."',
    'SUV\nRoof rack carrying a kayak.\nIt\'s February.',
    'SUV\nThe back is full of car-seat detritus —\nCheerios, a sippy cup, a single tiny shoe.',
    'SUV\nLights left on. You can hear them ticking.',
    'SUV\nDealer plate frame from a place\nyou\'ve never heard of.',
  ],
  '3': [
    'BEATER\nThe driver\'s window is held up\nby a rolled towel. A flat in the back.',
    'BEATER\nDuct tape on the side panel.\nThe registration sticker is from 2017.',
    'BEATER\nA bumper sticker: "MY OTHER CAR\nIS A 1984 PROCEDURE." Dark humor.',
    'BEATER\nThe rear window has a hand-painted\nNumber 47 in glitter glue.',
    'BEATER\nThe alarm is going off, faintly.\nIt\'s been doing that for a while.',
  ],
  '4': [
    'LAMPPOST\nThe shroud is dented in.\nNot working.',
    'LAMPPOST\nA flyer stapled to the pole:\n"LOST CAT — OPI — orange tabby."\nIt\'s been there since spring.',
    'LAMPPOST\nThe base is rusted through.\nIt sways a little when the wind picks up.',
  ],
  '5': [
    'LAMPPOST\nOrnamental glass globe.\nThe bulb inside flickers, just barely.',
    'LAMPPOST\nA bird has nested on the crossbar.\nYou can hear faint chirping.',
    'LAMPPOST\nThe glass is cracked but holding.\nA web of hairline fractures, lit from within.',
  ],
  '6': [
    'LAMPPOST\nTwin globes. Only one is lit.\nThe dark one has a hairline crack.',
    'LAMPPOST\nIvy creeping up the pole.\nThe maintenance crew has given up.',
    'LAMPPOST\nA "WE\'LL MISS YOU EARL" wreath\nzip-tied to the base. Earl was the lot guy.',
  ],
  s: [
    'AUDITORIUM SEAT\nUpholstery worn at the armrest.\nThe seat bottom squeaks.',
    'AUDITORIUM SEAT\nA student name written under the seat\nin Sharpie: TANIA \'19.',
    'AUDITORIUM SEAT\nA folded note in the gap:\n"meet me after — basement."',
    'AUDITORIUM SEAT\nThe folding mechanism doesn\'t.\nNot anymore.',
    'AUDITORIUM SEAT\nA seat number plaque, brass,\nlong since worn smooth. 14B.',
  ],
  k: [
    'CHALKBOARD\nThe last lecture\'s formula:\n"PMT = ASP × 1.06"\n(Half-erased.)',
    'CHALKBOARD\nA crude diagram of the heart.\nLabeled wrong on the ventricles.',
    'CHALKBOARD\nA poem someone left up:\n"What is care, but a column —"\nThe rest is erased.',
    'CHALKBOARD\nA flowchart that loops back\non itself three times before exiting.',
    'CHALKBOARD\nGiant DRG-871 in red chalk.\nUnderneath, smaller: "DO NOT FORGET."',
  ],
  A: [
    'AVOCADO ARMCHAIR\nA spring popped through the cushion.\nYou notice it before you sit.',
    'AVOCADO ARMCHAIR\nThe upholstery smells like 1976.\nIt\'s 2026.',
    'AVOCADO ARMCHAIR\nA throw pillow embroidered\n"HOME SWEET CLAIM." Found, not bought.',
    'AVOCADO ARMCHAIR\nThe armrest has been worn pale\nin the exact shape of a forearm.',
  ],
  T: [
    'CAFETERIA TABLE\nA water ring three-deep.\nSomeone\'s ID card half-tucked under a napkin.',
    'CAFETERIA TABLE\nSalt shaker missing.\nThe pepper one is missing a leg.',
    'CAFETERIA TABLE\nA tray with one bite of pie left.\nForkprints around it.',
    'CAFETERIA TABLE\nA crossword half-finished.\nThe answer to 7-across is wrong.',
    'CAFETERIA TABLE\nA prayer card, face down.\nYou don\'t flip it.',
  ],
  m: [
    'STEAM TABLE\nMashed potatoes. Gravy.\nThe heat lamp buzzes overhead.',
    'STEAM TABLE\nThe carving station is empty —\njust the knife on the cutting board.',
    'STEAM TABLE\nMac and cheese. The crust on top\nhas been there since the lunch rush.',
  ],
  M: [
    'STEAM TABLE\nBrass rims dulled by years of cleaning.\nEach well a slightly different temperature.',
    'STEAM TABLE\nThe sneeze guard has a fingerprint.\nNot near the food. Higher.',
    'STEAM TABLE\nThe heat lamp glows red.\nThe food beneath it has stopped steaming.',
  ],
  C: [
    'CURB\nA cigarette butt in the gutter.\nLipstick on the filter.',
    'CURB\nChunks of asphalt have crumbled\naround the base. Recently.',
    'CURB\nA Sharpied "FOR HEATHER" on the\nconcrete. The H is half-faded.',
  ],
  r: [
    'STREET\nA car passes too fast.\nA paper coffee cup tumbles in its wake.',
    'STREET\nThe yellow line has worn through\nin three places. Nobody\'s repainted.',
    'STREET\nA single tire mark, fresh.\nIt curves the wrong way.',
  ],
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
