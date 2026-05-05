// Mechanic factory.
//
// BattleScene calls createMechanic(encounter) once per battle. The
// encounter's optional `mechanic` field selects which controller runs
// the fight. Encounters without `mechanic` (i.e. all of today's content)
// fall through to the SimpleController so behavior is unchanged.

import type { Encounter } from '../types'
import type { MechanicController } from './types'
import { SimpleController } from './mechanics/simple'

export function createMechanic(encounter: Encounter): MechanicController {
  switch (encounter.mechanic) {
    // Phase 2 will add 'investigation' and 'timed' controllers here.
    case 'simple':
    case 'none':
    default:
      return new SimpleController(encounter)
  }
}

export type { MechanicController, PlayerTurnResult, EnemyTurnResult } from './types'
