/**
 * Motore BIA/BIVA condiviso e versionato.
 *
 * Tutte le funzioni sono pure: nessuna dipendenza da React, database o ambiente.
 * I valori derivati conservano sempre metodo e origine; i compartimenti che non
 * possono essere ricavati con una formula validata non vengono sintetizzati.
 */

import { calcolaBmrConMetodo, type MetodoBmr } from "./energia";
import type { BiaMetricReference } from "./bia-metrics";

export const BIA_SCHEMA_VERSION = 2 as const;
export const BIA_CALCULATION_VERSION = "bia-core-2.2.0";
export const BIA_INTERPRETATION_VERSION = "bia-interpretation-2.3.0";

export type BiaSex = "M" | "F";
export type BiaMetricOrigin = "measured" | "device" | "estimated";
export type BiaSignalSource =
  | "manual"
  | "device"
  | "imported_document"
  | "legacy";

export interface BiaMetric {
  value: number;
  unit: string;
  origin: BiaMetricOrigin;
  methodId: string;
  methodVersion?: string;
  label?: string;
  reference?: BiaMetricReference;
}

export interface BiaQualityFlag {
  code: string;
  severity: "info" | "warning" | "blocking";
  scope: "signal" | "composition" | "biva" | "anthropometry" | "provenance";
  message: string;
}

interface BiaSignalBase {
  reactanceOhm: number;
  frequencyKhz: number;
  measurementSite: "whole_body" | "segmental";
  source?: BiaSignalSource;
}

export type BiaSignalInput =
  | (BiaSignalBase & { kind: "R_XC"; resistanceOhm: number })
  | (BiaSignalBase & { kind: "Z_XC"; impedanceOhm: number });

export interface NormalizedBiaSignal {
  inputKind: BiaSignalInput["kind"];
  resistanceOhm: number;
  reactanceOhm: number;
  impedanceOhm: number;
  phaseAngleDeg: number;
  frequencyKhz: number;
  measurementSite: BiaSignalBase["measurementSite"];
  source: BiaSignalSource;
}

export type BiaSignalNormalization =
  | { ok: true; signal: NormalizedBiaSignal; qualityFlags: BiaQualityFlag[] }
  | { ok: false; signal: null; qualityFlags: BiaQualityFlag[] };

const blockingSignal = (
  code: string,
  message: string,
): BiaSignalNormalization => ({
  ok: false,
  signal: null,
  qualityFlags: [{ code, severity: "blocking", scope: "signal", message }],
});

export function normalizeBiaSignal(
  input: BiaSignalInput,
): BiaSignalNormalization {
  if (!Number.isFinite(input.reactanceOhm) || input.reactanceOhm <= 0) {
    return blockingSignal(
      "INVALID_REACTANCE",
      "La reattanza Xc deve essere un numero positivo.",
    );
  }
  if (!Number.isFinite(input.frequencyKhz) || input.frequencyKhz <= 0) {
    return blockingSignal(
      "INVALID_FREQUENCY",
      "La frequenza di acquisizione deve essere positiva.",
    );
  }

  let resistanceOhm: number;
  let impedanceOhm: number;
  if (input.kind === "R_XC") {
    if (!Number.isFinite(input.resistanceOhm) || input.resistanceOhm <= 0) {
      return blockingSignal(
        "INVALID_RESISTANCE",
        "La resistenza R deve essere un numero positivo.",
      );
    }
    resistanceOhm = input.resistanceOhm;
    impedanceOhm = Math.hypot(resistanceOhm, input.reactanceOhm);
  } else {
    if (
      !Number.isFinite(input.impedanceOhm) ||
      input.impedanceOhm <= input.reactanceOhm
    ) {
      return blockingSignal(
        "INVALID_IMPEDANCE",
        "L'impedenza Z deve essere maggiore della reattanza Xc.",
      );
    }
    impedanceOhm = input.impedanceOhm;
    resistanceOhm = Math.sqrt(impedanceOhm ** 2 - input.reactanceOhm ** 2);
  }

  const qualityFlags: BiaQualityFlag[] = [];
  if (input.frequencyKhz !== 50) {
    qualityFlags.push({
      code: "NON_CLASSIC_FREQUENCY",
      severity: "warning",
      scope: "biva",
      message: "La BIVA classica richiede un segnale total-body a 50 kHz.",
    });
  }
  if (input.measurementSite !== "whole_body") {
    qualityFlags.push({
      code: "SEGMENTAL_SIGNAL",
      severity: "blocking",
      scope: "biva",
      message:
        "Un'impedenza segmentale non può essere usata per la BIVA classica total-body.",
    });
  }

  return {
    ok: true,
    signal: {
      inputKind: input.kind,
      resistanceOhm,
      reactanceOhm: input.reactanceOhm,
      impedanceOhm,
      phaseAngleDeg:
        Math.atan2(input.reactanceOhm, resistanceOhm) * (180 / Math.PI),
      frequencyKhz: input.frequencyKhz,
      measurementSite: input.measurementSite,
      source: input.source ?? "manual",
    },
    qualityFlags,
  };
}

export interface BiaSubjectSnapshot {
  ageYears: number;
  sexForEquation: BiaSex;
  heightCm: number;
  weightKg: number;
  measuredAt?: string;
}

export interface SunBodyComposition {
  tbw: BiaMetric;
  ffm: BiaMetric;
  fm: BiaMetric;
  fmPercent: BiaMetric;
}

/** Equazioni Sun et al. 2003, popolazione NHANES III, impedenza total-body a 50 kHz. */
export function calculateSunBodyComposition(
  signal: Pick<
    NormalizedBiaSignal,
    "resistanceOhm" | "frequencyKhz" | "measurementSite"
  >,
  subject: BiaSubjectSnapshot,
): SunBodyComposition | null {
  const { heightCm, weightKg, sexForEquation, ageYears } = subject;
  if (
    signal.frequencyKhz !== 50 ||
    signal.measurementSite !== "whole_body" ||
    !Number.isFinite(heightCm) ||
    heightCm <= 0 ||
    !Number.isFinite(weightKg) ||
    weightKg <= 0 ||
    !Number.isFinite(ageYears) ||
    ageYears < 12 ||
    ageYears > 94
  )
    return null;

  const h2r = heightCm ** 2 / signal.resistanceOhm;
  const tbwValue =
    sexForEquation === "M"
      ? 1.203 + 0.176 * weightKg + 0.449 * h2r
      : 3.747 + 0.113 * weightKg + 0.45 * h2r;
  const ffmValue =
    sexForEquation === "M"
      ? -10.678 + 0.652 * h2r + 0.262 * weightKg + 0.015 * signal.resistanceOhm
      : -9.529 + 0.696 * h2r + 0.168 * weightKg + 0.016 * signal.resistanceOhm;
  const fmValue = weightKg - ffmValue;
  if (
    ![tbwValue, ffmValue, fmValue].every(Number.isFinite) ||
    tbwValue <= 0 ||
    ffmValue <= 0 ||
    fmValue < 0
  ) {
    return null;
  }
  const common = { origin: "estimated" as const, methodVersion: "Sun-2003" };
  return {
    tbw: { value: tbwValue, unit: "L", methodId: "sun-2003-tbw", ...common },
    ffm: { value: ffmValue, unit: "kg", methodId: "sun-2003-ffm", ...common },
    fm: { value: fmValue, unit: "kg", methodId: "sun-2003-ffm", ...common },
    fmPercent: {
      value: (fmValue / weightKg) * 100,
      unit: "%",
      methodId: "sun-2003-ffm",
      ...common,
    },
  };
}

export interface JanssenMuscleEstimate {
  skeletalMuscleMass: BiaMetric;
  skeletalMuscleIndex: BiaMetric;
}

