/**
 * Intervalli di riferimento per la massa grassa percentuale.
 *
 * FONTE PUBBLICATA E NOMINATA, mai valori inventati dal codice:
 * Gallagher D. et al., "Healthy percentage body fat ranges: an approach for
 * developing guidelines based on body mass index", Am J Clin Nutr 2000;
 * 72(3):694-701. Fasce «healthy» per sesso ed eta' (adulti 20-79 anni,
 * coorte multietnica; qui si usano le fasce complessive dello studio).
 *
 * Il riferimento e' ORIENTATIVO: la scelta della fonte resta del titolare e
 * ogni consumatore deve mostrare l'etichetta della fonte accanto al numero.
 * Fuori copertura (eta' <20 o >=80, sesso non binario o assente) si risponde
 * null: nessun range e' meglio di un range sbagliato.
 */

export interface FatPercentReference {
  low: number;
  high: number;
  /** Es. «8–19% (uomini 20–39 anni)». */
  label: string;
  /** Citazione breve da mostrare SEMPRE accanto al giudizio. */
  source: string;
}

const FONTE = "Gallagher 2000, Am J Clin Nutr";

const FASCE: Record<"M" | "F", Array<{ min: number; max: number; low: number; high: number }>> = {
  M: [
    { min: 20, max: 39, low: 8, high: 19 },
    { min: 40, max: 59, low: 11, high: 21 },
    { min: 60, max: 79, low: 13, high: 24 },
  ],
  F: [
    { min: 20, max: 39, low: 21, high: 32 },
    { min: 40, max: 59, low: 23, high: 33 },
    { min: 60, max: 79, low: 24, high: 35 },
  ],
};

export function fatPercentReference(
  sex: "M" | "F" | string | null | undefined,
  ageYears: number | null | undefined,
): FatPercentReference | null {
  if (sex !== "M" && sex !== "F") return null;
  if (
    ageYears == null ||
    !Number.isFinite(ageYears) ||
    ageYears < 20 ||
    ageYears > 79
  )
    return null;
  const fascia = FASCE[sex].find(
    (f) => ageYears >= f.min && ageYears <= f.max,
  );
  if (!fascia) return null;
  const chi = sex === "M" ? "uomini" : "donne";
  return {
    low: fascia.low,
    high: fascia.high,
    label: `${fascia.low}–${fascia.high}% (${chi} ${fascia.min}–${fascia.max} anni)`,
    source: FONTE,
  };
}

/** Posizione del valore rispetto al riferimento; null se non valutabile. */
export function classifyFatPercent(
  value: number | null | undefined,
  reference: FatPercentReference | null,
): "sotto" | "dentro" | "sopra" | null {
  if (value == null || !Number.isFinite(value) || !reference) return null;
  if (value < reference.low) return "sotto";
  if (value > reference.high) return "sopra";
  return "dentro";
}
