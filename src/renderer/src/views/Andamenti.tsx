import { assessVisit, slopePerWeek } from '@shared/engine'
import { MEASURES } from '@shared/catalog/measures'
import { doctorLabel } from '@shared/library'
import { useApp } from '../store/useApp'
import { patientVisits, referenceVisit, patientLabel } from '../lib/delta'
import { Chart, CHART_BASE } from '../components/Chart'
import { VisitContext } from '../components/VisitContext'
import { fmt, fmtDelta } from '../lib/format'

type Assessed = ReturnType<typeof assessVisit>

const MASSA_KG = [
  { id: 'peso', label: 'Peso', pick: (_a: Assessed, w: number | null) => w },
  { id: 'ffmPliche', label: 'FFM pliche', pick: (a: Assessed) => a.anthro.pliche?.ffmKg ?? null },
  { id: 'ffmBia', label: 'FFM BIA', pick: (a: Assessed) => a.bia.assessment?.metrics.ffm?.value ?? null }
] as const

const MASSA_PCT = [
  { id: 'fmPliche', label: 'FM% pliche', pick: (a: Assessed) => a.anthro.pliche?.fmPct ?? null },
  { id: 'fmBia', label: 'FM% BIA', pick: (a: Assessed) => a.bia.assessment?.metrics.fmPercent?.value ?? null }
] as const

const BMI_SERIES = [
  { id: 'bmi', label: 'BMI', pick: (a: Assessed) => a.anthro.bmi }
] as const

const ENERGIA = [
  { id: 'bmr', label: 'BMR', pick: (a: Assessed) => a.energy.bmr },
  { id: 'tdee', label: 'TDEE', pick: (a: Assessed) => a.energy.tdee }
] as const

const WATER_SERIES = [
  { id: 'tbw', label: 'TBW', pick: (a: Assessed) => a.bia.assessment?.metrics.tbw?.value ?? null },
  { id: 'ecw', label: 'ECW', pick: (a: Assessed) => a.bia.assessment?.metrics.ecw?.value ?? null },
  { id: 'icw', label: 'ICW', pick: (a: Assessed) => a.bia.assessment?.metrics.icw?.value ?? null }
] as const

const PHASE_SERIES = [{ id: 'pha', label: 'Angolo di fase', pick: (a: Assessed) => a.bia.signal?.phaseAngleDeg ?? null }] as const
const SMI_SERIES = [{ id: 'smi', label: 'SMI', pick: (a: Assessed) => a.bia.assessment?.metrics.skeletalMuscleIndex?.value ?? null }] as const
const WHR_SERIES = [{ id: 'whr', label: 'WHR', pick: (a: Assessed) => a.anthro.whr }] as const

const COLORS = ['#d4a574', '#e8a0b0', '#2dd4bf', '#a78bfa', '#93a0b5', '#60a5fa', '#fbbf24', '#f87171']

function seriesOption(
  defs: ReadonlyArray<{ id: string; label: string; pick: (a: Assessed, w: number | null) => number | null }>,
  rows: Array<{ visit: { weightKg: number | null }; a: Assessed | null }>
) {
  return defs.map((s, i) => ({
    name: s.label,
    type: 'line' as const,
    showSymbol: true,
    data: rows.map((r) => (r.a ? s.pick(r.a, r.visit.weightKg) : null)),
    lineStyle: { color: COLORS[i % COLORS.length] }
  }))
}

function trendOption(
  defs: ReadonlyArray<{ id: string; label: string; pick: (a: Assessed, w: number | null) => number | null }>,
  rows: Array<{ visit: { weightKg: number | null }; a: Assessed | null }>,
  dates: string[],
  unit: string
) {
  return {
    ...CHART_BASE,
    legend: { textStyle: { color: '#93a0b5' }, top: 0 },
    grid: { left: 52, right: 18, top: 42, bottom: 34 },
    tooltip: { trigger: 'axis', valueFormatter: (value: unknown) => `${value ?? '—'}${unit ? ` ${unit}` : ''}` },
    xAxis: { type: 'category' as const, data: dates },
    yAxis: { type: 'value' as const, name: unit, nameTextStyle: { color: '#93a0b5' }, splitLine: { lineStyle: { color: '#243044' } } },
    series: seriesOption(defs, rows)
  }
}

