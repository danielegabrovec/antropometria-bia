import type { BivaResult } from '../engine/bia'
import {
  BIVA_PHENOTYPE_ZONES,
  bivaAxisTicks,
  bivaPlotRange
} from '../engine/bia'

export type BivaTrailPoint = {
  rH: number
  xcH: number
  current?: boolean
  date?: string
  name?: string
}

const PHENOTYPE_FILL: Record<(typeof BIVA_PHENOTYPE_ZONES)[number]['id'], string> = {
  higher_hydration_higher_cellularity: '#2dd4bf',
  lower_hydration_higher_cellularity: '#a78bfa',
  lower_hydration_lower_cellularity: '#fb7185',
  higher_hydration_lower_cellularity: '#60a5fa'
}

const ELLIPSE_FILL: Record<number, { fill: string; stroke: string }> = {
  0.5: { fill: '#10b981', stroke: '#34d399' },
  0.75: { fill: '#d97706', stroke: '#f59e0b' },
  0.95: { fill: '#e11d48', stroke: '#fb7185' }
}

export const BIVA_PLOT = {
  w: 640,
  h: 360,
  l: 56,
  r: 20,
  t: 20,
  b: 48
} as const

function axesOf(result: BivaResult) {
  const angle = result.ellipses[0]?.angleRad ?? 0
  return {
    major: { rH: Math.cos(angle), xcH: Math.sin(angle) },
    minor: { rH: -Math.sin(angle), xcH: Math.cos(angle) }
  }
}

