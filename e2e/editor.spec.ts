import { readFile } from 'node:fs/promises'
import { expect, test, type Page } from 'playwright/test'

type ClipboardCall = { kind: 'text'; text: string } | { kind: 'rich'; items: Record<string, string>[] }
type ClipboardWindow = Window & { clipboardCalls: ClipboardCall[] }

async function createBlock(page: Page, kind: 'Environment' | 'Adversary') {
  await page.getByLabel('New statblock', { exact: true }).click()
  await page.getByRole('button', { name: `New ${kind}`, exact: true }).click()
  await expect(page.getByLabel('Name', { exact: true })).toBeFocused()
}

async function mockClipboard(page: Page) {
  await page.addInitScript(() => {
    const clipboardWindow = window as unknown as ClipboardWindow
    clipboardWindow.clipboardCalls = []
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: {
        async writeText(text: string) {
          clipboardWindow.clipboardCalls.push({ kind: 'text', text })
        },
        async write(items: ClipboardItem[]) {
          const captured: Record<string, string>[] = []
          for (const item of items) {
            const representations: Record<string, string> = {}
            for (const type of item.types) representations[type] = await (await item.getType(type)).text()
            captured.push(representations)
          }
          clipboardWindow.clipboardCalls.push({ kind: 'rich', items: captured })
        },
      },
    })
  })
}

async function clipboardCalls(page: Page) {
  return page.evaluate(() => (window as unknown as ClipboardWindow).clipboardCalls)
}

test('authors an environment, manages feature order, and restores edits after reload', async ({ page }) => {
  await page.goto('/')
  await expect(page.locator('.statblock-header h2')).toHaveText('Chaos Realm')
  await createBlock(page, 'Environment')
  await page.getByLabel('Name', { exact: true }).fill('A Glass Crossing')
  await page.getByLabel('Tier', { exact: true }).selectOption('3')
  await page.getByLabel('Environment type').selectOption('Traversal')
  const description = 'Glass & stone <a strange road>\n\nA second paragraph.'
  await page.getByLabel('Description', { exact: true }).fill(description)
  await page.getByLabel('Impulses', { exact: true }).fill('Split the party')
  await page.getByLabel('Difficulty', { exact: true }).fill('17')
  await page.getByLabel('Potential Adversaries').fill('Echoes of passing travelers')
  await expect(page.locator('.statblock-description')).toHaveText(description)
  await expect(page.locator('.statblock-description a')).toHaveCount(0)
  await expect(page.locator('.statblock-tier')).toHaveText('Tier 3 Traversal')

  await page.getByRole('button', { name: '+ Add Feature', exact: true }).click()
  let feature = page.locator('.feature-editor').nth(0)
  await expect(feature.getByLabel('Feature name')).toBeFocused()
  await feature.getByLabel('Feature name').fill('Tremors')
  await feature.getByLabel('Feature type').selectOption('Reaction')
  await feature.getByLabel('Mechanical text').fill('The road shakes.\n\nEach crack shows a different sky.')
  await feature.getByLabel('Questions').fill('What do you see below?')

  await page.getByRole('button', { name: '+ Add Feature', exact: true }).click()
  feature = page.locator('.feature-editor').nth(1)
  await feature.getByLabel('Feature name').fill('Sheltering Light')
  await feature.getByLabel('Mechanical text').fill('The light offers a moment of rest.')
  await page.getByRole('button', { name: 'Duplicate Tremors', exact: true }).click()
  await expect(page.locator('.feature-editor')).toHaveCount(3)
  feature = page.locator('.feature-editor').nth(1)
  await expect(feature.getByLabel('Feature name')).toBeFocused()
  await feature.getByLabel('Feature name').fill('Echoes')
  await expect(feature.getByLabel('Questions')).toHaveValue('What do you see below?')
  await page.getByRole('button', { name: 'Move Echoes up', exact: true }).click()
  await expect(page.locator('.statblock-feature h4')).toHaveText(['Echoes', 'Tremors', 'Sheltering Light'])
  await page.getByRole('button', { name: 'Remove Echoes', exact: true }).click()
  await expect(page.locator('.feature-editor').nth(0).getByLabel('Feature name')).toBeFocused()
  await expect(page.locator('.statblock-feature h4')).toHaveText(['Tremors', 'Sheltering Light'])
  await expect(page.locator('.statblock-questions')).toHaveText('What do you see below?')

  await page.reload()
  await expect(page.getByLabel('Name', { exact: true })).toHaveValue('A Glass Crossing')
  await expect(page.getByLabel('Description', { exact: true })).toHaveValue(description)
  await expect(page.locator('.statblock-feature h4')).toHaveText(['Tremors', 'Sheltering Light'])
  await expect(page.locator('.library-item')).toHaveCount(3)
})

