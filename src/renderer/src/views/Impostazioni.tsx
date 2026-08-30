import { COPYRIGHT_NOTICE, COPYRIGHT_SHORT } from '@shared/catalog/about'
import { useApp } from '../store/useApp'
import type { StudioIdentity } from '@shared/types'
import { studioFromDoctor } from '@shared/library'

const FIELDS: Array<{ key: keyof StudioIdentity; label: string }> = [
  { key: 'nome', label: 'Struttura' },
  { key: 'titolare', label: 'Titolare' },
  { key: 'qualifica', label: 'Qualifica' },
  { key: 'sede', label: 'Sede' },
  { key: 'telefono', label: 'Telefono' },
  { key: 'email', label: 'Email' },
  { key: 'sito', label: 'Sito' },
  { key: 'ordine', label: 'Ordine / iscrizione' },
  { key: 'piva', label: 'Partita IVA' }
]

export function Impostazioni() {
  const studio = useApp((s) => s.settings.studio)
  const patchSettings = useApp((s) => s.patchSettings)
  const workspace = useApp((s) => s.workspace)
  const doctors = useApp((s) => s.doctors)
  const activeDoctorId = useApp((s) => s.activeDoctorId)
  const doctor = doctors.find((item) => item.id === activeDoctorId) ?? doctors[0] ?? null
  return (
    <div className="wide-page settings-page">
      <section>
        <div className="hair">Opzioni</div>
        <h1 className="serif text-2xl mb-2">Identità dello studio</h1>
        <p className="text-[13px] text-[var(--color-mute)] mb-4">
          Questi dati compaiono nell’intestazione di report, PDF e stampe e restano salvati nella cartella corrente.
        </p>
        <div className="panel settings-form">
          {FIELDS.map((f) => (
            <div className="field" key={f.key}>
              <label htmlFor={`studio-${f.key}`}>{f.label}</label>
              <input
                id={`studio-${f.key}`}
                value={studio[f.key]}
                onChange={(e) => patchSettings({ studio: { ...studio, [f.key]: e.target.value } })}
              />
            </div>
          ))}
        </div>
      </section>
      <aside className="settings-aside">
        <div className="panel">
          <div className="hair mb-2">Origine intestazione</div>
          <p className="text-[13px] text-[var(--color-mute)] leading-relaxed">
            Puoi personalizzare liberamente l’intestazione. Se vuoi riallinearla al profilo attivo, usa il comando qui sotto.
          </p>
          <button
            type="button"
            className="ghost mt-3"
            disabled={!doctor}
            onClick={() => {
              if (doctor) patchSettings({ studio: studioFromDoctor(doctor, workspace?.name ?? '') })
            }}
          >
            Ripristina dal dottore attivo
          </button>
        </div>
        <div className="panel mt-3">
          <p className="credit" style={{ whiteSpace: 'pre-wrap' }} title={COPYRIGHT_NOTICE}>
            {COPYRIGHT_SHORT}
          </p>
          <button type="button" className="ghost mt-3" onClick={() => useApp.getState().setView('info')}>
            Informazioni e licenza
          </button>
        </div>
      </aside>
    </div>
  )
}
