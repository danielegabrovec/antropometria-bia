import { doctorLabel } from '@shared/library'
import { useApp } from '../store/useApp'
import { patientLabel, patientVisits } from '../lib/delta'
import { fmt } from '../lib/format'
import type { ViewId } from '@shared/types'

const JUMP: { id: ViewId; label: string }[] = [
  { id: 'misura', label: 'Misura' },
  { id: 'analisi', label: 'Analisi' },
  { id: 'biva', label: 'BIVA' }
]

export function VisitContext() {
  const patients = useApp((s) => s.patients)
  const visits = useApp((s) => s.visits)
  const doctors = useApp((s) => s.doctors)
  const pid = useApp((s) => s.selectedPatientId)
  const vid = useApp((s) => s.selectedVisitId)
  const view = useApp((s) => s.view)
  const selectVisit = useApp((s) => s.selectVisit)
  const setView = useApp((s) => s.setView)
  const patient = patients.find((p) => p.id === pid) ?? null
  const visit = visits.find((v) => v.id === vid) ?? null
  const ordered = [...patientVisits(visits, pid)].reverse()
  const op = doctors.find((d) => d.id === visit?.operatorDoctorId)

  return (
    <div className="visit-context">
      <div className="visit-context-head">
        <div>
          <div className="hair">Visita in esame</div>
          <strong>{patientLabel(patient)}</strong>
          {visit ? (
            <div className="text-[12px] text-[var(--color-mute)]">
              {visit.date}
              {visit.name ? ` · ${visit.name}` : ''}
              {visit.weightKg != null ? ` · ${fmt(visit.weightKg)} kg` : ''}
              {visit.heightCm != null ? ` · ${fmt(visit.heightCm, 0)} cm` : ''}
              {op ? ` · ${doctorLabel(op)}` : ''}
            </div>
          ) : (
            <div className="text-[12px] text-[var(--color-copper)]">Nessuna visita selezionata. Clicca una data sotto.</div>
          )}
        </div>
        <div className="flex flex-wrap gap-1">
          {JUMP.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`chip ${view === item.id ? 'on' : ''}`}
              disabled={!visit && item.id !== 'misura'}
              onClick={() => setView(item.id)}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>
      {ordered.length > 0 ? (
        <div className="visit-context-list">
          {ordered.map((v) => (
            <div key={v.id} className={`visit-chip-row ${v.id === vid ? 'on' : ''}`}>
              <button
                type="button"
                className={`chip ${v.id === vid ? 'on' : ''}`}
                onClick={() => selectVisit(v.id)}
                title="Seleziona questa visita"
              >
                {v.date}
                {v.weightKg != null ? ` · ${fmt(v.weightKg, 0)} kg` : ''}
              </button>
              {JUMP.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={`visit-jump ${view === item.id && v.id === vid ? 'on' : ''}`}
                  title={`Apri in ${item.label}`}
                  onClick={() => {
                    selectVisit(v.id)
                    setView(item.id)
                  }}
                >
                  {item.label}
                </button>
              ))}
            </div>
          ))}
        </div>
      ) : patient ? (
        <p className="text-[12px] text-[var(--color-mute)] mt-2">Nessuna visita salvata su questo paziente.</p>
      ) : null}
    </div>
  )
}
