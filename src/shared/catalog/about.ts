export const APP_NAME = 'Antropometria BIA'
export const APP_VERSION = '1.0.0'
export const ENGINE_VERSIONS = {
  bia: 'bia-core-2.2.0',
  interpretation: 'bia-interpretation-2.3.0',
  plicometria: 'clinical/plicometria-strict',
  energia: 'energia-core-1'
} as const

export const DISCLAIMER = `Antropometria BIA è uno strumento professionale e didattico di calcolo e rappresentazione della composizione corporea.

Non è un dispositivo medico, non è marcato CE/FDA, non sostituisce uno strumento BIA certificato (es. AKERN BIA 101 / Bodygram) né il giudizio clinico, la plicometria ISAK o la densitometria.

Le formule (Sun, Janssen, Sergi, Jackson-Pollock, Durnin-Womersley, Gallagher, BIVA Campa) sono stime di letteratura, ciascuna con una popolazione e una finestra di età. Fuori da quelle finestre il numero può comparire con una riserva: non è una validazione.

I dati restano sul computer (nessun account, nessun cloud). Non usare l'app per diagnosticare, prescrivere o modificare una terapia.`

export const AUTHOR = {
  name: 'Daniele Gabrovec',
  email: 'info.dottdanielegabrovec@gmail.com',
  github: 'https://github.com/danielegabrovec/antropometria-bia'
}
