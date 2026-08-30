import { APP_NAME, COPYRIGHT_SHORT } from '../catalog/about'
import { doctorLabel, patientLabel } from '../library'
import type { DoctorProfile, PatientProfile } from '../types'
import { zipStore, toBase64 } from './zip'

function w(s: string): string {
  return s.replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[c] as string)
}

function para(text: string, bold = false): string {
  return `<w:p><w:r>${bold ? '<w:rPr><w:b/></w:rPr>' : ''}<w:t xml:space="preserve">${w(text)}</w:t></w:r></w:p>`
}

/** Minimal Office Open XML document (ZIP-less fallback: Word HTML in a .doc compatible package). */
export function anagraficheDocxXml(doctors: DoctorProfile[], patients: PatientProfile[]): string {
  const docs = doctors.map((d) => para(`${doctorLabel(d)} — ${d.qualification} — ${d.email} — ${d.phone || d.mobile}`)).join('')
  const pats = patients
    .map((p) => para(`${patientLabel(p)} · ${p.sex ?? '—'} · ${p.birthDate ?? '—'} · CF ${p.fiscalCode || '—'}`))
    .join('')
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
<w:body>
${para(APP_NAME, true)}
${para('Anagrafiche')}
${para('Dottori', true)}
${docs || para('—')}
${para('Pazienti', true)}
${pats || para('—')}
${para(COPYRIGHT_SHORT)}
<w:sectPr/></w:body></w:document>`
}

export function anagraficheWordHtml(doctors: DoctorProfile[], patients: PatientProfile[]): string {
  const d = doctors
    .map((x) => `<tr><td>${w(doctorLabel(x))}</td><td>${w(x.qualification)}</td><td>${w(x.email)}</td><td>${w(x.phone || x.mobile)}</td></tr>`)
    .join('')
  const p = patients
    .map(
      (x) =>
        `<tr><td>${w(patientLabel(x))}</td><td>${w(x.sex ?? '')}</td><td>${w(x.birthDate ?? '')}</td><td>${w(x.fiscalCode)}</td><td>${w(x.phone)}</td><td>${w(x.email)}</td></tr>`
    )
    .join('')
  return `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word">
<head><meta charset="utf-8"><title>Anagrafiche</title></head>
<body>
<h1>${w(APP_NAME)} — Anagrafiche</h1>
<h2>Dottori</h2>
<table border="1" cellspacing="0" cellpadding="4"><tr><th>Nome</th><th>Qualifica</th><th>Email</th><th>Telefono</th></tr>${d}</table>
<h2>Pazienti</h2>
<table border="1" cellspacing="0" cellpadding="4"><tr><th>Nome</th><th>Sesso</th><th>Nascita</th><th>CF</th><th>Telefono</th><th>Email</th></tr>${p}</table>
<p>${w(COPYRIGHT_SHORT)}</p>
</body></html>`
}

const CONTENT_TYPES = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
<Default Extension="xml" ContentType="application/xml"/>
<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>`

const RELS = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`

export function anagraficheDocx(doctors: DoctorProfile[], patients: PatientProfile[]): Uint8Array {
  return zipStore([
    { name: '[Content_Types].xml', data: CONTENT_TYPES },
    { name: '_rels/.rels', data: RELS },
    { name: 'word/document.xml', data: anagraficheDocxXml(doctors, patients) }
  ])
}

export function anagraficheDocxBase64(doctors: DoctorProfile[], patients: PatientProfile[]): string {
  return toBase64(anagraficheDocx(doctors, patients))
}
