import type { Statblock } from '../types/daggerheart'
import { serializeHtml } from '../renderers'
import { copyPlainText } from './clipboard'

export function copyHtmlSource(block: Statblock): Promise<void> {
  return copyPlainText(serializeHtml(block))
}
