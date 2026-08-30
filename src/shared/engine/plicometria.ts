/**
 * Utility per calcoli di plicometria (skinfold thickness calculations)
 * Formule supportate:
 * - Jackson-Pollock 3 Punti (JP3)
 * - Jackson-Pollock 7 Punti (JP7)
 * - Durnin-Womersley 4 Punti (DW4)
 *
 * Fonte unica condivisa da doctor + patient (prima duplicata identica in entrambe le app).
 */

import { normalizzaSesso, type SessoInput } from "./energia";

export type SkinfoldFormula = "JP3" | "JP7" | "DW4";

export type PlicometriaInput = {
  formula: SkinfoldFormula;
  petto?: number; // Chest (JP3 Uomo, JP7)
  addome?: number; // Abdomen (JP3 Uomo, JP7)
  coscia?: number; // Thigh (JP3 Uomo/Donna, JP7)
  tricipite?: number; // Triceps (JP3 Donna, JP7, DW4)
  bicipite?: number; // Biceps (DW4)
  sovrailiaca?: number; // Suprailiac (JP3 Donna, JP7, DW4)
  sottoscapolare?: number; // Subscapular (JP7, DW4)
  ascellare?: number; // Axilla (JP7)
};

export type PlicometriaResult = {
  grassoPct: number;
  massaGrassaKg: number | null;
  massaMagraKg: number | null;
};

/** @deprecated Compatibilità diagnostica; non usare per nuovi calcoli. */
export function calcolaPlicometriaLegacyUnsafe(
  input: PlicometriaInput,
  sesso: "M" | "F",
  eta: number,
  pesoKg: number | null,
): PlicometriaResult {
  const isFemale = sesso === "F";
  let bd = 1.0; // Body Density

  if (input.formula === "JP3") {
    if (isFemale) {
      // Donne: Tricipite, Sovrailiaca, Coscia
      const tri = input.tricipite ?? 0;
      const sov = input.sovrailiaca ?? 0;
      const cos = input.coscia ?? 0;
      const sum = tri + sov + cos;
      if (sum > 0) {
        bd =
          1.0994921 - 0.0009929 * sum + 0.0000023 * sum * sum - 0.0001392 * eta;
      }
    } else {
      // Uomini: Petto, Addome, Coscia
      const pet = input.petto ?? 0;
      const add = input.addome ?? 0;
      const cos = input.coscia ?? 0;
      const sum = pet + add + cos;
      if (sum > 0) {
        bd =
          1.10938 - 0.0008267 * sum + 0.0000016 * sum * sum - 0.0002574 * eta;
      }
    }
  } else if (input.formula === "JP7") {
    // Entrambi: Petto, Addome, Coscia, Tricipite, Sottoscapolare, Sovrailiaca, Ascellare
    const pet = input.petto ?? 0;
    const add = input.addome ?? 0;
    const cos = input.coscia ?? 0;
    const tri = input.tricipite ?? 0;
    const sot = input.sottoscapolare ?? 0;
    const sov = input.sovrailiaca ?? 0;
    const asc = input.ascellare ?? 0;
    const sum = pet + add + cos + tri + sot + sov + asc;

    if (sum > 0) {
      if (isFemale) {
        bd =
          1.097 - 0.00046971 * sum + 0.00000056 * sum * sum - 0.00012828 * eta;
      } else {
        bd =
          1.112 - 0.00043499 * sum + 0.00000055 * sum * sum - 0.00028826 * eta;
      }
    }
  } else if (input.formula === "DW4") {
    // Entrambi: Bicipite, Tricipite, Sottoscapolare, Sovrailiaca
    const bic = input.bicipite ?? 0;
    const tri = input.tricipite ?? 0;
    const sot = input.sottoscapolare ?? 0;
    const sov = input.sovrailiaca ?? 0;
    const sum = bic + tri + sot + sov;

    if (sum > 0) {
      // Durnin-Womersley coefficients based on Sex and Age
      let c = 1.1631;
      let m = 0.0632;

      if (isFemale) {
        if (eta < 20) {
          c = 1.1549;
          m = 0.0678;
        } else if (eta < 30) {
          c = 1.1599;
          m = 0.0717;
        } else if (eta < 40) {
          c = 1.1423;
          m = 0.0632;
        } else if (eta < 50) {
          c = 1.1333;
          m = 0.0612;
        } else {
          c = 1.1339;
          m = 0.0645;
        }
      } else {
        if (eta < 20) {
          c = 1.162;
          m = 0.063;
        } else if (eta < 30) {
          c = 1.1631;
          m = 0.0632;
        } else if (eta < 40) {
          c = 1.1422;
          m = 0.0544;
        } else if (eta < 50) {
          c = 1.162;
          m = 0.07;
        } else {
          c = 1.1715;
          m = 0.0779;
        }
      }
      bd = c - m * Math.log10(sum);
    }
  }

  // Converti densità a % Massa Grassa con formula di Siri
  let grassoPct = 0;
  if (bd > 0 && bd !== 1.0) {
    grassoPct = (4.95 / bd - 4.5) * 100;
  }
  // Clamp realistici per la sicurezza fisiologica
  grassoPct = Math.max(2.0, Math.min(60.0, grassoPct));
  grassoPct = Math.round(grassoPct * 10) / 10;

  let massaGrassaKg: number | null = null;
  let massaMagraKg: number | null = null;
  if (pesoKg && pesoKg > 0) {
    massaGrassaKg = Math.round(((pesoKg * grassoPct) / 100) * 10) / 10;
    massaMagraKg = Math.round((pesoKg - massaGrassaKg) * 10) / 10;
  }

  return { grassoPct, massaGrassaKg, massaMagraKg };
}

