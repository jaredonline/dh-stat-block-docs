# Statblock Desk

A small, static Daggerheart Environment and Adversary editor for a writers’ room. Write in structured fields, see a live preview, and copy editable statblocks into session notes. No account, backend, extension, add-on, or collaborator installation.

## Run locally

Use Node.js 24 LTS (Node 22.12+ is also supported).

```sh
npm install
npm run dev
```

Open the localhost address Vite prints. For a production build:

```sh
npm run test
npm run build
npm run preview
```

`dist/` is the complete static site. Serve it over HTTPS in production; clipboard APIs require a secure context. Localhost is supported for development. Opening `index.html` directly from disk is not a supported way to run the app.

## Writing and saving

- **New → New Environment / New Adversary** creates a statblock and focuses its name. The two original examples appear only when no library has been saved.
- Edit fields and add, duplicate, remove, or move features with the up/down controls. Experiences also support add, remove, and reordering. Fear Features appear under their own output heading, preserving order within each group. Features are never sorted by type.
- Select a saved statblock in the sidebar. **Duplicate** gives the copy and its entries new IDs. **Delete** asks for confirmation.
- Edits and selection autosave to this browser’s `localStorage`. A deliberately empty library stays empty. Clearing site data removes the library; changing browser, device, or hosting origin does not transfer it.
- **Export JSON** downloads a library backup. **Import JSON** validates and replaces the library only after confirmation. Import expects this app’s versioned schema, not another tool’s JSON format.
- A storage failure shows a warning; the app keeps edits in memory so you can export a backup. Invalid or unsupported existing data is preserved instead of silently overwritten. If another tab changes the saved library, autosave pauses in this tab: export any unsaved work and reload before continuing.

Text fields are plain text. Line and paragraph breaks survive export. Empty optional sections and completely blank features/experiences are omitted. No game balance validation is performed.

## Three distinct copy actions

| Action | Clipboard representation | Paste destination |
| --- | --- | --- |
| Copy Markdown | `text/plain`, containing literal Markdown source | Obsidian, GitHub, Markdown editors |
| Copy HTML | `text/plain`, containing literal HTML source with inline styles | Code editors, CMS source fields |
| Copy for Google Docs | `text/html` plus dedicated `text/plain`, in the selected Full or Compact layout | Google Docs using normal Cmd+V / Ctrl+V |

**Use normal paste in Google Docs, not “Paste without formatting.”** The intended result is native editable tables and text. The Docs serializer uses a conservative table structure, merged cells, inline styles, Arial, and a 100% table width. It does not use images, canvas, PDFs, linked objects, Google APIs, or OAuth.

The **Google Docs layout: Full / Compact** selector affects only **Copy for Google Docs**. **Compact** is the default; **Full** retains the original output. Compact keeps every field and feature while reducing padding and font sizes for a statblock placed inside one cell of a manually prepared half-width table. It does not arrange two statblocks automatically. Your choice is saved separately from statblock data in localStorage and does not affect Markdown, HTML source, or the browser preview. If browser storage is blocked, it defaults to Compact for that session.

Copy runs directly from the button click. If the modern clipboard API fails, a temporary selected element and `execCommand('copy')` provide a best-effort fallback. Rich fallback only reports success when the copy event accepted both HTML and plain text. If copying still fails, allow clipboard access and retry in a current browser over HTTPS or localhost; the app displays an explicit error.

The preview shares the output’s information hierarchy, but browser and Google Docs layout engines can differ. The rich clipboard approach has been manually proven. The first Environment paste of this implementation was also confirmed editable; its screenshot exposed extra vertical header rules and a nearly even metadata split. The serializer now removes those rules and sets the label/value columns to 1/3 and 2/3. **Paste the updated output below to verify those final layout adjustments and the Adversary before recording a passing regression.**

## Tests

```sh
npm run test              # Unit and component regression tests, once
npm run test:watch        # Watch unit tests
npx playwright install chromium
npm run test:e2e          # Browser tests; starts Vite automatically
```

The Playwright browser installation is for developers/CI only. Writers only open the hosted webpage. On Linux CI, install browser system dependencies with `npx playwright install --with-deps chromium`. To use an existing Chromium executable, set `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH`.

Unit tests cover all eight serializers in both Google Docs densities, full output snapshots, compact typography, padding, widths, and preserved content, plus hostile HTML, ampersands/quotes/angle brackets, multiline paragraphs, authored order, optional sections, experiences, fear grouping, clipboard payloads and fallbacks, and storage validation/failures. Checked-in Full Google Docs HTML snapshots make regressions reviewable. Browser tests cover authoring, library persistence, density selection and persistence, copy actions, backups, and narrow layouts. Clipboard mocks validate representations; they do not prove Google Docs paste behavior.

