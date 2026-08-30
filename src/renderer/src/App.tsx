import {
  Activity,
  BarChart3,
  BookOpen,
  FileText,
  Folder,
  GitCompare,
  Info,
  Radar,
  Settings,
  Users
} from 'lucide-react'
import { DISCLAIMER } from '@shared/catalog/about'
import { CommandPalette } from './components/CommandPalette'
import { useApp } from './store/useApp'
import type { ViewId } from '@shared/types'
import { Misura } from './views/Misura'
import { Analisi } from './views/Analisi'
import { Biva } from './views/Biva'
import { Andamenti } from './views/Andamenti'
import { Profili } from './views/Profili'
import { Archivio } from './views/Archivio'
import { Report } from './views/Report'
import { Teoria } from './views/Teoria'
import { Impostazioni } from './views/Impostazioni'
import { Informazioni } from './views/Informazioni'
import { patientLabel } from './lib/delta'
import { flushPersist } from './lib/persist'
import { serializeLibrary } from '@shared/library'

const NAV: { id: ViewId; label: string; icon: typeof Activity }[] = [
  { id: 'misura', label: 'Misura', icon: Activity },
  { id: 'analisi', label: 'Analisi', icon: BarChart3 },
  { id: 'biva', label: 'BIVA', icon: Radar },
  { id: 'andamenti', label: 'Andamenti', icon: GitCompare },
  { id: 'profili', label: 'Profili', icon: Users },
  { id: 'archivio', label: 'Archivio', icon: Folder },
  { id: 'report', label: 'Report', icon: FileText },
  { id: 'teoria', label: 'Teoria', icon: BookOpen },
  { id: 'impostazioni', label: 'Opzioni', icon: Settings },
  { id: 'info', label: 'Info', icon: Info }
]

export function App() {
  const view = useApp((s) => s.view)
  const setView = useApp((s) => s.setView)
  const settings = useApp((s) => s.settings)
  const accept = useApp((s) => s.acceptDisclaimer)
  const setPalette = useApp((s) => s.setPalette)
  const patients = useApp((s) => s.patients)
  const visits = useApp((s) => s.visits)
  const pid = useApp((s) => s.selectedPatientId)
  const addVisit = useApp((s) => s.addVisit)
  const patient = patients.find((p) => p.id === pid) ?? null
  const editor = view === 'misura'
  const gridClass = editor ? 'app-grid editor' : 'app-grid wide'

  return (
    <div
      className={gridClass}
      onKeyDown={(e) => {
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
          e.preventDefault()
          setPalette(true)
        }
      }}
      tabIndex={0}
    >
      <nav className="rail" aria-label="Sezioni">
        <button type="button" className="brand-mark" title="Informazioni" onClick={() => setView('info')}>
          AB
        </button>
        {NAV.map((item) => {
          const Icon = item.icon
          return (
            <button
              key={item.id}
              className={`rail-btn ${view === item.id ? 'active' : ''}`}
              title={item.label}
              aria-label={item.label}
              onClick={() => setView(item.id)}
            >
              <Icon size={18} strokeWidth={1.6} />
              <span>{item.label}</span>
            </button>
          )
        })}
      </nav>
      <header className="topbar">
        <strong className="serif" style={{ fontSize: 16 }}>
          Antropometria BIA
        </strong>
        <button className="tb-btn" onClick={() => addVisit()}>
          Nuova visita
        </button>
        <button
          className="tb-btn"
          onClick={() => {
            flushPersist()
            void window.antropometriaBia?.exportFile({
              defaultName: 'antropometria-bia.json',
              content: serializeLibrary(patients, visits),
              ext: '.json'
            })
          }}
        >
          Esporta
        </button>
        <button className="tb-btn" onClick={() => setView('report')}>
          Report
        </button>
        <span style={{ flex: 1 }} />
        <span className="hair">{patientLabel(patient)}</span>
      </header>
      {view === 'misura' ? <Misura /> : null}
      {view === 'analisi' ? <Analisi /> : null}
      {view === 'biva' ? <Biva /> : null}
      {view === 'andamenti' ? <Andamenti /> : null}
      {view === 'profili' ? <Profili /> : null}
      {view === 'archivio' ? <Archivio /> : null}
      {view === 'report' ? <Report /> : null}
      {view === 'teoria' ? <Teoria /> : null}
      {view === 'impostazioni' ? <Impostazioni /> : null}
      {view === 'info' ? <Informazioni /> : null}
      <CommandPalette />

      {!settings.disclaimerAccepted ? (
        <div className="overlay">
          <div className="palette" style={{ padding: 24, maxWidth: 560 }}>
            <div className="hair">Prima di iniziare</div>
            <h2 style={{ fontFamily: 'Source Serif 4', margin: '8px 0 12px' }}>Calcolo, non dispositivo medico</h2>
            <p style={{ color: '#c5cedb', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>{DISCLAIMER}</p>
            <button className="primary" style={{ marginTop: 16 }} onClick={accept}>
              Ho capito, apri Antropometria BIA
            </button>
          </div>
        </div>
      ) : null}
    </div>
  )
}
