/**
 * Modulo condiviso per il calcolo del dispendio energetico (BMR + TDEE).
 *
 * Formule supportate:
 *  - Harris-Benedict (1919, riv. 1984) — classico, peso/altezza/età/sesso
 *  - Mifflin-St Jeor (1990)           — moderno, peso/altezza/età/sesso
 *  - Katch-McArdle (1992)             — 370 + 21.6 × FFM (richiede massa magra)
 *  - Cunningham (1991)                — 500 + 22 × FFM (per atleti)
 *
 * Condiviso tra app `doctor` e `patient` (prima della condivisione, le formule
 * erano duplicate inline in apps/doctor/lib/calculators.ts e in vari pannelli).
 */

export type SessoNorm = "M" | "F";

export type MetodoBmr = "HarrisBenedict" | "MifflinStJeor" | "KatchMcArdle" | "Cunningham";

export type SessoInput = SessoNorm | "Altro" | string | null | undefined;

/** Normalizza il sesso fisiologico richiesto dalle equazioni, senza fallback silenziosi. */
export function normalizzaSesso(sesso: SessoInput): SessoNorm | null {
  const s = (sesso ?? "").toString().toLowerCase().trim();
  if (s.startsWith("f") || s === "femmina" || s === "donna") return "F";
  if (s.startsWith("m") || s === "maschio" || s === "uomo") return "M";
  return null;
}

/** Età anagrafica alla data di riferimento (default oggi). 0 se data non valida. */
export function calcolaEta(dataNascita: string | null | undefined, riferimento: Date = new Date()): number {
  if (!dataNascita) return 0;
  const nascita = new Date(dataNascita);
  if (Number.isNaN(nascita.getTime())) return 0;
  let eta = riferimento.getFullYear() - nascita.getFullYear();
  const m = riferimento.getMonth() - nascita.getMonth();
  if (m < 0 || (m === 0 && riferimento.getDate() < nascita.getDate())) eta--;
  return Math.max(0, eta);
}

/** BMR Harris-Benedict (revisione 1984). */
export function calcolaHarrisBenedictBmr(
  pesoKg: number,
  altezzaCm: number,
  etaAnni: number,
  sesso: SessoInput,
): number {
  if (pesoKg <= 0 || altezzaCm <= 0 || etaAnni <= 0) return 0;
  const sessoNorm = normalizzaSesso(sesso);
  if (!sessoNorm) return 0;
  return sessoNorm === "F"
    ? 447.593 + 9.247 * pesoKg + 3.098 * altezzaCm - 4.33 * etaAnni
    : 88.362 + 13.397 * pesoKg + 4.799 * altezzaCm - 5.677 * etaAnni;
}

/** BMR Mifflin-St Jeor (1990). Default moderno. */
export function calcolaMifflinStJeorBmr(
  pesoKg: number,
  altezzaCm: number,
  etaAnni: number,
  sesso: SessoInput,
): number {
  if (pesoKg <= 0 || altezzaCm <= 0 || etaAnni <= 0) return 0;
  const sessoNorm = normalizzaSesso(sesso);
  if (!sessoNorm) return 0;
  return sessoNorm === "F"
    ? 10 * pesoKg + 6.25 * altezzaCm - 5 * etaAnni - 161
    : 10 * pesoKg + 6.25 * altezzaCm - 5 * etaAnni + 5;
}

/** BMR Katch-McArdle (1992): 370 + 21.6 × FFM. Più accurato per alta % grassa. */
export function calcolaKatchMcArdleBmr(ffmKg: number): number {
  if (ffmKg <= 0) return 0;
  return 370 + 21.6 * ffmKg;
}

/** BMR Cunningham (1991): 500 + 22 × FFM. Per atleti. */
export function calcolaCunninghamBmr(ffmKg: number): number {
  if (ffmKg <= 0) return 0;
  return 500 + 22 * ffmKg;
}

/** TDEE = BMR × fattore di attività (LAF). */
export function calcolaTdee(bmr: number, fattoreAttivita: number): number {
  if (bmr <= 0 || fattoreAttivita <= 0) return 0;
  return bmr * fattoreAttivita;
}

/**
 * Calcolo BMR unificato con metodo selezionabile e fallback automatico:
 *  - Per Katch-McArdle / Cunningham (FFM-based): se ffm mancante o ≤ 0,
 *    cade su Mifflin-St Jeor con gli stessi dati.
 *  - Per Harris / Mifflin: richiede peso + altezza + età.
 *
 * Ritorna { bmr, ffMUsato, fallbackFfm } così il caller può mostrare
 * all'utente quale formula è stata effettivamente applicata.
 */
