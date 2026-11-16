# Metodologia

> **Prototipo di ricerca.** Ogni affermazione di questa dashboard è stata rilevata automaticamente. Un'affermazione segnalata non costituisce un accertamento legale che l'azienda abbia violato una norma.

<!-- Italian translation of METHODOLOGY.md. Keep the two files in sync. -->

## Cosa mostra questa dashboard

Per ogni azienda, la dashboard elenca le **affermazioni ambientali e di sostenibilità** trovate in un campione del suo sito web pubblico. Le raggruppa in cinque **aree di revisione** e assegna a ogni affermazione un **semaforo** che indica dove può essere utile per prima una revisione umana. È uno screening preliminare: i colori non stabiliscono la conformità o la non conformità legale.

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

Il riferimento normativo di ogni affermazione è indicato in entrambe le numerazioni, ad esempio *"UCPD Annex I 4a / Cod. Cons. Art. 23"*. I riferimenti sono corrispondenze indicative tra la categoria dell'affermazione e una disposizione. Non sono una valutazione della liceità della singola affermazione.

## Raccolta dei dati

- **Aziende:** <!-- TODO: come è stato scelto l'elenco delle aziende e quante sono -->
- **Scraping:** <!-- TODO: quali pagine vengono scansionate (intero sito o sezioni sulla sostenibilità), profondità, strumenti, policy robots.txt -->
- **Frequenza:** il sito di ogni azienda è stato scansionato **una sola volta** l'11 di Novembre 2026. La dashboard mostra le affermazioni trovate in quella scansione, dopo l'entrata in applicazione della ECGT il 27 settembre 2026.
- **Stato della scansione:** una scansione può essere `ok`, `partial` (parziale) o `failed` (non riuscita). Una scansione parziale è segnalata nella pagina dell'azienda, perché alcune affermazioni potrebbero mancare. Un'azienda la cui scansione non è riuscita non ha risultati.

## Rilevamento delle affermazioni

<!-- TODO: descrivere il rilevatore (modello, prompting / RAG sul corpus UCPD + ECGT, come vengono estratte le frasi candidate dalle pagine) -->

A ogni affermazione rilevata vengono assegnati una **categoria** e un **livello di confidenza**.

Le affermazioni giudicate fuori ambito (ad esempio indicazioni nutrizionali o sulla salute, o i codici obbligatori degli organismi di controllo del biologico) vengono scartate prima di arrivare alla dashboard.

**Confidenza:** *alta*, *media* o *bassa*. Indica quanto il rilevatore è sicuro dell'affermazione e della sua categoria. **Non è una misura della gravità legale**, quindi compare solo nei dettagli di un'affermazione e non ne determina mai il colore.

## Aree di revisione e semaforo

La categoria assegnata dal rilevatore a ogni affermazione corrisponde a una di cinque aree di revisione. Una categoria che la dashboard non conosce ancora compare tra le *Altre affermazioni*.

| categoria | area di revisione | esempio |
|---|---|---|
| Formulazioni ambientali generiche senza una comprova specifica | Affermazioni generiche o assolute | «eco-friendly», «sostenibile», «green» |
| "Naturale" senza definizione | Affermazioni generiche o assolute | «prodotti naturali» |
| Linguaggio ecologico inserito in una linea di marchio o in uno slogan | Affermazioni generiche o assolute | il nome "green" di una linea di prodotti |
| Affermazioni generiche sull'approvvigionamento o sulle pratiche di produzione | Ambito e precisione dell'affermazione | «filiera responsabile» senza un disciplinare nominato |
| Contenuto riciclato o riciclabilità | Ambito e precisione dell'affermazione | «packaging 100% riciclato» |
| Un confronto senza base di riferimento né dati | Prove e confronti | «a ridotto impatto ambientale» |
| Una riduzione quantificata dell'impatto | Prove e confronti | «-30% di emissioni rispetto al 2020» |
| Una certificazione o un marchio di sostenibilità | Marchi e neutralità climatica | logo biologico, ecolabel nominato |
| Avallo da parte di un'organizzazione nominata | Marchi e neutralità climatica | il sigillo di un'associazione nominata |
| Impatto climatico neutro o ridotto tramite compensazione | Marchi e neutralità climatica | «emissioni compensate al 100%» |
| Un obbligo di legge presentato come caratteristica particolare | Affermazioni generiche o assolute | «non testato sugli animali» su un cosmetico |
| L'intero prodotto o l'intera azienda presentati come green per un solo aspetto | Ambito e precisione dell'affermazione | «azienda green» per una sola misura ecologica |
| Uso di energia rinnovabile | Ambito e precisione dell'affermazione | «energia 100% rinnovabile» |
| Biodegradabile o compostabile | Ambito e precisione dell'affermazione | «biodegradabile» |
| Assenza di sostanze nocive o basse emissioni | Ambito e precisione dell'affermazione | «senza sostanze nocive» |
| Una pratica agricola nominata | Ambito e precisione dell'affermazione | «lotta integrata» |
| Vegano o senza ingredienti di origine animale | Ambito e precisione dell'affermazione | «vegano» |
| Un termine specifico e definito | Ambito e precisione dell'affermazione | «gas refrigerante R290» |
| Un confronto con un'alternativa nominata | Prove e confronti | «consuma il 20% in meno del modello precedente» |
| Consumi ridotti o efficienza | Prove e confronti | «risparmio idrico» |
| Un obiettivo ambientale futuro | Prestazioni ambientali future | «zero emissioni nette entro il 2040» |

