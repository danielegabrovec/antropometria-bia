/**
 * Fasce di normalità con fonte nominata, mai inventata.
 *
 * MG %: Gallagher 2000 (massa-grassa-riferimenti).
 * WHR: 0,95 uomini / 0,85 donne (WHO / consensus clinico già in whrInfo).
 * WHtR: soglia 0,50.
 * BMI OMS: secondario — non è il titolo della visita se la plicometria è in range.
 */

import {
  classifyFatPercent,
  fatPercentReference,
} from "./massa-grassa-riferimenti";

function esc(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function num(value: number, digits: number, locale: GaugeLocale = "it") {
  return new Intl.NumberFormat(locale === "en" ? "en-GB" : "it-IT", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(value);
}

export type GaugeLocale = "it" | "en";

const TITOLI_EN: Record<IdFascia, string> = {
  fatPercent: "Fat mass",
  whr: "Waist / hips",
  whtr: "Waist / height",
  bmi: "BMI",
};

/**
 * Traduzione MIRATA delle etichette generate da questo modulo e da
 * `fatPercentReference` (forme note, mai testo libero): parole + virgola
 * decimale. La citazione Gallagher resta com'è, è una citazione.
 */
function locGaugeText(text: string, locale: GaugeLocale): string {
  if (locale !== "en" || !text) return text;
  return text
    .replace("Soglia orientativa", "Indicative threshold")
    .replace(/Soglia/g, "Threshold")
    .replace("OMS, classificazione BMI adulti", "WHO adult BMI classification")
    .replace(/uomini/g, "men")
    .replace(/donne/g, "women")
    .replace(/anni/g, "years")
    .replace(/(\d),(\d)/g, "$1.$2");
}

export type IdFascia = "fatPercent" | "whr" | "whtr" | "bmi";

export interface FasciaNormale {
  id: IdFascia;
  titolo: string;
  valore: number;
  low: number | null;
  high: number | null;
  classificazione: "sotto" | "dentro" | "sopra" | null;
  fonte: string | null;
  etichettaFascia: string | null;
  /** BMI OMS: non va in copertina se Gallagher è valutabile. */
  secondario: boolean;
}

const FONTE_WHR = "Soglia 0,95 uomini / 0,85 donne";
const FONTE_WHTR = "Soglia orientativa 0,50";
const FONTE_BMI = "OMS, classificazione BMI adulti";

export function fasciaMassaGrassa(
  pct: number | null | undefined,
  sex: "M" | "F" | string | null | undefined,
  ageYears: number | null | undefined,
): FasciaNormale | null {
  if (pct == null || !Number.isFinite(pct)) return null;
  const rif = fatPercentReference(sex, ageYears);
  return {
    id: "fatPercent",
    titolo: "Massa grassa",
    valore: pct,
    low: rif?.low ?? null,
    high: rif?.high ?? null,
    classificazione: classifyFatPercent(pct, rif),
    fonte: rif?.source ?? null,
    etichettaFascia: rif?.label ?? null,
    secondario: false,
  };
}

export function fasciaWhr(
  whr: number | null | undefined,
  sex: "M" | "F" | string | null | undefined,
): FasciaNormale | null {
  if (whr == null || !Number.isFinite(whr)) return null;
  const soglia = sex === "M" ? 0.95 : sex === "F" ? 0.85 : null;
  const classificazione =
    soglia == null ? null : whr >= soglia ? "sopra" : "dentro";
  return {
    id: "whr",
    titolo: "Vita / fianchi",
    valore: whr,
    low: 0,
    high: soglia,
    classificazione,
    fonte: soglia == null ? null : FONTE_WHR,
    etichettaFascia:
      soglia == null
        ? null
        : `Soglia ${soglia.toLocaleString("it-IT", { minimumFractionDigits: 2 })} (${sex === "M" ? "uomini" : "donne"})`,
    secondario: false,
  };
}

export function fasciaWhtr(
  whtr: number | null | undefined,
): FasciaNormale | null {
  if (whtr == null || !Number.isFinite(whtr)) return null;
  return {
    id: "whtr",
    titolo: "Vita / altezza",
    valore: whtr,
    low: 0,
    high: 0.5,
    classificazione: whtr >= 0.5 ? "sopra" : "dentro",
    fonte: FONTE_WHTR,
    /* La fonte dice già «Soglia orientativa 0,50»: ripeterla qui produceva
     * «Soglia 0,50 · Soglia orientativa 0,50» nel piede del gauge. */
    etichettaFascia: null,
    secondario: false,
  };
}

/** Classificazione OMS; sempre `secondario: true`. */
export function fasciaBmi(bmi: number | null | undefined): FasciaNormale | null {
  if (bmi == null || !Number.isFinite(bmi)) return null;
  let classificazione: FasciaNormale["classificazione"] = "dentro";
  let etichetta = "18,5–24,9 kg/m²";
  if (bmi < 18.5) {
    classificazione = "sotto";
    etichetta = "< 18,5 kg/m²";
  } else if (bmi >= 25) {
    classificazione = "sopra";
    etichetta = bmi >= 30 ? "≥ 30 kg/m²" : "25–29,9 kg/m²";
  }
  return {
    id: "bmi",
    titolo: "BMI",
    valore: bmi,
    low: 18.5,
    high: 24.9,
    classificazione,
    fonte: FONTE_BMI,
    etichettaFascia: etichetta,
    secondario: true,
  };
}

export function coloreFascia(
  classificazione: FasciaNormale["classificazione"],
): string {
  if (classificazione === "dentro") return "#0f766e";
  if (classificazione === "sopra") return "#c2410c";
  if (classificazione === "sotto") return "#0369a1";
  return "#64748b";
}

/**
 * Barra orizzontale con marker. Se manca la fascia (fuori Gallagher) si
 * disegna solo il valore, senza zona colorata inventata.
 */
export function renderGaugeFasciaSvg(
  fascia: FasciaNormale,
  options: { idPrefix?: string; width?: number; locale?: GaugeLocale } = {},
): string {
  const w = options.width ?? 280;
  const h = 56;
  const locale = options.locale ?? "it";
  const titolo =
    locale === "en" ? TITOLI_EN[fascia.id] : fascia.titolo;
  const id = String(options.idPrefix ?? fascia.id).replace(
    /[^a-zA-Z0-9_-]/g,
    "-",
  );
  const colore = coloreFascia(fascia.classificazione);
  const valore = num(
    fascia.valore,
    fascia.id === "whr" || fascia.id === "whtr" ? 2 : 1,
    locale,
  );
  if (fascia.low == null || fascia.high == null) {
    const nessunRif =
      locale === "en"
        ? "no reference for this patient"
        : "nessun riferimento per questo paziente";
    const nessunaFascia =
      locale === "en"
        ? "No published range for this sex or age"
        : "Nessuna fascia pubblicata per sesso o età";
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" role="img" aria-labelledby="${id}-t" style="width:100%;height:auto;display:block"><title id="${id}-t">${esc(titolo)} ${esc(valore)} — ${nessunRif}</title><text x="0" y="16" fill="#0f172a" font-size="12" font-weight="800">${esc(titolo)}</text><text x="0" y="36" fill="#334155" font-size="18" font-weight="800">${esc(valore)}</text><text x="0" y="52" fill="#64748b" font-size="10">${nessunaFascia}</text></svg>`;
  }
  const span = Math.max(fascia.high * 1.4 - 0, 0.01);
  const xTrack = 8;
  const trackW = w - 16;
  const xVal = xTrack + Math.max(0, Math.min(1, fascia.valore / span)) * trackW;
  const xLow = xTrack + (fascia.low / span) * trackW;
  const xHigh = xTrack + (fascia.high / span) * trackW;
  const zona = `<rect x="${xLow}" y="22" width="${Math.max(2, xHigh - xLow)}" height="10" rx="5" fill="#99f6e4"/>`;
  const piede = [
    fascia.etichettaFascia ? locGaugeText(fascia.etichettaFascia, locale) : "",
    fascia.fonte ? locGaugeText(fascia.fonte, locale) : "",
  ]
    .filter(Boolean)
    .join(" · ");
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" role="img" aria-labelledby="${id}-t ${id}-d" style="width:100%;height:auto;display:block"><title id="${id}-t">${esc(titolo)} ${esc(valore)}</title><desc id="${id}-d">${esc(piede)}</desc><text x="8" y="14" fill="#0f172a" font-size="11" font-weight="800">${esc(titolo)}</text><text x="${w - 8}" y="14" text-anchor="end" fill="${colore}" font-size="14" font-weight="850">${esc(valore)}</text><rect x="${xTrack}" y="24" width="${trackW}" height="6" rx="3" fill="#e2e8f0"/>${zona}<circle cx="${xVal}" cy="27" r="6" fill="${colore}" stroke="#fff" stroke-width="2"/><text x="8" y="50" fill="#64748b" font-size="9">${esc(piede)}</text></svg>`;
}

/** Quattro gauge in un blocco HTML: stesso ordine su Web, PWA ed export. */
export function renderGaugesVisitaHtml(input: {
  fatPercent: number | null | undefined;
  waistHipRatio: number | null | undefined;
  waistCm: number | null | undefined;
  heightCm: number | null | undefined;
  bmi: number | null | undefined;
  sex: string | null | undefined;
  ageYears?: number | null;
  idPrefix: string;
  locale?: GaugeLocale;
}): string {
  const whtr =
    input.waistCm != null &&
    input.heightCm != null &&
    Number.isFinite(input.waistCm) &&
    input.heightCm > 0
      ? input.waistCm / input.heightCm
      : null;
  const fasce = [
    fasciaMassaGrassa(input.fatPercent, input.sex, input.ageYears ?? null),
    fasciaWhr(input.waistHipRatio, input.sex),
    fasciaWhtr(whtr),
    fasciaBmi(input.bmi),
  ].filter((fascia): fascia is FasciaNormale => fascia != null);
  if (!fasce.length) return "";
  return `<div class="gauge-grid">${fasce
    .map((fascia) =>
      renderGaugeFasciaSvg(fascia, {
        idPrefix: `${input.idPrefix}-${fascia.id}`,
        locale: input.locale,
      }),
    )
    .join("")}</div>`;
}
