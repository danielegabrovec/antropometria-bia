import { useMemo } from 'react'
import { assessVisit, blandAltman, etichettaLaf } from '@shared/engine'
import { BIVA_REFERENCE_PROFILES } from '@shared/engine'
import { sexLabel } from '@shared/library'
import { useApp } from '../store/useApp'
import { patientVisits } from '../lib/delta'
import { KpiCard } from '../components/KpiCard'
import { Chart, CHART_BASE } from '../components/Chart'
import { VisitContext } from '../components/VisitContext'
import { FasciaBar } from '../components/FasciaBar'
import { fmt } from '../lib/format'

export function Analisi() {
  const patients = useApp((s) => s.patients)
  const visits = useApp((s) => s.visits)
  const pid = useApp((s) => s.selectedPatientId)
  const vid = useApp((s) => s.selectedVisitId)
  const patchVisit = useApp((s) => s.patchVisit)
  const patient = patients.find((p) => p.id === pid) ?? null
  const visit = visits.find((v) => v.id === vid) ?? null
  const assessed = patient && visit ? assessVisit(patient, visit) : null
  const ordered = patientVisits(visits, pid)

  const pairs = useMemo(() => {
    if (!patient) return []
    return ordered
      .map((v) => {
        const a = assessVisit(patient, v)
        const pl = a.anthro.pliche?.fmPct
        const bia = a.bia.assessment?.metrics.fmPercent?.value
        if (pl == null || bia == null) return null
        return { a: pl, b: bia, date: v.date }
      })
      .filter((x): x is { a: number; b: number; date: string } => x != null)
  }, [patient, ordered])

  const ba = blandAltman(pairs)
  const a = assessed?.anthro
  const b = assessed?.bia.assessment

  return (
    <div className="wide-page">
      <div className="hair">Analisi</div>
      <h1 className="serif text-2xl mb-3">Composizione · due origini</h1>
      <VisitContext />
      {!visit || !a || !assessed ? (
        <p className="text-[var(--color-mute)] mt-3">Seleziona una visita sopra, oppure aprila da Misura.</p>
      ) : (
        <>
          <h2 className="serif text-lg mt-5 mb-2">Fasce di normalità</h2>
          <p className="text-[12px] text-[var(--color-mute)] mb-3">
            Solo range pubblicati: massa grassa Gallagher 2000 (pliche, 20–79 anni), BMI OMS, WHR 0,95/0,85, WHtR 0,50. Il
            cuneo è il valore della visita. Nessuna fascia inventata su RFM, SMI o BIA Sun.
          </p>
          <div className="fascia-grid mb-6">
            {a.fasce.fat ? <FasciaBar fascia={a.fasce.fat} /> : null}
            {a.fasce.bmi ? <FasciaBar fascia={a.fasce.bmi} /> : null}
            {a.fasce.whr ? <FasciaBar fascia={a.fasce.whr} /> : null}
            {a.fasce.whtr ? <FasciaBar fascia={a.fasce.whtr} /> : null}
          </div>

          <h2 className="serif text-lg mb-2">Antropometria</h2>
          <div className="kpi-grid mb-6">
            <KpiCard label="Età" value={assessed.age > 0 ? assessed.age : null} unit="anni" hint={sexLabel(assessed.sex)} />
            <KpiCard label="FM% pliche" value={a.pliche?.fmPct} unit="%" tone={a.fasce.fat?.classificazione} hint={a.fasce.fat?.fonte} />
            <KpiCard label="FM kg" value={a.pliche?.fmKg} unit="kg" />
            <KpiCard label="FFM kg" value={a.pliche?.ffmKg} unit="kg" />
            <KpiCard label="BMI" value={a.bmi} hint={a.bmiClass.label} tone={a.fasce.bmi?.classificazione} />
            <KpiCard label="WHR" value={a.whr} d={2} tone={a.fasce.whr?.classificazione} />
            <KpiCard label="WHtR" value={a.whtr} d={2} tone={a.fasce.whtr?.classificazione} />
            <KpiCard label="RFM" value={a.rfm} />
            <KpiCard label="ABSI" value={a.absi} d={4} />
            <KpiCard label="BSA" value={a.bsa} d={2} unit="m²" />
            <KpiCard label="Peso teorico" value={a.pesoIdeale} unit="kg" />
            <KpiCard label="AMA" value={a.artometria?.ama} d={1} unit="cm²" />
            <KpiCard label="Heymsfield SMM" value={a.heymsfield?.smm} unit="kg" />
            <KpiCard label="Endo / meso / ecto" value={a.somatotipo?.endo} hint={a.somatotipo?.classificazione} />
          </div>

          <h2 className="serif text-lg mb-2">Dispendio energetico</h2>
          {assessed.energy.blocco ? (
            <p className="text-[var(--color-copper)] mb-2">{assessed.energy.blocco}</p>
          ) : null}
          <div className="kpi-grid mb-3">
            <KpiCard
              label="BMR"
              value={assessed.energy.bmr}
              unit="kcal"
              hint={assessed.energy.fallbackFfm ? 'Fallback Mifflin (manca FFM)' : assessed.energy.metodo}
            />
            <KpiCard label="TDEE" value={assessed.energy.tdee} unit="kcal" hint={etichettaLaf(assessed.energy.laf)} />
          </div>
          <div className="panel overflow-auto mb-6">
            <table className="data">
              <thead>
                <tr>
                  <th>Formula BMR</th>
                  <th>BMR</th>
                  <th>TDEE</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {assessed.energy.confronto.map((row) => (
                  <tr key={row.metodo}>
                    <td>
                      {row.label}
                      {row.metodo === visit.formulaBmr ? ' · scelta' : ''}
                    </td>
                    <td className="num">{fmt(row.bmr, 0)}</td>
                    <td className="num">{fmt(row.tdee, 0)}</td>
                    <td>{row.fallbackFfm ? 'Mifflin (no FFM)' : ''}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <h2 className="serif text-lg mb-2">BIA (Sun / Janssen / Sergi)</h2>
          <div className="field" style={{ maxWidth: 360 }}>
            <label>Coorte BIVA</label>
            <select
              value={visit.bia.bivaProfileId ?? ''}
              onChange={(e) =>
                patchVisit(visit.id, { bia: { ...visit.bia, bivaProfileId: e.target.value || null } })
              }
            >
              <option value="">Automatica da sesso/età</option>
              {BIVA_REFERENCE_PROFILES.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>
          {assessed.bia.blockedReason ? <p className="text-[var(--color-copper)] mb-2">{assessed.bia.blockedReason}</p> : null}
          {b?.qualityFlags.length ? (
            <div className="quality-flags mb-3" role="status" aria-label="Avvertenze di qualità BIA">
              {b.qualityFlags.map((flag) => (
                <div key={`${flag.code}-${flag.message}`} className={`quality-flag ${flag.severity}`}>
                  <strong>{flag.severity === 'blocking' ? 'Blocco' : flag.severity === 'warning' ? 'Attenzione' : 'Nota'}</strong>
                  <span>{flag.message}</span>
                </div>
              ))}
            </div>
          ) : null}
          <div className="kpi-grid mb-6">
            <KpiCard label="PhA" value={b?.metrics.phaseAngle?.value ?? assessed.bia.signal?.phaseAngleDeg} unit="°" />
            <KpiCard label="FM% BIA" value={b?.metrics.fmPercent?.value} unit="%" />
            <KpiCard label="FFM BIA" value={b?.metrics.ffm?.value} unit="kg" />
            <KpiCard label="TBW" value={b?.metrics.tbw?.value} unit="L" />
            <KpiCard label="ECW" value={b?.metrics.ecw?.value} unit="L" />
            <KpiCard label="ICW" value={b?.metrics.icw?.value} unit="L" />
            <KpiCard label="ECW/TBW" value={b?.metrics.ecwTbwRatio?.value} d={3} hint="stima single-frequency" />
            <KpiCard label="ICW/TBW" value={b?.metrics.icwTbwRatio?.value} d={3} hint="stima single-frequency" />
            <KpiCard label="SMM" value={b?.metrics.skeletalMuscleMass?.value} unit="kg" />
            <KpiCard label="SMI" value={b?.metrics.skeletalMuscleIndex?.value} unit="kg/m²" />
            <KpiCard label="BMR BIA" value={b?.metrics.bmr?.value} unit="kcal" />
            <KpiCard label="BCM strumento" value={b?.metrics.bcm?.value} unit="kg" hint={b?.metrics.bcm ? 'device' : 'non sintetizzato'} />
          </div>

          <h2 className="serif text-lg mb-2">Pliche vs BIA (Bland-Altman su FM%)</h2>
          {ba ? (
            <>
              <p className="text-[13px] text-[var(--color-mute)] mb-2">
                Bias {fmt(ba.bias)} p.p. · limiti ±1,96 SD: {fmt(ba.loaLow)} / {fmt(ba.loaHigh)} · {pairs.length} visite con entrambe le stime
              </p>
              <Chart
                height={320}
                option={{
                  ...CHART_BASE,
                  xAxis: { name: 'Media FM%', type: 'value', splitLine: { lineStyle: { color: '#243044' } } },
                  yAxis: { name: 'Pliche − BIA', type: 'value', splitLine: { lineStyle: { color: '#243044' } } },
                  series: [
                    {
                      type: 'scatter',
                      data: ba.points.map((p) => [p.mean, p.diff]),
                      itemStyle: { color: '#d4a574' }
                    },
                    {
                      type: 'line',
                      data: [],
                      silent: true,
                      markLine: {
                        symbol: 'none',
                        silent: true,
                        label: { color: '#93a0b5', fontSize: 10 },
                        data: [
                          { yAxis: ba.bias, name: 'bias', lineStyle: { color: '#2dd4bf' } },
                          { yAxis: ba.loaLow, name: '−1,96 SD', lineStyle: { color: '#e8a0b0', type: 'dashed' } },
                          { yAxis: ba.loaHigh, name: '+1,96 SD', lineStyle: { color: '#e8a0b0', type: 'dashed' } }
                        ]
                      }
                    }
                  ]
                }}
              />
            </>
          ) : (
            <p className="text-[var(--color-mute)]">Servono almeno due visite con FM% da pliche e da BIA.</p>
          )}
        </>
      )}
    </div>
  )
}
