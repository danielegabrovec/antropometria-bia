import { useMemo, useState } from 'react'
import type { EqDensitaPliche, EqMassaGrassa, EqSuperficie, FormulaPesoTeorico, MetodoBmr, ProtocolPreset } from '@shared/types'
import { doctorLabel, filterPatients, sexLabel } from '@shared/library'
import { useApp } from '../store/useApp'
import { patientLabel, patientVisits, referenceVisit } from '../lib/delta'
import { fmt, parsePositive } from '../lib/format'
import FiguraCorpo, { type PinFigura } from '../components/FiguraCorpo'
import { KpiCard } from '../components/KpiCard'
import { CreatePatientDialog, EditPatientDialog } from '../components/anagrafica'
import { MisureTabella } from '../components/MisureTabella'
import {
  EQ_SUPERFICIE_OPTIONS,
  LIVELLI_DISPENDIO,
  METODI_BMR,
  PESO_TEORICO_OPTIONS,
  EQ_DENSITA_OPTIONS,
  assessVisit,
  bodyModelVariantFromSex,
  calcolaEta,
  etichettaLaf,
  skinfoldStateKeysFor,
  EQ_DENSITA_TO_STRICT,
  eqDensitaOption
} from '@shared/engine'
import {
  MEASURES,
  MEASURE_BY_KEY,
  PRESET_LABELS,
  countHiddenStoredMeasures,
  defaultGirths,
  effectiveGirths,
  visibleMeasureKeys
} from '@shared/catalog/measures'

