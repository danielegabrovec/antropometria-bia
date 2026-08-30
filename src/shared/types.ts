export type Sex = 'M' | 'F'
export type ClinicalSex = 'M' | 'F' | null
export type WorkspaceKind = 'studio' | 'solo'

export type ViewId =
  | 'misura'
  | 'analisi'
  | 'biva'
  | 'andamenti'
  | 'pazienti'
  | 'dottori'
  | 'archivio'
  | 'report'
  | 'teoria'
  | 'impostazioni'
  | 'info'

export type ProtocolPreset = 'essenziale' | 'formula' | 'isak' | 'avanzato'
export type DeltaMode = 'precedente' | 'prima'
export type EqDensitaPliche =
  | 'JacksonPollock3'
  | 'JacksonPollock4'
  | 'JacksonPollock7'
  | 'DurninWomersley'
export type EqMassaGrassa = 'Siri' | 'Brozek'
export type EqSuperficie = 'DuBois' | 'Mosteller'
export type FormulaPesoTeorico = 'BMI' | 'Lorenz' | 'Broca' | 'Devine' | 'Robinson' | 'Hamwi'
export type MetodoBmr = 'HarrisBenedict' | 'MifflinStJeor' | 'KatchMcArdle' | 'Cunningham'
export type BiaInputKind = 'R_XC' | 'Z_XC'

export interface DoctorProfile {
  id: string
  titolo: string
  nome: string
  cognome: string
  sex: Sex | null
  birthDate: string | null
  fiscalCode: string
  vatNumber: string
  qualification: string
  orderName: string
  orderNumber: string
  structure: string
  address: string
  zip: string
  city: string
  phone: string
  mobile: string
  email: string
  pec: string
  website: string
  notes: string
  createdAt: string
}

export interface PatientProfile {
  id: string
  nome: string
  cognome: string
  alias: string
  sex: Sex | null
  birthDate: string | null
  fiscalCode: string
  phone: string
  email: string
  address: string
  notes: string
  createdAt: string
}

export interface BiaAcquisition {
  inputKind: BiaInputKind
  resistanceOhm: number | null
  impedanceOhm: number | null
  reactanceOhm: number | null
  frequencyKhz: 50
  measurementSite: 'whole_body'
  deviceProfileId: 'akern-101' | 'altro'
  bivaProfileId: string | null
  deviceBcmKg: number | null
  deviceEcmKg: number | null
  deviceNaK: number | null
}

export interface Visit {
  id: string
  patientId: string
  operatorDoctorId: string | null
  name: string
  date: string
  createdAt: string
  updatedAt: string
  weightKg: number | null
  heightCm: number | null
  clinicalSex: ClinicalSex
  protocolPreset: ProtocolPreset
  eqDensitaPliche: EqDensitaPliche
  eqMassaGrassa: EqMassaGrassa
  eqSuperficie: EqSuperficie
  pesoTeorico: FormulaPesoTeorico
  formulaBmr: MetodoBmr
  laf: number
  measures: Record<string, number | null>
  enabledGirths: string[]
  bia: BiaAcquisition
  notes: string
}

export interface StudioIdentity {
  nome: string
  titolare: string
  qualifica: string
  sede: string
  telefono: string
  email: string
  sito: string
  ordine: string
  piva: string
}

export const LEGAL_NOTICE_VERSION = 2

export interface AppSettings {
  disclaimerAccepted: boolean
  legalNoticeVersion: number
  wizardCompleted: boolean
  deltaMode: DeltaMode
  studio: StudioIdentity
}

export interface WorkspaceMeta {
  id: string
  name: string
  kind: WorkspaceKind
}

export const INDEX_KIND = 'antropometria-bia-index' as const
export const INDEX_VERSION = 1 as const

export interface AppIndex {
  kind: typeof INDEX_KIND
  version: typeof INDEX_VERSION
  workspaces: WorkspaceMeta[]
  activeWorkspaceId: string | null
}

export const WORKSPACE_KIND = 'antropometria-bia-workspace' as const
export const WORKSPACE_VERSION = 1 as const

export interface WorkspaceFile {
  kind: typeof WORKSPACE_KIND
  version: typeof WORKSPACE_VERSION
  exportedAt: string
  workspace: WorkspaceMeta
  doctors: DoctorProfile[]
  patients: PatientProfile[]
  visits: Visit[]
  settings: AppSettings
  draft: WorkspaceDraft
}

export interface WorkspaceDraft {
  selectedPatientId: string | null
  selectedVisitId: string | null
  activeDoctorId: string | null
}

/** @deprecated vecchio export v1 — ancora letto in import */
export const LIBRARY_KIND = 'antropometria-bia-library' as const
export const LIBRARY_VERSION = 1 as const

export interface LibraryFile {
  kind: typeof LIBRARY_KIND
  version: typeof LIBRARY_VERSION
  exportedAt: string
  patients: PatientProfile[]
  visits: Visit[]
}

export const ANAGRAFICA_KIND = 'antropometria-bia-anagrafiche' as const

export interface AnagraficaFile {
  kind: typeof ANAGRAFICA_KIND
  version: 1
  exportedAt: string
  doctors: DoctorProfile[]
  patients: PatientProfile[]
}

export interface PersistPayload {
  patients: PatientProfile[]
  visits: Visit[]
  draft: {
    selectedPatientId: string | null
    selectedVisitId: string | null
    settings: AppSettings
  } | null
}

export const DEFAULT_STUDIO: StudioIdentity = {
  nome: '',
  titolare: '',
  qualifica: '',
  sede: '',
  telefono: '',
  email: '',
  sito: '',
  ordine: '',
  piva: ''
}

export const DEFAULT_SETTINGS: AppSettings = {
  disclaimerAccepted: false,
  legalNoticeVersion: 0,
  wizardCompleted: false,
  deltaMode: 'precedente',
  studio: { ...DEFAULT_STUDIO }
}

export const EMPTY_INDEX: AppIndex = {
  kind: INDEX_KIND,
  version: INDEX_VERSION,
  workspaces: [],
  activeWorkspaceId: null
}

export function emptyBia(): BiaAcquisition {
  return {
    inputKind: 'R_XC',
    resistanceOhm: null,
    impedanceOhm: null,
    reactanceOhm: null,
    frequencyKhz: 50,
    measurementSite: 'whole_body',
    deviceProfileId: 'akern-101',
    bivaProfileId: null,
    deviceBcmKg: null,
    deviceEcmKg: null,
    deviceNaK: null
  }
}
