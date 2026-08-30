# Changelog

Tutte le modifiche rilevanti di Antropometria BIA sono documentate qui.

## 1.2.0 — 2026-08-30

### Esperienza d'uso

- Nuova gerarchia visiva, tipografia locale, layout responsive e stati di focus/accessibilità più leggibili.
- Contesto della visita coerente fra Misura, Analisi, BIVA, Andamenti e Report.
- Navigazione rapida fra visite e confronti con la precedente o con la prima visita.
- Tabelle antropometriche, mappa corporea e riepiloghi clinici più chiari.
- Stato di salvataggio esplicito, blocco delle azioni mentre l'archivio non è pronto e messaggi di errore persistenti.

### Motore e analisi

- Separazione tracciabile fra stime plicometriche e BIA.
- Fasce documentate per massa grassa, BMI, WHR e WHtR senza intervalli clinici inventati.
- BIVA con ellissi 50/75/95%, aree direzionali, distanza di Mahalanobis e profilo della coorte.
- Andamenti divisi per unità di misura e Bland–Altman disponibile con almeno due visite complete.
- Snapshot di sesso e operatore sulla visita per preservare la correttezza storica.

### Dati ed esportazioni

- Scritture JSON atomiche con copia `.bak` e recupero automatico della copia valida.
- Flush dell'ultimo campo focalizzato anche durante la chiusura dell'app.
- Validazione degli import, limite di 50 MB e normalizzazione sicura di cartelle, pazienti e visite.
- Anteprima Report identica al documento usato da HTML, PDF e stampa.
- PDF/HTML con intestazione dello studio, metodi, avvertenze, gauge e grafico BIVA; XLS e DOCX anagrafici verificabili.

### Sicurezza e distribuzione

- Renderer Electron isolato e sandboxed, CSP offline e IPC consentiti solo dalla finestra principale.
- Blocco di navigazioni, permessi e URL esterni non previsti.
- Contenimento dei percorsi di workspace/export e rimozione degli IPC generici di stampa/PDF.
- Workflow GitHub Actions con azioni bloccate a commit SHA, audit dipendenze, checksum SHA-256 e attestazione di provenienza.
- Aggiornamento a Electron 44 ed ECharts 6.1.0; `npm audit` senza vulnerabilità note.

### Nota firma Windows

L'installer 1.2.0 non è firmato Authenticode. Verificare il file `.sha256` e l'attestazione GitHub della release ufficiale prima dell'esecuzione.
