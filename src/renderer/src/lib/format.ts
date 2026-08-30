export function fmt(n: number | null | undefined, d = 1): string {
  if (n == null || !Number.isFinite(n)) return '—'
  return n.toLocaleString('it-IT', { minimumFractionDigits: d, maximumFractionDigits: d })
}

export function fmtDelta(n: number | null | undefined, d = 1): string {
  if (n == null || !Number.isFinite(n)) return '—'
  const sign = n > 0 ? '+' : ''
  return sign + fmt(n, d)
}

export function parseIt(raw: string): number | null {
  const t = raw.trim().replace(',', '.')
  if (!t) return null
  const n = Number(t)
  return Number.isFinite(n) ? n : null
}
