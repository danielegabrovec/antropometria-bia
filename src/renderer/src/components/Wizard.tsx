import { useState } from 'react'
import type { DoctorProfile, WorkspaceKind } from '@shared/types'
import { emptyDoctor } from '@shared/library'
import { useApp } from '../store/useApp'
import { flushPersist } from '../lib/persist'
import { DoctorFields } from './anagrafica'

export function Wizard() {
  const complete = useApp((s) => s.completeWizard)
  const [step, setStep] = useState(1)
  const [kind, setKind] = useState<WorkspaceKind>('studio')
  const [wsName, setWsName] = useState('')
  const [doc, setDoc] = useState<DoctorProfile>(() =>
    emptyDoctor({ titolo: 'Dott.', qualification: 'Biologo Nutrizionista' })
  )

  function patch(p: Partial<DoctorProfile>) {
    setDoc((d) => ({ ...d, ...p }))
  }

  const canNext = Boolean(doc.nome.trim() && doc.cognome.trim())

  return (
    <div className="overlay sheet-overlay">
      <div className="palette sheet wizard">
        <div className="hair">Primo avvio · passo {step} di {kind === 'studio' ? 3 : 2}</div>
        <h2 className="serif" style={{ margin: '8px 0 12px' }}>
          Crea il profilo dottore
        </h2>

        {step === 1 ? (
          <>
            <p className="text-[13px] text-[var(--color-mute)] mb-3">Come vuoi usare questo computer?</p>
            <button className={`visit-item ${kind === 'studio' ? 'sel' : ''}`} onClick={() => setKind('studio')}>
              <div className="font-medium">Studio</div>
              <div className="text-[12px] text-[var(--color-mute)]">
                Più dottori, pazienti condivisi. Su ogni visita compare chi ha misurato.
              </div>
            </button>
            <button className={`visit-item ${kind === 'solo' ? 'sel' : ''}`} onClick={() => setKind('solo')}>
              <div className="font-medium">Cartella personale</div>
              <div className="text-[12px] text-[var(--color-mute)]">
                Un dottore, pazienti e andamenti isolati. Potrai comunque aprire altre cartelle.
              </div>
            </button>
            <button className="primary mt-4" onClick={() => setStep(2)}>
              Continua
            </button>
          </>
        ) : null}

        {step === 2 ? (
          <>
            <p className="text-[13px] text-[var(--color-mute)] mb-3">
              Tutti i campi sono disponibili. Servono almeno nome e cognome; il resto puoi lasciarlo vuoto.
            </p>
            <div className="sheet-body">
              <DoctorFields value={doc} onChange={patch} />
            </div>
            <div className="flex gap-2 mt-2">
              <button className="ghost" onClick={() => setStep(1)}>
                Indietro
              </button>
              <button
                className="primary"
                disabled={!canNext}
                onClick={() => {
                  if (kind === 'solo') {
                    complete({ kind, workspaceName: `${doc.cognome} ${doc.nome}`.trim(), doctor: doc })
                    flushPersist()
                  } else setStep(3)
                }}
              >
                {kind === 'solo' ? 'Apri Antropometria BIA' : 'Continua'}
              </button>
            </div>
          </>
        ) : null}

        {step === 3 ? (
          <>
            <div className="field">
              <label>Nome dello studio</label>
              <input
                value={wsName}
                placeholder="Es. Studio Gabrovec"
                onChange={(e) => setWsName(e.target.value)}
              />
            </div>
            <div className="flex gap-2 mt-2">
              <button className="ghost" onClick={() => setStep(2)}>
                Indietro
              </button>
              <button
                className="primary"
                onClick={() => {
                  complete({
                    kind: 'studio',
                    workspaceName: wsName.trim() || doc.structure || 'Studio',
                    doctor: doc
                  })
                  flushPersist()
                }}
              >
                Apri Antropometria BIA
              </button>
            </div>
          </>
        ) : null}
      </div>
    </div>
  )
}