test('authors an adversary with combat stats, experiences, and Fear Features', async ({ page }) => {
  await page.goto('/')
  await createBlock(page, 'Adversary')
  await page.getByLabel('Name', { exact: true }).fill('Bridge Keeper')
  await page.getByLabel('Adversary type').selectOption('Leader')
  await page.getByLabel('Motives & Tactics').fill('Block the crossing, call for aid')
  await page.getByLabel('Difficulty', { exact: true }).fill('16')
  await page.getByLabel('Major threshold').fill('10')
  await page.getByLabel('Severe threshold').fill('20')
  await page.getByLabel('HP', { exact: true }).fill('6')
  await page.getByLabel('Stress', { exact: true }).fill('4')
  await page.getByLabel('Attack modifier').fill('+3')
  await page.getByLabel('Attack name').fill('Iron Staff')
  await page.getByLabel('Range', { exact: true }).fill('Very Close')
  await page.getByLabel('Damage', { exact: true }).fill('2d8+3 phy')
  await expect(page.locator('.statblock-stats')).toContainText('Major 10 / Severe 20')
  await expect(page.locator('.statblock-attack')).toContainText('Iron Staff')
  await expect(page.locator('.statblock-attack')).toContainText('2d8+3 phy')

  await page.getByRole('button', { name: '+ Add Experience', exact: true }).click()
  let experience = page.locator('.experience-editor').nth(0)
  await expect(experience.getByLabel('Experience name')).toBeFocused()
  await experience.getByLabel('Experience name').fill('Watchful')
  await experience.getByLabel('Modifier', { exact: true }).fill('+2')
  await page.getByRole('button', { name: '+ Add Experience', exact: true }).click()
  experience = page.locator('.experience-editor').nth(1)
  await experience.getByLabel('Experience name').fill('Tunnelwise')
  await experience.getByLabel('Modifier', { exact: true }).fill('+3')
  await page.getByRole('button', { name: 'Move Tunnelwise up', exact: true }).click()
  await expect(page.locator('.statblock-experiences dt')).toHaveText(['Tunnelwise', 'Watchful'])
  await page.getByRole('button', { name: 'Remove Watchful', exact: true }).click()
  await expect(page.locator('.statblock-experiences dt')).toHaveText(['Tunnelwise'])

  await page.getByRole('button', { name: '+ Add Feature', exact: true }).click()
  let feature = page.locator('.feature-editor').nth(0)
  await feature.getByLabel('Feature name').fill('Shield Bash')
  await feature.getByLabel('Feature type').selectOption('Action')
  await feature.getByLabel('Mechanical text').fill('Push a nearby target back.')
  await page.getByRole('button', { name: '+ Add Feature', exact: true }).click()
  feature = page.locator('.feature-editor').nth(1)
  await feature.getByLabel('Feature name').fill('Last Stand')
  await feature.getByLabel('Feature type').selectOption('Reaction')
  await feature.getByLabel('Mechanical text').fill('Spend a Fear to rally the guard.')
  await feature.getByLabel('Fear Feature', { exact: true }).check()
  await expect(page.locator('.statblock-section-title')).toHaveText(['Standard attack', 'Experiences', 'Features', 'Fear Features'])
  await expect(page.locator('.statblock-feature h4')).toHaveText(['Shield Bash', 'Last Stand'])
  await expect(page.locator('.statblock-feature-type')).toHaveText(['ACTION', 'REACTION'])
  await page.reload()
  await expect(page.locator('.feature-editor').nth(1).getByLabel('Fear Feature', { exact: true })).toBeChecked()
  await expect(page.locator('.statblock-experiences')).toContainText('Tunnelwise')
})

