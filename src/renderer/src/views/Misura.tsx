import { useEffect, useMemo, useRef } from 'react'
import { bodyModelVariantFromSex, skinfoldStateKeysFor, EQ_DENSITA_TO_STRICT } from '@shared/engine'
import { MEASURES, MEASURE_BY_KEY, PRESET_LABELS, defaultGirths } from '@shared/catalog/measures'
import { METODI_BMR } from '@shared/engine'
import { EQ_DENSITA_OPTIONS } from '@shared/engine'
import { assessVisit } from '@shared/engine'
import type { ProtocolPreset } from '@shared/types'
import { useApp } from '../store/useApp'
import { patientVisits, referenceVisit } from '../lib/delta'
import { fmt, parseIt } from '../lib/format'
import FiguraCorpo, { type PinFigura } from '../components/FiguraCorpo'
import { KpiCard } from '../components/KpiCard'

function Num({
  label,
  value,
  onChange,
  unit,
  warn,
  inputRef,
  autoFocus
}: {
  label: string
  value: number | null | undefined
  onChange: (n: number | null) => void
  unit?: string
  warn?: boolean
  inputRef?: React.Ref<HTMLInputElement>
  autoFocus?: boolean
}) {
  return (
    <div className="field">
      <label style={{ color: warn ? 'var(--color-danger)' : undefined }}>
        {label} {unit ? `(${unit})` : ''}
      </label>
      <input
        ref={inputRef}
        autoFocus={autoFocus}
        inputMode="decimal"
        defaultValue={value == null ? '' : String(value).replace('.', ',')}
        key={String(value ?? '') + label}
        onBlur={(e) => onChange(parseIt(e.target.value))}
        onKeyDown={(e) => {
          if (e.key === 'Enter') (e.target as HTMLInputElement).blur()
        }}
      />
    </div>
  )
}

