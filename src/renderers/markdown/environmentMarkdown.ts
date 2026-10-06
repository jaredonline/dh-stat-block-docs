import type { Environment } from '../../types/daggerheart'
import { displayName, hasText, markdownItalic, markdownText, visibleEnvironmentFeatures } from '../shared'

export function environmentMarkdown(block: Environment): string {
  const sections = [`# ${markdownText(displayName(block.name))}`, `*Tier ${block.tier} ${markdownText(block.type)}*`]
  if (hasText(block.description)) sections.push(markdownItalic(block.description))
  const metadata = [
    ['Impulses', block.impulses], ['Difficulty', block.difficulty], ['Potential Adversaries', block.potentialAdversaries],
  ].filter(([, value]) => hasText(value)).map(([label, value]) => `**${label}:** ${markdownText(value)}`)
  if (metadata.length) sections.push(metadata.join('  \n'))
  const features = visibleEnvironmentFeatures(block.features)
  if (features.length) sections.push('## Features', ...features.map(feature => [
    `### ${markdownText(feature.name) || 'Untitled feature'} — ${markdownText(feature.type)}`,
    hasText(feature.text) ? markdownText(feature.text) : '',
    hasText(feature.questions) ? markdownItalic(feature.questions) : '',
  ].filter(Boolean).join('\n\n')))
  return sections.join('\n\n')
}