test('duplicates independently, confirms deletion, and preserves an empty library', async ({ page }) => {
  await page.goto('/')
  const library = page.getByRole('complementary', { name: 'Statblock library' })
  await library.getByRole('button', { name: 'Duplicate', exact: true }).click()
  await expect(page.getByLabel('Name', { exact: true })).toHaveValue('Chaos Realm (copy)')
  await page.getByLabel('Name', { exact: true }).fill('Working Copy')
  await page.locator('.feature-editor').nth(0).getByLabel('Feature name').fill('Changed in copy')
  await page.locator('.library-item').filter({ has: page.locator('strong', { hasText: /^Chaos Realm$/ }) }).click()
  await expect(page.locator('.feature-editor').nth(0).getByLabel('Feature name')).toHaveValue('Impossible Architecture')
  await page.locator('.library-item').filter({ hasText: 'Working Copy' }).click()
  page.once('dialog', dialog => dialog.dismiss())
  await library.getByRole('button', { name: 'Delete', exact: true }).click()
  await expect(page.locator('.library-item')).toHaveCount(3)
  await expect(page.getByLabel('Name', { exact: true })).toHaveValue('Working Copy')

  page.on('dialog', dialog => dialog.accept())
  for (const remaining of [2, 1, 0]) {
    await library.getByRole('button', { name: 'Delete', exact: true }).click()
    await expect(page.locator('.library-item')).toHaveCount(remaining)
  }
  await expect(page.getByRole('heading', { name: 'Start with a statblock.' })).toBeVisible()
  await expect(library.getByRole('button', { name: 'Duplicate', exact: true })).toBeDisabled()
  await expect(library.getByRole('button', { name: 'Delete', exact: true })).toBeDisabled()
  await page.reload()
  await expect(page.locator('.library-item')).toHaveCount(0)
  await expect(page.getByRole('heading', { name: 'Start with a statblock.' })).toBeVisible()
})

test('copies Markdown and HTML as source and Google Docs as two rich representations', async ({ page }) => {
  await mockClipboard(page)
  await page.goto('/')
  await page.getByRole('button', { name: 'Copy Markdown', exact: true }).click()
  await expect(page.locator('.notice')).toContainText('Markdown copied')
  await page.getByRole('button', { name: 'Copy HTML', exact: true }).click()
  await expect(page.locator('.notice')).toContainText('HTML source copied')
  const density = page.getByRole('group', { name: 'Google Docs layout' })
  await expect(density.getByRole('button', { name: 'Full', exact: true })).toHaveAttribute('aria-pressed', 'true')
  await page.getByRole('button', { name: 'Copy for Google Docs', exact: true }).click()
  await expect(page.locator('.notice')).toContainText('Google Docs version copied — paste normally into Docs')
  const calls = await clipboardCalls(page)
  expect(calls).toHaveLength(3)
  expect(calls[0]).toEqual({ kind: 'text', text: expect.stringContaining('# Chaos Realm') })
  expect(calls[1]).toEqual({ kind: 'text', text: expect.stringContaining('<article') })
  expect(calls[2].kind).toBe('rich')
  if (calls[2].kind !== 'rich') throw new Error('Expected rich clipboard content')
  expect(calls[2].items).toHaveLength(1)
  expect(Object.keys(calls[2].items[0]).sort()).toEqual(['text/html', 'text/plain'])
  const fullRich = calls[2].kind === 'rich' ? calls[2].items[0] : undefined
  if (!fullRich) throw new Error('Expected rich Full clipboard content')
  expect(fullRich['text/html']).toContain('<table')
  expect(fullRich['text/html']).toContain('font-size:17pt')
  expect(fullRich['text/html']).toContain('width="33%"')
  expect(fullRich['text/html']).toContain('background-color:')
  expect(fullRich['text/plain']).toContain('Chaos Realm — Tier 4 Traversal')
  expect(fullRich['text/plain']).not.toContain('<table')

  await density.getByRole('button', { name: 'Compact', exact: true }).click()
  await expect(density.getByRole('button', { name: 'Compact', exact: true })).toHaveAttribute('aria-pressed', 'true')
  await page.reload()
  await expect(page.getByRole('group', { name: 'Google Docs layout' }).getByRole('button', { name: 'Compact', exact: true })).toHaveAttribute('aria-pressed', 'true')
  await page.getByRole('button', { name: 'Copy for Google Docs', exact: true }).click()
  await expect(page.locator('.notice')).toContainText('Google Docs version copied — paste normally into Docs')
  const compactCalls = await clipboardCalls(page)
  expect(compactCalls).toHaveLength(1)
  const compactRich = compactCalls[0].kind === 'rich' ? compactCalls[0].items[0] : undefined
  if (!compactRich) throw new Error('Expected rich Compact clipboard content')
  expect(compactRich['text/html']).toContain('font-size:14.5pt')
  expect(compactRich['text/html']).toContain('width="30%"')
  expect(compactRich['text/plain']).toBe(fullRich['text/plain'])

  await page.locator('.library-item').filter({ hasText: 'Wayward Sentinel' }).click()
  await page.getByRole('button', { name: 'Copy for Google Docs', exact: true }).click()
  await expect.poll(async () => (await clipboardCalls(page)).length).toBe(2)
  const adversaryCopy = (await clipboardCalls(page))[1]
  expect(adversaryCopy.kind).toBe('rich')
  if (adversaryCopy.kind !== 'rich') throw new Error('Expected rich clipboard content')
  expect(adversaryCopy.items[0]['text/html']).toContain('FEAR FEATURES')
  expect(adversaryCopy.items[0]['text/plain']).toContain('Watchful +2')
})

