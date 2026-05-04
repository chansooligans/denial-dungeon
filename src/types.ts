export type Faction =
  | 'payer'
  | 'provider'
  | 'vendor'
  | 'patient'
  | 'employer'
  | 'system'

export const FACTION_LABEL: Record<Faction, string> = {
  payer: 'Payer',
  provider: 'Provider',
  vendor: 'Vendor',
  patient: 'Patient',
  employer: 'Employer',
  system: 'System',
}

export const FACTION_COLOR: Record<Faction, number> = {
  payer: 0x6da9e3,
  provider: 0xec8f6e,
  vendor: 0x6cd49a,
  patient: 0xf4d06f,
  employer: 0xb18bd6,
  system: 0xa3aab5,
}

export type CardId = string
export type EnemyId = string

export interface Ability {
  id: string
  name: string
  faction: Faction
  cooldown: number
  damage: number
  range: number
  projectileSpeed: number
  blocksFactions?: Faction[]
  effect: string
  teaches: string
  shadow?: boolean
  reputationDelta?: number
  auditDelta?: number
  cashDelta?: number
}

export interface EnemyDef {
  id: EnemyId
  carcCode: string
  name: string
  hp: number
  surfaceFaction: Faction
  rootFaction: Faction
  speed: number
  attackDamage: number
  attackCooldown: number
  projectileSpeed: number
  counterFactions: Faction[]
  description: string
  watchpoint: string
}

export type NodeType = 'combat' | 'event' | 'shop' | 'boss'

export interface RoomDef {
  phase: number
  type: NodeType
  enemies: EnemyId[]
  cleared: boolean
}

export interface RunState {
  seed: string
  classId: 'rural' | 'specialty' | 'academic'
  phase: number
  room: number
  resources: {
    hp: number
    maxHp: number
    cash: number
    reputation: number
    auditRisk: number
  }
  abilities: string[]
  rooms: RoomDef[]
  discovered: EnemyId[]
  status: 'playing' | 'won' | 'lost'
}

export const PHASE_NAMES = [
  'Search',
  'Eligibility',
  'Prior Auth',
  'Care',
  'Documentation',
  'Coding',
  'Clearinghouse',
  'Adjudication',
  'Appeals',
  'Patient Bill',
  'Contracting',
] as const

export type ClassId = 'rural' | 'specialty' | 'academic'

export interface ClassDef {
  id: ClassId
  name: string
  blurb: string
  startingHp: number
  startingAbilities: string[]
  difficulty: 'Easy' | 'Medium' | 'Hard'
}