/**
 * Serializza un risultato plicometrico nel formato speciale da inserire nelle note
 */
export function serializzaPlicometria(
  formula: SkinfoldFormula,
  valori: Record<string, number>,
  grassoPct: number,
): string {
  const parts = [
    formula,
    valori.petto || 0,
    valori.tricipite || 0,
    valori.coscia || 0,
    valori.bicipite || 0,
    valori.sovrailiaca || 0,
    valori.sottoscapolare || 0,
    valori.ascellare || 0,
    grassoPct,
    valori.addome || 0, // Added at index 9 (10th item)
  ];
  return `[PLICOMETRIA:${parts.join("|")}]`;
}

/**
 * Deserializza le note estraendo i dati di plicometria
 */
export type PlicometriaParsed = {
  formula: SkinfoldFormula;
  petto: number;
  tricipite: number;
  coscia: number;
  bicipite: number;
  sovrailiaca: number;
  sottoscapolare: number;
  ascellare: number;
  addome: number; // Added
  grassoPct: number;
  notaPulita: string;
};

export function deserializzaPlicometria(
  note: string | null,
): PlicometriaParsed | null {
  if (!note) return null;
  const match = note.match(/^\[PLICOMETRIA:([^\]]+)\]/);
  if (!match) return null;

  try {
    const parts = match[1].split("|");
    const [formula, petto, tri, cos, bic, sov, sot, asc, pct, addome] = parts;
    return {
      formula: formula as SkinfoldFormula,
      petto: parseFloat(petto) || 0,
      tricipite: parseFloat(tri) || 0,
      coscia: parseFloat(cos) || 0,
      bicipite: parseFloat(bic) || 0,
      sovrailiaca: parseFloat(sov) || 0,
      sottoscapolare: parseFloat(sot) || 0,
      ascellare: parseFloat(asc) || 0,
      addome: parseFloat(addome) || 0, // Added
      grassoPct: parseFloat(pct) || 0,
      notaPulita: note.slice(match[0].length),
    };
  } catch {
    return null;
  }
}

/** Formule richieste da My Diet Plan con validazione strict degli input. */
export type SkinfoldFormulaStrict = SkinfoldFormula | "JP4";

