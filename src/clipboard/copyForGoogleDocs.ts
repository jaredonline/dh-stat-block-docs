import type { Statblock } from '../types/daggerheart'
import { serializeGoogleDocsHtml, serializePlainText } from '../renderers'
import type { GoogleDocsDensity } from '../renderers/theme'
import { copyRichText } from './clipboard'

export function copyForGoogleDocs(block: Statblock, density: GoogleDocsDensity = 'full'): Promise<void> {
  return copyRichText({ html: serializeGoogleDocsHtml(block, density), plainText: serializePlainText(block) })
}