/** Equazione Janssen et al. 2000: SMM, non ASMI appendicolare/DXA. */
export function calculateJanssenSkeletalMuscle(
  signal: Pick<
    NormalizedBiaSignal,
    "resistanceOhm" | "frequencyKhz" | "measurementSite"
  >,
  subject: BiaSubjectSnapshot,
): JanssenMuscleEstimate | null {
  if (
    signal.frequencyKhz !== 50 ||
    signal.measurementSite !== "whole_body" ||
    subject.heightCm <= 0 ||
    subject.ageYears < 18 ||
    subject.ageYears > 86
  )
    return null;
  const sexM = subject.sexForEquation === "M" ? 1 : 0;
  const value =
    (subject.heightCm ** 2 / signal.resistanceOhm) * 0.401 +
    sexM * 3.825 -
    subject.ageYears * 0.071 +
    5.102;
  const heightM = subject.heightCm / 100;
  if (!Number.isFinite(value) || value <= 0) return null;
  const common = {
    origin: "estimated" as const,
    methodVersion: "Janssen-2000",
  };
  return {
    skeletalMuscleMass: {
      value,
      unit: "kg",
      methodId: "janssen-2000-smm",
      ...common,
    },
    skeletalMuscleIndex: {
      value: value / heightM ** 2,
      unit: "kg/m²",
      methodId: "janssen-2000-smi",
      ...common,
    },
  };
}

export type BivaSportCategory =
  | "general"
  | "athlete_all"
  | "endurance"
  | "power_velocity"
  | "team";

export interface BivaReferenceProfile {
  id: string;
  label: string;
  version: string;
  sex: BiaSex;
  ageMin: number;
  ageMax: number;
  sportCategory: BivaSportCategory;
  sampleSize: number;
  meanRH: number;
  sdRH: number;
  meanXcH: number;
  sdXcH: number;
  correlation: number;
  protocol: {
    frequencyKhz: 50;
    measurementSite: "whole_body";
    electrodeConfiguration: "tetrapolar-foot-to-hand";
  };
  source: { citation: string; url: string };
}

const protocol50 = {
  frequencyKhz: 50 as const,
  measurementSite: "whole_body" as const,
  electrodeConfiguration: "tetrapolar-foot-to-hand" as const,
};

function adultReference(
  sex: BiaSex,
  meanRH: number,
  sdRH: number,
  meanXcH: number,
  sdXcH: number,
  correlation: number,
  sampleSize: number,
): BivaReferenceProfile {
  return {
    id: `it-general-2023-${sex.toLowerCase()}`,
    label: `Popolazione generale italiana 18–65 · ${sex === "M" ? "uomini" : "donne"}`,
    version: "Campa-2023",
    sex,
    ageMin: 18,
    ageMax: 65,
    sportCategory: "general",
    sampleSize,
    meanRH,
    sdRH,
    meanXcH,
    sdXcH,
    correlation,
    protocol: protocol50,
    source: {
      citation: "Campa et al., Clinical Nutrition 2023",
      url: "https://www.sciencedirect.com/science/article/pii/S0261561423002510",
    },
  };
}

function athleteReference(
  sex: BiaSex,
  category: Exclude<BivaSportCategory, "general">,
  label: string,
  meanRH: number,
  sdRH: number,
  meanXcH: number,
  sdXcH: number,
  correlation: number,
  sampleSize: number,
): BivaReferenceProfile {
  return {
    id: `it-athlete-2019-${category}-${sex.toLowerCase()}`,
    label: `${label} · ${sex === "M" ? "uomini" : "donne"}`,
    version: "Campa-2019",
    sex,
    ageMin: 18,
    ageMax: 65,
    sportCategory: category,
    sampleSize,
    meanRH,
    sdRH,
    meanXcH,
    sdXcH,
    correlation,
    protocol: protocol50,
    source: {
      citation: "Campa et al., 2019",
      url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC6950502/",
    },
  };
}

function pediatricReference(
  sex: BiaSex,
  ageMin: number,
  ageMax: number,
  meanRH: number,
  sdRH: number,
  meanXcH: number,
  sdXcH: number,
  correlation: number,
  sampleSize: number,
  sexSpecific: boolean,
): BivaReferenceProfile {
  const ageLabel =
    ageMin === ageMax ? `${ageMin} anni` : `${ageMin}–${ageMax} anni`;
  const sexLabel = sexSpecific
    ? sex === "M"
      ? "maschi"
      : "femmine"
    : "coorte mista";
  return {
    id: `it-pediatric-2000-${ageMin}-${ageMax}-${sex.toLowerCase()}`,
    label: `Popolazione pediatrica italiana ${ageLabel} · ${sexLabel}`,
    version: "DePalo-2000",
    sex,
    ageMin,
    ageMax,
    sportCategory: "general",
    sampleSize,
    meanRH,
    sdRH,
    meanXcH,
    sdXcH,
    correlation,
    protocol: protocol50,
    source: {
      citation: "De Palo et al., Nutrition 2000, Table I",
      url: "https://pubmed.ncbi.nlm.nih.gov/10869896/",
    },
  };
}

const pediatricMixed = (
  ageMin: number,
  ageMax: number,
  meanRH: number,
  sdRH: number,
  meanXcH: number,
  sdXcH: number,
  correlation: number,
  sampleSize: number,
) =>
  (["M", "F"] as const).map((sex) =>
    pediatricReference(
      sex,
      ageMin,
      ageMax,
      meanRH,
      sdRH,
      meanXcH,
      sdXcH,
      correlation,
      sampleSize,
      false,
    ),
  );

export const BIVA_REFERENCE_PROFILES: readonly BivaReferenceProfile[] = [
  adultReference("M", 265.7, 35.1, 32.1, 4.9, 0.6, 2137),
  adultReference("F", 337.2, 47.8, 35.9, 5.5, 0.67, 2230),
  athleteReference(
    "M",
    "athlete_all",
    "Atleti italiani",
    251.6,
    32.5,
    33.9,
    4.8,
    0.7,
    1116,
  ),
  athleteReference(
    "M",
    "endurance",
    "Atleti endurance italiani",
    267.2,
    28.0,
    35.5,
    4.7,
    0.5,
    165,
  ),
  athleteReference(
    "M",
    "power_velocity",
    "Atleti potenza/velocità italiani",
    253.3,
    32.4,
    34.2,
    5.5,
    0.7,
    375,
  ),
  athleteReference(
    "M",
    "team",
    "Atleti sport di squadra italiani",
    246.2,
    32.3,
    32.9,
    4.8,
    0.6,
    576,
  ),
  athleteReference(
    "F",
    "athlete_all",
    "Atlete italiane",
    318.1,
    42.8,
    38.3,
    6.4,
    0.7,
    440,
  ),
  athleteReference(
    "F",
    "endurance",
    "Atlete endurance italiane",
    337.5,
    42.9,
    40.1,
    5.5,
    0.6,
    76,
  ),
  athleteReference(
    "F",
    "power_velocity",
    "Atlete potenza/velocità italiane",
    321.0,
    46.9,
    38.0,
    7.4,
    0.8,
    177,
  ),
  athleteReference(
    "F",
    "team",
    "Atlete sport di squadra italiane",
    305.6,
    37.6,
    36.3,
    5.3,
    0.6,
    187,
  ),
  ...pediatricMixed(2, 3, 751, 75, 60, 10, 0.41, 115),
  ...pediatricMixed(4, 5, 672, 72, 58, 8, 0.57, 220),
  ...pediatricMixed(6, 7, 600, 64, 56, 7, 0.56, 448),
  ...pediatricMixed(8, 8, 561, 58, 54, 7, 0.57, 227),
  ...pediatricMixed(9, 9, 527, 53, 52, 7, 0.66, 200),
  ...pediatricMixed(10, 11, 486, 58, 48, 6, 0.71, 369),
  ...pediatricMixed(12, 12, 440, 57, 44, 6, 0.77, 132),
  ...pediatricMixed(13, 13, 402, 61, 42, 6, 0.74, 116),
  pediatricReference("M", 14, 15, 338, 48, 37, 5, 0.67, 97, true),
  pediatricReference("F", 14, 15, 403, 44, 41, 6, 0.67, 120, true),
] as const;

