export const ENVIRONMENT_TYPES = ['Exploration', 'Social', 'Traversal', 'Event'] as const
export const ADVERSARY_TYPES = ['Bruiser', 'Horde', 'Leader', 'Minion', 'Ranged', 'Skulk', 'Social', 'Solo', 'Standard', 'Support'] as const
export const FEATURE_TYPES = ['Passive', 'Action', 'Reaction'] as const

export type Tier = 1 | 2 | 3 | 4
export type EnvironmentType = (typeof ENVIRONMENT_TYPES)[number]
export type AdversaryType = (typeof ADVERSARY_TYPES)[number]
export type FeatureType = (typeof FEATURE_TYPES)[number]
export type StatblockKind = 'environment' | 'adversary'

interface BaseFeature {
  id: string
  name: string
  type: FeatureType
  text: string
}

export interface EnvironmentFeature extends BaseFeature {
  questions: string
}

export interface AdversaryFeature extends BaseFeature {
  fearFeature: boolean
}

export interface Experience {
  id: string
  name: string
  modifier: string
}

interface BaseStatblock {
  id: string
  name: string
  tier: Tier
  description: string
  difficulty: string
}

export interface Environment extends BaseStatblock {
  kind: 'environment'
  type: EnvironmentType
  impulses: string
  potentialAdversaries: string
  features: EnvironmentFeature[]
}

export interface Adversary extends BaseStatblock {
  kind: 'adversary'
  type: AdversaryType
  motivesAndTactics: string
  thresholds: { major: string; severe: string }
  hp: string
  stress: string
  attackModifier: string
  standardAttack: { name: string; range: string; damage: string }
  experiences: Experience[]
  features: AdversaryFeature[]
}

export type Statblock = Environment | Adversary
