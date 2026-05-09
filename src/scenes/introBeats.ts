// Intro cinematic beat data — separated from IntroScene.ts so the
// /intro-editor.html dev tool can import the same source-of-truth
// without dragging Phaser into the tool's bundle.
//
// Beats reference scene-action methods by string id (`actionId`,
// `sceneActionId`) rather than inline lambdas. IntroScene maintains
// a registry that maps id → method invocation; see SCENE_ACTIONS in
// IntroScene.ts. This indirection keeps Beat fully serializable so
// the editor can round-trip edits as a TS snippet.

export type SceneActionId =
  | 'showHospitalPan'
  | 'showDesk'
  | 'showClaimVanish'
  | 'showFall'
  | 'showGap'
  | 'showWaitingRoom'

export interface Beat {
  type: 'text' | 'scene' | 'wait' | 'title' | 'cover' | 'backdrop'
  lines?: string[]
  color?: string
  duration?: number
  /** For 'scene' beats: which IntroScene method to invoke. */
  actionId?: SceneActionId
  /** Texture key for 'cover' and 'backdrop'. */
  key?: string
  /** Target alpha for 'backdrop' (default 0.35). */
  alpha?: number
  /** For 'text' beats: an optional scene action that fires the moment
   *  the line starts (so a visual can play *behind* the typed text
   *  instead of running as a separate beat afterward). */
  sceneActionId?: SceneActionId
  /** For 'text' beats: when true, play the voiceover but don't render
   *  the typed text on screen. Useful when an upcoming cover image
   *  already shows the same text in the comic art. */
  silent?: boolean
  /** For 'cover' beats: when true, fire the next narration MP3 as
   *  the cover starts displaying. Lets a line of voiceover land on
   *  the comic page rather than before it. */
  voice?: boolean
}

// ===== Scene objects ======================================================
//
// Per-scene placement data. Each `show<Name>()` method that's been
// converted reads its decorative-object list from SCENE_OBJECTS.<name>
// instead of hardcoding `add.image(...)` calls in source. The
// /intro-editor.html "Scene composition" panel scrubs these arrays
// visually (drag to move, click+Del to remove, palette to add) and
// emits a paste-back snippet.
//
// Tile grids (walls/floors), procedural primitives (rectangles, text),
// and per-object tweens stay inline in IntroScene — only the
// placeable image/sprite objects move into data.
//
// Currently extracted: showHospitalPan. Convert other show* methods
// using the same pattern: pull the static `add.image(...)` calls into
// a typed array here, replace them with a `for` loop in the method.

export interface SceneObject {
  /** Phaser texture key — must be registered in BootScene. */
  sprite: string
  /** Tile-grid position; world-pixel coords are `x * GRID, y * GRID`
   *  where GRID is the scene's tile size (32 px for showHospitalPan). */
  x: number
  y: number
  /** Square display size in world pixels. Defaults to 64. */
  size?: number
  /** Final alpha after fade-in. Defaults to 0.5. */
  alpha?: number
}

export interface HospitalPanObjects {
  /** Tile size used to convert grid (x,y) → world pixels. The editor
   *  needs this number to render objects at the right position. */
  gridSize: number
  /** Decorative objects layered on top of the procedural wall/floor
   *  grid. Order doesn't matter — every object fades in at the same
   *  delay. Add/remove freely. */
  objects: SceneObject[]
}

export interface SceneObjects {
  hospitalPan: HospitalPanObjects
}

export const SCENE_OBJECTS: SceneObjects = {
  hospitalPan: {
    gridSize: 32,
    objects: [
      { sprite: 'h_desk', x: 10, y: 15 },
      { sprite: 'h_desk', x: 20, y: 20 },
      { sprite: 'h_desk', x: 30, y: 14 },
      { sprite: 'h_desk', x: 40, y: 22 },
      { sprite: 'h_desk', x: 50, y: 18 },
    ],
  },
}

// ===== Beats ==============================================================

