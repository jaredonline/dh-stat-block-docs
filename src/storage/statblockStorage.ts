import { createSamples } from '../data/statblocks'
import { ADVERSARY_TYPES, ENVIRONMENT_TYPES, FEATURE_TYPES, type Statblock } from '../types/daggerheart'

export const STORAGE_KEY = 'daggerheart-statblocks.v1'

export interface Library {
  version: 1
  blocks: Statblock[]
  selectedId: string | null
}

export interface LoadedLibrary {
  library: Library
  warning?: string
  canSave: boolean
}

type RecordValue = Record<string, unknown>

function record(value: unknown, label: string): asserts value is RecordValue {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error(`${label} must be an object.`)
  }
}

function strings(value: RecordValue, keys: string[], label: string) {
  for (const key of keys) {
    if (typeof value[key] !== 'string') throw new Error(`${label}.${key} must be text.`)
  }
}

function choice(value: unknown, choices: readonly unknown[], label: string) {
  if (!choices.includes(value)) throw new Error(`${label} has an unsupported value.`)
}

function array(value: unknown, label: string): asserts value is unknown[] {
  if (!Array.isArray(value)) throw new Error(`${label} must be a list.`)
}

function validateBlock(value: unknown, ids: Set<string>) {
  record(value, 'Statblock')
  const checkId = (item: RecordValue, label: string) => {
    if (typeof item.id !== 'string' || !item.id.trim() || ids.has(item.id)) {
      throw new Error(`${label} needs a nonempty, unique ID.`)
    }
    ids.add(item.id)
  }
  checkId(value, 'Statblock')
  strings(value, ['name', 'description', 'difficulty'], 'Statblock')
  choice(value.kind, ['environment', 'adversary'], 'Statblock kind')
  choice(value.tier, [1, 2, 3, 4], 'Tier')
  choice(value.type, value.kind === 'environment' ? ENVIRONMENT_TYPES : ADVERSARY_TYPES, 'Statblock type')
  array(value.features, 'Features')
  for (const feature of value.features) {
    record(feature, 'Feature')
    checkId(feature, 'Feature')
    strings(feature, ['name', 'text'], 'Feature')
    choice(feature.type, FEATURE_TYPES, 'Feature type')
    if (value.kind === 'environment') strings(feature, ['questions'], 'Feature')
    else if (typeof feature.fearFeature !== 'boolean') throw new Error('Feature.fearFeature must be true or false.')
  }
  if (value.kind === 'environment') {
    strings(value, ['impulses', 'potentialAdversaries'], 'Environment')
  } else {
    strings(value, ['motivesAndTactics', 'hp', 'stress', 'attackModifier'], 'Adversary')
    record(value.thresholds, 'Thresholds')
    strings(value.thresholds, ['major', 'severe'], 'Thresholds')
    record(value.standardAttack, 'Standard attack')
    strings(value.standardAttack, ['name', 'range', 'damage'], 'Standard attack')
    array(value.experiences, 'Experiences')
    for (const experience of value.experiences) {
      record(experience, 'Experience')
      checkId(experience, 'Experience')
      strings(experience, ['name', 'modifier'], 'Experience')
    }
  }
}

/** Strictly validate data before it enters the editor; authored game values stay strings. */
export function parseLibrary(json: string): Library {
  let value: unknown
  try {
    value = JSON.parse(json)
  } catch {
    throw new Error('The saved library is not valid JSON.')
  }
  record(value, 'Library')
  if (value.version !== 1) throw new Error('The library uses an unsupported storage version.')
  array(value.blocks, 'Statblocks')
  const ids = new Set<string>()
  value.blocks.forEach(block => validateBlock(block, ids))
  if (value.selectedId !== null && typeof value.selectedId !== 'string') {
    throw new Error('The selected statblock ID must be text or null.')
  }
  const blocks = value.blocks as Statblock[]
  // Recover a stale selection without rejecting otherwise valid authored content.
  const selectedId = blocks.some(block => block.id === value.selectedId)
    ? value.selectedId as string
    : blocks[0]?.id ?? null
  return { version: 1, blocks, selectedId }
}

function sampleLibrary(): Library {
  const blocks = createSamples()
  return { version: 1, blocks, selectedId: blocks[0]?.id ?? null }
}

export function loadLibrary(): LoadedLibrary {
  let saved: string | null
  try {
    saved = localStorage.getItem(STORAGE_KEY)
  } catch {
    return {
      library: sampleLibrary(), canSave: false,
      warning: 'Browser storage could not be read. Edits are available in this tab, but cannot be autosaved. Allow site storage and reload, or export a JSON backup before leaving.',
    }
  }
  if (saved === null) return { library: sampleLibrary(), canSave: true }
  try {
    return { library: parseLibrary(saved), canSave: true }
  } catch (error) {
    return {
      library: sampleLibrary(), canSave: false,
      warning: `${error instanceof Error ? error.message : 'The saved library could not be loaded.'} Existing browser data has been preserved. This tab is using temporary examples and autosave is disabled. Export any new work before leaving.`,
    }
  }
}

export function saveLibrary(library: Library): void {
  const json = JSON.stringify(library)
  parseLibrary(json)
  try {
    localStorage.setItem(STORAGE_KEY, json)
  } catch {
    throw new Error('Autosave failed: browser storage is blocked or full. Your edits remain in this tab. Export a JSON backup before leaving, then allow site storage or free space and try again.')
  }
}
