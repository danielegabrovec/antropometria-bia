import { doctorLabel, patientLabel } from '../library'
import type { DoctorProfile, PatientProfile } from '../types'
import { normalizeDoctor, normalizePatient } from '../library'

function cell(v: string): string {
  return `<Cell><Data ss:Type="String">${escapeXml(v)}</Data></Cell>`
}

function escapeXml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' })[c] as string)
}

const DOCTOR_HEADERS = [
  'titolo',
  'nome',
  'cognome',
  'qualifica',
  'cf',
  'piva',
  'ordine',
  'nIscrizione',
  'struttura',
  'indirizzo',
  'cap',
  'citta',
  'telefono',
  'cellulare',
  'email',
  'pec',
  'sito'
]

const PATIENT_HEADERS = ['nome', 'cognome', 'sesso', 'nascita', 'cf', 'telefono', 'email', 'indirizzo', 'note']

export function anagraficheXls(doctors: DoctorProfile[], patients: PatientProfile[]): string {
  const doctorRows = [
    `<Row>${DOCTOR_HEADERS.map((h) => cell(h)).join('')}</Row>`,
    ...doctors.map(
      (d) =>
        `<Row>${[
          d.titolo,
          d.nome,
          d.cognome,
          d.qualification,
          d.fiscalCode,
          d.vatNumber,
          d.orderName,
          d.orderNumber,
          d.structure,
          d.address,
          d.zip,
          d.city,
          d.phone,
          d.mobile,
          d.email,
          d.pec,
          d.website
        ]
          .map((x) => cell(x))
          .join('')}</Row>`
    )
  ].join('')
  const patientRows = [
    `<Row>${PATIENT_HEADERS.map((h) => cell(h)).join('')}</Row>`,
    ...patients.map(
      (p) =>
        `<Row>${[p.nome, p.cognome, p.sex ?? '', p.birthDate ?? '', p.fiscalCode, p.phone, p.email, p.address, p.notes]
          .map((x) => cell(x))
          .join('')}</Row>`
    )
  ].join('')
  return `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
<Worksheet ss:Name="Dottori"><Table>${doctorRows}</Table></Worksheet>
<Worksheet ss:Name="Pazienti"><Table>${patientRows}</Table></Worksheet>
</Workbook>`
}

function parseSheet(xml: string, name: string): string[][] {
  const block = xml.match(new RegExp(`ss:Name="${name}"[\\s\\S]*?<Table>([\\s\\S]*?)</Table>`))
  if (!block) return []
  const rows: string[][] = []
  const rowRe = /<Row>([\s\S]*?)<\/Row>/g
  let m: RegExpExecArray | null
  while ((m = rowRe.exec(block[1]))) {
    const cells: string[] = []
    const cellRe = /<Data[^>]*>([\s\S]*?)<\/Data>/g
    let c: RegExpExecArray | null
    while ((c = cellRe.exec(m[1]))) cells.push(decodeXml(c[1]))
    rows.push(cells)
  }
  return rows
}

function decodeXml(s: string): string {
  return s.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&amp;/g, '&')
}

export function parseAnagraficheXls(xml: string): { doctors: DoctorProfile[]; patients: PatientProfile[] } {
  const dRows = parseSheet(xml, 'Dottori')
  const pRows = parseSheet(xml, 'Pazienti')
  const doctors = dRows.slice(1).map((r) =>
    normalizeDoctor({
      titolo: r[0],
      nome: r[1],
      cognome: r[2],
      qualification: r[3],
      fiscalCode: r[4],
      vatNumber: r[5],
      orderName: r[6],
      orderNumber: r[7],
      structure: r[8],
      address: r[9],
      zip: r[10],
      city: r[11],
      phone: r[12],
      mobile: r[13],
      email: r[14],
      pec: r[15],
      website: r[16]
    })
  )
  const patients = pRows.slice(1).map((r) =>
    normalizePatient({
      nome: r[0],
      cognome: r[1],
      sex: r[2] === 'M' || r[2] === 'F' || r[2] === 'Altro' ? r[2] : null,
      birthDate: r[3] || null,
      fiscalCode: r[4],
      phone: r[5],
      email: r[6],
      address: r[7],
      notes: r[8]
    })
  )
  return {
    doctors: doctors.filter((d): d is DoctorProfile => d != null && Boolean(d.nome || d.cognome)),
    patients: patients.filter((p): p is PatientProfile => p != null && Boolean(p.nome || p.cognome))
  }
}

void doctorLabel
void patientLabel
