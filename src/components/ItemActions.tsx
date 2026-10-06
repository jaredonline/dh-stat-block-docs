interface ItemActionsProps {
  name: string
  index: number
  count: number
  onMove: (direction: -1 | 1) => void
  onRemove: () => void
  onDuplicate?: () => void
}

export function ItemActions({ name, index, count, onMove, onRemove, onDuplicate }: ItemActionsProps) {
  return (
    <div className="item-actions" role="group" aria-label={`Actions for ${name}`}>
      <button type="button" className="icon-button" onClick={() => onMove(-1)} disabled={index === 0} title={`Move ${name} up`} aria-label={`Move ${name} up`}>↑</button>
      <button type="button" className="icon-button" onClick={() => onMove(1)} disabled={index === count - 1} title={`Move ${name} down`} aria-label={`Move ${name} down`}>↓</button>
      {onDuplicate && <button type="button" onClick={onDuplicate} aria-label={`Duplicate ${name}`}>Duplicate</button>}
      <button type="button" className="text-danger" onClick={onRemove} aria-label={`Remove ${name}`}>Remove</button>
    </div>
  )
}