/** SVG del piano RXc: aree = quadranti degli autovettori, non angoli del riquadro. */
export function bivaChartSvg(
  result: BivaResult,
  trail: BivaTrailPoint[] = [],
  opts?: { dark?: boolean }
): string {
  const dark = opts?.dark ?? false
  const { w, h, l, r, t, b } = BIVA_PLOT
  const domain = bivaPlotRange(result, trail)
  const x = (rH: number) => l + ((rH - domain.rMin) / Math.max(domain.rMax - domain.rMin, 1)) * (w - l - r)
  const y = (xc: number) => h - b - ((xc - domain.xMin) / Math.max(domain.xMax - domain.xMin, 1)) * (h - t - b)
  const { major, minor } = axesOf(result)
  const extent = Math.max(domain.rMax - domain.rMin, domain.xMax - domain.xMin) * 8
  const ink = dark ? '#93a0b5' : '#475569'
  const title = dark ? '#e8edf5' : '#1e293b'
  const bg = dark ? '#101826' : '#fff'
  const grid = dark ? '#1a2436' : '#f1f5f9'
  const cx = result.reference.meanRH
  const cy = result.reference.meanXcH
  const wedges = BIVA_PHENOTYPE_ZONES.map((zone) => {
    const sm = zone.hydration === 'higher' ? -1 : 1
    const sn = zone.cellularity === 'higher' ? 1 : -1
    const pts = [
      { rH: cx, xcH: cy },
      { rH: cx + major.rH * extent * sm, xcH: cy + major.xcH * extent * sm },
      {
        rH: cx + (major.rH * sm + minor.rH * sn) * extent,
        xcH: cy + (major.xcH * sm + minor.xcH * sn) * extent
      },
      { rH: cx + minor.rH * extent * sn, xcH: cy + minor.xcH * extent * sn }
    ]
    const fill = PHENOTYPE_FILL[zone.id]
    return `<polygon points="${pts.map((p) => `${x(p.rH).toFixed(1)},${y(p.xcH).toFixed(1)}`).join(' ')}" fill="${fill}" fill-opacity="${dark ? 0.16 : 0.58}"/>`
  }).join('')
  const ellipses = [...result.ellipses]
    .slice()
    .reverse()
    .map((el) => {
      const c = ELLIPSE_FILL[el.probability] ?? { fill: '#64748b', stroke: '#64748b' }
      const d =
        el.points.map((p, i) => `${i ? 'L' : 'M'}${x(p.rH).toFixed(2)},${y(p.xcH).toFixed(2)}`).join(' ') + 'Z'
      const dash = el.probability === 0.95 ? ' stroke-dasharray="6 4"' : ''
      return `<path d="${d}" fill="${c.fill}" fill-opacity="${dark ? 0.12 : 0.45}" stroke="${c.stroke}" stroke-width="${el.probability === 0.5 ? 1.8 : 1.2}"${dash}/>`
    })
    .join('')
  const axisLines = [major, minor]
    .map(
      (axis) =>
        `<line x1="${x(cx - axis.rH * extent).toFixed(1)}" y1="${y(cy - axis.xcH * extent).toFixed(1)}" x2="${x(cx + axis.rH * extent).toFixed(1)}" y2="${y(cy + axis.xcH * extent).toFixed(1)}" stroke="${ink}" stroke-width="0.8" stroke-dasharray="5 5"/>`
    )
    .join('')
  const xticks = bivaAxisTicks(domain.rMin, domain.rMax)
  const yticks = bivaAxisTicks(domain.xMin, domain.xMax, 5)
  const gridX = xticks
    .map((v) => `<line x1="${x(v)}" y1="${t}" x2="${x(v)}" y2="${h - b}" stroke="${grid}" stroke-width="0.8"/>`)
    .join('')
  const gridY = yticks
    .map((v) => `<line x1="${l}" y1="${y(v)}" x2="${w - r}" y2="${y(v)}" stroke="${grid}" stroke-width="0.8"/>`)
    .join('')
  const tickX = xticks
    .map(
      (v) =>
        `<line x1="${x(v)}" y1="${h - b}" x2="${x(v)}" y2="${h - b + 5}" stroke="${ink}"/><text x="${x(v)}" y="${h - b + 16}" text-anchor="middle" font-size="9" fill="${ink}">${v}</text>`
    )
    .join('')
  const tickY = yticks
    .map(
      (v) =>
        `<line x1="${l - 5}" y1="${y(v)}" x2="${l}" y2="${y(v)}" stroke="${ink}"/><text x="${l - 8}" y="${y(v) + 3}" text-anchor="end" font-size="9" fill="${ink}">${v}</text>`
    )
    .join('')
  const hist = trail.filter((p) => !p.current)
  const current = trail.find((p) => p.current) ?? { rH: result.rH, xcH: result.xcH, current: true }
  const pathPts = [...hist, current]
  const traj =
    pathPts.length > 1
      ? `<path d="${pathPts.map((p, i) => `${i ? 'L' : 'M'}${x(p.rH).toFixed(1)},${y(p.xcH).toFixed(1)}`).join(' ')}" fill="none" stroke="#d4a574" stroke-width="1.4" stroke-dasharray="4 3"/>`
      : ''
  const oldDots = hist
    .map(
      (p) =>
        `<circle cx="${x(p.rH).toFixed(1)}" cy="${y(p.xcH).toFixed(1)}" r="3.5" fill="#93a0b5" stroke="${bg}" stroke-width="1"/>`
    )
    .join('')
  const px = x(current.rH)
  const py = y(current.xcH)
  const vector = `<line x1="${x(cx).toFixed(1)}" y1="${y(cy).toFixed(1)}" x2="${px.toFixed(1)}" y2="${py.toFixed(1)}" stroke="#d4a574" stroke-width="1.6" stroke-dasharray="4 2"/>`
  const dot = `<circle cx="${px.toFixed(1)}" cy="${py.toFixed(1)}" r="6" fill="#d4a574" stroke="${bg}" stroke-width="2"/><text x="${px + 9}" y="${py - 7}" font-size="10" font-weight="600" fill="${title}">${result.rH.toFixed(0)}, ${result.xcH.toFixed(1)}</text>`
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" role="img" aria-label="BIA Vector con aree direzionali ed ellissi di tolleranza">
  <rect width="${w}" height="${h}" fill="${bg}"/>
  <defs><clipPath id="biva-plot"><rect x="${l}" y="${t}" width="${w - l - r}" height="${h - t - b}"/></clipPath></defs>
  ${gridX}${gridY}
  <g clip-path="url(#biva-plot)">${wedges}${ellipses}${axisLines}${traj}${vector}${oldDots}${dot}</g>
  <line x1="${l}" y1="${h - b}" x2="${w - r}" y2="${h - b}" stroke="${ink}" stroke-width="1.4"/>
  <line x1="${l}" y1="${t}" x2="${l}" y2="${h - b}" stroke="${ink}" stroke-width="1.4"/>
  ${tickX}${tickY}
  <text x="${(l + w - r) / 2}" y="${h - 8}" text-anchor="middle" font-size="11" font-weight="600" fill="${title}">R/H (Ω/m)</text>
  <text x="14" y="${(t + h - b) / 2}" text-anchor="middle" font-size="11" font-weight="600" fill="${title}" transform="rotate(-90 14 ${(t + h - b) / 2})">Xc/H (Ω/m)</text>
</svg>`
}

export function bivaLegendHtml(currentId?: (typeof BIVA_PHENOTYPE_ZONES)[number]['id']): string {
  const chips = BIVA_PHENOTYPE_ZONES.map((zone) => {
    const on = zone.id === currentId ? ' font-weight:700;' : ''
    return `<span class="legend-chip" style="${on}"><i style="background:${PHENOTYPE_FILL[zone.id]}"></i>${zone.label}</span>`
  }).join('')
  return `<div class="legend-grid">${chips}</div>
<p class="mute">Aree = quadranti degli assi principali della coorte (idratazione sull'asse maggiore, componente cellulare sul minore). Non sono diagnosi. Ellissi χ²₂: 50%, 75%, 95%.</p>`
}