export const BEATS: Beat[] = [
  // Cover splash — full-bleed title page art before narration begins.
  { type: 'cover', key: 'intro_cover', duration: 3200 },

  // Beat 1: The Hook — text only over plain dark background.
  { type: 'text', lines: [
    'In the United States, it costs $215 in',
    'administrative work to process a single',
    'hospital bill.',
  ], color: '#e6edf3' },
  { type: 'wait', duration: 2200 },
  { type: 'text', lines: ['In Canada, it costs $6.'], color: '#f0a868' },
  { type: 'wait', duration: 2000 },
  // ("That's not a typo." was removed — the $6 line lands the gut-
  // punch on its own. The intro song's fade-in start is delayed by
  // INTRO_SONG_START_DELAY_MS in IntroScene to keep the song's
  // arrival pegged to the same later beat it used to.)

  // Beat 2: The System
  { type: 'scene', actionId: 'showHospitalPan' },
  { type: 'text', lines: [
    'Every day, thousands of claims move through',
    'a system so complex that no single person',
    'understands all of it.',
  ], color: '#8b95a5' },
  { type: 'wait', duration: 3000 },
  { type: 'text', lines: [
    'Doctors document. Coders translate.',
    'Billers submit. Payers decide. Patients pay.',
  ], color: '#8b95a5' },
  { type: 'wait', duration: 3000 },
  { type: 'text', lines: [
    'And somewhere between all of them,',
    'claims get lost.',
  ], color: '#e6edf3' },
  { type: 'wait', duration: 2500 },

  // Beat 3: Your Desk
  { type: 'scene', actionId: 'showDesk' },
  { type: 'text', lines: [
    'You, Chloe, are an intern',
    'at Mercy General Hospital.',
  ], color: '#e6edf3' },
  { type: 'wait', duration: 2000 },
  { type: 'text', lines: [
    "It's Friday. It's late.",
    'You should have gone home hours ago.',
  ], color: '#8b95a5' },
  { type: 'wait', duration: 2500 },

  // Beat 4: The Vanishing
  { type: 'scene', actionId: 'showClaimVanish' },
  { type: 'text', lines: [
    'One claim. Routine knee replacement.',
    'Filed correctly — you think.',
  ], color: '#e6edf3' },
  { type: 'wait', duration: 2000 },
  { type: 'text', lines: [
    'But when you look for it in the system...',
  ], color: '#e6edf3' },
  { type: 'wait', duration: 1500 },
  { type: 'text', lines: [
    "It's gone.",
  ], color: '#ef5b7b' },
  { type: 'wait', duration: 1200 },
  { type: 'text', lines: [
    'Not denied. Not rejected. Not pending.',
    'Gone.',
  ], color: '#ef5b7b',
    // Drop into the fall animation as the line types — the character
    // falling visually rhymes with the claim being "gone".
    sceneActionId: 'showFall',
  },
  // Brief wait that extends to cover the voiceover's tail, then the
  // gap-reveal scene action fires immediately (no extra dead air).
  { type: 'wait', duration: 200 },

  // Beat 5: The Gap (procedural only; comic art shown as full reveal at end).
  { type: 'scene', actionId: 'showGap' },
  { type: 'wait', duration: 200 },

  // Beat 7: The Waiting Room
  { type: 'scene', actionId: 'showWaitingRoom' },
  { type: 'text', lines: [
    'Below the hospital you know,',
    'there is another place.',
  ], color: '#e6edf3' },
  { type: 'wait', duration: 2500 },
  { type: 'text', lines: [
    'A place where every claim that was',
    'ever filed still exists — waiting.',
  ], color: '#8b95a5' },
  { type: 'wait', duration: 2500 },
  { type: 'text', lines: [
    'The chairs stretch on forever.',
    'The number on the ticket counter',
    'never seems to change.',
  ], color: '#8b95a5' },
  { type: 'wait', duration: 2500 },
  { type: 'text', lines: [
    'Forms fill out themselves, then unfill.',
    'Somewhere, a phone rings',
    'that no one answers.',
  ], color: '#8b95a5' },
  { type: 'wait', duration: 2500 },
  { type: 'text', lines: [
    'They call it',
  ], color: '#e6edf3' },
  { type: 'wait', duration: 2000 },

  // End reveal: full-bleed comic pages. Order intentionally flipped
  // — page6 first, then page5 (which has 'THE WAITING ROOM' lettered
  // into the comic art) as the climactic final image. The 18.mp3
  // narration ('The Waiting Room.') fires on the FIRST cover via
  // `voice: true` so the line lands on the comic page rather than
  // before it.
  { type: 'cover', key: 'intro_page6', duration: 6300, voice: true },
  { type: 'cover', key: 'intro_page5', duration: 5700 },

  // Closer: corridor reveal (gothic figures lurking in Mercy General)
  // and Chloe at her desk back at work — bridges the cinematic into
  // the gameplay framing without any new narration.
  { type: 'cover', key: 'intro_page7', duration: 5500 },
  { type: 'cover', key: 'intro_page8', duration: 5500 },

  // Beat 8: Title
  { type: 'title' },
]
