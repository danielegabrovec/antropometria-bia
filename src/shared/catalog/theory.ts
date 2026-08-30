export const THEORY = `# Motore clinico

Antropometria BIA porta in locale le stesse equazioni usate in studio, ciascuna con fonte e finestra di applicabilità. Il verde compare **solo** se esiste un intervallo documentato.

## Antropometria

- **Jackson-Pollock 3 / 4 / 7** — densità da somma di pliche ed età; JP3 ha siti diversi per sesso; JP4 donna = Jackson-Pollock-Ward. Validazione: uomini 18–61, donne 18–55. Fuori finestra il numero esce con riserva.
- **Durnin & Womersley 4** — logaritmo di bicipite, tricipite, sottoscapolare, sovrailiaca. Validazione 17–72 anni.
- **Siri** (495/d − 450) e **Brozek**. Senza un sito richiesto non si calcola nulla.
- **Gallagher 2000** — fasce «healthy» di massa grassa % per sesso e età 20–79.
- Circonferenze: BMI OMS, WHR, WHtR 0,50, ABSI, indice di conicità, RFM.
- Superficie: DuBois o Mosteller. Artometria AMC/AMA/AFA. Heymsfield 1982. Heath-Carter se i siti del somatotipo sono completi.

Età e sesso sono fotografati sulla visita. Il sesso in anagrafica è **Maschio** o **Femmina**, da selezionare: senza quella scelta non partono pliche, BIA, BMR né la mappa corporea.

## Dispendio energetico

Età = anni compiuti alla **data della visita**, dalla data di nascita. Senza nascita le formule che usano l'età non calcolano.

- **Harris-Benedict** (riv. 1984) e **Mifflin-St Jeor** (1990) — peso, altezza, età, sesso.
- **Katch-McArdle** (370 + 21,6 × FFM) e **Cunningham** (500 + 22 × FFM). Se manca la massa magra si cade su Mifflin, dichiarato in chiaro.
- **TDEE** = BMR × LAF. Coefficienti **LARN 2024** (1,40 sedentario · 1,55 poco attivo · 1,70 attivo · 1,90 molto attivo), più i fattori ACSM/WHO extra.

## BIA e BIVA

Profilo predefinito **AKERN BIA 101 classico**: tetrapolare mano-piede, 50 kHz. Si inseriscono resistenza R/Rz e reattanza Xc.

- Z da R e Xc, angolo di fase atan2(Xc,R)×180/π.
- **Sun 2003** — TBW e FFM (12–94 anni). FM = peso − FFM.
- **Janssen 2000** — SMM e SMI (18–86). Lo SMI non è ASMI/DXA.
- **Sergi 1994** — ECW; coorte pubblicata 21–81 anni. Fuori coorte la stima resta indicativa e viene segnalata. ICW = TBW − ECW solo se ECW < TBW.
- **BIVA** — vettore R/H × Xc/H, ellissi 50/75/95. Coorti Campa 2023, Campa 2019, De Palo 2000.

ECW/TBW e ICW/TBW calcolati da Sun + Sergi sono **stime single-frequency**: non sono equivalenti al valore prodotto da un dispositivo multifrequenza o BIS e non ricevono una fascia universale automatica.

BCM, ECM, Na/K e dati segmentali **non si inventano**.

Antropometria e BIA condividono peso e altezza, mai i KPI di massa grassa.

## Riferimenti essenziali

Sun et al. 2003; Janssen et al. 2000; Kyle/ESPEN 2004; Jackson & Pollock; Durnin & Womersley; Gallagher 2000; Campa et al. 2019 e 2023; Heymsfield 1982; Heath-Carter; Harris-Benedict 1984; Mifflin-St Jeor 1990; Katch-McArdle; Cunningham 1991; LARN 2024.
`
