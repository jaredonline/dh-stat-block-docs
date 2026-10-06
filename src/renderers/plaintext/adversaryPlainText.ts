import type { Adversary } from '../../types/daggerheart'
import { adversaryStats, displayName, experienceText, hasStandardAttack, hasText, normalizeText, visibleAdversaryFeatures, visibleExperiences } from '../shared'

export function adversaryPlainText(block: Adversary): string {
  const sections = [`${displayName(block.name)} — Tier ${block.tier} ${block.type}`]
  if (hasText(block.description)) sections.push(normalizeText(block.description))
  if (hasText(block.motivesAndTactics)) sections.push(`Motives & Tactics: ${normalizeText(block.motivesAndTactics)}`)
  const stats = adversaryStats(block)
  if (stats.length) sections.push(stats.map(([label, value]) => `${label}: ${normalizeText(value)}`).join('\n'))
  if (hasStandardAttack(block)) sections.push('STANDARD ATTACK', [
    normalizeText(block.standardAttack.name),
    hasText(block.standardAttack.range) ? `Range: ${normalizeText(block.standardAttack.range)}` : '',
    hasText(block.standardAttack.damage) ? `Damage: ${normalizeText(block.standardAttack.damage)}` : '',
  ].filter(Boolean).join('\n'))
  const experiences = visibleExperiences(block.experiences)
  if (experiences.length) sections.push('EXPERIENCES', experiences.map(experienceText).join('\n'))
  const features = visibleAdversaryFeatures(block.features)
  for (const fear of [false, true]) {
    const group = features.filter(feature => feature.fearFeature === fear)
    if (group.length) sections.push(fear ? 'FEAR FEATURES' : 'FEATURES', ...group.map(feature => [
      `${normalizeText(feature.name) || 'Untitled feature'} — ${feature.type}`,
      hasText(feature.text) ? normalizeText(feature.text) : '',
    ].filter(Boolean).join('\n\n')))
  }
  return sections.join('\n\n')
}
