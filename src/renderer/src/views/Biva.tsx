import { assessVisit, buildBivaInterpretation, BIVA_REFERENCE_PROFILES } from '@shared/engine'
import { useApp } from '../store/useApp'
import { patientVisits } from '../lib/delta'
import { Chart, CHART_BASE } from '../components/Chart'
import { fmt } from '../lib/format'

export function Biva() {
  const patients = useApp((s) => s.patients)
  const visits = useApp((s) => s.visits)
  const pid = useApp((s) => s.selectedPatientId)
  const vid = useApp((s) => s.selectedVisitId)
  const patient = patients.find((p) => p.id === pid) ?? null
  const visit = visits.find((v) => v.id === vid) ?? null
  const assessed = patient && visit ? assessVisit(patient, visit) : null
  const biva = assessed?.bia.assessment?.biva ?? null
  const ordered = patientVisits(visits, pid)
  const trail = patient
    ? ordered
        .map((v) => {
          if (v.bia.deviceProfileId !== visit?.bia.deviceProfileId) return null
          const a = assessVisit(patient, v)
          const r = a.bia.assessment?.biva
          return r ? { date: v.date, rH: r.rH, xcH: r.xcH, current: v.id === vid } : null
        })
        .filter((x): x is { date: string; rH: number; xcH: number; current: boolean } => x != null)
    : []

  const ellipses = biva?.ellipses ?? []
  const ref = biva?.reference ?? BIVA_REFERENCE_PROFILES[0]

  return (
    <div className="wide-page">
      <div className="hair">BIVA</div>
      <h1 className="serif text-2xl mb-1">Vettore R/H × Xc/H</h1>
      <p className="text-[var(--color-mute)] mb-4">
        Solo R/Xc 50 kHz total-body. {ref ? `${ref.label}` : ''}
      </p>
      {!biva ? (
        <p className="text-[var(--color-copper)]">
          {assessed?.bia.blockedReason ?? 'Inserisci R e Xc nella visita (Misura).'}
        </p>
      ) : (
        <>
          <div className="kpi-grid mb-4" style={{ maxWidth: 720 }}>
            <div className="kpi">
              <div className="hair">R/H</div>
              <div className="val">{fmt(biva.rH, 1)}</div>
            </div>
            <div className="kpi">
              <div className="hair">Xc/H</div>
              <div className="val">{fmt(biva.xcH, 1)}</div>
            </div>
            <div className="kpi">
              <div className="hair">Zona</div>
              <div className="val text-[16px]">{biva.zone.replace(/_/g, ' ')}</div>
            </div>
            <div className="kpi">
              <div className="hair">PhA z</div>
              <div className="val">{fmt(biva.phaseAngleZ, 2)}</div>
            </div>
          </div>
          <Chart
            height={420}
            option={{
              ...CHART_BASE,
              xAxis: { name: 'R/H Ω/m', type: 'value', min: 'dataMin', splitLine: { lineStyle: { color: '#243044' } } },
              yAxis: { name: 'Xc/H Ω/m', type: 'value', min: 0, splitLine: { lineStyle: { color: '#243044' } } },
              series: [
                ...ellipses.map((el, i) => ({
                  type: 'line' as const,
                  data: el.points.map((p) => [p.rH, p.xcH]),
                  showSymbol: false,
                  lineStyle: { color: i === 0 ? '#2dd4bf' : i === 1 ? '#d4a574' : '#e8a0b0', width: 1 },
                  name: `${Math.round((el.probability ?? 0) * 100)}%`
                })),
                {
                  type: 'scatter',
                  data: trail.map((t) => [t.rH, t.xcH]),
                  itemStyle: { color: '#d4a574' },
                  symbolSize: 10
                }
              ]
            }}
          />
          <p className="mt-3 text-[13px] leading-relaxed text-[var(--color-mute)] max-w-[70ch]">
            {buildBivaInterpretation(biva, 'it')}
          </p>
        </>
      )}
    </div>
  )
}
