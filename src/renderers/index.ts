import type { Statblock } from '../types/daggerheart'
import type { GoogleDocsDensity } from './theme'
import { adversaryGoogleDocsHtml } from './googleDocs/adversaryGoogleDocsHtml'
import { environmentGoogleDocsHtml } from './googleDocs/environmentGoogleDocsHtml'
import { adversaryHtml } from './html/adversaryHtml'
import { environmentHtml } from './html/environmentHtml'
import { adversaryMarkdown } from './markdown/adversaryMarkdown'
import { environmentMarkdown } from './markdown/environmentMarkdown'
import { adversaryPlainText } from './plaintext/adversaryPlainText'
import { environmentPlainText } from './plaintext/environmentPlainText'

export const serializeMarkdown = (block: Statblock): string => block.kind === 'environment' ? environmentMarkdown(block) : adversaryMarkdown(block)
export const serializeHtml = (block: Statblock): string => block.kind === 'environment' ? environmentHtml(block) : adversaryHtml(block)
export const serializeGoogleDocsHtml = (block: Statblock, density: GoogleDocsDensity = 'full'): string => block.kind === 'environment' ? environmentGoogleDocsHtml(block, density) : adversaryGoogleDocsHtml(block, density)
export const serializePlainText = (block: Statblock): string => block.kind === 'environment' ? environmentPlainText(block) : adversaryPlainText(block)
