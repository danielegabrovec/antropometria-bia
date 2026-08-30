import type {
  AnagraficaFile,
  AppIndex,
  AppSettings,
  DoctorProfile,
  LibraryFile,
  PatientProfile,
  Visit,
  WorkspaceDraft,
  WorkspaceFile,
  WorkspaceMeta
} from './types'
import {
  ANAGRAFICA_KIND,
  DEFAULT_SETTINGS,
  DEFAULT_STUDIO,
  emptyBia,
  INDEX_KIND,
  INDEX_VERSION,
  LIBRARY_KIND,
  LIBRARY_VERSION,
  WORKSPACE_KIND,
  WORKSPACE_VERSION
} from './types'

export function uid(): string {
  return crypto.randomUUID?.() ?? Math.random().toString(36).slice(2, 10)
}

export function today(): string {
  return new Date().toISOString().slice(0, 10)
}

export function displayName(nome: string, cognome: string, fallback = 'Senza nome'): string {
  const n = `${cognome} ${nome}`.replace(/\s+/g, ' ').trim()
  return n || fallback
}

export function patientAliasOf(p: Pick<PatientProfile, 'nome' | 'cognome' | 'alias'>): string {
  return displayName(p.nome, p.cognome, p.alias?.trim() || 'Senza nome')
}

export function patientLabel(p: PatientProfile | null | undefined): string {
  if (!p) return 'Nessun paziente'
  return patientAliasOf(p)
}

export function doctorLabel(d: DoctorProfile | null | undefined): string {
  if (!d) return 'Nessun dottore'
  const core = displayName(d.nome, d.cognome, '')
  const titled = `${d.titolo} ${core}`.replace(/\s+/g, ' ').trim()
  return titled || 'Dottore'
}

export function emptyDoctor(partial: Partial<DoctorProfile> = {}): DoctorProfile {
  return {
    id: partial.id ?? uid(),
    titolo: partial.titolo ?? 'Dott.',
    nome: partial.nome ?? '',
    cognome: partial.cognome ?? '',
    sex: partial.sex ?? null,
    birthDate: partial.birthDate ?? null,
    fiscalCode: partial.fiscalCode ?? '',
    vatNumber: partial.vatNumber ?? '',
    qualification: partial.qualification ?? '',
    orderName: partial.orderName ?? '',
    orderNumber: partial.orderNumber ?? '',
    structure: partial.structure ?? '',
    address: partial.address ?? '',
    zip: partial.zip ?? '',
    city: partial.city ?? '',
    phone: partial.phone ?? '',
    mobile: partial.mobile ?? '',
    email: partial.email ?? '',
    pec: partial.pec ?? '',
    website: partial.website ?? '',
    notes: partial.notes ?? '',
    createdAt: partial.createdAt ?? new Date().toISOString()
  }
}

export function emptyPatient(partial: Partial<PatientProfile> = {}): PatientProfile {
  const nome = partial.nome ?? ''
  const cognome = partial.cognome ?? ''
  const alias = partial.alias ?? displayName(nome, cognome, 'Nuovo paziente')
  return {
    id: partial.id ?? uid(),
    nome,
    cognome,
    alias,
    sex: partial.sex ?? null,
    birthDate: partial.birthDate ?? null,
    fiscalCode: partial.fiscalCode ?? '',
    phone: partial.phone ?? '',
    email: partial.email ?? '',
    address: partial.address ?? '',
    notes: partial.notes ?? '',
    createdAt: partial.createdAt ?? new Date().toISOString()
  }
}

export function withPatientAlias(p: PatientProfile): PatientProfile {
  return { ...p, alias: displayName(p.nome, p.cognome, p.alias || 'Nuovo paziente') }
}

export function studioFromDoctor(d: DoctorProfile, workspaceName: string): AppSettings['studio'] {
  return {
    nome: d.structure || workspaceName,
    titolare: doctorLabel(d),
    qualifica: d.qualification,
    sede: [d.address, d.zip, d.city].filter(Boolean).join(', '),
    telefono: d.phone || d.mobile,
    email: d.email,
    sito: d.website,
    ordine: [d.orderName, d.orderNumber].filter(Boolean).join(' n. '),
    piva: d.vatNumber
  }
}

export function searchText(q: string, ...parts: Array<string | null | undefined>): boolean {
  const n = q.trim().toLowerCase()
  if (!n) return true
  return parts.some((p) => (p ?? '').toLowerCase().includes(n))
}

export function filterPatients(patients: PatientProfile[], q: string): PatientProfile[] {
  return patients.filter((p) =>
    searchText(q, p.nome, p.cognome, p.alias, p.fiscalCode, p.email, p.phone)
  )
}

