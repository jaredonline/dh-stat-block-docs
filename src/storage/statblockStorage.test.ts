import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createSamples } from '../data/statblocks'
import { loadLibrary, parseLibrary, saveLibrary, STORAGE_KEY, type Library } from './statblockStorage'

function sampleLibrary(): Library {
  const blocks = createSamples()
  return { version: 1, blocks, selectedId: blocks[1].id }
}

beforeEach(() => {
  localStorage.clear()
})

describe('local statblock persistence', () => {
  it('seeds an unsaved library with the environment and original adversary examples', () => {
    const result = loadLibrary()
    expect(result.canSave).toBe(true)
    expect(result.warning).toBeUndefined()
    expect(result.library.blocks.map(block => block.kind)).toEqual(['environment', 'adversary'])
    expect(result.library.blocks[0].name).toBe('Chaos Realm')
    expect(result.library.selectedId).toBe(result.library.blocks[0].id)
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull()
  })

  it('round trips authored content, order, stable IDs, and the selected block', () => {
    const library = sampleLibrary()
    library.blocks[0].description = 'Paragraph one\n\nParagraph two <&> "quotes"'
    library.blocks[0].features.reverse()
    library.blocks[1].difficulty = 'Whatever the designer needs'
    saveLibrary(library)
    expect(loadLibrary()).toEqual({ library, canSave: true })
  })

  it('retains an intentionally empty library across reloads', () => {
    const library: Library = { version: 1, blocks: [], selectedId: null }
    saveLibrary(library)
    expect(loadLibrary()).toEqual({ library, canSave: true })
  })

  it('recovers a stale selection without changing authored content', () => {
    const library = sampleLibrary()
    library.selectedId = 'deleted-id'
    const parsed = parseLibrary(JSON.stringify(library))
    expect(parsed.selectedId).toBe(library.blocks[0].id)
    expect(parsed.blocks).toEqual(library.blocks)
  })

  it.each(['{broken', JSON.stringify({ version: 2, blocks: [], selectedId: null }), '', 'null'])('preserves unrecognized or damaged storage: %s', saved => {
    localStorage.setItem(STORAGE_KEY, saved)
    const result = loadLibrary()
    expect(result.canSave).toBe(false)
    expect(result.warning).toContain('preserved')
    expect(result.warning).toContain('autosave is disabled')
    expect(result.library.blocks).toHaveLength(2)
    expect(localStorage.getItem(STORAGE_KEY)).toBe(saved)
  })

  it('reports blocked reads and keeps editing available in memory', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new DOMException('Blocked', 'SecurityError') })
    const result = loadLibrary()
    expect(result.canSave).toBe(false)
    expect(result.warning).toContain('could not be read')
    expect(result.library.blocks).toHaveLength(2)
  })

  it('reports failed writes without claiming data was saved', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new DOMException('Full', 'QuotaExceededError') })
    expect(() => saveLibrary(sampleLibrary())).toThrow('Autosave failed')
  })

  it('does not replace existing storage with invalid data passed to save', () => {
    const library = sampleLibrary()
    saveLibrary(library)
    const oldData = localStorage.getItem(STORAGE_KEY)
    const invalid = { ...library, version: 2 } as unknown as Library
    expect(() => saveLibrary(invalid)).toThrow('unsupported storage version')
    expect(localStorage.getItem(STORAGE_KEY)).toBe(oldData)
  })
})

describe('library schema validation', () => {
  it.each([
    ['invalid tier', (data: Library) => { Object.assign(data.blocks[0], { tier: '4' }) }],
    ['unknown environment type', (data: Library) => { Object.assign(data.blocks[0], { type: 'Dungeon' }) }],
    ['unknown adversary type', (data: Library) => { Object.assign(data.blocks[1], { type: 'Boss' }) }],
    ['unknown kind', (data: Library) => { Object.assign(data.blocks[0], { kind: 'item' }) }],
    ['missing text field', (data: Library) => { Object.assign(data.blocks[0], { impulses: undefined }) }],
    ['features not a list', (data: Library) => { Object.assign(data.blocks[0], { features: {} }) }],
    ['unknown feature type', (data: Library) => { Object.assign(data.blocks[0].features[0], { type: 'Spell' }) }],
    ['missing questions', (data: Library) => { Object.assign(data.blocks[0].features[0], { questions: undefined }) }],
    ['fear feature not boolean', (data: Library) => { Object.assign(data.blocks[1].features[0], { fearFeature: 'yes' }) }],
    ['thresholds not an object', (data: Library) => { Object.assign(data.blocks[1], { thresholds: null }) }],
    ['numeric threshold', (data: Library) => { Object.assign(data.blocks[1], { thresholds: { major: 8, severe: '16' } }) }],
    ['missing standard attack', (data: Library) => { Object.assign(data.blocks[1], { standardAttack: undefined }) }],
    ['experiences not a list', (data: Library) => { Object.assign(data.blocks[1], { experiences: null }) }],
    ['experience modifier not text', (data: Library) => {
      if (data.blocks[1].kind === 'adversary') Object.assign(data.blocks[1].experiences[0], { modifier: 2 })
    }],
    ['blank ID', (data: Library) => { data.blocks[0].id = ' ' }],
    ['duplicate block IDs', (data: Library) => { data.blocks[1].id = data.blocks[0].id }],
    ['duplicate feature IDs', (data: Library) => { data.blocks[0].features[1].id = data.blocks[0].features[0].id }],
    ['duplicate experience IDs', (data: Library) => {
      if (data.blocks[1].kind === 'adversary') data.blocks[1].experiences[0].id = data.blocks[1].id
    }],
    ['invalid selected ID', (data: Library) => { Object.assign(data, { selectedId: 42 }) }],
  ])('rejects %s', (_, mutate) => {
    const data = sampleLibrary()
    mutate(data)
    expect(() => parseLibrary(JSON.stringify(data))).toThrow()
  })

  it('accepts blank optional fields and arbitrary string stats without balance validation', () => {
    const library = sampleLibrary()
    for (const block of library.blocks) {
      block.description = ''
      block.features = []
      block.difficulty = '?'
      if (block.kind === 'adversary') {
        block.experiences = []
        block.thresholds = { major: '—', severe: 'special' }
        block.hp = '1 (or more)'
        block.standardAttack = { name: '', range: '', damage: '' }
      }
    }
    expect(parseLibrary(JSON.stringify(library))).toEqual(library)
  })
})
