import type { Environment } from '../../types/daggerheart'
import { hasText, visibleEnvironmentFeatures } from '../shared'
import { htmlArticle, htmlDescription, htmlFeature, htmlMetadata, htmlSection, htmlTitle } from './structure'

export function environmentHtml(block: Environment): string {
  const content = [htmlTitle(block.name, block.tier, block.type)]
  if (hasText(block.description)) content.push(htmlDescription(block.description))
  const metadata = ([
    ['Impulses', block.impulses], ['Difficulty', block.difficulty], ['Potential Adversaries', block.potentialAdversaries],
  ] as [string, string][]).filter(([, value]) => hasText(value))
  if (metadata.length) content.push(htmlMetadata(metadata))
  const features = visibleEnvironmentFeatures(block.features)
  if (features.length) content.push(htmlSection('FEATURES', features.map(feature => htmlFeature(feature.name, feature.type, feature.text, feature.questions)).join('')))
  return htmlArticle(content)
}
