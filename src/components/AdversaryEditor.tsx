import { ADVERSARY_TYPES, type Adversary, type Tier } from '../types/daggerheart'
import { AdversaryFeatureEditor } from './AdversaryFeatureEditor'
import { ExperienceEditor } from './ExperienceEditor'
import { SelectField, TextAreaField, TextField } from './Fields'

interface Props {
  block: Adversary
  onChange: (block: Adversary) => void
}

export function AdversaryEditor({ block, onChange }: Props) {
  const update = (changes: Partial<Adversary>) => onChange({ ...block, ...changes })

  return (
    <div className="editor-form">
      <fieldset className="editor-section">
        <legend>Identity</legend>
        <TextField id="statblock-name" label="Name" value={block.name} onChange={name => update({ name })} placeholder="Adversary name" />
        <div className="editor-grid two-columns">
          <SelectField label="Tier" options={['1', '2', '3', '4']} value={String(block.tier)} onChange={tier => update({ tier: Number(tier) as Tier })} />
          <SelectField label="Adversary type" options={ADVERSARY_TYPES} value={block.type} onChange={type => update({ type })} />
        </div>
        <TextAreaField label="Description" value={block.description} onChange={description => update({ description })} placeholder="Describe their appearance and presence…" />
        <TextAreaField label="Motives & Tactics" value={block.motivesAndTactics} onChange={motivesAndTactics => update({ motivesAndTactics })} placeholder="What do they want, and how do they act?" />
      </fieldset>
      <fieldset className="editor-section">
        <legend>Combat stats</legend>
        <div className="editor-grid three-columns">
          <TextField label="Difficulty" value={block.difficulty} onChange={difficulty => update({ difficulty })} placeholder="14" />
          <TextField label="Major threshold" value={block.thresholds.major} onChange={major => update({ thresholds: { ...block.thresholds, major } })} placeholder="8" />
          <TextField label="Severe threshold" value={block.thresholds.severe} onChange={severe => update({ thresholds: { ...block.thresholds, severe } })} placeholder="16" />
          <TextField label="HP" value={block.hp} onChange={hp => update({ hp })} placeholder="5" />
          <TextField label="Stress" value={block.stress} onChange={stress => update({ stress })} placeholder="3" />
          <TextField label="Attack modifier" value={block.attackModifier} onChange={attackModifier => update({ attackModifier })} placeholder="+2" />
        </div>
      </fieldset>
      <fieldset className="editor-section">
        <legend>Standard attack</legend>
        <TextField label="Attack name" value={block.standardAttack.name} onChange={name => update({ standardAttack: { ...block.standardAttack, name } })} placeholder="e.g. Weathered Halberd" />
        <div className="editor-grid two-columns">
          <TextField label="Range" value={block.standardAttack.range} onChange={range => update({ standardAttack: { ...block.standardAttack, range } })} placeholder="e.g. Very Close" />
          <TextField label="Damage" value={block.standardAttack.damage} onChange={damage => update({ standardAttack: { ...block.standardAttack, damage } })} placeholder="e.g. 2d8+2 phy" />
        </div>
      </fieldset>
      <ExperienceEditor experiences={block.experiences} onChange={experiences => update({ experiences })} />
      <AdversaryFeatureEditor features={block.features} onChange={features => update({ features })} />
    </div>
  )
}
