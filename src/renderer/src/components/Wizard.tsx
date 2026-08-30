import { useState } from 'react'
import type { DoctorProfile, WorkspaceKind } from '@shared/types'
import { useApp } from '../store/useApp'
import { flushPersist } from '../lib/persist'

const EMPTY: Partial<DoctorProfile> = {
  titolo: 'Dott.',
  nome: '',
  cognome: '',
  qualification: 'Biologo Nutrizionista',
  orderName: '',
  orderNumber: '',
  structure: '',
  address: '',
  city: '',
  phone: '',
  email: '',
  vatNumber: ''
}

export function Wizard() {
  const complete = useApp((s) => s.completeWizard)
  const [step, setStep] = useState(1)
  const [kind, setKind] = useState<WorkspaceKind>('studio')
  const [wsName, setWsName] = useState('')
  const [doc, setDoc] = useState(EMPTY)

  function patch(p: Partial<DoctorProfile>) {
    setDoc((d) => ({ ...d, ...p }))
  }

  const canNext = Boolean(doc.nome?.trim() && doc.cognome?.trim())

  return (
    <div className="overlay">
      <div className="palette wizard" style={{ padding: 24, maxWidth: 560 }}>
        <div className="hair">Primo avvio · passo {step} di {kind === 'studio' ? 3 : 2}</div>
        <h2 className="serif" style={{ margin: '8px 0 12px' }}>
          Crea il profilo dottore
        </h2>

        {step === 1 ? (
          <>
            <p className="text-[13px] text-[var(--color-mute)] mb-3">
              Come vuoi usare questo computer?
            </p>
            <button
              className={`visit-item ${kind === 'studio' ? 'sel' : ''}`}
              onClick={() => setKind('studio')}
            >
              <div className="font-medium">Studio</div>
              <div className="text-[12px] text-[var(--color-mute)]">
                Più dottori, pazienti condivisi. Su ogni visita compare chi ha misurato.
              </div>
            </button>
            <button
              className={`visit-item ${kind === 'solo' ? 'sel' : ''}`}
              onClick={() => setKind('solo')}
            >
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
            <div className="field">
              <label>Titolo</label>
              <input value={doc.titolo ?? ''} onChange={(e) => patch({ titolo: e.target.value })} />
            </div>
            <div className="grid-2">
              <div className="field">
                <label>Nome *</label>
                <input value={doc.nome ?? ''} onChange={(e) => patch({ nome: e.target.value })} />
              </div>
              <div className="field">
                <label>Cognome *</label>
                <input value={doc.cognome ?? ''} onChange={(e) => patch({ cognome: e.target.value })} />
              </div>
            </div>
            <div className="field">
              <label>Qualifica *</label>
              <input value={doc.qualification ?? ''} onChange={(e) => patch({ qualification: e.target.value })} />
            </div>
            <div className="field">
              <label>Ordine / n. iscrizione</label>
              <input
                value={`${doc.orderName ?? ''}${doc.orderNumber ? ` n. ${doc.orderNumber}` : ''}`}
                onChange={(e) => patch({ orderName: e.target.value, orderNumber: '' })}
              />
            </div>
            <div className="grid-2">
              <div className="field">
                <label>Telefono</label>
                <input value={doc.phone ?? ''} onChange={(e) => patch({ phone: e.target.value })} />
              </div>
              <div className="field">
                <label>Email</label>
                <input value={doc.email ?? ''} onChange={(e) => patch({ email: e.target.value })} />
              </div>
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
            <div className="field">
              <label>Struttura / sede</label>
              <input
                value={doc.structure ?? ''}
                onChange={(e) => patch({ structure: e.target.value })}
              />
            </div>
            <div className="field">
              <label>Indirizzo</label>
              <input value={doc.address ?? ''} onChange={(e) => patch({ address: e.target.value })} />
            </div>
            <div className="grid-2">
              <div className="field">
                <label>Città</label>
                <input value={doc.city ?? ''} onChange={(e) => patch({ city: e.target.value })} />
              </div>
              <div className="field">
                <label>P. IVA</label>
                <input value={doc.vatNumber ?? ''} onChange={(e) => patch({ vatNumber: e.target.value })} />
              </div>
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
