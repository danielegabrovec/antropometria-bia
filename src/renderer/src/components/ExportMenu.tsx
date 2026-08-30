import { useState } from 'react'
import {
  exportAnagraficheDocx,
  exportAnagraficheHtml,
  exportAnagraficheJson,
  exportAnagrafichePdf,
  exportAnagraficheXls,
  exportWorkspaceHtml,
  exportWorkspaceJson,
  exportWorkspacePdf,
  importAnagrafiche,
  importWorkspaceJson,
  mergeAnagrafiche,
  printAnagrafiche,
  printWorkspace
} from '../lib/io'
import { useApp } from '../store/useApp'

export function ExportMenu() {
  const [open, setOpen] = useState(false)
  const replace = useApp((s) => s.replaceWorkspaceData)

  return (
    <div className="menu-wrap">
      <button className="tb-btn" onClick={() => setOpen((v) => !v)}>
        Esporta
      </button>
      {open ? (
        <div className="menu" onMouseLeave={() => setOpen(false)}>
          <div className="hair px-2 pt-2">Cartella (tutto)</div>
          <button onClick={() => void exportWorkspaceJson().then(() => setOpen(false))}>JSON</button>
          <button onClick={() => void exportWorkspaceHtml().then(() => setOpen(false))}>HTML</button>
          <button onClick={() => void exportWorkspacePdf().then(() => setOpen(false))}>PDF</button>
          <button onClick={() => void printWorkspace().then(() => setOpen(false))}>Stampa</button>
          <div className="hair px-2 pt-2">Anagrafiche</div>
          <button onClick={() => void exportAnagraficheJson().then(() => setOpen(false))}>JSON</button>
          <button onClick={() => void exportAnagraficheXls().then(() => setOpen(false))}>XLS</button>
          <button onClick={() => void exportAnagraficheHtml().then(() => setOpen(false))}>HTML</button>
          <button onClick={() => void exportAnagrafichePdf().then(() => setOpen(false))}>PDF</button>
          <button onClick={() => void exportAnagraficheDocx().then(() => setOpen(false))}>DOCX</button>
          <button onClick={() => void printAnagrafiche().then(() => setOpen(false))}>Stampa</button>
          <div className="hair px-2 pt-2">Importa</div>
          <button
            onClick={async () => {
              const file = await importWorkspaceJson()
              if (file) replace(file)
              setOpen(false)
            }}
          >
            Importa cartella JSON
          </button>
          <button
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
