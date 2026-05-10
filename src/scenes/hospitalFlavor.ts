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
// Voice registers (mixed across each tile's variant list so the
// player isn't reading the same tone every time):
//
//   Default — dry, observant, three lines tops. Most flavor.
//
//   Procedural fragment — looks like a chart note, an audit trail
//     entry, a clipboard line. ALL CAPS or labeled fields. Reads as
//     a thing someone wrote down, not a thing Chloe is saying.
//
//   Overheard — a single quoted line attributed to nobody.
//     Drops the player into someone else's conversation, briefly.
//
//   Lowercase narrative — same observation in lowercase, sentence-
//     case, first-person-present. Looser. Slightly literary.
//
//   Patient perspective — describes the object as the patient who
//     used it might have seen it. Brief. Often the warmest beat.
//
//   Lynchian — the object is wrong in a small specific way. Wood
//     paneling too dark. Lights too warm. The cabinet is humming.
//
//   Diagnostic-poetry — a sentence that sounds clinical but lands
//     elsewhere. Very rare.
//
// Mix freely within each tile's list. The hash-based picker spreads
// them naturally across neighboring tiles.

export const TILE_FLAVOR: Record<string, string | string[]> = {
  L: [
    'LOCKED — KEYCARD REQUIRED\nThe reader sticker reads:\n"Authorized personnel only. Prior Auth team."',
    'LOCKED\nKeyhole filled with hot glue.\nThe handle still moves a quarter-inch.',
    'LOCKED\nA half-peeled Post-It on the door:\n"ASK ABOUT THE COMBO — DON\'T GUESS."',
    'LOCKED\nThe knob is warm. You don\'t know why.',
    'a locked door.\nyou don\'t have what opens it.\nnot yet.',
    'DOOR · STATUS: LOCKED\nLAST ACCESS: 04:11\nCREDENTIAL: REVOKED',
    '"— and they just changed the combo,\nso don\'t bother."\nVoices, fading down the corridor.',
    'A locked door. The brass plate\naround the lock has been polished\nin one small thumb-shaped spot.',
    'LOCKED\nA child\'s drawing taped at knee-height:\nthe door, but open. With a heart on top.',
    'The door is locked from the inside.\nWhich is the part that doesn\'t make sense.',
  ],
  F: [
    'FILING CABINET\nDrawer locked. A peeling label:\nPRE-2018 / DO NOT PURGE.',
    'FILING CABINET\nTop drawer half-open. Manila folders\ntabbed: AETNA, AETNA, AETNA, OTHER.',
    'FILING CABINET\nLocked. The keyhole has been filled\nwith hot glue. Recently.',
    'FILING CABINET\nA dent in the side from a kicked foot.\nLabel: APPEALS / RESOLVED.',
    'FILING CABINET\nA charm necklace looped over the handle.\nNobody has admitted to losing it.',
    'FILING CABINET\nA coffee ring on top, three layers deep.\nTop folder reads: 2019 / DESTROY 2026.',
    'FILING CABINET\nMagnet on the side: "WORLD\'S OK\'EST CODER."\nNobody owns up to that one either.',
    // procedural-fragment register
    'CABINET · BAY 4-C\nLAST INVENTORIED: 2017Q3\nCONTENTS: assumed.',
    'FILES · STATUS: SEALED\nPER 45 CFR 164.530.\nAccess requires written request.',
    // overheard register
    '"— anything before \'19 is in here,\nbut I don\'t know which here —"',
    '"— don\'t ask me, I just file what they hand me."',
    // lowercase narrative
    'a beige filing cabinet.\nthe third drawer down rattles\nwhen you walk past. you walk past.',
    'a cabinet, locked. someone has\nlabeled the lock STUCK in pencil,\nso you don\'t feel bad about it.',
    // Lynchian
    'FILING CABINET\nThe whole thing is humming.\nNothing in the building is electric here.',
    'FILING CABINET\nThe top drawer opens an inch by itself.\nYou close it.',
    // diagnostic-poetry
    'A vertical body of records.\nFour stacked compartments —\nfour stacked years of someone\'s care.',
  ],
  B: [
    'WHITEBOARD\n"DENIAL OF THE WEEK: CO-16"\nMissing remark code. Half-erased.',
    'WHITEBOARD\nA flowchart titled FRONT-END EDITS.\nThe last branch trails off into a question mark.',
    'WHITEBOARD\nKPI tracker. Clean Claim Rate: 84%.\n(Goal: 95%. The 84 has been there a month.)',
    'WHITEBOARD\n"Numerator / Denominator." Underlined\nthree times. No definitions given.',
    'WHITEBOARD\nA list: 14 names. Twelve crossed out.\nThe last two circled in red.',
    'WHITEBOARD\nAn arrow loops back into itself.\nLabel: APPEAL CYCLE.',
    'WHITEBOARD\nA birthday count for someone named\n"BARB" — three days. Taped over.',
    // procedural / chart-note
    'WHITEBOARD · MAIN HUB\nWeek of: blank\nFocus area: blank\nOwner: blank',
    'WHITEBOARD\nA Gantt chart in dry-erase blue.\nEvery bar ends in "TBD."',
    // overheard
    '"if you\'re going to write on it,\nwrite in pencil first." — ghosting\non the lower right corner.',
    '"I don\'t care who put it up there,\nI care who takes it down."\nQuote of the week. Sept.',
    // lowercase narrative
    'a whiteboard. someone has drawn\na frowning face in the corner\nand erased it half away.',
    'on the board: a single equation.\nx = the patient. y = the bill.\nno equals sign.',
    // patient perspective
    'WHITEBOARD\nThe word HOPE is written in the corner\nin a different hand. Smaller. In green.',
    // Lynchian
    'WHITEBOARD\nThe word AUDIT is written\nin the corner. You don\'t remember\nseeing it last week. Or writing it.',
    // diagnostic-poetry
    'A whiteboard, vast and partly erased.\nThe ghost of a word — STILL —\nfaint enough to question.',
  ],
  R: [
    'RECEPTION COUNTER\nIntake clipboards stacked four deep.\nA ballpoint pen, chained.',
    'RECEPTION COUNTER\nA bell. A sign: "PLEASE RING ONCE."\nSomeone has rung it twice in pen.',
    'RECEPTION COUNTER\nA candy dish. Empty. Just wrappers.\nStrawberry — always the strawberry left.',
    'RECEPTION COUNTER\nA visitor-badge sticker half-printed,\nname field still blank.',
    'RECEPTION COUNTER\nA tiny zen sand garden, with one rake.\nThe sand has been raked into one stripe.',
    'RECEPTION COUNTER\nClipboard with no pen.\nPen with no clipboard. Beside it.',
    // procedural
    'COUNTER · STATION 2\nQUEUE: 4\nAVG WAIT: 23 MIN',
    'INTAKE STATION\n"Please have ID + insurance card ready."\nUnderneath, in pencil: "and patience."',
    // overheard
    '"...is your insurance the same as last time?"\n"...kind of?"',
    '"if it\'s on the form, it\'s on the form."',
    // lowercase narrative
    'the counter, scratched along its top edge\nfrom thirty thousand sliding clipboards.\nyou can almost see the grain.',
    'a small bowl of mints. all green.\nyou\'ve never seen anyone take one.',
    // patient perspective
    'RECEPTION COUNTER\nFrom this side, you can see the receptionist\'s\nshoes — sneakers, untied.',
    // Lynchian
    'RECEPTION COUNTER\nThe surface is laminate, but cool to the touch.\nLike a mortuary table. Same exact temperature.',
  ],
  V: [
    'VENDING MACHINE\nOUT OF ORDER — BILL VALIDATOR JAM.\nThe sign has been there all month.',
    'VENDING MACHINE\nA single bag of pretzels stuck at C-3.\nC-3 has been the problem since 2019.',
    'VENDING MACHINE\nA dollar bill taped to the glass:\n"FOR WHOEVER FIXES THIS."',
    'VENDING MACHINE\nThe coil for E-7 spins forever.\nNothing falls. Nothing has, in months.',
    'VENDING MACHINE\nThe display loops: PLS INSERT MORE COINS.\nYou haven\'t inserted any.',
    // procedural
    'VENDING UNIT 042\nLAST RESTOCKED: 11/02\nLAST EARNED: $2.25',
    // overheard
    '"the chocolate ones are\nthree weeks expired but somehow\nthey still hit." — taped to the side.',
    // lowercase narrative
    'the machine hums in C-flat.\na fluorescent buzz right at the edge\nof you noticing.',
    'a little plastic flap that opens onto nothing.\nsomeone took the prize and forgot\nto close the door.',
    // patient perspective
    'VENDING MACHINE\nA child sits in front of it,\nstaring up at the chips.\nNobody has come back for her.',
    // Lynchian
    'VENDING MACHINE\nRow B, slot 4 has a small pair of car keys\nbehind the chip bags. They\'ve been there\nfor as long as anyone remembers.',
  ],
  w: [
    'WATER COOLER\nThe jug gurgles. A taped note reads:\n"Refill before you leave. — Mgmt"',
    'WATER COOLER\nNearly empty. The little cone cups\nare also nearly empty.',
    'WATER COOLER\nA stack of paper cones, half tipped.\nThe top one has lipstick on it.',
    'WATER COOLER\nThe red tap drips, slow.\nA bucket. The bucket is half full.',
    'WATER COOLER\nNo cups. A handwritten sign:\n"BYO. — Reception."',
    // procedural
    'WATER COOLER · STATION 3\nLAST FILTER CHANGE: 2024Q1\nLAST WATER REFILL: this morning',
    // overheard
    '"— and I told him, water is water,\nbut he keeps bringing the Brita pitcher in." —\nfaint, from down the hall.',
    // lowercase narrative
    'the jug burps a single bubble.\nyou wait for the second one.\nit doesn\'t come.',
    'water cooler. blue ring of dust\naround the base — a halo for things\nnobody touches.',
    // Lynchian
    'WATER COOLER\nThe water level has not dropped\nin a week. Nobody has refilled it.',
  ],
  b: [
    'BULLETIN BOARD\n• OPEN ENROLLMENT ENDS NOV 15\n• "Lost: blue badge — Sam, ext. 4112"\n• Pizza Friday (last week\'s flyer)',
    'BULLETIN BOARD\nA payer policy update from 2019\npinned over a payer policy update from 2018.',
    'BULLETIN BOARD\n"WORKFLOW POTLUCK — Thursday 5pm —\nbring a side and a denial story."',
    'BULLETIN BOARD\nOSHA poster, faded. Someone has drawn\na tiny mustache on the regulator.',
    'BULLETIN BOARD\n"DENIAL CODE OF THE WEEK: CO-97"\nThree CO-97 jokes pinned beneath.\nEach worse than the last.',
    'BULLETIN BOARD\nA running list of "WINS THIS QUARTER."\nIt has three entries. Two are typos.',
    'BULLETIN BOARD\n"FOUND: a single blue earring."\nBeneath it, in different handwriting:\n"FOUND: the matching one. Sept 14."',
    // procedural
    'BULLETIN BOARD · MAIN HUB\nPosted: 11/15\nApproved: pending',
    // overheard
    '"— who\'s the gnome in 2C, pinning recipes\nover the safety stuff." — laughter,\ndrifting from the hall.',
    // lowercase narrative
    'a corkboard, but most of the cork\nis hidden under thirty years\nof slightly out-of-date paper.',
    'a Polaroid of the team from 2014.\nthree of those people no longer work here.\nyou still get the holiday card from one.',
    // patient perspective
    'BULLETIN BOARD\nA crayon drawing pinned at\nchild-eye height: a stick-figure family\noutside a hospital, smiling.',
    // Lynchian
    'BULLETIN BOARD\nA Polaroid in the corner shows\nthis exact wall, last year. Same items.\nDifferent light.',
    // diagnostic-poetry
    'A board of small surviving things.\nTaped, layered, illegible.\nNobody removes anything; the board only grows.',
  ],
  H: [
    'EXAM TABLE\nPaper liner crinkled from the last patient.\nA blood-pressure cuff dangles off the side.',
    'INFUSION RECLINER\nThe IV pole is empty.\nA folded blanket on the seat.',
    'EXAM TABLE\nThe stirrup hardware folded back in.\nA tongue depressor on the floor.',
    'INFUSION RECLINER\nThe armrest still has the pump-tape\nresidue from the last patient. Sticky.',
    'EXAM TABLE\nA pediatric height chart on the wall behind it.\nThe top sticker is a giraffe.',
    // procedural
    'BAY 3 · STATUS: TURNED OVER\nLAST PATIENT: discharge 10:42\nNEXT PATIENT: 11:15',
    // overheard
    '"— and tell her not to lie down till the\nlidocaine catches up." — voice from\nthe hallway, fading.',
    // lowercase narrative
    'an exam table. the crinkle of the paper\nstill audible somewhere in the building.\na hundred crinkles a day.',
    'an infusion recliner. a paperback face-down\non the side table — page 173. someone\nstopped mid-chapter to be called in.',
    // patient perspective
    'INFUSION RECLINER\nFrom this seat, you\'d see the bag\nabove your shoulder, and the line dropping\nfrom it once a second. Once a second.',
    // Lynchian
    'EXAM TABLE\nThe paper has been changed but not torn.\nWhich means it ran out at the roll.\nWhich means somebody re-rolled it.',
    // diagnostic-poetry
    'A paper-covered horizon\nwhere a thousand patients have lain\nin the same shape.',
  ],
  X: [
    'FAX MACHINE\nStatus light blinking: NO LINE.\nThe out-tray has a single curled page.',
    'FAX MACHINE\nReceived: 1 page from UNKNOWN — 03:42 AM.\nThe page is upside down. You leave it.',
    'FAX MACHINE\nThe paper tray is jammed.\nA half-printed authorization curls out.',
    'FAX MACHINE\n"FAX CONFIRMATION: SUCCESS."\nNobody remembers sending one.',
    'FAX MACHINE\nThe handset is gone. Just the cradle.\nIt rings anyway. Twice.',
    // procedural
    'FAX UNIT 6\nLAST TX: 14:02 → AETNA PA UNIT\nSTATUS: OK',
    'FAX UNIT 6\nQUEUE: 3 OUTBOUND, 0 INBOUND\nLINE: BUSY (4 retries)',
    // overheard
    '"the fax. yes. still." — Dana,\nyesterday afternoon, to nobody.',
    '"if you can read it, you can fax it.\nif you can fax it, you have proof."',
    // lowercase narrative
    'the fax breathes. it does that.\nyou\'ve learned not to startle.',
    'a fax machine in 2026, still here,\nstill warm to the touch, still required\nby seven of the twelve major payers.',
    // Lynchian
    'FAX MACHINE\nThe out-tray has one page in it,\nface down. You don\'t turn it over.',
    // diagnostic-poetry
    'A small electric mouth\nthat speaks in pages.\nIt has spoken eleven times today.',
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
    // procedural
    'WORKSTATION 14\nUSER: pat.tan\nLAST LOGIN: 7:42\nLOGGED OFF: never',
    'DESK · UTILIZATION REVIEW\nQUEUE: 22\nSLA AT RISK: 3',
    // overheard
    '"if you move my snake plant\nI\'m gonna lose it." — sticky\nstuck to the monitor.',
    '"call before you fax. fax before you call.\nthat\'s the order. that\'s how it works."',
    // lowercase narrative
    'a desk like every desk: monitor, mug,\nstapler, two pens that don\'t work,\none that does.',
    'a workstation. the wrist rest is shaped\nto someone else\'s wrist by now.\nyou wonder whose.',
    'a small framed photo: a dog,\na rented cabin, a person looking just\noffscreen and laughing.',
    // patient perspective
    'DESK\nFrom the patient side: a wall of paper.\nThe analyst is somewhere behind it.\nYou can hear her typing.',
    // Lynchian
    'DESK\nThe screensaver is the time.\n12:14, in green numbers, scrolling slow.\nIt\'s 4 PM.',
    // diagnostic-poetry
    'A desk arranged the way a desk\nis arranged when its person\nhas been here a long time.',
  ],
  h: [
    'WAITING-ROOM CHAIR\nVinyl. Cracked along the seam.\nThe foam underneath has gone hard.',
    'WAITING-ROOM CHAIR\nA worn paperback wedged between\nthe cushion and the armrest.',
    "WAITING-ROOM CHAIR\nA child's drawing taped to the back:\na hospital, but the windows are red.",
    'WAITING-ROOM CHAIR\nA dollar coin wedged in the seam.\nIt was tails-up.',
    'WAITING-ROOM CHAIR\nA library book left behind.\nDue date: three years ago.',
    'WAITING-ROOM CHAIR\nA discharge instruction sheet\non the seat. Nobody picked it up.',
    'WAITING-ROOM CHAIR\nThe armrest is warm.\nThe room is empty.',
    // procedural
    'CHAIR · ROW 3, SEAT 4\nESTIMATED OCCUPANCY THIS WEEK: 18',
    // overheard
    '"— and they said it would be twenty minutes,\nthat was an hour ago." — a man,\nto nobody, near the entrance.',
    '"if you sit a long time on these,\nyou start to think about\nthe people who sat here before you."',
    // lowercase narrative
    'a chair like a thousand chairs.\nyou\'ve sat in one of these. you will\nsit in one of these again.',
    'a chair, slightly off-center.\nsomebody got up too fast and\ndidn\'t realign it.',
    'on the seat: a small bouquet wrapped\nin cellophane. the kind a kid\nmakes at a gas station.',
    // patient perspective
    'WAITING-ROOM CHAIR\nFrom this seat the clock is hard to see.\nMaybe that\'s on purpose.',
    'WAITING-ROOM CHAIR\nYou can reach the magazines from here.\nNone of them are from this year.\nYou knew that before you reached.',
    // Lynchian
    'WAITING-ROOM CHAIR\nThe seat across from you is creaking.\nThere\'s nobody in it.',
    'WAITING-ROOM CHAIR\nThe upholstery is warm in the same\nshape as before. Just slightly\noff from where you\'re sitting.',
    // diagnostic-poetry
    'A chair, vinyl, weight-bearing.\nA waiting machine.\nIt does its job whether or not anyone is in it.',
  ],
  P: [
    'POTTED PLANT\nPlastic. Dust on the leaves.\nNobody has watered it since you started.',
    'POTTED PLANT\nA philodendron. Real, somehow.\nLeaves yellow at the tips.',
    'POTTED PLANT\nFake. The pot is full of takeout receipts\nsomeone shoved in there.',
    'POTTED PLANT\nA spider plant with five baby plants\ndangling. Nobody to give them to.',
    'POTTED PLANT\nFake. A real spider has\nmade itself comfortable inside.',
    'POTTED PLANT\nGoogly eyes someone stuck on the trunk.\nThree pairs. All looking elsewhere.',
    // procedural
    'PLANT · BAY 7\nLAST WATERED: ?\nSPECIES: ? (silk)',
    // overheard
    '"the only thing in this building that\'s\nstill green and breathing." — Sam, last week,\npretty sincere about it.',
    // lowercase narrative
    'a small plant in a clay pot.\nsomeone has tied a little ribbon\naround its trunk. the ribbon is for nothing.',
    'a fern with a yellowing frond.\nyou consider watering it.\nyou don\'t.',
    // patient perspective
    'POTTED PLANT\nA child has tucked a folded paper crane\ninto the pot. The crane is real.\nThe plant isn\'t.',
    // Lynchian
    'POTTED PLANT\nThe leaves move slightly when you\'re\nnot looking. There is no air vent\nin this part of the room.',
  ],
  E: [
    'VITALS MONITOR\nOn a wheeled stand. The screen pulses\na slow green sine wave. Probably idle.',
    'VITALS MONITOR\nThe BP cuff is tangled in its own tube.\nThe O2 sat clip dangles.',
    'VITALS MONITOR\nThe screen reads PATIENT DISCONNECTED.\nThe room is empty.',
    'VITALS MONITOR\nA Post-It on the screen:\n"DON\'T TURN OFF — calibrating."\nNot dated.',
    // procedural
    'PHILIPS MX450\nLAST CAL: 09/12\nNEXT CAL: 03/13',
    'BEDSIDE MONITOR\nALARM: SUSPENDED\nMODE: STANDBY',
    // overheard
    '"if it\'s beeping at you, it\'s\nasking. listen." — Dr. Park,\noverheard from rounds.',
    // lowercase narrative
    'a vitals monitor on a wheeled cart.\nthe wheels squeak in different keys.\nthe back wheel is the loudest.',
    // Lynchian
    'VITALS MONITOR\nThe screen shows two heart-rate traces.\nThe second one is just a quarter-beat behind.',
    // diagnostic-poetry
    'A small machine that listens for the body\nin three places at once,\nand shows what it hears in green.',
  ],

  // ===== 2026-05 redraw set: cars, lampposts, lecture-hall props,
  // cafeteria props, parking-lot infrastructure =====

  '1': [
    'SEDAN\nWindshield needs replacing —\nspider crack from the rearview down.',
    'SEDAN\nA hospital parking pass on the dash,\nexpired four months.',
    'SEDAN\nThe back has a dog-stencil sticker\nAND a "BABY ON BOARD" sign.\nDoesn\'t add up.',
    'SEDAN\nA balled-up McDonald\'s bag in the wheel well.\nThe driver-side door is unlocked.',
    'SEDAN\nNew car smell. New car.\nFlorida plates.',
    // procedural
    'VEHICLE · LOT C\nPLATE: 7HXP-449\nSTATUS: parked > 8h',
    // overheard
    '"my car? blue, four doors,\nbroken antenna." — at the desk,\nan hour ago.',
    // lowercase narrative
    'a sedan, parked between the lines.\nthe window cracked an inch.\nsomeone\'s coming back soon.',
    'a small bumper sticker:\n"i brake for documentation."\nyou laugh, briefly.',
    // patient perspective
    'SEDAN\nA car seat in the back,\nstill with the new-baby tag\non the strap. Not new anymore.',
    // Lynchian
    'SEDAN\nThe driver\'s seat is reclined fully back.\nNobody\'s in it. The keys\nare in the ignition.',
  ],
  '2': [
    'SUV\nMud-spattered to the wheel wells.\nLicense plate frame: "I\'D RATHER BE CODING."',
    'SUV\nRoof rack carrying a kayak.\nIt\'s February.',
    'SUV\nThe back is full of car-seat detritus —\nCheerios, a sippy cup, a single tiny shoe.',
    'SUV\nLights left on. You can hear them ticking.',
    'SUV\nDealer plate frame from a place\nyou\'ve never heard of.',
    // procedural
    'VEHICLE · ACCESSIBLE TAG\nDOT-mounted placard,\nblue. Renewal: 2027.',
    // overheard
    '"someone\'s left their lights on" —\nover the lobby PA, twice today.\nnobody\'s come out.',
    // lowercase narrative
    'an SUV parked across two lines.\nyou consider keying it.\nyou don\'t.',
    'a sticker on the back window:\n"my kid is honor roll at —"\nthe school name is sun-faded blank.',
    // Lynchian
    'SUV\nThe windows are tinted black.\nThe engine is not running.\nThe inside is exactly the same temperature\nas outside.',
  ],
  '3': [
    'BEATER\nThe driver\'s window is held up\nby a rolled towel. A flat in the back.',
    'BEATER\nDuct tape on the side panel.\nThe registration sticker is from 2017.',
    'BEATER\nA bumper sticker: "MY OTHER CAR\nIS A 1984 PROCEDURE." Dark humor.',
    'BEATER\nThe rear window has a hand-painted\nNumber 47 in glitter glue.',
    'BEATER\nThe alarm is going off, faintly.\nIt\'s been doing that for a while.',
    // procedural
    'VEHICLE · ABANDONED?\nSAME LOT POSITION 14 DAYS\nNO COMPLAINT FILED',
    // overheard
    '"if it has rust, it has stories." —\nbumper sticker, half-peeled.',
    // lowercase narrative
    'a car in the lot the way a tooth\nis in a jaw — there because\nremoving it would cost more.',
    'a beater, the kind of beater you grow attached to.\nthe sun-faded interior is the color\nof a thing once cared for.',
    // patient perspective
    'BEATER\nA wheelchair lift in the back,\njerry-rigged. Black market YouTube tutorial,\nten years ago, still working.',
    // Lynchian
    'BEATER\nThe radio is on, faintly.\nThe ignition is off.',
  ],
  '4': [
    'LAMPPOST\nThe shroud is dented in.\nNot working.',
    'LAMPPOST\nA flyer stapled to the pole:\n"LOST CAT — OPI — orange tabby."\nIt\'s been there since spring.',
    'LAMPPOST\nThe base is rusted through.\nIt sways a little when the wind picks up.',
    // procedural
    'LIGHT · POLE 14\nLAST INSPECTION: 2023\nLAMP TYPE: HPS (replace w/ LED)',
    // overheard
    '"the one at the end of the row\nflickers in morse, I swear" —\nlot guy, joking. probably.',
    // lowercase narrative
    'a lamppost whose pole has been kicked\nso many times the dent is now its shape.',
    // Lynchian
    'LAMPPOST\nNot lit. The bulb is intact.\nThe wiring is sound.\nIt simply isn\'t lit.',
  ],
  '5': [
    'LAMPPOST\nOrnamental glass globe.\nThe bulb inside flickers, just barely.',
    'LAMPPOST\nA bird has nested on the crossbar.\nYou can hear faint chirping.',
    'LAMPPOST\nThe glass is cracked but holding.\nA web of hairline fractures, lit from within.',
    // procedural
    'LIGHT · POLE 22\nORNAMENTAL — PRESERVATION HOLD\nDO NOT REPLACE',
    // lowercase narrative
    'a lamppost like a small lit moon.\nyou stand under it, briefly,\nand are the same temperature as it.',
    // patient perspective
    'LAMPPOST\nThe glow falls in a perfect circle.\nA child once stood inside it,\nlooking up.',
    // Lynchian
    'LAMPPOST\nThe globe holds a small dark shape\ninside it. Not a bulb.\nNot today.',
  ],
  '6': [
    'LAMPPOST\nTwin globes. Only one is lit.\nThe dark one has a hairline crack.',
    'LAMPPOST\nIvy creeping up the pole.\nThe maintenance crew has given up.',
    'LAMPPOST\nA "WE\'LL MISS YOU EARL" wreath\nzip-tied to the base. Earl was the lot guy.',
    // procedural
    'LIGHT · POLE 31 (TWIN)\nLEFT GLOBE: OK\nRIGHT GLOBE: OUT (since 2024Q3)',
    // overheard
    '"two suns. one always shy."\n— hand-painted on the base,\nsomeone\'s small gift.',
    // lowercase narrative
    'a twin lamp. one of them flickers,\nthe other doesn\'t.\nthey aren\'t synchronized.',
    // Lynchian
    'LAMPPOST\nThe two globes are slightly\ndifferent shades of yellow.\nYou\'ve never noticed before.',
  ],
  s: [
    'AUDITORIUM SEAT\nUpholstery worn at the armrest.\nThe seat bottom squeaks.',
    'AUDITORIUM SEAT\nA student name written under the seat\nin Sharpie: TANIA \'19.',
    'AUDITORIUM SEAT\nA folded note in the gap:\n"meet me after — basement."',
    'AUDITORIUM SEAT\nThe folding mechanism doesn\'t.\nNot anymore.',
    'AUDITORIUM SEAT\nA seat number plaque, brass,\nlong since worn smooth. 14B.',
    // procedural
    'SEAT 8-D · ROW H\nLAST OCCUPIED: residency lecture\nLOST + FOUND TICKET: none',
    // overheard
    '"— and that is why we use the modifier 25,\nwhen we use it." — a lecturer,\nsomewhere down the row.',
    // lowercase narrative
    'a row seat that bounces back\nwhen you stand. like an apology.',
    'a seat. someone has scratched\na small heart into the armrest,\nthen tried to scratch it out.',
    // patient perspective
    'AUDITORIUM SEAT\nA small folded program tucked\ninto the gap. Tonight\'s topic: GRIEF\nIN CLINICAL DOCUMENTATION.',
    // Lynchian
    'AUDITORIUM SEAT\nThe seat in front of you is folded down\non its own. There is nobody\nin this row.',
  ],
  k: [
    'CHALKBOARD\nThe last lecture\'s formula:\n"PMT = ASP × 1.06"\n(Half-erased.)',
    'CHALKBOARD\nA crude diagram of the heart.\nLabeled wrong on the ventricles.',
    'CHALKBOARD\nA poem someone left up:\n"What is care, but a column —"\nThe rest is erased.',
    'CHALKBOARD\nA flowchart that loops back\non itself three times before exiting.',
    'CHALKBOARD\nGiant DRG-871 in red chalk.\nUnderneath, smaller: "DO NOT FORGET."',
    // procedural
    'BOARD · LECTURE HALL B\nLAST CLEANED: 2023\nLAST WRITTEN: yesterday',
    // overheard
    '"the older the chalkboard, the better\nthe ghosts of equations." — a professor,\nlast year, half-joking.',
    // lowercase narrative
    'a chalkboard that\'s mostly chalkboard\nand partly the ghosts of every lecture\nimperfectly erased.',
    // Lynchian
    'CHALKBOARD\nThe equation has changed\nsince you last looked.\nYou last looked one minute ago.',
    // diagnostic-poetry
    'A blackboard, almost.\nThe slate keeps an outline of every word\never written on it. A history visible only to itself.',
  ],
  A: [
    'AVOCADO ARMCHAIR\nA spring popped through the cushion.\nYou notice it before you sit.',
    'AVOCADO ARMCHAIR\nThe upholstery smells like 1976.\nIt\'s 2026.',
    'AVOCADO ARMCHAIR\nA throw pillow embroidered\n"HOME SWEET CLAIM." Found, not bought.',
    'AVOCADO ARMCHAIR\nThe armrest has been worn pale\nin the exact shape of a forearm.',
    // overheard
    '"the chair from my mother\'s living room\nbut bigger and slightly wronger."\n— a visitor, to nobody.',
    // lowercase narrative
    'an armchair the color of an avocado\nthat\'s about to turn. comfortable\nin the way old things are.',
    // patient perspective
    'AVOCADO ARMCHAIR\nThe seat is sunken in two places —\nthe shape of every patient\nwho\'s waited here in pairs.',
    // Lynchian
    'AVOCADO ARMCHAIR\nThe pattern, up close, is a repeating\nmotif of small open eyes.\nIt looks like fronds, from a distance.',
  ],
  T: [
    'CAFETERIA TABLE\nA water ring three-deep.\nSomeone\'s ID card half-tucked under a napkin.',
    'CAFETERIA TABLE\nSalt shaker missing.\nThe pepper one is missing a leg.',
    'CAFETERIA TABLE\nA tray with one bite of pie left.\nForkprints around it.',
    'CAFETERIA TABLE\nA crossword half-finished.\nThe answer to 7-across is wrong.',
    'CAFETERIA TABLE\nA prayer card, face down.\nYou don\'t flip it.',
    // procedural
    'TABLE 4 · CAFETERIA\nLAST WIPED: ?\nSEATS: 4 (3 chairs present)',
    // overheard
    '"— and the doctor said it might be\nweeks. weeks." — a family,\ntwo tables over.',
    // lowercase narrative
    'a round table. someone has put down\ntheir tray, gotten up, and forgotten\nwhich one was theirs.',
    // patient perspective
    'CAFETERIA TABLE\nA paper napkin folded into a star.\nSomeone\'s child made it,\nwaiting for a parent in surgery.',
    // Lynchian
    'CAFETERIA TABLE\nA single ice cube in the middle of the table,\nnowhere near a glass.\nNot melting.',
  ],
  m: [
    'STEAM TABLE\nMashed potatoes. Gravy.\nThe heat lamp buzzes overhead.',
    'STEAM TABLE\nThe carving station is empty —\njust the knife on the cutting board.',
    'STEAM TABLE\nMac and cheese. The crust on top\nhas been there since the lunch rush.',
    // procedural
    'STEAM WELL · TRAY 3\nFOOD: MASHED\nINTERNAL TEMP: 168°F (held)',
    // overheard
    '"the gravy comes from a mix.\nthe mix comes from corporate.\ncorporate comes from connecticut."',
    // lowercase narrative
    'a steam table, the food sweating\nunder its plastic dome.\nyou wonder if "sweating food" is a phrase.',
  ],
  M: [
    'STEAM TABLE\nBrass rims dulled by years of cleaning.\nEach well a slightly different temperature.',
    'STEAM TABLE\nThe sneeze guard has a fingerprint.\nNot near the food. Higher.',
    'STEAM TABLE\nThe heat lamp glows red.\nThe food beneath it has stopped steaming.',
    // procedural
    'BUFFET · 4-WELL HOTEL PAN\nWELL 1: empty\nWELL 2: red beans\nWELL 3: rice\nWELL 4: empty',
    // patient perspective
    'STEAM TABLE\nA hand-lettered sign in front:\n"please ask if you have questions"\nNobody is behind it to ask.',
    // Lynchian
    'STEAM TABLE\nThe brass under your hand is warm.\nThe trays inside are cold.',
  ],
  C: [
    'CURB\nA cigarette butt in the gutter.\nLipstick on the filter.',
    'CURB\nChunks of asphalt have crumbled\naround the base. Recently.',
    'CURB\nA Sharpied "FOR HEATHER" on the\nconcrete. The H is half-faded.',
    // overheard
    '"watch your step." — habit,\nfrom a guard fifteen yards back.',
    // lowercase narrative
    'a curb, painted yellow, where the yellow\nhas mostly become memory.',
    // patient perspective
    'CURB\nA child has chalked a hopscotch grid here\nand someone has half-erased it,\nthen left it.',
  ],
  r: [
    'STREET\nA car passes too fast.\nA paper coffee cup tumbles in its wake.',
    'STREET\nThe yellow line has worn through\nin three places. Nobody\'s repainted.',
    'STREET\nA single tire mark, fresh.\nIt curves the wrong way.',
    // procedural
    'STREET · MERCY DR\nSPEED LIMIT: 25\nLAST RESURFACED: 2019',
    // overheard
    '"every road past a hospital\nis somebody\'s last road, eventually." —\noverheard, on a smoke break.',
    // Lynchian
    'STREET\nThe yellow line breaks for the crosswalk\nand resumes on the other side.\nThe two halves are not aligned.',
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
