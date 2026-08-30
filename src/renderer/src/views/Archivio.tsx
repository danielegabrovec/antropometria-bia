import { doctorLabel } from '@shared/library'
import { cloneImportedWorkspace } from '@shared/library'
import { useApp } from '../store/useApp'
import { flushPersist } from '../lib/persist'
import { patientLabel } from '../lib/delta'
import { ExportMenu } from '../components/ExportMenu'
import { importWorkspaceJson } from '../lib/io'

export function Archivio() {
  const patients = useApp((s) => s.patients)
  const visits = useApp((s) => s.visits)
  const doctors = useApp((s) => s.doctors)
  const duplicateVisit = useApp((s) => s.duplicateVisit)
  const removeVisit = useApp((s) => s.removeVisit)
  const selectVisit = useApp((s) => s.selectVisit)
  const setView = useApp((s) => s.setView)
  const replace = useApp((s) => s.replaceWorkspaceData)

  return (
    <div className="wide-page">
      <div className="hair">Archivio</div>
      <h1 className="serif text-2xl mb-2">Visite della cartella</h1>
      <p className="text-[13px] text-[var(--color-mute)] mb-4">
        {visits.length} visite · {patients.length} pazienti. Esporta o importa tutto dal menu in alto.
      </p>
      <div className="flex gap-2 mb-4">
        <ExportMenu />
        <button
          className="ghost"
          onClick={async () => {
            const file = await importWorkspaceJson()
            if (file) {
              flushPersist()
              replace(file)
            }
          }}
        >
          Importa cartella JSON
        </button>
      </div>
      {visits.length === 0 ? (
        <div className="panel">Nessuna visita in questa cartella.</div>
      ) : (
        <table className="data">
          <thead>
            <tr>
              <th>Data</th>
              <th>Paziente</th>
              <th>Operatore</th>
              <th>Nome</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {[...visits]
              .sort((a, b) => b.date.localeCompare(a.date))
              .map((v) => {
                const p = patients.find((x) => x.id === v.patientId)
                const d = doctors.find((x) => x.id === v.operatorDoctorId)
                return (
                  <tr key={v.id}>
                    <td>{v.date}</td>
                    <td>{patientLabel(p ?? null)}</td>
                    <td>{doctorLabel(d ?? null)}</td>
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
                      <button
                        className="ghost ml-1"
                        onClick={() => {
                          if (!window.confirm('Eliminare questa visita?')) return
                          removeVisit(v.id)
                        }}
                      >
                        Elimina
                      </button>
                    </td>
                  </tr>
                )
              })}
          </tbody>
        </table>
      )}
    </div>
  )
}

void cloneImportedWorkspace
