import { describe, expect, it } from 'vitest'
import { calcolaPlicometriaStrict } from '@shared/engine/plicometria'
import { blandAltman, slopePerWeek } from '@shared/engine/stats'
import { calculateBmi, calculateWhr } from '@shared/engine/indices'
import { formulaValidataPerEta } from '@shared/engine/formule-per-eta'
import {
  calcolaCunninghamBmr,
  calcolaEta,
  calcolaHarrisBenedictBmr,
  calcolaKatchMcArdleBmr,
  calcolaMifflinStJeorBmr,
  calcolaTdee,
  LAF_LARN_2024,
  motivoBmrMancante
} from '@shared/engine/energia'
import { parseSex } from '@shared/library'
import {
  countHiddenStoredMeasures,
  defaultGirths,
  visibleMeasureKeys
} from '@shared/catalog/measures'
import { skinfoldStateKeysFor } from '@shared/engine/skinfold-sites'
import { boundsCinqueZone, fasciaBmi, fasciaMassaGrassa, tonoCinqueZone } from '@shared/engine/fasce-normalita'
import { bivaAxisTicks } from '@shared/engine/bia'

describe('plicometria strict', () => {
  it('JP7 uomo produce densità e FM%', () => {
    const r = calcolaPlicometriaStrict(
      {
        formula: 'JP7',
        petto: 6,
        ascellare: 12,
        tricipite: 8,
        sottoscapolare: 14,
        addome: 12,
        sovrailiaca: 8,
        coscia: 8
      },
      'M',
      37,
      89,
      { fuoriValidita: 'calcola' }
    )
    expect(r).not.toBeNull()
    expect(r!.grassoPct).toBeGreaterThan(5)
    expect(r!.grassoPct).toBeLessThan(25)
    expect(r!.fuoriValidita).toBeUndefined()
  })

  it('fuori finestra calcola con riserva', () => {
    const r = calcolaPlicometriaStrict(
      {
        formula: 'JP3',
        petto: 10,
        addome: 20,
        coscia: 12
      },
      'M',
      70,
      80,
      { fuoriValidita: 'calcola' }
    )
    expect(r?.fuoriValidita?.eta).toBe(70)
  })

  it('senza un sito non calcola', () => {
    const r = calcolaPlicometriaStrict(
      { formula: 'JP3', petto: 10, addome: 20 },
      'M',
      30,
      80,
      { fuoriValidita: 'calcola' }
    )
    expect(r).toBeNull()
  })
})

describe('indici e stats', () => {
  it('BMI e WHR', () => {
    expect(calculateBmi(89, 183)).toBeCloseTo(26.58, 1)
    expect(calculateWhr(90, 100)).toBeCloseTo(0.9, 5)
  })

  it('JP donna 57 anni non è validata, DW4 sì', () => {
    expect(formulaValidataPerEta('JP7', 'F', 57)).toBe(false)
    expect(formulaValidataPerEta('DW4', 'F', 57)).toBe(true)
  })

  it('Bland-Altman e pendenza', () => {
    const ba = blandAltman([
      { a: 20, b: 18 },
      { a: 22, b: 21 },
      { a: 19, b: 19 }
    ])
    expect(ba?.points).toHaveLength(3)
    const sl = slopePerWeek([
      { t: Date.parse('2026-01-01'), y: 80 },
      { t: Date.parse('2026-01-29'), y: 78 }
    ])
    expect(sl).not.toBeNull()
    expect(sl!).toBeCloseTo(-0.5, 2)
  })
})

