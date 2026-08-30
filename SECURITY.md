# Sicurezza

Antropometria BIA è un’app desktop **offline**. Non elabora pagamenti, non ha account e non espone un server. I profili restano in `%APPDATA%\Antropometria BIA\antropometria-bia`; ogni scrittura crea una copia locale `.bak` recuperabile automaticamente.

I file di libreria importati sono validati, limitati a 50 MB e non possono scegliere percorsi interni dell’app. I collegamenti esterni sono limitati al repository ufficiale e all’indirizzo di supporto.

## Segnalare una vulnerabilità

Scrivere in privato a **info.dottdanielegabrovec@gmail.com** (non aprire una issue pubblica se la falla è sfruttabile).

## Ambito

In ambito: esecuzione di codice non atteso da un file JSON di libreria, path traversal sui dialoghi di export, dipendenze Electron/Chromium.

Fuori ambito: «la percentuale di massa grassa non coincide con il mio AKERN» (è una stima di letteratura, non una CVE).

## Uso clinico

Il software **non è un dispositivo medico**. Nessuna patch di sicurezza autorizza un uso diagnostico o prescrittivo.

## Integrità dei rilasci

Ogni release pubblica include l’installer, il relativo file `.sha256` e un’attestazione GitHub della provenienza della build. L’installer 1.2.0 non è firmato Authenticode: verificare sempre checksum e provenienza prima dell’esecuzione.
