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
  Stethoscope,
  Users
} from 'lucide-react'
import { COPYRIGHT_LINE, COPYRIGHT_NOTICE, DISCLAIMER } from '@shared/catalog/about'
import { LEGAL_NOTICE_VERSION } from '@shared/types'
import { doctorLabel, patientLabel } from '@shared/library'
import { CommandPalette } from './components/CommandPalette'
import { ExportMenu } from './components/ExportMenu'
import { Wizard } from './components/Wizard'
import { useApp } from './store/useApp'
import type { ViewId } from '@shared/types'
import { Misura } from './views/Misura'
import { Analisi } from './views/Analisi'
import { Biva } from './views/Biva'
import { Andamenti } from './views/Andamenti'
import { Pazienti } from './views/Pazienti'
import { Dottori } from './views/Dottori'
import { Archivio } from './views/Archivio'
import { Report } from './views/Report'
import { Teoria } from './views/Teoria'
import { Impostazioni } from './views/Impostazioni'
import { Informazioni } from './views/Informazioni'
import { currentDoctor } from './store/useApp'

const NAV: { id: ViewId; label: string; icon: typeof Activity }[] = [
  { id: 'misura', label: 'Misura', icon: Activity },
  { id: 'analisi', label: 'Analisi', icon: BarChart3 },
  { id: 'biva', label: 'BIVA', icon: Radar },
  { id: 'andamenti', label: 'Andamenti', icon: GitCompare },
  { id: 'pazienti', label: 'Pazienti', icon: Users },
  { id: 'dottori', label: 'Dottori', icon: Stethoscope },
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
  const pid = useApp((s) => s.selectedPatientId)
  const addVisit = useApp((s) => s.addVisit)
  const workspace = useApp((s) => s.workspace)
  const activeDoctorId = useApp((s) => s.activeDoctorId)
  const doctors = useApp((s) => s.doctors)
  const setActiveDoctor = useApp((s) => s.setActiveDoctor)
  const patient = patients.find((p) => p.id === pid) ?? null
  const doctor = doctors.find((d) => d.id === activeDoctorId) ?? doctors[0] ?? null
  const editor = view === 'misura'
  const gridClass = editor ? 'app-grid editor' : 'app-grid wide'
  const needDisclaimer = (settings.legalNoticeVersion ?? 0) < LEGAL_NOTICE_VERSION
  const needWizard = !needDisclaimer && (!workspace || (doctors.length === 0 && !settings.wizardCompleted))

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
        <button
          type="button"
          className="brand-mark"
          title="Creato da Daniele Gabrovec — Informazioni e diritti"
          onClick={() => setView('info')}
        >
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
        <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0, lineHeight: 1.15 }}>
          <strong className="serif" style={{ fontSize: 16 }}>
            {workspace?.name || 'Antropometria BIA'}
          </strong>
          <span className="credit" title={COPYRIGHT_NOTICE}>
            {COPYRIGHT_LINE}
          </span>
        </div>
        {workspace?.kind === 'studio' && doctors.length > 1 ? (
          <select
            className="tb-select"
            value={activeDoctorId ?? ''}
            onChange={(e) => setActiveDoctor(e.target.value)}
            title="Chi sta misurando"
          >
            {doctors.map((d) => (
              <option key={d.id} value={d.id}>
                {doctorLabel(d)}
              </option>
            ))}
          </select>
        ) : (
          <span className="chip on">{doctorLabel(doctor)}</span>
        )}
        <button className="tb-btn" onClick={() => addVisit()}>
          Nuova visita
        </button>
        <ExportMenu />
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
      {view === 'pazienti' ? <Pazienti /> : null}
      {view === 'dottori' ? <Dottori /> : null}
      {view === 'archivio' ? <Archivio /> : null}
      {view === 'report' ? <Report /> : null}
      {view === 'teoria' ? <Teoria /> : null}
      {view === 'impostazioni' ? <Impostazioni /> : null}
      {view === 'info' ? <Informazioni /> : null}
      <CommandPalette />

      {needDisclaimer ? (
        <div className="overlay">
          <div className="palette" style={{ padding: 24, maxWidth: 560 }}>
            <div className="hair">Prima di iniziare</div>
            <h2 style={{ fontFamily: 'Source Serif 4', margin: '8px 0 12px' }}>Calcolo, non dispositivo medico</h2>
            <p style={{ color: '#c5cedb', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>{DISCLAIMER}</p>
            <div
              className="panel"
              style={{ marginTop: 16, whiteSpace: 'pre-wrap', fontSize: 13, lineHeight: 1.5, color: '#d4a574' }}
            >
              {COPYRIGHT_NOTICE}
            </div>
            <button className="primary" style={{ marginTop: 16 }} onClick={accept}>
              Ho capito, continua
            </button>
          </div>
        </div>
      ) : null}
      {needWizard ? <Wizard /> : null}
    </div>
  )
}

void currentDoctor
