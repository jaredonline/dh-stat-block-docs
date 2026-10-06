import { displayName, htmlText } from '../shared'
import { statblockTheme as theme } from '../theme'

// Portable HTML source uses semantic headings and sections. It deliberately
// does not reuse the Google Docs table serialization.
const cellStyle = `padding:${theme.cellPadding};border:1px solid ${theme.border};vertical-align:top;`

export function htmlArticle(content: string[]): string {
  return `<article style="font-family:${theme.fontFamily};font-size:${theme.bodySize};line-height:${theme.lineHeight};color:${theme.ink};background-color:#ffffff;border:1px solid ${theme.border};width:100%;box-sizing:border-box;">\n${content.join('\n')}\n</article>`
}

export function htmlTitle(name: string, tier: number, type: string): string {
  return `<header style="padding:${theme.cellPadding};background-color:${theme.headerFill};"><table style="width:100%;border-collapse:collapse;"><tbody><tr><td style="padding:0;vertical-align:top;"><h1 style="font-size:${theme.nameSize};font-weight:bold;margin:0;">${htmlText(displayName(name))}</h1></td><td style="padding:0;vertical-align:top;text-align:right;font-size:${theme.tierSize};font-weight:bold;font-style:italic;">Tier ${htmlText(String(tier))} ${htmlText(type)}</td></tr></tbody></table></header>`
}

export function htmlDescription(value: string): string {
  return `<p style="margin:0;padding:${theme.cellPadding};font-style:italic;"><em>${htmlText(value)}</em></p>`
}

export function htmlMetadata(pairs: [string, string][]): string {
  return `<table style="width:100%;border-collapse:collapse;"><tbody>${pairs.map(([label, value]) => `<tr><th scope="row" style="${cellStyle}background-color:${theme.labelFill};font-weight:bold;text-align:left;">${htmlText(label)}</th><td style="${cellStyle}">${htmlText(value)}</td></tr>`).join('')}</tbody></table>`
}

export function htmlSection(title: string, content: string): string {
  return `<section style="margin:0;"><h2 style="margin:0;padding:${theme.cellPadding};background-color:${theme.headerFill};font-size:${theme.sectionSize};font-weight:bold;">${htmlText(title)}</h2>${content}</section>`
}

export function htmlFeature(name: string, type: string, text: string, questions?: string): string {
  return `<section style="padding:${theme.cellPadding};border-bottom:1px solid ${theme.border};"><table style="width:100%;border-collapse:collapse;"><tbody><tr><td style="padding:0;vertical-align:top;"><h3 style="margin:0;font-size:${theme.featureNameSize};font-weight:bold;">${htmlText(name) || 'Untitled feature'}</h3></td><td style="padding:0;text-align:right;vertical-align:top;font-size:${theme.featureTypeSize};font-weight:bold;font-style:italic;">${htmlText(type.toUpperCase())}</td></tr></tbody></table>${text.trim() ? `<p style="margin:5pt 0 0;">${htmlText(text)}</p>` : ''}${questions?.trim() ? `<p style="margin:5pt 0 0;font-style:italic;"><em>${htmlText(questions)}</em></p>` : ''}</section>`
}

export function htmlStats(stats: [string, string][]): string {
  return `<table style="width:100%;border-collapse:collapse;"><tbody><tr>${stats.map(([label, value]) => `<td style="${cellStyle}"><strong style="font-size:${theme.sectionSize};">${htmlText(label)}</strong><br>${htmlText(value)}</td>`).join('')}</tr></tbody></table>`
}

export function htmlBody(content: string): string {
  return `<div style="padding:${theme.cellPadding};">${content}</div>`
}
