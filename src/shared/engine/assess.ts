import { calcolaEta, calcolaBmrConMetodo, normalizzaSesso } from './energia'
import { calcolaPlicometriaStrict } from './plicometria'
import { EQ_DENSITA_TO_STRICT, SKINFOLD_SITES, explainSkinfoldResult } from './skinfold-sites'
import { formulePerEta } from './formule-per-eta'
import {
  calculateBmi,
  classifyBmi,
  calculateWhr,
  calculateWhtr,
  calculateAbsi,
  calculateConicityIndex,
  calculateRfm,
  calculateDuBois,
  calculateMosteller,
  calculateBrozek,
  calculateArtometriaBraccio,
  calculateHeymsfieldSMM,
  calculatePesoIdeale,
  calculateHealthCarter
} from './indices'
import { fasciaMassaGrassa, fasciaWhr, fasciaWhtr, fasciaBmi } from './fasce-normalita'
import {
  createBiaAssessmentV2,
  normalizeBiaSignal,
  type BiaAssessmentV2,
  type BiaMetric,
  type NormalizedBiaSignal
} from './bia'
import type { PatientProfile, Visit } from '../types'
import { computeDistribution } from './distribuzione-pliche'

function num(v: number | null | undefined): number | undefined {
  return typeof v === 'number' && Number.isFinite(v) && v > 0 ? v : undefined
}

export function visitAge(patient: PatientProfile, visit: Visit): number {
  return calcolaEta(patient.birthDate, new Date(visit.date || Date.now()))
}

export function visitSex(patient: PatientProfile, visit: Visit): 'M' | 'F' | null {
  if (visit.clinicalSex === 'M' || visit.clinicalSex === 'F') return visit.clinicalSex
  return normalizzaSesso(patient.sex)
}

function plicheInput(visit: Visit) {
  const m = visit.measures
  return {
    petto: num(m.plicaPettorale),
    addome: num(m.plicaAddominale),
    coscia: num(m.plicaAnterioreCoscia),
    tricipite: num(m.plicaTricipite),
    bicipite: num(m.plicaBicipite),
    sovrailiaca: num(m.plicaSovrailiaca),
    sottoscapolare: num(m.plicaSottoscapolare),
    ascellare: num(m.plicaAscellare)
  }
}

export interface AnthropometryAssessment {
  bmi: number | null
  bmiClass: ReturnType<typeof classifyBmi>
  whr: number | null
  whtr: number | null
  absi: number | null
  conicity: number | null
  rfm: number | null
  bsa: number | null
  pesoIdeale: number | null
  pliche: {
    densita: number
    fmPct: number
    fmKg: number
    ffmKg: number
    formula: string
    fuoriValidita?: { min: number; max: number; eta: number }
    metodoGrasso: 'Siri' | 'Brozek'
  } | null
  plicheBlock: ReturnType<typeof explainSkinfoldResult>
  artometria: ReturnType<typeof calculateArtometriaBraccio>
  heymsfield: ReturnType<typeof calculateHeymsfieldSMM>
  somatotipo: ReturnType<typeof calculateHealthCarter>
  bmr: { bmr: number; fallbackFfm: boolean; metodo: string } | null
  fasce: {
    fat: ReturnType<typeof fasciaMassaGrassa>
    whr: ReturnType<typeof fasciaWhr>
    whtr: ReturnType<typeof fasciaWhtr>
    bmi: ReturnType<typeof fasciaBmi>
  }
  formulaEta: ReturnType<typeof formulePerEta>
  distribution: ReturnType<typeof computeDistribution>
}

export interface BiaView {
  signal: NormalizedBiaSignal | null
  assessment: BiaAssessmentV2 | null
  blockedReason: string | null
}

export interface VisitAssessment {
  age: number
  sex: 'M' | 'F' | null
  anthro: AnthropometryAssessment
  bia: BiaView
}

