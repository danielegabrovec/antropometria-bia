import { beforeEach, describe, expect, it } from 'vitest'
import { emptyDoctor, emptyPatient } from '@shared/library'
import { DEFAULT_SETTINGS, EMPTY_INDEX } from '@shared/types'
import { useApp } from '../src/renderer/src/store/useApp'

describe('stato clinico e snapshot', () => {
  beforeEach(() => {
    useApp.setState({
      ready: false,
      index: { ...EMPTY_INDEX },
      workspace: null,
      doctors: [],
      patients: [],
      visits: [],
      activeDoctorId: null,
      selectedPatientId: null,
      selectedVisitId: null,
      settings: { ...DEFAULT_SETTINGS, studio: { ...DEFAULT_SETTINGS.studio } }
    })
  })

  it('conserva le modifiche manuali all’intestazione del report', () => {
    const doctor = emptyDoctor({ id: 'd1', nome: 'Ada', cognome: 'Rossi', structure: 'Studio origine' })
    useApp.getState().applyWorkspace({
      kind: 'antropometria-bia-workspace',
      version: 1,
      exportedAt: new Date().toISOString(),
      workspace: { id: 'w1', name: 'Studio', kind: 'studio' },
      doctors: [doctor],
      patients: [],
      visits: [],
      settings: { ...DEFAULT_SETTINGS, studio: { ...DEFAULT_SETTINGS.studio, nome: 'Intestazione personalizzata' } },
      draft: { selectedPatientId: null, selectedVisitId: null, activeDoctorId: doctor.id }
    })
    expect(useApp.getState().snapshotWorkspace()?.settings.studio.nome).toBe('Intestazione personalizzata')
  })

  it('fotografa il sesso clinico nelle nuove visite', () => {
    const doctor = emptyDoctor({ id: 'd1', nome: 'Ada', cognome: 'Rossi' })
    useApp.getState().applyWorkspace({
      kind: 'antropometria-bia-workspace',
      version: 1,
      exportedAt: new Date().toISOString(),
      workspace: { id: 'w1', name: 'Studio', kind: 'studio' },
      doctors: [doctor],
      patients: [],
      visits: [],
      settings: { ...DEFAULT_SETTINGS, studio: { ...DEFAULT_SETTINGS.studio } },
      draft: { selectedPatientId: null, selectedVisitId: null, activeDoctorId: doctor.id }
    })
    const patientId = useApp.getState().addPatient(emptyPatient({ nome: 'Pia', cognome: 'Verdi', sex: 'F' }))
    const visits = useApp.getState().visits.filter((visit) => visit.patientId === patientId)
    expect(visits).toHaveLength(1)
    expect(visits[0].clinicalSex).toBe('F')
  })

  it('non elimina un dottore associato a visite storiche', () => {
    const doctor = emptyDoctor({ id: 'd1', nome: 'Ada', cognome: 'Rossi' })
    const other = emptyDoctor({ id: 'd2', nome: 'Eva', cognome: 'Neri' })
    const patient = emptyPatient({ id: 'p1', nome: 'Pia', cognome: 'Verdi', sex: 'F' })
    useApp.getState().applyWorkspace({
      kind: 'antropometria-bia-workspace',
      version: 1,
      exportedAt: new Date().toISOString(),
      workspace: { id: 'w1', name: 'Studio', kind: 'studio' },
      doctors: [doctor, other],
      patients: [patient],
      visits: [{
        id: 'v1', patientId: patient.id, operatorDoctorId: doctor.id, name: 'Visita', date: '2026-01-01',
        createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z', weightKg: 60,
        heightCm: 165, clinicalSex: 'F', protocolPreset: 'essenziale', eqDensitaPliche: 'JacksonPollock7',
        eqMassaGrassa: 'Siri', eqSuperficie: 'DuBois', pesoTeorico: 'BMI', formulaBmr: 'Cunningham',
        laf: 1.55, measures: {}, enabledGirths: [], bia: {
          inputKind: 'R_XC', resistanceOhm: null, impedanceOhm: null, reactanceOhm: null, frequencyKhz: 50,
          measurementSite: 'whole_body', deviceProfileId: 'akern-101', bivaProfileId: null,
          deviceBcmKg: null, deviceEcmKg: null, deviceNaK: null
        }, notes: ''
      }],
      settings: { ...DEFAULT_SETTINGS, studio: { ...DEFAULT_SETTINGS.studio } },
      draft: { selectedPatientId: patient.id, selectedVisitId: 'v1', activeDoctorId: doctor.id }
    })
    useApp.getState().removeDoctor(doctor.id)
    expect(useApp.getState().doctors.map((item) => item.id)).toContain(doctor.id)
    expect(useApp.getState().visits[0].operatorDoctorId).toBe(doctor.id)
  })
})
