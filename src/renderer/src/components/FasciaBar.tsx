import type { FasciaNormale } from '@shared/engine'
import { boundsCinqueZone, tonoCinqueZone } from '@shared/engine'
import { fmt } from '../lib/format'

const TONO: Record<ReturnType<typeof tonoCinqueZone>, string> = {
  'rosso-inf': 'Rosso inferiore',
  'arancio-inf': 'Arancione inferiore',
  verde: 'Verde · in range',
  'arancio-sup': 'Arancione superiore',
  'rosso-sup': 'Rosso superiore'
}

const FILL: Record<string, string> = {
  redLo: '#b91c1c',
  orangeLo: '#ea580c',
  green: '#0f766e',
  orangeHi: '#d97706',
  redHi: '#b91c1c'
}

export function FasciaBar({ fascia }: { fascia: FasciaNormale }) {
  const z = boundsCinqueZone(fascia)
  const digits = fascia.id === 'whr' || fascia.id === 'whtr' ? 2 : 1
  if (!z) {
    return (
      <div className="fascia-bar">
        <div className="fascia-bar-top">
          <span className="hair">{fascia.titolo}</span>
          <strong>{fmt(fascia.valore, digits)}</strong>
        </div>
        <p className="text-[11px] text-[var(--color-mute)]">Nessuna fascia pubblicata per sesso o età.</p>
      </div>
    )
  }
  const span = z.scaleMax - z.scaleMin || 1
  const pct = (n: number) => `${((n - z.scaleMin) / span) * 100}%`
  const segs = [
    { key: 'redLo', a: z.redLo[0], b: z.redLo[1], fill: FILL.redLo },
    { key: 'orangeLo', a: z.orangeLo[0], b: z.orangeLo[1], fill: FILL.orangeLo },
    { key: 'green', a: z.green[0], b: z.green[1], fill: FILL.green },
    { key: 'orangeHi', a: z.orangeHi[0], b: z.orangeHi[1], fill: FILL.orangeHi },
    { key: 'redHi', a: z.redHi[0], b: z.redHi[1], fill: FILL.redHi }
  ].filter((s) => s.b > s.a + 1e-6)
  const tono = tonoCinqueZone(fascia.valore, z)
  const left = Math.max(0, Math.min(100, ((fascia.valore - z.scaleMin) / span) * 100))

  return (
    <div className="fascia-bar">
      <div className="fascia-bar-top">
        <span className="hair">{fascia.titolo}</span>
        <strong>
          {fmt(fascia.valore, digits)} <span className="fascia-tono">{TONO[tono]}</span>
        </strong>
      </div>
      <div className="fascia-track">
        {segs.map((s) => (
          <div
            key={s.key}
            className="fascia-seg"
            style={{
              left: pct(s.a),
              width: `calc(${pct(s.b)} - ${pct(s.a)})`,
              background: s.fill
            }}
          />
        ))}
        <span className="fascia-wedge" style={{ left }} title={fmt(fascia.valore, digits)} />
      </div>
      <div className="fascia-legend">
        <span>Rosso inf.</span>
        <span>Arancio inf.</span>
        <span className="text-[var(--color-teal)]">Verde</span>
        <span>Arancio sup.</span>
        <span>Rosso sup.</span>
      </div>
      {fascia.fonte || fascia.etichettaFascia ? (
        <p className="text-[11px] text-[var(--color-mute)] mt-1">
          {[fascia.etichettaFascia, fascia.fonte].filter(Boolean).join(' · ')}
        </p>
      ) : null}
    </div>
  )
}
