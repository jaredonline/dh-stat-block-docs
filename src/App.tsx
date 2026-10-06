import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { AdversaryEditor } from './components/AdversaryEditor'
import { EnvironmentEditor } from './components/EnvironmentEditor'
import { AdversaryPreview } from './components/AdversaryPreview'
import { EnvironmentPreview } from './components/EnvironmentPreview'
import { StatblockList } from './components/StatblockList'
import { copyForGoogleDocs, copyHtmlSource, copyMarkdown } from './clipboard'
import { createStatblock, duplicateStatblock } from './data/statblocks'
import { loadLibrary, parseLibrary, saveLibrary, STORAGE_KEY, type Library } from './storage/statblockStorage'
import { statblockTheme, type GoogleDocsDensity } from './renderers/theme'
import type { Statblock, StatblockKind } from './types/daggerheart'
import { loadGoogleDocsDensity, saveGoogleDocsDensity } from './storage/googleDocsPreference'

type CopyFormat = 'markdown' | 'docs' | 'html'
type Notice = { kind: 'success' | 'error'; text: string }

const previewStyle = Object.fromEntries(Object.entries(statblockTheme).map(([key, value]) => [`--statblock-${key}`, value])) as CSSProperties
const copyMessages = { markdown: 'Markdown copied', docs: 'Google Docs version copied — paste normally into Docs', html: 'HTML source copied' }