export const BIVA_REFERENCE_CATALOG = BIVA_REFERENCE_PROFILES.map(
  (profile) => ({ status: "active" as const, profile }),
);

export interface BivaReferenceSelection {
  reference: BivaReferenceProfile | null;
  reason: string;
}

export function selectBivaReference(input: {
  sex: BiaSex;
  ageYears: number;
  requestedProfileId?: string | null;
}): BivaReferenceSelection {
  if (input.requestedProfileId) {
    const reference =
      BIVA_REFERENCE_PROFILES.find(
        (item) => item.id === input.requestedProfileId,
      ) ?? null;
    if (!reference)
      return {
        reference: null,
        reason: "Il riferimento richiesto non è attivo o non esiste.",
      };
    if (
      reference.sex !== input.sex ||
      input.ageYears < reference.ageMin ||
      input.ageYears > reference.ageMax
    ) {
      return {
        reference: null,
        reason:
          "Il riferimento richiesto non è applicabile per sesso o fascia d'età.",
      };
    }
    return { reference, reason: "Riferimento selezionato dal professionista." };
  }
  if (input.ageYears >= 2 && input.ageYears <= 15) {
    const reference =
      BIVA_REFERENCE_PROFILES.find(
        (item) =>
          item.version === "DePalo-2000" &&
          item.sex === input.sex &&
          input.ageYears >= item.ageMin &&
          input.ageYears <= item.ageMax,
      ) ?? null;
    return {
      reference,
      reason: reference
        ? "Riferimento pediatrico italiano selezionato automaticamente per età e sesso."
        : "Riferimento pediatrico non disponibile.",
    };
  }
  if (input.ageYears < 18 || input.ageYears > 65) {
    return {
      reference: null,
      reason: "Nessuna ellisse validata attiva per questa fascia d'età.",
    };
  }
  const reference =
    BIVA_REFERENCE_PROFILES.find(
      (item) => item.sex === input.sex && item.sportCategory === "general",
    ) ?? null;
  return {
    reference,
    reason: reference
      ? "Riferimento generale italiano selezionato automaticamente."
      : "Riferimento non disponibile.",
  };
}

export const BIVA_PROBABILITIES = [0.5, 0.75, 0.95] as const;
export type BivaProbability = (typeof BIVA_PROBABILITIES)[number];

export interface BivaEllipse {
  probability: BivaProbability;
  chiSquare: number;
  center: { rH: number; xcH: number };
  semiMajor: number;
  semiMinor: number;
  angleRad: number;
  points: Array<{ rH: number; xcH: number }>;
}

export interface BivaResult {
  rH: number;
  xcH: number;
  mahalanobisSquared: number;
  zone: "inside_50" | "between_50_75" | "between_75_95" | "outside_95";
  majorAxisScore: number;
  minorAxisScore: number;
  phaseAngleDeg: number;
  referencePhaseAngleDeg: number;
  phaseAngleSdDeg: number;
  phaseAngleZ: number;
  phaseAnglePercentile: number;
  ellipsePercentile: number;
  phenotype: BivaPhenotype;
  reference: BivaReferenceProfile;
  ellipses: BivaEllipse[];
}

export type BivaPhenotypeId =
  | "higher_hydration_higher_cellularity"
  | "lower_hydration_higher_cellularity"
  | "lower_hydration_lower_cellularity"
  | "higher_hydration_lower_cellularity";

export interface BivaPhenotype {
  id: BivaPhenotypeId;
  title: string;
  label: string;
  hydration: "higher" | "lower";
  cellularity: "higher" | "lower";
}

export const BIVA_PHENOTYPE_ZONES: readonly BivaPhenotype[] = [
  {
    id: "higher_hydration_higher_cellularity",
    title: "Area atletica",
    label:
      "Area atletica · maggiore idratazione relativa · componente cellulare superiore",
    hydration: "higher",
    cellularity: "higher",
  },
  {
    id: "lower_hydration_higher_cellularity",
    title: "Area magra",
    label:
      "Area magra · minore idratazione relativa · componente cellulare superiore",
    hydration: "lower",
    cellularity: "higher",
  },
  {
    id: "lower_hydration_lower_cellularity",
    title: "Area a ridotta cellularità",
    label:
      "Area a ridotta cellularità · minore idratazione relativa · componente cellulare inferiore",
    hydration: "lower",
    cellularity: "lower",
  },
  {
    id: "higher_hydration_lower_cellularity",
    title: "Area adiposa",
    label:
      "Area adiposa · maggiore idratazione relativa · componente cellulare inferiore",
    hydration: "higher",
    cellularity: "lower",
  },
] as const;

export const BIVA_ZONE_LABELS: Record<BivaResult["zone"], string> = {
  inside_50: "Entro il 50%",
  between_50_75: "Tra 50% e 75%",
  between_75_95: "Tra 75% e 95%",
  outside_95: "Oltre il 95%",
};

/** Dominio del piano RXc: ellissi + punti, stesso padding del grafico Nutriva (doctor/patient/export). */
export function bivaPlotRange(
  result: BivaResult,
  trail: Array<{ rH: number; xcH: number }> = [],
): { rMin: number; rMax: number; xMin: number; xMax: number } {
  const pts = [
    ...result.ellipses.flatMap((e) => e.points),
    { rH: result.rH, xcH: result.xcH },
    ...trail,
  ];
  const rawXMin = Math.min(...pts.map((p) => p.rH));
  const rawXMax = Math.max(...pts.map((p) => p.rH));
  const rawYMin = Math.min(...pts.map((p) => p.xcH));
  const rawYMax = Math.max(...pts.map((p) => p.xcH));
  const xPad = Math.max((rawXMax - rawXMin) * 0.1, 12);
  const yPad = Math.max((rawYMax - rawYMin) * 0.14, 3);
  return {
    rMin: rawXMin - xPad,
    rMax: rawXMax + xPad,
    xMin: rawYMin - yPad,
    xMax: rawYMax + yPad,
  };
}

/**
 * Tacche «belle» per gli assi dei grafici BIVA: passi 1/2/5·10^k dentro [min, max].
 */
export function bivaAxisTicks(
  min: number,
  max: number,
  target = 5,
): number[] {
  const span = max - min;
  if (!Number.isFinite(span) || span <= 0) return [];
  const step0 = span / Math.max(2, target);
  const mag = 10 ** Math.floor(Math.log10(step0));
  const norm = step0 / mag;
  const step = (norm >= 7 ? 10 : norm >= 3 ? 5 : norm >= 1.5 ? 2 : 1) * mag;
  const ticks: number[] = [];
  for (
    let v = Math.ceil(min / step) * step;
    v <= max + step * 1e-6;
    v += step
  ) {
    ticks.push(Math.round(v * 1e6) / 1e6);
  }
  return ticks;
}

/**
 * Profilo direzionale sul piano delle componenti principali della coorte.
 * Non è una diagnosi né una stima quantitativa di acqua o BCM: descrive solo
 * la direzione del vettore rispetto al centro del riferimento salvato.
 */
