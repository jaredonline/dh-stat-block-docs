import { describe, expect, it } from 'vitest'
import { createSamples } from '../data/statblocks'
import type { Adversary, Environment, Statblock } from '../types/daggerheart'
import { adversaryGoogleDocsHtml } from './googleDocs/adversaryGoogleDocsHtml'
import { environmentGoogleDocsHtml } from './googleDocs/environmentGoogleDocsHtml'
import { adversaryHtml } from './html/adversaryHtml'
import { environmentHtml } from './html/environmentHtml'
import { serializeGoogleDocsHtml, serializeHtml, serializeMarkdown, serializePlainText } from './index'
import { adversaryMarkdown } from './markdown/adversaryMarkdown'
import { environmentMarkdown } from './markdown/environmentMarkdown'
import { adversaryPlainText } from './plaintext/adversaryPlainText'
import { environmentPlainText } from './plaintext/environmentPlainText'
import { escapeHtml, hasStandardAttack, htmlText, markdownText } from './shared'
import { statblockTheme } from './theme'
import { googleDocsThemes } from './theme'

function environment(): Environment {
  return {
    id: 'environment', kind: 'environment', name: 'Chaos Realm', tier: 4, type: 'Traversal',
    description: 'An impossible place.', impulses: 'Confuse direction', difficulty: '20', potentialAdversaries: 'Warped guardians',
    features: [
      { id: 'first', name: 'Shifting Pathways', type: 'Action', text: 'First line.\nSecond line.\n\nAnother paragraph.', questions: 'Where did the path go?\nWho noticed?' },
      { id: 'second', name: 'Impossible Architecture', type: 'Passive', text: 'Up is down.', questions: '' },
    ],
  }
}

function adversary(): Adversary {
  return {
    id: 'adversary', kind: 'adversary', name: 'Wayward Sentinel', tier: 2, type: 'Standard',
    description: 'A watchful guardian.', motivesAndTactics: 'Protect the road', difficulty: '14',
    thresholds: { major: '8', severe: '16' }, hp: '5', stress: '3', attackModifier: '+2',
    standardAttack: { name: 'Halberd', range: 'Very Close', damage: '2d8+2 phy' },
    experiences: [{ id: 'watch', name: 'Watchful', modifier: '+2' }, { id: 'roads', name: 'Old roads', modifier: '-1' }],
    features: [
      { id: 'fear-one', name: 'Distant Echoes', type: 'Reaction', text: 'Spend a Fear.\nHear the watch.\n\nIt approaches.', fearFeature: true },
      { id: 'action', name: 'Warning Sweep', type: 'Action', text: 'Mark a Stress.', fearFeature: false },
      { id: 'passive', name: 'Hold the Road', type: 'Passive', text: 'Guard a passage.', fearFeature: false },
      { id: 'fear-two', name: 'Final Watch', type: 'Action', text: 'Spend another Fear.', fearFeature: true },
    ],
  }
}

function parse(html: string): DocumentFragment {
  const template = document.createElement('template')
  template.innerHTML = html
  return template.content
}

function assertOrdered(output: string, pieces: string[]): void {
  let previous = -1
  for (const piece of pieces) {
    const current = output.indexOf(piece)
    expect(current, `${piece} must appear after the preceding item`).toBeGreaterThan(previous)
    previous = current
  }
}

describe('Environment Markdown', () => {
  it('exports clean semantic source with authored order, paragraphs, and questions', () => {
    expect(environmentMarkdown(environment())).toBe([
      '# Chaos Realm', '*Tier 4 Traversal*', '*An impossible place.*',
      '**Impulses:** Confuse direction  \n**Difficulty:** 20  \n**Potential Adversaries:** Warped guardians',
      '## Features', '### Shifting Pathways — Action', 'First line.  \nSecond line.\n\nAnother paragraph.',
      '*Where did the path go?  \nWho noticed?*', '### Impossible Architecture — Passive', 'Up is down.',
    ].join('\n\n'))
  })

  it('preserves paragraph boundaries in italic descriptions and questions', () => {
    const block = environment()
    block.description = 'Paragraph one.\n\nParagraph two.'
    block.features[0].questions = 'Question one?\n\nQuestion two?'
    expect(environmentMarkdown(block)).toContain('*Paragraph one.*\n\n*Paragraph two.*')
    expect(environmentMarkdown(block)).toContain('*Question one?*\n\n*Question two?*')
  })
})

