import type { Statblock } from '../types/daggerheart'
import { serializeMarkdown } from '../renderers'
import { copyPlainText } from './clipboard'

export function copyMarkdown(block: Statblock): Promise<void> {
  return copyPlainText(serializeMarkdown(block))
}
