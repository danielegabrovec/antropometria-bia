export const APP_NAME = 'Antropometria BIA'
export const APP_VERSION = '1.2.0'
export const APP_YEAR = 2026

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
  role: 'Biologo Nutrizionista',
  order: 'Ordine dei Biologi del Triveneto n. TRI_A2489',
  email: 'info.dottdanielegabrovec@gmail.com',
  github: 'https://github.com/danielegabrovec/antropometria-bia'
}

export const COPYRIGHT_SHORT = `© ${APP_YEAR} Daniele Gabrovec · Licenza MIT.`

export const COPYRIGHT_LINE = 'Creato da Daniele Gabrovec · © 2026 · Licenza MIT'

export const COPYRIGHT_NOTICE = `Antropometria BIA è stata creata da Daniele Gabrovec.

© ${APP_YEAR} Daniele Gabrovec. Software distribuito con licenza MIT: il copyright e il testo della licenza devono restare inclusi nelle copie sostanziali.`

export const ABOUT = {
  name: APP_NAME,
  version: APP_VERSION,
  tagline: 'Strumento locale di antropometria e BIA/BIVA per la composizione corporea',
  author: AUTHOR,
  copyright: COPYRIGHT_SHORT,
  rights: [
    'Software creato da Daniele Gabrovec.',
    `© ${APP_YEAR} Daniele Gabrovec. Licenza MIT.`,
    'Uso, copia, modifica e redistribuzione sono consentiti alle condizioni della licenza MIT.',
    'Il copyright e il testo della licenza devono accompagnare le copie sostanziali.',
    'Il software è fornito «così com’è», senza garanzia, come indicato nella licenza.',
    'Non è un dispositivo medico e non sostituisce AKERN/Bodygram né il giudizio clinico.'
  ]
}