export function calcolaBmrConMetodo(input: {
  metodo: MetodoBmr;
  pesoKg: number | null;
  altezzaCm: number | null;
  etaAnni: number;
  sesso: SessoInput;
  ffmKg?: number | null;
}): { bmr: number; ffMUsato: number | null; fallbackFfm: boolean } {
  const { metodo, pesoKg, altezzaCm, etaAnni, sesso } = input;
  const ffmKg = input.ffmKg ?? null;
  const needsFfm = metodo === "KatchMcArdle" || metodo === "Cunningham";
  const ffmMancante = !ffmKg || ffmKg <= 0;

  // Fallback a Mifflin se la formula FFM-based non ha dati
  if (needsFfm && ffmMancante) {
    const bmr = pesoKg && altezzaCm && etaAnni > 0
      ? calcolaMifflinStJeorBmr(pesoKg, altezzaCm, etaAnni, sesso)
      : 0;
    return { bmr, ffMUsato: ffmKg, fallbackFfm: true };
  }

  if (metodo === "KatchMcArdle") {
    return { bmr: calcolaKatchMcArdleBmr(ffmKg!), ffMUsato: ffmKg, fallbackFfm: false };
  }
  if (metodo === "Cunningham") {
    return { bmr: calcolaCunninghamBmr(ffmKg!), ffMUsato: ffmKg, fallbackFfm: false };
  }
  if (metodo === "HarrisBenedict") {
    const bmr = pesoKg && altezzaCm && etaAnni > 0
      ? calcolaHarrisBenedictBmr(pesoKg, altezzaCm, etaAnni, sesso)
      : 0;
    return { bmr, ffMUsato: ffmKg, fallbackFfm: false };
  }
  // MifflinStJeor (default)
  const bmr = pesoKg && altezzaCm && etaAnni > 0
    ? calcolaMifflinStJeorBmr(pesoKg, altezzaCm, etaAnni, sesso)
    : 0;
  return { bmr, ffMUsato: ffmKg, fallbackFfm: false };
}

/**
 * Fattori di attività (LAF) standard WHO/ACSM per il calcolo del TDEE.
 */
export const ATTIVITA_FISICA: ReadonlyArray<{
  value: number;
  label: string;
  description: string;
}> = [
  { value: 1.2, label: "Sedentario", description: "Vita sedentaria, nessun esercizio" },
  { value: 1.375, label: "Leggero", description: "1–3 allenamenti/settimana" },
  { value: 1.55, label: "Moderato", description: "3–5 allenamenti/settimana" },
  { value: 1.725, label: "Attivo", description: "6–7 allenamenti/settimana" },
  { value: 1.9, label: "Estremo", description: "Lavoro fisico + allenamento giornaliero" },
];

/**
 * Label leggibili degli enum di fabbisogno: gli enum tecnici
 * («HarrisBenedict», «moltoattivo») non devono arrivare a UI o export
 * (F-012, audit 09/08/2026). Fallback: il valore grezzo, mai stringa vuota.
 */
export const BMR_FORMULA_LABELS: Record<MetodoBmr, string> = {
  HarrisBenedict: "Harris & Benedict",
  MifflinStJeor: "Mifflin-St Jeor",
  KatchMcArdle: "Katch-McArdle",
  Cunningham: "Cunningham",
};

export const LAF_LIVELLO_LABELS = {
  sedentario: "Sedentario (1,40)",
  pocoattivo: "Poco attivo (1,55)",
  attivo: "Attivo (1,70)",
  moltoattivo: "Molto attivo (1,90)",
} as const;

export function bmrFormulaLabel(
  value: string | null | undefined,
): string | null {
  if (!value) return null;
  return (BMR_FORMULA_LABELS as Record<string, string>)[value] ?? value;
}

export function lafLivelloLabel(
  value: string | null | undefined,
): string | null {
  if (!value) return null;
  return (LAF_LIVELLO_LABELS as Record<string, string>)[value] ?? value;
}

/**
 * Metadati dei metodi BMR per le UI di selezione.
 */
export const METODI_BMR: ReadonlyArray<{
  value: MetodoBmr;
  label: string;
  descrizione: string;
  needsFfm: boolean;
}> = [
  { value: "MifflinStJeor", label: "Mifflin-St Jeor", descrizione: "Moderno, peso + età + sesso. Default.", needsFfm: false },
  { value: "HarrisBenedict", label: "Harris-Benedict", descrizione: "Classico, utile per confronto storico.", needsFfm: false },
  { value: "KatchMcArdle", label: "Katch-McArdle (FFM)", descrizione: "370 + 21.6 × FFM. Accurato per alta % grassa.", needsFfm: true },
  { value: "Cunningham", label: "Cunningham (FFM)", descrizione: "500 + 22 × FFM. Per atleti.", needsFfm: true },
];
