// Map similarity score (0-1) to a color from red (low) to green (high)
export function similarityToColor(similarity: number): string {
  const clamped = Math.max(0, Math.min(1, similarity))
  const r = Math.round(232 - clamped * 155) // 232 -> 77
  const g = Math.round(84 + clamped * 132)  // 84 -> 216
  const b = Math.round(84 + clamped * 54)   // 84 -> 138
  return `rgb(${r},${g},${b})`
}

// Distinct colors for document spheres
export const DOC_COLORS = [
  '#4da6e8', // blue
  '#4dd88a', // green
  '#a87ce8', // purple
  '#e85454', // red
  '#e8a034', // amber
  '#4de8d8', // cyan
  '#e84da6', // pink
]

export function getDocColor(index: number): string {
  return DOC_COLORS[index % DOC_COLORS.length]
}

export const QUERY_COLOR = '#ffd700' // gold