export function filterDoctors(doctors: DoctorProfile[], q: string): DoctorProfile[] {
  return doctors.filter((d) =>
    searchText(q, d.nome, d.cognome, d.titolo, d.fiscalCode, d.email, d.qualification, d.structure)
  )
}

function splitAlias(alias: string): { nome: string; cognome: string } {
  const t = alias.trim()
  if (!t) return { nome: '', cognome: '' }
  const i = t.indexOf(' ')
  if (i < 0) return { nome: '', cognome: t }
  return { cognome: t.slice(0, i), nome: t.slice(i + 1) }
}

export function normalizePatient(raw: unknown): PatientProfile | null {
  if (!raw || typeof raw !== 'object') return null
  const o = raw as Record<string, unknown>
  const id = typeof o.id === 'string' ? o.id : uid()
  let nome = typeof o.nome === 'string' ? o.nome : ''
  let cognome = typeof o.cognome === 'string' ? o.cognome : ''
  const alias = typeof o.alias === 'string' ? o.alias : ''
  if (!nome && !cognome && alias) {
    const s = splitAlias(alias)
    nome = s.nome
    cognome = s.cognome
  }
  return withPatientAlias(
    emptyPatient({
      id,
      nome,
      cognome,
      alias,
      sex: o.sex === 'M' || o.sex === 'F' || o.sex === 'Altro' ? o.sex : null,
      birthDate: typeof o.birthDate === 'string' ? o.birthDate : null,
      fiscalCode: typeof o.fiscalCode === 'string' ? o.fiscalCode : '',
      phone: typeof o.phone === 'string' ? o.phone : '',
      email: typeof o.email === 'string' ? o.email : '',
      address: typeof o.address === 'string' ? o.address : '',
      notes: typeof o.notes === 'string' ? o.notes : '',
      createdAt: typeof o.createdAt === 'string' ? o.createdAt : new Date().toISOString()
    })
  )
}

export function normalizeDoctor(raw: unknown): DoctorProfile | null {
  if (!raw || typeof raw !== 'object') return null
  const o = raw as Record<string, unknown>
  return emptyDoctor({
    id: typeof o.id === 'string' ? o.id : uid(),
    titolo: typeof o.titolo === 'string' ? o.titolo : 'Dott.',
    nome: typeof o.nome === 'string' ? o.nome : '',
    cognome: typeof o.cognome === 'string' ? o.cognome : '',
    sex: o.sex === 'M' || o.sex === 'F' || o.sex === 'Altro' ? o.sex : null,
    birthDate: typeof o.birthDate === 'string' ? o.birthDate : null,
    fiscalCode: typeof o.fiscalCode === 'string' ? o.fiscalCode : '',
    vatNumber: typeof o.vatNumber === 'string' ? o.vatNumber : '',
    qualification: typeof o.qualification === 'string' ? o.qualification : typeof o.qualifica === 'string' ? o.qualifica : '',
    orderName: typeof o.orderName === 'string' ? o.orderName : '',
    orderNumber: typeof o.orderNumber === 'string' ? o.orderNumber : '',
    structure: typeof o.structure === 'string' ? o.structure : '',
    address: typeof o.address === 'string' ? o.address : '',
    zip: typeof o.zip === 'string' ? o.zip : '',
    city: typeof o.city === 'string' ? o.city : '',
    phone: typeof o.phone === 'string' ? o.phone : '',
    mobile: typeof o.mobile === 'string' ? o.mobile : '',
    email: typeof o.email === 'string' ? o.email : '',
    pec: typeof o.pec === 'string' ? o.pec : '',
    website: typeof o.website === 'string' ? o.website : '',
    notes: typeof o.notes === 'string' ? o.notes : '',
    createdAt: typeof o.createdAt === 'string' ? o.createdAt : new Date().toISOString()
  })
}

