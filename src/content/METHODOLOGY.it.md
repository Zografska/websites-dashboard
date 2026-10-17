# Metodologia

> **Prototipo di ricerca.** Ogni claim di questa dashboard è stato rilevato automaticamente. Un claim segnalato non costituisce un accertamento legale che l'azienda abbia violato una norma.

<!-- Italian translation of METHODOLOGY.md. Keep the two files in sync. -->

## Cosa mostra questa dashboard

Per ogni azienda, la dashboard elenca i **claim ambientali e di sostenibilità** trovati in un campione del suo sito web pubblico. Li raggruppa in cinque **aree di revisione** e assegna a ogni claim un **semaforo** che indica dove può essere utile per prima una revisione umana. È uno screening preliminare: i colori non stabiliscono la conformità o la non conformità legale.

## Quadro normativo

**La Direttiva sulle pratiche commerciali sleali (UCPD, Direttiva 2005/29/CE)** è la norma generale dell'UE contro le pratiche commerciali sleali tra imprese e consumatori. Si articola in quattro parti principali:
- un divieto generale delle pratiche sleali (art. 5)
- le azioni ingannevoli (art. 6)
- le omissioni ingannevoli (art. 7)
- una lista nera di pratiche considerate in ogni caso sleali (allegato I)

**La Direttiva (UE) 2024/825, "Responsabilizzazione dei consumatori per la transizione verde" (ECGT)**, modifica la UCPD per contrastare il greenwashing. In particolare:
- introduce definizioni come *asserzione ambientale*, *asserzione ambientale generica* e *marchio di sostenibilità*
- aggiunge nuove ipotesi di azione ingannevole, ad esempio le asserzioni non comprovate sulle prestazioni ambientali future
- aggiunge nuove voci alla lista nera, tra cui:
  - asserzioni ambientali generiche senza un'eccellenza riconosciuta delle prestazioni
  - asserzioni relative all'intero prodotto quando riguardano solo una sua parte
  - asserzioni di impatto neutro o ridotto basate sulla compensazione delle emissioni
  - marchi di sostenibilità non basati su un sistema di certificazione né stabiliti da autorità pubbliche
  - presentare requisiti di legge come una caratteristica distintiva dell'offerta

La ECGT **si applica dal 27 settembre 2026**. La proposta di direttiva sulle asserzioni ambientali (Green Claims Directive) è stata ritirata nel giugno 2025, quindi il quadro UE operativo è la UCPD come modificata dalla ECGT.

**L'Italia** ha recepito la ECGT con il **D.Lgs. 20 febbraio 2026, n. 30**, che modifica il **Codice del Consumo** (D.Lgs. 206/2005). Gli articoli corrispondenti sono:

| UCPD (UE) | Codice del Consumo (IT) | contenuto |
|---|---|---|
| Art. 2 | Art. 18 | definizioni |
| Art. 6 | Art. 21 | azioni ingannevoli |
| Art. 7 | Art. 22 | omissioni ingannevoli |
| Allegato I | Art. 23 | lista nera |

Il riferimento normativo di ogni claim è indicato in entrambe le numerazioni, ad esempio *"UCPD Annex I 4a / Cod. Cons. Art. 23"*. I riferimenti sono corrispondenze indicative tra la categoria del claim e una disposizione. Non sono una valutazione della liceità del singolo claim.

## Raccolta dei dati

- **Aziende:** <!-- TODO: come è stato scelto l'elenco delle aziende e quante sono -->
- **Scraping:** <!-- TODO: quali pagine vengono scansionate (intero sito o sezioni sulla sostenibilità), profondità, strumenti, policy robots.txt -->
- **Frequenza:** il sito di ogni azienda viene scansionato **una sola volta**. La dashboard mostra i claim trovati in quella scansione, dopo l'entrata in applicazione della ECGT il 27 settembre 2026.
- **Stato della scansione:** una scansione può essere `ok`, `partial` (parziale) o `failed` (non riuscita). Una scansione parziale è segnalata nella pagina dell'azienda, perché alcuni claim potrebbero mancare. Un'azienda la cui scansione non è riuscita non ha risultati.

## Rilevamento dei claim

<!-- TODO: descrivere il rilevatore (modello, prompting / RAG sul corpus UCPD + ECGT, come vengono estratte le frasi candidate dalle pagine) -->

A ogni claim rilevato vengono assegnati una **categoria**, uno **stato di ambito** e un **livello di confidenza**.

**Stato di ambito**
- **IN_SCOPE (in ambito):** un'asserzione ambientale disciplinata dalle norme sopra descritte.
- **NEEDS_VERIFICATION (da verificare):** un claim specifico e verificabile (una certificazione nominata, una percentuale dichiarata, un termine definito) la cui sostanza va controllata rispetto alle prove dell'azienda.

I claim giudicati fuori ambito (ad esempio indicazioni nutrizionali o sulla salute, o i codici obbligatori degli organismi di controllo del biologico) vengono scartati prima di arrivare alla dashboard.

**Confidenza:** *alta*, *media* o *bassa*. Indica quanto il rilevatore è sicuro del claim e della sua categoria. **Non è una misura della gravità legale**, quindi compare solo nei dettagli di un claim e non ne determina mai il colore.

