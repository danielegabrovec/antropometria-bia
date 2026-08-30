import { describe, expect, it } from 'vitest'
import { cloneImportedWorkspace, normalizePatient, serializeAnagrafiche, parseAnagrafiche } from '@shared/library'
import { parseAnagraficheXls, anagraficheXls } from '@shared/export/xls'
import { emptyDoctor, emptyPatient } from '@shared/library'

describe('anagrafiche', () => {
  it('normalizza un profilo vecchio solo alias', () => {
    const p = normalizePatient({ id: 'a', alias: 'Rossi Mario', sex: 'M' })
    expect(p?.cognome).toBe('Rossi')
    expect(p?.nome).toBe('Mario')
  })

  it('roundtrip JSON anagrafiche', () => {
    const doctors = [emptyDoctor({ nome: 'Anna', cognome: 'Bianchi' })]
    const patients = [emptyPatient({ nome: 'Luca', cognome: 'Verdi', sex: 'M' })]
    const parsed = parseAnagrafiche(JSON.parse(serializeAnagrafiche(doctors, patients)))
    expect(parsed?.patients[0].cognome).toBe('Verdi')
    expect(parsed?.doctors[0].nome).toBe('Anna')
  })

  it('roundtrip XLS anagrafiche', () => {
    const doctors = [emptyDoctor({ nome: 'Eva', cognome: 'Neri', email: 'e@x.it' })]
    const patients = [emptyPatient({ nome: 'Gio', cognome: 'Blu', fiscalCode: 'BLUGIO' })]
    const back = parseAnagraficheXls(anagraficheXls(doctors, patients))
    expect(back.doctors[0].cognome).toBe('Neri')
    expect(back.patients[0].fiscalCode).toBe('BLUGIO')
  })

  it('clona workspace con id nuovi', () => {
    const cloned = cloneImportedWorkspace({
      kind: 'antropometria-bia-workspace',
      version: 1,
      workspace: { id: 'w1', name: 'Studio', kind: 'studio' },
      doctors: [emptyDoctor({ id: 'd1', nome: 'D', cognome: 'G' })],
      patients: [emptyPatient({ id: 'p1', nome: 'P', cognome: 'Q' })],
      visits: [
        {
          id: 'v1',
          patientId: 'p1',
          operatorDoctorId: 'd1',
          name: 'Visita',
          date: '2026-01-01',
          createdAt: '2026-01-01',
          updatedAt: '2026-01-01',
          weightKg: 70,
          heightCm: 170,
          clinicalSex: 'M',
          protocolPreset: 'essenziale',
          eqDensitaPliche: 'JacksonPollock7',
          eqMassaGrassa: 'Siri',
          eqSuperficie: 'DuBois',
          pesoTeorico: 'BMI',
          formulaBmr: 'Cunningham',
          laf: 1.55,
          measures: {},
          enabledGirths: [],
          bia: {},
          notes: ''
        }
      ],
      settings: {},
      draft: { selectedPatientId: 'p1', selectedVisitId: 'v1', activeDoctorId: 'd1' }
    })
    expect(cloned).not.toBeNull()
    expect(cloned!.workspace.id).not.toBe('w1')
    expect(cloned!.patients[0].id).not.toBe('p1')
    expect(cloned!.visits[0].patientId).toBe(cloned!.patients[0].id)
    expect(cloned!.visits[0].operatorDoctorId).toBe(cloned!.doctors[0].id)
  })
})
