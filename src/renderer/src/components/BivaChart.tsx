import { useId } from 'react'
import {
  BIVA_PHENOTYPE_ZONES,
  BIVA_ZONE_LABELS,
  bivaAxisTicks,
  bivaPlotRange,
  type BivaResult
} from '@shared/engine'
import { fmt } from '../lib/format'

export type BivaChartPoint = {
  rH: number
  xcH: number
  current?: boolean
  date?: string
  name?: string
  zone?: BivaResult['zone']
  phenotypeLabel?: string
  d2?: number
}

const FILL: Record<(typeof BIVA_PHENOTYPE_ZONES)[number]['id'], string> = {
  higher_hydration_higher_cellularity: '#2dd4bf',
  lower_hydration_higher_cellularity: '#a78bfa',
  lower_hydration_lower_cellularity: '#fb7185',
  higher_hydration_lower_cellularity: '#60a5fa'
}

const ELLIPSE = {
  0.5: { fill: '#10b981', stroke: '#34d399' },
  0.75: { fill: '#d97706', stroke: '#f59e0b' },
  0.95: { fill: '#e11d48', stroke: '#fb7185' }
} as const

export function BivaPlot({
  result,
  trail
}: {
  result: BivaResult
  trail: BivaChartPoint[]
}) {
  const clipId = useId().replace(/:/g, '')
  const w = 640
  const h = 360
  const L = 56
  const R = 20
  const T = 20
  const B = 48
  const domain = bivaPlotRange(result, trail)
  const x = (rH: number) => L + ((rH - domain.rMin) / Math.max(domain.rMax - domain.rMin, 1)) * (w - L - R)
  const y = (xc: number) => h - B - ((xc - domain.xMin) / Math.max(domain.xMax - domain.xMin, 1)) * (h - T - B)
  const angle = result.ellipses[0]?.angleRad ?? 0
  const major = { rH: Math.cos(angle), xcH: Math.sin(angle) }
  const minor = { rH: -Math.sin(angle), xcH: Math.cos(angle) }
  const extent = Math.max(domain.rMax - domain.rMin, domain.xMax - domain.xMin) * 8
  const cx = result.reference.meanRH
  const cy = result.reference.meanXcH
  const xticks = bivaAxisTicks(domain.rMin, domain.rMax)
  const yticks = bivaAxisTicks(domain.xMin, domain.xMax, 5)
  const hist = trail.filter((p) => !p.current)
  const current = trail.find((p) => p.current) ?? { rH: result.rH, xcH: result.xcH, current: true }
  const pathPts = [...hist, current]

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="biva-plot" role="img" aria-label="BIA Vector con aree direzionali ed ellissi di tolleranza">
      <defs>
        <clipPath id={`biva-${clipId}`}>
          <rect x={L} y={T} width={w - L - R} height={h - T - B} />
        </clipPath>
      </defs>
      {xticks.map((v) => (
        <line key={`gx${v}`} x1={x(v)} y1={T} x2={x(v)} y2={h - B} stroke="#1a2436" strokeWidth={0.8} />
      ))}
      {yticks.map((v) => (
        <line key={`gy${v}`} x1={L} y1={y(v)} x2={w - R} y2={y(v)} stroke="#1a2436" strokeWidth={0.8} />
      ))}
      <g clipPath={`url(#biva-${clipId})`}>
        {BIVA_PHENOTYPE_ZONES.map((zone) => {
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
          return (
            <polygon
              key={zone.id}
              points={pts.map((p) => `${x(p.rH)},${y(p.xcH)}`).join(' ')}
              fill={FILL[zone.id]}
              opacity={0.18}
            />
          )
        })}
        {[...result.ellipses].reverse().map((el) => {
          const c = ELLIPSE[el.probability as keyof typeof ELLIPSE] ?? { fill: '#64748b', stroke: '#64748b' }
          const d = el.points.map((p, i) => `${i ? 'L' : 'M'}${x(p.rH)},${y(p.xcH)}`).join(' ') + 'Z'
          return (
            <path
              key={el.probability}
              d={d}
              fill={c.fill}
              fillOpacity={0.14}
              stroke={c.stroke}
              strokeWidth={el.probability === 0.5 ? 1.8 : 1.2}
              strokeDasharray={el.probability === 0.95 ? '6 4' : undefined}
            />
          )
        })}
        {[major, minor].map((axis, i) => (
          <line
            key={i}
            x1={x(cx - axis.rH * extent)}
            y1={y(cy - axis.xcH * extent)}
            x2={x(cx + axis.rH * extent)}
            y2={y(cy + axis.xcH * extent)}
            stroke="#93a0b5"
            strokeWidth={0.8}
            strokeDasharray="5 5"
          />
        ))}
        {pathPts.length > 1 ? (
          <path
            d={pathPts.map((p, i) => `${i ? 'L' : 'M'}${x(p.rH)},${y(p.xcH)}`).join(' ')}
            fill="none"
            stroke="#d4a574"
            strokeWidth={1.4}
            strokeDasharray="4 3"
          />
        ) : null}
        <line
          x1={x(cx)}
          y1={y(cy)}
          x2={x(current.rH)}
          y2={y(current.xcH)}
          stroke="#d4a574"
          strokeWidth={1.6}
          strokeDasharray="4 2"
        />
        {hist.map((p, i) => (
          <circle key={`h${i}`} cx={x(p.rH)} cy={y(p.xcH)} r={3.5} fill="#93a0b5" stroke="#101826" strokeWidth={1} />
        ))}
        <circle cx={x(current.rH)} cy={y(current.xcH)} r={6} fill="#d4a574" stroke="#0b1220" strokeWidth={2} />
        <text x={x(current.rH) + 9} y={y(current.xcH) - 7} fill="#e8edf5" fontSize={10} fontWeight={600}>
          {fmt(result.rH, 0)}, {fmt(result.xcH, 1)}
        </text>
      </g>
      <line x1={L} y1={h - B} x2={w - R} y2={h - B} stroke="#93a0b5" strokeWidth={1.4} />
      <line x1={L} y1={T} x2={L} y2={h - B} stroke="#93a0b5" strokeWidth={1.4} />
      {xticks.map((v) => (
        <g key={`tx${v}`}>
          <line x1={x(v)} y1={h - B} x2={x(v)} y2={h - B + 5} stroke="#93a0b5" />
          <text x={x(v)} y={h - B + 16} textAnchor="middle" fill="#93a0b5" fontSize={9}>
            {v}
          </text>
        </g>
      ))}
      {yticks.map((v) => (
        <g key={`ty${v}`}>
          <line x1={L - 5} y1={y(v)} x2={L} y2={y(v)} stroke="#93a0b5" />
          <text x={L - 8} y={y(v) + 3} textAnchor="end" fill="#93a0b5" fontSize={9}>
            {v}
          </text>
        </g>
      ))}
      <text x={(L + w - R) / 2} y={h - 8} textAnchor="middle" fill="#e8edf5" fontSize={11} fontWeight={600}>
        R/H (Ω/m)
      </text>
      <text
        x={14}
        y={(T + h - B) / 2}
        textAnchor="middle"
        fill="#e8edf5"
        fontSize={11}
        fontWeight={600}
        transform={`rotate(-90 14 ${(T + h - B) / 2})`}
      >
        Xc/H (Ω/m)
      </text>
    </svg>
  )
}

