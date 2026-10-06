interface RichContent {
  html: string
  plainText: string
}

function preserveEditingState() {
  const active = document.activeElement
  const selection = window.getSelection()
  const ranges = selection ? Array.from({ length: selection.rangeCount }, (_, index) => selection.getRangeAt(index).cloneRange()) : []
  const textControl = active instanceof HTMLInputElement || active instanceof HTMLTextAreaElement ? active : null
  const start = textControl?.selectionStart ?? null
  const end = textControl?.selectionEnd ?? null
  const direction = textControl?.selectionDirection ?? undefined
  return () => {
    // A focused element can disappear during a copy; restoration must not hide the copy result.
    try {
      if (active instanceof HTMLElement && active.isConnected) active.focus({ preventScroll: true })
      if (selection) {
        selection.removeAllRanges()
        ranges.forEach(range => selection.addRange(range))
      }
      if (textControl?.isConnected && start !== null && end !== null) {
        textControl.setSelectionRange(start, end, direction)
      }
    } catch { /* Best effort focus/selection restoration. */ }
  }
}

function legacyCopy(plainText: string, rich?: RichContent): boolean {
  if (typeof document.execCommand !== 'function') return false
  const restore = preserveEditingState()
  const element = rich ? document.createElement('div') : document.createElement('textarea')
  element.style.cssText = 'position:fixed;left:-10000px;top:0;opacity:0;pointer-events:none;'
  element.setAttribute('aria-hidden', 'true')
  element.tabIndex = -1
  let richDataWritten = false
  const onCopy = (event: ClipboardEvent) => {
    if (!rich || !event.clipboardData) return
    try {
      event.clipboardData.setData('text/html', rich.html)
      event.clipboardData.setData('text/plain', rich.plainText)
      event.preventDefault()
      richDataWritten = true
    } catch { /* An unsuccessful rich fallback must be reported as a failure. */ }
  }
  try {
    if (element instanceof HTMLTextAreaElement) {
      element.value = plainText
      element.readOnly = true
    } else {
      element.setAttribute('contenteditable', 'true')
      // Only escaped, serializer-generated markup reaches this boundary.
      element.innerHTML = rich!.html
    }
    document.body.append(element)
    if (rich) document.addEventListener('copy', onCopy, true)
    element.focus({ preventScroll: true })
    if (element instanceof HTMLTextAreaElement) element.select()
    else {
      const range = document.createRange()
      range.selectNodeContents(element)
      const selection = window.getSelection()
      selection?.removeAllRanges()
      selection?.addRange(range)
    }
    const copied = document.execCommand('copy')
    return copied && (!rich || richDataWritten)
  } catch {
    return false
  } finally {
    document.removeEventListener('copy', onCopy, true)
    element.remove()
    restore()
  }
}

export async function copyPlainText(text: string): Promise<void> {
  try {
    if (typeof navigator.clipboard?.writeText === 'function') {
      await navigator.clipboard.writeText(text)
      return
    }
  } catch { /* Retry with the browser's selected-text copy path. */ }
  if (legacyCopy(text)) return
  throw new Error('Copy failed. Allow clipboard access and click Copy again. Open this page over HTTPS or localhost and use a browser that supports clipboard copying.')
}

export async function copyRichText(content: RichContent): Promise<void> {
  try {
    if (typeof navigator.clipboard?.write === 'function' && typeof ClipboardItem !== 'undefined') {
      // Keep write() in the original click call stack; do not await a permission request.
      const item = new ClipboardItem({
        'text/html': new Blob([content.html], { type: 'text/html' }),
        'text/plain': new Blob([content.plainText], { type: 'text/plain' }),
      })
      await navigator.clipboard.write([item])
      return
    }
  } catch { /* Retry rich copy through a synchronous copy event when supported. */ }
  if (legacyCopy(content.plainText, content)) return
  throw new Error('Rich clipboard copy for Google Docs is unavailable or was blocked. Allow clipboard access and click Copy for Google Docs again. Use a current browser over HTTPS or localhost. Copy Markdown and Copy HTML remain available as source formats.')
}