## Aree di revisione e semaforo

La categoria assegnata dal rilevatore a ogni claim corrisponde a una di cinque aree di revisione. Una categoria che la dashboard non conosce ancora compare tra gli *Altri claim*.

| categoria | area di revisione | significato | esempio |
|---|---|---|---|
| `generic_green` | Claim generici o assoluti | Formulazioni ambientali generiche senza una comprova specifica | «eco-friendly», «sostenibile», «green» |
| `undefined_natural` | Claim generici o assoluti | "Naturale" senza definizione | «prodotti naturali» |
| `brand_eco_slogan` | Claim generici o assoluti | Linguaggio ecologico inserito in una linea di marchio o in uno slogan | il nome "green" di una linea di prodotti |
| `vague_supply_chain` | Ambito e precisione del claim | Claim generici sull'approvvigionamento o sulle pratiche di produzione | «filiera responsabile» senza un disciplinare nominato |
| `recycled_recyclable` | Ambito e precisione del claim | Contenuto riciclato o riciclabilità | «packaging 100% riciclato» |
| `vague_comparison` | Prove e confronti | Un confronto senza base di riferimento né dati | «a ridotto impatto ambientale» |
| `risk_reduction` | Prove e confronti | Una riduzione quantificata dell'impatto | «-30% di emissioni rispetto al 2020» |
| `certification` | Marchi e neutralità climatica | Una certificazione o un marchio di sostenibilità | logo biologico, ecolabel nominato |
| `named_endorsement` | Marchi e neutralità climatica | Avallo da parte di un'organizzazione nominata | il sigillo di un'associazione nominata |
| `climate_neutral` | Marchi e neutralità climatica | Impatto climatico neutro o ridotto tramite compensazione | «emissioni compensate al 100%» |
| `future_performance` | Prestazioni ambientali future | Un obiettivo ambientale futuro | «zero emissioni nette entro il 2040» |

**Semaforo.** Un claim è **rosso (da rivedere per primo)** quando è IN_SCOPE e rientra nei *Claim generici o assoluti* o nei *Marchi e neutralità climatica*. Sono i tipi di claim che la ECGT vieta in assoluto nell'Allegato I della UCPD (claim generici, marchi non basati su un sistema di certificazione, neutralità basata sulla compensazione). Un'eccezione: una formulazione generica accompagnata da una spiegazione specifica è gialla. Ogni altro claim è **giallo (da chiarire o documentare)**. Un'area prende il colore del suo claim più serio ed è **verde (nessun segnale)** quando non è stato trovato nulla. Il verde non certifica la conformità.

Il riepilogo di ogni azienda indica *"n aree su 5 meritano una revisione"*. Non c'è volutamente una valutazione Alta/Media/Bassa, perché un singolo risultato automatico non deve far sembrare un'azienda accusata.

Le indicazioni mostrate per ogni claim (perché è stato segnalato, cosa verificare, una prima azione suggerita) sono scritte per categoria, non per singolo claim.

## Come leggere la pagina dell'azienda

- **Panoramica:** quante delle cinque aree meritano una revisione, il colore di ogni area e, per l'area selezionata, un claim di esempio con le relative indicazioni.
- **Esempi di claim:** tutti i claim con il loro colore, un breve motivo della revisione e la pagina di origine. Puoi filtrare per area, colore o stato di ambito, e aprire un claim per vedere il testo circostante, l'URL completo, la data della scansione e il riferimento normativo.
- **Come leggerlo:** che cosa significa ogni colore e che cosa copre lo screening.

Il testo dei claim è mostrato nella versione originale italiana e non viene tradotto, perché conta la formulazione esatta.

## Limiti

- **Il rilevamento automatico commette errori.** Produce falsi positivi e falsi negativi, e i claim non sono ancora verificati da persone.
- **Viene analizzato solo il testo dei siti web.** Immagini, PDF, etichette di prodotto e pubblicità non sono coperti, salvo quanto indicato sopra.
- **I colori derivano da una regola fissa,** non da una valutazione umana di ogni claim, quindi a volte differiranno da come un revisore valuterebbe un claim nel suo contesto.
- **Le prestazioni ambientali future non vengono ancora rilevate in modo affidabile,** quindi "Nessuno trovato" in quell'area può solo significare che nessun claim di questo tipo è stato individuato.
- **Ogni azienda viene scansionata una sola volta,** su un campione di pagine. I claim su altre pagine, o aggiunti in seguito, non sono coperti.
- **I riferimenti normativi sono indicativi,** basati sul testo della direttiva UE e sulla corrispondente norma italiana. Non costituiscono consulenza legale.
- **La demo pubblica usa dati sintetici.** <!-- update when real data is loaded -->

## Fonti

- Direttiva 2005/29/CE (UCPD) e Direttiva (UE) 2024/825 (ECGT), Gazzetta ufficiale dell'Unione europea.
- D.Lgs. 20 febbraio 2026, n. 30: https://www.normattiva.it/eli/id/2026/03/09/26G00047/ORIGINAL
- Ritiro da parte della Commissione della proposta di direttiva sulle asserzioni ambientali, giugno 2025.