**Semaforo.** Ogni affermazione viene valutata nel contesto della sua pagina. È **rossa (da rivedere per prima)** quando la formulazione è vicina a una pratica che la ECGT vieta in assoluto nell'Allegato I della UCPD (affermazioni generiche, «naturale» senza definizione, slogan eco del marchio, filiera vaga, neutralità basata sulla compensazione, l'intero presentato come green per una sola parte, un obbligo di legge presentato come caratteristica), oppure così ampia che è consigliabile una rapida revisione umana. È **gialla (da chiarire o documentare)** quando può essere accettabile ma il suo ambito, la base di riferimento o le prove non sono chiari dalla pagina. Un'area prende il colore della sua affermazione più seria ed è **verde (nessuna affermazione)** quando non è stato trovato nulla. Il verde non certifica la conformità.

Ogni affermazione riceve una propria valutazione: un colore e un breve motivo. La spiegazione del perché una categoria viene segnalata e il consiglio generale che la riguarda sono scritti una volta per categoria. Nella demo sono stati scritti a mano. Per i dati reali verranno da un passaggio di intelligenza artificiale nella pipeline di rilevamento, verificato rispetto al giudizio di esperti. Un'affermazione non ancora valutata singolarmente ricade su una regola semplice basata sul suo tipo: rossa per le affermazioni ambientali generiche, «naturale» senza definizione, slogan eco del marchio, filiera vaga, neutralità climatica, l'intero presentato come green per una sola parte e obblighi di legge presentati come caratteristica; gialla altrimenti.

Il riepilogo di ogni azienda indica *"n aree su 5 meritano una revisione"*. Non c'è volutamente una valutazione Alta/Media/Bassa, perché un singolo risultato automatico non deve far sembrare un'azienda accusata.


## Come leggere la pagina dell'azienda

- **Panoramica:** quante delle cinque aree meritano una revisione, il colore di ogni area e, per l'area selezionata, un'affermazione di esempio con il suo motivo e il consiglio generale per la sua categoria.
- **Esempi di affermazioni:** tutte le affermazioni con il loro colore, un breve motivo della revisione e la pagina di origine. Puoi filtrare per area o colore, e aprire un'affermazione per vedere il testo circostante, l'URL completo, la data della scansione e il riferimento normativo.
- **Come leggerlo:** che cosa significa ogni colore e che cosa copre lo screening.

Il testo delle affermazioni è mostrato nella versione originale italiana e non viene tradotto, perché conta la formulazione esatta.

## Limiti

- **Il rilevamento automatico commette errori.** Produce falsi positivi e falsi negativi, e le affermazioni non sono ancora verificate da persone.
- **Viene analizzato solo il testo dei siti web.** Immagini, PDF, etichette di prodotto e pubblicità non sono coperti, salvo quanto indicato sopra.
- **I colori e le indicazioni sono una valutazione, non un parere legale.** Una valutazione automatica può fraintendere il contesto di un'affermazione, quindi va verificata prima di agire.
- **Le prestazioni ambientali future non vengono ancora rilevate in modo affidabile,** quindi "Nessuno trovato" in quell'area può solo significare che nessuna affermazione di questo tipo è stata individuata.
- **Ogni azienda viene scansionata una sola volta,** su un campione di pagine. Le affermazioni su altre pagine, o aggiunte in seguito, non sono coperte.
- **I riferimenti normativi sono indicativi,** basati sul testo della direttiva UE e sulla corrispondente norma italiana. Non costituiscono consulenza legale.
- **La demo pubblica usa dati sintetici.** <!-- update when real data is loaded -->

## Fonti

- Direttiva 2005/29/CE (UCPD) e Direttiva (UE) 2024/825 (ECGT), Gazzetta ufficiale dell'Unione europea.
- D.Lgs. 20 febbraio 2026, n. 30: https://www.normattiva.it/eli/id/2026/03/09/26G00047/ORIGINAL
- Ritiro da parte della Commissione della proposta di direttiva sulle asserzioni ambientali, giugno 2025.
