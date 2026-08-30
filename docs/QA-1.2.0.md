# Evidenze QA — Antropometria BIA 1.2.0

Data del collaudo: 30 agosto 2026. I dati usati sono sintetici e isolati in una cartella temporanea; nessun paziente reale è stato modificato.

## Copertura funzionale

- Primo avvio, avvertenza e wizard studio/cartella personale.
- Creazione e modifica di dottore, paziente e due visite.
- Peso, altezza, circonferenze, sette pliche e ingresso BIA R + Xc.
- Analisi plicometrica, BIA, fasce di normalità, formule BMR/TDEE e Bland–Altman.
- BIVA con ellissi, direzione, percentile e percorso multi-visita.
- Andamenti con grafici separati per kg, percentuale, kg/m², litri, gradi e rapporti.
- Pazienti, Dottori, Archivio, Teoria, Opzioni, Info e navigazione incrociata.
- Duplicazione visita, delta precedente/prima visita e protezioni di eliminazione.
- Persistenza dopo riavvio, inclusa chiusura immediata con un campo numerico ancora focalizzato.

## Esportazioni verificate

- HTML visita: generato realmente, CSP offline presente e valori/metodi/BIVA riletti dal file.
- JSON visita: generato realmente e riletto con parsing strutturale.
- PDF visita: A4, tre pagine, grafica e leggibilità ispezionate pagina per pagina; nessun JavaScript incorporato.
- XLS anagrafiche: SpreadsheetML con fogli Dottori e Pazienti e dati sintetici riletti.
- DOCX anagrafiche: pacchetto Office Open XML valido con relazioni e `word/document.xml` riletti.
- La preview Report usa lo stesso HTML di PDF, HTML e stampa.

## Gate automatici

```text
npm test                  40/40 test passati
npm run typecheck         passato
npm run build             passato
npm audit --audit-level=high   0 vulnerabilità
git diff --check          passato
npm run dist:dir          passato
```

## Sicurezza

Il controllo ha incluso preload/main IPC, origini renderer, CSP, URL esterni, import/export, persistenza e supply chain. Sono stati corretti contenimento dei percorsi, trust del mittente IPC, limiti import, URL consentiti, azioni GitHub non immutabili e integrità della release.

Resta una limitazione di distribuzione esplicita: non è disponibile un certificato Authenticode. Il pacchetto viene quindi pubblicato non firmato, con checksum SHA-256 e attestazione di provenienza GitHub.

## Pacchetto Windows

Il contenuto `app.asar` della build `win-unpacked` è stato avviato con il runtime Electron ufficiale e ha superato primo avvio e wizard. Il criterio Windows Application Control del computer di collaudo blocca gli eseguibili locali appena confezionati e impedisce l'esecuzione locale dell'EXE/NSIS non firmato; per questo la generazione finale dell'installer è affidata al runner Windows pulito della workflow Release. La release è pubblicabile solo se quel job completa test, build, checksum, attestazione e upload dell'installer.
