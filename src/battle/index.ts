// Mechanic factory.
//
// BattleScene calls createMechanic(encounter) once per battle. The
// encounter's optional `mechanic` field selects which controller runs
// the fight. Encounters without `mechanic` (i.e. all of today's content)
// fall through to the SimpleController so behavior is unchanged.

import type { Encounter } from '../types'
import type { MechanicController } from './types'
import { SimpleController } from './mechanics/simple'
import { InvestigationController } from './mechanics/investigation'
import { TimedController } from './mechanics/timed'

export function createMechanic(encounter: Encounter): MechanicController {
  switch (encounter.mechanic) {
    case 'investigation':
      return new InvestigationController(encounter)
    case 'timed':
      return new TimedController(encounter)
    // 'multiHead', 'mirror', 'block', 'blind', 'spawn' land in follow-up PRs.
    case 'simple':
    case 'none':
    default:
      return new SimpleController(encounter)
  }
}

export type { MechanicController, PlayerTurnResult, EnemyTurnResult } from './types'
