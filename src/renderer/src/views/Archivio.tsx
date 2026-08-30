import { cloneImportedLibrary, serializeLibrary } from '@shared/library'
import { useApp } from '../store/useApp'
import { flushPersist } from '../lib/persist'
import { patientLabel } from '../lib/delta'

export function Archivio() {
  const patients = useApp((s) => s.patients)
  const visits = useApp((s) => s.visits)
  const duplicateVisit = useApp((s) => s.duplicateVisit)
  const removeVisit = useApp((s) => s.removeVisit)
  const selectVisit = useApp((s) => s.selectVisit)
  const setView = useApp((s) => s.setView)
  const replaceLibrary = useApp((s) => s.replaceLibrary)

  async function saveAs() {
    flushPersist()
    const content = serializeLibrary(patients, visits)
    await window.antropometriaBia?.exportFile({
      defaultName: 'antropometria-bia.json',
      content,
      ext: '.json'
    })
  }

  async function load() {
    const res = await window.antropometriaBia?.importFile()
    if (!res?.ok || !res.content) return
    try {
      const cloned = cloneImportedLibrary(JSON.parse(res.content))
      if (!cloned) {
        window.alert('File non riconosciuto (serve kind antropometria-bia-library).')
        return
      }
      replaceLibrary(cloned.patients, cloned.visits)
    } catch {
      window.alert('JSON non valido.')
    }
  }

  return (
    <div className="wide-page">
      <div className="hair">Archivio</div>
      <h1 className="serif text-2xl mb-4">Visite salvate</h1>
      <div className="flex gap-2 mb-4">
        <button className="primary" onClick={() => void saveAs()}>
          Esporta JSON
        </button>
        <button className="ghost" onClick={() => void load()}>
          Importa JSON
        </button>
      </div>
      <table className="data">
        <thead>
          <tr>
            <th>Data</th>
            <th>Profilo</th>
            <th>Nome</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {[...visits]
            .sort((a, b) => b.date.localeCompare(a.date))
            .map((v) => {
              const p = patients.find((x) => x.id === v.patientId)
              return (
                <tr key={v.id}>
                  <td>{v.date}</td>
                  <td>{patientLabel(p ?? null)}</td>
                  <td>{v.name}</td>
                  <td>
                    <button
                      className="ghost"
                      onClick={() => {
                        selectVisit(v.id)
                        setView('misura')
                      }}
                    >
                      Apri
                    </button>
                    <button className="ghost ml-1" onClick={() => duplicateVisit(v.id)}>
                      Duplica
                    </button>
                    <button className="ghost ml-1" onClick={() => removeVisit(v.id)}>
                      Elimina
                    </button>
                  </td>
                </tr>
              )
            })}
        </tbody>
      </table>
    </div>
  )
}
