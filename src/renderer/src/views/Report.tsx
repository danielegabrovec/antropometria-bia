import { assessVisit } from '@shared/engine'
import { APP_NAME, APP_VERSION, DISCLAIMER } from '@shared/catalog/about'
import { MEASURES } from '@shared/catalog/measures'
import { useApp } from '../store/useApp'
import { patientVisits, referenceVisit, patientLabel } from '../lib/delta'
import { fmt, fmtDelta } from '../lib/format'
import { KpiCard } from '../components/KpiCard'

export function Report() {
  const patients = useApp((s) => s.patients)
  const visits = useApp((s) => s.visits)
  const pid = useApp((s) => s.selectedPatientId)
  const vid = useApp((s) => s.selectedVisitId)
  const studio = useApp((s) => s.settings.studio)
  const deltaMode = useApp((s) => s.settings.deltaMode)
  const patient = patients.find((p) => p.id === pid) ?? null
  const visit = visits.find((v) => v.id === vid) ?? null
  const ordered = patientVisits(visits, pid)
  const ref = referenceVisit(ordered, vid, deltaMode)
  const a = patient && visit ? assessVisit(patient, visit) : null

  async function pdf() {
    const name = `report-${patientLabel(patient).replace(/\s+/g, '-')}-${visit?.date ?? ''}.pdf`
    const res = await window.antropometriaBia?.pdf(name)
    if (res?.ok && res.path) await window.antropometriaBia?.openPath(res.path)
  }

  async function csv() {
    if (!patient) return
    const header = ['data', 'peso', 'altezza', 'fm_pliche', 'fm_bia', 'pha', 'tbw']
    const lines = [header.join(';')]
    for (const v of ordered) {
      const ass = assessVisit(patient, v)
      lines.push(
        [
          v.date,
          v.weightKg ?? '',
          v.heightCm ?? '',
          ass.anthro.pliche?.fmPct ?? '',
          ass.bia.assessment?.metrics.fmPercent?.value ?? '',
          ass.bia.signal?.phaseAngleDeg ?? '',
          ass.bia.assessment?.metrics.tbw?.value ?? ''
        ].join(';')
      )
    }
    await window.antropometriaBia?.exportFile({
      defaultName: `visite-${patientLabel(patient)}.csv`,
      content: lines.join('\n'),
      ext: '.csv'
    })
  }

  return (
    <div className="wide-page">
      <div className="flex gap-2 mb-4 no-print">
        <button className="primary" onClick={() => void pdf()}>
          Salva PDF
        </button>
        <button className="ghost" onClick={() => void window.antropometriaBia?.print()}>
          Stampa
        </button>
        <button className="ghost" onClick={() => void csv()}>
          CSV visite
        </button>
      </div>
      <div className="report-paper">
        <div className="text-[11px] uppercase tracking-widest text-[#6b6258]">{APP_NAME} · v{APP_VERSION}</div>
        <h1 className="text-2xl mt-1">{patientLabel(patient)}</h1>
        <p>
          {visit?.date} · {studio.titolare} {studio.qualifica ? `· ${studio.qualifica}` : ''}
        </p>
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
      </div>
    </div>
  )
}
