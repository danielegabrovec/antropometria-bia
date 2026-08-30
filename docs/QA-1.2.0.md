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

- [CI del commit di release](https://github.com/danielegabrovec/antropometria-bia/actions/runs/33315508595): audit, typecheck, 40 test e build superati.
- [Pipeline Release v1.2.0](https://github.com/danielegabrovec/antropometria-bia/actions/runs/33315566917): installer NSIS, checksum, attestazione e pubblicazione superati.
- [Smoke dell'asset pubblico v1.2.0](https://github.com/danielegabrovec/antropometria-bia/actions/runs/33315915338): download, verifica SHA-256, installazione silenziosa, controllo versione, avvio e disinstallazione superati su `windows-latest`.

## Sicurezza

Il controllo ha incluso preload/main IPC, origini renderer, CSP, URL esterni, import/export, persistenza e supply chain. Sono stati corretti contenimento dei percorsi, trust del mittente IPC, limiti import, URL consentiti, azioni GitHub non immutabili e integrità della release.

Resta una limitazione di distribuzione esplicita: non è disponibile un certificato Authenticode. Il pacchetto viene quindi pubblicato non firmato, con checksum SHA-256 e attestazione di provenienza GitHub.

## Pacchetto Windows

Il contenuto `app.asar` della build `win-unpacked` è stato avviato con il runtime Electron ufficiale e ha superato primo avvio e wizard. Il criterio Windows Application Control del computer di collaudo blocca gli eseguibili non firmati e ha impedito l'avvio locale dell'EXE/NSIS; questo limite è stato isolato dalla qualità del pacchetto con un secondo collaudo sul runner Windows pulito.

Il runner ha scaricato dalla release pubblica l'installer da 133.884.070 byte, ha ricalcolato il digest `9d34e715fd0b6f413555a50dba9ac9345d079b60b01fe4537183ec037cba37b6`, installato la versione `1.2.0.0` in una directory temporanea, avviato l'applicazione, verificato che restasse attiva e completato la disinstallazione silenziosa. L'asset distribuito è quindi stato collaudato senza richiedere una build all'utente finale.