export function normalizeVisit(raw: unknown): Visit | null {
  if (!raw || typeof raw !== 'object') return null
  const o = raw as Record<string, unknown>
  if (typeof o.patientId !== 'string') return null
  const bia = o.bia && typeof o.bia === 'object' ? { ...emptyBia(), ...(o.bia as object) } : emptyBia()
  return {
    id: typeof o.id === 'string' ? o.id : uid(),
    patientId: o.patientId,
    operatorDoctorId: typeof o.operatorDoctorId === 'string' ? o.operatorDoctorId : null,
    name: typeof o.name === 'string' ? o.name : 'Visita',
    date: typeof o.date === 'string' ? o.date : today(),
    createdAt: typeof o.createdAt === 'string' ? o.createdAt : new Date().toISOString(),
    updatedAt: typeof o.updatedAt === 'string' ? o.updatedAt : new Date().toISOString(),
    weightKg: typeof o.weightKg === 'number' ? o.weightKg : null,
    heightCm: typeof o.heightCm === 'number' ? o.heightCm : null,
    clinicalSex: o.clinicalSex === 'M' || o.clinicalSex === 'F' ? o.clinicalSex : null,
    protocolPreset: (o.protocolPreset as Visit['protocolPreset']) || 'essenziale',
    eqDensitaPliche: (o.eqDensitaPliche as Visit['eqDensitaPliche']) || 'JacksonPollock7',
    eqMassaGrassa: (o.eqMassaGrassa as Visit['eqMassaGrassa']) || 'Siri',
    eqSuperficie: (o.eqSuperficie as Visit['eqSuperficie']) || 'DuBois',
    pesoTeorico: (o.pesoTeorico as Visit['pesoTeorico']) || 'BMI',
    formulaBmr: (o.formulaBmr as Visit['formulaBmr']) || 'Cunningham',
    laf: typeof o.laf === 'number' ? o.laf : 1.55,
    measures: o.measures && typeof o.measures === 'object' ? { ...(o.measures as Visit['measures']) } : {},
    enabledGirths: Array.isArray(o.enabledGirths) ? (o.enabledGirths as string[]) : [],
    bia,
    notes: typeof o.notes === 'string' ? o.notes : ''
  }
}

export function parseIndex(raw: unknown): AppIndex | null {
  if (!raw || typeof raw !== 'object') return null
  const o = raw as Record<string, unknown>
  if (o.kind !== INDEX_KIND) return null
  if (!Array.isArray(o.workspaces)) return null
  return {
    kind: INDEX_KIND,
    version: INDEX_VERSION,
    workspaces: o.workspaces as WorkspaceMeta[],
    activeWorkspaceId: typeof o.activeWorkspaceId === 'string' ? o.activeWorkspaceId : null
  }
}

export function parseWorkspace(raw: unknown): WorkspaceFile | null {
  if (!raw || typeof raw !== 'object') return null
  const o = raw as Record<string, unknown>
  if (o.kind === WORKSPACE_KIND) {
    const ws = o.workspace as WorkspaceMeta | undefined
    if (!ws?.id) return null
    const doctors = Array.isArray(o.doctors) ? o.doctors.map(normalizeDoctor).filter((d): d is DoctorProfile => d != null) : []
    const patients = Array.isArray(o.patients) ? o.patients.map(normalizePatient).filter((p): p is PatientProfile => p != null) : []
    const visits = Array.isArray(o.visits) ? o.visits.map(normalizeVisit).filter((v): v is Visit => v != null) : []
    const settings = { ...DEFAULT_SETTINGS, ...((o.settings as AppSettings) ?? {}) }
    settings.studio = { ...DEFAULT_STUDIO, ...(settings.studio ?? {}) }
    const draft = (o.draft as WorkspaceDraft) ?? {
      selectedPatientId: null,
      selectedVisitId: null,
      activeDoctorId: doctors[0]?.id ?? null
    }
    return {
      kind: WORKSPACE_KIND,
      version: WORKSPACE_VERSION,
      exportedAt: typeof o.exportedAt === 'string' ? o.exportedAt : new Date().toISOString(),
      workspace: ws,
      doctors,
      patients,
      visits,
      settings,
      draft
    }
  }
  if (o.kind === LIBRARY_KIND) {
    const patients = Array.isArray(o.patients) ? o.patients.map(normalizePatient).filter((p): p is PatientProfile => p != null) : []
    const visits = Array.isArray(o.visits) ? o.visits.map(normalizeVisit).filter((v): v is Visit => v != null) : []
    const ws: WorkspaceMeta = { id: uid(), name: 'Cartella importata', kind: 'studio' }
    return {
      kind: WORKSPACE_KIND,
      version: WORKSPACE_VERSION,
      exportedAt: new Date().toISOString(),
      workspace: ws,
      doctors: [],
      patients,
      visits,
      settings: { ...DEFAULT_SETTINGS, studio: { ...DEFAULT_STUDIO } },
      draft: { selectedPatientId: patients[0]?.id ?? null, selectedVisitId: visits[0]?.id ?? null, activeDoctorId: null }
    }
  }
  return null
}

