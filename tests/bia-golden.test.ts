import { describe, expect, it } from 'vitest'
import {
  calculateJanssenSkeletalMuscle,
  calculateSergiEcw,
  calculateSunBodyComposition,
  calculateBiva,
  createBiaAssessmentV2,
  buildBivaEllipse,
  buildBivaInterpretation,
  buildBivaReferenceBands,
  bivaPlotRange,
  formatBivaPercentile,
  normalizeBiaSignal,
  selectBivaReference,
  BIVA_REFERENCE_PROFILES
} from '@shared/engine/bia'
import { bivaChartSvg } from '@shared/export/biva-svg'

const subject = {
  ageYears: 37,
  sexForEquation: 'M' as const,
  heightCm: 183,
  weightKg: 89
}

const signalInput = {
  kind: 'R_XC' as const,
  resistanceOhm: 391.9,
  reactanceOhm: 80,
  frequencyKhz: 50,
  measurementSite: 'whole_body' as const
}

function goldenSignal() {
  const normalized = normalizeBiaSignal(signalInput)
  if (!normalized.ok) throw new Error('segnale golden non valido')
  return normalized.signal
}

describe('golden case audit 09/08/2026', () => {
  it('riproduce angolo di fase, Sun, Janssen e Sergi', () => {
    const signal = goldenSignal()
    expect(signal.phaseAngleDeg).toBeCloseTo(11.5375, 3)
    const sun = calculateSunBodyComposition(signal, subject)
    expect(sun?.tbw.value).toBeCloseTo(55.2354, 3)
    expect(sun?.ffm.value).toBeCloseTo(74.2338, 3)
    expect(sun?.fm.value).toBeCloseTo(14.7662, 3)
    const janssen = calculateJanssenSkeletalMuscle(signal, subject)
    expect(janssen?.skeletalMuscleMass.value).toBeCloseTo(40.5666, 3)
    const ecw = calculateSergiEcw(signal, subject)
    expect(ecw?.value).toBeCloseTo(22.9836, 3)
  })

  it('non sintetizza BCM', () => {
    const assessment = createBiaAssessmentV2({ signal: signalInput, subject })
    expect(assessment.metrics.bcm).toBeUndefined()
    expect(assessment.metrics.ecm).toBeUndefined()
  })

  it("l'assessment deriva ICW", () => {
    const assessment = createBiaAssessmentV2({ signal: signalInput, subject })
    expect(assessment.metrics.ecw?.value).toBeCloseTo(22.9836, 3)
    expect(assessment.metrics.icw?.value).toBeCloseTo(32.2517, 3)
  })

  it('percentile di fase non dice 100', () => {
    const male = BIVA_REFERENCE_PROFILES.find((item) => item.id === 'it-general-2023-m')!
    const result = calculateBiva({
      signal: goldenSignal(),
      heightCm: subject.heightCm,
      reference: male
    })!
    expect(buildBivaInterpretation(result)).not.toContain('percentile stimato 100')
    const phaseBand = buildBivaReferenceBands(result).find((band) => band.id === 'phase_angle')
    expect(phaseBand?.detail).not.toContain('percentile 100')
  })
})

describe('formatBivaPercentile', () => {
  it('clampa gli estremi', () => {
    expect(formatBivaPercentile(50)).toBe('50')
    expect(formatBivaPercentile(99.99997)).toBe('>99,9')
    expect(formatBivaPercentile(Number.NaN)).toBe('—')
  })
})

