import { BODY_ANCHORS, heatColor, type BodyModelVariant, type QuotaDistretto } from '@shared/engine'
import maleImg from '../assets/body-models/male-front-back.png'
import femaleImg from '../assets/body-models/female-front-back.png'

const MODELS: Record<BodyModelVariant, string> = {
  male: maleImg,
  female: femaleImg
}

export interface PinFigura {
  key: string
  label: string
  categoria: 'circonferenze' | 'pliche'
  valorizzato?: boolean
  richiesta?: boolean
  previous?: boolean
}

export default function FiguraCorpo({
  variant,
  vista,
  pins,
  quote,
  onPinClick,
  etichetta,
  selectedKey
}: {
  variant: BodyModelVariant
  vista: 'fronte' | 'retro'
  pins: readonly PinFigura[]
  quote?: readonly QuotaDistretto[] | null
  onPinClick?: (key: string) => void
  etichetta?: string
  selectedKey?: string | null
}) {
  const anchors = BODY_ANCHORS[variant]
  const suQuestaVista = (nx: number) => (vista === 'fronte' ? nx < 0.5 : nx >= 0.5)
  const nxLocale = (nx: number) => (vista === 'fronte' ? nx * 2 : nx * 2 - 1)
  const formatoPct = new Intl.NumberFormat('it-IT', { maximumFractionDigits: 0 })
  const distrettoPin: Record<string, string> = {
    'Arti superiori': 'plicaTricipite',
    Torace: 'plicaPettorale',
    Dorsale: 'plicaSottoscapolare',
    Addominale: 'plicaAddominale',
    'Arti inferiori': 'plicaAnterioreCoscia'
  }

  return (
    <div className="relative min-w-0 overflow-hidden rounded-sm border border-[var(--color-line)] bg-[#0a101c]" style={{ aspectRatio: '1050 / 1400' }}>
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          backgroundImage: `url(${MODELS[variant]})`,
          backgroundSize: '200% 100%',
          backgroundPosition: vista === 'fronte' ? '0% 0' : '100% 0'
        }}
      />
      {(quote ?? []).map((quota) => {
        const ancora = anchors[distrettoPin[quota.distretto] ?? '']
        if (!ancora || !suQuestaVista(ancora.nx)) return null
        const colore = heatColor(quota.pct)
        return (
          <div
            key={`heat-${quota.distretto}`}
            aria-hidden
            className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2"
            style={{ left: `${nxLocale(ancora.nx) * 100}%`, top: `${ancora.ny * 100}%` }}
          >
            <div className="h-16 w-16 rounded-full" style={{ backgroundColor: colore, opacity: 0.26 }} />
            <span
              className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-full whitespace-nowrap text-[11px] font-extrabold"
              style={{ color: colore, textShadow: '0 0 3px #0b1220, 0 0 3px #0b1220' }}
            >
              {formatoPct.format(quota.pct)}%
            </span>
          </div>
        )
      })}
      {pins.map((pin) => {
        const ancora = anchors[pin.key]
        if (!ancora || !suQuestaVista(ancora.nx)) return null
        const colore = pin.categoria === 'pliche' ? '#a78bfa' : '#2dd4bf'
        const selected = selectedKey === pin.key
        return (
          <button
            key={pin.key + (pin.previous ? '-prev' : '')}
            type="button"
            data-mappa-pin={pin.key}
            title={pin.label}
            aria-label={`${pin.label}: vai al campo`}
            onClick={() => onPinClick?.(pin.key)}
            className="absolute h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2"
            style={{
              left: `${nxLocale(ancora.nx) * 100}%`,
              top: `${ancora.ny * 100}%`,
              backgroundColor: pin.previous ? 'transparent' : pin.valorizzato === false ? '#0b1220' : colore,
              borderColor: pin.previous ? '#93a0b5' : selected ? '#d4a574' : pin.valorizzato === false ? colore : '#e8edf5',
              borderStyle: pin.previous ? 'dashed' : 'solid',
              boxShadow: pin.richiesta && !pin.previous ? `0 0 0 3px ${colore}44` : undefined,
              zIndex: selected ? 3 : 1
            }}
          />
        )
      })}
      {etichetta ? (
        <span className="absolute bottom-1 left-1/2 -translate-x-1/2 rounded-sm bg-[#0b1220]/80 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[var(--color-mute)]">
          {etichetta}
        </span>
      ) : null}
    </div>
  )
}