export function classifyBivaPhenotype(
  majorAxisScore: number,
  minorAxisScore: number,
): BivaPhenotype {
  const hydration =
    majorAxisScore < 0 ? ("higher" as const) : ("lower" as const);
  const cellularity =
    minorAxisScore >= 0 ? ("higher" as const) : ("lower" as const);
  const id: BivaPhenotypeId =
    hydration === "higher"
      ? cellularity === "higher"
        ? "higher_hydration_higher_cellularity"
        : "higher_hydration_lower_cellularity"
      : cellularity === "higher"
        ? "lower_hydration_higher_cellularity"
        : "lower_hydration_lower_cellularity";
  return BIVA_PHENOTYPE_ZONES.find((zone) => zone.id === id)!;
}

export type BivaReferenceBandTone = "central" | "intermediate" | "outside";

export interface BivaReferenceBand {
  id: "ellipse" | "phase_angle" | "hydration_axis" | "cellularity_axis";
  label: string;
  value: number;
  unit: "%" | "z";
  distribution: "chi_square_2" | "normal";
  statisticValue: number;
  scaleMin: number;
  scaleMax: number;
  tone: BivaReferenceBandTone;
  lowLabel: string;
  highLabel: string;
  detail: string;
}

/**
 * Percentile in forma comunicabile: `toFixed(0)` agli estremi produce «100»
 * (o «0»), una certezza statistica che l'approssimazione delta non ha.
 * Oltre i bordi si riporta un limite, non un numero pieno (F-002, 09/08/2026).
 */
export function formatBivaPercentile(percentile: number): string {
  if (!Number.isFinite(percentile)) return "—";
  if (percentile > 99.9) return ">99,9";
  if (percentile >= 99.5) return ">99";
  if (percentile < 0.1) return "<0,1";
  if (percentile < 0.5) return "<1";
  return percentile.toFixed(0);
}

export function buildBivaReferenceBands(
  result: BivaResult,
): BivaReferenceBand[] {
  const zTone = (value: number): BivaReferenceBandTone =>
    Math.abs(value) <= 1
      ? "central"
      : Math.abs(value) <= 1.96
        ? "intermediate"
        : "outside";
  const ellipseTone: BivaReferenceBandTone =
    result.zone === "outside_95"
      ? "outside"
      : result.zone === "between_75_95"
        ? "intermediate"
        : "central";
  return [
    {
      id: "ellipse",
      label: "Distanza vettoriale",
      value: result.ellipsePercentile,
      unit: "%",
      scaleMin: 0,
      scaleMax: 100,
      distribution: "chi_square_2",
      statisticValue: result.mahalanobisSquared,
      tone: ellipseTone,
      lowLabel: "Centro coorte",
      highLabel: "Oltre 95%",
      detail: `${BIVA_ZONE_LABELS[result.zone]} · d² ${result.mahalanobisSquared.toFixed(2)}`,
    },
    {
      id: "phase_angle",
      label: "Angolo di fase standardizzato",
      value: result.phaseAngleZ,
      unit: "z",
      scaleMin: -3,
      scaleMax: 3,
      distribution: "normal",
      statisticValue: result.phaseAngleZ,
      tone: zTone(result.phaseAngleZ),
      lowLabel: "PA inferiore",
      highLabel: "PA superiore",
      detail: `${result.phaseAngleDeg.toFixed(1)}° · percentile ${formatBivaPercentile(result.phaseAnglePercentile)}`,
    },
    {
      id: "hydration_axis",
      label: "Asse longitudinale",
      value: result.majorAxisScore,
      unit: "z",
      scaleMin: -3,
      scaleMax: 3,
      distribution: "normal",
      statisticValue: result.majorAxisScore,
      tone: zTone(result.majorAxisScore),
      lowLabel: "Più idratazione relativa",
      highLabel: "Meno idratazione relativa",
      detail: `score ${result.majorAxisScore >= 0 ? "+" : ""}${result.majorAxisScore.toFixed(2)}`,
    },
    {
      id: "cellularity_axis",
      label: "Asse trasversale",
      value: result.minorAxisScore,
      unit: "z",
      scaleMin: -3,
      scaleMax: 3,
      distribution: "normal",
      statisticValue: result.minorAxisScore,
      tone: zTone(result.minorAxisScore),
      lowLabel: "Componente cellulare inferiore",
      highLabel: "Componente cellulare superiore",
      detail: `score ${result.minorAxisScore >= 0 ? "+" : ""}${result.minorAxisScore.toFixed(2)}`,
    },
  ];
}

export type BivaDistributionTone =
  | "central"
  | "reference"
  | "intermediate"
  | "outside";

export interface BivaDistributionCurve {
  distribution: BivaReferenceBand["distribution"];
  xMin: number;
  xMax: number;
  markerValue: number;
  markerLabel: string;
  axisLabel: string;
  caption: string;
  points: Array<{ x: number; density: number }>;
  segments: Array<{
    from: number;
    to: number;
    tone: BivaDistributionTone;
    label: string;
  }>;
  thresholds: Array<{ value: number; label: string }>;
  ticks: Array<{ value: number; label: string }>;
}

const CHI_SQUARE_2 = {
  p50: -2 * Math.log(1 - 0.5),
  p75: -2 * Math.log(1 - 0.75),
  p95: -2 * Math.log(1 - 0.95),
} as const;

/**
 * Geometria condivisa delle distribuzioni di riferimento mostrate in doctor,
 * patient ed export. Gli score z seguono la Normale standard; la distanza BIVA
 * al quadrato segue una chi-quadro con 2 gradi di libertà, non una Gaussiana.
 */
