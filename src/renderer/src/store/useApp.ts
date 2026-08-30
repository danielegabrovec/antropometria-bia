import { create } from 'zustand'
import type {
  AppSettings,
  DeltaMode,
  PatientProfile,
  PersistPayload,
  ProtocolPreset,
  ViewId,
  Visit
} from '@shared/types'
import { DEFAULT_SETTINGS, emptyBia } from '@shared/types'
import { defaultGirths } from '@shared/catalog/measures'
import { uid } from '@shared/library'

function today() {
  return new Date().toISOString().slice(0, 10)
}

function newPatient(): PatientProfile {
  return {
    id: uid(),
    alias: 'Nuovo profilo',
    sex: null,
    birthDate: null,
    notes: '',
    createdAt: new Date().toISOString()
  }
}

function newVisit(patientId: string, preset: ProtocolPreset = 'essenziale'): Visit {
  return {
    id: uid(),
    patientId,
    name: 'Visita',
    date: today(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    weightKg: null,
    heightCm: null,
    clinicalSex: null,
    protocolPreset: preset,
    eqDensitaPliche: 'JacksonPollock7',
    eqMassaGrassa: 'Siri',
    eqSuperficie: 'DuBois',
    pesoTeorico: 'BMI',
    formulaBmr: 'Cunningham',
    laf: 1.55,
    measures: {},
    enabledGirths: defaultGirths(preset),
    bia: emptyBia(),
    notes: ''
  }
}

interface AppState {
  ready: boolean
  view: ViewId
  patients: PatientProfile[]
  visits: Visit[]
  selectedPatientId: string | null
  selectedVisitId: string | null
  selectedPin: string | null
  settings: AppSettings
  paletteOpen: boolean
  setView: (v: ViewId) => void
  setPin: (key: string | null) => void
  setDelta: (m: DeltaMode) => void
  acceptDisclaimer: () => void
  hydrate: (p: Partial<PersistPayload> & { patients?: PatientProfile[]; visits?: Visit[] }) => void
  snapshot: () => PersistPayload
  upsertPatient: (p: Partial<PatientProfile> & { id: string }) => void
  addPatient: () => string
  removePatient: (id: string) => void
  addVisit: () => string | null
  patchVisit: (id: string, patch: Partial<Visit>) => void
  patchMeasure: (key: string, value: number | null) => void
  duplicateVisit: (id: string) => void
  removeVisit: (id: string) => void
  selectPatient: (id: string) => void
  selectVisit: (id: string) => void
  replaceLibrary: (patients: PatientProfile[], visits: Visit[]) => void
  patchSettings: (p: Partial<AppSettings>) => void
  setPalette: (open: boolean) => void
}

export const useApp = create<AppState>((set, get) => ({
  ready: false,
  view: 'misura',
  patients: [],
  visits: [],
  selectedPatientId: null,
  selectedVisitId: null,
  selectedPin: null,
  settings: { ...DEFAULT_SETTINGS, studio: { ...DEFAULT_SETTINGS.studio } },
  paletteOpen: false,

  setView: (view) => set({ view }),
  setPin: (selectedPin) => set({ selectedPin }),
  setDelta: (deltaMode) => set({ settings: { ...get().settings, deltaMode } }),
  acceptDisclaimer: () => set({ settings: { ...get().settings, disclaimerAccepted: true } }),
  setPalette: (paletteOpen) => set({ paletteOpen }),
  patchSettings: (p) => set({ settings: { ...get().settings, ...p, studio: { ...get().settings.studio, ...(p.studio ?? {}) } } }),

  hydrate: (data) => {
    const patients = data.patients ?? []
    const visits = data.visits ?? []
    const draft = data.draft
    set({
      ready: true,
      patients,
      visits,
      selectedPatientId: draft?.selectedPatientId ?? patients[0]?.id ?? null,
      selectedVisitId: draft?.selectedVisitId ?? visits[0]?.id ?? null,
      settings: draft?.settings
        ? { ...DEFAULT_SETTINGS, ...draft.settings, studio: { ...DEFAULT_SETTINGS.studio, ...draft.settings.studio } }
        : get().settings
    })
  },

  snapshot: () => ({
    patients: get().patients,
    visits: get().visits,
    draft: {
      selectedPatientId: get().selectedPatientId,
      selectedVisitId: get().selectedVisitId,
      settings: get().settings
    }
  }),

  addPatient: () => {
    const p = newPatient()
    const v = newVisit(p.id)
    set({
      patients: [...get().patients, p],
      visits: [...get().visits, v],
      selectedPatientId: p.id,
      selectedVisitId: v.id
    })
    return p.id
  },

  upsertPatient: (p) =>
    set({
      patients: get().patients.map((x) => (x.id === p.id ? { ...x, ...p } : x))
    }),

  removePatient: (id) => {
    const patients = get().patients.filter((p) => p.id !== id)
    const visits = get().visits.filter((v) => v.patientId !== id)
    set({
      patients,
      visits,
      selectedPatientId: patients[0]?.id ?? null,
      selectedVisitId: visits.find((v) => v.patientId === patients[0]?.id)?.id ?? null
    })
  },

  selectPatient: (id) => {
    const visit = [...get().visits].filter((v) => v.patientId === id).sort((a, b) => b.date.localeCompare(a.date))[0]
    set({ selectedPatientId: id, selectedVisitId: visit?.id ?? null, selectedPin: null })
  },

  addVisit: () => {
    const pid = get().selectedPatientId
    if (!pid) return null
    const v = newVisit(pid)
    set({ visits: [...get().visits, v], selectedVisitId: v.id })
    return v.id
  },

  patchVisit: (id, patch) =>
    set({
      visits: get().visits.map((v) =>
        v.id === id ? { ...v, ...patch, updatedAt: new Date().toISOString(), bia: patch.bia ? { ...v.bia, ...patch.bia } : v.bia } : v
      )
    }),

  patchMeasure: (key, value) => {
    const id = get().selectedVisitId
    if (!id) return
    set({
      visits: get().visits.map((v) =>
        v.id === id
          ? { ...v, measures: { ...v.measures, [key]: value }, updatedAt: new Date().toISOString() }
          : v
      )
    })
  },

  duplicateVisit: (id) => {
    const src = get().visits.find((v) => v.id === id)
    if (!src) return
    const copy: Visit = {
      ...src,
      id: uid(),
      name: `${src.name} (copia)`,
      date: today(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      measures: { ...src.measures },
      enabledGirths: [...src.enabledGirths],
      bia: { ...src.bia }
    }
    set({ visits: [...get().visits, copy], selectedVisitId: copy.id })
  },

  removeVisit: (id) => {
    const visits = get().visits.filter((v) => v.id !== id)
    const pid = get().selectedPatientId
    const next = visits.filter((v) => v.patientId === pid).sort((a, b) => b.date.localeCompare(a.date))[0]
    set({ visits, selectedVisitId: next?.id ?? null })
  },

  selectVisit: (id) => set({ selectedVisitId: id, selectedPin: null }),

  replaceLibrary: (patients, visits) =>
    set({
      patients,
      visits,
      selectedPatientId: patients[0]?.id ?? null,
      selectedVisitId: visits[0]?.id ?? null
    })
}))

export function currentPatient(): PatientProfile | null {
  const s = useApp.getState()
  return s.patients.find((p) => p.id === s.selectedPatientId) ?? null
}

export function currentVisit(): Visit | null {
  const s = useApp.getState()
  return s.visits.find((v) => v.id === s.selectedVisitId) ?? null
}
