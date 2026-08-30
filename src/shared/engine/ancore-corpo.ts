/**
 * Ancore anatomiche dei siti di misura sulle foto dei modelli corporei.
 *
 * Perché esiste (30/08/2026): la vecchia `BODY_MEASURE_Y` era UNA tabella di
 * Y per tre foto diverse, e la X usciva da tre fasce a regex — su modelli
 * fotografici differenti lo stesso pixel cade su punti anatomici diversi
 * (la plica tricipitale della donna finiva sul gomito). Qui ogni modello
 * (uomo/donna/neutro) ha la SUA tabella, e le coordinate sono NORMALIZZATE
 * [0,1] sull'immagine combinata fronte+retro (2100×1400, rapporto 3:2):
 * nx < 0,5 = figura frontale, nx > 0,5 = figura di spalle.
 *
 * Le foto riempiono ESATTAMENTE il riquadro del renderer (3:2 dentro 3:2,
 * `preserveAspectRatio meet`), quindi la proiezione verso il viewBox è
 * lineare e vive in `proiettaAncora`. I valori sono calibrati A VIDEO sui
 * tre modelli: chi li ritocca deve ricontrollare i pallini sulla foto vera,
 * non fidarsi dell'aritmetica.
 *
 * Modulo puro: nessun React, nessun DOM.
 */

export type BodyModelVariant = 'male' | 'female'
export type BodyModelId = BodyModelVariant | 'neutral'

export interface AncoraCorpo {
  /** Frazione orizzontale [0,1] dell'immagine combinata fronte+retro. */
  nx: number;
  /** Frazione verticale [0,1] dell'immagine combinata. */
  ny: number;
}

