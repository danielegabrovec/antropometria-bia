export type MeasureCategory = 'circonferenze' | 'pliche' | 'diametri'

export interface MeasureDef {
  key: string
  label: string
  unit: 'cm' | 'mm'
  category: MeasureCategory
}

export const MEASURES: readonly MeasureDef[] = [
  { key: 'torace', label: 'Torace', unit: 'cm', category: 'circonferenze' },
  { key: 'vita', label: 'Vita', unit: 'cm', category: 'circonferenze' },
  { key: 'addome', label: 'Addome', unit: 'cm', category: 'circonferenze' },
  { key: 'fianchi', label: 'Fianchi', unit: 'cm', category: 'circonferenze' },
  { key: 'braccio', label: 'Braccio rilassato', unit: 'cm', category: 'circonferenze' },
  { key: 'braccioContratto', label: 'Braccio contratto', unit: 'cm', category: 'circonferenze' },
  { key: 'avambraccio', label: 'Avambraccio', unit: 'cm', category: 'circonferenze' },
  { key: 'polso', label: 'Polso', unit: 'cm', category: 'circonferenze' },
  { key: 'radiceCoscia', label: 'Radice coscia', unit: 'cm', category: 'circonferenze' },
  { key: 'cosciaProssimale', label: 'Coscia prossimale', unit: 'cm', category: 'circonferenze' },
  { key: 'cosciaMedia', label: 'Coscia media', unit: 'cm', category: 'circonferenze' },
  { key: 'cosciaDistale', label: 'Coscia distale', unit: 'cm', category: 'circonferenze' },
  { key: 'sopraPatellare', label: 'Sopra patellare', unit: 'cm', category: 'circonferenze' },
  { key: 'polpaccio', label: 'Polpaccio', unit: 'cm', category: 'circonferenze' },
  { key: 'plicaTricipite', label: 'Plica tricipitale', unit: 'mm', category: 'pliche' },
  { key: 'plicaBicipite', label: 'Plica bicipitale', unit: 'mm', category: 'pliche' },
  { key: 'plicaPettorale', label: 'Plica pettorale', unit: 'mm', category: 'pliche' },
  { key: 'plicaAscellare', label: 'Plica ascellare', unit: 'mm', category: 'pliche' },
  { key: 'plicaSottoscapolare', label: 'Plica sottoscapolare', unit: 'mm', category: 'pliche' },
  { key: 'plicaAddominale', label: 'Plica addominale', unit: 'mm', category: 'pliche' },
  { key: 'plicaSovrailiaca', label: 'Plica sovrailiaca', unit: 'mm', category: 'pliche' },
  { key: 'plicaAnterioreCoscia', label: 'Plica anteriore coscia', unit: 'mm', category: 'pliche' },
  { key: 'plicaPosterioreCoscia', label: 'Plica posteriore coscia', unit: 'mm', category: 'pliche' },
  { key: 'plicaInternoCoscia', label: 'Plica interno coscia', unit: 'mm', category: 'pliche' },
  { key: 'plicaSopraPatellare', label: 'Plica sopra patellare', unit: 'mm', category: 'pliche' },
  { key: 'plicaPolpaccio', label: 'Plica polpaccio', unit: 'mm', category: 'pliche' },
  { key: 'diametroSagittale', label: 'Diametro sagittale', unit: 'cm', category: 'diametri' },
  { key: 'diametroGomito', label: 'Diametro gomito', unit: 'cm', category: 'diametri' },
  { key: 'diametroPolso', label: 'Diametro polso', unit: 'cm', category: 'diametri' },
  { key: 'diametroGinocchio', label: 'Diametro ginocchio', unit: 'cm', category: 'diametri' },
  { key: 'diametroCaviglia', label: 'Diametro caviglia', unit: 'cm', category: 'diametri' }
]

export const MEASURE_BY_KEY = Object.fromEntries(MEASURES.map((m) => [m.key, m])) as Record<
  string,
  MeasureDef
>

export const ESSENTIAL_GIRTHS = ['vita', 'fianchi', 'braccio'] as const
export const ISAK_GIRTHS = [
  'torace',
  'vita',
  'fianchi',
  'braccio',
  'braccioContratto',
  'avambraccio',
  'cosciaMedia',
  'polpaccio'
] as const

export const PRESET_LABELS: Record<string, string> = {
  essenziale: 'Essenziale',
  formula: 'Per formula',
  isak: 'ISAK ristretto',
  avanzato: 'Avanzato'
}

export function defaultGirths(preset: string): string[] {
  if (preset === 'isak') return [...ISAK_GIRTHS]
  if (preset === 'avanzato')
    return MEASURES.filter((m) => m.category === 'circonferenze').map((m) => m.key)
  return [...ESSENTIAL_GIRTHS]
}
