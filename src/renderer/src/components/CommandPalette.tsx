import { useMemo, useState } from 'react'
import { MEASURES } from '@shared/catalog/measures'
import { doctorLabel, filterPatients, patientLabel } from '@shared/library'
import { useApp } from '../store/useApp'
import type { ViewId } from '@shared/types'

const VIEWS: { id: ViewId; label: string }[] = [
  { id: 'misura', label: 'Misura' },
  { id: 'analisi', label: 'Analisi' },
  { id: 'biva', label: 'BIVA' },
  { id: 'andamenti', label: 'Andamenti' },
  { id: 'pazienti', label: 'Pazienti' },
  { id: 'dottori', label: 'Dottori' },
  { id: 'archivio', label: 'Archivio' },
  { id: 'report', label: 'Report' },
  { id: 'teoria', label: 'Teoria' },
  { id: 'impostazioni', label: 'Opzioni' },
  { id: 'info', label: 'Info' }
]

export function CommandPalette() {
  const open = useApp((s) => s.paletteOpen)
  const setPalette = useApp((s) => s.setPalette)
  const setView = useApp((s) => s.setView)
  const setPin = useApp((s) => s.setPin)
  const selectPatient = useApp((s) => s.selectPatient)
  const setActiveDoctor = useApp((s) => s.setActiveDoctor)
  const patients = useApp((s) => s.patients)
  const doctors = useApp((s) => s.doctors)
  const [q, setQ] = useState('')

  const hits = useMemo(() => {
    const n = q.trim().toLowerCase()
    return {
      views: VIEWS.filter((v) => !n || v.label.toLowerCase().includes(n)),
      pins: MEASURES.filter((m) => !n || m.label.toLowerCase().includes(n) || m.key.toLowerCase().includes(n)),
      patients: filterPatients(patients, q).slice(0, 8),
      doctors: doctors.filter((d) => doctorLabel(d).toLowerCase().includes(n) || !n).slice(0, 6)
    }
  }, [q, patients, doctors])

  if (!open) return null
  return (
    <div className="overlay" onClick={() => setPalette(false)}>
      <div className="palette" onClick={(e) => e.stopPropagation()}>
        <input
          autoFocus
          placeholder="Vai a una vista, un paziente, un dottore o un sito…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        {hits.views.map((v) => (
          <button
            key={v.id}
            className="hit"
            onClick={() => {
              setView(v.id)
              setPalette(false)
            }}
          >
            <span>{v.label}</span>
            <em className="text-[var(--color-mute)]">Vista</em>
          </button>
        ))}
        {hits.patients.map((p) => (
          <button
            key={p.id}
            className="hit"
            onClick={() => {
              selectPatient(p.id)
              setView('misura')
              setPalette(false)
            }}
          >
            <span>{patientLabel(p)}</span>
            <em className="text-[var(--color-mute)]">Paziente</em>
          </button>
        ))}
        {hits.doctors.map((d) => (
          <button
            key={d.id}
            className="hit"
            onClick={() => {
              setActiveDoctor(d.id)
              setView('dottori')
              setPalette(false)
            }}
          >
            <span>{doctorLabel(d)}</span>
            <em className="text-[var(--color-mute)]">Dottore</em>
          </button>
        ))}
        {hits.pins.slice(0, 10).map((m) => (
          <button
            key={m.key}
            className="hit"
            onClick={() => {
              setView('misura')
              setPin(m.key)
              setPalette(false)
            }}
          >
            <span>{m.label}</span>
            <em className="text-[var(--color-mute)]">{m.unit}</em>
          </button>
        ))}
      </div>
    </div>
  )
}