export type PlicometriaStrictResult = PlicometriaResult & {
  densita: number;
  formulaUsata: SkinfoldFormulaStrict;
  /**
   * Valorizzato quando il risultato e' stato prodotto FUORI dalla finestra di
   * eta' su cui l'equazione e' stata validata.
   *
   * Il numero e' matematicamente definito comunque — le Jackson & Pollock sono
   * lineari nell'eta', Durnin & Womersley ha l'ultima fascia aperta — ma non ha
   * la validazione dello studio originale. Chi lo mostra DEVE dirlo.
   */
  fuoriValidita?: { min: number; max: number; eta: number };
};

export interface OpzioniPlicometriaStrict {
  /**
   * Cosa fare quando l'eta' e' fuori dalla finestra validata.
   * `"rifiuta"` (default) non produce nulla — e' il comportamento storico, ed e'
   * quello giusto per le superfici che non possono spiegare la differenza.
   * `"calcola"` restituisce il numero con `fuoriValidita` valorizzato.
   */
  fuoriValidita?: "rifiuta" | "calcola";
}

function allPositiveFinite(
  values: Array<number | undefined>,
): values is number[] {
  return values.every(
    (value) => typeof value === "number" && Number.isFinite(value) && value > 0,
  );
}

/**
 * Variante strict per il prodotto self-service My Diet Plan.
 *
 * A differenza dell'API clinica storica, una plica mancante non viene convertita nel minimo
 * fisiologico: il calcolo fallisce esplicitamente. JP4 usa le equazioni generalizzate
 * Jackson-Pollock (uomo) e Jackson-Pollock-Ward (donna).
 */
