import { useState } from 'react'
import type { DoctorProfile } from '@shared/types'
import { doctorLabel, emptyDoctor } from '@shared/library'
import { useApp } from '../store/useApp'
import { flushPersist, switchWorkspace, deleteWorkspaceFiles } from '../lib/persist'

function DoctorFields({
  value,
  onChange
}: {
  value: DoctorProfile
  onChange: (p: Partial<DoctorProfile>) => void
}) {
  return (
    <div className="form-grid">
      <div className="field">
        <label>Titolo</label>
        <input value={value.titolo} onChange={(e) => onChange({ titolo: e.target.value })} />
      </div>
      <div className="field">
        <label>Nome</label>
        <input value={value.nome} onChange={(e) => onChange({ nome: e.target.value })} />
      </div>
      <div className="field">
        <label>Cognome</label>
        <input value={value.cognome} onChange={(e) => onChange({ cognome: e.target.value })} />
      </div>
      <div className="field">
        <label>Qualifica</label>
        <input value={value.qualification} onChange={(e) => onChange({ qualification: e.target.value })} />
      </div>
      <div className="field">
        <label>Codice fiscale</label>
        <input value={value.fiscalCode} onChange={(e) => onChange({ fiscalCode: e.target.value })} />
      </div>
      <div className="field">
        <label>P. IVA</label>
        <input value={value.vatNumber} onChange={(e) => onChange({ vatNumber: e.target.value })} />
      </div>
      <div className="field">
        <label>Ordine</label>
        <input value={value.orderName} onChange={(e) => onChange({ orderName: e.target.value })} />
      </div>
      <div className="field">
        <label>N. iscrizione</label>
        <input value={value.orderNumber} onChange={(e) => onChange({ orderNumber: e.target.value })} />
      </div>
      <div className="field">
        <label>Struttura</label>
        <input value={value.structure} onChange={(e) => onChange({ structure: e.target.value })} />
      </div>
      <div className="field">
        <label>Indirizzo</label>
        <input value={value.address} onChange={(e) => onChange({ address: e.target.value })} />
      </div>
      <div className="field">
        <label>CAP</label>
        <input value={value.zip} onChange={(e) => onChange({ zip: e.target.value })} />
      </div>
      <div className="field">
        <label>Città</label>
        <input value={value.city} onChange={(e) => onChange({ city: e.target.value })} />
      </div>
      <div className="field">
        <label>Telefono</label>
        <input value={value.phone} onChange={(e) => onChange({ phone: e.target.value })} />
      </div>
      <div className="field">
        <label>Cellulare</label>
        <input value={value.mobile} onChange={(e) => onChange({ mobile: e.target.value })} />
      </div>
      <div className="field">
        <label>Email</label>
        <input value={value.email} onChange={(e) => onChange({ email: e.target.value })} />
      </div>
      <div className="field">
        <label>PEC</label>
        <input value={value.pec} onChange={(e) => onChange({ pec: e.target.value })} />
      </div>
      <div className="field" style={{ gridColumn: '1 / -1' }}>
        <label>Sito</label>
        <input value={value.website} onChange={(e) => onChange({ website: e.target.value })} />
      </div>
      <div className="field" style={{ gridColumn: '1 / -1' }}>
        <label>Note</label>
        <textarea value={value.notes} onChange={(e) => onChange({ notes: e.target.value })} />
      </div>
    </div>
  )
}

export function Dottori() {
  const workspace = useApp((s) => s.workspace)
  const doctors = useApp((s) => s.doctors)
  const active = useApp((s) => s.activeDoctorId)
  const visits = useApp((s) => s.visits)
  const index = useApp((s) => s.index)
  const setActive = useApp((s) => s.setActiveDoctor)
  const addDoctor = useApp((s) => s.addDoctor)
  const upsert = useApp((s) => s.upsertDoctor)
  const remove = useApp((s) => s.removeDoctor)
  const createIsolated = useApp((s) => s.createIsolatedWorkspace)
  const drop = useApp((s) => s.dropCurrentWorkspace)
  const [q, setQ] = useState('')
  const selected = doctors.find((d) => d.id === active) ?? doctors[0] ?? null
  const filtered = doctors.filter((d) =>
    `${d.nome} ${d.cognome} ${d.email} ${d.qualification}`.toLowerCase().includes(q.trim().toLowerCase())
  )

  return (
    <div className="wide-page manage-grid">
      <div>
        <div className="hair mb-2">Dottori</div>
        <input className="search" placeholder="Cerca…" value={q} onChange={(e) => setQ(e.target.value)} />
        <div className="library-list" style={{ maxHeight: 360, marginTop: 8 }}>
          {filtered.map((d) => (
            <button key={d.id} className={`visit-item ${d.id === active ? 'sel' : ''}`} onClick={() => setActive(d.id)}>
              <div className="font-medium">{doctorLabel(d)}</div>
              <div className="text-[11px] text-[var(--color-mute)]">{d.qualification || '—'}</div>
            </button>
          ))}
        </div>
        {workspace?.kind === 'studio' ? (
          <button
            className="primary w-full mt-3"
            onClick={() => {
              const id = addDoctor({ nome: 'Nuovo', cognome: 'Dottore' })
              setActive(id)
            }}
          >
            + Dottore nello studio
          </button>
        ) : (
          <p className="text-[12px] text-[var(--color-mute)] mt-2">
            Cartella personale: un solo dottore. Per un collega crea una nuova cartella.
          </p>
        )}
        <button
          className="ghost w-full mt-2"
          onClick={() => {
            const nome = window.prompt('Nome e cognome del dottore della nuova cartella personale')
            if (!nome) return
            const parts = nome.trim().split(/\s+/)
            flushPersist()
            createIsolated({ nome: parts.slice(1).join(' ') || parts[0], cognome: parts[0] }, nome)
            flushPersist()
          }}
        >
          Nuova cartella personale
        </button>
        <div className="hair mt-4 mb-2">Apri cartella</div>
        {index.workspaces.map((w) => (
          <button
            key={w.id}
            className={`visit-item ${w.id === workspace?.id ? 'sel' : ''}`}
            onClick={() => void switchWorkspace(w.id)}
          >
            {w.name} · {w.kind === 'studio' ? 'studio' : 'personale'}
          </button>
        ))}
      </div>
      <div>
        {!selected ? (
          <p className="text-[var(--color-mute)]">Nessun dottore. Completa il wizard o creane uno.</p>
        ) : (
          <>
            <h1 className="serif text-2xl mb-1">{doctorLabel(selected)}</h1>
            <p className="text-[13px] text-[var(--color-mute)] mb-4">
              {workspace?.name} · {visits.filter((v) => v.operatorDoctorId === selected.id).length} visite come operatore
            </p>
            <DoctorFields value={selected} onChange={(p) => upsert({ id: selected.id, ...p })} />
            {doctors.length > 1 ? (
              <button
                className="ghost mt-4"
                onClick={() => {
                  if (!window.confirm(`Eliminare ${doctorLabel(selected)} da questa cartella?`)) return
                  remove(selected.id)
                }}
              >
                Elimina dottore
              </button>
            ) : (
              <button
                className="ghost mt-4"
                onClick={() => {
                  if (!window.confirm('Eliminare l’intera cartella (pazienti e visite)?')) return
                  const { removedId, next } = drop()
                  void deleteWorkspaceFiles(removedId)
                  if (next.activeWorkspaceId) void switchWorkspace(next.activeWorkspaceId)
                  flushPersist()
                }}
              >
                Elimina questa cartella
              </button>
            )}
          </>
        )}
      </div>
    </div>
  )
}

void emptyDoctor