export default function App() {
  const [initial] = useState(loadLibrary)
  const [library, setLibrary] = useState<Library>(initial.library)
  const [canSave, setCanSave] = useState(initial.canSave)
  const [storageWarning, setStorageWarning] = useState(initial.warning || '')
  const [saveError, setSaveError] = useState('')
  const [notice, setNotice] = useState<Notice | null>(null)
  const [copying, setCopying] = useState<CopyFormat | null>(null)
  const [googleDocsDensity, setGoogleDocsDensity] = useState<GoogleDocsDensity>(loadGoogleDocsDensity)
  const fileInput = useRef<HTMLInputElement>(null)
  const selected = library.blocks.find(block => block.id === library.selectedId)

  useEffect(() => {
    function protectNewerWork(event: StorageEvent) {
      if (event.storageArea !== window.localStorage || (event.key !== STORAGE_KEY && event.key !== null)) return
      setCanSave(false)
      setStorageWarning('The saved library changed in another tab. Autosave is paused here to protect that work. Export any edits from this tab, then reload to open the latest saved library.')
    }
    window.addEventListener('storage', protectNewerWork)
    return () => window.removeEventListener('storage', protectNewerWork)
  }, [])

  useEffect(() => {
    if (!canSave) return
    try {
      saveLibrary(library)
      setSaveError('')
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : 'Could not save this library. Export JSON to keep a backup.')
    }
  }, [library, canSave])

  useEffect(() => saveGoogleDocsDensity(googleDocsDensity), [googleDocsDensity])

  useEffect(() => {
    if (notice?.kind !== 'success') return
    const timer = window.setTimeout(() => setNotice(null), 5000)
    return () => window.clearTimeout(timer)
  }, [notice])

  function focusName() {
    window.requestAnimationFrame(() => {
      const input = document.getElementById('statblock-name') as HTMLInputElement | null
      input?.focus()
      input?.select()
    })
  }

  function addBlock(kind: StatblockKind) {
    const block = createStatblock(kind)
    setLibrary(current => ({ ...current, blocks: [...current.blocks, block], selectedId: block.id }))
    focusName()
  }

  function updateBlock(block: Statblock) {
    setLibrary(current => ({ ...current, blocks: current.blocks.map(item => item.id === block.id ? block : item) }))
  }

  function duplicate() {
    if (!selected) return
    const block = duplicateStatblock(selected)
    setLibrary(current => ({ ...current, blocks: [...current.blocks, block], selectedId: block.id }))
    focusName()
  }

  function remove() {
    if (!selected || !window.confirm(`Delete “${selected.name || 'Untitled'}”? This cannot be undone.`)) return
    setLibrary(current => {
      const index = current.blocks.findIndex(block => block.id === selected.id)
      const blocks = current.blocks.filter(block => block.id !== selected.id)
      return { ...current, blocks, selectedId: blocks[Math.min(index, blocks.length - 1)]?.id ?? null }
    })
  }

  async function copy(format: CopyFormat) {
    if (!selected) return
    setCopying(format)
    try {
      // Invoke immediately from the click; preserve the browser's user activation.
      const copyTask = format === 'markdown'
        ? copyMarkdown(selected)
        : format === 'html'
          ? copyHtmlSource(selected)
          : copyForGoogleDocs(selected, googleDocsDensity)
      await copyTask
      setNotice({ kind: 'success', text: copyMessages[format] })
    } catch (error) {
      setNotice({ kind: 'error', text: error instanceof Error ? error.message : 'Copy failed. Please try again.' })
    } finally {
      setCopying(null)
    }
  }

  function exportLibrary() {
    const url = URL.createObjectURL(new Blob([JSON.stringify(library, null, 2)], { type: 'application/json' }))
    const link = document.createElement('a')
    link.href = url
    link.download = `statblock-desk-${new Date().toISOString().slice(0, 10)}.json`
    document.body.append(link)
    link.click()
    link.remove()
    window.setTimeout(() => URL.revokeObjectURL(url), 1000)
  }

  async function importLibrary(file: File) {
    try {
      const imported = parseLibrary(await file.text())
      if (!window.confirm(`Replace this library with ${imported.blocks.length} statblock${imported.blocks.length === 1 ? '' : 's'} from “${file.name}”? Export JSON first if you want to keep the current library.`)) return
      // Persist successfully before replacing the visible library.
      saveLibrary(imported)
      setLibrary(imported)
      setCanSave(true)
      setStorageWarning('')
      setSaveError('')
      setNotice({ kind: 'success', text: 'Library imported' })
    } catch (error) {
      setNotice({ kind: 'error', text: error instanceof Error ? error.message : 'Could not import this file. Choose a Statblock Desk JSON backup.' })
    }
  }

  return <>
    <a className="skip-link" href="#editor">Skip to editor</a>
    <header className="app-header">
      <div className="brand"><span className="brand-mark" aria-hidden="true"><i /><i /><i /></span><div><h1>Statblock Desk</h1><p>A writers’ room tool for Daggerheart</p></div></div>
      <div className={`save-status ${saveError || !canSave ? 'save-warning' : ''}`} role="status"><span aria-hidden="true" />{saveError || !canSave ? 'Not saving locally' : 'Saved on this device'}</div>
    </header>
    {(storageWarning || saveError) && <div className="storage-warning" role="alert">{storageWarning || saveError} <button onClick={exportLibrary}>Export current work</button></div>}
    <div className="workspace">
      <StatblockList blocks={library.blocks} selectedId={library.selectedId}
        onSelect={id => setLibrary(current => ({ ...current, selectedId: id }))}
        onNew={addBlock} onDuplicate={duplicate} onDelete={remove}
        onExport={exportLibrary} onImport={() => fileInput.current?.click()} />
      <input ref={fileInput} className="sr-only" tabIndex={-1} aria-label="Import library file" type="file" accept=".json,application/json" onChange={event => {
        const file = event.target.files?.[0]
        if (file) void importLibrary(file)
        event.target.value = ''
      }} />
      {selected ? <main className="workbench">
        <section className="editor-panel" id="editor" aria-labelledby="editor-heading" tabIndex={-1}>
          <div className="panel-heading"><div><p className="eyebrow">Write & refine</p><h2 id="editor-heading">{selected.kind === 'environment' ? 'Environment' : 'Adversary'}</h2></div><span className="pill">Tier {selected.tier} · {selected.type}</span></div>
          {selected.kind === 'environment'
            ? <EnvironmentEditor key={selected.id} block={selected} onChange={updateBlock} />
            : <AdversaryEditor key={selected.id} block={selected} onChange={updateBlock} />}
        </section>
        <section className="preview-panel" aria-labelledby="preview-heading">
          <div className="preview-toolbar">
            <div className="panel-heading"><div><p className="eyebrow">Ready for your session</p><h2 id="preview-heading">Live preview</h2></div><span className="live-indicator"><span aria-hidden="true" /> Live</span></div>
            <div className="export-actions" aria-label="Copy statblock">
              <button disabled={!!copying} onClick={() => void copy('markdown')}>Copy Markdown</button>
              <button className="button-primary" disabled={!!copying} onClick={() => void copy('docs')}>Copy for Google Docs</button>
              <button disabled={!!copying} onClick={() => void copy('html')}>Copy HTML</button>
            </div>
            <div className="google-docs-layout" role="group" aria-label="Google Docs layout">
              <span id="google-docs-layout-label">Google Docs layout</span>
              <button type="button" aria-pressed={googleDocsDensity === 'full'} aria-describedby="google-docs-layout-hint" onClick={() => setGoogleDocsDensity('full')}>Full</button>
              <button type="button" aria-pressed={googleDocsDensity === 'compact'} aria-describedby="google-docs-layout-hint" onClick={() => setGoogleDocsDensity('compact')}>Compact</button>
            </div>
            <p className="export-hint" id="google-docs-layout-hint">Applies to Google Docs copy only.</p>
            <p className="export-hint">In Google Docs, paste normally with ⌘V or Ctrl+V.</p>
          </div>
          <div className="preview-paper" style={previewStyle}>
            {selected.kind === 'environment' ? <EnvironmentPreview block={selected} /> : <AdversaryPreview block={selected} />}
          </div>
          <p className="preview-caption">Editable text & tables. Ready for a printed session packet.</p>
        </section>
      </main> : <main className="empty-workspace" id="editor" tabIndex={-1}>
        <div className="empty-mark" aria-hidden="true">＋</div><p className="eyebrow">A little prep. A great session.</p><h2>Start with a statblock.</h2><p>Create an environment or adversary, write your features,<br />and copy it straight into your session notes.</p>
        <div><button className="button-primary" onClick={() => addBlock('environment')}>New Environment</button><button onClick={() => addBlock('adversary')}>New Adversary</button></div>
      </main>}
    </div>
    <div className="notice-container" aria-live="polite" aria-atomic="true">{notice && <div className={`notice ${notice.kind}`} role={notice.kind === 'error' ? 'alert' : undefined}><span aria-hidden="true">{notice.kind === 'success' ? '✓' : '!'}</span>{notice.text}</div>}</div>
  </>
}
