import { useEffect, useRef, useState } from 'react'
import {
  exportAnagraficheDocx,
  exportAnagraficheHtml,
  exportAnagraficheJson,
  exportAnagrafichePdf,
  exportAnagraficheXls,
  exportAndamentiHtml,
  exportAndamentiPdf,
  exportVisitHtml,
  exportVisitJson,
  exportVisitPdf,
  exportWorkspaceHtml,
  exportWorkspaceJson,
  exportWorkspacePdf,
  importAnagrafiche,
  importWorkspaceJson,
  mergeAnagrafiche,
  printAnagrafiche,
  printAndamenti,
  printVisitHtml,
  printWorkspace
} from '../lib/io'
import { useApp } from '../store/useApp'

export function ExportMenu() {
  const [open, setOpen] = useState(false)
  const wrap = useRef<HTMLDivElement>(null)
  const menu = useRef<HTMLDivElement>(null)
  const replace = useApp((s) => s.replaceWorkspaceData)
  const visitId = useApp((s) => s.selectedVisitId)
  const patientId = useApp((s) => s.selectedPatientId)

  useEffect(() => {
    if (!open) return
    requestAnimationFrame(() => menu.current?.querySelector<HTMLButtonElement>('button:not(:disabled)')?.focus())
    function onDoc(e: MouseEvent) {
      if (!wrap.current?.contains(e.target as Node)) setOpen(false)
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDoc)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  function run(fn: () => void | Promise<unknown>) {
    return async () => {
      await fn()
      setOpen(false)
    }
  }

  return (
    <div className="menu-wrap" ref={wrap}>
      <button
        type="button"
        className="tb-btn"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-controls="export-menu"
      >
        Esporta
      </button>
      {open ? (
        <div
          className="menu"
          id="export-menu"
          ref={menu}
          role="menu"
          aria-label="Esportazione e importazione"
          onKeyDown={(event) => {
            if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) return
            event.preventDefault()
            const items = Array.from(menu.current?.querySelectorAll<HTMLButtonElement>('button:not(:disabled)') ?? [])
            if (!items.length) return
            const current = items.indexOf(document.activeElement as HTMLButtonElement)
            const next = event.key === 'Home' ? 0 : event.key === 'End' ? items.length - 1 : event.key === 'ArrowDown' ? (current + 1) % items.length : (current - 1 + items.length) % items.length
            items[next]?.focus()
          }}
        >
          <div className="hair px-2 pt-2">Questa visita</div>
          <button type="button" disabled={!visitId} onClick={run(() => exportVisitHtml())}>
            HTML (misure · analisi · BIVA)
          </button>
          <button type="button" disabled={!visitId} onClick={run(() => exportVisitPdf())}>
            PDF
          </button>
          <button type="button" disabled={!visitId} onClick={run(() => printVisitHtml())}>
            Stampa
          </button>
          <button type="button" disabled={!visitId} onClick={run(() => exportVisitJson())}>
            JSON
          </button>
          <div className="hair px-2 pt-2">Andamenti del paziente</div>
          <button type="button" disabled={!patientId} onClick={run(() => exportAndamentiHtml())}>
            HTML
          </button>
          <button type="button" disabled={!patientId} onClick={run(() => exportAndamentiPdf())}>
            PDF
          </button>
          <button type="button" disabled={!patientId} onClick={run(() => printAndamenti())}>
            Stampa
          </button>
          <div className="hair px-2 pt-2">Cartella (tutto)</div>
          <button type="button" onClick={run(() => exportWorkspaceJson())}>
            JSON
          </button>
          <button type="button" onClick={run(() => exportWorkspaceHtml())}>
            HTML
          </button>
          <button type="button" onClick={run(() => exportWorkspacePdf())}>
            PDF
          </button>
          <button type="button" onClick={run(() => printWorkspace())}>
            Stampa
          </button>
          <div className="hair px-2 pt-2">Anagrafiche</div>
          <button type="button" onClick={run(() => exportAnagraficheJson())}>
            JSON
          </button>
          <button type="button" onClick={run(() => exportAnagraficheXls())}>
            XLS
          </button>
          <button type="button" onClick={run(() => exportAnagraficheHtml())}>
            HTML
          </button>
          <button type="button" onClick={run(() => exportAnagrafichePdf())}>
            PDF
          </button>
          <button type="button" onClick={run(() => exportAnagraficheDocx())}>
            DOCX
          </button>
          <button type="button" onClick={run(() => printAnagrafiche())}>
            Stampa
          </button>
          <div className="hair px-2 pt-2">Importa</div>
          <button
            type="button"
            onClick={async () => {
              const file = await importWorkspaceJson()
              if (file) replace(file)
              setOpen(false)
            }}
          >
            Importa cartella JSON
          </button>
          <button
            type="button"
            onClick={async () => {
              const a = await importAnagrafiche()
              if (a) mergeAnagrafiche(a)
              setOpen(false)
            }}
          >
            Importa anagrafiche JSON/XLS
          </button>
        </div>
      ) : null}
    </div>
  )
}