export function Misura() {
  const patients = useApp((s) => s.patients)
  const visits = useApp((s) => s.visits)
  const pid = useApp((s) => s.selectedPatientId)
  const vid = useApp((s) => s.selectedVisitId)
  const pin = useApp((s) => s.selectedPin)
  const deltaMode = useApp((s) => s.settings.deltaMode)
  const selectPatient = useApp((s) => s.selectPatient)
  const selectVisit = useApp((s) => s.selectVisit)
  const addPatient = useApp((s) => s.addPatient)
  const addVisit = useApp((s) => s.addVisit)
  const patchVisit = useApp((s) => s.patchVisit)
  const patchMeasure = useApp((s) => s.patchMeasure)
  const setPin = useApp((s) => s.setPin)
  const setDelta = useApp((s) => s.setDelta)
  const inspectorRef = useRef<HTMLInputElement>(null)

  const patient = patients.find((p) => p.id === pid) ?? null
  const visit = visits.find((v) => v.id === vid) ?? null
  const ordered = patientVisits(visits, pid)
  const prev = referenceVisit(ordered, vid, deltaMode)

  useEffect(() => {
    if (pin) inspectorRef.current?.focus()
  }, [pin])

  const assessed = useMemo(() => (patient && visit ? assessVisit(patient, visit) : null), [patient, visit])
  const sex = assessed?.sex ?? null
  const requiredKeys = useMemo(() => {
    if (!visit) return new Set<string>()
    return new Set(skinfoldStateKeysFor(EQ_DENSITA_TO_STRICT[visit.eqDensitaPliche], sex))
  }, [visit, sex])

  const pins: PinFigura[] = useMemo(() => {
    if (!visit) return []
    const girthSet = new Set(visit.enabledGirths)
    const out: PinFigura[] = []
    for (const m of MEASURES) {
      if (m.category === 'diametri') continue
      if (m.category === 'circonferenze' && !girthSet.has(m.key) && visit.measures[m.key] == null) continue
      const valorizzato = visit.measures[m.key] != null
      out.push({
        key: m.key,
        label: m.label,
        categoria: m.category === 'pliche' ? 'pliche' : 'circonferenze',
        valorizzato,
        richiesta: requiredKeys.has(m.key)
      })
      if (prev && prev.measures[m.key] != null) {
        out.push({
          key: m.key,
          label: `${m.label} (riferimento)`,
          categoria: m.category === 'pliche' ? 'pliche' : 'circonferenze',
          previous: true,
          valorizzato: true
        })
      }
    }
    return out
  }, [visit, prev, requiredKeys])

  const variant = bodyModelVariantFromSex(sex ?? patient?.sex)
  const selectedDef = pin ? MEASURE_BY_KEY[pin] : null
  const formulaOpt = assessed?.anthro.formulaEta.find((f) => f.value === visit?.eqDensitaPliche)

  return (
    <>
      <aside className="library">
        <div className="hair mb-2">Profili</div>
        <div className="library-list" style={{ flex: '0 0 auto', maxHeight: 180 }}>
          {patients.map((p) => (
            <button key={p.id} className={`visit-item ${p.id === pid ? 'sel' : ''}`} onClick={() => selectPatient(p.id)}>
              <div className="font-medium">{p.alias}</div>
              <div className="text-[11px] text-[var(--color-mute)]">
                {p.sex ?? 'sesso —'} · {p.birthDate ?? 'nascita —'}
              </div>
            </button>
          ))}
        </div>
        <button className="ghost w-full justify-center mb-3" onClick={() => addPatient()}>
          + Profilo
        </button>
        <div className="hair mb-2">Visite</div>
        <div className="library-list">
          {[...ordered].reverse().map((v) => (
            <button key={v.id} className={`visit-item ${v.id === vid ? 'sel' : ''}`} onClick={() => selectVisit(v.id)}>
              <div>{v.date}</div>
              <div className="text-[11px] text-[var(--color-mute)]">{v.name}</div>
            </button>
          ))}
        </div>
        <button className="primary w-full mt-2" onClick={() => addVisit()}>
          + Nuova visita
        </button>
      </aside>

      <section className="workspace">
        {!visit || !patient ? (
          <div className="panel">
            <h2 className="serif text-xl mb-2">Nessuna visita</h2>
            <p className="text-[var(--color-mute)]">Crea un profilo e una visita dalla colonna a sinistra.</p>
          </div>
        ) : (
          <>
            <div className="flex flex-wrap gap-2 items-end">
              <div className="field mb-0" style={{ minWidth: 140 }}>
                <label>Data</label>
                <input type="date" value={visit.date} onChange={(e) => patchVisit(visit.id, { date: e.target.value })} />
              </div>
              <div className="field mb-0" style={{ minWidth: 100 }}>
                <label>Peso kg</label>
                <input
                  key={`w-${visit.id}-${visit.weightKg}`}
                  defaultValue={visit.weightKg ?? ''}
                  onBlur={(e) => patchVisit(visit.id, { weightKg: parseIt(e.target.value) })}
                />
              </div>
              <div className="field mb-0" style={{ minWidth: 100 }}>
                <label>Altezza cm</label>
                <input
                  key={`h-${visit.id}-${visit.heightCm}`}
                  defaultValue={visit.heightCm ?? ''}
                  onBlur={(e) => patchVisit(visit.id, { heightCm: parseIt(e.target.value) })}
                />
              </div>
              <div className="field mb-0">
                <label>Sesso visita</label>
                <select
                  value={visit.clinicalSex ?? ''}
                  onChange={(e) =>
                    patchVisit(visit.id, { clinicalSex: (e.target.value || null) as VisitSex })
                  }
                >
                  <option value="">Da anagrafica</option>
                  <option value="M">M</option>
                  <option value="F">F</option>
                </select>
              </div>
              <div className="field mb-0">
                <label>Preset</label>
                <select
                  value={visit.protocolPreset}
                  onChange={(e) => {
                    const protocolPreset = e.target.value as ProtocolPreset
                    patchVisit(visit.id, { protocolPreset, enabledGirths: defaultGirths(protocolPreset) })
                  }}
                >
                  {Object.entries(PRESET_LABELS).map(([k, lab]) => (
                    <option key={k} value={k}>
                      {lab}
                    </option>
                  ))}
                </select>
              </div>
              <div className="ml-auto flex gap-1">
                <button className={`chip ${deltaMode === 'precedente' ? 'on' : ''}`} onClick={() => setDelta('precedente')}>
                  Δ precedente
                </button>
                <button className={`chip ${deltaMode === 'prima' ? 'on' : ''}`} onClick={() => setDelta('prima')}>
                  Δ prima visita
                </button>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 items-center text-[12px]">
              <span className="hair">Densità</span>
              {assessed?.anthro.formulaEta.map((f) => (
                <button
                  key={f.value}
                  className={`chip ${visit.eqDensitaPliche === f.value ? 'on' : ''}`}
                  title={`${f.hint} · ${f.min}–${f.max} anni`}
                  onClick={() => patchVisit(visit.id, { eqDensitaPliche: f.value })}
                >
                  <span className={f.validata ? 'badge-ok' : 'badge-bad'}>{f.validata ? '✓' : '⚠'}</span> {f.label}
                </button>
              ))}
              <button
                className={`chip ${visit.eqMassaGrassa === 'Siri' ? 'on' : ''}`}
                onClick={() => patchVisit(visit.id, { eqMassaGrassa: 'Siri' })}
              >
                Siri
              </button>
              <button
                className={`chip ${visit.eqMassaGrassa === 'Brozek' ? 'on' : ''}`}
                onClick={() => patchVisit(visit.id, { eqMassaGrassa: 'Brozek' })}
              >
                Brozek
              </button>
            </div>
            {formulaOpt && !formulaOpt.validata ? (
              <div className="panel text-[13px] text-[var(--color-copper)]">
                {formulaOpt.label} è validata tra {formulaOpt.min} e {formulaOpt.max} anni (età {assessed?.age}). Il numero esce lo
                stesso, senza la validazione dello studio.
                {assessed && assessed.age <= 72 ? ' In alternativa: Durnin & Womersley.' : ' Nessuna plicometria copre questa età.'}
              </div>
            ) : null}

            <div className="omini-row">
              <FiguraCorpo
                variant={variant}
                vista="fronte"
                pins={pins}
                quote={assessed?.anthro.distribution}
                onPinClick={setPin}
                etichetta="Fronte"
                selectedKey={pin}
              />
              <FiguraCorpo
                variant={variant}
                vista="retro"
                pins={pins}
                quote={assessed?.anthro.distribution}
                onPinClick={setPin}
                etichetta="Retro"
                selectedKey={pin}
              />
            </div>
            <p className="text-[11px] text-[var(--color-mute)]">
              Quota % fra i siti misurati col calibro, non una mappa di grasso viscerale. Pin tratteggiati = visita di riferimento (
              {prev ? prev.date : 'nessuna'}).
            </p>
          </>
        )}
      </section>

      <aside className="inspector">
        {!visit || !assessed ? (
          <p className="text-[var(--color-mute)]">Seleziona una visita.</p>
        ) : (
          <>
            <div className="hair mb-2">Ispettore</div>
            {selectedDef ? (
              <Num
                label={selectedDef.label}
                unit={selectedDef.unit}
                value={visit.measures[selectedDef.key]}
                warn={requiredKeys.has(selectedDef.key) && visit.measures[selectedDef.key] == null}
                onChange={(n) => patchMeasure(selectedDef.key, n)}
                inputRef={inspectorRef}
                autoFocus
              />
            ) : (
              <p className="text-[12px] text-[var(--color-mute)] mb-3">Clicca un pin sull&apos;omino per compilare il sito.</p>
            )}

            <div className="hair mt-4 mb-2">Antropometria</div>
            <KpiCard
              label="Massa grassa pliche"
              value={assessed.anthro.pliche?.fmPct}
              unit="%"
              tone={assessed.anthro.fasce.fat?.classificazione}
              hint={
                assessed.anthro.pliche?.fuoriValidita
                  ? `Fuori validità (${assessed.anthro.pliche.fuoriValidita.min}–${assessed.anthro.pliche.fuoriValidita.max})`
                  : assessed.anthro.fasce.fat?.etichettaFascia
              }
            />
            <div className="kpi-grid mt-2">
              <KpiCard label="FM" value={assessed.anthro.pliche?.fmKg} unit="kg" />
              <KpiCard label="FFM" value={assessed.anthro.pliche?.ffmKg} unit="kg" />
              <KpiCard label="BMI" value={assessed.anthro.bmi} tone={assessed.anthro.fasce.bmi?.classificazione} hint={assessed.anthro.bmiClass.label} />
              <KpiCard label="WHR" value={assessed.anthro.whr} d={2} tone={assessed.anthro.fasce.whr?.classificazione} />
            </div>
            {assessed.anthro.plicheBlock?.kind === 'pliche-mancanti' ? (
              <p className="text-[12px] text-[var(--color-copper)] mt-2">
                Mancano: {assessed.anthro.plicheBlock.missing.join(', ')}
              </p>
            ) : null}
            {assessed.anthro.plicheBlock?.kind === 'sesso-mancante' ? (
              <p className="text-[12px] text-[var(--color-copper)] mt-2">Sesso M o F richiesto. «Altro» non viene convertito.</p>
            ) : null}

            <div className="hair mt-5 mb-2">BIA · AKERN 101</div>
            <div className="field">
              <label>Ingresso</label>
              <select
                value={visit.bia.inputKind}
                onChange={(e) => patchVisit(visit.id, { bia: { ...visit.bia, inputKind: e.target.value as 'R_XC' | 'Z_XC' } })}
              >
                <option value="R_XC">R + Xc</option>
                <option value="Z_XC">Z + Xc</option>
              </select>
            </div>
            {visit.bia.inputKind === 'R_XC' ? (
              <Num
                label="Resistenza R/Rz"
                unit="Ω"
                value={visit.bia.resistanceOhm}
                onChange={(n) => patchVisit(visit.id, { bia: { ...visit.bia, resistanceOhm: n } })}
              />
            ) : (
              <Num
                label="Impedenza Z"
                unit="Ω"
                value={visit.bia.impedanceOhm}
                onChange={(n) => patchVisit(visit.id, { bia: { ...visit.bia, impedanceOhm: n } })}
              />
            )}
            <Num
              label="Reattanza Xc"
              unit="Ω"
              value={visit.bia.reactanceOhm}
              onChange={(n) => patchVisit(visit.id, { bia: { ...visit.bia, reactanceOhm: n } })}
            />
            <p className="text-[11px] text-[var(--color-mute)] mb-2">50 kHz · tetrapolare mano-piede. Frequenza bloccata.</p>
            {assessed.bia.blockedReason ? <p className="text-[12px] text-[var(--color-copper)]">{assessed.bia.blockedReason}</p> : null}
            <KpiCard
              label="Phase angle"
              value={assessed.bia.signal?.phaseAngleDeg ?? assessed.bia.assessment?.metrics.phaseAngle?.value}
              unit="°"
            />
            <div className="kpi-grid mt-2">
              <KpiCard label="FM BIA" value={assessed.bia.assessment?.metrics.fmPercent?.value} unit="%" />
              <KpiCard label="TBW" value={assessed.bia.assessment?.metrics.tbw?.value} unit="L" />
              <KpiCard label="ECW" value={assessed.bia.assessment?.metrics.ecw?.value} unit="L" />
              <KpiCard label="SMI" value={assessed.bia.assessment?.metrics.skeletalMuscleIndex?.value} unit="kg/m²" />
            </div>
            <p className="text-[11px] text-[var(--color-mute)] mt-2">
              FM% antropometria e FM% BIA restano separate. BCM solo se lo inserisci dallo strumento.
            </p>
            <Num
              label="BCM strumento (opz.)"
              unit="kg"
              value={visit.bia.deviceBcmKg}
              onChange={(n) => patchVisit(visit.id, { bia: { ...visit.bia, deviceBcmKg: n } })}
            />

            <div className="hair mt-5 mb-2">BMR</div>
            <select
              value={visit.formulaBmr}
              onChange={(e) => patchVisit(visit.id, { formulaBmr: e.target.value as typeof visit.formulaBmr })}
            >
              {METODI_BMR.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
            <KpiCard
              label="BMR"
              value={assessed.anthro.bmr?.bmr}
              unit="kcal"
              hint={assessed.anthro.bmr?.fallbackFfm ? 'Fallback Mifflin (manca FFM)' : assessed.anthro.bmr?.metodo}
            />
          </>
        )}
      </aside>
    </>
  )
}

type VisitSex = 'M' | 'F' | null

void EQ_DENSITA_OPTIONS
void fmt