test('reports a useful error if both rich clipboard paths fail', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { write: async () => { throw new Error('Blocked') } } })
    document.execCommand = () => false
  })
  await page.goto('/')
  await page.getByRole('button', { name: 'Copy for Google Docs', exact: true }).click()
  await expect(page.getByRole('alert')).toContainText('Rich clipboard copy for Google Docs is unavailable or was blocked')
  await expect(page.getByRole('button', { name: 'Copy for Google Docs', exact: true })).toBeEnabled()
})

test('exports a JSON backup and imports it after confirmation', async ({ page }) => {
  await page.goto('/')
  const downloadPromise = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Export JSON', exact: true }).click()
  const download = await downloadPromise
  expect(download.suggestedFilename()).toMatch(/^statblock-desk-.*\.json$/)
  const downloadPath = await download.path()
  if (!downloadPath) throw new Error('Expected downloaded JSON backup')
  const backup = JSON.parse(await readFile(downloadPath, 'utf8'))
  expect(backup.version).toBe(1)
  expect(backup.blocks).toHaveLength(2)
  backup.blocks[0].name = 'Restored packet'
  const file = { name: 'backup.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(backup)) }

  page.once('dialog', dialog => dialog.dismiss())
  await page.getByLabel('Import library file').setInputFiles(file)
  await expect(page.getByLabel('Name', { exact: true })).toHaveValue('Chaos Realm')
  page.once('dialog', dialog => dialog.accept())
  await page.getByLabel('Import library file').setInputFiles(file)
  await expect(page.locator('.notice')).toContainText('Library imported')
  await expect(page.getByLabel('Name', { exact: true })).toHaveValue('Restored packet')
  await page.reload()
  await expect(page.getByLabel('Name', { exact: true })).toHaveValue('Restored packet')

  await page.getByLabel('Import library file').setInputFiles({ name: 'broken.json', mimeType: 'application/json', buffer: Buffer.from('{invalid') })
  await expect(page.getByRole('alert')).toContainText('not valid JSON')
  await expect(page.getByLabel('Name', { exact: true })).toHaveValue('Restored packet')
})

test('keeps both editors and previews usable at 390px without horizontal overflow', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/')
  const overflow = () => page.evaluate(() => Math.max(document.documentElement.scrollWidth, document.body.scrollWidth) - window.innerWidth)
  await expect.poll(overflow).toBeLessThanOrEqual(1)
  await page.getByLabel('Name', { exact: true }).fill('Averylongunbrokenenvironmentnamethatstillneedstofitonthepage')
  await expect.poll(overflow).toBeLessThanOrEqual(1)
  await page.locator('.library-item').filter({ hasText: 'Wayward Sentinel' }).click()
  await expect(page.getByLabel('Adversary type')).toBeVisible()
  await page.getByRole('button', { name: 'Copy for Google Docs', exact: true }).scrollIntoViewIfNeeded()
  await expect(page.getByRole('button', { name: 'Copy for Google Docs', exact: true })).toBeVisible()
  await expect.poll(overflow).toBeLessThanOrEqual(1)
})
