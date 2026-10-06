import type { GoogleDocsDensity } from '../renderers/theme'

export const GOOGLE_DOCS_DENSITY_KEY = 'daggerheart-statblocks.google-docs-density.v1'

export function loadGoogleDocsDensity(): GoogleDocsDensity {
  try {
    return localStorage.getItem(GOOGLE_DOCS_DENSITY_KEY) === 'full' ? 'full' : 'compact'
  } catch {
    return 'compact'
  }
}

export function saveGoogleDocsDensity(density: GoogleDocsDensity): void {
  try {
    localStorage.setItem(GOOGLE_DOCS_DENSITY_KEY, density)
  } catch {
    // Density is a convenience preference; clipboard export still works.
  }
}