export function assessVisit(patient: PatientProfile, visit: Visit): VisitAssessment {
  const age = visitAge(patient, visit)
  const sex = visitSex(patient, visit)
  const w = visit.weightKg
  const h = visit.heightCm
  const m = visit.measures
  const formula = EQ_DENSITA_TO_STRICT[visit.eqDensitaPliche]
  const plic = plicheInput(visit)

  const siteValues = {
    tricipite: plic.tricipite,
    bicipite: plic.bicipite,
    pettorale: plic.petto,
    ascellare: plic.ascellare,
    sottoscapolare: plic.sottoscapolare,
    addominale: plic.addome,
    sovrailiaca: plic.sovrailiaca,
    coscia: plic.coscia
  }

  let pliche: AnthropometryAssessment['pliche'] = null
  if (sex && w && w > 0 && age > 0) {
    const strict = calcolaPlicometriaStrict({ ...plic, formula }, sex, age, w, {
      fuoriValidita: 'calcola'
    })
    if (strict) {
      let fmPct = strict.grassoPct
      if (visit.eqMassaGrassa === 'Brozek') {
        const brozek = calculateBrozek(strict.densita)
        if (brozek != null) fmPct = Math.round(Math.max(2, Math.min(60, brozek)) * 10) / 10
      }
      const fmKg = Math.round(w * (fmPct / 100) * 10) / 10
      pliche = {
        densita: strict.densita,
        fmPct,
        fmKg,
        ffmKg: Math.round((w - fmKg) * 10) / 10,
        formula: strict.formulaUsata,
        fuoriValidita: strict.fuoriValidita,
        metodoGrasso: visit.eqMassaGrassa
      }
    }
  }

  const plicheBlock = explainSkinfoldResult({
    formula,
    sesso: sex,
    eta: age,
    values: siteValues,
    computed: pliche != null,
    fuoriValidita: 'calcola'
  })

  const bmi = w && h ? calculateBmi(w, h) : null
  const whr = calculateWhr(m.vita ?? 0, m.fianchi ?? 0)
  const whtr = h ? calculateWhtr(m.vita ?? 0, h) : null
  const bsa =
    w && h ? (visit.eqSuperficie === 'Mosteller' ? calculateMosteller(w, h) : calculateDuBois(w, h)) : null
  const ffmForBmr = pliche?.ffmKg ?? null
  const bmrRaw =
    w && h && age > 0
      ? calcolaBmrConMetodo({
          metodo: visit.formulaBmr,
          pesoKg: w,
          altezzaCm: h,
          etaAnni: age,
          sesso: sex,
          ffmKg: ffmForBmr
        })
      : null

  const anthro: AnthropometryAssessment = {
    bmi,
    bmiClass: classifyBmi(bmi),
    whr,
    whtr,
    absi: w && h ? calculateAbsi(m.vita ?? 0, h, w) : null,
    conicity: w && h ? calculateConicityIndex(m.vita ?? 0, h, w) : null,
    rfm: h ? calculateRfm(m.vita ?? 0, h, sex ?? patient.sex) : null,
    bsa,
    pesoIdeale: h ? calculatePesoIdeale(visit.pesoTeorico, h, sex ?? patient.sex) : null,
    pliche,
    plicheBlock,
    artometria: calculateArtometriaBraccio({
      circBraccioCm: m.braccio ?? 0,
      plicaTricipiteMm: m.plicaTricipite ?? 0,
      sesso: sex ?? patient.sex
    }),
    heymsfield: h
      ? calculateHeymsfieldSMM({
          circBraccioCm: m.braccio ?? 0,
          plicaTricipiteMm: m.plicaTricipite ?? 0,
          altezzaCm: h,
          sesso: sex ?? patient.sex
        })
      : null,
    somatotipo:
      w && h
        ? calculateHealthCarter({
            pesoKg: w,
            altezzaCm: h,
            plicaTricipiteMm: m.plicaTricipite ?? 0,
            plicaSottoscapolareMm: m.plicaSottoscapolare ?? 0,
            plicaSovrailiacaMm: m.plicaSovrailiaca ?? 0,
            plicaPolpaccioMm: m.plicaPolpaccio ?? 0,
            diametroOmeroCm: m.diametroGomito ?? 0,
            diametroFemoreCm: m.diametroGinocchio ?? 0,
            circBraccioContrattoCm: m.braccioContratto ?? 0,
            circPolpaccioCm: m.polpaccio ?? 0
          })
        : null,
    bmr: bmrRaw && bmrRaw.bmr > 0 ? { bmr: bmrRaw.bmr, fallbackFfm: bmrRaw.fallbackFfm, metodo: visit.formulaBmr } : null,
    fasce: {
      fat: fasciaMassaGrassa(pliche?.fmPct, sex, age),
      whr: fasciaWhr(whr, sex),
      whtr: fasciaWhtr(whtr),
      bmi: fasciaBmi(bmi)
    },
    formulaEta: formulePerEta(age, sex),
    distribution: computeDistribution({
      plicaTricipite: m.plicaTricipite,
      plicaBicipite: m.plicaBicipite,
      plicaPettorale: m.plicaPettorale,
      plicaAscellare: m.plicaAscellare,
      plicaSottoscapolare: m.plicaSottoscapolare,
      plicaAddominale: m.plicaAddominale,
      plicaSovrailiaca: m.plicaSovrailiaca,
      plicaAnterioreCoscia: m.plicaAnterioreCoscia
    })
  }

  const bia = assessBia(visit, sex, age, w, h)
  return { age, sex, anthro, bia }
}