export interface BoxImmagine {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** Riquadro della foto nel viewBox del renderer condiviso. */
export const BOX_IMMAGINE_DEFAULT: BoxImmagine = { x: 95, y: 70, w: 1050, h: 700 };

/**
 * Siti che si misurano sulla figura di spalle. La verità resta l'ancora
 * (nx > 0,5): questa lista serve ai test per garantire che le tabelle non
 * spostino per errore un sito da una figura all'altra.
 */
export const SITI_SUL_RETRO = [
  "plicaSottoscapolare",
  "plicaTricipite",
  "plicaPosterioreCoscia",
  "polpaccio",
  "diametroCaviglia",
] as const;

/**
 * Tabelle per modello. Ogni chiave corrisponde a una misura di
 * `AntropometriaState` (vedi BILATERAL_DEFINITIONS/SCALAR_DEFINITIONS).
 * I siti bilaterali sono ancorati all'arto più leggibile in foto; alcuni
 * (braccio contratto, diametro del polso) usano l'arto opposto per non
 * accatastare i pallini sullo stesso braccio.
 */
export const BODY_ANCHORS: Record<
  BodyModelId,
  Record<string, AncoraCorpo>
> = {
  male: {
    torace: { nx: 0.254, ny: 0.305 },
    plicaPettorale: { nx: 0.228, ny: 0.286 },
    plicaAscellare: { nx: 0.208, ny: 0.315 },
    vita: { nx: 0.254, ny: 0.394 },
    plicaAddominale: { nx: 0.271, ny: 0.414 },
    addome: { nx: 0.254, ny: 0.432 },
    plicaSovrailiaca: { nx: 0.285, ny: 0.443 },
    fianchi: { nx: 0.254, ny: 0.492 },
    diametroSagittale: { nx: 0.295, ny: 0.425 },
    braccio: { nx: 0.19, ny: 0.288 },
    braccioContratto: { nx: 0.321, ny: 0.288 },
    plicaBicipite: { nx: 0.314, ny: 0.3 },
    diametroGomito: { nx: 0.182, ny: 0.34 },
    avambraccio: { nx: 0.172, ny: 0.365 },
    polso: { nx: 0.168, ny: 0.433 },
    diametroPolso: { nx: 0.333, ny: 0.433 },
    radiceCoscia: { nx: 0.234, ny: 0.552 },
    cosciaProssimale: { nx: 0.283, ny: 0.572 },
    plicaInternoCoscia: { nx: 0.245, ny: 0.588 },
    plicaAnterioreCoscia: { nx: 0.229, ny: 0.625 },
    cosciaMedia: { nx: 0.283, ny: 0.625 },
    cosciaDistale: { nx: 0.228, ny: 0.675 },
    sopraPatellare: { nx: 0.281, ny: 0.7 },
    plicaSopraPatellare: { nx: 0.229, ny: 0.7 },
    diametroGinocchio: { nx: 0.281, ny: 0.728 },
    plicaPolpaccio: { nx: 0.24, ny: 0.795 },
    plicaSottoscapolare: { nx: 0.695, ny: 0.283 },
    plicaTricipite: { nx: 0.834, ny: 0.287 },
    plicaPosterioreCoscia: { nx: 0.702, ny: 0.635 },
    polpaccio: { nx: 0.776, ny: 0.787 },
    diametroCaviglia: { nx: 0.785, ny: 0.918 },
  },
  female: {
    torace: { nx: 0.256, ny: 0.307 },
    plicaPettorale: { nx: 0.219, ny: 0.272 },
    plicaAscellare: { nx: 0.206, ny: 0.318 },
    vita: { nx: 0.256, ny: 0.393 },
    plicaAddominale: { nx: 0.272, ny: 0.416 },
    addome: { nx: 0.256, ny: 0.432 },
    plicaSovrailiaca: { nx: 0.283, ny: 0.448 },
    fianchi: { nx: 0.256, ny: 0.515 },
    diametroSagittale: { nx: 0.292, ny: 0.422 },
    braccio: { nx: 0.192, ny: 0.285 },
    braccioContratto: { nx: 0.322, ny: 0.285 },
    plicaBicipite: { nx: 0.316, ny: 0.292 },
    diametroGomito: { nx: 0.185, ny: 0.343 },
    avambraccio: { nx: 0.174, ny: 0.37 },
    polso: { nx: 0.166, ny: 0.436 },
    diametroPolso: { nx: 0.336, ny: 0.436 },
    radiceCoscia: { nx: 0.238, ny: 0.583 },
    cosciaProssimale: { nx: 0.282, ny: 0.6 },
    plicaInternoCoscia: { nx: 0.248, ny: 0.612 },
    plicaAnterioreCoscia: { nx: 0.229, ny: 0.643 },
    cosciaMedia: { nx: 0.281, ny: 0.643 },
    cosciaDistale: { nx: 0.227, ny: 0.685 },
    sopraPatellare: { nx: 0.28, ny: 0.7 },
    plicaSopraPatellare: { nx: 0.229, ny: 0.7 },
    diametroGinocchio: { nx: 0.28, ny: 0.727 },
    plicaPolpaccio: { nx: 0.24, ny: 0.788 },
    plicaSottoscapolare: { nx: 0.699, ny: 0.298 },
    plicaTricipite: { nx: 0.831, ny: 0.296 },
    plicaPosterioreCoscia: { nx: 0.702, ny: 0.65 },
    polpaccio: { nx: 0.777, ny: 0.788 },
    diametroCaviglia: { nx: 0.785, ny: 0.915 },
  },
  neutral: {
    torace: { nx: 0.255, ny: 0.298 },
    plicaPettorale: { nx: 0.221, ny: 0.275 },
    plicaAscellare: { nx: 0.207, ny: 0.312 },
    vita: { nx: 0.255, ny: 0.395 },
    plicaAddominale: { nx: 0.271, ny: 0.42 },
    addome: { nx: 0.255, ny: 0.435 },
    plicaSovrailiaca: { nx: 0.283, ny: 0.448 },
    fianchi: { nx: 0.255, ny: 0.5 },
    diametroSagittale: { nx: 0.29, ny: 0.428 },
    braccio: { nx: 0.191, ny: 0.28 },
    braccioContratto: { nx: 0.322, ny: 0.28 },
    plicaBicipite: { nx: 0.315, ny: 0.288 },
    diametroGomito: { nx: 0.184, ny: 0.34 },
    avambraccio: { nx: 0.172, ny: 0.368 },
    polso: { nx: 0.165, ny: 0.43 },
    diametroPolso: { nx: 0.337, ny: 0.43 },
    radiceCoscia: { nx: 0.237, ny: 0.57 },
    cosciaProssimale: { nx: 0.281, ny: 0.585 },
    plicaInternoCoscia: { nx: 0.247, ny: 0.598 },
    plicaAnterioreCoscia: { nx: 0.227, ny: 0.635 },
    cosciaMedia: { nx: 0.281, ny: 0.635 },
    cosciaDistale: { nx: 0.227, ny: 0.68 },
    sopraPatellare: { nx: 0.279, ny: 0.695 },
    plicaSopraPatellare: { nx: 0.228, ny: 0.695 },
    diametroGinocchio: { nx: 0.279, ny: 0.722 },
    plicaPolpaccio: { nx: 0.238, ny: 0.785 },
    plicaSottoscapolare: { nx: 0.697, ny: 0.285 },
    plicaTricipite: { nx: 0.826, ny: 0.283 },
    plicaPosterioreCoscia: { nx: 0.701, ny: 0.648 },
    polpaccio: { nx: 0.773, ny: 0.788 },
    diametroCaviglia: { nx: 0.782, ny: 0.915 },
  },
};

/** Elenco canonico delle chiavi ancorate (identico sui tre modelli, presidiato dai test). */
export const CHIAVI_ANCORE = Object.freeze(
  Object.keys(BODY_ANCHORS.male),
) as readonly string[];

export function ancoraPerSito(
  variant: BodyModelVariant,
  key: string,
): AncoraCorpo | null {
  return BODY_ANCHORS[variant]?.[key] ?? null;
}

/** True se il sito vive sulla figura di spalle. */
export function ancoraSulRetro(ancora: AncoraCorpo): boolean {
  return ancora.nx > 0.5;
}

/** Proiezione lineare dell'ancora normalizzata nel riquadro foto del viewBox. */
export function proiettaAncora(
  ancora: AncoraCorpo,
  box: BoxImmagine = BOX_IMMAGINE_DEFAULT,
): { x: number; y: number } {
  return {
    x: box.x + ancora.nx * box.w,
    y: box.y + ancora.ny * box.h,
  };
}

export function bodyModelVariantFromSex(sex: unknown): BodyModelVariant | null {
  if (sex === 'M' || sex === 'male') return 'male'
  if (sex === 'F' || sex === 'female') return 'female'
  return null
}
