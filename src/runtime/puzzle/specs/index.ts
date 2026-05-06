// Registry of runtime puzzle specs. Encounters that opt into the
// new prototype-shape battle set `puzzleSpecId` to one of these keys.

import type { PuzzleSpec } from '../types'
import { BUNDLE_PUZZLE } from './bundle'
import { WRAITH_PUZZLE } from './wraith'
import { REAPER_PUZZLE } from './reaper'

export const PUZZLE_SPECS: Record<string, PuzzleSpec> = {
  bundle: BUNDLE_PUZZLE,
  wraith: WRAITH_PUZZLE,
  reaper: REAPER_PUZZLE,
}

export function getPuzzleSpec(id: string): PuzzleSpec | undefined {
  return PUZZLE_SPECS[id]
}