export function buildBivaDistributionCurve(
  band: BivaReferenceBand,
  pointCount = 96,
): BivaDistributionCurve {
  const count = Math.max(32, Math.floor(pointCount));
  if (band.distribution === "chi_square_2") {
    const markerValue = Math.max(0, band.statisticValue);
    const xMin = 0;
    const xMax = Math.max(7.5, Math.ceil(markerValue * 1.15 * 2) / 2);
    const points = Array.from({ length: count + 1 }, (_, index) => {
      const x = xMin + (index / count) * (xMax - xMin);
      return { x, density: Math.exp(-x / 2) };
    });
    const segments: BivaDistributionCurve["segments"] = [
      { from: xMin, to: CHI_SQUARE_2.p50, tone: "central", label: "Entro 50%" },
      {
        from: CHI_SQUARE_2.p50,
        to: CHI_SQUARE_2.p75,
        tone: "reference",
        label: "50–75%",
      },
      {
        from: CHI_SQUARE_2.p75,
        to: CHI_SQUARE_2.p95,
        tone: "intermediate",
        label: "75–95%",
      },
      { from: CHI_SQUARE_2.p95, to: xMax, tone: "outside", label: "Oltre 95%" },
    ];
    return {
      distribution: band.distribution,
      xMin,
      xMax,
      markerValue,
      markerLabel: `d² ${markerValue.toFixed(2)}`,
      axisLabel: "Distanza di Mahalanobis d²",
      caption:
        "Distribuzione χ² a 2 gradi di libertà; aree cumulative 50%, 75% e 95%.",
      points,
      segments: segments.filter((segment) => segment.to > segment.from),
      thresholds: [
        { value: CHI_SQUARE_2.p50, label: "50%" },
        { value: CHI_SQUARE_2.p75, label: "75%" },
        { value: CHI_SQUARE_2.p95, label: "95%" },
      ],
      ticks: [
        { value: 0, label: "0" },
        { value: CHI_SQUARE_2.p50, label: "50%" },
        { value: CHI_SQUARE_2.p75, label: "75%" },
        { value: CHI_SQUARE_2.p95, label: "95%" },
        ...(xMax > 8 ? [{ value: xMax, label: xMax.toFixed(1) }] : []),
      ],
    };
  }

  const markerValue = band.statisticValue;
  const maxAbs = Math.max(3, Math.ceil((Math.abs(markerValue) + 0.25) * 2) / 2);
  const xMin = -maxAbs;
  const xMax = maxAbs;
  const points = Array.from({ length: count + 1 }, (_, index) => {
    const x = xMin + (index / count) * (xMax - xMin);
    return { x, density: Math.exp(-0.5 * x * x) };
  });
  const segments: BivaDistributionCurve["segments"] = [
    { from: xMin, to: -1.96, tone: "outside", label: "z < −1,96" },
    { from: -1.96, to: -1, tone: "intermediate", label: "−1,96 – −1" },
    { from: -1, to: 1, tone: "central", label: "−1 – +1" },
    { from: 1, to: 1.96, tone: "intermediate", label: "+1 – +1,96" },
    { from: 1.96, to: xMax, tone: "outside", label: "z > +1,96" },
  ];
  return {
    distribution: band.distribution,
    xMin,
    xMax,
    markerValue,
    markerLabel: `z ${markerValue >= 0 ? "+" : ""}${markerValue.toFixed(2)}`,
    axisLabel: "Score z",
    caption:
      "Distribuzione Normale standard; fascia centrale ±1 e limiti esterni ±1,96.",
    points,
    segments: segments
      .map((segment) => ({
        ...segment,
        from: Math.max(xMin, segment.from),
        to: Math.min(xMax, segment.to),
      }))
      .filter((segment) => segment.to > segment.from),
    thresholds: [-1.96, -1, 1, 1.96].map((value) => ({
      value,
      label:
        value > 0
          ? `+${String(value).replace(".", ",")}`
          : String(value).replace("-", "−").replace(".", ","),
    })),
    ticks: [-maxAbs, -1.96, -1, 0, 1, 1.96, maxAbs]
      .filter((value, index, values) => values.indexOf(value) === index)
      .map((value) => ({
        value,
        label:
          value === 0
            ? "0"
            : value > 0
              ? `+${String(value).replace(".", ",")}`
              : String(value).replace("-", "−").replace(".", ","),
      })),
  };
}

function covariance(reference: BivaReferenceProfile) {
  return {
    a: reference.sdRH ** 2,
    b: reference.correlation * reference.sdRH * reference.sdXcH,
    d: reference.sdXcH ** 2,
  };
}

function eigensystem(reference: BivaReferenceProfile) {
  const { a, b, d } = covariance(reference);
  const trace = a + d;
  const root = Math.sqrt((a - d) ** 2 + 4 * b ** 2);
  const major = (trace + root) / 2;
  const minor = (trace - root) / 2;
  const angleRad = 0.5 * Math.atan2(2 * b, a - d);
  return { major, minor, angleRad };
}

export function buildBivaEllipse(
  reference: BivaReferenceProfile,
  probability: BivaProbability,
  pointCount = 120,
): BivaEllipse {
  const { major, minor, angleRad } = eigensystem(reference);
  const chiSquare = -2 * Math.log(1 - probability);
  const semiMajor = Math.sqrt(major * chiSquare);
  const semiMinor = Math.sqrt(minor * chiSquare);
  const cos = Math.cos(angleRad);
  const sin = Math.sin(angleRad);
  const points = Array.from(
    { length: Math.max(12, pointCount) + 1 },
    (_, index) => {
      const theta = (index / Math.max(12, pointCount)) * 2 * Math.PI;
      const x = semiMajor * Math.cos(theta);
      const y = semiMinor * Math.sin(theta);
      return {
        rH: reference.meanRH + x * cos - y * sin,
        xcH: reference.meanXcH + x * sin + y * cos,
      };
    },
  );
  return {
    probability,
    chiSquare,
    center: { rH: reference.meanRH, xcH: reference.meanXcH },
    semiMajor,
    semiMinor,
    angleRad,
    points,
  };
}

function normalCdf(value: number): number {
  const sign = value < 0 ? -1 : 1;
  const x = Math.abs(value) / Math.sqrt(2);
  const t = 1 / (1 + 0.3275911 * x);
  const erf =
    sign *
    (1 -
      ((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t - 0.284496736) *
        t +
        0.254829592) *
        t *
        Math.exp(-x * x));
  return (1 + erf) / 2;
}

export function calculateBiva(input: {
  signal: NormalizedBiaSignal;
  heightCm: number;
  reference: BivaReferenceProfile;
}): BivaResult | null {
  const { signal, heightCm, reference } = input;
  if (
    signal.frequencyKhz !== 50 ||
    signal.measurementSite !== "whole_body" ||
    heightCm <= 0
  )
    return null;
  const heightM = heightCm / 100;
  const rH = signal.resistanceOhm / heightM;
  const xcH = signal.reactanceOhm / heightM;
  const dx = rH - reference.meanRH;
  const dy = xcH - reference.meanXcH;
  const { a, b, d } = covariance(reference);
  const determinant = a * d - b * b;
  if (determinant <= 0) return null;
  const mahalanobisSquared =
    (d * dx ** 2 - 2 * b * dx * dy + a * dy ** 2) / determinant;
  const zone =
    mahalanobisSquared <= -2 * Math.log(0.5)
      ? "inside_50"
      : mahalanobisSquared <= -2 * Math.log(0.25)
        ? "between_50_75"
        : mahalanobisSquared <= -2 * Math.log(0.05)
          ? "between_75_95"
          : "outside_95";
  const { major, minor, angleRad } = eigensystem(reference);
  const cos = Math.cos(angleRad);
  const sin = Math.sin(angleRad);
  const majorAxisScore = (dx * cos + dy * sin) / Math.sqrt(major);
  const minorAxisScore = (-dx * sin + dy * cos) / Math.sqrt(minor);

  const phaseAngleDeg = (Math.atan2(xcH, rH) * 180) / Math.PI;
  const referencePhaseAngleDeg =
    (Math.atan2(reference.meanXcH, reference.meanRH) * 180) / Math.PI;
  const denom = reference.meanRH ** 2 + reference.meanXcH ** 2;
  const gradR = -reference.meanXcH / denom;
  const gradXc = reference.meanRH / denom;
  const phaseVarianceRad =
    gradR ** 2 * a + 2 * gradR * gradXc * b + gradXc ** 2 * d;
  const phaseSdDeg =
    (Math.sqrt(Math.max(phaseVarianceRad, Number.EPSILON)) * 180) / Math.PI;
  const phaseAngleZ = (phaseAngleDeg - referencePhaseAngleDeg) / phaseSdDeg;
  const ellipsePercentile = (1 - Math.exp(-mahalanobisSquared / 2)) * 100;
  const phenotype = classifyBivaPhenotype(majorAxisScore, minorAxisScore);

  return {
    rH,
    xcH,
    mahalanobisSquared,
    zone,
    majorAxisScore,
    minorAxisScore,
    phaseAngleDeg,
    referencePhaseAngleDeg,
    phaseAngleSdDeg: phaseSdDeg,
    phaseAngleZ,
    phaseAnglePercentile: normalCdf(phaseAngleZ) * 100,
    ellipsePercentile,
    phenotype,
    reference,
    ellipses: BIVA_PROBABILITIES.map((probability) =>
      buildBivaEllipse(reference, probability),
    ),
  };
}

