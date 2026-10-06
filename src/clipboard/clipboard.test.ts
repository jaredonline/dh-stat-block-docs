import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createEnvironment } from '../data/statblocks'
import { copyForGoogleDocs, copyHtmlSource, copyMarkdown } from './index'

vi.mock('../renderers', () => ({
  serializeMarkdown: () => '# Chaos Realm\n\n*Tier 4 Traversal*',
  serializeHtml: () => '<table style="width:100%"><tbody><tr><td>HTML source</td></tr></tbody></table>',
  serializeGoogleDocsHtml: () => '<table style="width:100%"><tbody><tr><td colspan="2">Rich Docs</td></tr></tbody></table>',
  serializePlainText: () => 'Chaos Realm — Tier 4 Traversal\n\nPlain fallback',
}))

class MockClipboardItem {
  readonly types: string[]
  constructor(readonly data: Record<string, Blob>) {
    this.types = Object.keys(data)
  }
}

const originalExecCommand = Object.getOwnPropertyDescriptor(document, 'execCommand')

function setExecCommand(implementation?: () => boolean) {
  Object.defineProperty(document, 'execCommand', { configurable: true, writable: true, value: implementation ? vi.fn(implementation) : undefined })
}

function installClipboard(clipboard: unknown) {
  vi.stubGlobal('navigator', { clipboard })
}

function clipboardEvent(setData = vi.fn()) {
  const event = new Event('copy', { bubbles: true, cancelable: true })
  Object.defineProperty(event, 'clipboardData', { value: { setData } })
  document.dispatchEvent(event)
  return { event, setData }
}

function readBlob(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsText(blob)
  })
}

beforeEach(() => {
  document.body.replaceChildren()
  window.getSelection()?.removeAllRanges()
  setExecCommand()
  installClipboard(undefined)
  vi.stubGlobal('ClipboardItem', undefined)
})

afterEach(() => {
  vi.unstubAllGlobals()
  document.body.replaceChildren()
  if (originalExecCommand) Object.defineProperty(document, 'execCommand', originalExecCommand)
  else delete (document as Partial<Document>).execCommand
})

describe('distinct clipboard formats', () => {
  it('copies Markdown source using only writeText', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    const write = vi.fn()
    installClipboard({ writeText, write })
    await copyMarkdown(createEnvironment())
    expect(writeText).toHaveBeenCalledExactlyOnceWith('# Chaos Realm\n\n*Tier 4 Traversal*')
    expect(write).not.toHaveBeenCalled()
  })

  it('copies literal HTML source using only writeText', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    const write = vi.fn()
    installClipboard({ writeText, write })
    await copyHtmlSource(createEnvironment())
    expect(writeText).toHaveBeenCalledExactlyOnceWith('<table style="width:100%"><tbody><tr><td>HTML source</td></tr></tbody></table>')
    expect(write).not.toHaveBeenCalled()
  })

  it('writes rich HTML and dedicated plain text immediately in the click call stack', async () => {
    const write = vi.fn().mockResolvedValue(undefined)
    const writeText = vi.fn()
    installClipboard({ write, writeText })
    vi.stubGlobal('ClipboardItem', MockClipboardItem)
    const copying = copyForGoogleDocs(createEnvironment())
    expect(write).toHaveBeenCalledOnce()
    const [item] = write.mock.calls[0][0] as MockClipboardItem[]
    expect(item.types).toEqual(['text/html', 'text/plain'])
    expect(item.data['text/html'].type).toBe('text/html')
    expect(item.data['text/plain'].type).toBe('text/plain')
    expect(await readBlob(item.data['text/html'])).toContain('<td colspan="2">Rich Docs</td>')
    expect(await readBlob(item.data['text/plain'])).toBe('Chaos Realm — Tier 4 Traversal\n\nPlain fallback')
    await copying
    expect(writeText).not.toHaveBeenCalled()
  })
})

