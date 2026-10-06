import type { Environment } from '../../types/daggerheart'
import { googleDocsThemes, type GoogleDocsDensity } from '../theme'
import { hasText, htmlText, visibleEnvironmentFeatures } from '../shared'
import { docsFeature, docsFullRow, docsMetadata, docsSection, docsTable, docsTitle } from './structure'

export function environmentGoogleDocsHtml(block: Environment, density: GoogleDocsDensity = 'full'): string {
  const columns = googleDocsThemes[density].columns
  const rows = [docsTitle(block.name, block.tier, block.type, density, columns)]
  if (hasText(block.description)) rows.push(docsFullRow(`<em>${htmlText(block.description)}</em>`, density, columns, 'font-style:italic;'))
  for (const [label, value] of [
    ['Impulses', block.impulses], ['Difficulty', block.difficulty], ['Potential Adversaries', block.potentialAdversaries],
  ]) if (hasText(value)) rows.push(docsMetadata(label, value, density, columns))
  const features = visibleEnvironmentFeatures(block.features)
  if (features.length) rows.push(docsSection('FEATURES', density, columns), ...features.map(feature => docsFeature(feature.name, feature.type, feature.text, feature.questions, density, columns)))
  return docsTable(rows, density)
}
