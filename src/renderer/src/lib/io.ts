import { anagraficheDocxBase64 } from '@shared/export/docx'
import { andamentiHtml, anagraficheHtml, trendChartSvg, visitHtml, workspaceHtml } from '@shared/export/html'
import { anagraficheXls } from '@shared/export/xls'
import { cloneImportedWorkspace, parseAnagrafiche, serializeAnagrafiche, serializeWorkspace } from '@shared/library'
import type { DoctorProfile, PatientProfile, Visit, WorkspaceFile, WorkspaceMeta } from '@shared/types'
import { parseAnagraficheXls } from '@shared/export/xls'
import { assessVisit, buildBivaInterpretation, renderGaugesVisitaHtml } from '@shared/engine'
import { MEASURES } from '@shared/catalog/measures'
import { useApp, currentDoctor } from '../store/useApp'
import { patientLabel, patientVisits, referenceVisit } from './delta'
import { fmt, fmtDelta } from './format'
import { flushPersist } from './persist'

function downloadFallback(defaultName: string, content: string, mime = 'text/plain;charset=utf-8') {
  const blob = new Blob([content], { type: mime })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = defaultName
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
  return { ok: true as const, path: undefined as string | undefined }
}

async function saveText(defaultName: string, content: string, ext: string) {
  try {
    await flushPersist()
    const api = window.antropometriaBia
    if (api?.exportFile) {
      const res = await api.exportFile({ defaultName, content, ext })
      if (res?.ok && res.path) await api.openPath(res.path)
      return res
    }
    return downloadFallback(defaultName, content)
  } catch (err) {
    console.error(err)
    window.alert('Esportazione non riuscita.')
    return { ok: false as const }
  }
}

async function saveB64(defaultName: string, base64: string, ext: string) {
  try {
    await flushPersist()
    const api = window.antropometriaBia
    if (api?.exportBuffer) {
      const res = await api.exportBuffer({ defaultName, base64, ext })
      if (res?.ok && res.path) await api.openPath(res.path)
      return res
    }
    window.alert('Salvataggio binario disponibile solo nell’app desktop.')
    return { ok: false as const }
  } catch (err) {
    console.error(err)
    window.alert('Esportazione non riuscita.')
    return { ok: false as const }
  }
}