describe('BIVA Piccoli / Campa 2023', () => {
  const male = BIVA_REFERENCE_PROFILES.find((item) => item.id === 'it-general-2023-m')!
  const female = BIVA_REFERENCE_PROFILES.find((item) => item.id === 'it-general-2023-f')!

  it('tiene i coefficienti Campa 2023 (n, medie, DS, r) senza arrotondarli a decine', () => {
    expect(male).toMatchObject({
      meanRH: 265.7,
      sdRH: 35.1,
      meanXcH: 32.1,
      sdXcH: 4.9,
      correlation: 0.6,
      sampleSize: 2137,
      version: 'Campa-2023'
    })
    expect(female).toMatchObject({
      meanRH: 337.2,
      sdRH: 47.8,
      meanXcH: 35.9,
      sdXcH: 5.5,
      correlation: 0.67,
      sampleSize: 2230
    })
  })

  it('usa χ² a 2 g.d.l. per l’ellisse 95% (−2 ln 0,05)', () => {
    const ellipse = buildBivaEllipse(male, 0.95, 64)
    expect(ellipse.chiSquare).toBeCloseTo(-2 * Math.log(0.05), 10)
    expect(ellipse.points[0]?.rH).toBeCloseTo(ellipse.points.at(-1)!.rH, 10)
  })

  it('non estende le ellissi adulte a 16–17 né oltre 65 anni', () => {
    expect(selectBivaReference({ sex: 'M', ageYears: 17 }).reference).toBeNull()
    expect(selectBivaReference({ sex: 'M', ageYears: 66 }).reference).toBeNull()
    expect(selectBivaReference({ sex: 'M', ageYears: 18 }).reference?.id).toBe('it-general-2023-m')
  })

  it('piazza il vettore del caso studio (R/H 354,7 · Xc/H 19,1) oltre il 95% in area a ridotta cellularità', () => {
    const heightM = 1.83
    const signal = normalizeBiaSignal({
      kind: 'R_XC',
      resistanceOhm: 354.7 * heightM,
      reactanceOhm: 19.1 * heightM,
      frequencyKhz: 50,
      measurementSite: 'whole_body'
    })
    if (!signal.ok) throw new Error('segnale caso studio non valido')
    const result = calculateBiva({
      signal: signal.signal,
      heightCm: 183,
      reference: male
    })!
    expect(result.rH).toBeCloseTo(354.7, 1)
    expect(result.xcH).toBeCloseTo(19.1, 1)
    expect(result.zone).toBe('outside_95')
    expect(result.phenotype.id).toBe('lower_hydration_lower_cellularity')
    const bands = buildBivaReferenceBands(result)
    expect(bands.map((b) => b.id)).toEqual(['ellipse', 'phase_angle', 'hydration_axis', 'cellularity_axis'])
    expect(bands[0]?.tone).toBe('outside')
  })

  it('il dominio del grafico è padding Nutriva, non assi agganciati a 10/5', () => {
    const heightM = 1.83
    const signal = normalizeBiaSignal({
      kind: 'R_XC',
      resistanceOhm: 354.7 * heightM,
      reactanceOhm: 19.1 * heightM,
      frequencyKhz: 50,
      measurementSite: 'whole_body'
    })
    if (!signal.ok) throw new Error('segnale caso studio non valido')
    const result = calculateBiva({
      signal: signal.signal,
      heightCm: 183,
      reference: male
    })!
    const domain = bivaPlotRange(result)
    const xs = result.ellipses.flatMap((e) => e.points.map((p) => p.rH))
    const ys = result.ellipses.flatMap((e) => e.points.map((p) => p.xcH))
    const rawXMin = Math.min(...xs, result.rH)
    const rawXMax = Math.max(...xs, result.rH)
    const rawYMin = Math.min(...ys, result.xcH)
    const rawYMax = Math.max(...ys, result.xcH)
    expect(domain.rMin).toBeCloseTo(rawXMin - Math.max((rawXMax - rawXMin) * 0.1, 12), 8)
    expect(domain.rMax).toBeCloseTo(rawXMax + Math.max((rawXMax - rawXMin) * 0.1, 12), 8)
    expect(domain.xMin).toBeCloseTo(rawYMin - Math.max((rawYMax - rawYMin) * 0.14, 3), 8)
    expect(domain.xMax).toBeCloseTo(rawYMax + Math.max((rawYMax - rawYMin) * 0.14, 3), 8)
  })

  it('l’SVG etichetta gli assi R/H e Xc/H, non l’idratazione sul cartesiano', () => {
    const heightM = 1.8
    const signal = normalizeBiaSignal({
      kind: 'R_XC',
      resistanceOhm: male.meanRH * heightM,
      reactanceOhm: male.meanXcH * heightM,
      frequencyKhz: 50,
      measurementSite: 'whole_body'
    })
    if (!signal.ok) throw new Error('segnale centro non valido')
    const result = calculateBiva({
      signal: signal.signal,
      heightCm: 180,
      reference: male
    })!
    const svg = bivaChartSvg(result)
    expect(svg).toContain('R/H (Ω/m)')
    expect(svg).toContain('Xc/H (Ω/m)')
    expect(svg).not.toContain('minore idratazione')
    expect(svg).not.toContain('Area atletica')
  })
})
