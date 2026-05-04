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
  },
  tools: ['submit_837p', 'eligibility_270'],
  codexUnlocked: [],
  decisions: [],
  inWaitingRoom: false,
}

let currentState: GameState = structuredClone(DEFAULT_STATE)

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
