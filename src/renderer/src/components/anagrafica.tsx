import { useEffect, useState, type ReactNode } from 'react'
import type { DoctorProfile, PatientProfile, Sex } from '@shared/types'
import { emptyDoctor, emptyPatient } from '@shared/library'

function SexSelect({
  value,
  onChange,
  required
}: {
  value: Sex | null
  onChange: (s: Sex | null) => void
  required?: boolean
}) {
  return (
    <select
      value={value === 'M' || value === 'F' ? value : ''}
      required={required}
      onChange={(e) => onChange(e.target.value === 'M' || e.target.value === 'F' ? e.target.value : null)}
    >
      <option value="" disabled={required}>
        Seleziona…
      </option>
      <option value="M">Maschio</option>
      <option value="F">Femmina</option>
    </select>
  )
}

export function PatientFields({
  value,
  onChange,
  autoFocusName
}: {
  value: Pick<
    PatientProfile,
    'nome' | 'cognome' | 'alias' | 'sex' | 'birthDate' | 'fiscalCode' | 'phone' | 'email' | 'address' | 'notes'
  >
  onChange: (p: Partial<PatientProfile>) => void
  autoFocusName?: boolean
}) {
  return (
    <div className="form-grid">
      <div className="field">
        <label>Nome</label>
        <input value={value.nome} onChange={(e) => onChange({ nome: e.target.value })} autoFocus={autoFocusName} />
      </div>
      <div className="field">
        <label>Cognome</label>
        <input value={value.cognome} onChange={(e) => onChange({ cognome: e.target.value })} />
      </div>
      <div className="field">
        <label>Sesso</label>
        <SexSelect value={value.sex} required onChange={(sex) => onChange({ sex })} />
      </div>
      <div className="field">
        <label>Data di nascita (età alla visita)</label>
        <input
          type="date"
          value={value.birthDate ?? ''}
          onChange={(e) => onChange({ birthDate: e.target.value || null })}
        />
      </div>
      <div className="field">
        <label>Alias / nome in elenco</label>
        <input
          value={value.alias}
          placeholder="Se vuoto: cognome e nome"
          onChange={(e) => onChange({ alias: e.target.value })}
        />
      </div>
      <div className="field">
        <label>Codice fiscale</label>
        <input value={value.fiscalCode} onChange={(e) => onChange({ fiscalCode: e.target.value })} />
      </div>
      <div className="field">
        <label>Telefono</label>
        <input value={value.phone} onChange={(e) => onChange({ phone: e.target.value })} />
      </div>
      <div className="field">
        <label>Email</label>
        <input value={value.email} onChange={(e) => onChange({ email: e.target.value })} />
      </div>
      <div className="field" style={{ gridColumn: '1 / -1' }}>
        <label>Indirizzo</label>
        <input value={value.address} onChange={(e) => onChange({ address: e.target.value })} />
      </div>
      <div className="field" style={{ gridColumn: '1 / -1' }}>
        <label>Note</label>
        <textarea value={value.notes} onChange={(e) => onChange({ notes: e.target.value })} />
      </div>
    </div>
  )
}

