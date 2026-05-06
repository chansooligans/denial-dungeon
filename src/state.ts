import type { GameState } from './types'

const SAVE_KEY = 'denial_dungeon_save'

const DEFAULT_STATE: GameState = {
  currentLevel: 1,
  levelComplete: Array(10).fill(false),
  levelStars: Array(10).fill(0),
  resources: {
    hp: 100,
    maxHp: 100,
    cash: 0,
    reputation: 50,
    auditRisk: 0,
    stress: 0,
  },
  // Day-one toolkit: the basics every analyst has on their first shift.
  // Additional tools unlock from defeating obstacles (encounter
  // unlocksOnDefeat) and dialogue choices (effect.addTool).
  tools: [
    'submit_837p',
    'eligibility_270',
    'claim_scrubber',
    'cdi_query',
    'appeal_letter',
  ],
  codexUnlocked: [],
  decisions: [],
  inWaitingRoom: false,
  activeTickets: [],
  defeatedObstacles: [],
  // L1 starts with only the Eligibility wing open; later levels unlock more.
  wingsUnlocked: ['eligibility'],
  obstaclesSeen: [],
  formsPerfected: [],
}

let currentState: GameState = loadFromStorage() ?? structuredClone(DEFAULT_STATE)

function loadFromStorage(): GameState | null {
  try {
    const raw = localStorage.getItem(SAVE_KEY)
    if (raw) return migrateState(JSON.parse(raw))
  } catch { /* ignore */ }
  return null
}

/**
 * Forward-compat migration for older saves: fill in any fields that
 * didn't exist when this save was first persisted. Idempotent.
 */
function migrateState(loaded: Partial<GameState> & Record<string, unknown>): GameState {
  const base = structuredClone(DEFAULT_STATE)
  const merged: GameState = {
    ...base,
    ...loaded,
    resources: { ...base.resources, ...(loaded.resources ?? {}) },
  }
  // Defensive: ensure new arrays exist even if the old save was partial.
  merged.activeTickets ??= []
  merged.defeatedObstacles ??= []
  merged.obstaclesSeen ??= []
  merged.formsPerfected ??= []
  merged.wingsUnlocked ??= base.wingsUnlocked
  merged.tools ??= []
  // Top up the tool list with any missing default tools. Players don't
  // lose the new day-one kit just because their save predates it.
  for (const toolId of base.tools) {
    if (!merged.tools.includes(toolId)) merged.tools.push(toolId)
  }
  return merged
}

export function getState(): GameState {
  return currentState
}

export function setState(partial: Partial<GameState>) {
  Object.assign(currentState, partial)
}

export function updateResources(deltas: Partial<GameState['resources']>) {
  const r = currentState.resources
  if (deltas.hp !== undefined) r.hp = Math.max(0, Math.min(r.maxHp, r.hp + deltas.hp))
  if (deltas.cash !== undefined) r.cash += deltas.cash
  if (deltas.reputation !== undefined) r.reputation = Math.max(0, Math.min(100, r.reputation + deltas.reputation))
  if (deltas.auditRisk !== undefined) r.auditRisk = Math.max(0, Math.min(100, r.auditRisk + deltas.auditRisk))
  if (deltas.stress !== undefined) r.stress = Math.max(0, Math.min(100, r.stress + deltas.stress))
}

export function unlockTool(toolId: string) {
  if (!currentState.tools.includes(toolId)) {
    currentState.tools.push(toolId)
  }
}

export function unlockCodex(entryId: string) {
  if (!currentState.codexUnlocked.includes(entryId)) {
    currentState.codexUnlocked.push(entryId)
  }
}

export function saveGame() {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(currentState))
  } catch { /* localStorage may be unavailable */ }
}

export function loadGame(): boolean {
  try {
    const raw = localStorage.getItem(SAVE_KEY)
    if (raw) {
      currentState = JSON.parse(raw)
      return true
    }
  } catch { /* ignore */ }
  return false
}

export function newGame() {
  currentState = structuredClone(DEFAULT_STATE)
  saveGame()
}

/**
 * Level-progression thresholds. Defeating this many obstacles in
 * total advances the player to the next level. Tuned so L1 caps at
 * 2 (orientation), L2 at 4 (registration), L3 at 6 (auth), etc.
 *
 * Indexed by level — completing `LEVEL_DEFEAT_THRESHOLD[i]` defeats
 * means level (i+1) is done. So the player advances out of level 1
 * after 2 defeats, out of level 2 after 4 cumulative defeats, etc.
 */
export const LEVEL_DEFEAT_THRESHOLD: number[] = [
  1,  // L1 → 1 defeat to advance (intro is dialogue-driven; only one case for now)
  4,  // L2 → 4 cumulative
  6,  // L3 → 6
  8,  // L4 → 8
  10, // L5 → 10
  12, // L6 → 12
  14, // L7 → 14
  16, // L8 → 16
  18, // L9 → 18
  20, // L10 → 20 (audit boss completes the run)
]

/**
 * Check whether the current cumulative defeat count crosses the
 * threshold for the player's current level. If so, advance
 * `currentLevel` (capped at 10) and mark the prior level complete.
 *
 * Returns the new level if advanced, else null. Callers can show a
 * banner / play a sting based on the return value.
 *
 * Call this after pushing onto `defeatedObstacles` and saving.
 */
export function checkLevelProgression(): number | null {
  const defeats = currentState.defeatedObstacles.length
  const lvl = currentState.currentLevel
  if (lvl >= 10) return null
  const threshold = LEVEL_DEFEAT_THRESHOLD[lvl - 1]
  if (defeats < threshold) return null
  // Advance.
  currentState.levelComplete[lvl - 1] = true
  currentState.currentLevel = lvl + 1
  // Drop a banner-pending marker — HospitalScene reads + clears
  // this on entry to surface the "Level N — <Title>" banner.
  currentState.pendingLevelBanner = currentState.currentLevel
  saveGame()
  return currentState.currentLevel
}

/**
 * Read the pending level-advance banner (if any) and clear it. Returns
 * the level number to announce, or null if no banner is pending.
 */
export function consumePendingLevelBanner(): number | null {
  const lvl = currentState.pendingLevelBanner ?? null
  if (lvl !== null) {
    currentState.pendingLevelBanner = null
    saveGame()
  }
  return lvl
}
