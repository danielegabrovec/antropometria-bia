import type { PatientProfile, Visit } from '@shared/types'
import type { DeltaMode } from '@shared/types'
import { patientLabel as label } from '@shared/library'

export { patientLabel } from '@shared/library'

export function patientVisits(visits: Visit[], patientId: string | null): Visit[] {
  return visits
    .filter((v) => v.patientId === patientId)
    .sort((a, b) => a.date.localeCompare(b.date) || a.createdAt.localeCompare(b.createdAt))
}

export function referenceVisit(ordered: Visit[], currentId: string | null, mode: DeltaMode): Visit | null {
  if (!currentId || ordered.length === 0) return null
  const idx = ordered.findIndex((v) => v.id === currentId)
  if (idx < 0) return null
  if (mode === 'prima') return ordered[0]?.id === currentId ? null : ordered[0]
  return idx > 0 ? ordered[idx - 1] : null
}

void label
void (null as unknown as PatientProfile)