export function DoctorFields({
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
        <label>Qualifica</label>
        <input value={value.qualification} onChange={(e) => onChange({ qualification: e.target.value })} />
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
        <label>Sesso</label>
        <SexSelect value={value.sex} onChange={(sex) => onChange({ sex })} />
      </div>
      <div className="field">
        <label>Data di nascita</label>
        <input
          type="date"
          value={value.birthDate ?? ''}
          onChange={(e) => onChange({ birthDate: e.target.value || null })}
        />
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

export function AnagraficaDialog({
  title,
  hint,
  open,
  onClose,
  onSave,
  saveLabel,
  saveDisabled,
  children
}: {
  title: string
  hint: string
  open: boolean
  onClose: () => void
  onSave: () => void
  saveLabel: string
  saveDisabled: boolean
  children: ReactNode
}) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null
  return (
    <div className="overlay sheet-overlay" onClick={onClose}>
      <div className="palette sheet" onClick={(e) => e.stopPropagation()}>
        <div className="hair">{title}</div>
        <p className="text-[13px] text-[var(--color-mute)] mt-1 mb-3">{hint}</p>
        <div className="sheet-body">{children}</div>
        <div className="flex gap-2 mt-4">
          <button className="ghost" type="button" onClick={onClose}>
            Annulla
          </button>
          <button className="primary" type="button" disabled={saveDisabled} onClick={onSave}>
            {saveLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

export function CreatePatientDialog({
  open,
  onClose,
  onCreate
}: {
  open: boolean
  onClose: () => void
  onCreate: (p: Partial<PatientProfile>) => void
}) {
  const [draft, setDraft] = useState(() => emptyPatient({ alias: '' }))
  useEffect(() => {
    if (open) setDraft(emptyPatient({ alias: '' }))
  }, [open])
  const canSave =
    Boolean(draft.nome.trim() || draft.cognome.trim()) && (draft.sex === 'M' || draft.sex === 'F')
  return (
    <AnagraficaDialog
      open={open}
      title="Nuovo paziente"
      hint="Sesso: scegli Maschio o Femmina. Gli altri campi puoi lasciarli vuoti; la data di nascita serve all'età per le formule."
      onClose={onClose}
      saveLabel="Salva paziente"
      saveDisabled={!canSave}
      onSave={() => {
        if (!canSave) return
        onCreate(draft)
        onClose()
      }}
    >
      <PatientFields value={draft} onChange={(p) => setDraft((d) => ({ ...d, ...p }))} autoFocusName />
    </AnagraficaDialog>
  )
}

export function EditPatientDialog({
  open,
  patient,
  onClose,
  onSave
}: {
  open: boolean
  patient: PatientProfile | null
  onClose: () => void
  onSave: (p: Partial<PatientProfile> & { id: string }) => void
}) {
  const [draft, setDraft] = useState(() => emptyPatient({ alias: '' }))
  useEffect(() => {
    if (open && patient) setDraft({ ...patient })
  }, [open, patient])
  const canSave =
    Boolean(draft.nome.trim() || draft.cognome.trim()) && (draft.sex === 'M' || draft.sex === 'F')
  if (!patient) return null
  return (
    <AnagraficaDialog
      open={open}
      title="Modifica paziente"
      hint="Sesso: Maschio o Femmina. Gli altri campi puoi lasciarli vuoti."
      onClose={onClose}
      saveLabel="Salva anagrafica"
      saveDisabled={!canSave}
      onSave={() => {
        if (!canSave) return
        onSave({ ...draft, id: patient.id })
        onClose()
      }}
    >
      <PatientFields value={draft} onChange={(p) => setDraft((d) => ({ ...d, ...p }))} autoFocusName />
    </AnagraficaDialog>
  )
}

export function CreateDoctorDialog({
  open,
  onClose,
  onCreate,
  title = 'Nuovo dottore',
  hint = 'Puoi lasciare vuoti i campi che non hai. Servono almeno nome e cognome.',
  saveLabel = 'Salva dottore',
  folderName
}: {
  open: boolean
  onClose: () => void
  onCreate: (d: Partial<DoctorProfile>, folderName?: string) => void
  title?: string
  hint?: string
  saveLabel?: string
  folderName?: boolean
}) {
  const [draft, setDraft] = useState(() => emptyDoctor({ titolo: 'Dott.', qualification: 'Biologo Nutrizionista' }))
  const [wsName, setWsName] = useState('')
  useEffect(() => {
    if (open) {
      setDraft(emptyDoctor({ titolo: 'Dott.', qualification: 'Biologo Nutrizionista' }))
      setWsName('')
    }
  }, [open])
  const canSave = Boolean(draft.nome.trim() && draft.cognome.trim())
  return (
    <AnagraficaDialog
      open={open}
      title={title}
      hint={hint}
      onClose={onClose}
      saveLabel={saveLabel}
      saveDisabled={!canSave}
      onSave={() => {
        if (!canSave) return
        onCreate(draft, folderName ? wsName.trim() || undefined : undefined)
        onClose()
      }}
    >
      {folderName ? (
        <div className="field">
          <label>Nome cartella</label>
          <input
            value={wsName}
            placeholder="Se vuoto: cognome e nome"
            onChange={(e) => setWsName(e.target.value)}
          />
        </div>
      ) : null}
      <DoctorFields value={draft} onChange={(p) => setDraft((d) => ({ ...d, ...p }))} />
    </AnagraficaDialog>
  )
}
