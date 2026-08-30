import {
  assessVisit,
  buildBivaInterpretation,
  BIVA_REFERENCE_PROFILES,
  BIVA_ZONE_LABELS,
  formatBivaPercentile
} from '@shared/engine'
import { useApp } from '../store/useApp'
import { patientVisits } from '../lib/delta'
import { VisitContext } from '../components/VisitContext'
import { BivaBands } from '../components/BivaBands'
import { BivaLegend, BivaPlot, BivaVisitTable, type BivaChartPoint } from '../components/BivaChart'
import { fmt } from '../lib/format'

export function Biva() {
  const patients = useApp((s) => s.patients)
  const visits = useApp((s) => s.visits)
  const pid = useApp((s) => s.selectedPatientId)
  const vid = useApp((s) => s.selectedVisitId)
  const patchVisit = useApp((s) => s.patchVisit)
  const patient = patients.find((p) => p.id === pid) ?? null
  const visit = visits.find((v) => v.id === vid) ?? null
  const assessed = patient && visit ? assessVisit(patient, visit) : null
  const biva = assessed?.bia.assessment?.biva ?? null
  const ordered = patientVisits(visits, pid)
  const trail: BivaChartPoint[] = patient
    ? ordered.flatMap((v) => {
        if (v.bia.deviceProfileId !== visit?.bia.deviceProfileId) return []
        const r = assessVisit(patient, v).bia.assessment?.biva
        if (!r) return []
        return [
          {
            date: v.date,
            name: v.name,
            rH: r.rH,
            xcH: r.xcH,
            current: v.id === vid,
            zone: r.zone,
            phenotypeLabel: r.phenotype.label,
            d2: r.mahalanobisSquared
          }
        ]
      })
    : []

  const ref = biva?.reference ?? null

  return (
    <div className="wide-page">
      <div className="hair">BIVA</div>
      <h1 className="serif text-2xl mb-1">BIA Vector · R/H × Xc/H</h1>
      <p className="text-[var(--color-mute)] mb-3 max-w-[72ch]">
        BIVA classica a 50 kHz total-body (Piccoli): resistenza e reattanza normalizzate per l&apos;altezza. L&apos;idratazione
        relativa sta sull&apos;<strong>asse maggiore</strong> dell&apos;ellisse (vettore lungo → meno acqua relativa; vettore corto →
        più acqua). La componente cellulare sta sull&apos;<strong>asse minore</strong>. Non è specific BIVA e non usa equazioni di
        composizione.
      </p>
      <VisitContext />
      {visit ? (
        <div className="field mt-3" style={{ maxWidth: 480 }}>
          <label>Coorte di riferimento</label>
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
      ) : null}
      {!biva ? (
        <p className="text-[var(--color-copper)] mt-3">
          {assessed?.bia.blockedReason ?? 'Inserisci R e Xc nella visita (Misura). Senza coorte validata il vettore non viene classificato.'}
        </p>
      ) : (
        <>
          <p className="text-[12px] text-[var(--color-mute)] mt-2 mb-3">
            {ref?.label} · {ref?.version} · n={ref?.sampleSize} · {ref?.source.citation}
          </p>
          <div className="kpi-grid mb-4" style={{ maxWidth: 960 }}>
            <div className="kpi">
              <div className="hair">R/H</div>
              <div className="val">{fmt(biva.rH, 1)}</div>
              <div className="text-[11px] text-[var(--color-mute)]">Ω/m</div>
            </div>
            <div className="kpi">
              <div className="hair">Xc/H</div>
              <div className="val">{fmt(biva.xcH, 1)}</div>
              <div className="text-[11px] text-[var(--color-mute)]">Ω/m</div>
            </div>
            <div className="kpi">
              <div className="hair">Ellisse</div>
              <div className="val text-[16px]">{BIVA_ZONE_LABELS[biva.zone]}</div>
              <div className="text-[11px] text-[var(--color-mute)]">d² {fmt(biva.mahalanobisSquared, 2)}</div>
            </div>
            <div className="kpi">
              <div className="hair">Area</div>
              <div className="val text-[16px]">{biva.phenotype.title}</div>
            </div>
            <div className="kpi">
              <div className="hair">PhA z</div>
              <div className="val">{fmt(biva.phaseAngleZ, 2)}</div>
              <div className="text-[11px] text-[var(--color-mute)]">
                perc. {formatBivaPercentile(biva.phaseAnglePercentile)}
              </div>
            </div>
          </div>
          <BivaPlot result={biva} trail={trail} />
          <p className="mt-2 text-[12px] text-[var(--color-mute)]">
            Ellissi: <span style={{ color: '#34d399' }}>50%</span> · <span style={{ color: '#f59e0b' }}>75%</span> ·{' '}
            <span style={{ color: '#fb7185' }}>95%</span> (tratteggiata). Linee tratteggiate grigie = assi principali della
            covarianza. Il segmento dal baricentro al punto è il vettore.
          </p>
          <BivaLegend currentId={biva.phenotype.id} />
          <p className="mt-3 text-[13px] leading-relaxed text-[var(--color-mute)] max-w-[72ch]">
            {buildBivaInterpretation(biva, 'it')}
          </p>
          <BivaVisitTable trail={trail} />
          <BivaBands result={biva} />
        </>
      )}
    </div>
  )
}
