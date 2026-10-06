import type { Adversary } from '../types/daggerheart'
import { adversaryStats, hasStandardAttack, visibleAdversaryFeatures, visibleExperiences } from '../renderers/shared'
import { FeaturePreview, hasText, MetadataRow, PreviewHeader } from './PreviewParts'

export function AdversaryPreview({ block }: { block: Adversary }) {
  const { standardAttack } = block
  const stats = adversaryStats(block)
  const experiences = visibleExperiences(block.experiences)
  const features = visibleAdversaryFeatures(block.features)
  const regularFeatures = features.filter(feature => !feature.fearFeature)
  const fearFeatures = features.filter(feature => feature.fearFeature)
  const hasAttack = hasStandardAttack(block)

  return (
    <article className="statblock-preview adversary-preview" aria-label={`${block.name || 'Adversary'} statblock preview`}>
      <PreviewHeader {...block} />
      {hasText(block.motivesAndTactics) && <dl className="statblock-metadata"><MetadataRow label="Motives & Tactics">{block.motivesAndTactics}</MetadataRow></dl>}
      {stats.length > 0 && <dl className="statblock-stats">{stats.map(([label, value]) => <MetadataRow key={label} label={label}>{value}</MetadataRow>)}</dl>}
      {hasAttack && <>
        <h3 className="statblock-section-title">Standard attack</h3>
        <div className="statblock-attack">
          {hasText(standardAttack.name) && <strong className="statblock-multiline">{standardAttack.name}</strong>}
          {(hasText(standardAttack.range) || hasText(standardAttack.damage)) && <dl>
            {hasText(standardAttack.range) && <MetadataRow label="Range">{standardAttack.range}</MetadataRow>}
            {hasText(standardAttack.damage) && <MetadataRow label="Damage">{standardAttack.damage}</MetadataRow>}
          </dl>}
        </div>
      </>}
      {experiences.length > 0 && <>
        <h3 className="statblock-section-title">Experiences</h3>
        <dl className="statblock-experiences">{experiences.map(experience => <MetadataRow key={experience.id} label={experience.name}>{experience.modifier}</MetadataRow>)}</dl>
      </>}
      {regularFeatures.length > 0 && <>
        <h3 className="statblock-section-title">Features</h3>
        {regularFeatures.map(feature => <FeaturePreview feature={feature} key={feature.id} />)}
      </>}
      {fearFeatures.length > 0 && <>
        <h3 className="statblock-section-title">Fear Features</h3>
        {fearFeatures.map(feature => <FeaturePreview feature={feature} key={feature.id} />)}
      </>}
    </article>
  )
}
