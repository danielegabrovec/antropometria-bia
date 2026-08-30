import { describe, expect, it } from 'vitest'
import { calcolaPlicometriaStrict } from '@shared/engine/plicometria'
import { blandAltman, slopePerWeek } from '@shared/engine/stats'
import { calculateBmi, calculateWhr } from '@shared/engine/indices'
import { formulaValidataPerEta } from '@shared/engine/formule-per-eta'

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
