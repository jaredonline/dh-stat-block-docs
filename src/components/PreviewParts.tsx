import type { ReactNode } from 'react'
import { hasText } from '../renderers/shared'
import type { AdversaryFeature, EnvironmentFeature, Tier } from '../types/daggerheart'

export { hasText } from '../renderers/shared'

export function PreviewHeader({ name, tier, type, description }: { name: string; tier: Tier; type: string; description: string }) {
  return (
    <>
      <header className="statblock-header">
        <h2 className="statblock-multiline">{hasText(name) ? name : 'Untitled'}</h2>
        <div className="statblock-tier">Tier {tier} {type}</div>
      </header>
      {hasText(description) && <p className="statblock-description statblock-multiline">{description}</p>}
    </>
  )
}

export function MetadataRow({ label, children }: { label: string; children: ReactNode }) {
  return <div className="metadata-row"><dt>{label}</dt><dd className="statblock-multiline">{children}</dd></div>
}

export function FeaturePreview({ feature }: { feature: EnvironmentFeature | AdversaryFeature }) {
  return (
    <section className="statblock-feature">
      <header>
        <h4 className="statblock-multiline">{hasText(feature.name) ? feature.name : 'Untitled feature'}</h4>
        <span className="statblock-feature-type">{feature.type.toUpperCase()}</span>
      </header>
      {hasText(feature.text) && <p className="statblock-multiline">{feature.text}</p>}
      {'questions' in feature && hasText(feature.questions) && <p className="statblock-questions statblock-multiline">{feature.questions}</p>}
    </section>
  )
}
