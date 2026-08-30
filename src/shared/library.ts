import type { LibraryFile, PatientProfile, Visit } from './types'
import { LIBRARY_KIND, LIBRARY_VERSION } from './types'

export function uid(): string {
  return crypto.randomUUID?.() ?? Math.random().toString(36).slice(2, 10)
}

export function cloneImportedLibrary(raw: unknown): { patients: PatientProfile[]; visits: Visit[] } | null {
  const file = parseLibrary(raw)
  if (!file) return null
  const idMap = new Map<string, string>()
  const patients = file.patients.map((p) => {
    const id = uid()
    idMap.set(p.id, id)
    return { ...p, id }
  })
  const visits = file.visits
    .map((v) => {
      const patientId = idMap.get(v.patientId)
      if (!patientId) return null
      return { ...v, id: uid(), patientId, measures: { ...v.measures }, bia: { ...v.bia } }
    })
    .filter((v): v is Visit => v != null)
  return { patients, visits }
}

export function parseLibrary(raw: unknown): LibraryFile | null {
  if (!raw || typeof raw !== 'object') return null
  const o = raw as Record<string, unknown>
  if (o.kind !== LIBRARY_KIND) return null
  if (!Array.isArray(o.patients) || !Array.isArray(o.visits)) return null
  return {
    kind: LIBRARY_KIND,
    version: LIBRARY_VERSION,
    exportedAt: typeof o.exportedAt === 'string' ? o.exportedAt : new Date().toISOString(),
    patients: o.patients as PatientProfile[],
    visits: o.visits as Visit[]
  }
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
