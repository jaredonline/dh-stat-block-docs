import type { Adversary } from '../../types/daggerheart'
import { googleDocsThemes, type GoogleDocsDensity } from '../theme'
import { adversaryStats, experienceText, hasStandardAttack, hasText, htmlText, visibleAdversaryFeatures, visibleExperiences } from '../shared'
import { docsFeature, docsFullRow, docsMetadata, docsSection, docsStats, docsTable, docsTitle } from './structure'

export function adversaryGoogleDocsHtml(block: Adversary, density: GoogleDocsDensity = 'full'): string {
  const stats = adversaryStats(block)
  // Each stat receives the same share; the selected base also divides cleanly
  // into halves for titles and thirds for metadata/features.
  const statsCount = stats.length || 1
  const divisor = (a: number, b: number): number => b === 0 ? a : divisor(b, a % b)
  const columns = googleDocsThemes[density].columns * statsCount / divisor(googleDocsThemes[density].columns, statsCount)
  const rows = [docsTitle(block.name, block.tier, block.type, density, columns)]
  if (hasText(block.description)) rows.push(docsFullRow(`<em>${htmlText(block.description)}</em>`, density, columns, 'font-style:italic;'))
  if (hasText(block.motivesAndTactics)) rows.push(docsMetadata('Motives & Tactics', block.motivesAndTactics, density, columns))
  if (stats.length) rows.push(docsStats(stats, density, columns))
  if (hasStandardAttack(block)) rows.push(docsSection('STANDARD ATTACK', density, columns), docsFullRow([
    hasText(block.standardAttack.name) ? `<div><strong>${htmlText(block.standardAttack.name)}</strong></div>` : '',
    hasText(block.standardAttack.range) ? `<div><strong>Range:</strong> ${htmlText(block.standardAttack.range)}</div>` : '',
    hasText(block.standardAttack.damage) ? `<div><strong>Damage:</strong> ${htmlText(block.standardAttack.damage)}</div>` : '',
  ].filter(Boolean).join(''), density, columns))
  const experiences = visibleExperiences(block.experiences)
  if (experiences.length) rows.push(docsSection('EXPERIENCES', density, columns), docsFullRow(experiences.map(experience => `<div>${htmlText(experienceText(experience))}</div>`).join(''), density, columns))
  const features = visibleAdversaryFeatures(block.features)
  for (const fear of [false, true]) {
    const group = features.filter(feature => feature.fearFeature === fear)
    if (group.length) rows.push(docsSection(fear ? 'FEAR FEATURES' : 'FEATURES', density, columns), ...group.map(feature => docsFeature(feature.name, feature.type, feature.text, undefined, density, columns)))
  }
  return docsTable(rows, density)
}
