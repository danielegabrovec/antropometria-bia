# Antropometria BIA

Strumento **locale** di antropometria e BIA/BIVA per la composizione corporea, su Windows.

[![Licenza](https://img.shields.io/badge/licenza-MIT-2dd4bf?style=flat-square)](LICENSE)
[![Release](https://img.shields.io/github/v/release/danielegabrovec/antropometria-bia?style=flat-square)](https://github.com/danielegabrovec/antropometria-bia/releases)
[![Piattaforma](https://img.shields.io/badge/Windows-x64-0b1220?style=flat-square)](https://github.com/danielegabrovec/antropometria-bia/releases)

<p align="center">
  <img src="build/icon.png" width="128" height="128" alt="Icona di Antropometria BIA">
</p>

**Autore:** [Daniele Gabrovec](https://github.com/danielegabrovec) — Biologo Nutrizionista (Ordine dei Biologi del Triveneto n. TRI_A2489).

> **Non è un dispositivo medico.** Non è marcato CE/FDA, non diagnostica e non sostituisce uno strumento BIA certificato, la plicometria ISAK, la densitometria o il giudizio clinico. Le formule sono stime di letteratura, ciascuna con una popolazione e una finestra di età.

## Cosa fa

- **Cartelle dottore** — all’avvio un wizard crea il profilo (studio condiviso o cartella personale). Nello studio i pazienti sono in comune e su ogni visita compare chi ha misurato; le cartelle personali restano isolate.
- **Pazienti** — anagrafica completa (sesso solo Maschio/Femmina), ricerca, crea/modifica/elimina. In Misura: cerca un paziente già presente o creane uno nuovo.
- **Misura** — tabella + pin sull’omino, solo i siti del metodo/preset scelto; peso e altezza su una riga, R/Z e Xc sulla successiva; formule (pliche, grasso, BSA, peso teorico, BMR, LAF) da menu a tendina. Le visite salvate si riaprono, duplicano, eliminano.
- **Analisi** — composizione da pliche e da BIA, fasce di normalità a **cinque zone** (verde / arancio inf. e sup. / rosso inf. e sup.) con **cuneo** sul valore (massa grassa Gallagher, BMI OMS, WHR, WHtR), confronto formule BMR × LAF LARN 2024, Bland-Altman.
- **BIVA** — piano R/H × Xc/H con assi numerati, ellissi 50 / 75 / 95 % riempite, baricentro della coorte, aree Piccoli (atletica, magra, adiposa, ridotta cellularità). La visita in esame è visibile e cliccabile.
- **Andamenti** — grafici e tabella anche con una visita; clic sulla data apre quella visita in Misura, Analisi o BIVA.
- **Export** — **questa visita** (HTML/PDF/Stampa/JSON, con gauge e grafico BIVA) e **andamenti** del paziente, oltre a cartella intera e anagrafiche (JSON, HTML, PDF, XLS, DOCX). Tutto locale: nessun account, nessun cloud.

## Installazione (Windows)

1. Apri la pagina [Releases](https://github.com/danielegabrovec/antropometria-bia/releases).
2. Scarica `Antropometria-BIA-Setup-1.2.0.exe` (installer NSIS, 64 bit).
3. Scarica anche `Antropometria-BIA-Setup-1.2.0.exe.sha256` e verifica l’integrità con `Get-FileHash .\Antropometria-BIA-Setup-1.2.0.exe -Algorithm SHA256`.
4. Esegui il file (lingua italiana, si può scegliere la cartella).
5. All’avvio accetta l’avvertenza e crea il profilo dottore.

### SmartScreen

L’installer **non è ancora firmato con un certificato Authenticode**. Windows può mostrare «Windows ha protetto il PC». Prosegui solo se il file arriva dalla release ufficiale, il checksum SHA-256 coincide e il repository mostra l’attestazione di provenienza GitHub della build.

### Disinstallazione

Impostazioni Windows → App → Antropometria BIA → Disinstalla. Per evitare perdite accidentali, i JSON restano in `%APPDATA%\Antropometria BIA\antropometria-bia` finché non li cancelli a mano.

Requisiti: Windows 10 o 11, 64 bit.

## Avvio da codice

Serve [Node.js](https://nodejs.org/) 20 o successivo.

```powershell
git clone https://github.com/danielegabrovec/antropometria-bia.git
cd antropometria-bia
npm install
npm test
npm run dev
```

| Comando | Cosa fa |
|---|---|
| `npm run dev` | App Electron in sviluppo |
| `npm test` | Suite Vitest del motore clinico |
| `npm run build` | Bundle in `out/` |
| `npm run dist` | Bundle + installer NSIS in `release/` |

> Prima di `npm run dist` fermare `npm run dev`: i due processi non convivono sullo stesso bundle.

## Layout

Rail a sinistra: Misura, Analisi, BIVA, Andamenti, Pazienti, Dottori, Archivio, Report, Teoria, Opzioni, Info.

Su Analisi, BIVA, Andamenti e Report la barra **Visita in esame** mostra paziente, data, peso e i pulsanti Misura / Analisi / BIVA su ogni visita salvata.

## Motore

Porte da `@nutriva/clinical` (Sun 2003, Janssen 2000, Sergi, Jackson-Pollock, Durnin-Womersley, Gallagher 2000, BIVA Campa). Fuori dalla finestra di età il numero può uscire con riserva. Sesso «Altro» in import non viene convertito in maschio. BCM solo se inserito dallo strumento, mai sintetizzato.

## Autore e licenza

**Antropometria BIA è stata creata da Daniele Gabrovec.**

© 2026 Daniele Gabrovec. Il software è distribuito con [licenza MIT](LICENSE): uso, copia, modifica e redistribuzione sono consentiti mantenendo il copyright e il testo della licenza.

Nessuna garanzia. Non è un dispositivo medico.

## Documentazione della release

- [Changelog](CHANGELOG.md)
- [Evidenze di collaudo 1.2.0](docs/QA-1.2.0.md)
- [Politica di sicurezza](SECURITY.md)
