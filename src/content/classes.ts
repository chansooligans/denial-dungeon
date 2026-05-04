import type { ClassDef, ClassId } from '../types'

export const CLASSES: Record<ClassId, ClassDef> = {
  rural: {
    id: 'rural',
    name: 'Rural Clinic',
    blurb: 'Low payer mix, simple E&M claims. Forgiving start.',
    startingHp: 100,
    startingAbilities: ['submit_837p', 'eligibility_270'],
    difficulty: 'Easy',
  },
  specialty: {
    id: 'specialty',
    name: 'Specialty Group',
    blurb: 'Heavy prior-auth load, specialty Rx, narrow networks.',
    startingHp: 75,
    startingAbilities: ['submit_837p', 'prior_auth_278', 'eligibility_270'],
    difficulty: 'Medium',
  },
  academic: {
    id: 'academic',
    name: 'Academic Medical Center',
    blurb: 'DRG-heavy, multi-claim split bills. Big swings.',
    startingHp: 120,
    startingAbilities: ['submit_837p', 'submit_837i', 'cdi_query', 'appeal_letter'],
    difficulty: 'Hard',
  },
}