## Google Docs manual regression checklist

Treat the Docs serializer as a regression-sensitive output format. Once verified, record the browser/OS, date, and commit below. Run this checklist again when changing its structure, typography, spacing, or clipboard behavior. Do not approve snapshot changes without reviewing the resulting HTML and testing a paste.

### Compact, two-column placement

1. Create an Environment with several features.
2. Set **Google Docs layout** to **Compact**.
3. Click **Copy for Google Docs**.
4. Open a Google Doc and create a 1×2 table. Set the outer table border to 0 or white if desired.
5. Paste one compact statblock into the left cell, then copy a second compact statblock and paste it into the right cell.
6. Verify both pasted blocks remain native editable text and tables, with borders and fills intact.
7. Check that font sizes, feature titles/types, and wrapping remain readable; neither block overflows its cell horizontally.
8. Print at 100% scale and check that both blocks remain comfortable to read.
9. Repeat the test with an Adversary.

### Environment

1. Create or edit **Chaos Realm**, including multiple features and intentional paragraph/line breaks.
2. Click **Copy for Google Docs**.
3. Open a normal Google Doc.
4. Paste with **Cmd+V** (Mac) or **Ctrl+V** (Windows/Linux).
5. Verify the output is **native editable content** by placing the cursor in cells and changing text.
6. Check all of the following:
   - [ ] A native table exists.
   - [ ] Text can be edited directly.
   - [ ] Merged cells (`colspan`) survive.
   - [ ] Gray background fills survive.
   - [ ] Borders survive.
   - [ ] Bold survives.
   - [ ] Italics survive, including questions.
   - [ ] Tier/type and feature type stay right aligned.
   - [ ] Font-size hierarchy survives.
   - [ ] Paragraph and line breaks survive.
   - [ ] Features remain separated and in authored order.
   - [ ] The block fits reasonably on a normal document page.
   - [ ] Printed output looks clean.

### Adversary

Repeat the same smoke test using **Wayward Sentinel** or your own adversary. Also check:

- [ ] Difficulty, thresholds, HP, Stress, and ATK remain readable.
- [ ] Standard attack name, range, and damage survive.
- [ ] Multiple experiences and modifiers survive.
- [ ] Normal Features and Fear Features remain separately labeled.
- [ ] Empty optional sections disappear.
- [ ] A long feature with several paragraphs flows reasonably over a page boundary.

Verification record: **Initial Environment paste observed 2026-10-06; first screenshot prompted the current header-divider and column-width changes. Updated Full output and both Compact two-column pastes still need verification.**

## GitHub Pages

1. Push this project, including `package-lock.json`, to a GitHub repository with a `main` branch.
2. In **Settings → Pages → Build and deployment**, select **GitHub Actions** as the source.
3. Push to `main`, or run **Deploy GitHub Pages** manually from the Actions tab.

The workflow installs dependencies with `npm ci`, runs unit tests and browser tests, builds the static bundle, and deploys `dist/`. Pull requests run the same checks without publishing. If your repository requires approval for the `github-pages` environment, approve that deployment in GitHub.

Vite’s `base: './'` emits relative asset URLs. With no client-side routing, the same build works at `https://USER.github.io/REPO/`, an account’s root Pages site, or a custom domain. There are no secrets, runtime API dependencies, or server functions to configure. See [Vite’s deployment documentation](https://vite.dev/guide/static-deploy.html#github-pages).

The repository configuration is provided; no remote repository or live deployment was created by this implementation.

## Code map

```text
src/
  types/daggerheart.ts       Canonical discriminated models
  data/statblocks.ts         New/duplicate factories and original samples
  components/               Form controls and independent React previews
  renderers/
    markdown/               Semantic Markdown source
    html/                   Portable HTML source, inline styles
    googleDocs/             Conservative clipboard table HTML
    plaintext/              Dedicated readable plain text
    shared.ts               Escaping, field formatting, omission rules
    theme.ts                Full/Compact Google Docs density and output colors
  clipboard/                Distinct copy actions and browser fallbacks
  storage/                  Versioned, validated localStorage schema
  App.tsx                   Library, autosave, backups, copy feedback
  styles.css                App layout and browser preview styles
e2e/                        Playwright browser tests
```

Tune output font sizes, fills, borders, and padding in `src/renderers/theme.ts`; preview CSS receives these values as custom properties. Google Docs output remains independent of browser markup and CSS. Every authored HTML value is escaped before markup is added; plain text is never derived by stripping HTML.

The UX was informed by [InkWyrd’s Daggerheart editor](https://inkwyrd.com/daggerheart/statblock.html). Its source, branding, artwork, and visual styling are not included. The provided adversary is original placeholder content; Chaos Realm is the supplied development example. No official statblocks, logos, or artwork are bundled.
