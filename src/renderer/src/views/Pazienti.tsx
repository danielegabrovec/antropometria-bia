import { useState } from 'react'
import { filterPatients, patientLabel } from '@shared/library'
import { useApp } from '../store/useApp'

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
                  {x.sex ?? 'sesso —'} · {x.birthDate ?? 'nascita —'}
                </div>
              </button>
            ))
          )}
        </div>
        <button
          className="primary w-full mt-3"
          onClick={() => {
            const id = add({ nome: '', cognome: 'Nuovo paziente' })
            select(id)
          }}
        >
          + Nuovo paziente
        </button>
      </div>
      <div>
        {!p ? (
          <div className="panel">
            <h2 className="serif text-xl mb-2">Anagrafica pazienti</h2>
            <p className="text-[var(--color-mute)]">Crea un paziente o selezionane uno a sinistra. In Misura puoi anche cercarlo mentre misuri.</p>
          </div>
        ) : (
          <>
            <h1 className="serif text-2xl mb-1">{patientLabel(p)}</h1>
            <p className="text-[13px] text-[var(--color-mute)] mb-4">{nVisits} visite in archivio</p>
            <div className="form-grid">
              <div className="field">
                <label>Nome</label>
                <input value={p.nome} onChange={(e) => upsert({ id: p.id, nome: e.target.value })} />
              </div>
              <div className="field">
                <label>Cognome</label>
                <input value={p.cognome} onChange={(e) => upsert({ id: p.id, cognome: e.target.value })} />
              </div>
              <div className="field">
                <label>Sesso</label>
                <select
                  value={p.sex ?? ''}
                  onChange={(e) => upsert({ id: p.id, sex: (e.target.value || null) as typeof p.sex })}
                >
                  <option value="">Non indicato</option>
                  <option value="M">Maschile</option>
                  <option value="F">Femminile</option>
                  <option value="Altro">Altro</option>
                </select>
              </div>
              <div className="field">
                <label>Data di nascita</label>
                <input type="date" value={p.birthDate ?? ''} onChange={(e) => upsert({ id: p.id, birthDate: e.target.value || null })} />
              </div>
              <div className="field">
                <label>Codice fiscale</label>
                <input value={p.fiscalCode} onChange={(e) => upsert({ id: p.id, fiscalCode: e.target.value })} />
              </div>
              <div className="field">
                <label>Telefono</label>
                <input value={p.phone} onChange={(e) => upsert({ id: p.id, phone: e.target.value })} />
              </div>
              <div className="field">
                <label>Email</label>
                <input value={p.email} onChange={(e) => upsert({ id: p.id, email: e.target.value })} />
              </div>
              <div className="field" style={{ gridColumn: '1 / -1' }}>
                <label>Indirizzo</label>
                <input value={p.address} onChange={(e) => upsert({ id: p.id, address: e.target.value })} />
              </div>
              <div className="field" style={{ gridColumn: '1 / -1' }}>
                <label>Note</label>
                <textarea value={p.notes} onChange={(e) => upsert({ id: p.id, notes: e.target.value })} />
              </div>
            </div>
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
    </div>
  )
}
