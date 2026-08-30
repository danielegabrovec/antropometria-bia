import { APP_NAME, APP_VERSION, COPYRIGHT_NOTICE, DISCLAIMER } from '../catalog/about'
import { doctorLabel, patientLabel } from '../library'
import type { DoctorProfile, PatientProfile, Visit, WorkspaceMeta } from '../types'
import { bivaChartSvg, bivaLegendHtml } from './biva-svg'
import type { BivaResult } from '../engine/bia'

const CSS = `
  :root { color-scheme: light; }
  * { box-sizing: border-box; }
  body { font-family: 'Segoe UI', Calibri, Arial, sans-serif; color: #1a1a1a; background: #fff; margin: 24px; line-height: 1.35; }
  h1 { font-size: 22px; margin: 0 0 4px; color: #1a1208; }
  h2 { font-size: 15px; margin: 22px 0 8px; border-bottom: 2px solid #d4a574; padding-bottom: 4px; letter-spacing: .04em; text-transform: uppercase; color: #8c6a45; }
  .mute { color: #5c564e; font-size: 12px; }
  .banner { background: #1a1208; color: #f4efe6; padding: 16px 18px; margin: -24px -24px 20px; border-bottom: 5px solid #d4a574; }
  .banner p { margin: 3px 0; }
  .banner .mute { color: #c4b8a8; }
  table { border-collapse: collapse; width: 100%; font-size: 13px; }
  th, td { border-bottom: 1px solid #d9d0c3; text-align: left; padding: 5px 6px; }
  th { font-size: 11px; letter-spacing: .06em; text-transform: uppercase; color: #6b6258; }
  .kpis { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin: 12px 0; }
  .kpi { border: 1px solid #d9d0c3; border-left: 3px solid #d4a574; padding: 10px 12px; break-inside: avoid; background: #fff; color: #1a1a1a; }
  .kpi .l { font-size: 10px; letter-spacing: .1em; text-transform: uppercase; color: #6b6258; }
  .kpi .v { font-size: 20px; font-variant-numeric: tabular-nums; }
  .legend-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; margin: 10px 0; font-size: 11px; }
  .legend-chip { display: flex; align-items: flex-start; gap: 6px; border: 1px solid #d9d0c3; padding: 6px 8px; }
  .legend-chip i { width: 10px; height: 10px; display: inline-block; margin-top: 3px; flex-shrink: 0; }
  svg { max-width: 100%; height: auto; }
  .foot { margin-top: 28px; font-size: 11px; color: #5c564e; white-space: pre-wrap; }
  .notice { border: 1px solid #dbc7ae; border-left: 4px solid #b87832; background: #fff9f1; padding: 9px 11px; margin: 8px 0; font-size: 12px; break-inside: avoid; }
  .notice strong { display: block; color: #7a4a18; margin-bottom: 2px; }
  .section { break-inside: avoid; }
  tr, svg, .legend-chip { break-inside: avoid; }
  @page { size: A4; margin: 12mm; }
  @media print {
    body { margin: 0; print-color-adjust: exact; -webkit-print-color-adjust: exact; }
    .banner { margin: 0 0 16px; }
    h2 { break-after: avoid; }
    .mute { font-size: 10px; }
    .legend-grid { gap: 4px; font-size: 9px; }
    .legend-chip { padding: 4px 6px; }
    .notice { padding: 6px 8px; font-size: 10px; }
    .foot { margin-top: 14px; font-size: 8px; line-height: 1.25; }
  }
`

export function htmlDocument(title: string, body: string): string {
  return `<!doctype html><html lang="it"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; img-src data:; font-src data:"><title>${escapeHtml(title)}</title><style>${CSS}</style></head><body>${body}
<div class="foot">${escapeHtml(DISCLAIMER)}

${escapeHtml(COPYRIGHT_NOTICE)}</div></body></html>`
}

export function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] as string)
}

export function headerBlock(workspace: WorkspaceMeta | null, doctor: DoctorProfile | null): string {
  return `<div class="banner">
<p class="mute">${escapeHtml(APP_NAME)} · v${APP_VERSION}${workspace ? ` · ${escapeHtml(workspace.name)}` : ''} · Creato da Daniele Gabrovec</p>
<p>${escapeHtml(doctorLabel(doctor))}${doctor?.qualification ? ` · ${escapeHtml(doctor.qualification)}` : ''}</p>
${doctor?.structure ? `<p class="mute">${escapeHtml(doctor.structure)}</p>` : ''}
${doctor && (doctor.address || doctor.city) ? `<p class="mute">${escapeHtml([doctor.address, doctor.zip, doctor.city].filter(Boolean).join(', '))}</p>` : ''}
${doctor && (doctor.orderName || doctor.orderNumber) ? `<p class="mute">${escapeHtml([doctor.orderName, doctor.orderNumber ? `n. ${doctor.orderNumber}` : ''].filter(Boolean).join(' '))}</p>` : ''}
${doctor && (doctor.email || doctor.phone || doctor.mobile) ? `<p class="mute">${escapeHtml([doctor.email, doctor.phone || doctor.mobile].filter(Boolean).join(' · '))}</p>` : ''}
</div>`
}

