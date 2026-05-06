// Registry of runtime puzzle specs. Encounters that opt into the
// new prototype-shape battle set `puzzleSpecId` to one of these keys.

import type { PuzzleSpec } from '../types'
import { INTRO_PUZZLE } from './intro'
import { BUNDLE_PUZZLE } from './bundle'
import { WRAITH_PUZZLE } from './wraith'
import { REAPER_PUZZLE } from './reaper'
import { DOPPELGANGER_PUZZLE } from './doppelganger'
import { FOG_PUZZLE } from './fog'
import { GATEKEEPER_PUZZLE } from './gatekeeper'
import { AUDIT_BOSS_PUZZLE } from './auditBoss'
import { HYDRA_PUZZLE } from './hydra'
import { SWARM_PUZZLE } from './swarm'
import { SPECTER_PUZZLE } from './specter'
import { LIGHTHOUSE_PUZZLE } from './lighthouse'
import { SURPRISE_BILL_PUZZLE } from './surpriseBill'

export const PUZZLE_SPECS: Record<string, PuzzleSpec> = {
  intro: INTRO_PUZZLE,
  bundle: BUNDLE_PUZZLE,
  wraith: WRAITH_PUZZLE,
  reaper: REAPER_PUZZLE,
  doppelganger: DOPPELGANGER_PUZZLE,
  fog: FOG_PUZZLE,
  gatekeeper: GATEKEEPER_PUZZLE,
  'audit-boss': AUDIT_BOSS_PUZZLE,
  hydra: HYDRA_PUZZLE,
  swarm: SWARM_PUZZLE,
  specter: SPECTER_PUZZLE,
  lighthouse: LIGHTHOUSE_PUZZLE,
  'surprise-bill': SURPRISE_BILL_PUZZLE,
}

export function getPuzzleSpec(id: string): PuzzleSpec | undefined {
  return PUZZLE_SPECS[id]
}
