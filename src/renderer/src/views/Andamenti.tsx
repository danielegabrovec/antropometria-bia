import { assessVisit, slopePerWeek } from '@shared/engine'
import { MEASURES } from '@shared/catalog/measures'
import { useApp } from '../store/useApp'
import { patientVisits, referenceVisit } from '../lib/delta'
import { Chart, CHART_BASE } from '../components/Chart'
import { fmt, fmtDelta } from '../lib/format'

const SERIES = [
  { id: 'peso', label: 'Peso', unit: 'kg', pick: (v: ReturnType<typeof assessVisit>, visitW: number | null) => visitW },
  { id: 'fmPliche', label: 'FM% pliche', unit: '%', pick: (v: ReturnType<typeof assessVisit>) => v.anthro.pliche?.fmPct ?? null },
  { id: 'fmBia', label: 'FM% BIA', unit: '%', pick: (v: ReturnType<typeof assessVisit>) => v.bia.assessment?.metrics.fmPercent?.value ?? null },
  { id: 'ffmBia', label: 'FFM BIA', unit: 'kg', pick: (v: ReturnType<typeof assessVisit>) => v.bia.assessment?.metrics.ffm?.value ?? null },
  { id: 'pha', label: 'Phase angle', unit: '°', pick: (v: ReturnType<typeof assessVisit>) => v.bia.signal?.phaseAngleDeg ?? null },
  { id: 'tbw', label: 'TBW', unit: 'L', pick: (v: ReturnType<typeof assessVisit>) => v.bia.assessment?.metrics.tbw?.value ?? null },
  { id: 'whr', label: 'WHR', unit: '', pick: (v: ReturnType<typeof assessVisit>) => v.anthro.whr }
] as const

export function Andamenti() {
  const patients = useApp((s) => s.patients)
  const visits = useApp((s) => s.visits)
  const pid = useApp((s) => s.selectedPatientId)
  const vid = useApp((s) => s.selectedVisitId)
  const deltaMode = useApp((s) => s.settings.deltaMode)
  const setDelta = useApp((s) => s.setDelta)
  const patient = patients.find((p) => p.id === pid) ?? null
  const ordered = patientVisits(visits, pid)
  const current = ordered.find((v) => v.id === vid) ?? ordered[ordered.length - 1] ?? null
  const ref = referenceVisit(ordered, current?.id ?? null, deltaMode)

  const rows = ordered.map((v) => ({
    visit: v,
    a: patient ? assessVisit(patient, v) : null
  }))

  const pesoPts = rows
    .filter((r) => r.visit.weightKg != null)
    .map((r) => ({ t: new Date(r.visit.date).getTime(), y: r.visit.weightKg as number }))
  const slope = slopePerWeek(pesoPts)

  const pivotKeys = ['peso', ...MEASURES.filter((m) => m.category !== 'diametri').slice(0, 10).map((m) => m.key)]

  return (
    <div className="wide-page">
      <div className="hair">Andamenti</div>
      <h1 className="serif text-2xl mb-2">Explorer e pivot</h1>
      {ordered.length === 0 ? (
        <p className="text-[var(--color-mute)]">Nessuna visita su questo profilo.</p>
      ) : (
        <>
          {ordered.length === 1 ? (
            <p className="panel mb-3 text-[13px]">Prima rilevazione · {ordered[0].date}. Tabella e grafico restano visibili.</p>
          ) : null}
          <div className="flex gap-2 mb-3">
            <button className={`chip ${deltaMode === 'precedente' ? 'on' : ''}`} onClick={() => setDelta('precedente')}>
              vs precedente
            </button>
            <button className={`chip ${deltaMode === 'prima' ? 'on' : ''}`} onClick={() => setDelta('prima')}>
              vs prima visita {ref ? `(${ref.date})` : ''}
            </button>
            {slope != null ? (
              <span className="text-[12px] text-[var(--color-mute)] self-center">
                Pendenza peso {fmt(slope, 2)} kg/settimana
              </span>
            ) : null}
          </div>
          <Chart
            height={300}
            option={{
              ...CHART_BASE,
              legend: { textStyle: { color: '#93a0b5' }, top: 0 },
              xAxis: { type: 'category', data: ordered.map((v) => v.date) },
              yAxis: { type: 'value', splitLine: { lineStyle: { color: '#243044' } } },
              series: SERIES.map((s, i) => ({
                name: s.label,
                type: 'line',
                showSymbol: true,
                data: rows.map((r) => (r.a ? s.pick(r.a, r.visit.weightKg) : null)),
                lineStyle: { color: ['#d4a574', '#e8a0b0', '#2dd4bf', '#a78bfa', '#93a0b5', '#60a5fa', '#fbbf24'][i] }
              }))
            }}
          />
          <div className="panel mt-4 overflow-auto">
            <table className="data">
              <thead>
                <tr>
                  <th>Misura</th>
                  {ordered.map((v) => (
                    <th key={v.id}>{v.date}</th>
                  ))}
                  <th>Δ</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Peso kg</td>
                  {ordered.map((v) => (
                    <td key={v.id} className="num">
                      {fmt(v.weightKg)}
                    </td>
                  ))}
                  <td className="num">
                    {current && ref && current.weightKg != null && ref.weightKg != null
                      ? fmtDelta(current.weightKg - ref.weightKg)
                      : '—'}
                  </td>
                </tr>
                {pivotKeys.slice(1).map((key) => {
                  const def = MEASURES.find((m) => m.key === key)
                  if (!def) return null
                  const cur = current?.measures[key]
                  const rv = ref?.measures[key]
                  return (
                    <tr key={key}>
                      <td>
                        {def.label} {def.unit}
                      </td>
                      {ordered.map((v) => (
                        <td key={v.id} className="num">
                          {fmt(v.measures[key])}
                        </td>
                      ))}
                      <td className="num">{cur != null && rv != null ? fmtDelta(cur - rv) : '—'}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}