function assessBia(
  visit: Visit,
  sex: 'M' | 'F' | null,
  age: number,
  weightKg: number | null,
  heightCm: number | null
): BiaView {
  const xc = visit.bia.reactanceOhm
  if (!(xc && xc > 0)) return { signal: null, assessment: null, blockedReason: null }

  const signalInput =
    visit.bia.inputKind === 'Z_XC'
      ? {
          kind: 'Z_XC' as const,
          impedanceOhm: visit.bia.impedanceOhm ?? 0,
          reactanceOhm: xc,
          frequencyKhz: 50 as const,
          measurementSite: 'whole_body' as const
        }
      : {
          kind: 'R_XC' as const,
          resistanceOhm: visit.bia.resistanceOhm ?? 0,
          reactanceOhm: xc,
          frequencyKhz: 50 as const,
          measurementSite: 'whole_body' as const
        }

  const normalized = normalizeBiaSignal(signalInput)
  const signal = normalized.ok ? normalized.signal : null
  if (!sex)
    return { signal, assessment: null, blockedReason: 'Sesso M/F richiesto per Sun, Janssen e BIVA.' }
  if (!(age > 0) || !(weightKg && weightKg > 0) || !(heightCm && heightCm > 0))
    return { signal, assessment: null, blockedReason: 'Peso, altezza ed età servono alle stime BIA.' }

  const deviceMetrics: Record<string, BiaMetric | undefined> = {}
  if (visit.bia.deviceBcmKg && visit.bia.deviceBcmKg > 0) {
    deviceMetrics.bcm = {
      value: visit.bia.deviceBcmKg,
      unit: 'kg',
      origin: 'device',
      methodId: 'device-output'
    }
  }
  if (visit.bia.deviceEcmKg && visit.bia.deviceEcmKg > 0) {
    deviceMetrics.ecm = {
      value: visit.bia.deviceEcmKg,
      unit: 'kg',
      origin: 'device',
      methodId: 'device-output'
    }
  }
  if (visit.bia.deviceNaK && visit.bia.deviceNaK > 0) {
    deviceMetrics.nakExchangeable = {
      value: visit.bia.deviceNaK,
      unit: '',
      origin: 'device',
      methodId: 'device-output'
    }
  }

  const assessment = createBiaAssessmentV2({
    signal: signalInput,
    subject: { ageYears: age, sexForEquation: sex, heightCm, weightKg, measuredAt: visit.date },
    referenceProfileId: visit.bia.bivaProfileId,
    bmrMethod: 'Cunningham',
    deviceMetrics
  })
  return { signal, assessment, blockedReason: null }
}

export function requiredSkinfoldKeys(formula: Visit['eqDensitaPliche'], sex: 'M' | 'F' | null): string[] {
  const strict = EQ_DENSITA_TO_STRICT[formula]
  return SKINFOLD_SITES.filter((d) => {
    if (!d.site) return false
    if (!sex) return d.strictKey != null
    const needed = sex === 'F'
      ? strict === 'JP3'
        ? ['tricipite', 'sovrailiaca', 'coscia']
        : null
      : strict === 'JP3'
        ? ['petto', 'addome', 'coscia']
        : null
    if (!needed) return true
    return needed.includes(d.strictKey ?? '')
  }).map((d) => d.stateKey)
}

void requiredSkinfoldKeys