function anagraficheTables(doctors: DoctorProfile[], patients: PatientProfile[]): string {
  const docRows = doctors
    .map(
      (d) => `<tr><td>${escapeHtml(doctorLabel(d))}</td><td>${escapeHtml(d.qualification)}</td><td>${escapeHtml(d.email)}</td><td>${escapeHtml(d.phone || d.mobile)}</td><td>${escapeHtml(d.fiscalCode)}</td></tr>`
    )
    .join('')
  const patRows = patients
    .map(
      (p) => `<tr><td>${escapeHtml(patientLabel(p))}</td><td>${escapeHtml(p.sex === 'M' ? 'Maschio' : p.sex === 'F' ? 'Femmina' : '')}</td><td>${escapeHtml(p.birthDate ?? '')}</td><td>${escapeHtml(p.fiscalCode)}</td><td>${escapeHtml(p.phone)}</td><td>${escapeHtml(p.email)}</td></tr>`
    )
    .join('')
  return `<h2>Dottori (${doctors.length})</h2>
<table><thead><tr><th>Nome</th><th>Qualifica</th><th>Email</th><th>Telefono</th><th>CF</th></tr></thead><tbody>${docRows || '<tr><td colspan="5">—</td></tr>'}</tbody></table>
<h2>Pazienti (${patients.length})</h2>
<table><thead><tr><th>Nome</th><th>Sesso</th><th>Nascita</th><th>CF</th><th>Telefono</th><th>Email</th></tr></thead><tbody>${patRows || '<tr><td colspan="6">—</td></tr>'}</tbody></table>`
}

