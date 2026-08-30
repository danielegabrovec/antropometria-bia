import { fmt } from '../lib/format'

export function KpiCard({
  label,
  value,
  unit,
  hint,
  tone,
  d
}: {
  label: string
  value: number | null | undefined
  unit?: string
  hint?: string | null
  tone?: 'dentro' | 'sopra' | 'sotto' | null
  d?: number
}) {
  const digits = d ?? (value != null && Math.abs(value) >= 100 ? 0 : 1)
  return (
    <div className={`kpi ${tone ?? ''}`}>
      <div className="hair">{label}</div>
      <div className="val">
        {fmt(value, digits)}
        {unit ? <span className="ml-1 text-[12px] text-[var(--color-mute)]">{unit}</span> : null}
      </div>
      {hint ? <div className="mt-1 text-[11px] text-[var(--color-mute)]">{hint}</div> : null}
    </div>
  )
}
