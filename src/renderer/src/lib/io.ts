import { anagraficheDocxBase64 } from '@shared/export/docx'
import { anagraficheHtml, visitHtml, workspaceHtml } from '@shared/export/html'
import { anagraficheXls } from '@shared/export/xls'
import { cloneImportedWorkspace, parseAnagrafiche, serializeAnagrafiche, serializeWorkspace } from '@shared/library'
import type { DoctorProfile, PatientProfile, Visit, WorkspaceFile, WorkspaceMeta } from '@shared/types'
import { parseAnagraficheXls } from '@shared/export/xls'
import { useApp } from '../store/useApp'

async function saveText(defaultName: string, content: string, ext: string) {
  const res = await window.antropometriaBia?.exportFile({ defaultName, content, ext })
  if (res?.ok && res.path) await window.antropometriaBia?.openPath(res.path)
  return res
}

async function saveB64(defaultName: string, base64: string, ext: string) {
  const res = await window.antropometriaBia?.exportBuffer({ defaultName, base64, ext })
  if (res?.ok && res.path) await window.antropometriaBia?.openPath(res.path)
  return res
}

async function printOrPdf(html: string, pdfName?: string) {
  if (pdfName) {
    const res = await window.antropometriaBia?.pdfHtml(html, pdfName)
    if (res?.ok && res.path) await window.antropometriaBia?.openPath(res.path)
    return res
  }
  return window.antropometriaBia?.printHtml(html)
}

function snap() {
  const s = useApp.getState()
  return {
    workspace: s.workspace,
    doctors: s.doctors,
    patients: s.patients,
    visits: s.visits,
    file: s.snapshotWorkspace()
  }
}

export async function exportWorkspaceJson() {
  const { file } = snap()
  if (!file) return
  return saveText(`${file.workspace.name}.json`, serializeWorkspace(file), '.json')
}

export async function exportWorkspaceHtml() {
  const { workspace, doctors, patients, visits } = snap()
  return saveText(`${workspace?.name ?? 'cartella'}.html`, workspaceHtml(workspace, doctors, patients, visits), '.html')
}

export async function exportWorkspacePdf() {
  const { workspace, doctors, patients, visits } = snap()
  return printOrPdf(workspaceHtml(workspace, doctors, patients, visits), `${workspace?.name ?? 'cartella'}.pdf`)
}

export async function printWorkspace() {
  const { workspace, doctors, patients, visits } = snap()
  return printOrPdf(workspaceHtml(workspace, doctors, patients, visits))
}

export async function exportAnagraficheJson() {
  const { doctors, patients } = snap()
  return saveText('anagrafiche.json', serializeAnagrafiche(doctors, patients), '.json')
}

export async function exportAnagraficheHtml() {
  const { workspace, doctors, patients } = snap()
  return saveText('anagrafiche.html', anagraficheHtml(workspace, doctors, patients), '.html')
}

export async function exportAnagrafichePdf() {
  const { workspace, doctors, patients } = snap()
  return printOrPdf(anagraficheHtml(workspace, doctors, patients), 'anagrafiche.pdf')
}

export async function printAnagrafiche() {
  const { workspace, doctors, patients } = snap()
  return printOrPdf(anagraficheHtml(workspace, doctors, patients))
}

export async function exportAnagraficheXls() {
  const { doctors, patients } = snap()
  return saveText('anagrafiche.xls', anagraficheXls(doctors, patients), '.xls')
}

export async function exportAnagraficheDocx() {
  const { doctors, patients } = snap()
  return saveB64('anagrafiche.docx', anagraficheDocxBase64(doctors, patients), '.docx')
}

export async function exportVisitJson(visit: Visit, patient: PatientProfile | null) {
  return saveText(`visita-${patient?.alias ?? visit.id}.json`, JSON.stringify({ visit, patient }, null, 2), '.json')
}

export async function exportVisitHtml(html: string, name: string) {
  return saveText(name, html, '.html')
}

export async function exportVisitPdf(html: string, name: string) {
  return printOrPdf(html, name)
}

export async function printVisitHtml(html: string) {
  return printOrPdf(html)
}

export function buildVisitReportHtml(
  workspace: WorkspaceMeta | null,
  doctor: DoctorProfile | null,
  patient: PatientProfile | null,
  visit: Visit | null,
  kpis: Array<{ label: string; value: string }>,
  measures: Array<{ label: string; value: string; delta: string }>
) {
  return visitHtml({ workspace, doctor, patient, visit, kpis, measures })
}

export async function importWorkspaceJson(): Promise<WorkspaceFile | null> {
  const res = await window.antropometriaBia?.importFile([
    { name: 'JSON', extensions: ['json'] },
    { name: 'Tutti', extensions: ['*'] }
  ])
  if (!res?.ok || !res.content) return null
  try {
    const cloned = cloneImportedWorkspace(JSON.parse(res.content))
    if (!cloned) {
      window.alert('File non riconosciuto. Serve un JSON di cartella Antropometria BIA.')
      return null
    }
    return cloned
  } catch {
    window.alert('JSON non valido.')
    return null
  }
}

export async function importAnagrafiche(): Promise<{ doctors: DoctorProfile[]; patients: PatientProfile[] } | null> {
  const res = await window.antropometriaBia?.importFile([
    { name: 'JSON / XLS', extensions: ['json', 'xls', 'xlsx'] }
  ])
  if (!res?.ok) return null
  const text = res.content ?? ''
  try {
    if (text.includes('antropometria-bia-anagrafiche') || text.includes('antropometria-bia-workspace')) {
      const ana = parseAnagrafiche(JSON.parse(text))
      if (ana) return { doctors: ana.doctors, patients: ana.patients }
      const ws = cloneImportedWorkspace(JSON.parse(text))
      if (ws) return { doctors: ws.doctors, patients: ws.patients }
    }
    if (text.includes('urn:schemas-microsoft-com:office:spreadsheet') || text.includes('<Workbook')) {
      return parseAnagraficheXls(text)
    }
    window.alert('Formato anagrafiche non riconosciuto (JSON o XLS).')
    return null
  } catch {
    window.alert('File anagrafiche non valido.')
    return null
  }
}

export function mergeAnagrafiche(incoming: { doctors: DoctorProfile[]; patients: PatientProfile[] }) {
  const s = useApp.getState()
  const doctors = [...s.doctors]
  for (const d of incoming.doctors) {
    if (!doctors.some((x) => x.id === d.id)) doctors.push(d)
  }
  const patients = [...s.patients]
  for (const p of incoming.patients) {
    if (!patients.some((x) => x.id === p.id)) patients.push(p)
  }
  const file = s.snapshotWorkspace()
  if (!file) return
  s.replaceWorkspaceData({ ...file, doctors, patients })
}
