import { create } from 'zustand'
import type {
  AppIndex,
  AppSettings,
  DeltaMode,
  DoctorProfile,
  PatientProfile,
  ProtocolPreset,
  ViewId,
  Visit,
  WorkspaceFile,
  WorkspaceKind,
  WorkspaceMeta
} from '@shared/types'
import { DEFAULT_SETTINGS, DEFAULT_STUDIO, emptyBia, EMPTY_INDEX, LEGAL_NOTICE_VERSION } from '@shared/types'
import { defaultGirths } from '@shared/catalog/measures'
import {
  displayName,
  doctorFromStudio,
  doctorLabel,
  emptyDoctor,
  emptyPatient,
  parseWorkspace,
  studioFromDoctor,
  today,
  uid,
  withPatientAlias
} from '@shared/library'

function newVisit(
  patientId: string,
  operatorDoctorId: string | null,
  clinicalSex: Visit['clinicalSex'],
  preset: ProtocolPreset = 'essenziale'
): Visit {
  return {
    id: uid(),
    patientId,
    operatorDoctorId,
    name: 'Visita',
    date: today(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    weightKg: null,
    heightCm: null,
    clinicalSex,
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
  index: AppIndex
  workspace: WorkspaceMeta | null
  doctors: DoctorProfile[]
  patients: PatientProfile[]
  visits: Visit[]
  activeDoctorId: string | null
  selectedPatientId: string | null
  selectedVisitId: string | null
  selectedPin: string | null
  settings: AppSettings
  paletteOpen: boolean
  setView: (v: ViewId) => void
  setPin: (key: string | null) => void
  setDelta: (m: DeltaMode) => void
  acceptDisclaimer: () => void
  setPalette: (open: boolean) => void
  patchSettings: (p: Partial<AppSettings>) => void
  applyIndex: (index: AppIndex) => void
  applyWorkspace: (file: WorkspaceFile) => void
  snapshotWorkspace: () => WorkspaceFile | null
  completeWizard: (input: {
    kind: WorkspaceKind
    workspaceName: string
    doctor: Partial<DoctorProfile>
  }) => WorkspaceFile
  addDoctor: (partial?: Partial<DoctorProfile>) => string
  upsertDoctor: (p: Partial<DoctorProfile> & { id: string }) => void
  removeDoctor: (id: string) => void
  setActiveDoctor: (id: string) => void
  upsertPatient: (p: Partial<PatientProfile> & { id: string }) => void
  addPatient: (partial?: Partial<PatientProfile>) => string
  removePatient: (id: string) => void
  addVisit: () => string | null
  patchVisit: (id: string, patch: Partial<Visit>) => void
  patchMeasure: (key: string, value: number | null) => void
  duplicateVisit: (id: string) => void
  removeVisit: (id: string) => void
  selectPatient: (id: string) => void
  selectVisit: (id: string) => void
  replaceWorkspaceData: (file: WorkspaceFile) => void
  createIsolatedWorkspace: (doctor: Partial<DoctorProfile>, name: string) => WorkspaceFile
  dropCurrentWorkspace: () => { removedId: string; next: AppIndex }
}

export const useApp = create<AppState>((set, get) => ({
  ready: false,
  view: 'misura',
  index: { ...EMPTY_INDEX },
  workspace: null,
  doctors: [],
  patients: [],
  visits: [],
  activeDoctorId: null,
  selectedPatientId: null,
  selectedVisitId: null,
  selectedPin: null,
  settings: { ...DEFAULT_SETTINGS, studio: { ...DEFAULT_STUDIO } },
  paletteOpen: false,

  setView: (view) => set({ view }),
  setPin: (selectedPin) => set({ selectedPin }),
  setDelta: (deltaMode) => set({ settings: { ...get().settings, deltaMode } }),
  acceptDisclaimer: () =>
    set({
      settings: { ...get().settings, disclaimerAccepted: true, legalNoticeVersion: LEGAL_NOTICE_VERSION }
    }),
  setPalette: (paletteOpen) => set({ paletteOpen }),
  patchSettings: (p) =>
    set({ settings: { ...get().settings, ...p, studio: { ...get().settings.studio, ...(p.studio ?? {}) } } }),

  applyIndex: (index) => set({ index }),

  applyWorkspace: (file) => {
    const doctors = file.doctors.length
      ? file.doctors
      : file.settings?.studio?.titolare
        ? [doctorFromStudio(file.settings.studio)]
        : []
    const settings = {
      ...DEFAULT_SETTINGS,
      ...file.settings,
      studio: { ...DEFAULT_STUDIO, ...file.settings?.studio }
    }
    const activeDoctorId = doctors.some((doctor) => doctor.id === file.draft.activeDoctorId)
      ? file.draft.activeDoctorId
      : doctors[0]?.id ?? null
    const selectedPatientId = file.patients.some((patient) => patient.id === file.draft.selectedPatientId)
      ? file.draft.selectedPatientId
      : file.patients[0]?.id ?? null
    const visits = file.visits.map((visit) => {
      if (visit.clinicalSex) return visit
      const patient = file.patients.find((item) => item.id === visit.patientId)
      return patient?.sex ? { ...visit, clinicalSex: patient.sex } : visit
    })
    const patientVisits = visits.filter((visit) => visit.patientId === selectedPatientId)
    const selectedVisitId = patientVisits.some((visit) => visit.id === file.draft.selectedVisitId)
      ? file.draft.selectedVisitId
      : patientVisits.slice().sort((a, b) => b.date.localeCompare(a.date))[0]?.id ?? null
    const hasStoredStudio = Object.values(settings.studio).some((value) => value.trim().length > 0)
    set({
      ready: true,
      workspace: file.workspace,
      doctors,
      patients: file.patients,
      visits,
      activeDoctorId,
      selectedPatientId,
      selectedVisitId,
      settings: {
        ...settings,
        wizardCompleted: Boolean(settings.wizardCompleted || doctors.length > 0),
        studio: !hasStoredStudio && doctors[0]
          ? studioFromDoctor(doctors.find((d) => d.id === activeDoctorId) ?? doctors[0], file.workspace.name)
          : settings.studio
      },
      index: {
        ...get().index,
        workspaces: get().index.workspaces.some((w) => w.id === file.workspace.id)
          ? get().index.workspaces.map((w) => (w.id === file.workspace.id ? file.workspace : w))
          : [...get().index.workspaces, file.workspace],
        activeWorkspaceId: file.workspace.id
      }
    })
  },

  snapshotWorkspace: () => {
    const s = get()
    if (!s.workspace) return null
    return {
      kind: 'antropometria-bia-workspace',
      version: 1,
      exportedAt: new Date().toISOString(),
      workspace: s.workspace,
      doctors: s.doctors,
      patients: s.patients,
      visits: s.visits,
      settings: s.settings,
      draft: {
        selectedPatientId: s.selectedPatientId,
        selectedVisitId: s.selectedVisitId,
        activeDoctorId: s.activeDoctorId
      }
    }
  },

  completeWizard: ({ kind, workspaceName, doctor }) => {
    const d = emptyDoctor({
      ...doctor,
      qualification: doctor.qualification || 'Biologo Nutrizionista'
    })
    const workspace: WorkspaceMeta = {
      id: uid(),
      name: workspaceName.trim() || (kind === 'studio' ? 'Studio' : doctorLabel(d)),
      kind
    }
    const file: WorkspaceFile = {
      kind: 'antropometria-bia-workspace',
      version: 1,
      exportedAt: new Date().toISOString(),
      workspace,
      doctors: [d],
      patients: [],
      visits: [],
      settings: {
        ...get().settings,
        wizardCompleted: true,
        disclaimerAccepted: true,
        legalNoticeVersion: LEGAL_NOTICE_VERSION,
        studio: studioFromDoctor(d, workspace.name)
      },
      draft: { selectedPatientId: null, selectedVisitId: null, activeDoctorId: d.id }
    }
    get().applyWorkspace(file)
    return file
  },

  addDoctor: (partial) => {
    if (get().workspace?.kind === 'solo' && get().doctors.length >= 1) {
      return get().doctors[0].id
    }
    const d = emptyDoctor(partial)
    set({ doctors: [...get().doctors, d], activeDoctorId: d.id, settings: { ...get().settings, studio: studioFromDoctor(d, get().workspace?.name ?? '') } })
    return d.id
  },

  upsertDoctor: (p) => {
    const doctors = get().doctors.map((x) => (x.id === p.id ? { ...x, ...p } : x))
    const active = doctors.find((d) => d.id === get().activeDoctorId) ?? doctors[0]
    set({
      doctors,
      settings: active
        ? { ...get().settings, studio: studioFromDoctor(active, get().workspace?.name ?? '') }
        : get().settings
    })
  },

  removeDoctor: (id) => {
    if (get().visits.some((visit) => visit.operatorDoctorId === id)) return
    const doctors = get().doctors.filter((d) => d.id !== id)
    if (doctors.length === 0) return
    const activeDoctorId = get().activeDoctorId === id ? doctors[0].id : get().activeDoctorId
    const active = doctors.find((d) => d.id === activeDoctorId) ?? doctors[0]
    set({
      doctors,
      activeDoctorId,
      settings: { ...get().settings, studio: studioFromDoctor(active, get().workspace?.name ?? '') }
    })
  },

  setActiveDoctor: (id) => {
    const d = get().doctors.find((x) => x.id === id)
    if (!d) return
    set({
      activeDoctorId: id,
      settings: { ...get().settings, studio: studioFromDoctor(d, get().workspace?.name ?? '') }
    })
  },

  addPatient: (partial) => {
    const p = withPatientAlias(emptyPatient(partial))
    const v = newVisit(p.id, get().activeDoctorId, p.sex)
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
      patients: get().patients.map((x) => (x.id === p.id ? withPatientAlias({ ...x, ...p }) : x))
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
    const patient = get().patients.find((item) => item.id === pid)
    const v = newVisit(pid, get().activeDoctorId, patient?.sex ?? null)
    set({ visits: [...get().visits, v], selectedVisitId: v.id })
    return v.id
  },

  patchVisit: (id, patch) =>
    set({
      visits: get().visits.map((v) =>
        v.id === id
          ? { ...v, ...patch, updatedAt: new Date().toISOString(), bia: patch.bia ? { ...v.bia, ...patch.bia } : v.bia }
          : v
      )
    }),

  patchMeasure: (key, value) => {
    const id = get().selectedVisitId
    if (!id) return
    set({
      visits: get().visits.map((v) =>
        v.id === id ? { ...v, measures: { ...v.measures, [key]: value }, updatedAt: new Date().toISOString() } : v
      )
    })
  },

  duplicateVisit: (id) => {
    const src = get().visits.find((v) => v.id === id)
    if (!src) return
    const copy: Visit = {
      ...src,
      id: uid(),
      operatorDoctorId: get().activeDoctorId,
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

  selectVisit: (id) => {
    const v = get().visits.find((x) => x.id === id)
    set({ selectedVisitId: id, selectedPatientId: v?.patientId ?? get().selectedPatientId, selectedPin: null })
  },

  replaceWorkspaceData: (file) => get().applyWorkspace(file),

  createIsolatedWorkspace: (doctor, name) => {
    const d = emptyDoctor(doctor)
    const workspace: WorkspaceMeta = {
      id: uid(),
      name: name.trim() || doctorLabel(d),
      kind: 'solo'
    }
    const file: WorkspaceFile = {
      kind: 'antropometria-bia-workspace',
      version: 1,
      exportedAt: new Date().toISOString(),
      workspace,
      doctors: [d],
      patients: [],
      visits: [],
      settings: {
        ...DEFAULT_SETTINGS,
        wizardCompleted: true,
        disclaimerAccepted: true,
        legalNoticeVersion: LEGAL_NOTICE_VERSION,
        studio: studioFromDoctor(d, workspace.name)
      },
      draft: { selectedPatientId: null, selectedVisitId: null, activeDoctorId: d.id }
    }
    get().applyWorkspace(file)
    return file
  },

  dropCurrentWorkspace: () => {
    const s = get()
    const removedId = s.workspace?.id ?? ''
    const workspaces = s.index.workspaces.filter((w) => w.id !== removedId)
    const next: AppIndex = {
      ...s.index,
      workspaces,
      activeWorkspaceId: workspaces[0]?.id ?? null
    }
    set({
      index: next,
      workspace: null,
      doctors: [],
      patients: [],
      visits: [],
      activeDoctorId: null,
      selectedPatientId: null,
      selectedVisitId: null
    })
    return { removedId, next }
  }
}))

export function currentPatient(): PatientProfile | null {
  const s = useApp.getState()
  return s.patients.find((p) => p.id === s.selectedPatientId) ?? null
}

export function currentVisit(): Visit | null {
  const s = useApp.getState()
  return s.visits.find((v) => v.id === s.selectedVisitId) ?? null
}

export function currentDoctor(): DoctorProfile | null {
  const s = useApp.getState()
  return s.doctors.find((d) => d.id === s.activeDoctorId) ?? s.doctors[0] ?? null
}

export function hydrateFromParsed(file: unknown) {
  const parsed = parseWorkspace(file)
  if (parsed) useApp.getState().applyWorkspace(parsed)
}

void displayName
void doctorFromStudio
