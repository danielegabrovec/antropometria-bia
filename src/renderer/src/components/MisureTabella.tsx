import { useEffect, useRef } from 'react'
import type { MeasureCategory } from '@shared/catalog/measures'
import { MEASURES } from '@shared/catalog/measures'
import { fmtDelta, parsePositive } from '../lib/format'

const GROUPS: Array<{ id: MeasureCategory; label: string }> = [
  { id: 'circonferenze', label: 'Circonferenze' },
  { id: 'pliche', label: 'Pliche' },
  { id: 'diametri', label: 'Diametri' }
]

export function MisureTabella({
  visitId,
  values,
  prev,
  selectedKey,
  requiredKeys,
  visibleKeys,
  formulaLabel,
  presetLabel,
  hiddenStored,
  onSelect,
  onChange
}: {
  visitId: string
  values: Record<string, number | null>
  prev: Record<string, number | null> | null
  selectedKey: string | null
  requiredKeys: Set<string>
  visibleKeys: readonly string[]
  formulaLabel: string
  presetLabel: string
  hiddenStored: number
  onSelect: (key: string) => void
  onChange: (key: string, n: number | null) => void
}) {
  const rowRefs = useRef<Record<string, HTMLTableRowElement | null>>({})
  const visible = new Set(visibleKeys)

  useEffect(() => {
    if (!selectedKey) return
    const row = rowRefs.current[selectedKey]
    if (!row) return
    row.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
    const input = row.querySelector('input')
    if (input && document.activeElement !== input) input.focus()
  }, [selectedKey])

  return (
    <div className="misure-panel">
      <div className="hair" style={{ padding: '8px 10px 4px' }}>
        Tabella misure
      </div>
      <p className="text-[11px] text-[var(--color-mute)] px-2.5 mb-1">
        Solo {formulaLabel} · preset {presetLabel}. Compila qui o sull’omino. Cambiando metodo i
        valori già inseriti restano.
        {hiddenStored > 0
          ? ` ${hiddenStored} ${hiddenStored === 1 ? 'misura' : 'misure'} di un altro metodo ${hiddenStored === 1 ? 'resta' : 'restano'} salvata${hiddenStored === 1 ? '' : 'e'}.`
          : ''}
      </p>
      <table className="data misure-tabella">
        <thead>
          <tr>
            <th>Sito</th>
            <th>Valore</th>
            <th>Δ</th>
          </tr>
        </thead>
        <tbody>
          {GROUPS.flatMap((g) => {
            const rows = MEASURES.filter((m) => m.category === g.id && visible.has(m.key))
            if (rows.length === 0) return []
            return [
              <tr key={`h-${g.id}`} className="misura-group">
                <td colSpan={3}>{g.label}</td>
              </tr>,
              ...rows.map((m) => {
                const cur = values[m.key] ?? null
                const rif = prev?.[m.key] ?? null
                const warn = requiredKeys.has(m.key) && cur == null
                const sel = selectedKey === m.key
                return (
                  <tr
                    key={m.key}
                    ref={(el) => {
                      rowRefs.current[m.key] = el
                    }}
                    data-misura-row={m.key}
                    className={`misura-row ${sel ? 'sel' : ''} ${warn ? 'warn' : ''}`}
                    onClick={() => onSelect(m.key)}
                  >
                    <td>
                      {m.label} <span className="text-[var(--color-mute)]">{m.unit}</span>
                    </td>
                    <td>
                      <input
                        type="number"
                        min="0.01"
                        max="500"
                        step="0.1"
                        inputMode="decimal"
                        key={`${visitId}-${m.key}-${cur ?? ''}`}
                        defaultValue={cur == null ? '' : String(cur)}
                        onFocus={() => onSelect(m.key)}
                        onClick={(e) => e.stopPropagation()}
                        onBlur={(e) => onChange(m.key, parsePositive(e.target.value))}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') (e.target as HTMLInputElement).blur()
                        }}
                      />
                    </td>
                    <td className="num">{cur != null && rif != null ? fmtDelta(cur - rif) : '—'}</td>
                  </tr>
                )
              })
            ]
          })}
        </tbody>
      </table>
    </div>
  )
}
