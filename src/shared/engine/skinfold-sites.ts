/**
 * Fonte unica: quali pliche richiede ogni equazione di densita' corporea.
 *
 * Prima di questo modulo la mappa formula -> pliche era duplicata in tre punti
 * con tre vocabolari diversi (chiavi di AntropometriaState, chiavi piatte dei
 * calcolatori doctor, chiavi di PlicometriaInput). Qui i tre vocabolari sono
 * allineati riga per riga, cosi' non possono piu' divergere.
 *
 * Modulo puro: nessun React, nessun DB.
 */

import type { PlicometriaInput, SkinfoldFormulaStrict } from "./plicometria";

export type EqDensitaPliche =
  | "JacksonPollock3"
  | "JacksonPollock4"
  | "JacksonPollock7"
  | "DurninWomersley";

/** Chiavi plica nello stato visita (allineate alle ancore degli omini). */
export type SkinfoldStateKey =
  | "plicaTricipite"
  | "plicaBicipite"
  | "plicaPettorale"
  | "plicaAscellare"
  | "plicaSottoscapolare"
  | "plicaAddominale"
  | "plicaSovrailiaca"
  | "plicaAnterioreCoscia"
  | "plicaPosterioreCoscia"
  | "plicaInternoCoscia"
  | "plicaSopraPatellare"
  | "plicaPolpaccio";

/** Vocabolario dei calcolatori doctor (`PlicometriaInput` in apps/doctor/lib/calculators.ts). */
export type SkinfoldSite =
  | "tricipite"
  | "bicipite"
  | "pettorale"
  | "ascellare"
  | "sottoscapolare"
  | "addominale"
  | "sovrailiaca"
  | "coscia"
  | "polpaccio";

/** Vocabolario del motore strict in questo package (`petto`/`addome`, non `pettorale`/`addominale`). */
export type SkinfoldStrictKey = Exclude<keyof PlicometriaInput, "formula">;

export interface SkinfoldSiteDefinition {
  /** Chiave in AntropometriaState, es. "plicaAnterioreCoscia". */
  stateKey: SkinfoldStateKey;
  /** Chiave nei calcolatori doctor, `null` se il sito non entra in nessuna equazione. */
  site: SkinfoldSite | null;
  /** Chiave nel motore strict, `null` se il sito non entra in nessuna equazione di densita'. */
  strictKey: SkinfoldStrictKey | null;
  /** Etichetta UI, identica a quella storica delle righe di antropometria. */
  label: string;
}

/**
 * Tutte e 12 le pliche dello stato, nell'ordine in cui la scheda le ha sempre mostrate.
 *
 * Include anche i siti che nessuna equazione usa: e' voluto. Un solo array guida
 * sia le righe richieste dalla formula sia il complemento "Altre pliche", quindi
 * le due liste non possono divergere ne' perdere un sito per strada.
 *
 * `plicaPolpaccio` ha `site` ma non `strictKey`: serve al somatotipo Heath-Carter
 * e non a nessuna equazione di densita'.
 */
export const SKINFOLD_SITES = [
  {
    stateKey: "plicaTricipite",
    site: "tricipite",
    strictKey: "tricipite",
    label: "Tricipitale",
  },
  {
    stateKey: "plicaBicipite",
    site: "bicipite",
    strictKey: "bicipite",
    label: "Bicipitale",
  },
  {
    stateKey: "plicaPettorale",
    site: "pettorale",
    strictKey: "petto",
    label: "Pettorale",
  },
  {
    stateKey: "plicaAscellare",
    site: "ascellare",
    strictKey: "ascellare",
    label: "Ascellare",
  },
  {
    stateKey: "plicaSottoscapolare",
    site: "sottoscapolare",
    strictKey: "sottoscapolare",
    label: "Sottoscapolare",
  },
  {
    stateKey: "plicaAddominale",
    site: "addominale",
    strictKey: "addome",
    label: "Addominale",
  },
  {
    stateKey: "plicaSovrailiaca",
    site: "sovrailiaca",
    strictKey: "sovrailiaca",
    label: "Sovrailiaca",
  },
  {
    stateKey: "plicaAnterioreCoscia",
    site: "coscia",
    strictKey: "coscia",
    label: "Anteriore coscia",
  },
  {
    stateKey: "plicaPosterioreCoscia",
    site: null,
    strictKey: null,
    label: "Posteriore coscia",
  },
  {
    stateKey: "plicaInternoCoscia",
    site: null,
    strictKey: null,
    label: "Interno coscia",
  },
  {
    stateKey: "plicaSopraPatellare",
    site: null,
    strictKey: null,
    label: "Sopra patellare",
  },
  {
    stateKey: "plicaPolpaccio",
    site: "polpaccio",
    strictKey: null,
    label: "Polpaccio",
  },
] as const satisfies readonly SkinfoldSiteDefinition[];

/**
 * Guardia di compilazione: se un giorno si aggiunge una plica ad
 * AntropometriaState senza registrarla qui sopra, questa riga non compila
 * (invece di far sparire silenziosamente il campo dalla scheda).
 */
