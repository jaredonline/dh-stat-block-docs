import type { Environment } from '../../types/daggerheart'
import { displayName, hasText, normalizeText, visibleEnvironmentFeatures } from '../shared'

export function environmentPlainText(block: Environment): string {
  const sections = [`${displayName(block.name)} — Tier ${block.tier} ${block.type}`]
  if (hasText(block.description)) sections.push(normalizeText(block.description))
  const metadata = [
    ['Impulses', block.impulses], ['Difficulty', block.difficulty], ['Potential Adversaries', block.potentialAdversaries],
  ].filter(([, value]) => hasText(value)).map(([label, value]) => `${label}: ${normalizeText(value)}`)
  if (metadata.length) sections.push(metadata.join('\n'))
  const features = visibleEnvironmentFeatures(block.features)
  if (features.length) sections.push('FEATURES', ...features.map(feature => [
    `${normalizeText(feature.name) || 'Untitled feature'} — ${feature.type}`,
    hasText(feature.text) ? normalizeText(feature.text) : '',
    hasText(feature.questions) ? `Questions:\n${normalizeText(feature.questions)}` : '',
  ].filter(Boolean).join('\n\n')))
  return sections.join('\n\n')
}
