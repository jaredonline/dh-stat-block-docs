import { displayName, htmlText } from '../shared'
import { googleDocsThemes, type GoogleDocsDensity } from '../theme'

// Google Docs is an independent output target. Keep the small tag vocabulary and
// direct cell styles stable; browser preview styling must not leak into this API.
const featureNameColumns = (columns: number) => columns * 2 / 3
const featureTypeColumns = (columns: number) => columns / 3
const titleColumns = (columns: number) => columns / 2
const metadataLabelColumns = (columns: number) => columns / 3
const metadataValueColumns = (columns: number) => columns - metadataLabelColumns(columns)

export function docsTable(rows: string[], density: GoogleDocsDensity): string {
  const theme = googleDocsThemes[density]
  return `<table style="width:100%;border-collapse:collapse;border:1px solid ${theme.border};font-family:${theme.fontFamily};font-size:${theme.bodySize};line-height:${theme.lineHeight};color:${theme.ink};background-color:#ffffff;"><tbody>\n${rows.join('\n')}\n</tbody></table>`
}

export function docsTitle(name: string, tier: number, type: string, density: GoogleDocsDensity, columns = googleDocsThemes[density].columns): string {
  const theme = googleDocsThemes[density]
  const cell = `padding:${theme.cellPadding};border:1px solid ${theme.border};vertical-align:top;`
  const half = titleColumns(columns)
  return `<tr><td colspan="${half}" style="${cell}border-right-width:0;background-color:${theme.headerFill};font-size:${theme.nameSize};font-weight:bold;"><strong>${htmlText(displayName(name))}</strong></td><td colspan="${columns - half}" style="${cell}border-left-width:0;background-color:${theme.headerFill};font-size:${theme.tierSize};font-weight:bold;font-style:italic;text-align:right;"><strong><em>Tier ${htmlText(String(tier))} ${htmlText(type)}</em></strong></td></tr>`
}

export function docsFullRow(content: string, density: GoogleDocsDensity, columns = googleDocsThemes[density].columns, extraStyle = ''): string {
  const theme = googleDocsThemes[density]
  const cell = `padding:${theme.cellPadding};border:1px solid ${theme.border};vertical-align:top;`
  return `<tr><td colspan="${columns}" style="${cell}${extraStyle}">${content}</td></tr>`
}

export function docsMetadata(label: string, value: string, density: GoogleDocsDensity, columns = googleDocsThemes[density].columns): string {
  const theme = googleDocsThemes[density]
  const cell = `padding:${theme.cellPadding};border:1px solid ${theme.border};vertical-align:top;`
  return `<tr><td colspan="${metadataLabelColumns(columns)}" width="${theme.metadataAttributeWidth}" style="${cell}width:${theme.metadataWidth};background-color:${theme.labelFill};font-weight:bold;"><strong>${htmlText(label)}</strong></td><td colspan="${metadataValueColumns(columns)}" width="${theme.metadataComplementAttributeWidth}" style="${cell}width:${theme.metadataComplementWidth};">${htmlText(value)}</td></tr>`
}

export function docsSection(title: string, density: GoogleDocsDensity, columns = googleDocsThemes[density].columns): string {
  const theme = googleDocsThemes[density]
  return docsFullRow(`<strong>${htmlText(title)}</strong>`, density, columns, `background-color:${theme.headerFill};font-size:${theme.sectionSize};font-weight:bold;`)
}

export function docsFeature(name: string, type: string, text: string, questions: string | undefined, density: GoogleDocsDensity, columns = googleDocsThemes[density].columns): string {
  const theme = googleDocsThemes[density]
  const cell = `padding:${theme.cellPadding};border:1px solid ${theme.border};vertical-align:top;`
  const titleColumnsCount = featureNameColumns(columns)
  const title = `<tr><td colspan="${titleColumnsCount}" style="${cell}border-right-width:0;border-bottom:0;font-size:${theme.featureNameSize};font-weight:bold;"><strong>${htmlText(name) || 'Untitled feature'}</strong></td><td colspan="${featureTypeColumns(columns)}" style="${cell}border-left-width:0;border-bottom:0;font-size:${theme.featureTypeSize};font-weight:bold;font-style:italic;text-align:right;"><strong><em>${htmlText(type.toUpperCase())}</em></strong></td></tr>`
  const body = [
    text.trim() ? `<div>${htmlText(text)}</div>` : '',
    questions?.trim() ? `<div style="${text.trim() ? `padding-top:${theme.featureQuestionSpacing};` : ''}font-style:italic;"><em>${htmlText(questions)}</em></div>` : '',
  ].filter(Boolean).join('')
  return title + (body ? docsFullRow(body, density, columns, 'border-top:0;') : '')
}

export function docsStats(stats: [string, string][], density: GoogleDocsDensity, columns: number): string {
  const theme = googleDocsThemes[density]
  const cell = `padding:${theme.cellPadding};border:1px solid ${theme.border};vertical-align:top;`
  const statWidth = columns / stats.length
  return `<tr>${stats.map(([label, value]) => `<td colspan="${statWidth}" style="${cell}"><div style="font-size:${theme.sectionSize};font-weight:bold;"><strong>${htmlText(label)}</strong></div><div>${htmlText(value)}</div></td>`).join('')}</tr>`
}