describe('sesso età e dispendio', () => {
  it('parseSex accetta solo Maschio o Femmina', () => {
    expect(parseSex('M')).toBe('M')
    expect(parseSex('Femmina')).toBe('F')
    expect(parseSex('Altro')).toBeNull()
    expect(parseSex('')).toBeNull()
  })

  it('età agli anni compiuti sulla data di visita', () => {
    expect(calcolaEta('1989-03-15', new Date('2026-03-14'))).toBe(36)
    expect(calcolaEta('1989-03-15', new Date('2026-03-15'))).toBe(37)
    expect(calcolaEta(null)).toBe(0)
  })

  it('quattro BMR e TDEE LARN', () => {
    expect(calcolaHarrisBenedictBmr(70, 175, 30, 'M')).toBeCloseTo(1695.667, 3)
    expect(calcolaMifflinStJeorBmr(60, 165, 30, 'F')).toBeCloseTo(1320.25, 2)
    expect(calcolaKatchMcArdleBmr(50)).toBeCloseTo(1450, 8)
    expect(calcolaCunninghamBmr(50)).toBeCloseTo(1600, 8)
    expect(calcolaTdee(1600, 1.55)).toBeCloseTo(2480, 8)
    expect(LAF_LARN_2024.pocoattivo).toBe(1.55)
  })

  it('senza sesso Maschio/Femmina il BMR non esce', () => {
    expect(calcolaMifflinStJeorBmr(70, 175, 30, null)).toBe(0)
    expect(motivoBmrMancante({ pesoKg: 70, altezzaCm: 175, etaAnni: 30, sesso: null })).toMatch(/sesso/i)
  })
})

describe('siti visibili per metodo', () => {
  it('la tabella segue la formula e il preset, senza cancellare i valori nascosti', () => {
    const jp7 = skinfoldStateKeysFor('JP7', 'M')
    const visJp7 = visibleMeasureKeys('essenziale', defaultGirths('essenziale'), jp7)
    expect(visJp7.filter((k) => k.startsWith('plica'))).toHaveLength(7)
    expect(visJp7).toContain('vita')
    expect(visJp7).toContain('addome')
    expect(visibleMeasureKeys('essenziale', ['vita', 'fianchi', 'braccio'], jp7)).toContain('addome')
    expect(visJp7).not.toContain('plicaBicipite')
    expect(visJp7).not.toContain('diametroGomito')

    const dw4 = skinfoldStateKeysFor('DW4', 'M')
    const visDw = visibleMeasureKeys('essenziale', defaultGirths('essenziale'), dw4)
    expect(visDw.filter((k) => k.startsWith('plica'))).toHaveLength(4)
    expect(visDw).toContain('plicaBicipite')
    expect(visDw).not.toContain('plicaPettorale')

    const stored = { plicaPettorale: 8, plicaBicipite: 5, vita: 90 }
    expect(countHiddenStoredMeasures(stored, visDw)).toBe(1)
    expect(stored.plicaPettorale).toBe(8)
  })
})

describe('fasce di normalità a cinque zone', () => {
  it('BMI: verde, arancio e rosso sopra/sotto', () => {
    const f = fasciaBmi(22)!
    const z = boundsCinqueZone(f)!
    expect(tonoCinqueZone(22, z)).toBe('verde')
    expect(tonoCinqueZone(17, z)).toBe('arancio-inf')
    expect(tonoCinqueZone(15, z)).toBe('rosso-inf')
    expect(tonoCinqueZone(27, z)).toBe('arancio-sup')
    expect(tonoCinqueZone(32, z)).toBe('rosso-sup')
  })

  it('massa grassa Gallagher uomo 20–39: cuneo in verde nel range 8–19%', () => {
    const f = fasciaMassaGrassa(12, 'M', 37)!
    const z = boundsCinqueZone(f)!
    expect(tonoCinqueZone(12, z)).toBe('verde')
    expect(tonoCinqueZone(2, z)).toBe('rosso-inf')
    expect(tonoCinqueZone(30, z)).toBe('rosso-sup')
  })
})

describe('assi BIVA', () => {
  it('bivaAxisTicks produce tacche dentro il range', () => {
    const ticks = bivaAxisTicks(180, 360, 6)
    expect(ticks.length).toBeGreaterThan(3)
    expect(ticks[0]).toBeGreaterThanOrEqual(180)
    expect(ticks[ticks.length - 1]).toBeLessThanOrEqual(360)
  })
})