type SkinfoldSitesNonCoperti = Exclude<
  SkinfoldStateKey,
  (typeof SKINFOLD_SITES)[number]["stateKey"]
>;
const _skinfoldSitesCoverage: SkinfoldSitesNonCoperti extends never
  ? true
  : never = true;
void _skinfoldSitesCoverage;

export const SKINFOLD_SITE_LABELS = Object.fromEntries(
  SKINFOLD_SITES.filter((definition) => definition.site != null).map(
    (definition) => [definition.site, definition.label],
  ),
) as Record<SkinfoldSite, string>;

export function skinfoldSiteLabel(site: SkinfoldSite): string {
  return SKINFOLD_SITE_LABELS[site] ?? site;
}

/**
 * Pliche richieste da ogni equazione, per sesso.
 *
 * Solo JP3 cambia fra uomo e donna; le altre usano gli stessi siti e cambiano
 * i coefficienti. I set devono restare allineati a `calcolaPlicometriaStrict`
 * in ./plicometria.ts — il test in skinfold-sites.test.ts lo verifica sito per sito.
 */
export const SKINFOLD_FORMULA_SITES: Record<
  SkinfoldFormulaStrict,
  { M: readonly SkinfoldSite[]; F: readonly SkinfoldSite[] }
> = {
  JP3: {
    M: ["pettorale", "addominale", "coscia"],
    F: ["tricipite", "sovrailiaca", "coscia"],
  },
  JP4: {
    M: ["tricipite", "addominale", "sovrailiaca", "coscia"],
    F: ["tricipite", "addominale", "sovrailiaca", "coscia"],
  },
  JP7: {
    M: [
      "pettorale",
      "ascellare",
      "tricipite",
      "sottoscapolare",
      "addominale",
      "sovrailiaca",
      "coscia",
    ],
    F: [
      "pettorale",
      "ascellare",
      "tricipite",
      "sottoscapolare",
      "addominale",
      "sovrailiaca",
      "coscia",
    ],
  },
  DW4: {
    M: ["bicipite", "tricipite", "sottoscapolare", "sovrailiaca"],
    F: ["bicipite", "tricipite", "sottoscapolare", "sovrailiaca"],
  },
};

/**
 * Finestre di eta' di validita', come le applica `calcolaPlicometriaStrict`.
 * DW4 e' l'unica ad ampio raggio: le Jackson-Pollock (JP4 inclusa) si fermano
 * a 55 anni per le donne e 61 per gli uomini.
 */
export const SKINFOLD_AGE_RANGE: Record<
  SkinfoldFormulaStrict,
  { M: readonly [number, number]; F: readonly [number, number] }
> = {
  JP3: { M: [18, 61], F: [18, 55] },
  JP4: { M: [18, 61], F: [18, 55] },
  JP7: { M: [18, 61], F: [18, 55] },
  DW4: { M: [17, 72], F: [17, 72] },
};

/** Ponte fra l'enum salvato nello stato e il motore strict. */
export const EQ_DENSITA_TO_STRICT: Record<
  EqDensitaPliche,
  SkinfoldFormulaStrict
> = {
  JacksonPollock3: "JP3",
  JacksonPollock4: "JP4",
  JacksonPollock7: "JP7",
  DurninWomersley: "DW4",
};

export interface EqDensitaOption {
  value: EqDensitaPliche;
  label: string;
  hint: string;
}

/** Opzioni del selettore, nell'ordine in cui vanno mostrate. */
export const EQ_DENSITA_OPTIONS = [
  {
    value: "JacksonPollock3",
    label: "Jackson & Pollock (3 pliche)",
    hint: "Siti diversi fra uomo e donna",
  },
  {
    value: "JacksonPollock4",
    label: "Jackson & Pollock (4 pliche)",
    hint: "Donne: equazione Jackson-Pollock-Ward",
  },
  {
    value: "JacksonPollock7",
    label: "Jackson & Pollock (7 pliche)",
    hint: "La più completa, richiede 7 siti",
  },
  {
    value: "DurninWomersley",
    label: "Durnin & Womersley (4 pliche)",
    hint: "L'unica validata da 17 a 72 anni",
  },
] as const satisfies readonly EqDensitaOption[];

/** Stessa guardia di copertura, sulle opzioni del selettore. */
type EqDensitaNonCoperte = Exclude<
  EqDensitaPliche,
  (typeof EQ_DENSITA_OPTIONS)[number]["value"]
>;
const _eqDensitaCoverage: EqDensitaNonCoperte extends never ? true : never =
  true;
void _eqDensitaCoverage;

export function eqDensitaOption(value: EqDensitaPliche): EqDensitaOption {
  return (
    EQ_DENSITA_OPTIONS.find((option) => option.value === value) ??
    EQ_DENSITA_OPTIONS[0]
  );
}

/** Pliche richieste dalla formula per un sesso noto. */
export function skinfoldSitesFor(
  formula: SkinfoldFormulaStrict,
  sesso: "M" | "F",
): readonly SkinfoldSite[] {
  return SKINFOLD_FORMULA_SITES[formula][sesso];
}

