import { useState } from 'react'
import { doctorLabel } from '@shared/library'
import { useApp } from '../store/useApp'
import { flushPersist, switchWorkspace, deleteWorkspaceFiles } from '../lib/persist'
import { CreateDoctorDialog, DoctorFields } from '../components/anagrafica'

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
  const [creating, setCreating] = useState(false)
  const [creatingFolder, setCreatingFolder] = useState(false)
  const selected = doctors.find((d) => d.id === active) ?? doctors[0] ?? null
  const selectedVisitCount = selected ? visits.filter((v) => v.operatorDoctorId === selected.id).length : 0
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
          <button className="primary w-full mt-3" onClick={() => setCreating(true)}>
            + Dottore nello studio
          </button>
        ) : (
          <p className="text-[12px] text-[var(--color-mute)] mt-2">
            Cartella personale: un solo dottore. Per un collega crea una nuova cartella.
          </p>
        )}
        <button className="ghost w-full mt-2" onClick={() => setCreatingFolder(true)}>
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
              {workspace?.name} · {selectedVisitCount} visite come operatore
            </p>
            <DoctorFields value={selected} onChange={(p) => upsert({ id: selected.id, ...p })} />
            {doctors.length > 1 ? (
              <button
                className="ghost mt-4"
                disabled={selectedVisitCount > 0}
                title={selectedVisitCount > 0 ? 'Il dottore è associato a visite storiche e non può essere eliminato.' : undefined}
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
                onClick={async () => {
                  if (!window.confirm('Eliminare l’intera cartella (pazienti e visite)?')) return
                  await flushPersist()
                  const { removedId, next } = drop()
                  await deleteWorkspaceFiles(removedId)
                  if (next.activeWorkspaceId) await switchWorkspace(next.activeWorkspaceId)
                  else await flushPersist()
                }}
              >
                Elimina questa cartella
              </button>
            )}
            {selectedVisitCount > 0 && doctors.length > 1 ? (
              <p className="text-[12px] text-[var(--color-mute)] mt-2">
                Per preservare la firma storica delle visite, questo profilo non può essere eliminato finché è associato a rilevazioni.
              </p>
            ) : null}
          </>
        )}
      </div>
      <CreateDoctorDialog
        open={creating}
        onClose={() => setCreating(false)}
        title="Nuovo dottore nello studio"
        onCreate={(d) => {
          const id = addDoctor(d)
          setActive(id)
        }}
      />
      <CreateDoctorDialog
        open={creatingFolder}
        onClose={() => setCreatingFolder(false)}
        title="Nuova cartella personale"
        hint="Compila l’anagrafica del dottore. Nome e cognome sono obbligatori; gli altri campi puoi lasciarli vuoti."
        saveLabel="Crea cartella"
        folderName
        onCreate={async (d, name) => {
          await flushPersist()
          createIsolated(d, name ?? '')
          await flushPersist()
        }}
      />
    </div>
  )
}
