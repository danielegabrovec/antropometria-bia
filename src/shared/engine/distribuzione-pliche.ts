/**
 * Quota del grasso per distretto, dalle pliche a calibro (non dalla BIA).
 *
 * Stessa aritmetica che viveva in apps/patient/lib/body-figure.ts: somma i mm
 * per distretto e li divide per il totale. Caption obbligatoria a schermo:
 * è una ripartizione fra i siti misurati, non una mappa di grasso viscerale.
 */

export type DistrettoPliche =
  | "Arti superiori"
  | "Torace"
  | "Dorsale"
  | "Addominale"
  | "Arti inferiori";

export interface QuotaDistretto {
  distretto: DistrettoPliche;
  mm: number;
  pct: number;
}

export const CAPTION_DISTRIBUZIONE_PLICHE =
  "Quota percentuale fra i siti misurati col calibro, non una mappa di grasso viscerale né un dato BIA.";

const AREE: ReadonlyArray<{
  distretto: DistrettoPliche;
  aliases: readonly string[];
}> = [
  {
    distretto: "Arti superiori",
    aliases: ["tricipite", "plicaTricipite", "bicipite", "plicaBicipite"],
  },
  {
    distretto: "Torace",
    aliases: [
      "petto",
      "pettorale",
      "plicaPettorale",
      "ascellare",
      "plicaAscellare",
    ],
  },
  {
    distretto: "Dorsale",
    aliases: ["sottoscapolare", "plicaSottoscapolare"],
  },
  {
    distretto: "Addominale",
    aliases: [
      "addome",
      "addominale",
      "plicaAddominale",
      "sovrailiaca",
      "plicaSovrailiaca",
    ],
  },
  {
    distretto: "Arti inferiori",
    aliases: ["coscia", "plicaAnterioreCoscia"],
  },
];

/**
 * Per un sito canonico (es. coscia) si prende UN valore, il primo alias
 * valorizzato: sommare anteriore+posteriore gonfierebbe il distretto.
 * Torace e arti superiori sommano siti DIVERSI (petto+ascellare, tri+bi).
 */
const SITI_CANONICI: ReadonlyArray<{
  canonical: string;
  aliases: readonly string[];
}> = [
  { canonical: "tricipite", aliases: ["tricipite", "plicaTricipite"] },
  { canonical: "bicipite", aliases: ["bicipite", "plicaBicipite"] },
  { canonical: "petto", aliases: ["petto", "pettorale", "plicaPettorale"] },
  { canonical: "ascellare", aliases: ["ascellare", "plicaAscellare"] },
  {
    canonical: "sottoscapolare",
    aliases: ["sottoscapolare", "plicaSottoscapolare"],
  },
  { canonical: "addome", aliases: ["addome", "addominale", "plicaAddominale"] },
  { canonical: "sovrailiaca", aliases: ["sovrailiaca", "plicaSovrailiaca"] },
  {
    canonical: "coscia",
    aliases: ["coscia", "plicaAnterioreCoscia", "plicaPosterioreCoscia"],
  },
];

function leggiSito(
  plic: Record<string, number | undefined | null>,
  aliases: readonly string[],
): number {
  for (const alias of aliases) {
    const v = plic[alias];
    if (typeof v === "number" && Number.isFinite(v) && v > 0) return v;
  }
  return 0;
}

function canonici(
  plic: Record<string, number | undefined | null>,
): Record<string, number> {
  const out: Record<string, number> = {};
  for (const sito of SITI_CANONICI) {
    out[sito.canonical] = leggiSito(plic, sito.aliases);
  }
  return out;
}

export function computeDistribution(
  plic: Record<string, number | undefined | null> | null | undefined,
): QuotaDistretto[] {
  if (!plic) return [];
  const v = canonici(plic);
  const total = Object.values(v).reduce((s, x) => s + x, 0);
  if (total <= 0) return [];
  return AREE.map((area) => {
    const mm = area.aliases
      .filter((alias) => SITI_CANONICI.some((s) => s.canonical === alias))
      .reduce((s, k) => s + (v[k] ?? 0), 0);
    return { distretto: area.distretto, mm, pct: (mm / total) * 100 };
  }).filter((q) => q.mm > 0);
}

/** 0% → teal, ~22% → ambra, ~40%+ → rosso. */
export function heatColor(pct: number): string {
  const p = Math.max(0, Math.min(40, pct));
  const hue = 168 - (p / 40) * 168;
  return `hsl(${hue}, 70%, 50%)`;
}

/** Pin Daniele 24/05/2026: 68 mm di pliche JP7. */
export const DANIELE_PLICHE_68MM = {
  tricipite: 8,
  petto: 6,
  ascellare: 12,
  sottoscapolare: 14,
  addome: 12,
  sovrailiaca: 8,
  coscia: 8,
} as const;
