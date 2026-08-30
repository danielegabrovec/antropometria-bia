/**
 * Contratto condiviso dei parametri BIA e delle relative bande di riferimento.
 *
 * Una banda non e' implicita nel nome del parametro: deve sempre dichiarare
 * provenienza e applicabilita'. In questo modo un range del dispositivo non
 * viene presentato come soglia clinica universale.
 */

export type BiaMetricGroup =
  | "signal"
  | "water"
  | "composition"
  | "cellular"
  | "muscle"
  | "metabolism";

export interface BiaMetricDefinition {
  key: string;
  label: string;
  shortLabel: string;
  unit: string;
  group: BiaMetricGroup;
  precision: number;
}

export const BIA_METRIC_DEFINITIONS = [
  {
    key: "weight",
    label: "Peso",
    shortLabel: "Peso",
    unit: "kg",
    group: "composition",
    precision: 1,
  },
  {
    key: "height",
    label: "Altezza",
    shortLabel: "Altezza",
    unit: "cm",
    group: "composition",
    precision: 1,
  },
  {
    key: "impedance",
    label: "Impedenza",
    shortLabel: "Z",
    unit: "Ω",
    group: "signal",
    precision: 1,
  },
  {
    key: "resistance",
    label: "Resistenza",
    shortLabel: "R",
    unit: "Ω",
    group: "signal",
    precision: 1,
  },
  {
    key: "reactance",
    label: "Reattanza",
    shortLabel: "Xc",
    unit: "Ω",
    group: "signal",
    precision: 1,
  },
  {
    key: "phaseAngle",
    label: "Angolo di fase",
    shortLabel: "PhA",
    unit: "°",
    group: "signal",
    precision: 2,
  },
  {
    key: "fm",
    label: "Massa grassa",
    shortLabel: "FM",
    unit: "kg",
    group: "composition",
    precision: 1,
  },
  {
    key: "fmPercent",
    label: "Massa grassa percentuale",
    shortLabel: "FM",
    unit: "%",
    group: "composition",
    precision: 1,
  },
  {
    key: "ffm",
    label: "Massa priva di grasso",
    shortLabel: "FFM",
    unit: "kg",
    group: "composition",
    precision: 1,
  },
  {
    key: "muscleMass",
    label: "Massa muscolare",
    shortLabel: "Muscolo",
    unit: "kg",
    group: "muscle",
    precision: 1,
  },
  {
    key: "tbw",
    label: "Acqua corporea totale",
    shortLabel: "TBW",
    unit: "L",
    group: "water",
    precision: 1,
  },
  {
    key: "icw",
    label: "Acqua intracellulare",
    shortLabel: "ICW",
    unit: "L",
    group: "water",
    precision: 1,
  },
  {
    key: "ecw",
    label: "Acqua extracellulare",
    shortLabel: "ECW",
    unit: "L",
    group: "water",
    precision: 1,
  },
  {
    key: "ecwTbwRatio",
    label: "Rapporto ECW/TBW",
    shortLabel: "ECW/TBW",
    unit: "ratio",
    group: "water",
    precision: 3,
  },
  {
    key: "icwTbwRatio",
    label: "Rapporto ICW/TBW",
    shortLabel: "ICW/TBW",
    unit: "ratio",
    group: "water",
    precision: 3,
  },
  {
    key: "sodiumPotassiumRatio",
    label: "Rapporto sodio/potassio scambiabile",
    shortLabel: "Na/K",
    unit: "ratio",
    group: "cellular",
    precision: 2,
  },
  {
    key: "bodyCellMass",
    label: "Massa cellulare corporea",
    shortLabel: "BCM",
    unit: "kg",
    group: "cellular",
    precision: 1,
  },
  {
    key: "extracellularMass",
    label: "Massa extracellulare",
    shortLabel: "ECM",
    unit: "kg",
    group: "cellular",
    precision: 1,
  },
  {
    key: "ecmBcmRatio",
    label: "Rapporto ECM/BCM",
    shortLabel: "ECM/BCM",
    unit: "ratio",
    group: "cellular",
    precision: 2,
  },
  {
    key: "proteinMass",
    label: "Proteine",
    shortLabel: "Proteine",
    unit: "kg",
    group: "composition",
    precision: 1,
  },
  {
    key: "mineralMass",
    label: "Minerali",
    shortLabel: "Minerali",
    unit: "kg",
    group: "composition",
    precision: 1,
  },
  {
    key: "boneMass",
    label: "Massa ossea",
    shortLabel: "Massa ossea",
    unit: "kg",
    group: "composition",
    precision: 1,
  },
  {
    key: "skeletalMuscleMass",
    label: "Massa muscolare scheletrica",
    shortLabel: "SMM",
    unit: "kg",
    group: "muscle",
    precision: 1,
  },
  {
    key: "skeletalMuscleIndex",
    label: "Indice muscolare scheletrico",
    shortLabel: "SMI",
    unit: "kg/m²",
    group: "muscle",
    precision: 2,
  },
  {
    key: "asmi",
    label: "Indice muscolare appendicolare device",
    shortLabel: "ASMI",
    unit: "%",
    group: "muscle",
    precision: 2,
  },
  {
    key: "ffmi",
    label: "Indice di massa priva di grasso",
    shortLabel: "FFMI",
    unit: "kg/m²",
    group: "composition",
    precision: 2,
  },
  {
    key: "fmi",
    label: "Indice di massa grassa",
    shortLabel: "FMI",
    unit: "kg/m²",
    group: "composition",
    precision: 2,
  },
  {
    key: "visceralFatMass",
    label: "Grasso viscerale",
    shortLabel: "VAT",
    unit: "kg",
    group: "composition",
    precision: 1,
  },
  {
    key: "visceralFatLevel",
    label: "Punteggio grasso viscerale",
    shortLabel: "Viscerale",
    unit: "",
    group: "composition",
    precision: 0,
  },
  {
    key: "subcutaneousFatMass",
    label: "Massa grassa sottocutanea",
    shortLabel: "SAT",
    unit: "kg",
    group: "composition",
    precision: 1,
  },
  {
    key: "waistHipRatio",
    label: "Rapporto vita/fianchi",
    shortLabel: "WHR",
    unit: "ratio",
    group: "composition",
    precision: 2,
  },
  {
    key: "bmr",
    label: "Metabolismo basale",
    shortLabel: "BMR",
    unit: "kcal/die",
    group: "metabolism",
    precision: 0,
  },
  {
    key: "metabolicAge",
    label: "Eta metabolica",
    shortLabel: "Eta metabolica",
    unit: "anni",
    group: "metabolism",
    precision: 0,
  },
] as const satisfies readonly BiaMetricDefinition[];

