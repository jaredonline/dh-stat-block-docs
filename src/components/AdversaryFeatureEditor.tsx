import { newAdversaryFeature, newId } from '../data/statblocks'
import { FEATURE_TYPES, type AdversaryFeature } from '../types/daggerheart'
import { focusField, moveItem, SelectField, TextAreaField, TextField } from './Fields'
import { ItemActions } from './ItemActions'

interface Props {
  features: AdversaryFeature[]
  onChange: (features: AdversaryFeature[]) => void
}

export function AdversaryFeatureEditor({ features, onChange }: Props) {
  function update(id: string, changes: Partial<AdversaryFeature>) {
    onChange(features.map(feature => feature.id === id ? { ...feature, ...changes } : feature))
  }

  function add() {
    const feature = newAdversaryFeature()
    onChange([...features, feature])
    focusField(`feature-${feature.id}-name`)
  }

  function duplicate(index: number) {
    const feature = { ...features[index], id: newId() }
    onChange([...features.slice(0, index + 1), feature, ...features.slice(index + 1)])
    focusField(`feature-${feature.id}-name`)
  }

  function remove(index: number) {
    const nextFocus = features[index + 1] ?? features[index - 1]
    onChange(features.filter((_, featureIndex) => featureIndex !== index))
    focusField(nextFocus ? `feature-${nextFocus.id}-name` : 'add-adversary-feature')
  }

  return (
    <fieldset className="editor-section features-section">
      <legend>Features <span className="section-count">{features.length}</span></legend>
      {features.map((feature, index) => (
        <section className="feature-editor" key={feature.id} aria-label={`Feature ${index + 1}`}>
          <div className="item-heading">
            <h3>Feature {index + 1}</h3>
            <ItemActions name={feature.name || `feature ${index + 1}`} index={index} count={features.length} onMove={direction => {
              onChange(moveItem(features, index, direction))
              focusField(`feature-${feature.id}-name`)
            }} onDuplicate={() => duplicate(index)} onRemove={() => remove(index)} />
          </div>
          <div className="editor-grid feature-name-row">
            <TextField id={`feature-${feature.id}-name`} label="Feature name" value={feature.name} onChange={name => update(feature.id, { name })} placeholder="Name this feature" />
            <SelectField label="Feature type" options={FEATURE_TYPES} value={feature.type} onChange={type => update(feature.id, { type })} />
          </div>
          <TextAreaField label="Mechanical text" value={feature.text} onChange={text => update(feature.id, { text })} rows={4} placeholder="Describe what happens and how it works…" />
          <label className="checkbox-field" htmlFor={`feature-${feature.id}-fear`}>
            <input id={`feature-${feature.id}-fear`} type="checkbox" checked={feature.fearFeature} onChange={event => update(feature.id, { fearFeature: event.target.checked })} />
            Fear Feature
          </label>
        </section>
      ))}
      {features.length === 0 && <p className="empty-section">Add passives, actions, or reactions for this adversary.</p>}
      <button id="add-adversary-feature" type="button" className="add-item-button" onClick={add}>+ Add Feature</button>
    </fieldset>
  )
}
