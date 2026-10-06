import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import App from './App'
import { STORAGE_KEY, parseLibrary } from './storage/statblockStorage'

let host: HTMLDivElement
let root: Root

beforeEach(() => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true })
  localStorage.clear()
  host = document.createElement('div')
  document.body.append(host)
  root = createRoot(host)
})

afterEach(() => {
  act(() => root.unmount())
  host.remove()
  vi.restoreAllMocks()
})

function mount() { act(() => root.render(<App />)) }

function click(button: HTMLElement) {
  act(() => button.click())
}

function field(label: string): HTMLInputElement | HTMLTextAreaElement {
  const element = Array.from(host.querySelectorAll('label')).find(item => item.textContent === label)
  if (!element) throw new Error(`Missing label: ${label}`)
  return host.querySelector(`[id="${element.htmlFor}"]`)!
}

function fill(label: string, value: string) {
  const input = field(label)
  const prototype = input instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype
  const setter = Object.getOwnPropertyDescriptor(prototype, 'value')!.set!
  act(() => {
    setter.call(input, value)
    input.dispatchEvent(new Event('input', { bubbles: true }))
  })
}

describe('app integration', () => {
  it('updates the preview and stored data immediately when a designer writes multiline text', () => {
    mount()
    fill('Name', 'A Writer’s Realm')
    const description = '<script>Literal prose & symbols</script>\n\nAnother paragraph.'
    fill('Description', description)
    expect(host.querySelector('.statblock-header h2')!.textContent).toBe('A Writer’s Realm')
    expect(host.querySelector('.statblock-description')!.textContent).toBe(description)
    expect(host.querySelectorAll('.statblock-description script')).toHaveLength(0)
    const saved = parseLibrary(localStorage.getItem(STORAGE_KEY)!)
    expect(saved.blocks[0].name).toBe('A Writer’s Realm')
    expect(saved.blocks[0].description).toBe(description)
  })

  it('pauses saving in a stale tab so selecting a block cannot overwrite newer work', () => {
    mount()
    const newer = parseLibrary(localStorage.getItem(STORAGE_KEY)!)
    newer.blocks[0].name = 'Saved by another tab'
    const original = localStorage.getItem(STORAGE_KEY)
    const next = JSON.stringify(newer)
    localStorage.setItem(STORAGE_KEY, next)
    act(() => window.dispatchEvent(new StorageEvent('storage', {
      key: STORAGE_KEY, oldValue: original, newValue: next, storageArea: localStorage,
    })))
    expect(host.querySelector('.storage-warning')!.textContent).toContain('Autosave is paused')
    click(host.querySelectorAll<HTMLButtonElement>('.library-item')[1])
    fill('Name', 'Unsaved work in this tab')
    expect(field('Name').value).toBe('Unsaved work in this tab')
    expect(localStorage.getItem(STORAGE_KEY)).toBe(next)
  })

  it('does not let another app’s localStorage changes stop this library’s autosave', () => {
    mount()
    act(() => window.dispatchEvent(new StorageEvent('storage', { key: 'unrelated-app', newValue: 'value', storageArea: localStorage })))
    fill('Name', 'Still saving')
    expect(parseLibrary(localStorage.getItem(STORAGE_KEY)!).blocks[0].name).toBe('Still saving')
    expect(host.querySelector('.storage-warning')).toBeNull()
  })

  it('preserves corrupt storage while allowing temporary edits', () => {
    localStorage.setItem(STORAGE_KEY, '{not valid JSON')
    mount()
    fill('Name', 'Recoverable in-memory work')
    expect(host.querySelector('.storage-warning')!.textContent).toContain('Existing browser data has been preserved')
    expect(localStorage.getItem(STORAGE_KEY)).toBe('{not valid JSON')
    expect(host.querySelector('.statblock-header h2')!.textContent).toBe('Recoverable in-memory work')
  })

  it('does not reseed examples when a saved library is deliberately empty', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: 1, blocks: [], selectedId: null }))
    mount()
    expect(host.querySelectorAll('.library-item')).toHaveLength(0)
    expect(host.querySelector('.empty-workspace')!.textContent).toContain('Start with a statblock.')
    expect(parseLibrary(localStorage.getItem(STORAGE_KEY)!).blocks).toEqual([])
  })

  it('defaults the Google Docs density to Compact and persists the separate preference', () => {
    mount()
    const group = host.querySelector('[role="group"][aria-label="Google Docs layout"]')!
    const full = [...group.querySelectorAll('button')].find(button => button.textContent === 'Full')!
    const compact = [...group.querySelectorAll('button')].find(button => button.textContent === 'Compact')!
    expect(full.getAttribute('aria-pressed')).toBe('false')
    expect(compact.getAttribute('aria-pressed')).toBe('true')
    click(compact)
    expect(compact.getAttribute('aria-pressed')).toBe('true')
    expect(localStorage.getItem('daggerheart-statblocks.google-docs-density.v1')).toBe('compact')

    act(() => root.unmount())
    root = createRoot(host)
    mount()
    const restoredGroup = host.querySelector('[role="group"][aria-label="Google Docs layout"]')!
    expect([...restoredGroup.querySelectorAll('button')].find(button => button.textContent === 'Compact')!.getAttribute('aria-pressed')).toBe('true')
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY)!).blocks).toHaveLength(2)
  })

  it('keeps the visible library on a canceled deletion and deletes it only on confirmation', () => {
    mount()
    const remove = Array.from(host.querySelectorAll('button')).find(button => button.textContent === 'Delete')!
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false)
    click(remove)
    expect(host.querySelectorAll('.library-item')).toHaveLength(2)
    confirm.mockReturnValue(true)
    click(remove)
    expect(host.querySelectorAll('.library-item')).toHaveLength(1)
    expect(parseLibrary(localStorage.getItem(STORAGE_KEY)!).blocks[0].name).toBe('Wayward Sentinel')
  })
})
