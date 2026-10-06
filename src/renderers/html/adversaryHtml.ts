import type { Adversary } from '../../types/daggerheart'
import { adversaryStats, experienceText, hasStandardAttack, hasText, htmlText, visibleAdversaryFeatures, visibleExperiences } from '../shared'
import { htmlArticle, htmlBody, htmlDescription, htmlFeature, htmlMetadata, htmlSection, htmlStats, htmlTitle } from './structure'

export function adversaryHtml(block: Adversary): string {
  const content = [htmlTitle(block.name, block.tier, block.type)]
  if (hasText(block.description)) content.push(htmlDescription(block.description))
  if (hasText(block.motivesAndTactics)) content.push(htmlMetadata([['Motives & Tactics', block.motivesAndTactics]]))
  const stats = adversaryStats(block)
  if (stats.length) content.push(htmlStats(stats))
  if (hasStandardAttack(block)) content.push(htmlSection('STANDARD ATTACK', htmlBody([
    hasText(block.standardAttack.name) ? `<strong>${htmlText(block.standardAttack.name)}</strong>` : '',
    hasText(block.standardAttack.range) ? `<span><strong>Range:</strong> ${htmlText(block.standardAttack.range)}</span>` : '',
    hasText(block.standardAttack.damage) ? `<span><strong>Damage:</strong> ${htmlText(block.standardAttack.damage)}</span>` : '',
  ].filter(Boolean).join('<br>'))))
  const experiences = visibleExperiences(block.experiences)
  if (experiences.length) content.push(htmlSection('EXPERIENCES', htmlBody(experiences.map(experience => htmlText(experienceText(experience))).join('<br>'))))
  const features = visibleAdversaryFeatures(block.features)
  for (const fear of [false, true]) {
    const group = features.filter(feature => feature.fearFeature === fear)
    if (group.length) content.push(htmlSection(fear ? 'FEAR FEATURES' : 'FEATURES', group.map(feature => htmlFeature(feature.name, feature.type, feature.text)).join('')))
  }
  return htmlArticle(content)
}