function fmtSaved(iso: string) {
  try {
    return new Date(iso).toLocaleString('it-IT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  } catch {
    return iso
  }
}

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
        type="number"
        min="0.01"
        step="any"
        defaultValue={value == null ? '' : String(value)}
        key={String(value ?? '') + label}
        onBlur={(e) => onChange(parsePositive(e.target.value))}
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
  const upsertPatient = useApp((s) => s.upsertPatient)
  const removePatient = useApp((s) => s.removePatient)
  const duplicateVisit = useApp((s) => s.duplicateVisit)
  const removeVisit = useApp((s) => s.removeVisit)
  const setPin = useApp((s) => s.setPin)
  const setDelta = useApp((s) => s.setDelta)
  const [q, setQ] = useState('')
  const [creating, setCreating] = useState(false)
  const [editingPatient, setEditingPatient] = useState(false)
  const doctors = useApp((s) => s.doctors)
  const activeDoctorId = useApp((s) => s.activeDoctorId)

  const patient = patients.find((p) => p.id === pid) ?? null
  const visit = visits.find((v) => v.id === vid) ?? null
  const ordered = patientVisits(visits, pid)
  const prev = referenceVisit(ordered, vid, deltaMode)

  const assessed = useMemo(() => (patient && visit ? assessVisit(patient, visit) : null), [patient, visit])
  const sex = assessed?.sex ?? null
  const requiredKeys = useMemo(() => {
    if (!visit) return new Set<string>()
    return new Set(skinfoldStateKeysFor(EQ_DENSITA_TO_STRICT[visit.eqDensitaPliche], sex))
  }, [visit, sex])

  const visibleKeys = useMemo(() => {
    if (!visit) return [] as string[]
    return visibleMeasureKeys(visit.protocolPreset, visit.enabledGirths, [...requiredKeys])
  }, [visit, requiredKeys])

  const hiddenStored = useMemo(
    () => (visit ? countHiddenStoredMeasures(visit.measures, visibleKeys) : 0),
    [visit, visibleKeys]
  )

  const pins: PinFigura[] = useMemo(() => {
    if (!visit) return []
    const vis = new Set(visibleKeys)
    const girthSet = new Set(effectiveGirths(visit.protocolPreset, visit.enabledGirths))
    const out: PinFigura[] = []
    for (const m of MEASURES) {
      if (!vis.has(m.key)) continue
      const valorizzato = visit.measures[m.key] != null
      const richiesta =
        m.category === 'pliche' ? requiredKeys.has(m.key) : m.category === 'circonferenze' ? girthSet.has(m.key) : false
      out.push({
        key: m.key,
        label: m.label,
        categoria: m.category,
        valorizzato,
        richiesta
      })
      if (prev && prev.measures[m.key] != null) {
        out.push({
          key: m.key,
          label: `${m.label} (riferimento)`,
          categoria: m.category,
          previous: true,
          valorizzato: true
        })
      }
    }
    return out
  }, [visit, prev, requiredKeys, visibleKeys])

  const sitiRichiesti = useMemo(() => {
    const s = new Set(requiredKeys)
    if (visit) for (const g of effectiveGirths(visit.protocolPreset, visit.enabledGirths)) s.add(g)
    return s
  }, [requiredKeys, visit])

  const variant = bodyModelVariantFromSex(sex ?? patient?.sex)
  const formulaOpt = assessed?.anthro.formulaEta.find((f) => f.value === visit?.eqDensitaPliche)
  const visitsNewestFirst = [...ordered].reverse()
  const selectedDef = pin ? MEASURE_BY_KEY[pin] : null

  return (
    <>
      <aside className="library">
        <div className="hair mb-2">Paziente</div>
        <input
          className="search"
          placeholder="Cerca o crea…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <div className="library-list" style={{ flex: '0 0 auto', maxHeight: 200, marginTop: 6 }}>
          {filterPatients(patients, q).map((p) => (
            <button key={p.id} className={`visit-item ${p.id === pid ? 'sel' : ''}`} onClick={() => selectPatient(p.id)}>
              <div className="font-medium">{patientLabel(p)}</div>
              <div className="text-[11px] text-[var(--color-mute)]">
                {sexLabel(p.sex)}
                {p.birthDate ? ` · ${calcolaEta(p.birthDate)} anni` : ' · nascita —'}
              </div>
            </button>
          ))}
        </div>
        <button className="ghost w-full justify-center mb-2" onClick={() => setCreating(true)}>
          + Nuovo paziente
        </button>
        {patient ? (
          <div className="flex gap-1 mb-3">
            <button className="ghost flex-1 justify-center" onClick={() => setEditingPatient(true)}>
              Modifica
            </button>
            <button
              className="ghost flex-1 justify-center"
              onClick={() => {
                if (!window.confirm(`Eliminare ${patientLabel(patient)} e tutte le visite?`)) return
                removePatient(patient.id)
              }}
            >
              Elimina
            </button>
          </div>
        ) : null}
        <CreatePatientDialog
          open={creating}
          onClose={() => setCreating(false)}
          onCreate={(draft) => {
            addPatient(draft)
            setQ('')
          }}
        />
        <EditPatientDialog
          open={editingPatient}
          patient={patient}
          onClose={() => setEditingPatient(false)}
          onSave={(p) => upsertPatient(p)}
        />
        <div className="hair mb-1">Visite salvate {patient ? `(${ordered.length})` : ''}</div>
        <p className="text-[11px] text-[var(--color-mute)] mb-1">
          Ogni modifica si salva da sola. Clicca una visita per aprirla e modificarla.
        </p>
        <div className="library-list">
          {visitsNewestFirst.length === 0 ? (
            <p className="text-[12px] text-[var(--color-mute)] mt-1">Nessuna visita. Creane una nuova.</p>
          ) : (
            visitsNewestFirst.map((v) => {
              const op = doctors.find((d) => d.id === v.operatorDoctorId)
              return (
                <div key={v.id} className={`visit-item ${v.id === vid ? 'sel' : ''}`}>
                  <button type="button" className="w-full text-left bg-transparent border-0 p-0" onClick={() => selectVisit(v.id)}>
                    <div>{v.date}</div>
                    <div className="text-[11px] text-[var(--color-mute)]">
                      {v.name}
                      {v.weightKg != null ? ` · ${fmt(v.weightKg)} kg` : ''}
                      {op ? ` · ${doctorLabel(op)}` : ''}
                    </div>
                  </button>
                  <div className="flex gap-1 mt-1">
                    <button
                      type="button"
                      className="ghost"
                      onClick={(e) => {
                        e.stopPropagation()
                        duplicateVisit(v.id)
                      }}
                    >
                      Duplica
                    </button>
                    <button
                      type="button"
                      className="ghost"
                      onClick={(e) => {
                        e.stopPropagation()
                        if (!window.confirm('Eliminare questa visita? Resta salvato il resto della cartella.')) return
                        removeVisit(v.id)
                      }}
                    >
                      Elimina
                    </button>
                  </div>
                </div>
              )
            })
          )}
        </div>
        <button className="primary w-full mt-2" disabled={!patient} onClick={() => addVisit()}>
          + Nuova visita
        </button>
      </aside>

      <section className="workspace">
        {!visit || !patient ? (
          <div className="panel">
            <h2 className="serif text-xl mb-2">Nessuna visita</h2>
            <p className="text-[var(--color-mute)]">Cerca un paziente già in anagrafica o creane uno nuovo, poi aggiungi una visita. La visita resta intestata a {doctorLabel(doctors.find((d) => d.id === activeDoctorId) ?? null)}.</p>
          </div>
        ) : (
          <>
            <div className="misura-head">
              <div className="misura-head-row">
                <div className="field mb-0" style={{ minWidth: 140 }}>
                  <label>Data</label>
                  <input type="date" value={visit.date} onChange={(e) => patchVisit(visit.id, { date: e.target.value })} />
                </div>
                <div className="field mb-0" style={{ minWidth: 160 }}>
                  <label>Nome visita</label>
                  <input
                    value={visit.name}
                    onChange={(e) => patchVisit(visit.id, { name: e.target.value })}
                    placeholder="es. Controllo 1"
                  />
                </div>
                <div className="field mb-0" style={{ minWidth: 160 }}>
                  <label>Operatore</label>
                  <select
                    value={visit.operatorDoctorId ?? ''}
                    onChange={(e) => patchVisit(visit.id, { operatorDoctorId: e.target.value || null })}
                  >
                    <option value="">—</option>
                    {doctors.map((d) => (
                      <option key={d.id} value={d.id}>
                        {doctorLabel(d)}
                      </option>
                    ))}
                  </select>
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
                    <option value="M">Maschio</option>
                    <option value="F">Femmina</option>
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
              <div className="misura-head-row">
                <span className="hair" style={{ paddingBottom: 8 }}>Corpo</span>
                <div className="misura-head-pair">
                  <div className="field mb-0" style={{ minWidth: 100 }}>
                    <label>Peso kg</label>
                    <input
                      type="number"
                      min="20"
                      max="500"
                      step="0.1"
                      key={`w-${visit.id}-${visit.weightKg}`}
                      defaultValue={visit.weightKg ?? ''}
                      onBlur={(e) => patchVisit(visit.id, { weightKg: parsePositive(e.target.value) })}
                    />
                  </div>
                  <div className="field mb-0" style={{ minWidth: 100 }}>
                    <label>Altezza cm</label>
                    <input
                      type="number"
                      min="50"
                      max="250"
                      step="0.1"
                      key={`h-${visit.id}-${visit.heightCm}`}
                      defaultValue={visit.heightCm ?? ''}
                      onBlur={(e) => patchVisit(visit.id, { heightCm: parsePositive(e.target.value) })}
                    />
                  </div>
                </div>
              </div>
              <div className="misura-head-row">
                <span className="hair" style={{ paddingBottom: 8 }}>BIA</span>
                <div className="field mb-0">
                  <label>Ingresso</label>
                  <select
                    value={visit.bia.inputKind}
                    onChange={(e) =>
                      patchVisit(visit.id, { bia: { ...visit.bia, inputKind: e.target.value as 'R_XC' | 'Z_XC' } })
                    }
                  >
                    <option value="R_XC">R + Xc</option>
                    <option value="Z_XC">Z + Xc</option>
                  </select>
                </div>
                <div className="misura-head-pair">
                  {visit.bia.inputKind === 'R_XC' ? (
                    <div className="field mb-0" style={{ minWidth: 110 }}>
                      <label>Resistenza R/Rz Ω</label>
                      <input
                        type="number"
                        min="0.1"
                        max="3000"
                        step="0.1"
                        key={`r-${visit.id}-${visit.bia.resistanceOhm}`}
                        defaultValue={visit.bia.resistanceOhm ?? ''}
                        onBlur={(e) =>
                          patchVisit(visit.id, { bia: { ...visit.bia, resistanceOhm: parsePositive(e.target.value) } })
                        }
                      />
                    </div>
                  ) : (
                    <div className="field mb-0" style={{ minWidth: 110 }}>
                      <label>Impedenza Z Ω</label>
                      <input
                        type="number"
                        min="0.1"
                        max="3000"
                        step="0.1"
                        key={`z-${visit.id}-${visit.bia.impedanceOhm}`}
                        defaultValue={visit.bia.impedanceOhm ?? ''}
                        onBlur={(e) =>
                          patchVisit(visit.id, { bia: { ...visit.bia, impedanceOhm: parsePositive(e.target.value) } })
                        }
                      />
                    </div>
                  )}
                  <div className="field mb-0" style={{ minWidth: 110 }}>
                    <label>Reattanza Xc Ω</label>
                    <input
                      type="number"
                      min="0.1"
                      max="1000"
                      step="0.1"
                      key={`xc-${visit.id}-${visit.bia.reactanceOhm}`}
                      defaultValue={visit.bia.reactanceOhm ?? ''}
                      onBlur={(e) =>
                        patchVisit(visit.id, { bia: { ...visit.bia, reactanceOhm: parsePositive(e.target.value) } })
                      }
                    />
                  </div>
                </div>
              </div>
              <div className="misura-head-row">
              <div className="field mb-0" style={{ minWidth: 240 }}>
                <label>Densità (pliche)</label>
                <select
                  value={visit.eqDensitaPliche}
                  title={
                    formulaOpt
                      ? `${formulaOpt.hint} · validata ${formulaOpt.min}–${formulaOpt.max} anni`
                      : undefined
                  }
                  onChange={(e) =>
                    patchVisit(visit.id, { eqDensitaPliche: e.target.value as EqDensitaPliche })
                  }
                >
                  {(assessed?.anthro.formulaEta ?? EQ_DENSITA_OPTIONS).map((f) => {
                    const validata = 'validata' in f ? f.validata : true
                    return (
                      <option key={f.value} value={f.value}>
                        {validata ? '✓' : '⚠'} {f.label}
                      </option>
                    )
                  })}
                </select>
              </div>
              <div className="field mb-0" style={{ minWidth: 120 }}>
                <label>Grasso</label>
                <select
                  value={visit.eqMassaGrassa}
                  onChange={(e) => patchVisit(visit.id, { eqMassaGrassa: e.target.value as EqMassaGrassa })}
                >
                  <option value="Siri">Siri</option>
                  <option value="Brozek">Brozek</option>
                </select>
              </div>
              <div className="field mb-0" style={{ minWidth: 130 }}>
                <label>Superficie (BSA)</label>
                <select
                  value={visit.eqSuperficie}
                  onChange={(e) => patchVisit(visit.id, { eqSuperficie: e.target.value as EqSuperficie })}
                >
                  {EQ_SUPERFICIE_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="field mb-0" style={{ minWidth: 130 }}>
                <label>Peso teorico</label>
                <select
                  value={visit.pesoTeorico}
                  onChange={(e) =>
                    patchVisit(visit.id, { pesoTeorico: e.target.value as FormulaPesoTeorico })
                  }
                >
                  {PESO_TEORICO_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="field mb-0" style={{ minWidth: 170 }}>
                <label>Dispendio (BMR)</label>
                <select
                  value={visit.formulaBmr}
                  onChange={(e) => patchVisit(visit.id, { formulaBmr: e.target.value as MetodoBmr })}
                >
                  {METODI_BMR.map((m) => (
                    <option key={m.value} value={m.value} title={m.descrizione}>
                      {m.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="field mb-0" style={{ minWidth: 220 }}>
                <label>LAF</label>
                <select
                  value={String(visit.laf)}
                  onChange={(e) => patchVisit(visit.id, { laf: Number(e.target.value) })}
                >
                  {LIVELLI_DISPENDIO.map((l) => (
                    <option key={`${l.fonte}-${l.value}`} value={l.value}>
                      {l.label} ({l.value.toLocaleString('it-IT', { minimumFractionDigits: 2 })}) · {l.fonte}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            </div>
            {assessed && assessed.age <= 0 ? (
              <div className="panel text-[13px] text-[var(--color-copper)]">
                Manca la data di nascita in anagrafica: senza età non partono pliche, fasce Gallagher, BIA e BMR.
              </div>
            ) : null}
            {assessed && !assessed.sex ? (
              <div className="panel text-[13px] text-[var(--color-copper)]">
                Scegli il sesso del paziente: Maschio o Femmina. Senza sesso non si calcolano pliche, BIA, BMR né la
                mappa corporea.
              </div>
            ) : null}
            {formulaOpt && !formulaOpt.validata ? (
              <div className="panel text-[13px] text-[var(--color-copper)]">
                {formulaOpt.label} è validata tra {formulaOpt.min} e {formulaOpt.max} anni (età {assessed?.age}). Il
                numero esce lo stesso, senza la validazione dello studio.
                {assessed && assessed.age <= 72
                  ? ' In alternativa: Durnin & Womersley.'
                  : ' Nessuna plicometria copre questa età.'}
              </div>
            ) : null}

            <div className="misura-body">
              <div>
                <div className="omini-row">
                  {variant ? (
                    <>
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
                    </>
                  ) : (
                    <div className="panel" style={{ gridColumn: '1 / -1', minHeight: 280 }}>
                      <h2 className="serif text-xl mb-2">Indica il sesso per la mappa corporea</h2>
                      <p className="text-[var(--color-mute)]">
                        L’omino fotorealistico è disponibile per Maschio o Femmina. Scegli il sesso in anagrafica o sulla
                        visita.
                      </p>
                    </div>
                  )}
                </div>
                <p className="text-[11px] text-[var(--color-mute)] mt-2">
                  Compila nella tabella a fianco o cliccando i pin. Quota % fra i siti misurati col calibro, non una mappa
                  di grasso viscerale. Pin tratteggiati = visita di riferimento ({prev ? prev.date : 'nessuna'}).
                </p>
              </div>
              <MisureTabella
                visitId={visit.id}
                values={visit.measures}
                prev={prev?.measures ?? null}
                selectedKey={pin}
                requiredKeys={sitiRichiesti}
                visibleKeys={visibleKeys}
                formulaLabel={formulaOpt?.label ?? eqDensitaOption(visit.eqDensitaPliche).label}
                presetLabel={PRESET_LABELS[visit.protocolPreset] ?? visit.protocolPreset}
                hiddenStored={hiddenStored}
                onSelect={setPin}
                onChange={patchMeasure}
              />
            </div>
          </>
        )}
      </section>

      <aside className="inspector">
        {!visit || !assessed ? (
          <p className="text-[var(--color-mute)]">Seleziona una visita.</p>
        ) : (
          <>
            <div className="hair mb-2">Ispettore</div>
            <p className="text-[12px] text-[var(--color-mute)] mb-1">
              {selectedDef
                ? `Sito: ${selectedDef.label} (${selectedDef.unit}). Compila nella tabella o sull’omino.`
                : 'Clicca un pin sull’omino o una riga in tabella: si illuminano insieme.'}
            </p>
            <p className="text-[11px] text-[var(--color-mute)] mb-3">Salvata {fmtSaved(visit.updatedAt)}</p>
            <div className="field">
              <label>Note visita</label>
              <textarea
                value={visit.notes}
                onChange={(e) => patchVisit(visit.id, { notes: e.target.value })}
                placeholder="Annotazioni di questa visita"
              />
            </div>

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
              <p className="text-[12px] text-[var(--color-copper)] mt-2">
                Sesso Maschio o Femmina richiesto in anagrafica.
              </p>
            ) : null}

            <div className="hair mt-5 mb-2">BIA · AKERN 101</div>
            <p className="text-[11px] text-[var(--color-mute)] mb-2">
              R/Z e Xc si compilano in alto, accanto a peso e altezza. 50 kHz · tetrapolare mano-piede.
            </p>
            {assessed.bia.blockedReason ? <p className="text-[12px] text-[var(--color-copper)]">{assessed.bia.blockedReason}</p> : null}
            {assessed.bia.assessment?.qualityFlags.some((flag) => flag.severity !== 'info') ? (
              <div className="quality-flags mb-2">
                {assessed.bia.assessment.qualityFlags
                  .filter((flag) => flag.severity !== 'info')
                  .map((flag) => (
                    <div key={flag.code} className={`quality-flag ${flag.severity}`}>
                      <strong>Attenzione</strong>
                      <span>{flag.message}</span>
                    </div>
                  ))}
              </div>
            ) : null}
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

            <div className="hair mt-5 mb-2">Dispendio</div>
            <p className="text-[11px] text-[var(--color-mute)] mb-2">
              Formula BMR e LAF si scelgono in alto. Età {assessed.age > 0 ? `${assessed.age} anni` : '—'} ·{' '}
              {sexLabel(assessed.sex)}
            </p>
            <KpiCard
              label="BMR"
              value={assessed.energy?.bmr ?? assessed.anthro.bmr?.bmr}
              unit="kcal"
              hint={
                assessed.energy?.blocco ??
                (assessed.anthro.bmr?.fallbackFfm ? 'Fallback Mifflin (manca FFM)' : assessed.anthro.bmr?.metodo)
              }
            />
            <KpiCard
              label="TDEE"
              value={assessed.energy?.tdee ?? null}
              unit="kcal"
              hint={etichettaLaf(visit.laf)}
            />
          </>
        )}
      </aside>
    </>
  )
}

type VisitSex = 'M' | 'F' | null