describe('Environment plaintext', () => {
  it('uses dedicated readable text and preserves paragraph breaks', () => {
    expect(environmentPlainText(environment())).toBe([
      'Chaos Realm — Tier 4 Traversal', 'An impossible place.',
      'Impulses: Confuse direction\nDifficulty: 20\nPotential Adversaries: Warped guardians',
      'FEATURES', 'Shifting Pathways — Action', 'First line.\nSecond line.\n\nAnother paragraph.',
      'Questions:\nWhere did the path go?\nWho noticed?', 'Impossible Architecture — Passive', 'Up is down.',
    ].join('\n\n'))
  })

  it('preserves literal markup and does not strip author text', () => {
    const block = environment()
    block.description = '<strong>literal & editable</strong> "quotes"'
    expect(environmentPlainText(block)).toContain(block.description)
  })
})

describe('Environment HTML source', () => {
  it('provides semantic headings, inline styles, and safely preserved lines', () => {
    const html = environmentHtml(environment())
    const document = parse(html)
    expect(document.querySelector('article')?.getAttribute('style')).toContain('font-family:Arial, sans-serif')
    expect(document.querySelector('h1')?.textContent).toBe('Chaos Realm')
    expect(document.querySelector('h2')?.textContent).toBe('FEATURES')
    expect([...document.querySelectorAll('h3')].map(node => node.textContent)).toEqual(['Shifting Pathways', 'Impossible Architecture'])
    expect(document.querySelectorAll('th[scope="row"]')).toHaveLength(3)
    expect(document.querySelectorAll('br')).toHaveLength(4)
    expect(document.querySelector('p em')?.textContent).toBe('An impossible place.')
    expect(document.querySelectorAll('[class], link, style, script')).toHaveLength(0)
    expect(html).not.toBe(environmentGoogleDocsHtml(environment()))
  })
})

describe('Environment Google Docs HTML', () => {
  it('uses native table cells, merged full-width rows, fills, hierarchy, and right alignment', () => {
    const root = parse(environmentGoogleDocsHtml(environment()))
    const table = root.querySelector('table')!
    expect(root.querySelectorAll('table')).toHaveLength(1)
    expect(table.style.width).toBe('100%')
    expect(table.style.borderCollapse).toBe('collapse')
    expect(table.style.fontFamily).toBe('Arial, sans-serif')
    expect(table.rows[0].cells[0].style.fontSize).toBe(statblockTheme.nameSize)
    expect(table.rows[0].cells[1].style.textAlign).toBe('right')
    expect(table.rows[0].cells[1].querySelector('strong em')?.textContent).toBe('Tier 4 Traversal')
    expect(table.rows[0].cells[0].style.backgroundColor).toBeTruthy()
    expect(table.rows[0].cells[0].style.borderRightWidth).toBe('0px')
    expect(table.rows[0].cells[1].style.borderLeftWidth).toBe('0px')
    expect(table.rows[1].cells[0].colSpan).toBe(6)
    expect(table.rows[1].cells[0].querySelector('em')?.textContent).toBe('An impossible place.')
    const metadata = table.rows[2]
    expect(metadata.cells[0].colSpan).toBe(2)
    expect(metadata.cells[1].colSpan).toBe(4)
    expect(metadata.cells[0].getAttribute('width')).toBe('33%')
    expect(metadata.cells[1].getAttribute('width')).toBe('67%')
    const featureTitle = [...table.rows].find(row => row.cells[0]?.textContent === 'Shifting Pathways')!
    expect(featureTitle.cells[0].colSpan).toBe(4)
    expect(featureTitle.cells[1].colSpan).toBe(2)
    expect(featureTitle.cells[0].style.borderRightWidth).toBe('0px')
    expect(featureTitle.cells[1].style.borderLeftWidth).toBe('0px')
    expect(root.querySelectorAll('td')).not.toHaveLength(0)
    for (const cell of root.querySelectorAll('td')) {
      expect(cell.style.padding).toBeTruthy()
      expect(cell.style.border).toContain('1px')
    }
    expect(root.querySelectorAll('br')).toHaveLength(4)
    expect(root.textContent).toContain('ACTION')
    expect(root.textContent).toContain('PASSIVE')
    assertOrdered(root.textContent!, ['Shifting Pathways', 'Impossible Architecture'])
    for (const row of table.rows) expect([...row.cells].reduce((total, cell) => total + cell.colSpan, 0)).toBe(6)
  })
})

