export type Sex = 'M' | 'F' | 'Altro'
export type ClinicalSex = 'M' | 'F' | null

export type ViewId =
  | 'misura'
  | 'analisi'
  | 'biva'
  | 'andamenti'
  | 'profili'
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

export interface PatientProfile {
  id: string
  alias: string
  sex: Sex | null
  birthDate: string | null
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
  /** Output strumento: mai sintetizzati dal motore. */
  deviceBcmKg: number | null
  deviceEcmKg: number | null
  deviceNaK: number | null
}

export interface Visit {
  id: string
  patientId: string
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
  /** Valori in mm (pliche) o cm (circonferenze/diametri). */
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

export interface AppSettings {
  disclaimerAccepted: boolean
  deltaMode: DeltaMode
  studio: StudioIdentity
}

export const LIBRARY_KIND = 'antropometria-bia-library' as const
export const LIBRARY_VERSION = 1 as const

export interface LibraryFile {
  kind: typeof LIBRARY_KIND
  version: typeof LIBRARY_VERSION
  exportedAt: string
  patients: PatientProfile[]
  visits: Visit[]
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
  titolare: 'Daniele Gabrovec',
  qualifica: 'Biologo Nutrizionista',
  sede: '',
  telefono: '',
  email: '',
  sito: '',
  ordine: 'Ordine dei Biologi del Triveneto n. TRI_A2489',
  piva: ''
}

export const DEFAULT_SETTINGS: AppSettings = {
  disclaimerAccepted: false,
  deltaMode: 'precedente',
  studio: { ...DEFAULT_STUDIO }
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
