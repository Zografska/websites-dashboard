# Metodologia

> **Prototipo di ricerca.** Ogni claim di questa dashboard è stato rilevato automaticamente. Un claim segnalato non costituisce un accertamento legale che l'azienda abbia violato una norma.

<!-- Italian translation of METHODOLOGY.md. Keep the two files in sync. -->

## Cosa mostra questa dashboard

Per ogni azienda, la dashboard elenca i **claim ambientali e di sostenibilità** trovati sul suo sito web pubblico. Mostra anche quanti di questi claim erano presenti a ogni scansione e a quali categorie appartengono. L'obiettivo è rendere visibile e tracciabile nel tempo il linguaggio rilevante ai fini del greenwashing, ora che si applicano le nuove norme UE sulle asserzioni ambientali.

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
- **Frequenza:** il sito di ogni azienda viene scansionato **una volta a settimana**. Le prime scansioni sono avvenute dopo l'entrata in applicazione della ECGT, quindi la cronologia mostra i cambiamenti *dal* 27 settembre 2026, non un confronto prima/dopo.
- **Stato della scansione:** una scansione può essere `ok`, `partial` (parziale) o `failed` (non riuscita). Le scansioni non riuscite sono segnate sulla cronologia anziché contate come zero claim.

## Rilevamento dei claim

<!-- TODO: descrivere il rilevatore (modello, prompting / RAG sul corpus UCPD + ECGT, come vengono estratte le frasi candidate dalle pagine) -->

A ogni claim rilevato vengono assegnati una **categoria**, uno **stato di ambito** e un **livello di confidenza**.

**Stato di ambito**
- **IN_SCOPE (in ambito):** un'asserzione ambientale disciplinata dalle norme sopra descritte.
- **NEEDS_VERIFICATION (da verificare):** un probabile claim che richiede un controllo umano, ad esempio una formulazione al limite. Questi claim sono mostrati con un bordo tratteggiato.

I claim giudicati fuori ambito (ad esempio indicazioni nutrizionali o sulla salute, o i codici obbligatori degli organismi di controllo del biologico) vengono scartati prima di arrivare alla dashboard.

**Confidenza:** *alta*, *media* o *bassa*. Indica quanto il rilevatore è sicuro del claim e della sua categoria. **Non è una misura della gravità legale.** Un claim a bassa confidenza può comunque essere serio, e uno ad alta confidenza può essere innocuo.

## Categorie

La tassonomia è condivisa con i gold set delle etichette di prodotto del progetto.

| categoria | significato | esempio |
|---|---|---|
| `generic_green` | Formulazioni ambientali generiche senza una comprova specifica | «eco-friendly», «sostenibile», «green» |
| `certification` | Riferimento a una certificazione o a un marchio di sostenibilità | logo biologico, ecolabel nominato |
| `recycled_recyclable` | Claim sul contenuto riciclato o sulla riciclabilità, compresi gli imballaggi a base biologica | «packaging 100% riciclato» |
| `vague_supply_chain` | Claim generici sull'approvvigionamento o sulle pratiche di produzione | «benessere animale garantito» senza un disciplinare nominato |
| `named_endorsement` | Avallo da parte di un'organizzazione nominata | il sigillo di un'associazione nominata |
| `brand_eco_slogan` | Linguaggio ecologico inserito in una linea di marchio o in uno slogan | il nome "green" di una linea di prodotti |
| `risk_reduction` | Claim di riduzione dell'impatto o del rischio ambientale | «a ridotto impatto ambientale» |

<!-- TODO: add any website-specific categories (e.g. environmental comparison claims) and keep this table in sync with the data file's "categories" list -->

## Come leggere la pagina dell'azienda

- **Contatori di confidenza del rilevamento (A/M/B):** il numero di claim presenti nell'ultima scansione per ciascun livello di confidenza.
- **Striscia dei claim:** tutti i claim mai visti sul sito. I claim non più trovati nell'ultima scansione sono in grigio e segnati come *rimossi*, con la data in cui sono stati visti l'ultima volta. Clicca su una scheda per vedere la pagina di origine, il testo circostante e il riferimento normativo.
- **Cronologia:** il numero di claim trovati a ogni scansione, con i filtri attuali applicati.
- **Ripartizione per categoria:** i claim presenti nell'ultima scansione, raggruppati per categoria e suddivisi per confidenza.

Il testo dei claim è mostrato nella versione originale italiana e non viene tradotto, perché conta la formulazione esatta.

## Limiti

- **Il rilevamento automatico commette errori.** Produce falsi positivi e falsi negativi, e i claim non sono ancora verificati da persone.
- **Viene analizzato solo il testo dei siti web.** Immagini, PDF, etichette di prodotto e pubblicità non sono coperti, salvo quanto indicato sopra.
- **I claim sono associati tra una scansione e l'altra in base al testo normalizzato.** Un claim riformulato appare come un claim rimosso e uno nuovo aggiunto.
- **La cronologia inizia dopo l'entrata in applicazione della ECGT,** quindi non può mostrare come le aziende si sono preparate alle nuove norme.
- **I riferimenti normativi sono indicativi,** basati sul testo della direttiva UE e sulla corrispondente norma italiana. Non costituiscono consulenza legale.
- **La demo pubblica usa dati sintetici.** <!-- update when real data is loaded -->

## Fonti

- Direttiva 2005/29/CE (UCPD) e Direttiva (UE) 2024/825 (ECGT), Gazzetta ufficiale dell'Unione europea.
- D.Lgs. 20 febbraio 2026, n. 30: https://www.normattiva.it/eli/id/2026/03/09/26G00047/ORIGINAL
- Ritiro da parte della Commissione della proposta di direttiva sulle asserzioni ambientali, giugno 2025.