describe('Adversary Markdown', () => {
  it('includes combat stats, standard attack, Experiences, and Fear Features in separate sections', () => {
    const markdown = adversaryMarkdown(adversary())
    expect(markdown).toContain('# Wayward Sentinel\n\n*Tier 2 Standard*')
    expect(markdown).toContain('**Motives & Tactics:** Protect the road')
    expect(markdown).toContain('**Thresholds:** Major 8 / Severe 16')
    expect(markdown).toContain('**HP:** 5  \n**Stress:** 3  \n**ATK:** +2')
    expect(markdown).toContain('## Standard Attack\n\n**Halberd**  \n**Range:** Very Close  \n**Damage:** 2d8+2 phy')
    expect(markdown).toContain('## Experiences\n\n- Watchful +2\n- Old roads -1')
    expect(markdown).toContain('Spend a Fear.  \nHear the watch.\n\nIt approaches.')
    assertOrdered(markdown, ['## Features', 'Warning Sweep', 'Hold the Road', '## Fear Features', 'Distant Echoes', 'Final Watch'])
  })
})

describe('Adversary plaintext', () => {
  it('includes authored values and order within the regular and fear groups', () => {
    const text = adversaryPlainText(adversary())
    expect(text).toContain('Wayward Sentinel — Tier 2 Standard')
    expect(text).toContain('Difficulty: 14\nThresholds: Major 8 / Severe 16\nHP: 5\nStress: 3\nATK: +2')
    expect(text).toContain('STANDARD ATTACK\n\nHalberd\nRange: Very Close\nDamage: 2d8+2 phy')
    expect(text).toContain('EXPERIENCES\n\nWatchful +2\nOld roads -1')
    expect(text).toContain('Spend a Fear.\nHear the watch.\n\nIt approaches.')
    assertOrdered(text, ['FEATURES', 'Warning Sweep', 'Hold the Road', 'FEAR FEATURES', 'Distant Echoes', 'Final Watch'])
  })
})

describe('Adversary HTML source', () => {
  it('uses independent semantic sections with all combat data and features', () => {
    const root = parse(adversaryHtml(adversary()))
    expect(root.querySelector('h1')?.textContent).toBe('Wayward Sentinel')
    expect([...root.querySelectorAll('h2')].map(node => node.textContent)).toEqual(['STANDARD ATTACK', 'EXPERIENCES', 'FEATURES', 'FEAR FEATURES'])
    expect([...root.querySelectorAll('h3')].map(node => node.textContent)).toEqual(['Warning Sweep', 'Hold the Road', 'Distant Echoes', 'Final Watch'])
    expect(root.textContent).toContain('Major 8 / Severe 16')
    expect(root.textContent).toContain('Watchful +2')
    expect(root.textContent).toContain('Old roads -1')
    expect(root.textContent).toContain('2d8+2 phy')
    expect(root.querySelectorAll('[class], script, style, link')).toHaveLength(0)
    expect(adversaryHtml(adversary())).not.toBe(adversaryGoogleDocsHtml(adversary()))
  })
})