export function buildBivaInterpretation(result: BivaResult, locale: "it" | "en" = "it"): string {
  if (locale === "en") {
    const zoneText: Record<BivaResult["zone"], string> = {
      inside_50: "within the 50% tolerance ellipse",
      between_50_75: "between the 50% and 75% tolerance ellipses",
      between_75_95: "between the 75% and 95% tolerance ellipses",
      outside_95: "outside the 95% tolerance ellipse",
    };
    const phenotypeText: Record<BivaPhenotypeId, string> = {
      higher_hydration_higher_cellularity: "athletic area",
      lower_hydration_higher_cellularity: "lean area",
      lower_hydration_lower_cellularity: "lower-cellularity area",
      higher_hydration_lower_cellularity: "adipose area",
    };
    const length =
      result.majorAxisScore > 0.5
        ? "The vector is longer than the cohort centre, compatible with a lower relative amount of body water."
        : result.majorAxisScore < -0.5
          ? "The vector is shorter than the cohort centre, compatible with a higher relative amount of body water."
          : "The vector length is close to the cohort centre.";
    const cell =
      result.minorAxisScore > 0.5
        ? "The transverse component is above the cohort centre."
        : result.minorAxisScore < -0.5
          ? "The transverse component is below the cohort centre."
          : "The transverse component is close to the cohort centre.";
    return `The R/H vector ${result.rH.toFixed(1)} Ω/m, Xc/H ${result.xcH.toFixed(1)} Ω/m is ${zoneText[result.zone]} (${result.reference.label}). Directional profile: ${phenotypeText[result.phenotype.id]}; this is not a diagnosis or a quantification of body compartments. ${length} ${cell} Phase angle is ${result.phaseAngleDeg.toFixed(1)}°, estimated cohort percentile ${formatBivaPercentile(result.phaseAnglePercentile)} using the delta approximation. Method ${result.reference.version}.`;
  }
  const zoneText: Record<BivaResult["zone"], string> = {
    inside_50: "all'interno dell'ellisse di tolleranza al 50%",
    between_50_75: "tra le ellissi di tolleranza al 50% e al 75%",
    between_75_95: "tra le ellissi di tolleranza al 75% e al 95%",
    outside_95: "all'esterno dell'ellisse di tolleranza al 95%",
  };
  const length =
    result.majorAxisScore > 0.5
      ? "Il vettore è più lungo rispetto al centro della coorte, compatibile con una minore quantità relativa di acqua corporea."
      : result.majorAxisScore < -0.5
        ? "Il vettore è più corto rispetto al centro della coorte, compatibile con una maggiore quantità relativa di acqua corporea."
        : "La lunghezza del vettore è prossima al centro della coorte.";
  const cell =
    result.minorAxisScore > 0.5
      ? "La componente trasversale è superiore al centro della coorte."
      : result.minorAxisScore < -0.5
        ? "La componente trasversale è inferiore al centro della coorte."
        : "La componente trasversale è prossima al centro della coorte.";
  return `Il vettore R/H ${result.rH.toFixed(1)} Ω/m, Xc/H ${result.xcH.toFixed(1)} Ω/m è ${zoneText[result.zone]} (${result.reference.label}). Profilo direzionale: ${result.phenotype.label.toLowerCase()}; non costituisce una diagnosi o una quantificazione dei compartimenti. ${length} ${cell} L'angolo di fase è ${result.phaseAngleDeg.toFixed(1)}°, percentile stimato ${formatBivaPercentile(result.phaseAnglePercentile)} della coorte mediante approssimazione delta. Metodo ${result.reference.version}.`;
}

export interface BiaAssessmentInput {
  signal: BiaSignalInput;
  subject: BiaSubjectSnapshot;
  referenceProfileId?: string | null;
  bmrMethod?: MetodoBmr;
  deviceMetrics?: Record<string, BiaMetric | undefined>;
  device?: {
    manufacturer?: string;
    model?: string;
    serialNumber?: string;
    softwareVersion?: string;
  };
  sourceDocumentHash?: string;
}

export interface BiaAssessmentV2 {
  schemaVersion: typeof BIA_SCHEMA_VERSION;
  calculationVersion: string;
  interpretationVersion: string;
  subject: BiaSubjectSnapshot;
  signal: NormalizedBiaSignal | null;
  metrics: Record<string, BiaMetric | undefined>;
  biva: BivaResult | null;
  referenceSelection: BivaReferenceSelection;
  qualityFlags: BiaQualityFlag[];
  interpretation: string[];
  provenance: {
    device?: BiaAssessmentInput["device"];
    sourceDocumentHash?: string;
  };
}

/**
 * Acqua extracellulare da BIA single-frequency 50 kHz total body.
 *
 * FONTE VERIFICATA, mai coefficienti a memoria: Sergi et al. 1994
 * (Ann Nutr Metab 38:158-65), equazione come tabulata in Coratella et al.
 * 2021 (Scand J Med Sci Sports, tab. 1):
 *   ECW (L) = −5.22 + 0.20·H²/R + 0.005·H²/Xc + 0.08·peso + 1.9 + 1.86·(1 se donna)
 * Stessa gating di Sun (50 kHz, whole body) ma su ADULTI: l'equazione è
 * stata sviluppata su adulti, sotto i 18 anni si risponde null.
 *
 * Il gate 18–94 è PIÙ AMPIO della coorte pubblicata (40 soggetti, 21–81 anni):
 * decisione del titolare del 09/08/2026 (audit F-001) di mantenerlo, purché
 * fuori da 21–81 l'assessment aggiunga il flag SERGI_FUORI_COORTE. Chi
 * restringe qui il gate deve prima passare da quella decisione.
 */
export function calculateSergiEcw(
  signal: Pick<
    NormalizedBiaSignal,
    "resistanceOhm" | "reactanceOhm" | "frequencyKhz" | "measurementSite"
  >,
  subject: BiaSubjectSnapshot,
): BiaMetric | null {
  const { heightCm, weightKg, sexForEquation, ageYears } = subject;
  if (
    signal.frequencyKhz !== 50 ||
    signal.measurementSite !== "whole_body" ||
    (sexForEquation !== "M" && sexForEquation !== "F") ||
    !Number.isFinite(heightCm) ||
    heightCm <= 0 ||
    !Number.isFinite(weightKg) ||
    weightKg <= 0 ||
    !Number.isFinite(ageYears) ||
    ageYears < 18 ||
    ageYears > 94 ||
    !Number.isFinite(signal.resistanceOhm) ||
    signal.resistanceOhm <= 0 ||
    !Number.isFinite(signal.reactanceOhm) ||
    signal.reactanceOhm <= 0
  )
    return null;

  const h2r = heightCm ** 2 / signal.resistanceOhm;
  const h2xc = heightCm ** 2 / signal.reactanceOhm;
  const value =
    -5.22 +
    0.2 * h2r +
    0.005 * h2xc +
    0.08 * weightKg +
    1.9 +
    (sexForEquation === "F" ? 1.86 : 0);
  if (!Number.isFinite(value) || value <= 0) return null;
  return {
    value,
    unit: "L",
    origin: "estimated",
    methodId: "ecw-sergi-1994",
    methodVersion: BIA_CALCULATION_VERSION,
  };
}

/**
 * Banda ECW/TBW 0,36–0,39 per le STIME single-frequency: stessa banda della
 * letteratura clinica BIA già usata come benchmark device nel repo, ma con
 * l'applicabilità dichiarata da stima (Sergi 1994 + Sun 2003), quindi
 * confronto ORIENTATIVO, non equivalente a un output multifrequenza/BIS.
 */
export function ecwTbwEstimatedReference(): BiaMetricReference {
  return {
    kind: "interval",
    low: 0.36,
    high: 0.39,
    label: "Banda clinica 0,36–0,39",
    sourceId: "sf-bia-ecw-tbw-0.360-0.390",
    sourceLabel: "Letteratura clinica BIA (banda 0,36–0,39)",
    applicability:
      "Rapporto STIMATO da equazioni single-frequency (ECW Sergi 1994, TBW Sun 2003): confronto orientativo, non equivalente a un output multifrequenza o BIS.",
    provenance: "guideline",
  };
}

