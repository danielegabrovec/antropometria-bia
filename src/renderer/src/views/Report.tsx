import { assessVisit } from '@shared/engine'
import { APP_NAME, APP_VERSION, COPYRIGHT_NOTICE, DISCLAIMER } from '@shared/catalog/about'
import { MEASURES } from '@shared/catalog/measures'
import { doctorLabel } from '@shared/library'
import { fmt, fmtDelta } from '../lib/format'
import { useApp, currentDoctor } from '../store/useApp'
import { patientVisits, referenceVisit, patientLabel } from '../lib/delta'
import { KpiCard } from '../components/KpiCard'
import {
  buildVisitReportHtml,
  exportVisitHtml,
  exportVisitJson,
  exportVisitPdf,
  printVisitHtml
} from '../lib/io'

export function Report() {
  const patients = useApp((s) => s.patients)
  const visits = useApp((s) => s.visits)
  const pid = useApp((s) => s.selectedPatientId)
  const vid = useApp((s) => s.selectedVisitId)
  const studio = useApp((s) => s.settings.studio)
  const deltaMode = useApp((s) => s.settings.deltaMode)
  const workspace = useApp((s) => s.workspace)
  const patient = patients.find((p) => p.id === pid) ?? null
  const visit = visits.find((v) => v.id === vid) ?? null
  const doctor = currentDoctor()
  const ordered = patientVisits(visits, pid)
  const ref = referenceVisit(ordered, vid, deltaMode)
  const a = patient && visit ? assessVisit(patient, visit) : null

  function html() {
    return buildVisitReportHtml(
      workspace,
      doctor,
      patient,
      visit,
      [
        { label: 'FM% pliche', value: fmt(a?.anthro.pliche?.fmPct) },
        { label: 'FFM kg', value: fmt(a?.anthro.pliche?.ffmKg) },
        { label: 'BMI', value: fmt(a?.anthro.bmi) },
        { label: 'PhA', value: fmt(a?.bia.signal?.phaseAngleDeg) },
        { label: 'FM% BIA', value: fmt(a?.bia.assessment?.metrics.fmPercent?.value) },
        { label: 'TBW L', value: fmt(a?.bia.assessment?.metrics.tbw?.value) }
      ],
      MEASURES.filter((m) => visit && visit.measures[m.key] != null).map((m) => {
        const cur = visit?.measures[m.key]
        const prev = ref?.measures[m.key]
        return {
          label: `${m.label} ${m.unit}`,
          value: fmt(cur),
          delta: cur != null && prev != null ? fmtDelta(cur - prev) : '—'
        }
      })
    )
  }

  const fileBase = `report-${patientLabel(patient).replace(/\s+/g, '-')}-${visit?.date ?? ''}`

  return (
    <div className="wide-page">
      <div className="flex flex-wrap gap-2 mb-4 no-print">
        <button className="primary" onClick={() => void exportVisitPdf(html(), `${fileBase}.pdf`)}>
          PDF
        </button>
        <button className="ghost" onClick={() => void printVisitHtml(html())}>
          Stampa
        </button>
        <button className="ghost" onClick={() => void exportVisitHtml(html(), `${fileBase}.html`)}>
          HTML
        </button>
        <button
          className="ghost"
          onClick={() => {
            if (visit) void exportVisitJson(visit, patient)
          }}
        >
          JSON visita
        </button>
      </div>
      <div className="report-paper">
        <div className="text-[11px] uppercase tracking-widest text-[#6b6258]">
          {APP_NAME} · v{APP_VERSION} · Creato da Daniele Gabrovec
        </div>
        <h1 className="text-2xl mt-1">{patientLabel(patient)}</h1>
        <p>
          {visit?.date} · {doctorLabel(doctor)} {studio.qualifica ? `· ${studio.qualifica}` : ''}
        </p>
        {studio.nome ? <p>{studio.nome}</p> : null}
        {studio.sede ? <p>{studio.sede}</p> : null}
        {studio.ordine ? <p className="text-[12px]">{studio.ordine}</p> : null}
        {!a || !visit ? (
          <p>Nessuna visita selezionata.</p>
        ) : (
          <>
            <h2>Antropometria</h2>
            <div className="kpi-grid mb-3">
              <KpiCard label="FM% pliche" value={a.anthro.pliche?.fmPct} unit="%" />
              <KpiCard label="FFM" value={a.anthro.pliche?.ffmKg} unit="kg" />
              <KpiCard label="BMI" value={a.anthro.bmi} />
              <KpiCard label="WHR" value={a.anthro.whr} d={2} />
            </div>
            <h2>BIA</h2>
            <div className="kpi-grid mb-3">
              <KpiCard label="PhA" value={a.bia.signal?.phaseAngleDeg} unit="°" />
              <KpiCard label="FM% BIA" value={a.bia.assessment?.metrics.fmPercent?.value} unit="%" />
              <KpiCard label="TBW" value={a.bia.assessment?.metrics.tbw?.value} unit="L" />
              <KpiCard label="SMI" value={a.bia.assessment?.metrics.skeletalMuscleIndex?.value} />
            </div>
            <h2>Misure {ref ? `(Δ vs ${ref.date})` : ''}</h2>
            <table>
              <thead>
                <tr>
                  <th>Sito</th>
                  <th>Valore</th>
                  <th>Δ</th>
                </tr>
              </thead>
              <tbody>
                {MEASURES.filter((m) => visit.measures[m.key] != null).map((m) => {
                  const cur = visit.measures[m.key]
                  const prev = ref?.measures[m.key]
                  return (
                    <tr key={m.key}>
                      <td>{m.label}</td>
                      <td>
                        {fmt(cur)} {m.unit}
                      </td>
                      <td>{cur != null && prev != null ? fmtDelta(cur - prev) : '—'}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </>
        )}
        <p className="mt-8 text-[11px] text-[#5c564e] whitespace-pre-wrap">{DISCLAIMER}</p>
        <p className="mt-4 text-[11px] text-[#5c564e] whitespace-pre-wrap">{COPYRIGHT_NOTICE}</p>
      </div>
    </div>
  )
}
