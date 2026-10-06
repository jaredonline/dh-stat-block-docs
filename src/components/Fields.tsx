import { useId, useLayoutEffect, useRef } from 'react'

interface TextFieldProps {
  id?: string
  label: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
}

export function TextField({ id, label, value, onChange, placeholder, className = '' }: TextFieldProps) {
  const generatedId = useId()
  const inputId = id ?? generatedId
  return (
    <div className={`field ${className}`}>
      <label htmlFor={inputId}>{label}</label>
      <input id={inputId} value={value} placeholder={placeholder} onChange={event => onChange(event.target.value)} />
    </div>
  )
}

export function TextAreaField({ id, label, value, onChange, placeholder, className = '', rows = 2 }: TextFieldProps & { rows?: number }) {
  const generatedId = useId()
  const inputId = id ?? generatedId
  const ref = useRef<HTMLTextAreaElement>(null)

  useLayoutEffect(() => {
    const textarea = ref.current
    if (!textarea) return
    const resize = () => {
      textarea.style.height = 'auto'
      textarea.style.height = `${textarea.scrollHeight + 2}px`
    }
    resize()
    let previousWidth = 0
    const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(entries => {
      const width = entries[0]?.contentRect.width
      if (width && width !== previousWidth) {
        previousWidth = width
        resize()
      }
    })
    // Only react to available width, not the height changed by our own resize.
    if (textarea.parentElement) observer?.observe(textarea.parentElement, { box: 'border-box' })
    return () => observer?.disconnect()
  }, [value])

  return (
    <div className={`field ${className}`}>
      <label htmlFor={inputId}>{label}</label>
      <textarea ref={ref} id={inputId} rows={rows} value={value} placeholder={placeholder} onChange={event => onChange(event.target.value)} />
    </div>
  )
}

interface SelectFieldProps<T extends string> {
  id?: string
  label: string
  value: T
  options: readonly T[]
  onChange: (value: T) => void
}

export function SelectField<T extends string>({ id, label, value, options, onChange }: SelectFieldProps<T>) {
  const generatedId = useId()
  const inputId = id ?? generatedId
  return (
    <div className="field">
      <label htmlFor={inputId}>{label}</label>
      <select id={inputId} value={value} onChange={event => onChange(event.target.value as T)}>
        {options.map(option => <option value={option} key={option}>{option}</option>)}
      </select>
    </div>
  )
}

export function focusField(id: string) {
  requestAnimationFrame(() => document.getElementById(id)?.focus())
}

export function moveItem<T>(items: T[], index: number, direction: -1 | 1): T[] {
  const destination = index + direction
  if (destination < 0 || destination >= items.length) return items
  const next = [...items]
  ;[next[index], next[destination]] = [next[destination], next[index]]
  return next
}