/** Complemento della banda ECW/TBW: ICW/TBW 0,61–0,64, stessa provenienza. */
export function icwTbwEstimatedReference(): BiaMetricReference {
  return {
    kind: "interval",
    low: 0.61,
    high: 0.64,
    label: "Banda clinica 0,61–0,64",
    sourceId: "sf-bia-icw-tbw-0.610-0.640",
    sourceLabel: "Letteratura clinica BIA (complemento di ECW/TBW 0,36–0,39)",
    applicability:
      "Rapporto STIMATO da equazioni single-frequency: confronto orientativo, non equivalente a un output multifrequenza o BIS.",
    provenance: "guideline",
  };
}

/**
 * Deriva i compartimenti mancanti quando TBW ed ECW esistono: ICW = TBW − ECW
 * e i due rapporti. SOLO algebra, mai sovrascrivere un valore del device; se
 * la stima è incoerente (ECW ≥ TBW) non si inventa nulla e si segnala.
 */
export function deriveWaterBalanceMetrics(
  metrics: Record<string, BiaMetric | undefined>,
): BiaQualityFlag | null {
  const tbw = metrics.tbw?.value;
  const ecw = metrics.ecw?.value;
  if (tbw == null || ecw == null) return null;
  if (!(ecw < tbw)) {
    return {
      code: "WATER_BALANCE_INCONSISTENT",
      severity: "warning",
      scope: "composition",
      message:
        "La stima ECW non è inferiore alla TBW: i compartimenti derivati non vengono calcolati.",
    };
  }
  const stimato = metrics.tbw?.origin === "estimated" || metrics.ecw?.origin === "estimated";
  if (!metrics.icw) {
    metrics.icw = {
      value: tbw - ecw,
      unit: "L",
      origin: "estimated",
      methodId: "icw-tbw-minus-ecw",
      methodVersion: BIA_CALCULATION_VERSION,
    };
  }
  if (!metrics.ecwTbwRatio) {
    metrics.ecwTbwRatio = {
      value: ecw / tbw,
      unit: "ratio",
      origin: "estimated",
      methodId: "ecw-tbw-ratio",
      methodVersion: BIA_CALCULATION_VERSION,
      ...(stimato ? { reference: ecwTbwEstimatedReference() } : {}),
    };
  }
  if (!metrics.icwTbwRatio) {
    const icw = metrics.icw?.value;
    if (icw != null) {
      metrics.icwTbwRatio = {
        value: icw / tbw,
        unit: "ratio",
        origin: "estimated",
        methodId: "icw-tbw-ratio",
        methodVersion: BIA_CALCULATION_VERSION,
        ...(stimato ? { reference: icwTbwEstimatedReference() } : {}),
      };
    }
  }
  return null;
}

/**
 * Integra `calculated_results` di una riga `bia_valutazioni` (snake_case, come
 * arriva da PostgREST) con un RICALCOLO DAL VIVO del motore: le metriche
 * introdotte dopo il salvataggio della visita (ECW Sergi, ICW, rapporti)
 * compaiono anche sulle visite storiche SENZA riscrivere il database. Il
 * salvato vince sempre; se il segnale non basta, la riga torna intatta.
 */
export function withLiveBiaRecalc<
  T extends {
    signal_kind?: unknown;
    frequency_khz?: unknown;
    resistance_ohm?: unknown;
    reactance_ohm?: unknown;
    impedance_ohm?: unknown;
    height_cm?: unknown;
    weight_kg?: unknown;
    age_years?: unknown;
    sex_for_equation?: unknown;
    source_type?: unknown;
    measured_at?: unknown;
    reference_profile_id?: unknown;
    calculated_results?: Record<string, unknown> | null;
  },
>(row: T | undefined | null): T | undefined | null {
  if (!row) return row;
  const sex =
    row.sex_for_equation === "M" || row.sex_for_equation === "F"
      ? row.sex_for_equation
      : null;
  const heightCm = Number(row.height_cm);
  const weightKg = Number(row.weight_kg);
  const ageYears = Number(row.age_years);
  const frequencyKhz = Number(row.frequency_khz);
  const reactanceOhm = Number(row.reactance_ohm);
  const resistanceOhm = Number(row.resistance_ohm);
  const impedanceOhm = Number(row.impedance_ohm);
  const kind = row.signal_kind;
  const valutabile =
    sex != null &&
    heightCm > 0 &&
    weightKg > 0 &&
    ageYears > 0 &&
    frequencyKhz > 0 &&
    reactanceOhm > 0 &&
    ((kind === "R_XC" && resistanceOhm > 0) ||
      (kind === "Z_XC" && impedanceOhm > reactanceOhm));
  if (!valutabile) return row;
  try {
    const assessment = createBiaAssessmentV2({
      signal:
        kind === "R_XC"
          ? {
              kind: "R_XC",
              resistanceOhm,
              reactanceOhm,
              frequencyKhz,
              measurementSite: "whole_body",
              source: "manual",
            }
          : {
              kind: "Z_XC",
              impedanceOhm,
              reactanceOhm,
              frequencyKhz,
              measurementSite: "whole_body",
              source: "manual",
            },
      subject: {
        ageYears,
        sexForEquation: sex,
        heightCm,
        weightKg,
        measuredAt: String(row.measured_at ?? ""),
      },
      sourceType: (row.source_type as never) ?? "manual",
      referenceProfileId:
        typeof row.reference_profile_id === "string"
          ? row.reference_profile_id
          : undefined,
    } as never);
    return {
      ...row,
      calculated_results: {
        ...assessment.metrics,
        ...(row.calculated_results ?? {}),
      },
    };
  } catch {
    return row;
  }
}