export type BiaCanonicalMetricKey =
  (typeof BIA_METRIC_DEFINITIONS)[number]["key"];

const BIA_METRIC_BY_KEY = new Map<string, BiaMetricDefinition>(
  BIA_METRIC_DEFINITIONS.map((definition) => [definition.key, definition]),
);

export function getBiaMetricDefinition(key: string): BiaMetricDefinition {
  return (
    BIA_METRIC_BY_KEY.get(key) ?? {
      key,
      label: key,
      shortLabel: key,
      unit: "",
      group: "composition",
      precision: 2,
    }
  );
}

export type BiaMetricReferenceKind =
  | "interval"
  | "minimum"
  | "maximum"
  | "unclassified";

export type BiaMetricReferenceProvenance =
  | "device"
  | "cohort"
  | "guideline"
  | "derived";

export interface BiaMetricReference {
  kind: BiaMetricReferenceKind;
  low?: number;
  high?: number;
  label: string;
  sourceId: string;
  sourceLabel: string;
  applicability: string;
  provenance: BiaMetricReferenceProvenance;
}

export type BiaMetricReferenceStatus =
  | "within"
  | "below"
  | "above"
  | "unclassified";

export function classifyBiaMetricReference(
  value: number,
  reference: BiaMetricReference | undefined,
): BiaMetricReferenceStatus {
  if (!reference || reference.kind === "unclassified") return "unclassified";
  if (reference.low != null && value < reference.low) return "below";
  if (reference.high != null && value > reference.high) return "above";
  return "within";
}

/**
 * Benchmark di distribuzione idrica riportato dai produttori MF-BIA/BIS.
 * Non viene applicato ai volumi assoluti ICW/ECW e non e' una diagnosi.
 */
export function ecwTbwDeviceBenchmarkReference(
  source: "accuniq" | "inbody" = "accuniq",
): BiaMetricReference {
  return {
    kind: "interval",
    low: 0.36,
    high: 0.39,
    label: "Fascia di equilibrio idrico del dispositivo",
    sourceId:
      source === "accuniq"
        ? "accuniq-ecw-tbw-0.360-0.390"
        : "inbody-ecw-tbw-0.360-0.390",
    sourceLabel:
      source === "accuniq"
        ? "ACCUNIQ Body Water Analysis"
        : "InBody Result Interpretation",
    applicability:
      "Solo output ECW/TBW di dispositivi multifrequenza o BIS comparabili e acquisiti in condizioni standardizzate.",
    provenance: "device",
  };
}

export function unclassifiedBiaReference(key: string): BiaMetricReference {
  const definition = getBiaMetricDefinition(key);
  return {
    kind: "unclassified",
    label: "Nessun intervallo universale applicabile",
    sourceId: "not-universally-classified",
    sourceLabel:
      "Interpretazione dipendente da device, protocollo e popolazione",
    applicability: `${definition.label}: usare il range documentato dal dispositivo/coorte e confrontare longitudinalmente con lo stesso protocollo.`,
    provenance: "derived",
  };
}
