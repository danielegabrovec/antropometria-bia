/**
 * Quali equazioni plicometriche sono validate per l'età di questo paziente.
 *
 * Serve a colorare il selettore — verde quelle applicabili, rosso quelle fuori
 * finestra — e a suggerire l'alternativa quando il professionista ne sceglie
 * una non validata. Le finestre stanno in `SKINFOLD_AGE_RANGE` e dipendono dal
 * sesso: Jackson & Pollock arrivano a 55 anni per le donne e a 61 per gli
 * uomini, Durnin & Womersley copre 17-72 per entrambi.
 */

import type { SkinfoldFormulaStrict } from "./plicometria";
import type { EqDensitaPliche } from "./skinfold-sites";
import {
  EQ_DENSITA_OPTIONS,
  EQ_DENSITA_TO_STRICT,
  SKINFOLD_AGE_RANGE,
} from "./skinfold-sites";

/**
 * La finestra validata di un'equazione, letta col nome che usa il motore
 * (`"JP3"`, `"DW4"`, …) invece dell'enum della scheda del dottore.
 *
 * Serve all'app paziente, che in «Misure a casa» conserva le formule con i nomi
 * strict e non ha motivo di passare per `EqDensitaPliche`.
 */
export function finestraEtaFormula(
  formula: SkinfoldFormulaStrict,
  sesso: "M" | "F" | null | undefined,
): { min: number; max: number } {
  const [min, max] = SKINFOLD_AGE_RANGE[formula][sesso === "F" ? "F" : "M"];
  return { min, max };
}

/**
 * `true` solo se età **e** sesso sono noti e l'età cade nella finestra: senza
 * uno dei due non si promette una copertura che non è stata verificata.
 */
export function formulaValidataPerEta(
  formula: SkinfoldFormulaStrict,
  sesso: "M" | "F" | null | undefined,
  eta: number | null | undefined,
): boolean {
  if (sesso == null) return false;
  if (typeof eta !== "number" || !Number.isFinite(eta) || eta <= 0) return false;
  const { min, max } = finestraEtaFormula(formula, sesso);
  return eta >= min && eta <= max;
}

export interface FormulaPerEta {
  value: EqDensitaPliche;
  label: string;
  hint: string;
  min: number;
  max: number;
  /** `true` se l'età ricade nella finestra validata. */
  validata: boolean;
}

/**
 * @param eta anni compiuti alla data della visita. `null`/0 = non calcolabile:
 *   in quel caso nessuna formula può dirsi validata, e non si colora niente di
 *   verde per non promettere una copertura che non è stata verificata.
 */
export function formulePerEta(
  eta: number | null | undefined,
  sesso: "M" | "F" | null | undefined,
): FormulaPerEta[] {
  return EQ_DENSITA_OPTIONS.map((opzione) => {
    const strict = EQ_DENSITA_TO_STRICT[opzione.value];
    const { min, max } = finestraEtaFormula(strict, sesso);
    return {
      value: opzione.value,
      label: opzione.label,
      hint: opzione.hint,
      min,
      max,
      validata: formulaValidataPerEta(strict, sesso, eta),
    };
  });
}

/** Le sole formule validate per questa età: sono i suggerimenti da offrire. */
export function formuleSuggeritePerEta(
  eta: number | null | undefined,
  sesso: "M" | "F" | null | undefined,
): FormulaPerEta[] {
  return formulePerEta(eta, sesso).filter((formula) => formula.validata);
}