export function createBiaAssessmentV2(
  input: BiaAssessmentInput,
): BiaAssessmentV2 {
  const normalized = normalizeBiaSignal(input.signal);
  const qualityFlags = [...normalized.qualityFlags];
  const referenceSelection = selectBivaReference({
    sex: input.subject.sexForEquation,
    ageYears: input.subject.ageYears,
    requestedProfileId: input.referenceProfileId,
  });
  const metrics: Record<string, BiaMetric | undefined> = {
    ...(input.deviceMetrics ?? {}),
  };
  let biva: BivaResult | null = null;

  if (normalized.ok) {
    const signal = normalized.signal;
    metrics.resistance = {
      value: signal.resistanceOhm,
      unit: "Ω",
      origin: input.signal.kind === "R_XC" ? "measured" : "estimated",
      methodId:
        input.signal.kind === "R_XC"
          ? "device-signal"
          : "pythagorean-r-from-z-xc",
    };
    metrics.reactance = {
      value: signal.reactanceOhm,
      unit: "Ω",
      origin: "measured",
      methodId: "device-signal",
    };
    metrics.impedance = {
      value: signal.impedanceOhm,
      unit: "Ω",
      origin: input.signal.kind === "Z_XC" ? "measured" : "estimated",
      methodId:
        input.signal.kind === "Z_XC"
          ? "device-signal"
          : "pythagorean-z-from-r-xc",
    };
    metrics.phaseAngle = {
      value: signal.phaseAngleDeg,
      unit: "°",
      origin: "estimated",
      methodId: "atan2-xc-r",
      methodVersion: BIA_CALCULATION_VERSION,
    };

    const composition = calculateSunBodyComposition(signal, input.subject);
    if (composition) {
      for (const [key, metric] of Object.entries(composition)) {
        if (!metrics[key]) metrics[key] = metric;
      }
    } else
      qualityFlags.push({
        code: "SUN_NOT_APPLICABLE",
        severity: "warning",
        scope: "composition",
        message:
          "Le equazioni Sun 2003 non sono applicabili al protocollo o alla popolazione indicata.",
      });

    const muscle = calculateJanssenSkeletalMuscle(signal, input.subject);
    if (muscle) {
      for (const [key, metric] of Object.entries(muscle)) {
        if (!metrics[key]) metrics[key] = metric;
      }
    } else
      qualityFlags.push({
        code: "JANSSEN_NOT_APPLICABLE",
        severity: "warning",
        scope: "composition",
        message:
          "L'equazione Janssen 2000 non è applicabile al protocollo indicato.",
      });

    // Compartimenti idrici: ECW stimata (Sergi 1994) solo se il device non
    // la fornisce, poi ICW e rapporti per ALGEBRA (mai sovrascrivere il
    // device). Il rapporto Na/K NON è derivabile da R/Xc: compare solo
    // quando lo strumento lo fornisce.
    if (!metrics.ecw) {
      const ecw = calculateSergiEcw(signal, input.subject);
      if (ecw) {
        metrics.ecw = ecw;
        // Decisione titolare 09/08/2026 (audit F-001): il gate resta 18–94,
        // ma fuori dalla coorte pubblicata (Sergi 1994: 40 adulti di 21–81
        // anni) la stima viaggia con un avviso esplicito, mai in silenzio.
        if (input.subject.ageYears < 21 || input.subject.ageYears > 81)
          qualityFlags.push({
            code: "SERGI_FUORI_COORTE",
            severity: "warning",
            scope: "composition",
            message:
              "Età fuori dalla coorte di validazione dell'equazione ECW Sergi 1994 (21–81 anni): stima ECW/ICW indicativa.",
          });
      } else
        qualityFlags.push({
          code: "SERGI_NOT_APPLICABLE",
          severity: "info",
          scope: "composition",
          message:
            "L'equazione ECW Sergi 1994 non è applicabile al protocollo o alla popolazione indicata.",
        });
    }
    const waterFlag = deriveWaterBalanceMetrics(metrics);
    if (waterFlag) qualityFlags.push(waterFlag);

    const ffm = metrics.ffm?.value;
    const bmrResult = calcolaBmrConMetodo({
      metodo: input.bmrMethod ?? "Cunningham",
      pesoKg: input.subject.weightKg,
      altezzaCm: input.subject.heightCm,
      etaAnni: input.subject.ageYears,
      sesso: input.subject.sexForEquation,
      ffmKg: ffm,
    });
    metrics.bmr = {
      value: bmrResult.bmr,
      unit: "kcal/die",
      origin: "estimated",
      methodId: `bmr-${input.bmrMethod ?? "Cunningham"}`,
      methodVersion: "energia-core-1",
    };
    if (bmrResult.fallbackFfm)
      qualityFlags.push({
        code: "BMR_FFM_FALLBACK",
        severity: "warning",
        scope: "composition",
        message:
          "Il BMR richiesto richiedeva FFM: è stato applicato il fallback documentato.",
      });

    if (referenceSelection.reference)
      biva = calculateBiva({
        signal,
        heightCm: input.subject.heightCm,
        reference: referenceSelection.reference,
      });
    if (!biva)
      qualityFlags.push({
        code: "BIVA_NOT_APPLICABLE",
        severity: "warning",
        scope: "biva",
        message: referenceSelection.reason,
      });
  }

  const interpretation: string[] = [];
  if (biva) interpretation.push(buildBivaInterpretation(biva));
  if (metrics.ffm && metrics.fm)
    interpretation.push(
      `Composizione stimata con Sun 2003: FFM ${metrics.ffm.value.toFixed(1)} kg e FM ${metrics.fm.value.toFixed(1)} kg (${metrics.fmPercent?.value.toFixed(1)}%).`,
    );
  if (metrics.skeletalMuscleMass)
    interpretation.push(
      `Massa muscolare scheletrica stimata con Janssen 2000: ${metrics.skeletalMuscleMass.value.toFixed(1)} kg; indice SMI ${metrics.skeletalMuscleIndex?.value.toFixed(1)} kg/m². Non è ASMI/DXA.`,
    );
  if (qualityFlags.some((flag) => flag.code === "SERGI_FUORI_COORTE"))
    interpretation.push(
      "L'età è fuori dalla coorte di validazione dell'equazione ECW Sergi 1994 (21–81 anni): i volumi ECW/ICW stimati e i rapporti derivati vanno letti come indicativi.",
    );

  return {
    schemaVersion: BIA_SCHEMA_VERSION,
    calculationVersion: BIA_CALCULATION_VERSION,
    interpretationVersion: BIA_INTERPRETATION_VERSION,
    subject: input.subject,
    signal: normalized.ok ? normalized.signal : null,
    metrics,
    biva,
    referenceSelection,
    qualityFlags,
    interpretation,
    provenance: {
      device: input.device,
      sourceDocumentHash: input.sourceDocumentHash,
    },
  };
}

export type BiaChartSpec =
  | {
      kind: "biva";
      title: string;
      reference: BivaReferenceProfile;
      visits: Array<{
        id: string;
        date: string;
        rH: number;
        xcH: number;
        current?: boolean;
        zone?: BivaResult["zone"];
        phenotype?: BivaPhenotype;
        mahalanobisSquared?: number;
        ellipsePercentile?: number;
      }>;
      ellipses: BivaEllipse[];
    }
  | {
      /** Coordinate R/H–Xc/H visibili, ma senza classificazione non validata. */
      kind: "raw_vector";
      title: string;
      reason: string;
      visits: Array<{
        id: string;
        date: string;
        rH: number;
        xcH: number;
        current?: boolean;
      }>;
    }
  | {
      kind: "reference_bands";
      title: string;
      visitId: string;
      bands: BivaReferenceBand[];
    }
  | {
      kind: "timeseries";
      title: string;
      unit: string;
      series: Array<{
        key: string;
        label: string;
        methodId?: string;
        points: Array<{ visitId: string; date: string; value: number | null }>;
      }>;
    }
  | {
      kind: "dumbbell";
      title: string;
      unit: string;
      rows: Array<{ label: string; left: number | null; right: number | null }>;
    }
  | {
      kind: "metric_references";
      title: string;
      visitId: string;
      metrics: Array<{
        key: string;
        label: string;
        value: number;
        unit: string;
        reference: BiaMetricReference;
        personalRange?: { low: number; high: number; count: number };
      }>;
    };

export interface BiaReportVisit {
  id: string;
  date: string;
  assessment: BiaAssessmentV2 | null;
  metrics: Record<string, BiaMetric | undefined>;
  source: string;
  device?: Record<string, unknown>;
  protocol?: Record<string, unknown>;
  qualityFlags: BiaQualityFlag[];
  segmental?: Record<string, unknown>;
  note?: string;
}

export interface BiaReportModel {
  version: "bia-report-2";
  scope: "single" | "longitudinal";
  generatedAt: string;
  patient: { id: string; displayName: string; birthDate?: string };
  practice: {
    displayName: string;
    professionalName?: string;
    identity?: {
      structureName: string;
      professionalName: string | null;
      qualification: string | null;
      addressLines: string[];
      contacts: Array<{
        kind: "phone" | "email" | "website";
        label: string;
        value: string;
      }>;
      registration: string | null;
      vatNumber: string | null;
    };
  };
  visits: BiaReportVisit[];
  charts: BiaChartSpec[];
  methods: Array<{ id: string; label: string; sourceUrl?: string }>;
}
