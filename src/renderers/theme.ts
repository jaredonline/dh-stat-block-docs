// Output typography uses points so its scale also makes sense on a printed page.
// Keep full mode stable after a successful Google Docs regression test.
export const statblockTheme = {
  fontFamily: 'Arial, sans-serif',
  nameSize: '17pt',
  tierSize: '11pt',
  bodySize: '11pt',
  featureNameSize: '12pt',
  featureTypeSize: '9pt',
  sectionSize: '10pt',
  lineHeight: '1.35',
  ink: '#202020',
  muted: '#515151',
  border: '#c8c8c8',
  headerFill: '#e8e8e8',
  labelFill: '#f3f3f3',
  cellPadding: '6pt 8pt',
} as const

export type GoogleDocsDensity = 'full' | 'compact'

type GoogleDocsTheme = { [Key in keyof typeof statblockTheme]: string } & {
  metadataWidth: string
  metadataComplementWidth: string
  metadataAttributeWidth: string
  metadataComplementAttributeWidth: string
  featureQuestionSpacing: string
  columns: number
}

export const googleDocsThemes: Record<GoogleDocsDensity, GoogleDocsTheme> = {
  full: {
    ...statblockTheme,
    metadataWidth: '33.333%',
    metadataComplementWidth: '66.667%',
    metadataAttributeWidth: '33%',
    metadataComplementAttributeWidth: '67%',
    featureQuestionSpacing: '5pt',
    columns: 6,
  },
  compact: {
    ...statblockTheme,
    nameSize: '14.5pt',
    tierSize: '9.5pt',
    bodySize: '9.25pt',
    featureNameSize: '10.25pt',
    featureTypeSize: '8.25pt',
    sectionSize: '9pt',
    lineHeight: '1.25',
    cellPadding: '3.5pt 6pt',
    metadataWidth: '30%',
    metadataComplementWidth: '70%',
    metadataAttributeWidth: '30%',
    metadataComplementAttributeWidth: '70%',
    featureQuestionSpacing: '3pt',
    columns: 30,
  },
}
