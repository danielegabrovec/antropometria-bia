export interface SeriesPoint {
  t: number
  y: number
}

/** Pendenza lineare (unità / settimana) su punti ordinati nel tempo. */
export function slopePerWeek(points: SeriesPoint[]): number | null {
  if (points.length < 2) return null
  const xs = points.map((p) => p.t / (7 * 24 * 3600 * 1000))
  const ys = points.map((p) => p.y)
  const n = xs.length
  const meanX = xs.reduce((a, b) => a + b, 0) / n
  const meanY = ys.reduce((a, b) => a + b, 0) / n
  let num = 0
  let den = 0
  for (let i = 0; i < n; i++) {
    num += (xs[i] - meanX) * (ys[i] - meanY)
    den += (xs[i] - meanX) ** 2
  }
  if (den === 0) return null
  return num / den
}

export interface BlandAltmanPoint {
  mean: number
  diff: number
}

export function blandAltman(
  pairs: Array<{ a: number; b: number }>
): { points: BlandAltmanPoint[]; bias: number; loaLow: number; loaHigh: number } | null {
  if (pairs.length < 2) return null
  const points = pairs.map((p) => ({ mean: (p.a + p.b) / 2, diff: p.a - p.b }))
  const bias = points.reduce((s, p) => s + p.diff, 0) / points.length
  const variance = points.reduce((s, p) => s + (p.diff - bias) ** 2, 0) / (points.length - 1)
  const sd = Math.sqrt(variance)
  return { points, bias, loaLow: bias - 1.96 * sd, loaHigh: bias + 1.96 * sd }
}

export function personalBand(values: number[]): { mean: number; low: number; high: number } | null {
  if (values.length < 3) return null
  const mean = values.reduce((a, b) => a + b, 0) / values.length
  const sd = Math.sqrt(values.reduce((s, v) => s + (v - mean) ** 2, 0) / (values.length - 1))
  return { mean, low: mean - sd, high: mean + sd }
}
