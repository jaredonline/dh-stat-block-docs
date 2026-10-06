import { ENVIRONMENT_TYPES, type Environment, type Tier } from '../types/daggerheart'
import { EnvironmentFeatureEditor } from './EnvironmentFeatureEditor'
import { SelectField, TextAreaField, TextField } from './Fields'

interface Props {
  block: Environment
  onChange: (block: Environment) => void
}

export function EnvironmentEditor({ block, onChange }: Props) {
  const update = (changes: Partial<Environment>) => onChange({ ...block, ...changes })

  return (
    <div className="editor-form">
      <fieldset className="editor-section">
        <legend>Identity</legend>
        <TextField id="statblock-name" label="Name" value={block.name} onChange={name => update({ name })} placeholder="Environment name" />
        <div className="editor-grid two-columns">
          <SelectField label="Tier" options={['1', '2', '3', '4']} value={String(block.tier)} onChange={tier => update({ tier: Number(tier) as Tier })} />
          <SelectField label="Environment type" options={ENVIRONMENT_TYPES} value={block.type} onChange={type => update({ type })} />
        </div>
        <TextAreaField label="Description" value={block.description} onChange={description => update({ description })} placeholder="Set the scene…" />
      </fieldset>
      <fieldset className="editor-section">
        <legend>At a glance</legend>
        <TextAreaField label="Impulses" value={block.impulses} onChange={impulses => update({ impulses })} placeholder="What does this environment do?" />
        <TextField label="Difficulty" value={block.difficulty} onChange={difficulty => update({ difficulty })} placeholder="e.g. 14" />
        <TextAreaField label="Potential Adversaries" value={block.potentialAdversaries} onChange={potentialAdversaries => update({ potentialAdversaries })} placeholder="Optional inhabitants or threats…" />
      </fieldset>
      <EnvironmentFeatureEditor features={block.features} onChange={features => update({ features })} />
    </div>
  )
}