describe('plain text fallback', () => {
  it('uses a selected textarea, then restores focus and selection and removes temporary nodes', async () => {
    const input = document.createElement('textarea')
    input.value = 'Working on a feature'
    document.body.append(input)
    input.focus()
    input.setSelectionRange(3, 8, 'backward')
    setExecCommand(() => {
      const temporary = document.activeElement as HTMLTextAreaElement
      expect(temporary).not.toBe(input)
      expect(temporary.value).toBe('# Chaos Realm\n\n*Tier 4 Traversal*')
      expect(temporary.selectionStart).toBe(0)
      expect(temporary.selectionEnd).toBe(temporary.value.length)
      return true
    })
    await copyMarkdown(createEnvironment())
    expect(document.activeElement).toBe(input)
    expect(input.selectionStart).toBe(3)
    expect(input.selectionEnd).toBe(8)
    expect(input.selectionDirection).toBe('backward')
    expect(document.body.children).toHaveLength(1)
  })

  it('attempts fallback after a modern permission denial', async () => {
    const writeText = vi.fn().mockRejectedValue(new DOMException('Denied', 'NotAllowedError'))
    installClipboard({ writeText })
    setExecCommand(() => true)
    await copyHtmlSource(createEnvironment())
    expect(document.execCommand).toHaveBeenCalledWith('copy')
    expect(document.body.children).toHaveLength(0)
  })

  it.each([false, 'throw'])('reports failed fallback (%s) and cleans up', async result => {
    setExecCommand(() => {
      if (result === 'throw') throw new Error('Copy blocked')
      return false
    })
    await expect(copyMarkdown(createEnvironment())).rejects.toThrow('HTTPS or localhost')
    expect(document.body.children).toHaveLength(0)
  })

  it('reports unavailable clipboard support', async () => {
    await expect(copyMarkdown(createEnvironment())).rejects.toThrow('Allow clipboard access')
  })
})

describe('rich clipboard fallback', () => {
  it('sets both formats on a copy event and restores the previous document selection', async () => {
    const paragraph = document.createElement('p')
    paragraph.textContent = 'A selected passage'
    document.body.append(paragraph)
    const range = document.createRange()
    range.setStart(paragraph.firstChild!, 2)
    range.setEnd(paragraph.firstChild!, 10)
    window.getSelection()?.addRange(range)
    const selectedText = window.getSelection()?.toString()
    const setData = vi.fn()
    setExecCommand(() => {
      expect(document.querySelector('[contenteditable] table')).not.toBeNull()
      expect(clipboardEvent(setData).event.defaultPrevented).toBe(true)
      return true
    })
    await copyForGoogleDocs(createEnvironment())
    expect(setData).toHaveBeenCalledWith('text/html', expect.stringContaining('<td colspan="2">'))
    expect(setData).toHaveBeenCalledWith('text/plain', 'Chaos Realm — Tier 4 Traversal\n\nPlain fallback')
    expect(window.getSelection()?.toString()).toBe(selectedText)
    expect(document.body.children).toHaveLength(1)
    // The temporary event listener must also have been removed.
    const later = clipboardEvent()
    expect(later.setData).not.toHaveBeenCalled()
    expect(later.event.defaultPrevented).toBe(false)
  })

  it('retries after a rich API denial using the rich event fallback', async () => {
    installClipboard({ write: vi.fn().mockRejectedValue(new DOMException('Denied', 'NotAllowedError')) })
    vi.stubGlobal('ClipboardItem', MockClipboardItem)
    setExecCommand(() => { clipboardEvent(); return true })
    await copyForGoogleDocs(createEnvironment())
    expect(document.execCommand).toHaveBeenCalledOnce()
  })

  it('does not report success when execCommand returns true without writing both MIME formats', async () => {
    setExecCommand(() => true)
    await expect(copyForGoogleDocs(createEnvironment())).rejects.toThrow('Rich clipboard copy')
    expect(document.body.children).toHaveLength(0)
  })

  it('does not report success when execCommand returns false even if event data was set', async () => {
    setExecCommand(() => { clipboardEvent(); return false })
    await expect(copyForGoogleDocs(createEnvironment())).rejects.toThrow('Rich clipboard copy')
  })

  it('handles blocked event clipboard writes and removes the event handler', async () => {
    setExecCommand(() => {
      clipboardEvent(vi.fn(() => { throw new Error('Clipboard event is read only') }))
      return true
    })
    await expect(copyForGoogleDocs(createEnvironment())).rejects.toThrow('Rich clipboard copy')
    expect(document.body.children).toHaveLength(0)
    expect(clipboardEvent().event.defaultPrevented).toBe(false)
  })

  it('restores focus and cleans up if legacy rich copy throws', async () => {
    const input = document.createElement('input')
    document.body.append(input)
    input.focus()
    setExecCommand(() => { throw new Error('Unsupported command') })
    await expect(copyForGoogleDocs(createEnvironment())).rejects.toThrow('HTTPS or localhost')
    expect(document.activeElement).toBe(input)
    expect(document.body.children).toHaveLength(1)
  })

  it('clearly reports unavailable rich copy without falling back to plain text or an image', async () => {
    const writeText = vi.fn()
    installClipboard({ writeText })
    await expect(copyForGoogleDocs(createEnvironment())).rejects.toThrow('Google Docs is unavailable or was blocked')
    expect(writeText).not.toHaveBeenCalled()
    expect(document.querySelector('img, canvas')).toBeNull()
  })
})
