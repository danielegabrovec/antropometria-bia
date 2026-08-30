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

export type CinqueZone = {
  scaleMin: number
  scaleMax: number
  redLo: [number, number]
  orangeLo: [number, number]
  green: [number, number]
  orangeHi: [number, number]
  redHi: [number, number]
}

/** Cinque bande per la barra (rosso inf. · arancio inf. · verde · arancio sup. · rosso sup.). */
export function boundsCinqueZone(fascia: FasciaNormale): CinqueZone | null {
  if (fascia.low == null || fascia.high == null) return null
  const v = fascia.valore
  if (fascia.id === "bmi") {
    const scaleMin = Math.min(12, v)
    const scaleMax = Math.max(42, v)
    return {
      scaleMin,
      scaleMax,
      redLo: [scaleMin, 16],
      orangeLo: [16, 18.5],
      green: [18.5, 25],
      orangeHi: [25, 30],
      redHi: [30, scaleMax],
    }
  }
  if (fascia.id === "whr" || fascia.id === "whtr") {
    const soglia = fascia.high
    const scaleMin = 0
    const scaleMax = Math.max(soglia * 1.45, v * 1.12, soglia + 0.12)
    const orangeEnd = soglia + (scaleMax - soglia) * 0.4
    return {
      scaleMin,
      scaleMax,
      redLo: [0, 0],
      orangeLo: [0, 0],
      green: [0, soglia],
      orangeHi: [soglia, orangeEnd],
      redHi: [orangeEnd, scaleMax],
    }
  }
  const lo = fascia.low
  const hi = fascia.high
  const span = Math.max(hi - lo, 0.5)
  const orange = span * 0.45
  const scaleMin = Math.min(0, v, lo - orange * 2)
  const scaleMax = Math.max(v * 1.08, hi + orange * 2)
  const orangeLo0 = Math.max(scaleMin, lo - orange)
  const orangeHi1 = Math.min(scaleMax, hi + orange)
  return {
    scaleMin,
    scaleMax,
    redLo: [scaleMin, orangeLo0],
    orangeLo: [orangeLo0, lo],
    green: [lo, hi],
    orangeHi: [hi, orangeHi1],
    redHi: [orangeHi1, scaleMax],
  }
}

export function tonoCinqueZone(
  valore: number,
  z: CinqueZone,
): "rosso-inf" | "arancio-inf" | "verde" | "arancio-sup" | "rosso-sup" {
  if (valore < z.green[0]) return valore < z.orangeLo[0] ? "rosso-inf" : "arancio-inf"
  if (valore <= z.green[1]) return "verde"
  return valore <= z.orangeHi[1] ? "arancio-sup" : "rosso-sup"
}

function xOnScale(value: number, z: CinqueZone, x0: number, trackW: number) {
  const t = (value - z.scaleMin) / Math.max(z.scaleMax - z.scaleMin, 0.001)
  return x0 + Math.max(0, Math.min(1, t)) * trackW
}

/**
 * Barra orizzontale a cinque zone con cuneo sul valore.
 * Se manca la fascia (fuori Gallagher) si disegna solo il valore.
 */
export function renderGaugeFasciaSvg(
  fascia: FasciaNormale,
  options: { idPrefix?: string; width?: number; locale?: GaugeLocale } = {},
): string {
  const w = options.width ?? 320
  const h = 72
  const locale = options.locale ?? "it"
  const titolo = locale === "en" ? TITOLI_EN[fascia.id] : fascia.titolo
  const id = String(options.idPrefix ?? fascia.id).replace(/[^a-zA-Z0-9_-]/g, "-")
  const valore = num(fascia.valore, fascia.id === "whr" || fascia.id === "whtr" ? 2 : 1, locale)
  const z = boundsCinqueZone(fascia)
  if (!z) {
    const nessunRif =
      locale === "en" ? "no reference for this patient" : "nessun riferimento per questo paziente"
    const nessunaFascia =
      locale === "en"
        ? "No published range for this sex or age"
        : "Nessuna fascia pubblicata per sesso o età"
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" role="img" aria-labelledby="${id}-t" style="width:100%;height:auto;display:block"><title id="${id}-t">${esc(titolo)} ${esc(valore)} — ${nessunRif}</title><text x="0" y="16" fill="#0f172a" font-size="12" font-weight="800">${esc(titolo)}</text><text x="0" y="36" fill="#334155" font-size="18" font-weight="800">${esc(valore)}</text><text x="0" y="52" fill="#64748b" font-size="10">${nessunaFascia}</text></svg>`
  }
  const xTrack = 8
  const trackW = w - 16
  const yBar = 28
  const barH = 12
  const segs: Array<{ a: number; b: number; fill: string }> = [
    { a: z.redLo[0], b: z.redLo[1], fill: "#b91c1c" },
    { a: z.orangeLo[0], b: z.orangeLo[1], fill: "#ea580c" },
    { a: z.green[0], b: z.green[1], fill: "#0f766e" },
    { a: z.orangeHi[0], b: z.orangeHi[1], fill: "#ea580c" },
    { a: z.redHi[0], b: z.redHi[1], fill: "#b91c1c" },
  ]
  const rects = segs
    .filter((s) => s.b > s.a + 1e-6)
    .map((s) => {
      const x = xOnScale(s.a, z, xTrack, trackW)
      const x2 = xOnScale(s.b, z, xTrack, trackW)
      return `<rect x="${x}" y="${yBar}" width="${Math.max(1, x2 - x)}" height="${barH}" fill="${s.fill}"/>`
    })
    .join("")
  const xv = xOnScale(fascia.valore, z, xTrack, trackW)
  const wedge = `<polygon points="${xv - 7},${yBar - 4} ${xv + 7},${yBar - 4} ${xv},${yBar + 10}" fill="#0f172a" stroke="#fff" stroke-width="1.2"/>`
  const piede = [
    fascia.etichettaFascia ? locGaugeText(fascia.etichettaFascia, locale) : "",
    fascia.fonte ? locGaugeText(fascia.fonte, locale) : "",
  ]
    .filter(Boolean)
    .join(" · ")
  const tono = tonoCinqueZone(fascia.valore, z)
  const tonoIt: Record<typeof tono, string> = {
    "rosso-inf": "rosso inferiore",
    "arancio-inf": "arancione inferiore",
    verde: "verde (in range)",
    "arancio-sup": "arancione superiore",
    "rosso-sup": "rosso superiore",
  }
  const tonoEn: Record<typeof tono, string> = {
    "rosso-inf": "lower red",
    "arancio-inf": "lower amber",
    verde: "green (in range)",
    "arancio-sup": "upper amber",
    "rosso-sup": "upper red",
  }
  const tonoLab = locale === "en" ? tonoEn[tono] : tonoIt[tono]
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" role="img" aria-labelledby="${id}-t ${id}-d" style="width:100%;height:auto;display:block"><title id="${id}-t">${esc(titolo)} ${esc(valore)}</title><desc id="${id}-d">${esc(piede)} · ${tonoLab}</desc><text x="8" y="14" fill="#0f172a" font-size="11" font-weight="800">${esc(titolo)}</text><text x="${w - 8}" y="14" text-anchor="end" fill="#0f172a" font-size="14" font-weight="850">${esc(valore)} · ${tonoLab}</text><rect x="${xTrack}" y="${yBar}" width="${trackW}" height="${barH}" rx="2" fill="#e2e8f0"/>${rects}${wedge}<text x="8" y="58" fill="#64748b" font-size="9">${esc(piede)}</text></svg>`
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
