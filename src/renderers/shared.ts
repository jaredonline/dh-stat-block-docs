import type { Adversary, AdversaryFeature, EnvironmentFeature, Experience } from '../types/daggerheart'

export function hasText(value: string): boolean {
  return value.trim().length > 0
}

export function normalizeText(value: string): string {
  return value.replace(/\r\n?/g, '\n').trim()
}

export function displayName(value: string): string {
  return normalizeText(value) || 'Untitled'
}

// Escape before adding markup. No authored value may become an HTML attribute or tag.
export function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, character => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[character]!)
}

export function htmlText(value: string): string {
  return escapeHtml(normalizeText(value)).replace(/\n/g, '<br>')
}

export function markdownText(value: string): string {
  return normalizeText(value)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/[\\`*_{}[\]()!|~]/g, '\\$&')
    .replace(/^([ \t]*)([#=])/gm, '$1\\$2')
    .replace(/^([ \t]*)([+\-])(?=\s|\-|$)/gm, '$1\\$2')
    .replace(/^([ \t]*\d+)\.(?=\s|$)/gm, '$1\\.')
    .replace(/([^\n])\n(?=[^\n])/g, '$1  \n')
}

export function markdownItalic(value: string): string {
  return normalizeText(value).split(/\n[ \t]*\n/).map(paragraph => `*${markdownText(paragraph)}*`).join('\n\n')
}

export function visibleEnvironmentFeatures(features: EnvironmentFeature[]): EnvironmentFeature[] {
  return features.filter(feature => [feature.name, feature.text, feature.questions].some(hasText))
}

export function visibleAdversaryFeatures(features: AdversaryFeature[]): AdversaryFeature[] {
  return features.filter(feature => [feature.name, feature.text].some(hasText))
}

export function visibleExperiences(experiences: Experience[]): Experience[] {
  return experiences.filter(experience => [experience.name, experience.modifier].some(hasText))
}

export function experienceText(experience: Experience): string {
  return [normalizeText(experience.name), normalizeText(experience.modifier)].filter(Boolean).join(' ')
}

export function thresholdText(block: Adversary): string {
  return [
    hasText(block.thresholds.major) ? `Major ${normalizeText(block.thresholds.major)}` : '',
    hasText(block.thresholds.severe) ? `Severe ${normalizeText(block.thresholds.severe)}` : '',
  ].filter(Boolean).join(' / ')
}

export function adversaryStats(block: Adversary): [string, string][] {
  return [
    ['Difficulty', block.difficulty], ['Thresholds', thresholdText(block)],
    ['HP', block.hp], ['Stress', block.stress], ['ATK', block.attackModifier],
  ].filter(([, value]) => hasText(value)) as [string, string][]
}

export function hasStandardAttack(block: Adversary): boolean {
  const { name, range, damage } = block.standardAttack
  return [name, range, damage].some(hasText)
}
