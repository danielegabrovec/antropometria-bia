import { APP_NAME, APP_VERSION, COPYRIGHT_NOTICE, DISCLAIMER } from '../catalog/about'
import { doctorLabel, patientLabel } from '../library'
import type { DoctorProfile, PatientProfile, Visit, WorkspaceMeta } from '../types'

const CSS = `
  :root { color-scheme: light; }
  body { font-family: 'Segoe UI', Calibri, Arial, sans-serif; color: #1a1a1a; background: #fff; margin: 24px; }
  h1 { font-size: 22px; margin: 0 0 4px; }
  h2 { font-size: 16px; margin: 22px 0 8px; border-bottom: 1px solid #d9d0c3; padding-bottom: 4px; }
  .mute { color: #5c564e; font-size: 12px; }
  table { border-collapse: collapse; width: 100%; font-size: 13px; }
  th, td { border-bottom: 1px solid #d9d0c3; text-align: left; padding: 5px 6px; }
  th { font-size: 11px; letter-spacing: .06em; text-transform: uppercase; color: #6b6258; }
  .foot { margin-top: 28px; font-size: 11px; color: #5c564e; white-space: pre-wrap; }
`

export function htmlDocument(title: string, body: string): string {
  return `<!doctype html><html lang="it"><head><meta charset="utf-8"><title>${escapeHtml(title)}</title><style>${CSS}</style></head><body>${body}
<div class="foot">${escapeHtml(DISCLAIMER)}

${escapeHtml(COPYRIGHT_NOTICE)}</div></body></html>`
}

export function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] as string)
}

export function headerBlock(workspace: WorkspaceMeta | null, doctor: DoctorProfile | null): string {
  return `<p class="mute">${escapeHtml(APP_NAME)} · v${APP_VERSION}${workspace ? ` · ${escapeHtml(workspace.name)}` : ''}</p>
<p class="mute">${escapeHtml(doctorLabel(doctor))}${doctor?.qualification ? ` · ${escapeHtml(doctor.qualification)}` : ''}</p>`
}

export function anagraficheHtml(
  workspace: WorkspaceMeta | null,
  doctors: DoctorProfile[],
  patients: PatientProfile[]
): string {
  const docRows = doctors
    .map(
      (d) => `<tr><td>${escapeHtml(doctorLabel(d))}</td><td>${escapeHtml(d.qualification)}</td><td>${escapeHtml(d.email)}</td><td>${escapeHtml(d.phone || d.mobile)}</td><td>${escapeHtml(d.fiscalCode)}</td></tr>`
    )
    .join('')
  const patRows = patients
    .map(
      (p) => `<tr><td>${escapeHtml(patientLabel(p))}</td><td>${escapeHtml(p.sex ?? '')}</td><td>${escapeHtml(p.birthDate ?? '')}</td><td>${escapeHtml(p.fiscalCode)}</td><td>${escapeHtml(p.phone)}</td><td>${escapeHtml(p.email)}</td></tr>`
    )
    .join('')
  const body = `${headerBlock(workspace, doctors[0] ?? null)}
<h1>Anagrafiche</h1>
<h2>Dottori (${doctors.length})</h2>
<table><thead><tr><th>Nome</th><th>Qualifica</th><th>Email</th><th>Telefono</th><th>CF</th></tr></thead><tbody>${docRows || '<tr><td colspan="5">—</td></tr>'}</tbody></table>
<h2>Pazienti (${patients.length})</h2>
<table><thead><tr><th>Nome</th><th>Sesso</th><th>Nascita</th><th>CF</th><th>Telefono</th><th>Email</th></tr></thead><tbody>${patRows || '<tr><td colspan="6">—</td></tr>'}</tbody></table>`
  return htmlDocument(`Anagrafiche — ${workspace?.name ?? APP_NAME}`, body)
}

export function workspaceHtml(
  workspace: WorkspaceMeta | null,
  doctors: DoctorProfile[],
  patients: PatientProfile[],
  visits: Visit[]
): string {
  const rows = visits
    .slice()
    .sort((a, b) => b.date.localeCompare(a.date))
    .map((v) => {
      const p = patients.find((x) => x.id === v.patientId)
      const d = doctors.find((x) => x.id === v.operatorDoctorId)
      return `<tr><td>${escapeHtml(v.date)}</td><td>${escapeHtml(patientLabel(p))}</td><td>${escapeHtml(doctorLabel(d ?? null))}</td><td>${v.weightKg ?? '—'}</td><td>${v.heightCm ?? '—'}</td></tr>`
    })
    .join('')
  const inner = anagraficheHtml(workspace, doctors, patients)
  const tables = inner.includes('<h2>') ? inner.slice(inner.indexOf('<h2>'), inner.indexOf('<div class="foot">')) : ''
  const body = `${headerBlock(workspace, doctors[0] ?? null)}
<h1>Cartella ${escapeHtml(workspace?.name ?? '')}</h1>
<p class="mute">${doctors.length} dottori · ${patients.length} pazienti · ${visits.length} visite · tipo ${escapeHtml(workspace?.kind ?? '')}</p>
${tables}
<h2>Visite</h2>
<table><thead><tr><th>Data</th><th>Paziente</th><th>Operatore</th><th>Peso</th><th>Altezza</th></tr></thead><tbody>${rows || '<tr><td colspan="5">—</td></tr>'}</tbody></table>`
  return htmlDocument(`Cartella — ${workspace?.name ?? APP_NAME}`, body)
}

export function visitHtml(opts: {
  workspace: WorkspaceMeta | null
  doctor: DoctorProfile | null
  patient: PatientProfile | null
  visit: Visit | null
  kpis: Array<{ label: string; value: string }>
  measures: Array<{ label: string; value: string; delta: string }>
}): string {
  const kpi = opts.kpis.map((k) => `<tr><td>${escapeHtml(k.label)}</td><td>${escapeHtml(k.value)}</td></tr>`).join('')
  const meas = opts.measures
    .map((m) => `<tr><td>${escapeHtml(m.label)}</td><td>${escapeHtml(m.value)}</td><td>${escapeHtml(m.delta)}</td></tr>`)
    .join('')
  const body = `${headerBlock(opts.workspace, opts.doctor)}
<h1>${escapeHtml(patientLabel(opts.patient))}</h1>
<p>${escapeHtml(opts.visit?.date ?? '')} · Operatore: ${escapeHtml(doctorLabel(opts.doctor))}</p>
<h2>Sintesi</h2>
<table><tbody>${kpi || '<tr><td>—</td></tr>'}</tbody></table>
<h2>Misure</h2>
<table><thead><tr><th>Sito</th><th>Valore</th><th>Δ</th></tr></thead><tbody>${meas || '<tr><td colspan="3">—</td></tr>'}</tbody></table>`
  return htmlDocument(`Report — ${patientLabel(opts.patient)}`, body)
}