export function anagraficheHtml(
  workspace: WorkspaceMeta | null,
  doctors: DoctorProfile[],
  patients: PatientProfile[]
): string {
  const body = `${headerBlock(workspace, doctors[0] ?? null)}
<h1>Anagrafiche</h1>
${anagraficheTables(doctors, patients)}`
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
  const body = `${headerBlock(workspace, doctors[0] ?? null)}
<h1>Cartella ${escapeHtml(workspace?.name ?? '')}</h1>
<p class="mute">${doctors.length} dottori · ${patients.length} pazienti · ${visits.length} visite · tipo ${escapeHtml(workspace?.kind ?? '')}</p>
${anagraficheTables(doctors, patients)}
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
  gaugesHtml?: string
  biva?: BivaResult | null
  bivaTrail?: Array<{ rH: number; xcH: number; current?: boolean }>
  bivaText?: string
  notes?: string
  warnings?: string[]
  methods?: string[]
}): string {
  const kpi = opts.kpis
    .map(
      (k) =>
        `<div class="kpi"><div class="l">${escapeHtml(k.label)}</div><div class="v">${escapeHtml(k.value)}</div></div>`
    )
    .join('')
  const meas = opts.measures
    .map((m) => `<tr><td>${escapeHtml(m.label)}</td><td>${escapeHtml(m.value)}</td><td>${escapeHtml(m.delta)}</td></tr>`)
    .join('')
  const gauges = opts.gaugesHtml ?? ''
  const bivaBlock =
    opts.biva != null
      ? `<h2>BIVA</h2>${bivaChartSvg(opts.biva, opts.bivaTrail ?? [{ rH: opts.biva.rH, xcH: opts.biva.xcH, current: true }])}${bivaLegendHtml(opts.biva.phenotype.id)}<p class="mute">${escapeHtml(opts.bivaText ?? '')}</p>`
      : ''
  const notes = opts.notes?.trim() ? `<h2>Note</h2><p>${escapeHtml(opts.notes)}</p>` : ''
  const warnings = opts.warnings?.length
    ? `<h2>Avvertenze di applicabilità</h2>${opts.warnings.map((warning) => `<div class="notice"><strong>Da verificare nel contesto clinico</strong>${escapeHtml(warning)}</div>`).join('')}`
    : ''
  const methods = opts.methods?.length
    ? `<h2>Metodi e provenienza</h2><ul class="mute">${opts.methods.map((method) => `<li>${escapeHtml(method)}</li>`).join('')}</ul>`
    : ''
  const body = `${headerBlock(opts.workspace, opts.doctor)}
<h1>${escapeHtml(patientLabel(opts.patient))}</h1>
<p>${escapeHtml(opts.visit?.date ?? '')} · ${escapeHtml(opts.visit?.name ?? 'Visita')} · Operatore: ${escapeHtml(doctorLabel(opts.doctor))}</p>
<p class="mute">Peso ${opts.visit?.weightKg ?? '—'} kg · Altezza ${opts.visit?.heightCm ?? '—'} cm</p>
<h2>Sintesi</h2>
<div class="kpis">${kpi || '<div class="kpi"><div class="v">—</div></div>'}</div>
<h2>Fasce di normalità</h2>
${gauges || '<p class="mute">Nessuna fascia calcolabile.</p>'}
${bivaBlock}
${warnings}
<h2>Misure</h2>
<table><thead><tr><th>Sito</th><th>Valore</th><th>Δ</th></tr></thead><tbody>${meas || '<tr><td colspan="3">—</td></tr>'}</tbody></table>
${notes}
${methods}`
  return htmlDocument(`Report — ${patientLabel(opts.patient)} ${opts.visit?.date ?? ''}`, body)
}

export function andamentiHtml(opts: {
  workspace: WorkspaceMeta | null
  doctor: DoctorProfile | null
  patient: PatientProfile | null
  rows: Array<{ date: string; name: string; cells: string[] }>
  headers: string[]
  chartsHtml?: string
}): string {
  const head = opts.headers.map((h) => `<th>${escapeHtml(h)}</th>`).join('')
  const bodyRows = opts.rows
    .map((r) => `<tr><td>${escapeHtml(r.date)}</td><td>${escapeHtml(r.name)}</td>${r.cells.map((c) => `<td>${escapeHtml(c)}</td>`).join('')}</tr>`)
    .join('')
  const body = `${headerBlock(opts.workspace, opts.doctor)}
<h1>Andamenti · ${escapeHtml(patientLabel(opts.patient))}</h1>
<p class="mute">${opts.rows.length} visite nella cartella ${escapeHtml(opts.workspace?.name ?? '')}</p>
${opts.chartsHtml ?? ''}
<h2>Dati longitudinali</h2>
<table><thead><tr><th>Data</th><th>Nome</th>${head}</tr></thead><tbody>${bodyRows || '<tr><td colspan="8">—</td></tr>'}</tbody></table>`
  return htmlDocument(`Andamenti — ${patientLabel(opts.patient)}`, body)
}

export function trendChartSvg(opts: {
  title: string
  unit: string
  dates: string[]
  series: Array<{ label: string; color: string; values: Array<number | null> }>
}): string {
  const width = 760
  const height = 230
  const left = 54
  const right = 18
  const top = 40
  const bottom = 42
  const values = opts.series.flatMap((series) => series.values).filter((value): value is number => value != null && Number.isFinite(value))
  if (values.length === 0) return ''
  let min = Math.min(...values)
  let max = Math.max(...values)
  const spread = max - min || Math.max(Math.abs(max) * 0.1, 1)
  min -= spread * 0.12
  max += spread * 0.12
  const x = (index: number) => left + (opts.dates.length <= 1 ? (width - left - right) / 2 : (index / (opts.dates.length - 1)) * (width - left - right))
  const y = (value: number) => top + ((max - value) / (max - min)) * (height - top - bottom)
  const grid = Array.from({ length: 5 }, (_, index) => {
    const value = max - ((max - min) * index) / 4
    const py = y(value)
    return `<line x1="${left}" y1="${py}" x2="${width - right}" y2="${py}" stroke="#e5ded4"/><text x="${left - 7}" y="${py + 4}" text-anchor="end" font-size="10" fill="#6b6258">${escapeHtml(value.toLocaleString('it-IT', { maximumFractionDigits: 2 }))}</text>`
  }).join('')
  const paths = opts.series.map((series) => {
    let path = ''
    const points: string[] = []
    series.values.forEach((value, index) => {
      if (value == null || !Number.isFinite(value)) return
      const px = x(index)
      const py = y(value)
      path += `${path ? ' L' : 'M'} ${px.toFixed(2)} ${py.toFixed(2)}`
      points.push(`<circle cx="${px}" cy="${py}" r="3.2" fill="${escapeHtml(series.color)}"><title>${escapeHtml(`${series.label}: ${value.toLocaleString('it-IT')} ${opts.unit}`)}</title></circle>`)
    })
    return `${path ? `<path d="${path}" fill="none" stroke="${escapeHtml(series.color)}" stroke-width="2"/>` : ''}${points.join('')}`
  }).join('')
  const labels = opts.dates.map((date, index) => `<text x="${x(index)}" y="${height - 16}" text-anchor="middle" font-size="9" fill="#6b6258">${escapeHtml(date)}</text>`).join('')
  const legend = opts.series.map((series, index) => `<g transform="translate(${left + index * 170},18)"><line x1="0" y1="0" x2="18" y2="0" stroke="${escapeHtml(series.color)}" stroke-width="3"/><text x="24" y="4" font-size="10" fill="#433b32">${escapeHtml(series.label)}</text></g>`).join('')
  return `<section class="section"><h2>${escapeHtml(opts.title)}${opts.unit ? ` · ${escapeHtml(opts.unit)}` : ''}</h2><svg viewBox="0 0 ${width} ${height}" role="img" aria-label="${escapeHtml(opts.title)}">${legend}${grid}<line x1="${left}" y1="${height - bottom}" x2="${width - right}" y2="${height - bottom}" stroke="#8d8173"/>${paths}${labels}</svg></section>`
}
