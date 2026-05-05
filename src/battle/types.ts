// Shared interfaces for the per-encounter battle controllers.
//
// BattleScene owns rendering, animations, input, and player HP. A
// MechanicController owns the encounter-side state and decides what each
// turn does. Different obstacles (HP fight, investigation, timed, etc.)
// implement the same interface so BattleScene can drive any of them
// from a single turn loop.

import type { Encounter } from '../types'

/** Outcome of one player tool use. */
export interface PlayerTurnResult {
  /** Damage applied to the primary enemy HP pool. 0 if missed or no-op. */
  damage: number
  /** Set when the move is super-effective (gold visuals). */
  super?: boolean
  /** Set when accuracy rolled fail. */
  missed?: boolean
  /** Message shown in the battle log after this action. */
  message?: string
  /** True if this turn ends the battle as a win. */
  ends?: boolean
  /**
   * Mutations to apply to the ClaimSheet driven by the *result* of this
   * specific turn (e.g. an Investigation reveal landing an annotation on
   * the form). Distinct from `encounter.toolEffects` which is fixed per
   * encounter+action; these are computed from runtime state.
   */
  formEffects?: import('../types').ToolEffect[]
}

/** Outcome of the enemy's response turn. */
export interface EnemyTurnResult {
  /** Damage dealt to the player. 0 if no attack this turn. */
  damage: number
  /** Message shown in the battle log. */
  message?: string
}

/** A custom action button for mechanics that don't use the tool ribbon. */
export interface MechanicAction {
  id: string
  label: string
  /** Subtitle shown below the label. */
  sub?: string
  disabled?: boolean
}

/**
 * One controller per battle. Implementations:
 *   - `SimpleController`  — the original HP attrition fight.
 *   - `InvestigationController` — case-file fact-finding.
 *   - (next) `TimedController` — turn budget + escalating damage.
 *   - (later) `MultiHeadController`, `MirrorController`, etc.
 */
export interface MechanicController {
  readonly encounter: Encounter

  /** Ratio of remaining "enemy" presence in [0, 1] for the HP bar widget. */
  hpRatio(): number

  /** Numeric HP display (current / max) shown beside the bar. */
  hpDisplay(): { current: number; max: number }

  /**
   * Optional status text rendered above the enemy panel. Used by mechanics
   * like Timed (days remaining) or Investigation (facts found / total).
   * Return '' when nothing should be displayed.
   */
  statusLine(): string

  /**
   * Persistent multi-line text panel rendered to the side of the enemy
   * panel. Used by Investigation to display the case file. Return '' to
   * suppress the panel.
   */
  panelText(): string

  /**
   * If non-null, BattleScene renders these buttons instead of the
   * player's tool ribbon. The action `id` is what gets passed to
   * `applyPlayerTurn`. SimpleController returns null to keep tools.
   */
  getActions(): MechanicAction[] | null

  /** Apply the player's chosen action (a tool id, or a mechanic action id). */
  applyPlayerTurn(actionId: string): PlayerTurnResult

  /** Resolve the enemy's response. Called after a successful player turn. */
  applyEnemyTurn(): EnemyTurnResult

  /** True when the encounter is resolved as a win. */
  isWon(): boolean

  /**
   * True when the mechanic itself decides the battle is lost — independent
   * of player HP. Investigation uses this when the player decides badly or
   * the time budget runs out. Defaults to false (HP loss handled by the
   * scene).
   */
  isLost(): boolean
}