async function printOrPdf(html: string, pdfName?: string) {
  try {
    await flushPersist()
    const api = window.antropometriaBia
    if (pdfName) {
      if (api?.pdfHtml) {
        const res = await api.pdfHtml(html, pdfName)
        if (res?.ok && res.path) await api.openPath(res.path)
        return res
      }
      return downloadFallback(pdfName.replace(/\.pdf$/i, '.html'), html, 'text/html;charset=utf-8')
    }
    if (api?.printHtml) return api.printHtml(html)
    const w = window.open('', '_blank')
    if (!w) {
      window.alert('Il browser ha bloccato la finestra di stampa.')
      return { ok: false as const }
    }
    w.document.write(html)
    w.document.close()
    w.focus()
    w.print()
    return { ok: true as const }
  } catch (err) {
    console.error(err)
    window.alert('Stampa o PDF non riusciti. Prova l’export HTML.')
    return { ok: false as const }
  }
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

function slugName(patient: PatientProfile | null, visit: Visit | null, prefix: string) {
  const who = patientLabel(patient).replace(/[^\p{L}\p{N}]+/gu, '-') || 'paziente'
  return `${prefix}-${who}-${visit?.date ?? 'cartella'}`
}

export function buildFullVisitHtml(): string | null {
  const s = useApp.getState()
  const patient = s.patients.find((p) => p.id === s.selectedPatientId) ?? null
  const visit = s.visits.find((v) => v.id === s.selectedVisitId) ?? null
  if (!visit || !patient) {
    window.alert('Seleziona un paziente e una visita da esportare.')
    return null
  }
  const doctor = currentDoctor()
  const deltaMode = s.settings.deltaMode
  const ordered = patientVisits(s.visits, patient.id)
  const ref = referenceVisit(ordered, visit.id, deltaMode)
  const a = assessVisit(patient, visit)
  const biva = a.bia.assessment?.biva ?? null
  const trail = ordered
    .map((v) => {
      if (v.bia.deviceProfileId !== visit.bia.deviceProfileId) return null
      const r = assessVisit(patient, v).bia.assessment?.biva
      return r ? { rH: r.rH, xcH: r.xcH, current: v.id === visit.id } : null
    })
    .filter((x): x is { rH: number; xcH: number; current: boolean } => x != null)
  const gauges = renderGaugesVisitaHtml({
    fatPercent: a.anthro.pliche?.fmPct ?? null,
    waistHipRatio: a.anthro.whr,
    waistCm: visit.measures.vita ?? null,
    heightCm: visit.heightCm,
    bmi: a.anthro.bmi,
    sex: a.sex,
    ageYears: a.age,
    idPrefix: `visita-${visit.id}`
  })
  return visitHtml({
    workspace: s.workspace,
    doctor,
    patient,
    visit,
    kpis: [
      { label: 'Età', value: a.age > 0 ? String(a.age) : '—' },
      { label: 'Sesso', value: a.sex === 'M' ? 'Maschio' : a.sex === 'F' ? 'Femmina' : '—' },
      { label: 'Peso', value: visit.weightKg != null ? `${fmt(visit.weightKg)} kg` : '—' },
      { label: 'Altezza', value: visit.heightCm != null ? `${fmt(visit.heightCm, 0)} cm` : '—' },
      { label: 'FM% pliche', value: fmt(a.anthro.pliche?.fmPct) },
      { label: 'FFM kg', value: fmt(a.anthro.pliche?.ffmKg) },
      { label: 'BMI', value: fmt(a.anthro.bmi) },
      { label: 'BMR kcal', value: fmt(a.energy.bmr, 0) },
      { label: 'TDEE kcal', value: fmt(a.energy.tdee, 0) },
      { label: 'PhA', value: fmt(a.bia.signal?.phaseAngleDeg) },
      { label: 'FM% BIA', value: fmt(a.bia.assessment?.metrics.fmPercent?.value) },
      { label: 'TBW', value: a.bia.assessment?.metrics.tbw ? `${fmt(a.bia.assessment.metrics.tbw.value)} L` : '—' },
      { label: 'ECW', value: a.bia.assessment?.metrics.ecw ? `${fmt(a.bia.assessment.metrics.ecw.value)} L` : '—' },
      { label: 'ICW', value: a.bia.assessment?.metrics.icw ? `${fmt(a.bia.assessment.metrics.icw.value)} L` : '—' },
      { label: 'ECW/TBW', value: fmt(a.bia.assessment?.metrics.ecwTbwRatio?.value, 3) },
      { label: 'ICW/TBW', value: fmt(a.bia.assessment?.metrics.icwTbwRatio?.value, 3) },
      { label: 'SMM', value: a.bia.assessment?.metrics.skeletalMuscleMass ? `${fmt(a.bia.assessment.metrics.skeletalMuscleMass.value)} kg` : '—' },
      { label: 'SMI', value: a.bia.assessment?.metrics.skeletalMuscleIndex ? `${fmt(a.bia.assessment.metrics.skeletalMuscleIndex.value, 2)} kg/m²` : '—' }
    ],
    measures: MEASURES.filter((m) => visit.measures[m.key] != null).map((m) => {
      const cur = visit.measures[m.key]
      const prev = ref?.measures[m.key]
      return {
        label: `${m.label} ${m.unit}`,
        value: fmt(cur),
        delta: cur != null && prev != null ? fmtDelta(cur - prev) : '—'
      }
    }),
    gaugesHtml: gauges,
    biva,
    bivaTrail: trail,
    bivaText: biva ? buildBivaInterpretation(biva, 'it') : undefined,
    notes: visit.notes,
    warnings: [
      ...(a.anthro.pliche?.fuoriValidita
        ? [`La formula plicometrica selezionata è fuori dalla finestra di età ${a.anthro.pliche.fuoriValidita.min}–${a.anthro.pliche.fuoriValidita.max} anni.`]
        : []),
      ...(a.bia.assessment?.qualityFlags.map((flag) => flag.message) ?? []),
      ...(a.bia.blockedReason ? [a.bia.blockedReason] : [])
    ],
    methods: [
      `Plicometria: ${visit.eqDensitaPliche} + ${visit.eqMassaGrassa}`,
      `BMR: ${visit.formulaBmr}; LAF ${fmt(visit.laf, 2)}`,
      'BIA: Sun 2003 (composizione), Janssen 2000 (SMM), Sergi 1994 (ECW) quando applicabili.',
      biva ? `BIVA: ${biva.reference.label} (${biva.reference.version}).` : 'BIVA: non classificabile per questa visita.'
    ]
  })
}

export function buildAndamentiReportHtml(): string | null {
  const s = useApp.getState()
  const patient = s.patients.find((p) => p.id === s.selectedPatientId) ?? null
  if (!patient) {
    window.alert('Seleziona un paziente per esportare gli andamenti.')
    return null
  }
  const ordered = patientVisits(s.visits, patient.id)
  if (ordered.length === 0) {
    window.alert('Nessuna visita su questo paziente.')
    return null
  }
  const headers = ['Peso', 'BMI', 'FM% pliche', 'FM% BIA', 'FFM pliche', 'BMR', 'TDEE', 'PhA', 'TBW']
  const rows = ordered.map((v) => {
    const a = assessVisit(patient, v)
    return {
      date: v.date,
      name: v.name || 'Visita',
      cells: [
        fmt(v.weightKg),
        fmt(a.anthro.bmi),
        fmt(a.anthro.pliche?.fmPct),
        fmt(a.bia.assessment?.metrics.fmPercent?.value),
        fmt(a.anthro.pliche?.ffmKg),
        fmt(a.energy.bmr, 0),
        fmt(a.energy.tdee, 0),
        fmt(a.bia.signal?.phaseAngleDeg),
        fmt(a.bia.assessment?.metrics.tbw?.value)
      ]
    }
  })
  const assessments = ordered.map((visit) => ({ visit, assessed: assessVisit(patient, visit) }))
  const dates = ordered.map((visit) => visit.date)
  const chartsHtml = [
    trendChartSvg({
      title: 'Peso e massa priva di grasso',
      unit: 'kg',
      dates,
      series: [
        { label: 'Peso', color: '#9a642f', values: assessments.map(({ visit }) => visit.weightKg) },
        { label: 'FFM pliche', color: '#13796b', values: assessments.map(({ assessed }) => assessed.anthro.pliche?.ffmKg ?? null) },
        { label: 'FFM BIA', color: '#355f9b', values: assessments.map(({ assessed }) => assessed.bia.assessment?.metrics.ffm?.value ?? null) }
      ]
    }),
    trendChartSvg({
      title: 'Massa grassa',
      unit: '%',
      dates,
      series: [
        { label: 'Pliche', color: '#a14562', values: assessments.map(({ assessed }) => assessed.anthro.pliche?.fmPct ?? null) },
        { label: 'BIA', color: '#6d4fa3', values: assessments.map(({ assessed }) => assessed.bia.assessment?.metrics.fmPercent?.value ?? null) }
      ]
    }),
    trendChartSvg({
      title: 'Dispendio energetico',
      unit: 'kcal/die',
      dates,
      series: [
        { label: 'BMR', color: '#9a642f', values: assessments.map(({ assessed }) => assessed.energy.bmr) },
        { label: 'TDEE', color: '#13796b', values: assessments.map(({ assessed }) => assessed.energy.tdee) }
      ]
    }),
    trendChartSvg({
      title: 'Compartimenti idrici stimati',
      unit: 'L',
      dates,
      series: [
        { label: 'TBW', color: '#2563a5', values: assessments.map(({ assessed }) => assessed.bia.assessment?.metrics.tbw?.value ?? null) },
        { label: 'ECW', color: '#9a642f', values: assessments.map(({ assessed }) => assessed.bia.assessment?.metrics.ecw?.value ?? null) },
        { label: 'ICW', color: '#13796b', values: assessments.map(({ assessed }) => assessed.bia.assessment?.metrics.icw?.value ?? null) }
      ]
    })
  ].join('')
  return andamentiHtml({
    workspace: s.workspace,
    doctor: currentDoctor(),
    patient,
    headers,
    rows,
    chartsHtml
  })
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

export async function exportVisitJson(visit?: Visit, patient?: PatientProfile | null) {
  const s = useApp.getState()
  const v = visit ?? s.visits.find((x) => x.id === s.selectedVisitId) ?? null
  const p = patient !== undefined ? patient : s.patients.find((x) => x.id === s.selectedPatientId) ?? null
  if (!v) {
    window.alert('Seleziona una visita da esportare.')
    return
  }
  return saveText(`${slugName(p, v, 'visita')}.json`, JSON.stringify({ visit: v, patient: p }, null, 2), '.json')
}

export async function exportVisitHtml(html?: string, name?: string) {
  const body = html ?? buildFullVisitHtml()
  if (!body) return
  const s = useApp.getState()
  const visit = s.visits.find((v) => v.id === s.selectedVisitId) ?? null
  const patient = s.patients.find((p) => p.id === s.selectedPatientId) ?? null
  return saveText(name ?? `${slugName(patient, visit, 'visita')}.html`, body, '.html')
}

export async function exportVisitPdf(html?: string, name?: string) {
  const body = html ?? buildFullVisitHtml()
  if (!body) return
  const s = useApp.getState()
  const visit = s.visits.find((v) => v.id === s.selectedVisitId) ?? null
  const patient = s.patients.find((p) => p.id === s.selectedPatientId) ?? null
  return printOrPdf(body, name ?? `${slugName(patient, visit, 'visita')}.pdf`)
}

export async function printVisitHtml(html?: string) {
  const body = html ?? buildFullVisitHtml()
  if (!body) return
  return printOrPdf(body)
}

export async function exportAndamentiHtml() {
  const html = buildAndamentiReportHtml()
  if (!html) return
  const s = useApp.getState()
  const patient = s.patients.find((p) => p.id === s.selectedPatientId) ?? null
  return saveText(`${slugName(patient, null, 'andamenti')}.html`, html, '.html')
}

export async function exportAndamentiPdf() {
  const html = buildAndamentiReportHtml()
  if (!html) return
  const s = useApp.getState()
  const patient = s.patients.find((p) => p.id === s.selectedPatientId) ?? null
  return printOrPdf(html, `${slugName(patient, null, 'andamenti')}.pdf`)
}

export async function printAndamenti() {
  const html = buildAndamentiReportHtml()
  if (!html) return
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
    { name: 'JSON Antropometria BIA', extensions: ['json'] }
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
  const identity = (...values: Array<string | null | undefined>) =>
    values.map((value) => (value ?? '').trim().toLocaleLowerCase('it-IT')).join('|')
  for (const d of incoming.doctors) {
    const duplicate = doctors.some(
      (x) =>
        x.id === d.id ||
        (d.fiscalCode && identity(x.fiscalCode) === identity(d.fiscalCode)) ||
        (d.email && identity(x.email) === identity(d.email)) ||
        identity(x.nome, x.cognome, x.orderNumber) === identity(d.nome, d.cognome, d.orderNumber)
    )
    if (!duplicate) doctors.push(d)
  }
  const patients = [...s.patients]
  for (const p of incoming.patients) {
    const duplicate = patients.some(
      (x) =>
        x.id === p.id ||
        (p.fiscalCode && identity(x.fiscalCode) === identity(p.fiscalCode)) ||
        (p.email && identity(x.email) === identity(p.email)) ||
        identity(x.nome, x.cognome, x.birthDate) === identity(p.nome, p.cognome, p.birthDate)
    )
    if (!duplicate) patients.push(p)
  }
  const file = s.snapshotWorkspace()
  if (!file) return
  s.replaceWorkspaceData({ ...file, doctors, patients })
}