/**
 * Unione dei siti maschili e femminili.
 * Serve quando il sesso non e' in anagrafica: mostrare il set maschile a una
 * paziente sarebbe peggio che mostrarne uno in piu'.
 */
export function skinfoldSitesForAnySex(
  formula: SkinfoldFormulaStrict,
): readonly SkinfoldSite[] {
  const union = new Set<SkinfoldSite>([
    ...SKINFOLD_FORMULA_SITES[formula].M,
    ...SKINFOLD_FORMULA_SITES[formula].F,
  ]);
  return SKINFOLD_SITES.map((definition) => definition.site).filter(
    (site): site is SkinfoldSite => site != null && union.has(site),
  );
}

/**
 * Definizioni richieste dalla formula, sempre nell'ordine canonico di
 * SKINFOLD_SITES (non nell'ordine in cui l'equazione elenca i siti): la scheda
 * resta prevedibile al cambio di formula.
 */
export function skinfoldDefinitionsFor(
  formula: SkinfoldFormulaStrict,
  sesso: "M" | "F" | null,
): readonly SkinfoldSiteDefinition[] {
  const sites = new Set<SkinfoldSite>(
    sesso ? skinfoldSitesFor(formula, sesso) : skinfoldSitesForAnySex(formula),
  );
  return SKINFOLD_SITES.filter(
    (definition) => definition.site != null && sites.has(definition.site),
  );
}

/** Chiavi di stato richieste dalla formula (per evidenziazione e validazione). */
export function skinfoldStateKeysFor(
  formula: SkinfoldFormulaStrict,
  sesso: "M" | "F" | null,
): readonly SkinfoldStateKey[] {
  return skinfoldDefinitionsFor(formula, sesso).map(
    (definition) => definition.stateKey,
  );
}

/**
 * Divide le 12 pliche in "richieste dalla formula" e "tutte le altre".
 * I due elenchi sono complementari per costruzione.
 */
export function partitionSkinfoldSites(
  formula: SkinfoldFormulaStrict,
  sesso: "M" | "F" | null,
): {
  required: readonly SkinfoldSiteDefinition[];
  other: readonly SkinfoldSiteDefinition[];
} {
  const required = skinfoldDefinitionsFor(formula, sesso);
  const requiredKeys = new Set<SkinfoldStateKey>(
    required.map((definition) => definition.stateKey),
  );
  return {
    required,
    other: SKINFOLD_SITES.filter(
      (definition) => !requiredKeys.has(definition.stateKey),
    ),
  };
}

/** Perche' la plicometria non produce un risultato. */
export type SkinfoldBlockReason =
  | { kind: "sesso-mancante" }
  | { kind: "eta-mancante" }
  | { kind: "eta-fuori-range"; min: number; max: number; eta: number }
  | { kind: "pliche-mancanti"; missing: readonly SkinfoldSite[] }
  | { kind: "risultato-non-fisiologico" };

/**
 * Traduce il `null` di `calcolaPlicometriaStrict` nel motivo specifico.
 *
 * I controlli sono nello stesso ordine del motore (sesso -> eta' -> finestra di
 * validita' -> pliche presenti -> clamp fisiologico 2-60%), altrimenti il
 * messaggio mostrato non corrisponderebbe alla causa reale.
 */
export function explainSkinfoldResult(input: {
  formula: SkinfoldFormulaStrict;
  sesso: "M" | "F" | null;
  eta: number;
  values: Partial<Record<SkinfoldSite, number | null | undefined>>;
  /** `true` se il calcolo ha prodotto un risultato. */
  computed: boolean;
  /**
   * Deve corrispondere all'opzione passata a `calcolaPlicometriaStrict`. Con
   * `"calcola"` l'eta' fuori finestra non e' piu' un motivo di blocco — il
   * numero esce lo stesso — ma resta da dichiarare come non validata, e a
   * dirlo e' `PlicometriaStrictResult.fuoriValidita`. Se questa opzione non
   * seguisse il motore, la scheda mostrerebbe insieme il risultato e il
   * cartello che spiega perche' il risultato non c'e'.
   */
  fuoriValidita?: "rifiuta" | "calcola";
}): SkinfoldBlockReason | null {
  if (!input.sesso) return { kind: "sesso-mancante" };
  if (!Number.isFinite(input.eta) || input.eta <= 0)
    return { kind: "eta-mancante" };

  const [min, max] = SKINFOLD_AGE_RANGE[input.formula][input.sesso];
  if (
    input.fuoriValidita !== "calcola" &&
    (input.eta < min || input.eta > max)
  )
    return { kind: "eta-fuori-range", min, max, eta: input.eta };

  const missing = skinfoldSitesFor(input.formula, input.sesso).filter((site) => {
    const value = input.values[site];
    return typeof value !== "number" || !Number.isFinite(value) || value <= 0;
  });
  if (missing.length > 0) return { kind: "pliche-mancanti", missing };

  if (!input.computed) return { kind: "risultato-non-fisiologico" };
  return null;
}
