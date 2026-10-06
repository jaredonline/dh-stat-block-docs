import { newExperience } from '../data/statblocks'
import type { Experience } from '../types/daggerheart'
import { focusField, moveItem, TextField } from './Fields'
import { ItemActions } from './ItemActions'

interface Props {
  experiences: Experience[]
  onChange: (experiences: Experience[]) => void
}

export function ExperienceEditor({ experiences, onChange }: Props) {
  function update(id: string, changes: Partial<Experience>) {
    onChange(experiences.map(experience => experience.id === id ? { ...experience, ...changes } : experience))
  }

  function add() {
    const experience = newExperience()
    onChange([...experiences, experience])
    focusField(`experience-${experience.id}-name`)
  }

  function remove(index: number) {
    const nextFocus = experiences[index + 1] ?? experiences[index - 1]
    onChange(experiences.filter((_, experienceIndex) => experienceIndex !== index))
    focusField(nextFocus ? `experience-${nextFocus.id}-name` : 'add-experience')
  }

  return (
    <fieldset className="editor-section experiences-section">
      <legend>Experiences <span className="section-count">{experiences.length}</span></legend>
      {experiences.map((experience, index) => (
        <section className="experience-editor" key={experience.id} aria-label={`Experience ${index + 1}`}>
          <div className="item-heading">
            <h3>Experience {index + 1}</h3>
            <ItemActions name={experience.name || `experience ${index + 1}`} index={index} count={experiences.length} onMove={direction => {
              onChange(moveItem(experiences, index, direction))
              focusField(`experience-${experience.id}-name`)
            }} onRemove={() => remove(index)} />
          </div>
          <div className="editor-grid experience-name-row">
            <TextField id={`experience-${experience.id}-name`} label="Experience name" value={experience.name} onChange={name => update(experience.id, { name })} placeholder="e.g. Watchful" />
            <TextField label="Modifier" value={experience.modifier} onChange={modifier => update(experience.id, { modifier })} placeholder="+2" />
          </div>
        </section>
      ))}
      <button id="add-experience" type="button" className="add-item-button" onClick={add}>+ Add Experience</button>
    </fieldset>
  )
}