export function calcolaPlicometriaStrict(
  input: Omit<PlicometriaInput, "formula"> & { formula: SkinfoldFormulaStrict },
  sesso: "M" | "F",
  eta: number,
  pesoKg: number,
  opzioni: OpzioniPlicometriaStrict = {},
): PlicometriaStrictResult | null {
  if (
    !Number.isFinite(eta) ||
    eta <= 0 ||
    !Number.isFinite(pesoKg) ||
    pesoKg <= 0
  )
    return null;

  const isFemale = sesso === "F";
  const [etaMin, etaMax] =
    input.formula === "DW4" ? [17, 72] : [18, isFemale ? 55 : 61];
  const inAgeRange = eta >= etaMin && eta <= etaMax;
  // Fuori finestra si puo' comunque calcolare, ma solo se il chiamante lo
  // chiede: il risultato esce marchiato con `fuoriValidita`.
  if (!inAgeRange && opzioni.fuoriValidita !== "calcola") return null;
  const fuoriValidita = inAgeRange
    ? undefined
    : { min: etaMin, max: etaMax, eta };
  let densita: number;

  /**
   * Somma delle pliche oltre la quale l'equazione quadratica smette di essere
   * monotona decrescente: e' il vertice della parabola, Sigma* = b / (2c) per
   * D = a - b*Sigma + c*Sigma^2. Superato quel punto la densita' ricomincia a
   * salire, quindi PIU' pliche darebbero MENO grasso: non un risultato
   * impreciso, un risultato invertito.
   *
   * Per quasi tutte le equazioni il vertice cade fuori dal range fisiologico e
   * la guardia non scatta mai: JP3 F 216 mm, JP3 M 258 mm, JP4 F 316 mm,
   * JP7 M 395 mm, JP7 F 419 mm. Per JP4 MASCHILE cade a 158 mm, e con quattro
   * siti (tricipite, addome, sovrailiaca, coscia) un paziente obeso ci arriva
   * davvero: 30+50+40+40 bastano. Fino a qui il referto usciva con un valore
   * sottostimato e nulla lo segnalava.
   *
   * Durnin & Womersley e' logaritmica e monotona su tutto il dominio: resta null.
   */
  let sommaMassimaMonotona: number | null = null;
  let sommaPliche = 0;

  if (input.formula === "JP3") {
    const values = isFemale
      ? [input.tricipite, input.sovrailiaca, input.coscia]
      : [input.petto, input.addome, input.coscia];
    if (!allPositiveFinite(values)) return null;
    const sum = values.reduce((total, value) => total + value, 0);
    sommaPliche = sum;
    sommaMassimaMonotona = isFemale
      ? 0.0009929 / (2 * 0.0000023)
      : 0.0008267 / (2 * 0.0000016);
    densita = isFemale
      ? 1.0994921 - 0.0009929 * sum + 0.0000023 * sum * sum - 0.0001392 * eta
      : 1.10938 - 0.0008267 * sum + 0.0000016 * sum * sum - 0.0002574 * eta;
  } else if (input.formula === "JP4") {
    const values = [
      input.tricipite,
      input.addome,
      input.sovrailiaca,
      input.coscia,
    ];
    if (!allPositiveFinite(values)) return null;
    const sum = values.reduce((total, value) => total + value, 0);
    sommaPliche = sum;
    sommaMassimaMonotona = isFemale
      ? 0.0006952 / (2 * 0.0000011)
      : 0.0008209 / (2 * 0.0000026);
    densita = isFemale
      ? 1.096095 - 0.0006952 * sum + 0.0000011 * sum * sum - 0.0000714 * eta
      : 1.1096 - 0.0008209 * sum + 0.0000026 * sum * sum - 0.0002017 * eta;
  } else if (input.formula === "JP7") {
    const values = [
      input.petto,
      input.addome,
      input.coscia,
      input.tricipite,
      input.sottoscapolare,
      input.sovrailiaca,
      input.ascellare,
    ];
    if (!allPositiveFinite(values)) return null;
    const sum = values.reduce((total, value) => total + value, 0);
    sommaPliche = sum;
    sommaMassimaMonotona = isFemale
      ? 0.00046971 / (2 * 0.00000056)
      : 0.00043499 / (2 * 0.00000055);
    densita = isFemale
      ? 1.097 - 0.00046971 * sum + 0.00000056 * sum * sum - 0.00012828 * eta
      : 1.112 - 0.00043499 * sum + 0.00000055 * sum * sum - 0.00028826 * eta;
  } else {
    const values = [
      input.bicipite,
      input.tricipite,
      input.sottoscapolare,
      input.sovrailiaca,
    ];
    if (!allPositiveFinite(values)) return null;
    const sum = values.reduce((total, value) => total + value, 0);
    const coefficients = isFemale
      ? eta < 20
        ? [1.1549, 0.0678]
        : eta < 30
          ? [1.1599, 0.0717]
          : eta < 40
            ? [1.1423, 0.0632]
            : eta < 50
              ? [1.1333, 0.0612]
              : [1.1339, 0.0645]
      : eta < 20
        ? [1.162, 0.063]
        : eta < 30
          ? [1.1631, 0.0632]
          : eta < 40
            ? [1.1422, 0.0544]
            : eta < 50
              ? [1.162, 0.07]
              : [1.1715, 0.0779];
    densita = coefficients[0] - coefficients[1] * Math.log10(sum);
  }

  if (
    sommaMassimaMonotona !== null &&
    sommaPliche >= sommaMassimaMonotona
  )
    return null;

  if (!Number.isFinite(densita) || densita <= 0) return null;
  const grassoPctRaw = 495 / densita - 450;
  if (!Number.isFinite(grassoPctRaw) || grassoPctRaw < 2 || grassoPctRaw > 60)
    return null;

  const grassoPct = Math.round(grassoPctRaw * 10) / 10;
  const massaGrassaKg = Math.round(pesoKg * (grassoPct / 100) * 10) / 10;
  const massaMagraKg = Math.round((pesoKg - massaGrassaKg) * 10) / 10;

  return {
    grassoPct,
    massaGrassaKg,
    massaMagraKg,
    densita: Math.round(densita * 10_000) / 10_000,
    formulaUsata: input.formula,
    ...(fuoriValidita ? { fuoriValidita } : {}),
  };
}