describe('Adversary Google Docs HTML', () => {
  it('fits stats and fear groups into one correctly spanned, editable table', () => {
    const root = parse(adversaryGoogleDocsHtml(adversary()))
    expect(root.querySelectorAll('table')).toHaveLength(1)
    const table = root.querySelector('table')!
    for (const row of table.rows) expect([...row.cells].reduce((total, cell) => total + cell.colSpan, 0)).toBe(30)
    const statsRow = [...table.rows].find(row => row.cells.length === 5)!
    expect(statsRow.cells[0].colSpan).toBe(6)
    expect([...statsRow.cells].map(cell => cell.querySelector('strong')?.textContent)).toEqual(['Difficulty', 'Thresholds', 'HP', 'Stress', 'ATK'])
    expect(statsRow.cells[1].textContent).toContain('Major 8 / Severe 16')
    const metadata = [...table.rows].find(row => row.cells[0]?.textContent === 'Motives & Tactics')!
    expect(metadata.cells[0].colSpan).toBe(10)
    expect(metadata.cells[1].colSpan).toBe(20)
    const featureTitle = [...table.rows].find(row => row.cells[0]?.textContent === 'Warning Sweep')!
    expect(featureTitle.cells[0].colSpan).toBe(20)
    expect(featureTitle.cells[1].colSpan).toBe(10)
    expect(root.textContent).toContain('Watchful +2')
    expect(root.textContent).toContain('Old roads -1')
    expect(root.textContent).toContain('2d8+2 phy')
    assertOrdered(root.textContent!, ['FEATURES', 'Warning Sweep', 'Hold the Road', 'FEAR FEATURES', 'Distant Echoes', 'Final Watch'])
  })

  it('keeps a valid table when only a subset of statistics is filled in', () => {
    const block = adversary()
    block.difficulty = ''
    block.hp = ''
    block.stress = ''
    block.thresholds.major = ''
    const table = parse(adversaryGoogleDocsHtml(block)).querySelector('table')!
    for (const row of table.rows) expect([...row.cells].reduce((total, cell) => total + cell.colSpan, 0)).toBe(6)
    expect(table.textContent).toContain('Severe 16')
    expect(table.textContent).not.toContain('Major')
  })
})

describe('empty optional sections', () => {
  for (const serialize of [serializeMarkdown, serializeHtml, serializeGoogleDocsHtml, serializePlainText]) {
    it(`${serialize.name} omits empty Environment optional sections and untouched features`, () => {
      const block = environment()
      Object.assign(block, { description: '', impulses: '  ', difficulty: '', potentialAdversaries: '\n', features: [{ id: 'empty', name: '', type: 'Action', text: ' ', questions: '\n' }] })
      const output = serialize(block)
      expect(output).toContain('Chaos Realm')
      expect(output).not.toMatch(/Impulses|Difficulty|Potential Adversaries|FEATURES|Features|Untitled feature/)
    })

    it(`${serialize.name} omits empty Adversary sections`, () => {
      const block = adversary()
      Object.assign(block, { description: '', motivesAndTactics: '', difficulty: '', hp: '', stress: '', attackModifier: '' })
      block.thresholds = { major: '', severe: '' }
      block.standardAttack = { name: ' ', range: '', damage: '\n' }
      block.experiences = [{ id: 'empty', name: '', modifier: ' ' }]
      block.features = [{ id: 'empty', name: '', type: 'Passive', text: '\n', fearFeature: true }]
      const output = serialize(block)
      expect(output).toContain('Wayward Sentinel')
      expect(output).not.toMatch(/Motives|Difficulty|Thresholds|STANDARD ATTACK|Standard Attack|EXPERIENCES|Experiences|FEATURES|Features|Untitled feature/)
    })

    it(`${serialize.name} keeps partially authored attacks, experiences, and features`, () => {
      const block = adversary()
      block.standardAttack = { name: '', range: '', damage: '2d6 phy' }
      block.experiences = [{ id: 'partial', name: 'Unrated', modifier: '' }]
      block.features = [{ id: 'partial', name: '', type: 'Reaction', text: 'An unnamed reaction.', fearFeature: true }]
      const output = serialize(block)
      expect(output).toContain('2d6 phy')
      expect(output).toContain('Unrated')
      expect(output).toContain('Untitled feature')
      expect(output).toContain('An unnamed reaction.')
    })
  }
})