export function parseAnagrafiche(raw: unknown): AnagraficaFile | null {
  if (!raw || typeof raw !== 'object') return null
  const o = raw as Record<string, unknown>
  if (o.kind !== ANAGRAFICA_KIND) return null
  return {
    kind: ANAGRAFICA_KIND,
    version: 1,
    exportedAt: typeof o.exportedAt === 'string' ? o.exportedAt : new Date().toISOString(),
    doctors: Array.isArray(o.doctors) ? o.doctors.map(normalizeDoctor).filter((d): d is DoctorProfile => d != null) : [],
    patients: Array.isArray(o.patients) ? o.patients.map(normalizePatient).filter((p): p is PatientProfile => p != null) : []
  }
}

export function remapIds<T extends { id: string }>(items: T[]): { items: T[]; map: Map<string, string> } {
  const map = new Map<string, string>()
  const next = items.map((item) => {
    const id = uid()
    map.set(item.id, id)
    return { ...item, id }
  })
  return { items: next, map }
}

export function cloneImportedWorkspace(raw: unknown): WorkspaceFile | null {
  const file = parseWorkspace(raw)
  if (!file) return null
  const doctors = remapIds(file.doctors)
  const patients = remapIds(file.patients)
  const visits = file.visits
    .map((v) => {
      const patientId = patients.map.get(v.patientId)
      if (!patientId) return null
      const operatorDoctorId = v.operatorDoctorId ? (doctors.map.get(v.operatorDoctorId) ?? null) : null
      return {
        ...v,
        id: uid(),
        patientId,
        operatorDoctorId,
        measures: { ...v.measures },
        enabledGirths: [...v.enabledGirths],
        bia: { ...v.bia }
      }
    })
    .filter((v): v is Visit => v != null)
  const ws: WorkspaceMeta = { ...file.workspace, id: uid() }
  return {
    ...file,
    workspace: ws,
    doctors: doctors.items,
    patients: patients.items,
    visits,
    draft: {
      selectedPatientId: patients.items[0]?.id ?? null,
      selectedVisitId: visits[0]?.id ?? null,
      activeDoctorId: doctors.items[0]?.id ?? null
    },
    exportedAt: new Date().toISOString()
  }
}

export function serializeWorkspace(file: Omit<WorkspaceFile, 'kind' | 'version' | 'exportedAt'>): string {
  const out: WorkspaceFile = {
    kind: WORKSPACE_KIND,
    version: WORKSPACE_VERSION,
    exportedAt: new Date().toISOString(),
    ...file
  }
  return JSON.stringify(out, null, 2)
}

export function serializeAnagrafiche(doctors: DoctorProfile[], patients: PatientProfile[]): string {
  const file: AnagraficaFile = {
    kind: ANAGRAFICA_KIND,
    version: 1,
    exportedAt: new Date().toISOString(),
    doctors,
    patients
  }
  return JSON.stringify(file, null, 2)
}

export function serializeLibrary(patients: PatientProfile[], visits: Visit[]): string {
  const file: LibraryFile = {
    kind: LIBRARY_KIND,
    version: LIBRARY_VERSION,
    exportedAt: new Date().toISOString(),
    patients,
    visits
  }
  return JSON.stringify(file, null, 2)
}

export function parseLibrary(raw: unknown): LibraryFile | null {
  const ws = parseWorkspace(raw)
  if (!ws) return null
  return {
    kind: LIBRARY_KIND,
    version: LIBRARY_VERSION,
    exportedAt: ws.exportedAt,
    patients: ws.patients,
    visits: ws.visits
  }
}

export function cloneImportedLibrary(raw: unknown): { patients: PatientProfile[]; visits: Visit[] } | null {
  const cloned = cloneImportedWorkspace(raw)
  if (!cloned) return null
  return { patients: cloned.patients, visits: cloned.visits }
}

export function doctorFromStudio(studio: AppSettings['studio']): DoctorProfile {
  const parts = (studio.titolare || '').trim().split(/\s+/)
  const nome = parts.length > 1 ? parts.slice(1).join(' ') : ''
  const cognome = parts[0] && parts[0] !== 'Dott.' && parts[0] !== 'Dr.' ? parts[0] : parts.slice(-1)[0] ?? ''
  return emptyDoctor({
    titolo: studio.titolare.startsWith('Dott') ? 'Dott.' : '',
    nome: nome || 'Daniele',
    cognome: cognome || 'Gabrovec',
    qualification: studio.qualifica,
    structure: studio.nome,
    address: studio.sede,
    phone: studio.telefono,
    email: studio.email,
    website: studio.sito,
    orderName: studio.ordine,
    vatNumber: studio.piva
  })
}
