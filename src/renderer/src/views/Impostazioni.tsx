import { useApp } from '../store/useApp'
import type { StudioIdentity } from '@shared/types'

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
  return (
    <div className="wide-page" style={{ maxWidth: 520 }}>
      <div className="hair">Opzioni</div>
      <h1 className="serif text-2xl mb-4">Identità dello studio</h1>
      <p className="text-[13px] text-[var(--color-mute)] mb-4">Compare in testa e in coda al report. Resta sul computer.</p>
      {FIELDS.map((f) => (
        <div className="field" key={f.key}>
          <label>{f.label}</label>
          <input
            value={studio[f.key]}
            onChange={(e) => patchSettings({ studio: { ...studio, [f.key]: e.target.value } })}
          />
        </div>
      ))}
    </div>
  )
}
