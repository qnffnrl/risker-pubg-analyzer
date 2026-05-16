/** Clamp a value to [0, max], then scale to [0, 100] */
export function clampScore(value: number, max: number): number {
  if (max <= 0) return 0
  return Math.min(100, (Math.max(0, value) / max) * 100)
}

/** Weighted sum of [score, weight] pairs → 0~100 */
export function weightedScore(pairs: [number, number][]): number {
  const totalWeight = pairs.reduce((s, [, w]) => s + w, 0)
  if (totalWeight === 0) return 0
  return pairs.reduce((s, [score, w]) => s + score * (w / totalWeight), 0)
}

export function avg(values: number[]): number {
  if (values.length === 0) return 0
  return values.reduce((s, v) => s + v, 0) / values.length
}

export function rate(numerator: number, denominator: number): number {
  if (denominator === 0) return 0
  return numerator / denominator
}