describe('HTML escaping and Markdown literal content', () => {
  const hostile = 'A & B <img src=x onerror="alert(1)"> "double" \'single\''

  it('escapes ampersands, brackets, both quote types, and no more', () => {
    expect(escapeHtml(hostile)).toBe('A &amp; B &lt;img src=x onerror=&quot;alert(1)&quot;&gt; &quot;double&quot; &#39;single&#39;')
    expect(htmlText('A & B\r\nC < D\r\n\r\nE')).toBe('A &amp; B<br>C &lt; D<br><br>E')
  })

  it('escapes literal Markdown, raw HTML, and numbered lists without losing paragraphs', () => {
    expect(markdownText('**strong** [link](javascript:alert(1)) <script> & "quote"')).toBe('\\*\\*strong\\*\\* \\[link\\]\\(javascript:alert\\(1\\)\\) &lt;script&gt; &amp; "quote"')
    expect(markdownText('# heading\n- item\n1. count\n\ntext')).toBe('\\# heading  \n\\- item  \n1\\. count\n\ntext')
  })

  it('keeps bare final list markers literal while retaining numerical modifiers', () => {
    expect(markdownText('-')).toBe('\\-')
    expect(markdownText('+')).toBe('\\+')
    expect(markdownText('1.')).toBe('1\\.')
    expect(markdownText('+2')).toBe('+2')
    expect(markdownText('-1')).toBe('-1')
  })

  for (const serialize of [serializeHtml, serializeGoogleDocsHtml]) {
    for (const create of [environment, adversary]) {
      it(`${serialize.name} renders every authored field of ${create.name} as text`, () => {
        const block = create()
        block.name = hostile
        block.description = hostile
        block.difficulty = hostile
        if (block.kind === 'environment') {
          block.impulses = hostile
          block.potentialAdversaries = hostile
          block.features = [{ id: 'x', name: hostile, type: 'Reaction', text: hostile, questions: hostile }]
        } else {
          block.motivesAndTactics = hostile
          block.thresholds = { major: hostile, severe: hostile }
          block.hp = hostile
          block.stress = hostile
          block.attackModifier = hostile
          block.standardAttack = { name: hostile, range: hostile, damage: hostile }
          block.experiences = [{ id: 'x', name: hostile, modifier: hostile }]
          block.features = [{ id: 'x', name: hostile, type: 'Reaction', text: hostile, fearFeature: true }]
        }
        const html = serialize(block)
        const root = parse(html)
        expect(html).not.toContain('<img')
        expect(html).toContain('&amp;')
        expect(html).toContain('&lt;')
        expect(html).toContain('&quot;')
        expect(html).toContain('&#39;')
        expect(root.querySelectorAll('img, script, [onerror], [onclick], iframe, svg, canvas')).toHaveLength(0)
        const expectedOccurrences = block.kind === 'environment' ? 8 : 16
        expect(root.textContent!.split(hostile).length - 1).toBe(expectedOccurrences)
      })
    }
  }

  for (const create of [environment, adversary]) {
    it(`Google Docs ${create.name} only uses the supported tag vocabulary and inline presentation`, () => {
      const root = parse(serializeGoogleDocsHtml(create()))
      const allowed = new Set(['TABLE', 'TBODY', 'TR', 'TD', 'DIV', 'SPAN', 'STRONG', 'EM', 'BR'])
      for (const element of root.querySelectorAll('*')) {
        expect(allowed.has(element.tagName), element.tagName).toBe(true)
        expect(element.hasAttribute('class')).toBe(false)
      }
      expect(serializeGoogleDocsHtml(create())).not.toMatch(/display:(grid|flex)|position:absolute|url\(/)
    })
  }
})

describe('serializer boundaries', () => {
  it('ignores unrelated imported properties when checking whether an attack is authored', () => {
    const block = adversary()
    block.standardAttack = { name: '', range: '', damage: '' }
    Object.assign(block.standardAttack, { extra: null, futureVersionData: { note: 'Compatibility metadata' } })
    expect(hasStandardAttack(block)).toBe(false)
    for (const serialize of [serializeMarkdown, serializeHtml, serializeGoogleDocsHtml, serializePlainText]) {
      expect(serialize(block)).not.toMatch(/STANDARD ATTACK|Standard Attack|Compatibility metadata/)
    }
    block.standardAttack.name = 'Halberd'
    expect(hasStandardAttack(block)).toBe(true)
  })

  it('keeps unnamed block headings consistent with the live preview', () => {
    for (const block of [environment(), adversary()]) {
      block.name = '  '
      for (const serialize of [serializeMarkdown, serializeHtml, serializeGoogleDocsHtml, serializePlainText]) {
        expect(serialize(block)).toContain('Untitled')
      }
    }
  })

  it('does not mutate canonical data or drop long mechanical prose', () => {
    const blocks: Statblock[] = [environment(), adversary()]
    for (const block of blocks) {
      block.features[0].text = ('A lengthy authored mechanic with literal & and <symbols>.\n\n').repeat(40).trim()
      const before = JSON.stringify(block)
      for (const serialize of [serializeMarkdown, serializeHtml, serializeGoogleDocsHtml, serializePlainText]) {
        expect(serialize(block).match(/A lengthy authored mechanic/g)).toHaveLength(40)
      }
      expect(JSON.stringify(block)).toBe(before)
    }
  })
})

// These files are deliberately the actual clipboard HTML: they can also be
// opened for visual inspection. Updating them requires reviewing the output
// change and repeating the README's manual Google Docs regression checklist.
describe('Google Docs canonical output contract', () => {
  it('retains the Chaos Realm clipboard structure and inline presentation', async () => {
    const block = createSamples().find(block => block.kind === 'environment')!
    await expect(serializeGoogleDocsHtml(block)).toMatchFileSnapshot('./__snapshots__/chaos-realm.google-docs.html')
  })

  it('retains the Wayward Sentinel clipboard structure and inline presentation', async () => {
    const block = createSamples().find(block => block.kind === 'adversary')!
    await expect(serializeGoogleDocsHtml(block)).toMatchFileSnapshot('./__snapshots__/wayward-sentinel.google-docs.html')
  })
})

describe('Google Docs compact density', () => {
  it('keeps the Environment hierarchy and all content with denser readable formatting', () => {
    const block = createSamples().find(block => block.kind === 'environment')!
    const full = parse(serializeGoogleDocsHtml(block, 'full'))
    const compact = parse(serializeGoogleDocsHtml(block, 'compact'))
    const fullTable = full.querySelector('table')!
    const compactTable = compact.querySelector('table')!
    expect(serializeGoogleDocsHtml(block, 'full')).toBe(serializeGoogleDocsHtml(block))
    expect(compact.querySelectorAll('table')).toHaveLength(1)
    expect(compactTable.textContent).toContain('FEATURES')
    expect(compactTable.textContent).toBe(fullTable.textContent)
    expect(compactTable.style.width).toBe('100%')
    expect(compactTable.style.fontSize).toBe(googleDocsThemes.compact.bodySize)
    expect(compactTable.style.fontSize).toBe('9.25pt')
    expect(compactTable.style.lineHeight).toBe('1.25')
    expect(compactTable.rows[0].cells[0].style.fontSize).toBe('14.5pt')
    expect(compactTable.rows[0].cells[1].style.fontSize).toBe('9.5pt')
    expect(compactTable.rows[2].cells[0].getAttribute('width')).toBe('30%')
    expect(compactTable.rows[2].cells[1].getAttribute('width')).toBe('70%')
    expect(compactTable.rows[2].cells[0].style.padding).toBe('3.5pt 6pt')
    const question = [...compactTable.querySelectorAll('em')].find(item => item.textContent?.startsWith('What does it feel like'))!
    expect(question.textContent).toBe('What does it feel like to move through a space so alien to your senses?')
    expect(question.parentElement?.style.paddingTop).toBe('3pt')
    expect(compactTable.textContent).toContain('Shifting Pathways')
    expect(compactTable.textContent).toContain('Impossible Architecture')
  })

  it('keeps the Adversary hierarchy, experiences, and Fear Features in compact density', () => {
    const block = createSamples().find(block => block.kind === 'adversary')!
    const full = parse(serializeGoogleDocsHtml(block, 'full'))
    const compact = parse(serializeGoogleDocsHtml(block, 'compact'))
    const table = compact.querySelector('table')!
    expect(serializeGoogleDocsHtml(block, 'full')).toBe(serializeGoogleDocsHtml(block))
    expect(compact.querySelectorAll('table')).toHaveLength(1)
    expect(table.textContent).toBe(full.querySelector('table')?.textContent)
    expect(table.style.fontSize).toBe('9.25pt')
    expect(table.rows[0].cells[0].style.fontSize).toBe('14.5pt')
    expect(table.rows[0].cells[1].style.fontSize).toBe('9.5pt')
    const metadata = [...table.rows].find(row => row.cells[0]?.textContent === 'Motives & Tactics')!
    expect(metadata.cells[0].getAttribute('width')).toBe('30%')
    expect(metadata.cells[1].getAttribute('width')).toBe('70%')
    expect(table.textContent).toContain('Difficulty14')
    expect(table.textContent).toContain('Weathered Halberd')
    expect(table.textContent).toContain('Watchful +2')
    expect(table.textContent).toContain('FEAR FEATURES')
    expect(table.textContent).toContain('Echoes of the Watch')
    expect([...table.querySelectorAll('em')].map(item => item.textContent)).toContain('REACTION')
  })
})
