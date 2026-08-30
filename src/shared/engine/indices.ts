import type { Sex } from '../types'

export function calculateBmi(pesoKg: number, altezzaCm: number): number | null {
  const h = altezzaCm / 100
  if (!(pesoKg > 0) || !(h > 0)) return null
  return pesoKg / (h * h)
}

export function classifyBmi(bmi: number | null): { label: string; tone: 'ok' | 'warn' | 'bad' | 'muted' } {
  if (bmi == null) return { label: '—', tone: 'muted' }
  if (bmi < 18.5) return { label: 'Sottopeso', tone: 'warn' }
  if (bmi < 25) return { label: 'Normopeso', tone: 'ok' }
  if (bmi < 30) return { label: 'Sovrappeso', tone: 'warn' }
  if (bmi < 35) return { label: 'Obesità I', tone: 'bad' }
  if (bmi < 40) return { label: 'Obesità II', tone: 'bad' }
  return { label: 'Obesità III', tone: 'bad' }
}

export function calculateWhr(vitaCm: number, fianchiCm: number): number | null {
  if (!(vitaCm > 0) || !(fianchiCm > 0)) return null
  return vitaCm / fianchiCm
}

export function calculateWhtr(vitaCm: number, altezzaCm: number): number | null {
  if (!(vitaCm > 0) || !(altezzaCm > 0)) return null
  return vitaCm / altezzaCm
}

export function calculateAbsi(vitaCm: number, altezzaCm: number, pesoKg: number): number | null {
  if (!(vitaCm > 0) || !(altezzaCm > 0) || !(pesoKg > 0)) return null
  const hM = altezzaCm / 100
  const bmi = pesoKg / (hM * hM)
  return vitaCm / 100 / (Math.pow(bmi, 2 / 3) * Math.pow(hM, 0.5))
}

export function calculateConicityIndex(vitaCm: number, altezzaCm: number, pesoKg: number): number | null {
  if (!(vitaCm > 0) || !(altezzaCm > 0) || !(pesoKg > 0)) return null
  const hM = altezzaCm / 100
  return vitaCm / 100 / (0.109 * Math.sqrt(pesoKg / hM))
}

export function calculateRfm(vitaCm: number, altezzaCm: number, sesso: Sex | null): number | null {
  if (!(vitaCm > 0) || !(altezzaCm > 0) || (sesso !== 'M' && sesso !== 'F')) return null
  return 64 - 20 * (altezzaCm / vitaCm) + 12 * (sesso === 'M' ? 0 : 1)
}

export function calculateDuBois(pesoKg: number, altezzaCm: number): number | null {
  if (!(pesoKg > 0) || !(altezzaCm > 0)) return null
  return 0.007184 * Math.pow(pesoKg, 0.425) * Math.pow(altezzaCm, 0.725)
}

export function calculateMosteller(pesoKg: number, altezzaCm: number): number | null {
  if (!(pesoKg > 0) || !(altezzaCm > 0)) return null
  return Math.sqrt((pesoKg * altezzaCm) / 3600)
}

export function calculateBrozek(densita: number): number | null {
  if (!(densita > 0)) return null
  return (4.57 / densita - 4.142) * 100
}

export function calculateSiri(densita: number): number | null {
  if (!(densita > 0)) return null
  return 495 / densita - 450
}

export function calculateArtometriaBraccio(input: {
  circBraccioCm: number
  plicaTricipiteMm: number
  sesso: Sex | null
}): { afa: number; amc: number; ama: number } | null {
  const { circBraccioCm, plicaTricipiteMm, sesso } = input
  if (!(circBraccioCm > 0) || !(plicaTricipiteMm > 0)) return null
  if (sesso !== 'M' && sesso !== 'F') return null
  const tricCm = plicaTricipiteMm / 10
  const amc = circBraccioCm - Math.PI * tricCm
  const amaRaw = Math.pow(amc, 2) / (4 * Math.PI)
  const ama = Math.max(0, amaRaw - (sesso === 'F' ? 6.5 : 10))
  const cmTotale = Math.PI * Math.pow(circBraccioCm / (2 * Math.PI), 2)
  const afa = Math.max(0, cmTotale - amaRaw)
  return { afa, amc, ama }
}

export function calculateHeymsfieldSMM(input: {
  circBraccioCm: number
  plicaTricipiteMm: number
  altezzaCm: number
  sesso: Sex | null
}): { ama: number; smm: number } | null {
  const art = calculateArtometriaBraccio(input)
  if (!art || !(input.altezzaCm > 0)) return null
  return { ama: art.ama, smm: input.altezzaCm * (0.0264 + 0.0029 * art.ama) }
}

