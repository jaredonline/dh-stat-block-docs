import type { Environment } from '../types/daggerheart'
import { visibleEnvironmentFeatures } from '../renderers/shared'
import { FeaturePreview, hasText, MetadataRow, PreviewHeader } from './PreviewParts'

export function EnvironmentPreview({ block }: { block: Environment }) {
  const features = visibleEnvironmentFeatures(block.features)
  const metadata = [
    ['Impulses', block.impulses],
    ['Difficulty', block.difficulty],
    ['Potential Adversaries', block.potentialAdversaries],
  ].filter(([, value]) => hasText(value))

  return (
    <article className="statblock-preview environment-preview" aria-label={`${block.name || 'Environment'} statblock preview`}>
      <PreviewHeader {...block} />
      {metadata.length > 0 && <dl className="statblock-metadata">{metadata.map(([label, value]) => <MetadataRow key={label} label={label}>{value}</MetadataRow>)}</dl>}
      {features.length > 0 && <>
        <h3 className="statblock-section-title">Features</h3>
        {features.map(feature => <FeaturePreview feature={feature} key={feature.id} />)}
      </>}
    </article>
  )
}
