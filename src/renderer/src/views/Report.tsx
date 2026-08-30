import { patientLabel } from '../lib/delta'
import { useApp } from '../store/useApp'
import {
  buildFullVisitHtml,
  exportVisitHtml,
  exportVisitJson,
  exportVisitPdf,
  printVisitHtml
} from '../lib/io'
import { VisitContext } from '../components/VisitContext'

export function Report() {
  const patients = useApp((state) => state.patients)
  const visits = useApp((state) => state.visits)
  const patientId = useApp((state) => state.selectedPatientId)
  const visitId = useApp((state) => state.selectedVisitId)
  const patient = patients.find((item) => item.id === patientId) ?? null
  const visit = visits.find((item) => item.id === visitId) ?? null
  const previewHtml = patient && visit ? buildFullVisitHtml() : null
  const fileBase = `report-${patientLabel(patient).replace(/[^\p{L}\p{N}]+/gu, '-')}-${visit?.date ?? ''}`

  return (
    <div className="wide-page report-page">
      <VisitContext />
      <div className="report-toolbar no-print" aria-label="Azioni report">
        <div>
          <div className="hair">Anteprima fedele</div>
          <p className="text-[12px] text-[var(--color-mute)] mt-1">
            Questa anteprima usa lo stesso documento di PDF, HTML e stampa.
          </p>
        </div>
        <span className="report-toolbar-spacer" />
        <button className="primary" disabled={!previewHtml} onClick={() => previewHtml && void exportVisitPdf(previewHtml, `${fileBase}.pdf`)}>
          Esporta PDF
        </button>
        <button className="ghost" disabled={!previewHtml} onClick={() => previewHtml && void printVisitHtml(previewHtml)}>
          Stampa
        </button>
        <button className="ghost" disabled={!previewHtml} onClick={() => previewHtml && void exportVisitHtml(previewHtml, `${fileBase}.html`)}>
          HTML
        </button>
        <button className="ghost" disabled={!visit} onClick={() => visit && void exportVisitJson(visit, patient)}>
          JSON visita
        </button>
      </div>
      {previewHtml ? (
        <iframe
          className="report-preview"
          title={`Anteprima report di ${patientLabel(patient)}`}
          srcDoc={previewHtml}
          sandbox="allow-same-origin"
        />
      ) : (
        <div className="panel mt-3">Seleziona un paziente e una visita per preparare il report.</div>
      )}
    </div>
  )
}