export const EQ_SUPERFICIE_OPTIONS = [
  { value: 'DuBois' as const, label: 'DuBois' },
  { value: 'Mosteller' as const, label: 'Mosteller' }
]

export const PESO_TEORICO_OPTIONS = [
  { value: 'BMI' as const, label: 'BMI 22' },
  { value: 'Lorenz' as const, label: 'Lorenz' },
  { value: 'Broca' as const, label: 'Broca' },
  { value: 'Devine' as const, label: 'Devine' },
  { value: 'Robinson' as const, label: 'Robinson' },
  { value: 'Hamwi' as const, label: 'Hamwi' }
]

export function calculatePesoIdeale(
  formula: 'BMI' | 'Lorenz' | 'Broca' | 'Devine' | 'Robinson' | 'Hamwi',
  altezzaCm: number,
  sesso: Sex | null
): number | null {
  if (!(altezzaCm > 0)) return null
  const hM = altezzaCm / 100
  const inchOver60 = Math.max(0, altezzaCm / 2.54 - 60)
  switch (formula) {
    case 'BMI':
      return 22 * hM * hM
    case 'Broca':
      return altezzaCm - 100
    case 'Lorenz':
      if (sesso !== 'M' && sesso !== 'F') return null
      return sesso === 'F' ? altezzaCm - 100 - (altezzaCm - 150) / 2 : altezzaCm - 100 - (altezzaCm - 150) / 4
    case 'Devine':
      if (sesso !== 'M' && sesso !== 'F') return null
      return sesso === 'F' ? 45.5 + 2.3 * inchOver60 : 50 + 2.3 * inchOver60
    case 'Robinson':
      if (sesso !== 'M' && sesso !== 'F') return null
      return sesso === 'F' ? 49 + 1.7 * inchOver60 : 52 + 1.9 * inchOver60
    case 'Hamwi':
      if (sesso !== 'M' && sesso !== 'F') return null
      return sesso === 'F' ? 45.5 + 2.2 * inchOver60 : 48 + 2.7 * inchOver60
  }
}

export function calculateHealthCarter(input: {
  pesoKg: number
  altezzaCm: number
  plicaTricipiteMm: number
  plicaSottoscapolareMm: number
  plicaSovrailiacaMm: number
  plicaPolpaccioMm: number
  diametroOmeroCm: number
  diametroFemoreCm: number
  circBraccioContrattoCm: number
  circPolpaccioCm: number
}): { endo: number; meso: number; ecto: number; classificazione: string } | null {
  const {
    pesoKg,
    altezzaCm,
    plicaTricipiteMm,
    plicaSottoscapolareMm,
    plicaSovrailiacaMm,
    plicaPolpaccioMm,
    diametroOmeroCm,
    diametroFemoreCm,
    circBraccioContrattoCm,
    circPolpaccioCm
  } = input
  const required = [
    pesoKg,
    altezzaCm,
    plicaTricipiteMm,
    plicaSottoscapolareMm,
    plicaSovrailiacaMm,
    plicaPolpaccioMm,
    diametroOmeroCm,
    diametroFemoreCm,
    circBraccioContrattoCm,
    circPolpaccioCm
  ]
  if (required.some((v) => !(v > 0))) return null
  const x = (plicaTricipiteMm + plicaSottoscapolareMm + plicaSovrailiacaMm) * (170.18 / altezzaCm)
  const endo = -0.7182 + 0.1451 * x - 0.00068 * x * x + 0.0000014 * x * x * x
  const meso =
    0.858 * diametroOmeroCm +
    0.601 * diametroFemoreCm +
    0.188 * (circBraccioContrattoCm - plicaTricipiteMm / 10) +
    0.161 * (circPolpaccioCm - plicaPolpaccioMm / 10) -
    altezzaCm * 0.131 +
    4.5
  const hwr = altezzaCm / Math.cbrt(pesoKg)
  const ecto = hwr >= 40.75 ? 0.732 * hwr - 28.58 : hwr > 38.25 ? 0.463 * hwr - 17.63 : 0.1
  const dominante = Math.max(endo, meso, ecto)
  let classificazione = 'Bilanciato'
  if (dominante === endo && endo - Math.max(meso, ecto) >= 0.5) classificazione = 'Endomorfo'
  else if (dominante === meso && meso - Math.max(endo, ecto) >= 0.5) classificazione = 'Mesomorfo'
  else if (dominante === ecto && ecto - Math.max(endo, meso) >= 0.5) classificazione = 'Ectomorfo'
  return {
    endo: Math.max(0, +endo.toFixed(2)),
    meso: Math.max(0, +meso.toFixed(2)),
    ecto: Math.max(0, +ecto.toFixed(2)),
    classificazione
  }
}
