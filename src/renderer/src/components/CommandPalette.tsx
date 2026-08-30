import { useMemo, useState } from 'react'
import { MEASURES } from '@shared/catalog/measures'
import { useApp } from '../store/useApp'

const VIEWS = [
  { id: 'misura', label: 'Misura' },
  { id: 'analisi', label: 'Analisi' },
  { id: 'biva', label: 'BIVA' },
  { id: 'andamenti', label: 'Andamenti' },
  { id: 'profili', label: 'Profili' },
  { id: 'archivio', label: 'Archivio' },
  { id: 'report', label: 'Report' },
  { id: 'teoria', label: 'Teoria' }
] as const

export function CommandPalette() {
  const open = useApp((s) => s.paletteOpen)
  const setPalette = useApp((s) => s.setPalette)
  const setView = useApp((s) => s.setView)
  const setPin = useApp((s) => s.setPin)
  const [q, setQ] = useState('')

  const hits = useMemo(() => {
    const n = q.trim().toLowerCase()
    const views = VIEWS.filter((v) => !n || v.label.toLowerCase().includes(n))
    const pins = MEASURES.filter((m) => !n || m.label.toLowerCase().includes(n) || m.key.toLowerCase().includes(n))
    return { views, pins }
  }, [q])

  if (!open) return null
  return (
    <div className="overlay" onClick={() => setPalette(false)}>
      <div className="palette" onClick={(e) => e.stopPropagation()}>
        <input
          autoFocus
          placeholder="Vai a una vista o a un sito di misura…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        {hits.views.map((v) => (
          <button
            key={v.id}
            className="hit"
            onClick={() => {
              setView(v.id as 'misura' | 'analisi' | 'biva' | 'andamenti' | 'profili' | 'archivio' | 'report' | 'teoria')
              setPalette(false)
            }}
          >
            <span>{v.label}</span>
            <em className="text-[var(--color-mute)]">Vista</em>
          </button>
        ))}
        {hits.pins.slice(0, 12).map((m) => (
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
