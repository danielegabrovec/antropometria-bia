import {
  buildBivaDistributionCurve,
  buildBivaReferenceBands,
  type BivaDistributionTone,
  type BivaReferenceBand,
  type BivaResult
} from '@shared/engine'

const TONE: Record<BivaReferenceBand['tone'], string> = {
  central: 'biva-tone-central',
  intermediate: 'biva-tone-mid',
  outside: 'biva-tone-out'
}

const DIST: Record<BivaDistributionTone, string> = {
  central: '#34d399',
  reference: '#38bdf8',
  intermediate: '#fbbf24',
  outside: '#fb7185'
}

function statusLabel(band: BivaReferenceBand) {
  if (band.id === 'ellipse') {
    if (band.value <= 50) return 'Entro 50%'
    if (band.value <= 75) return 'Tra 50–75%'
    if (band.value <= 95) return 'Tra 75–95%'
    return 'Oltre 95%'
  }
  return band.tone === 'central' ? 'Fascia centrale' : band.tone === 'intermediate' ? 'Fascia intermedia' : 'Oltre ±1,96'
}

function DistributionChart({ band }: { band: BivaReferenceBand }) {
  const curve = buildBivaDistributionCurve(band)
  const width = 520
  const height = 164
  const left = 28
  const right = 14
  const top = 24
  const bottom = 34
  const baseline = height - bottom
  const x = (value: number) => left + ((value - curve.xMin) / (curve.xMax - curve.xMin)) * (width - left - right)
  const y = (density: number) => baseline - density * (baseline - top)
  const areaPath = `M${x(curve.xMin)},${baseline} ${curve.points.map((point) => `L${x(point.x).toFixed(2)},${y(point.density).toFixed(2)}`).join(' ')} L${x(curve.xMax)},${baseline} Z`
  const linePath = curve.points
    .map((point, index) => `${index ? 'L' : 'M'}${x(point.x).toFixed(2)},${y(point.density).toFixed(2)}`)
    .join(' ')
  const markerDensity =
    curve.distribution === 'normal' ? Math.exp(-0.5 * curve.markerValue ** 2) : Math.exp(-curve.markerValue / 2)
  const clipId = `biva-dist-${band.id}`
  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full" role="img" aria-label={`${band.label}: ${band.detail}. ${curve.caption}`}>
      <defs>
        <clipPath id={clipId}>
          <path d={areaPath} />
        </clipPath>
      </defs>
      <g clipPath={`url(#${clipId})`}>
        {curve.segments.map((segment) => (
          <rect
            key={`${segment.from}-${segment.to}`}
            x={x(segment.from)}
            y={top}
            width={Math.max(0, x(segment.to) - x(segment.from))}
            height={baseline - top}
            fill={DIST[segment.tone]}
            opacity={0.55}
          />
        ))}
      </g>
      {curve.thresholds.map((threshold) => (
        <g key={threshold.value}>
          <line
            x1={x(threshold.value)}
            y1={top + 4}
            x2={x(threshold.value)}
            y2={baseline}
            stroke="#64748b"
            strokeWidth={0.8}
            strokeDasharray="4 4"
          />
          <text x={x(threshold.value)} y={top - 6} textAnchor="middle" fontSize={8.5} fill="#93a0b5">
            {threshold.label}
          </text>
        </g>
      ))}
      <path d={linePath} fill="none" stroke="#e8edf5" strokeWidth={2} />
      <line x1={left} y1={baseline} x2={width - right} y2={baseline} stroke="#64748b" strokeWidth={1} />
      {curve.ticks.map((tick) => (
        <g key={`${tick.value}-${tick.label}`}>
          <line x1={x(tick.value)} y1={baseline} x2={x(tick.value)} y2={baseline + 4} stroke="#64748b" />
          <text x={x(tick.value)} y={baseline + 15} textAnchor="middle" fontSize={8} fill="#93a0b5">
            {tick.label}
          </text>
        </g>
      ))}
      <line x1={x(curve.markerValue)} y1={top - 2} x2={x(curve.markerValue)} y2={baseline} stroke="#d4a574" strokeWidth={2} />
      <circle cx={x(curve.markerValue)} cy={y(markerDensity)} r={4.5} fill="#d4a574" stroke="#0b1220" strokeWidth={2} />
      <text x={(left + width - right) / 2} y={height - 2} textAnchor="middle" fontSize={8.5} fill="#93a0b5">
        {curve.axisLabel}
      </text>
    </svg>
  )
}

function ReferenceBand({ band }: { band: BivaReferenceBand }) {
  const curve = buildBivaDistributionCurve(band)
  return (
    <article className="biva-band">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-[12px] font-semibold">{band.label}</p>
          <p className="text-[11px] text-[var(--color-mute)]">{band.detail}</p>
        </div>
        <span className={`biva-tone ${TONE[band.tone]}`}>{statusLabel(band)}</span>
      </div>
      <DistributionChart band={band} />
      <div className="mt-1 flex justify-between gap-3 text-[10px] text-[var(--color-mute)]">
        <span>{band.lowLabel}</span>
        <span className="text-right">{band.highLabel}</span>
      </div>
      <p className="mt-1 text-[10px] leading-relaxed text-[var(--color-mute)]">{curve.caption}</p>
    </article>
  )
}

export function BivaBands({ result }: { result: BivaResult }) {
  const bands = buildBivaReferenceBands(result)
  return (
    <section className="mt-6" aria-labelledby="biva-bands-title">
      <div className="flex flex-wrap items-end justify-between gap-2 mb-2">
        <div>
          <p id="biva-bands-title" className="hair">
            Distribuzioni e indici di normalità
          </p>
          <p className="text-[12px] text-[var(--color-mute)]">
            Stessa coorte e matrice di covarianza del BIA Vector. Distanza vettoriale: χ² a 2 g.d.l. (50 / 75 / 95%). Score z:
            Normale ±1 / ±1,96.
          </p>
        </div>
      </div>
      <div className="biva-bands-grid">
        {bands.map((band) => (
          <ReferenceBand key={band.id} band={band} />
        ))}
      </div>
    </section>
  )
}