export function BivaLegend({ currentId }: { currentId?: (typeof BIVA_PHENOTYPE_ZONES)[number]['id'] }) {
  return (
    <div className="biva-legend" aria-label="Legenda aree BIVA">
      {BIVA_PHENOTYPE_ZONES.map((zone) => (
        <div key={zone.id} className={`biva-legend-item ${zone.id === currentId ? 'on' : ''}`}>
          <span className="biva-swatch" style={{ background: FILL[zone.id] }} />
          <span>
            {zone.label}
            {zone.id === currentId ? ' · punto attuale' : ''}
          </span>
        </div>
      ))}
    </div>
  )
}

export function BivaVisitTable({ trail }: { trail: BivaChartPoint[] }) {
  if (trail.length === 0) return null
  return (
    <div className="panel overflow-auto mt-3">
      <table className="data">
        <thead>
          <tr>
            <th>Visita</th>
            <th>R/H</th>
            <th>Xc/H</th>
            <th>Area direzionale</th>
            <th>Ellisse</th>
          </tr>
        </thead>
        <tbody>
          {trail.map((p, i) => (
            <tr key={`${p.date ?? i}-${i}`} className={p.current ? 'sel' : undefined}>
              <td>
                {p.date ?? '—'}
                {p.name ? ` · ${p.name}` : ''}
                {p.current ? ' · in esame' : ''}
              </td>
              <td className="num">{fmt(p.rH, 1)} Ω/m</td>
              <td className="num">{fmt(p.xcH, 1)} Ω/m</td>
              <td>{p.phenotypeLabel ?? '—'}</td>
              <td>
                {p.zone ? BIVA_ZONE_LABELS[p.zone] : '—'}
                {p.d2 != null ? ` · d² ${fmt(p.d2, 2)}` : ''}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
