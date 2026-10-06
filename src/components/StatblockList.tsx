import { useRef, useState } from 'react'
import type { Statblock, StatblockKind } from '../types/daggerheart'

interface Props {
  blocks: Statblock[]
  selectedId: string | null
  onSelect: (id: string) => void
  onNew: (kind: StatblockKind) => void
  onDuplicate: () => void
  onDelete: () => void
  onExport: () => void
  onImport: () => void
}

export function StatblockList({ blocks, selectedId, onSelect, onNew, onDuplicate, onDelete, onExport, onImport }: Props) {
  const [query, setQuery] = useState('')
  const menu = useRef<HTMLDetailsElement>(null)
  const filtered = blocks.filter(block => `${block.name} ${block.kind} ${block.type} tier ${block.tier}`.toLowerCase().includes(query.toLowerCase()))
  function create(kind: StatblockKind) {
    if (menu.current) menu.current.open = false
    setQuery('')
    onNew(kind)
  }

  return <aside className="library" aria-label="Statblock library">
    <div className="library-heading">
      <h2>Library <span className="count">{blocks.length}</span></h2>
      <details className="new-menu" ref={menu} onKeyDown={event => {
        if (event.key === 'Escape' && menu.current) { menu.current.open = false; menu.current.querySelector('summary')?.focus() }
      }} onBlur={event => {
        if (!event.currentTarget.contains(event.relatedTarget)) event.currentTarget.open = false
      }}>
        <summary className="button button-primary" aria-label="New statblock"><span aria-hidden="true">＋</span> New</summary>
        <div className="new-menu-options">
          <button onClick={() => create('environment')}><span className="kind-icon" aria-hidden="true">E</span> New Environment</button>
          <button onClick={() => create('adversary')}><span className="kind-icon" aria-hidden="true">A</span> New Adversary</button>
        </div>
      </details>
    </div>
    <label className="library-search">
      <span className="sr-only">Search statblocks</span>
      <span aria-hidden="true">⌕</span>
      <input type="search" placeholder="Find a statblock…" value={query} onChange={event => setQuery(event.target.value)} />
    </label>
    <nav className="library-list" aria-label="Saved statblocks">
      {filtered.map(block => <button key={block.id} className={`library-item ${selectedId === block.id ? 'selected' : ''}`} aria-current={selectedId === block.id ? 'true' : undefined} onClick={() => onSelect(block.id)}>
        <span className={`kind-icon ${block.kind}`} aria-hidden="true">{block.kind === 'environment' ? 'E' : 'A'}</span>
        <span className="library-item-text"><strong>{block.name || 'Untitled'}</strong><span>{block.kind === 'environment' ? 'Environment' : 'Adversary'} · Tier {block.tier}</span></span>
      </button>)}
      {filtered.length === 0 && <p className="library-empty">{query ? 'No matching statblocks.' : 'A clear desk. Create your first statblock above.'}</p>}
    </nav>
    <div className="library-actions">
      <button disabled={!selectedId} onClick={onDuplicate}>Duplicate</button>
      <button className="danger-text" disabled={!selectedId} onClick={onDelete}>Delete</button>
    </div>
    <div className="library-footer">
      <p className="eyebrow">Your browser. Your notes.</p>
      <p>Saved on this device as you write.<br />Back up your library to keep a copy.</p>
      <div className="backup-actions"><button onClick={onExport}>Export JSON</button><button onClick={onImport}>Import JSON</button></div>
    </div>
  </aside>
}