/** API condivisa doctor/patient: delega sempre alla variante validata e versionata. */
export function calcolaPlicometria(
  input: PlicometriaInput,
  sesso: "M" | "F",
  eta: number,
  pesoKg: number | null,
  opzioni: OpzioniPlicometriaStrict = {},
): PlicometriaResult {
  const strict = calcolaPlicometriaStrict(
    input,
    sesso,
    eta,
    pesoKg && pesoKg > 0 ? pesoKg : 1,
    opzioni,
  );
  if (!strict) return { grassoPct: 0, massaGrassaKg: null, massaMagraKg: null };
  return {
    grassoPct: strict.grassoPct,
    massaGrassaKg: pesoKg && pesoKg > 0 ? strict.massaGrassaKg : null,
    massaMagraKg: pesoKg && pesoKg > 0 ? strict.massaMagraKg : null,
  };
}

/**
 * Quello che serve a schermo: il risultato più, se c'è, la riserva sull'età.
 *
 * `fuoriValidita` arriva fin qui perché le due superfici che scelgono la
 * formula — la scheda del nutrizionista e «Misure a casa» del paziente — devono
 * poter dichiarare la riserva accanto al numero. Le altre passano l'opzione di
 * default e non lo vedono mai valorizzato.
 */
export type PlicometriaMostrabile = PlicometriaResult & {
  fuoriValidita?: { min: number; max: number; eta: number };
};

/**
 * La plicometria **come si mostra a schermo**: `null` quando non è calcolabile.
 *
 * `calcolaPlicometria` non può dire «non lo so»: la sua firma pretende un sesso
 * `"M" | "F"` e un'età `number`, e quando il calcolo rigoroso rifiuta restituisce
 * `{ grassoPct: 0, massaGrassaKg: null, massaMagraKg: null }`. Quello zero è un
 * codice interno, non una misura — ma tre superfici lo stampavano come se lo
 * fosse: il Diario del dottore scriveva «0%» e, interpolando i `null` in un
 * template, «null kg»; il grafico degli andamenti disegnava una discesa a zero.
 *
 * Peggio a monte: per soddisfare quella firma i chiamanti inventavano i dati
 * mancanti — `calcolaEtaUnified(d) || 30` per l'età, e `sesso.startsWith("f") ?
 * "F" : "M"` per il sesso, che manda in equazione MASCHILE ogni paziente il cui
 * sesso non sia registrato o sia «Altro». Su una donna la stima può sbagliare di
 * venti punti percentuali.
 *
 * Questa funzione chiude entrambe le porte: normalizza col criterio condiviso,
 * pretende un'età vera, e restituisce `null` — che i chiamanti rendono «—» —
 * invece di un numero inventato.
 *
 * `opzioni.fuoriValidita` resta `"rifiuta"` di default: chi non sa spiegare la
 * riserva continua a non ricevere il numero. Chi la sa spiegare passa
 * `"calcola"` e se la ritrova in `fuoriValidita`.
 */
export function calcolaPlicometriaMostrabile(
  input: PlicometriaInput,
  sesso: SessoInput,
  eta: number | null | undefined,
  pesoKg: number | null,
  opzioni: OpzioniPlicometriaStrict = {},
): PlicometriaMostrabile | null {
  const sessoNorm = normalizzaSesso(sesso);
  if (!sessoNorm) return null;
  if (eta == null || !Number.isFinite(eta) || eta <= 0) return null;
  const strict = calcolaPlicometriaStrict(
    input,
    sessoNorm,
    eta,
    pesoKg && pesoKg > 0 ? pesoKg : 1,
    opzioni,
  );
  // `grassoPct === 0` è il codice di «non calcolato»: nessun essere umano ha
  // lo 0% di massa grassa.
  if (!strict || strict.grassoPct <= 0) return null;
  return {
    grassoPct: strict.grassoPct,
    massaGrassaKg: pesoKg && pesoKg > 0 ? strict.massaGrassaKg : null,
    massaMagraKg: pesoKg && pesoKg > 0 ? strict.massaMagraKg : null,
    ...(strict.fuoriValidita ? { fuoriValidita: strict.fuoriValidita } : {}),
  };
}
