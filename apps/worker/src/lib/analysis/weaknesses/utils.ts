export function stdDev(arr: number[]): number {
  if (arr.length === 0) return 0
  const mean = arr.reduce((s, v) => s + v, 0) / arr.length
  return Math.sqrt(arr.reduce((s, v) => s + (v - mean) ** 2, 0) / arr.length)
}

export function clamp01(v: number): number {
  return Math.max(0, Math.min(1, v))
}