export function Andamenti() {
  const patients = useApp((s) => s.patients)
  const visits = useApp((s) => s.visits)
  const pid = useApp((s) => s.selectedPatientId)
  const vid = useApp((s) => s.selectedVisitId)
  const deltaMode = useApp((s) => s.settings.deltaMode)
  const setDelta = useApp((s) => s.setDelta)
  const selectVisit = useApp((s) => s.selectVisit)
  const doctors = useApp((s) => s.doctors)
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

  const derived: Array<{ label: string; unit: string; pick: (r: (typeof rows)[number]) => number | null }> = [
    { label: 'Peso', unit: 'kg', pick: (r) => r.visit.weightKg },
    { label: 'BMI', unit: '', pick: (r) => r.a?.anthro.bmi ?? null },
    { label: 'FM% pliche', unit: '%', pick: (r) => r.a?.anthro.pliche?.fmPct ?? null },
    { label: 'FM% BIA', unit: '%', pick: (r) => r.a?.bia.assessment?.metrics.fmPercent?.value ?? null },
    { label: 'FFM pliche', unit: 'kg', pick: (r) => r.a?.anthro.pliche?.ffmKg ?? null },
    { label: 'FFM BIA', unit: 'kg', pick: (r) => r.a?.bia.assessment?.metrics.ffm?.value ?? null },
    { label: 'BMR', unit: 'kcal', pick: (r) => r.a?.energy.bmr ?? null },
    { label: 'TDEE', unit: 'kcal', pick: (r) => r.a?.energy.tdee ?? null },
    { label: 'PhA', unit: '°', pick: (r) => r.a?.bia.signal?.phaseAngleDeg ?? null },
    { label: 'TBW', unit: 'L', pick: (r) => r.a?.bia.assessment?.metrics.tbw?.value ?? null },
    { label: 'WHR', unit: '', pick: (r) => r.a?.anthro.whr ?? null }
  ]

  function deltaCell(cur: number | null, prev: number | null) {
    if (cur == null || prev == null) return '—'
    return fmtDelta(cur - prev)
  }

  return (
    <div className="wide-page">
      <div className="hair">Andamenti</div>
      <h1 className="serif text-2xl mb-2">Andamenti · {patientLabel(patient)}</h1>
      <VisitContext />
      {!patient ? (
        <div className="panel mt-3">Seleziona un paziente da Pazienti o da Misura. I grafici restano per persona, nella cartella aperta.</div>
      ) : ordered.length === 0 ? (
        <p className="text-[var(--color-mute)] mt-3">Nessuna visita su questo paziente.</p>
      ) : (
        <>
          {ordered.length === 1 ? (
            <p className="panel mb-3 mt-3 text-[13px]">Prima rilevazione · {ordered[0].date}. Tabella e grafico restano visibili.</p>
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
          <h2 className="serif text-lg mb-2">Composizione</h2>
          <div className="trend-grid">
            <div className="panel"><div className="hair mb-2">Massa · kg</div><Chart height={230} option={trendOption(MASSA_KG, rows, ordered.map((v) => v.date), 'kg')} /></div>
            <div className="panel"><div className="hair mb-2">Massa grassa · %</div><Chart height={230} option={trendOption(MASSA_PCT, rows, ordered.map((v) => v.date), '%')} /></div>
            <div className="panel"><div className="hair mb-2">BMI · kg/m²</div><Chart height={230} option={trendOption(BMI_SERIES, rows, ordered.map((v) => v.date), 'kg/m²')} /></div>
          </div>
          <h2 className="serif text-lg mt-4 mb-2">Dispendio</h2>
          <Chart
            height={240}
            option={{
              ...CHART_BASE,
              ...trendOption(ENERGIA, rows, ordered.map((v) => v.date), 'kcal/die')
            }}
          />
          <h2 className="serif text-lg mt-4 mb-2">BIA e proporzioni</h2>
          <div className="trend-grid">
            <div className="panel"><div className="hair mb-2">Compartimenti idrici · L</div><Chart height={230} option={trendOption(WATER_SERIES, rows, ordered.map((v) => v.date), 'L')} /></div>
            <div className="panel"><div className="hair mb-2">Angolo di fase · °</div><Chart height={230} option={trendOption(PHASE_SERIES, rows, ordered.map((v) => v.date), '°')} /></div>
            <div className="panel"><div className="hair mb-2">SMI · kg/m²</div><Chart height={230} option={trendOption(SMI_SERIES, rows, ordered.map((v) => v.date), 'kg/m²')} /></div>
            <div className="panel"><div className="hair mb-2">WHR · rapporto</div><Chart height={230} option={trendOption(WHR_SERIES, rows, ordered.map((v) => v.date), '')} /></div>
          </div>
          <div className="panel mt-4 overflow-auto">
            <table className="data">
              <thead>
                <tr>
                  <th>Misura</th>
                  {ordered.map((v) => {
                    const op = doctors.find((d) => d.id === v.operatorDoctorId)
                    return (
                      <th key={v.id} title={doctorLabel(op ?? null)}>
                        <button
                          type="button"
                          className={`chip ${v.id === vid ? 'on' : ''}`}
                          onClick={() => selectVisit(v.id)}
                        >
                          {v.date}
                        </button>
                      </th>
                    )
                  })}
                  <th>Δ</th>
                </tr>
              </thead>
              <tbody>
                {derived.map((row) => {
                  const cur = current ? row.pick(rows.find((r) => r.visit.id === current.id)!) : null
                  const rv = ref ? row.pick(rows.find((r) => r.visit.id === ref.id)!) : null
                  return (
                    <tr key={row.label}>
                      <td>
                        {row.label} {row.unit}
                      </td>
                      {rows.map((r) => (
                        <td key={r.visit.id} className="num">
                          {fmt(row.pick(r), row.label === 'BMR' || row.label === 'TDEE' ? 0 : 1)}
                        </td>
                      ))}
                      <td className="num">{deltaCell(cur, rv)}</td>
                    </tr>
                  )
                })}
                {MEASURES.map((def) => {
                  const cur = current?.measures[def.key] ?? null
                  const rv = ref?.measures[def.key] ?? null
                  return (
                    <tr key={def.key}>
                      <td>
                        {def.label} {def.unit}
                      </td>
                      {ordered.map((v) => (
                        <td key={v.id} className="num">
                          {fmt(v.measures[def.key])}
                        </td>
                      ))}
                      <td className="num">{deltaCell(cur, rv)}</td>
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
