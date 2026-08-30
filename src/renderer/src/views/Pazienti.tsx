import { useState } from 'react'
import { calcolaEta } from '@shared/engine'
import { filterPatients, patientLabel, sexLabel } from '@shared/library'
import { useApp } from '../store/useApp'
import { CreatePatientDialog, PatientFields } from '../components/anagrafica'

export function Pazienti() {
  const patients = useApp((s) => s.patients)
  const visits = useApp((s) => s.visits)
  const pid = useApp((s) => s.selectedPatientId)
  const select = useApp((s) => s.selectPatient)
  const add = useApp((s) => s.addPatient)
  const upsert = useApp((s) => s.upsertPatient)
  const remove = useApp((s) => s.removePatient)
  const setView = useApp((s) => s.setView)
  const [q, setQ] = useState('')
  const [creating, setCreating] = useState(false)
  const list = filterPatients(patients, q)
  const p = patients.find((x) => x.id === pid) ?? null
  const nVisits = visits.filter((v) => v.patientId === pid).length

  return (
    <div className="wide-page manage-grid">
      <div>
        <div className="hair mb-2">Pazienti</div>
        <input
          className="search"
          placeholder="Cerca nome, cognome, CF…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <div className="library-list" style={{ maxHeight: 420, marginTop: 8 }}>
          {list.length === 0 ? (
            <p className="text-[12px] text-[var(--color-mute)] mt-2">Nessun paziente in questa cartella.</p>
          ) : (
            list.map((x) => (
              <button key={x.id} className={`visit-item ${x.id === pid ? 'sel' : ''}`} onClick={() => select(x.id)}>
                <div className="font-medium">{patientLabel(x)}</div>
                <div className="text-[11px] text-[var(--color-mute)]">
                  {sexLabel(x.sex)}
                  {x.birthDate ? ` · ${calcolaEta(x.birthDate)} anni` : ' · nascita —'}
                </div>
              </button>
            ))
          )}
        </div>
        <button className="primary w-full mt-3" onClick={() => setCreating(true)}>
          + Nuovo paziente
        </button>
      </div>
      <div>
        {!p ? (
          <div className="panel">
            <h2 className="serif text-xl mb-2">Anagrafica pazienti</h2>
            <p className="text-[var(--color-mute)]">
              Crea un paziente o selezionane uno a sinistra. Sesso (Maschio o Femmina) e data di nascita servono ai
              calcoli.
            </p>
          </div>
        ) : (
          <>
            <h1 className="serif text-2xl mb-1">{patientLabel(p)}</h1>
            <p className="text-[13px] text-[var(--color-mute)] mb-4">
              {nVisits} visite in archivio
              {p.birthDate ? ` · ${calcolaEta(p.birthDate)} anni` : ''}
            </p>
            <PatientFields value={p} onChange={(patch) => upsert({ id: p.id, ...patch })} />
            <div className="flex gap-2 mt-4">
              <button
                className="primary"
                onClick={() => {
                  select(p.id)
                  setView('misura')
                }}
              >
                Apri in Misura
              </button>
              <button
                className="ghost"
                onClick={() => {
                  if (!window.confirm(`Eliminare ${patientLabel(p)} e tutte le visite?`)) return
                  remove(p.id)
                }}
              >
                Elimina paziente e visite
              </button>
            </div>
          </>
        )}
      </div>
      <CreatePatientDialog
        open={creating}
        onClose={() => setCreating(false)}
        onCreate={(draft) => {
          const id = add(draft)
          select(id)
        }}
      />
    </div>
  )
}
