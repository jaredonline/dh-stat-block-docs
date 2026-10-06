import type { Adversary, AdversaryFeature, Environment, EnvironmentFeature, Experience, Statblock, StatblockKind } from '../types/daggerheart'

export const newId = () => crypto.randomUUID()

export function newEnvironmentFeature(): EnvironmentFeature {
  return { id: newId(), name: '', type: 'Passive', text: '', questions: '' }
}

export function newAdversaryFeature(): AdversaryFeature {
  return { id: newId(), name: '', type: 'Passive', text: '', fearFeature: false }
}

export function newExperience(): Experience {
  return { id: newId(), name: '', modifier: '' }
}

export function createEnvironment(): Environment {
  return { id: newId(), kind: 'environment', name: 'Untitled Environment', tier: 1, type: 'Exploration', description: '', impulses: '', difficulty: '', potentialAdversaries: '', features: [] }
}

export function createAdversary(): Adversary {
  return { id: newId(), kind: 'adversary', name: 'Untitled Adversary', tier: 1, type: 'Standard', description: '', motivesAndTactics: '', difficulty: '', thresholds: { major: '', severe: '' }, hp: '', stress: '', attackModifier: '', standardAttack: { name: '', range: '', damage: '' }, experiences: [], features: [] }
}

export function createStatblock(kind: StatblockKind): Statblock {
  return kind === 'environment' ? createEnvironment() : createAdversary()
}

export function duplicateStatblock(block: Statblock): Statblock {
  const copy = structuredClone(block)
  copy.id = newId()
  copy.name = `${block.name || 'Untitled'} (copy)`
  copy.features = copy.features.map(feature => ({ ...feature, id: newId() })) as typeof copy.features
  if (copy.kind === 'adversary') copy.experiences = copy.experiences.map(experience => ({ ...experience, id: newId() }))
  return copy
}

export function createSamples(): Statblock[] {
  const environment: Environment = {
    ...createEnvironment(),
    name: 'Chaos Realm', tier: 4, type: 'Traversal',
    description: 'A realm where space twists, direction loses meaning, and the landscape refuses to obey ordinary geometry.',
    impulses: 'Confuse direction and orientation', difficulty: '20', potentialAdversaries: 'Chaos creatures, warped guardians',
    features: [
      { ...newEnvironmentFeature(), name: 'Impossible Architecture', type: 'Passive', text: 'Up is down, down is right, and right is starward. Movement through this environment follows impossible spatial relationships.', questions: 'What does it feel like to move through a space so alien to your senses?' },
      { ...newEnvironmentFeature(), name: 'Shifting Pathways', type: 'Action', text: 'Spend a Fear to suddenly alter the relationship between two nearby locations.', questions: "What familiar landmark is now somewhere it shouldn't be?" },
    ],
  }
  const adversary: Adversary = {
    ...createAdversary(),
    name: 'Wayward Sentinel', tier: 2, type: 'Standard',
    description: 'A wandering guardian of tarnished brass, still protecting a road that no longer exists.',
    motivesAndTactics: 'Guard the passage, demand an explanation, drive intruders back',
    difficulty: '14', thresholds: { major: '8', severe: '16' }, hp: '5', stress: '3', attackModifier: '+2',
    standardAttack: { name: 'Weathered Halberd', range: 'Very Close', damage: '2d8+2 phy' },
    experiences: [{ ...newExperience(), name: 'Watchful', modifier: '+2' }],
    features: [
      { ...newAdversaryFeature(), name: 'Hold the Road', type: 'Passive', text: 'The sentinel plants its feet when guarding a narrow passage. Moving it requires overcoming its Difficulty.' },
      { ...newAdversaryFeature(), name: 'Warning Sweep', type: 'Action', text: 'Mark a Stress to sweep the halberd in a wide arc. On a successful attack, push the target back to Close range.' },
      { ...newAdversaryFeature(), name: 'Echoes of the Watch', type: 'Reaction', fearFeature: true, text: 'When the sentinel takes Severe damage, spend a Fear to awaken the echoes of its former patrol. Their distant footsteps draw closer.' },
    ],
  }
  return [environment, adversary]
}
