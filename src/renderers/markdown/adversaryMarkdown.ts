import type { Adversary } from '../../types/daggerheart'
import { adversaryStats, displayName, experienceText, hasStandardAttack, hasText, markdownItalic, markdownText, visibleAdversaryFeatures, visibleExperiences } from '../shared'

export function adversaryMarkdown(block: Adversary): string {
  const sections = [`# ${markdownText(displayName(block.name))}`, `*Tier ${block.tier} ${markdownText(block.type)}*`]
  if (hasText(block.description)) sections.push(markdownItalic(block.description))
  if (hasText(block.motivesAndTactics)) sections.push(`**Motives & Tactics:** ${markdownText(block.motivesAndTactics)}`)
  const stats = adversaryStats(block)
  if (stats.length) sections.push(stats.map(([label, value]) => `**${label}:** ${markdownText(value)}`).join('  \n'))
  if (hasStandardAttack(block)) sections.push('## Standard Attack', [
    hasText(block.standardAttack.name) ? `**${markdownText(block.standardAttack.name)}**` : '',
    hasText(block.standardAttack.range) ? `**Range:** ${markdownText(block.standardAttack.range)}` : '',
    hasText(block.standardAttack.damage) ? `**Damage:** ${markdownText(block.standardAttack.damage)}` : '',
  ].filter(Boolean).join('  \n'))
  const experiences = visibleExperiences(block.experiences)
  if (experiences.length) sections.push('## Experiences', experiences.map(experience => `- ${markdownText(experienceText(experience))}`).join('\n'))
  const features = visibleAdversaryFeatures(block.features)
  for (const fear of [false, true]) {
    const group = features.filter(feature => feature.fearFeature === fear)
    if (group.length) sections.push(fear ? '## Fear Features' : '## Features', ...group.map(feature => [
      `### ${markdownText(feature.name) || 'Untitled feature'} — ${markdownText(feature.type)}`,
      hasText(feature.text) ? markdownText(feature.text) : '',
    ].filter(Boolean).join('\n\n')))
  }
  return sections.join('\n\n')
}
