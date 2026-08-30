import { useApp } from '../store/useApp'

export function Profili() {
  const patients = useApp((s) => s.patients)
  const pid = useApp((s) => s.selectedPatientId)
  const selectPatient = useApp((s) => s.selectPatient)
  const addPatient = useApp((s) => s.addPatient)
  const upsert = useApp((s) => s.upsertPatient)
  const remove = useApp((s) => s.removePatient)
  const p = patients.find((x) => x.id === pid) ?? null

  return (
    <div className="wide-page" style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: 24 }}>
      <div>
        <div className="hair mb-2">Profili</div>
        {patients.map((x) => (
          <button key={x.id} className={`visit-item ${x.id === pid ? 'sel' : ''}`} onClick={() => selectPatient(x.id)}>
            {x.alias}
          </button>
        ))}
        <button className="primary mt-3" onClick={() => addPatient()}>
          + Profilo
        </button>
      </div>
      {p ? (
        <div>
          <h1 className="serif text-2xl mb-4">{p.alias}</h1>
          <div className="field" style={{ maxWidth: 420 }}>
            <label>Alias</label>
            <input value={p.alias} onChange={(e) => upsert({ id: p.id, alias: e.target.value })} />
          </div>
          <div className="field" style={{ maxWidth: 220 }}>
            <label>Sesso anagrafica</label>
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
          <div className="field" style={{ maxWidth: 220 }}>
            <label>Data di nascita</label>
            <input type="date" value={p.birthDate ?? ''} onChange={(e) => upsert({ id: p.id, birthDate: e.target.value || null })} />
          </div>
          <div className="field" style={{ maxWidth: 520 }}>
            <label>Note</label>
            <textarea value={p.notes} onChange={(e) => upsert({ id: p.id, notes: e.target.value })} />
          </div>
          <button className="ghost" onClick={() => remove(p.id)}>
            Elimina profilo e visite
          </button>
        </div>
      ) : (
        <p className="text-[var(--color-mute)]">Nessun profilo.</p>
      )}
    </div>
  )
}
