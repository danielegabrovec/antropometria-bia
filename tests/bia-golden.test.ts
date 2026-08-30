import { describe, expect, it } from 'vitest'
import {
  calculateJanssenSkeletalMuscle,
  calculateSergiEcw,
  calculateSunBodyComposition,
  calculateBiva,
  createBiaAssessmentV2,
  buildBivaInterpretation,
  buildBivaReferenceBands,
  formatBivaPercentile,
  normalizeBiaSignal,
  BIVA_REFERENCE_PROFILES
} from '@shared/engine/bia'

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
