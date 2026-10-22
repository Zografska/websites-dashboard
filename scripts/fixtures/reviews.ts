// Hand-written per-claim assessments for the demo sentences in pools.ts (PLAN_V2 §3–4).
// They stand in for the pipeline's AI assessment step: colour by judgement, advice per claim.
// Every POOL text must have an entry (checked by generate-fixtures.test.ts).
import type { ClaimAdvice, ClaimReview, Light, Scope } from '../../src/lib/types'

type Text = [reason: string, why: string, verify: string[], action: string]
export type DemoReview = { scope: Scope; review: ClaimReview }

const advice = ([reason, why, verify, action]: Text): ClaimAdvice => ({ reason, why, verify, action })
const r = (scope: Scope, light: Light, en: Text, it: Text): DemoReview => ({ scope, review: { light, en: advice(en), it: advice(it) } })
const IN = 'IN_SCOPE'
const NV = 'NEEDS_VERIFICATION'

export const REVIEWS: Record<string, DemoReview> = {
  // ---------- generic_green ----------
  'Prodotto eco-friendly': r(
    IN,
    'red',
    [
      'Generic "eco-friendly" with no stated benefit or evidence',
      '"Eco-friendly" presents the whole product as good for the environment without saying in what way. It is the kind of generic claim the EU rules now ban unless excellent environmental performance can be shown.',
      ['Which environmental aspect of the product "eco-friendly" is meant to describe', 'Whether that aspect is measured and documented'],
      'Replace "eco-friendly" with the specific feature (e.g. recycled packaging, lower energy use) and say where the proof can be found.',
    ],
    [
      '"Eco-friendly" generico, senza beneficio dichiarato né prove',
      '"Eco-friendly" presenta l\'intero prodotto come positivo per l\'ambiente senza dire in che modo. È il tipo di claim generico che le norme UE ora vietano, salvo prova di prestazioni ambientali eccellenti.',
      ['Quale aspetto ambientale del prodotto "eco-friendly" intende descrivere', "Se quell'aspetto è misurato e documentato"],
      'Sostituire "eco-friendly" con la caratteristica specifica (ad es. imballaggio riciclato, minor consumo di energia) e indicare dove trovare le prove.',
    ],
  ),
  'Packaging 100% sostenibile': r(
    IN,
    'red',
    [
      'Absolute "100% sustainable" with no definition of sustainability',
      '"100% sostenibile" claims complete sustainability for the packaging, but sustainability has no single measurable meaning. The percentage suggests a precision the word cannot carry.',
      ['What the firm means by sustainable packaging (recycled, recyclable, lighter, certified?)', 'Whether every packaging component meets that definition'],
      'State the concrete property and its share, e.g. "packaging made of 80% recycled cardboard".',
    ],
    [
      '"100% sostenibile" assoluto, senza definire la sostenibilità',
      '"100% sostenibile" attribuisce all\'imballaggio una sostenibilità totale, ma la sostenibilità non ha un significato unico e misurabile. La percentuale suggerisce una precisione che la parola non può sostenere.',
      ["Che cosa intende l'azienda per imballaggio sostenibile (riciclato, riciclabile, più leggero, certificato?)", "Se ogni componente dell'imballaggio rispetta quella definizione"],
      'Indicare la proprietà concreta e la sua quota, ad es. "imballaggio in cartone riciclato all\'80%".',
    ],
  ),
  "Rispettiamo l'ambiente in ogni fase della produzione": r(
    IN,
    'red',
    [
      'Absolute, company-wide wording covering every production stage; no evidence beside the claim',
      'The sentence covers all production stages at once ("in ogni fase"), so it is both generic and absolute. A reader cannot tell what respecting the environment involves or how it is checked.',
      ['Which production stages have documented environmental measures', 'Whether any stage (e.g. transport, suppliers) is not covered'],
      'Describe the specific measures per stage, or limit the claim to the stages that are documented.',
    ],
    [
      'Formulazione assoluta, riferita a tutta l\'azienda e a ogni fase produttiva; nessuna prova accanto al claim',
      'La frase copre tutte le fasi produttive insieme ("in ogni fase"), quindi è generica e assoluta. Il lettore non può capire che cosa comporti rispettare l\'ambiente né come venga verificato.',
      ['Quali fasi produttive hanno misure ambientali documentate', 'Se qualche fase (ad es. trasporti, fornitori) non è coperta'],
      'Descrivere le misure specifiche per ciascuna fase, oppure limitare il claim alle fasi documentate.',
    ],
  ),
  'Una scelta green per il pianeta': r(
    IN,
    'red',
    [
      'Broad "green choice for the planet" with no specific benefit',
      'The wording links the product to the planet as a whole but names no concrete benefit. It invites consumers to choose the product for environmental reasons that are never stated.',
      ['Which concrete benefit justifies calling the product a green choice', 'Whether that benefit holds compared with similar products'],
      'Name the benefit and the comparison behind it, or remove the phrase.',
    ],
    [
      '"Scelta green per il pianeta" generica, senza un beneficio specifico',
      'La formulazione collega il prodotto al pianeta nel suo insieme ma non indica alcun beneficio concreto. Invita a scegliere il prodotto per ragioni ambientali che non vengono mai dichiarate.',
      ['Quale beneficio concreto giustifica la definizione di scelta green', 'Se quel beneficio vale rispetto a prodotti simili'],
      'Indicare il beneficio e il confronto su cui si basa, oppure eliminare la frase.',
    ],
  ),
  'Azienda sostenibile dal 1985': r(
    IN,
    'yellow',
    [
      'Company-level "sustainable" with a date but no content',
      'The date gives the claim an air of track record, but "sustainable" is not explained. It reads more as corporate identity than as a product claim, which is why it is yellow rather than red.',
      ["What the firm's sustainability record since 1985 consists of", 'Whether a sustainability report or similar document supports it'],
      "Link the phrase to the firm's sustainability report, or replace it with concrete milestones.",
    ],
    [
      '"Sostenibile" riferito all\'azienda, con una data ma senza contenuto',
      'La data dà al claim un\'aria di continuità, ma "sostenibile" non viene spiegato. Si legge più come identità aziendale che come claim di prodotto, per questo è giallo e non rosso.',
      ["In che cosa consiste il percorso di sostenibilità dell'azienda dal 1985", 'Se un bilancio di sostenibilità o un documento simile lo supporta'],
      "Collegare la frase al bilancio di sostenibilità dell'azienda, oppure sostituirla con tappe concrete.",
    ],
  ),
  'Energia 100% rinnovabile nei nostri stabilimenti': r(
    NV,
    'yellow',
    [
      'Specific renewable-energy share; check the source and which plants are covered',
      "The claim is specific and checkable: a 100% share, limited to the firm's plants. The open questions are how the energy is sourced (own production or certificates) and whether all plants are included.",
      ['Whether the 100% comes from own generation, supply contracts or guarantees of origin', 'Whether every plant and the whole year are covered'],
      'State the source of the renewable energy and the reference year next to the claim.',
    ],
    [
      'Quota specifica di energia rinnovabile; verificare la fonte e quali stabilimenti sono coperti',
      "Il claim è specifico e verificabile: una quota del 100%, limitata agli stabilimenti dell'azienda. Le domande aperte sono come viene ottenuta l'energia (produzione propria o certificati) e se sono inclusi tutti gli stabilimenti.",
      ['Se il 100% deriva da produzione propria, contratti di fornitura o garanzie di origine', "Se sono coperti tutti gli stabilimenti e l'intero anno"],
      "Indicare accanto al claim la fonte dell'energia rinnovabile e l'anno di riferimento.",
    ],
  ),
  "Amici dell'ambiente, ogni giorno": r(
    IN,
    'red',
    [
      'Slogan-like generic claim with no content',
      '"Friends of the environment, every day" is a pure image claim: it states an environmental virtue without any fact a consumer could check.',
      ['Whether a specific practice is meant', 'Where the slogan appears, and on which products'],
      'Remove the phrase, or pair it with a concrete, documented practice.',
    ],
    [
      'Claim generico in forma di slogan, privo di contenuto',
      '"Amici dell\'ambiente, ogni giorno" è un claim puramente d\'immagine: afferma una virtù ambientale senza alcun fatto che il consumatore possa verificare.',
      ['Se si intende una pratica specifica', 'Dove compare lo slogan e su quali prodotti'],
      'Eliminare la frase, oppure abbinarla a una pratica concreta e documentata.',
    ],
  ),
  'Prodotti naturali e sostenibili': r(
    IN,
    'red',
    [
      '"Natural" and "sustainable" together, neither defined',
      'Two undefined terms are combined and applied to the whole product range. Neither "natural" nor "sustainable" is explained, so the claim cannot be checked.',
      ['What share of ingredients is of natural origin, and how it is calculated', 'What "sustainable" refers to for these products'],
      'Define both terms beside the claim, e.g. "95% ingredients of natural origin", or remove them.',
    ],
    [
      '"Naturali" e "sostenibili" insieme, nessuno dei due definito',
      'Due termini non definiti sono combinati e riferiti all\'intera gamma. Né "naturali" né "sostenibili" vengono spiegati, quindi il claim non è verificabile.',
      ['Quale quota di ingredienti è di origine naturale e come viene calcolata', 'A che cosa si riferisce "sostenibili" per questi prodotti'],
      'Definire entrambi i termini accanto al claim, ad es. "95% di ingredienti di origine naturale", oppure eliminarli.',
    ],
  ),

  // ---------- certification ----------
  'Carta certificata FSC®': r(
    NV,
    'yellow',
    [
      'Named third-party scheme; check the certificate and what it covers',
      'FSC is a recognised certification scheme, which is a strong signal. What needs checking is that a valid certificate covers this paper and that the FSC labelling rules are followed.',
      ['The FSC certificate number and its validity', 'Whether the claim matches the FSC category actually certified (100%, Mix, Recycled)'],
      'Show the FSC licence code next to the logo and keep the certificate on file.',
    ],
    [
      'Schema di terza parte nominato; verificare il certificato e che cosa copre',
      "FSC è un sistema di certificazione riconosciuto, un segnale forte. Va verificato che un certificato valido copra questa carta e che siano rispettate le regole d'uso del marchio FSC.",
      ['Il numero del certificato FSC e la sua validità', 'Se il claim corrisponde alla categoria FSC effettivamente certificata (100%, Misto, Riciclato)'],
      'Riportare il codice di licenza FSC accanto al logo e conservare il certificato.',
    ],
  ),
  'Prodotto con marchio Ecolabel UE': r(
    NV,
    'yellow',
    [
      'Official EU label; check that the licence covers this product',
      'The EU Ecolabel is an official scheme and one of the few that can support broad environmental claims. The check is simply that this product holds a current licence.',
      ['The Ecolabel licence number and the product group it covers', 'Whether the licence is still valid'],
      'Add the licence number next to the label.',
    ],
    [
      'Marchio ufficiale UE; verificare che la licenza copra questo prodotto',
      "L'Ecolabel UE è un sistema ufficiale e uno dei pochi che possono sostenere claim ambientali ampi. La verifica riguarda semplicemente il possesso di una licenza valida per questo prodotto.",
      ['Il numero di licenza Ecolabel e il gruppo di prodotti coperto', 'Se la licenza è ancora valida'],
      'Aggiungere il numero di licenza accanto al marchio.',
    ],
  ),
  'Ingredienti da agricoltura biologica certificata': r(
    NV,
    'yellow',
    [
      'Organic certification; check which ingredients and which control body',
      'Organic farming is regulated by EU law, so the claim is checkable. It should be clear whether all ingredients or only some are organic.',
      ['Which ingredients are organic and their share of the product', 'The control body and certificate behind the claim'],
      'State the organic share (e.g. "70% of agricultural ingredients") and the control-body code.',
    ],
    [
      'Certificazione biologica; verificare quali ingredienti e quale organismo di controllo',
      "L'agricoltura biologica è regolata dal diritto UE, quindi il claim è verificabile. Deve essere chiaro se sono biologici tutti gli ingredienti o solo alcuni.",
      ['Quali ingredienti sono biologici e la loro quota nel prodotto', "L'organismo di controllo e il certificato su cui si basa il claim"],
      'Indicare la quota biologica (ad es. "70% degli ingredienti agricoli") e il codice dell\'organismo di controllo.',
    ],
  ),
  'Stabilimento certificato ISO 14001': r(
    NV,
    'yellow',
    [
      'Site management certificate; check it is not read as a product benefit',
      'ISO 14001 certifies how a site manages its environmental impacts, not the environmental performance of a product. The claim is accurate if the certificate exists, but it may suggest more than it covers.',
      ['The certificate, the certifying body and which site it covers', 'Whether the claim is placed so that it implies a product benefit'],
      'Keep the claim at site level and avoid presenting it as a property of the product.',
    ],
    [
      'Certificato di gestione dello stabilimento; verificare che non venga letto come beneficio di prodotto',
      'ISO 14001 certifica come uno stabilimento gestisce i propri impatti ambientali, non la prestazione ambientale di un prodotto. Il claim è corretto se il certificato esiste, ma può suggerire più di quanto copra.',
      ["Il certificato, l'ente certificatore e lo stabilimento coperto", 'Se il claim è collocato in modo da suggerire un beneficio di prodotto'],
      'Mantenere il claim a livello di stabilimento ed evitare di presentarlo come proprietà del prodotto.',
    ],
  ),
  "Siamo un'azienda certificata B Corp": r(
    NV,
    'yellow',
    [
      'Company-level certification; check its status and how it is presented',
      'B Corp is a third-party certification of the company as a whole, covering social as well as environmental criteria. It is checkable, but it does not certify any specific product.',
      ['Current B Corp status and score', 'Whether the claim appears next to products as if it certified them'],
      'Link to the public B Corp profile and keep the claim at company level.',
    ],
    [
      'Certificazione a livello aziendale; verificare lo stato e come viene presentata',
      "B Corp è una certificazione di terza parte dell'azienda nel suo insieme, con criteri sociali oltre che ambientali. È verificabile, ma non certifica alcun prodotto specifico.",
      ['Lo stato attuale della certificazione B Corp e il punteggio', 'Se il claim compare accanto ai prodotti come se li certificasse'],
      'Collegare il profilo pubblico B Corp e mantenere il claim a livello aziendale.',
    ],
  ),
  'Marchio VerdeGaranzia per la sostenibilità': r(
    IN,
    'red',
    [
      'Sustainability label with no visible certification scheme behind it',
      '"VerdeGaranzia" looks like a sustainability label, but no independent scheme or public authority is named. Since the ECGT rules, labels that are not based on a certification scheme are banned.',
      ['Who owns the label and who checks compliance with it', 'Whether it meets the definition of a certification scheme (open, verified by a third party)'],
      'Drop the label unless it is a third-party certification; if it is, name the scheme and its owner.',
    ],
    [
      'Marchio di sostenibilità senza un sistema di certificazione visibile',
      '"VerdeGaranzia" sembra un marchio di sostenibilità, ma non viene nominato alcun sistema indipendente né autorità pubblica. Con le norme ECGT, i marchi non basati su un sistema di certificazione sono vietati.',
      ['Chi possiede il marchio e chi ne verifica il rispetto', 'Se rispetta la definizione di sistema di certificazione (aperto, verificato da terzi)'],
      'Eliminare il marchio, salvo che si tratti di una certificazione di terza parte; in tal caso indicare lo schema e il titolare.',
    ],
  ),
  'Certificazione ambientale di filiera': r(
    IN,
    'red',
    [
      '"Environmental certification" with no named scheme or certifier',
      'The claim mentions a certification but not which one, who issued it or what it covers. A consumer cannot check it, and it may amount to a self-declared label.',
      ['The name of the scheme and the certifying body', 'Which part of the supply chain and which products it covers'],
      'Name the certification and the certifier, or remove the claim.',
    ],
    [
      '"Certificazione ambientale" senza schema o ente certificatore indicati',
      "Il claim cita una certificazione ma non dice quale, chi l'ha rilasciata né che cosa copre. Il consumatore non può verificarla e potrebbe trattarsi di un'autodichiarazione.",
      ["Il nome dello schema e l'ente certificatore", 'Quale parte della filiera e quali prodotti copre'],
      "Indicare la certificazione e l'ente certificatore, oppure eliminare il claim.",
    ],
  ),
  'Etichetta Eco Qualità 2026': r(
    IN,
    'red',
    [
      'Label that looks self-awarded; no certification scheme named',
      '"Eco Qualità 2026" has the form of an award or label, but there is no sign of an independent scheme behind it. Self-created sustainability labels are now prohibited.',
      ['Who created the label, and on what criteria', 'Whether an independent body checks those criteria'],
      'Remove the label unless it is backed by a third-party scheme.',
    ],
    [
      "Etichetta che sembra autoattribuita; nessuno schema di certificazione indicato",
      '"Eco Qualità 2026" ha la forma di un premio o di un\'etichetta, ma non c\'è traccia di un sistema indipendente alle spalle. Le etichette di sostenibilità autoprodotte sono ora vietate.',
      ["Chi ha creato l'etichetta e con quali criteri", 'Se un organismo indipendente verifica quei criteri'],
      "Eliminare l'etichetta, salvo che sia sostenuta da uno schema di terza parte.",
    ],
  ),

  // ---------- recycled_recyclable ----------
  'Packaging 100% riciclato': r(
    NV,
    'yellow',
    [
      'Specific recycled share; check that it covers every component',
      'A 100% recycled claim is precise, but packaging often has several parts (box, film, label). The claim holds only if all of them are made entirely of recycled material.',
      ['Recycled content of each packaging component', 'Supplier documentation for the recycled material'],
      'If some parts are not recycled, name the component, e.g. "box made of 100% recycled cardboard".',
    ],
    [
      'Quota di riciclato specifica; verificare che copra ogni componente',
      "Un claim di riciclato al 100% è preciso, ma l'imballaggio ha spesso più parti (scatola, film, etichetta). Il claim regge solo se sono tutte interamente in materiale riciclato.",
      ["Il contenuto riciclato di ogni componente dell'imballaggio", 'La documentazione del fornitore sul materiale riciclato'],
      'Se alcune parti non sono riciclate, indicare il componente, ad es. "scatola in cartone riciclato al 100%".',
    ],
  ),
  'Bottiglia in plastica riciclata al 50%': r(
    NV,
    'yellow',
    [
      'Clear recycled share and component; check how it is measured',
      'The claim names the component (the bottle) and the share (50%), which is what a good claim does. What remains is to confirm how the share is measured and documented.',
      ['Whether the 50% is by weight, and per bottle or on average', 'Documentation of the recycled plastic (e.g. supplier declarations)'],
      'Keep the claim and have the supplier documentation ready.',
    ],
    [
      'Quota e componente chiari; verificare come viene misurata la quota',
      'Il claim indica il componente (la bottiglia) e la quota (50%), come dovrebbe fare un buon claim. Resta da confermare come la quota viene misurata e documentata.',
      ['Se il 50% è in peso, e per bottiglia o in media', 'La documentazione della plastica riciclata (ad es. dichiarazioni del fornitore)'],
      'Mantenere il claim e tenere pronta la documentazione del fornitore.',
    ],
  ),
  'Confezione completamente riciclabile': r(
    IN,
    'yellow',
    [
      '"Fully recyclable" depends on local collection and on every component',
      'Recyclability is only real if the packaging can actually be sorted and recycled where it is sold. "Completely" requires every component, including labels and closures, to be recyclable.',
      ['Whether all components are recyclable in Italian separate collection', 'Whether disposal instructions are given to consumers'],
      'Add disposal instructions per component, and qualify the claim if any part is not recyclable.',
    ],
    [
      '"Completamente riciclabile" dipende dalla raccolta locale e da ogni componente',
      "La riciclabilità è reale solo se l'imballaggio può essere effettivamente raccolto e riciclato dove viene venduto. \"Completamente\" richiede che ogni componente, comprese etichette e chiusure, sia riciclabile.",
      ['Se tutti i componenti sono riciclabili nella raccolta differenziata italiana', 'Se ai consumatori vengono date istruzioni di smaltimento'],
      'Aggiungere le istruzioni di smaltimento per componente e qualificare il claim se una parte non è riciclabile.',
    ],
  ),
  'Vaschetta in bioplastica compostabile': r(
    NV,
    'yellow',
    [
      'Compostable claim; check the standard and where it can be composted',
      '"Compostable" can be checked against the EN 13432 standard, but industrial and home composting differ. Consumers need to know where to dispose of the tray.',
      ['Certification to EN 13432 (or equivalent)', 'Whether it is industrially or home compostable, and accepted in local organic waste'],
      'Name the standard and tell consumers which bin to use.',
    ],
    [
      'Claim di compostabilità; verificare lo standard e dove può essere compostata',
      '"Compostabile" è verificabile rispetto alla norma EN 13432, ma il compostaggio industriale e quello domestico sono diversi. Il consumatore deve sapere dove conferire la vaschetta.',
      ['La certificazione secondo EN 13432 (o equivalente)', "Se è compostabile industrialmente o a casa, e se è accettata nell'umido locale"],
      'Indicare lo standard e dire ai consumatori in quale contenitore conferirla.',
    ],
  ),
  'Carta riciclata post-consumo': r(
    NV,
    'yellow',
    [
      'Type of recycled paper stated; the share is missing',
      'Saying the paper is post-consumer recycled is specific, but the claim does not say how much of the paper is recycled.',
      ['The post-consumer recycled share', 'Supplier certification (e.g. FSC Recycled, Blauer Engel)'],
      'Add the percentage of post-consumer fibre.',
    ],
    [
      'Tipo di carta riciclata indicato; manca la quota',
      'Dire che la carta è riciclata post-consumo è specifico, ma il claim non dice quanta parte della carta sia riciclata.',
      ['La quota di riciclato post-consumo', 'La certificazione del fornitore (ad es. FSC Recycled, Blauer Engel)'],
      'Aggiungere la percentuale di fibra post-consumo.',
    ],
  ),
  'Imballaggi riciclabili nella raccolta della carta': r(
    NV,
    'yellow',
    [
      'Recyclability with a disposal route; check every component',
      'The claim already tells consumers where to dispose of the packaging, which is good practice. It holds if all of the packaging, including any plastic windows or coatings, can go in paper collection.',
      ['Whether coatings, windows or adhesives prevent paper recycling', 'Whether the claim applies to all of the product\'s packaging'],
      'Keep the claim and name any component that must be separated.',
    ],
    [
      'Riciclabilità con modalità di smaltimento indicata; verificare ogni componente',
      "Il claim dice già ai consumatori dove conferire l'imballaggio, che è una buona pratica. Regge se tutto l'imballaggio, comprese eventuali finestre in plastica o rivestimenti, può andare nella raccolta della carta.",
      ['Se rivestimenti, finestre o adesivi impediscono il riciclo della carta', "Se il claim vale per tutto l'imballaggio del prodotto"],
      'Mantenere il claim e indicare i componenti da separare.',
    ],
  ),
  'Tappo in materiale di origine vegetale': r(
    IN,
    'yellow',
    [
      'Plant-based cap: the environmental benefit is implied, not stated',
      'Being plant-based does not by itself make a material better for the environment. The claim invites an inference the firm may not be able to support.',
      ['The bio-based share of the cap and how it is measured', 'Whether the cap is recyclable or compostable, and better than the previous one'],
      'State the bio-based share and the actual benefit, or present it as a material fact without environmental framing.',
    ],
    [
      'Tappo di origine vegetale: il beneficio ambientale è suggerito, non dichiarato',
      "Essere di origine vegetale non rende di per sé un materiale migliore per l'ambiente. Il claim invita a una deduzione che l'azienda potrebbe non essere in grado di sostenere.",
      ['La quota di origine biologica del tappo e come viene misurata', 'Se il tappo è riciclabile o compostabile, e migliore del precedente'],
      'Indicare la quota di origine biologica e il beneficio effettivo, oppure presentarlo come dato sul materiale senza connotazioni ambientali.',
    ],
  ),
  'Etichetta stampata su carta riciclata': r(
    NV,
    'yellow',
    [
      'Claim about one minor component; check it is not read as product-wide',
      'The label is a small part of the product. The claim is fine if accurate, but it should not suggest that the product or its whole packaging is recycled.',
      ['Recycled share of the label paper', 'How prominent the claim is compared with the rest of the packaging'],
      'Keep the claim small and clearly tied to the label.',
    ],
    [
      "Claim su un componente secondario; verificare che non venga letto come riferito all'intero prodotto",
      "L'etichetta è una piccola parte del prodotto. Il claim va bene se è esatto, ma non dovrebbe suggerire che il prodotto o l'intero imballaggio siano riciclati.",
      ["La quota di riciclato della carta dell'etichetta", 'Quanto è evidente il claim rispetto al resto della confezione'],
      "Mantenere il claim discreto e chiaramente riferito all'etichetta.",
    ],
  ),

  // ---------- vague_supply_chain ----------
  'Benessere animale garantito': r(
    IN,
    'red',
    [
      'Absolute "guaranteed" animal welfare with no standard named',
      '"Guaranteed" is an absolute promise, yet no welfare standard, scheme or inspection body is mentioned. Consumers cannot know what is guaranteed, or by whom.',
      ['Which welfare standard the farms follow and who audits them', 'Whether it applies to all supplying farms'],
      'Name the standard or certification, or scale the claim back to what is documented.',
    ],
    [
      'Benessere animale "garantito" in modo assoluto, senza standard indicato',
      '"Garantito" è una promessa assoluta, ma non viene citato alcuno standard, schema o organismo di controllo. Il consumatore non può sapere che cosa sia garantito, né da chi.',
      ['Quale standard di benessere seguono gli allevamenti e chi li verifica', 'Se vale per tutti gli allevamenti fornitori'],
      'Indicare lo standard o la certificazione, oppure ridimensionare il claim a ciò che è documentato.',
    ],
  ),
  'Filiera controllata e responsabile': r(
    IN,
    'yellow',
    [
      '"Controlled and responsible" supply chain with no criteria',
      'The phrase suggests oversight and good practice but does not say what is controlled, against which criteria or by whom.',
      ['What controls are in place and who carries them out', 'Which products and suppliers are covered'],
      'Describe the controls and the share of the supply chain covered, or name the scheme.',
    ],
    [
      'Filiera "controllata e responsabile" senza criteri',
      "L'espressione suggerisce controlli e buone pratiche ma non dice che cosa venga controllato, secondo quali criteri né da chi.",
      ['Quali controlli sono in atto e chi li effettua', 'Quali prodotti e fornitori sono coperti'],
      'Descrivere i controlli e la quota di filiera coperta, oppure indicare lo schema.',
    ],
  ),
  'Materie prime da fonti responsabili': r(
    IN,
    'yellow',
    [
      '"Responsible sources" not defined; share of materials unclear',
      '"Responsible" has no fixed meaning, and the claim does not say whether all raw materials or only some come from such sources.',
      ['The sourcing policy or standard behind "responsible"', 'The share of raw materials that meets it'],
      'State the standard and the share, e.g. "90% of cocoa from certified sources".',
    ],
    [
      '"Fonti responsabili" non definite; quota delle materie prime poco chiara',
      '"Responsabili" non ha un significato preciso e il claim non dice se tutte le materie prime o solo alcune provengano da tali fonti.',
      ['La politica o lo standard di approvvigionamento dietro "responsabili"', 'La quota di materie prime che lo rispetta'],
      'Indicare lo standard e la quota, ad es. "90% del cacao da fonti certificate".',
    ],
  ),
  'Coltivato nel rispetto della natura': r(
    IN,
    'yellow',
    [
      'Farming practice described only in general terms',
      '"Grown with respect for nature" suggests careful farming but names no practice (organic, integrated, reduced pesticides). It sits between a generic claim and a practice claim.',
      ['Which farming practices are used', 'Whether they are certified or audited'],
      'Name the practice, e.g. "integrated production certified under SQNPI".',
    ],
    [
      'Pratica agricola descritta solo in termini generali',
      '"Coltivato nel rispetto della natura" suggerisce un\'agricoltura attenta ma non indica alcuna pratica (biologica, integrata, uso ridotto di pesticidi). Si colloca tra un claim generico e un claim su una pratica.',
      ['Quali pratiche agricole vengono utilizzate', 'Se sono certificate o verificate'],
      'Indicare la pratica, ad es. "produzione integrata certificata SQNPI".',
    ],
  ),
  'Fornitori selezionati per il loro impegno ambientale': r(
    IN,
    'yellow',
    [
      'Supplier selection criteria not stated',
      'The claim implies an environmental screening of suppliers, but the criteria and how they are checked are not visible.',
      ['The environmental criteria used to select suppliers', 'How, and how often, compliance is checked'],
      'Publish the selection criteria or summarise them next to the claim.',
    ],
    [
      'Criteri di selezione dei fornitori non indicati',
      'Il claim suggerisce una selezione ambientale dei fornitori, ma i criteri e il modo in cui vengono verificati non sono visibili.',
      ['I criteri ambientali usati per selezionare i fornitori', 'Come e con quale frequenza ne viene verificato il rispetto'],
      'Pubblicare i criteri di selezione o riassumerli accanto al claim.',
    ],
  ),
  'Pesca responsabile': r(
    IN,
    'yellow',
    [
      '"Responsible fishing" without a named scheme (e.g. MSC)',
      'Responsible fishing is usually backed by a scheme such as MSC. Without one, the claim cannot be checked.',
      ['Whether the fish is certified (e.g. MSC) and under which certificate', 'Which species and fisheries the claim covers'],
      'Name the certification and show its code, or describe the fishing method.',
    ],
    [
      '"Pesca responsabile" senza uno schema indicato (ad es. MSC)',
      'La pesca responsabile è di solito sostenuta da uno schema come MSC. Senza di esso, il claim non è verificabile.',
      ['Se il pesce è certificato (ad es. MSC) e con quale certificato', 'Quali specie e attività di pesca copre il claim'],
      'Indicare la certificazione e il suo codice, oppure descrivere il metodo di pesca.',
    ],
  ),
  "Allevamenti attenti all'ambiente": r(
    IN,
    'yellow',
    [
      'Farms described as "environmentally attentive" with no measures named',
      'The claim names no measure (manure management, feed, emissions), so it is not clear what makes the farms attentive to the environment.',
      ['Which environmental measures the farms apply', 'Whether they are verified by a third party'],
      'Name one or two concrete measures with their results.',
    ],
    [
      'Allevamenti "attenti all\'ambiente" senza misure indicate',
      'Il claim non indica alcuna misura (gestione dei reflui, alimentazione, emissioni), quindi non è chiaro che cosa renda gli allevamenti attenti all\'ambiente.',
      ['Quali misure ambientali applicano gli allevamenti', 'Se sono verificate da terzi'],
      'Indicare una o due misure concrete con i relativi risultati.',
    ],
  ),
  'Produzione etica e trasparente': r(
    IN,
    'yellow',
    [
      'Broad ethical claim; environmental content unclear',
      '"Ethical and transparent" covers social as much as environmental aspects and gives no detail on either. It is broad, but closer to corporate values than to a product promise.',
      ['What "ethical" and "transparent" mean in practice', 'Whether a report or audit supports it'],
      'Point to the document that gives the detail, or make the claim specific.',
    ],
    [
      'Claim etico ampio; contenuto ambientale poco chiaro',
      '"Etica e trasparente" riguarda aspetti sociali quanto ambientali e non dà dettagli su nessuno dei due. È ampio, ma più vicino ai valori aziendali che a una promessa di prodotto.',
      ['Che cosa significano in pratica "etica" e "trasparente"', 'Se un rapporto o un audit lo supporta'],
      'Rimandare al documento che fornisce i dettagli, oppure rendere il claim specifico.',
    ],
  ),

  // ---------- named_endorsement ----------
  "Raccomandato dall'Associazione Consumatori Consapevoli": r(
    IN,
    'yellow',
    [
      'Recommendation by a named association; its basis is not shown',
      'A recommendation from a consumer association can carry weight, but it is not clear whether it rests on environmental testing or on a commercial arrangement.',
      ['What the recommendation is based on (tests, criteria)', 'Whether there is a commercial relationship with the association'],
      "Explain what was assessed and link to the association's statement.",
    ],
    [
      "Raccomandazione di un'associazione nominata; non è indicato su che cosa si basi",
      "La raccomandazione di un'associazione di consumatori può avere peso, ma non è chiaro se si basi su prove ambientali o su un accordo commerciale.",
      ['Su che cosa si basa la raccomandazione (prove, criteri)', "Se esiste un rapporto commerciale con l'associazione"],
      "Spiegare che cosa è stato valutato e collegare la dichiarazione dell'associazione.",
    ],
  ),
  'Approvato da Rete Ambiente Italia': r(
    IN,
    'red',
    [
      '"Approved by" a body that works like an unofficial label',
      '"Approved by" a named network reads like a seal of environmental quality. If the network is not a certification scheme or a public authority, this is the kind of label the new rules prohibit.',
      ['What the approval consists of and who checks it', 'Whether the network operates a certification scheme'],
      'Remove the approval claim unless it comes from a recognised certification scheme.',
    ],
    [
      '"Approvato da" un ente che funziona come un marchio non ufficiale',
      '"Approvato da" una rete nominata si legge come un sigillo di qualità ambientale. Se la rete non è un sistema di certificazione o un\'autorità pubblica, è il tipo di marchio che le nuove norme vietano.',
      ["In che cosa consiste l'approvazione e chi la verifica", 'Se la rete gestisce un sistema di certificazione'],
      "Eliminare il claim di approvazione, salvo che provenga da un sistema di certificazione riconosciuto.",
    ],
  ),
  "Selezionato dall'Osservatorio Prodotti Verdi": r(
    IN,
    'yellow',
    [
      'Selection by an observatory; criteria not visible',
      "Being \"selected\" suggests an assessment, but the criteria and the observatory's independence are not shown.",
      ['The selection criteria and process', "The observatory's independence from the firm"],
      "Link to the observatory's criteria, or drop the claim.",
    ],
    [
      'Selezione da parte di un osservatorio; criteri non visibili',
      'Essere "selezionato" suggerisce una valutazione, ma i criteri e l\'indipendenza dell\'osservatorio non sono indicati.',
      ['I criteri e il processo di selezione', "L'indipendenza dell'osservatorio dall'azienda"],
      "Collegare i criteri dell'osservatorio, oppure eliminare il claim.",
    ],
  ),
  'Partner ufficiale di Mare Pulito Onlus': r(
    NV,
    'yellow',
    [
      'Partnership with a charity; it says nothing about the product',
      'A partnership is a factual relationship and can be checked. The risk is that it is read as evidence that the product itself is better for the environment.',
      ['The terms of the partnership (donation, project)', 'Whether it is shown next to products as an environmental credential'],
      'Describe what the partnership funds, separately from product claims.',
    ],
    [
      'Partnership con una onlus; non dice nulla sul prodotto',
      "Una partnership è un rapporto concreto e verificabile. Il rischio è che venga letta come prova che il prodotto stesso sia migliore per l'ambiente.",
      ['I termini della partnership (donazione, progetto)', 'Se è mostrata accanto ai prodotti come credenziale ambientale'],
      'Descrivere che cosa finanzia la partnership, separandola dai claim di prodotto.',
    ],
  ),
  'Premiato da Green Award Italia 2025': r(
    NV,
    'yellow',
    [
      'Award; check what it rewarded and who granted it',
      'An award can be checked, but it should be clear what was rewarded (a product, a campaign, the company) and on what criteria.',
      ['The award category and criteria', 'Whether the item that won is the one the claim appears next to'],
      'State what won the award and link to the award page.',
    ],
    [
      'Premio; verificare che cosa ha premiato e chi lo ha assegnato',
      'Un premio è verificabile, ma deve essere chiaro che cosa sia stato premiato (un prodotto, una campagna, l\'azienda) e con quali criteri.',
      ['La categoria e i criteri del premio', "Se l'oggetto premiato è quello accanto a cui compare il claim"],
      'Indicare che cosa è stato premiato e collegare la pagina del premio.',
    ],
  ),
  'Con il patrocinio del Comitato Clima Sostenibile': r(
    IN,
    'yellow',
    [
      'Patronage presented as an environmental endorsement',
      "Patronage usually supports an event or an initiative, not a product's environmental performance. Shown near products, it can suggest an endorsement that was never given.",
      ['What the patronage was granted for', 'Whether the committee agreed to its use in product communication'],
      'Mention the patronage only in connection with the initiative it supports.',
    ],
    [
      'Patrocinio presentato come avallo ambientale',
      "Il patrocinio di solito sostiene un evento o un'iniziativa, non la prestazione ambientale di un prodotto. Mostrato accanto ai prodotti, può suggerire un avallo mai concesso.",
      ['Per che cosa è stato concesso il patrocinio', "Se il comitato ne ha autorizzato l'uso nella comunicazione di prodotto"],
      "Citare il patrocinio solo in relazione all'iniziativa che sostiene.",
    ],
  ),
  'Consigliato dalla Fondazione Terra Viva': r(
    IN,
    'yellow',
    [
      'Recommendation by a foundation; its basis is not shown',
      "The recommendation implies an assessment of the product, but its basis and the foundation's independence are not visible.",
      ['What the recommendation is based on', 'Any financial ties between the firm and the foundation'],
      'Explain the basis of the recommendation, or remove it.',
    ],
    [
      'Raccomandazione di una fondazione; la base non è indicata',
      "La raccomandazione implica una valutazione del prodotto, ma la sua base e l'indipendenza della fondazione non sono visibili.",
      ['Su che cosa si basa la raccomandazione', "Eventuali legami finanziari tra l'azienda e la fondazione"],
      'Spiegare la base della raccomandazione, oppure eliminarla.',
    ],
  ),
  'Sostenuto da Alleanza per le Foreste': r(
    IN,
    'yellow',
    [
      'Support from an alliance; unclear whether it certifies anything',
      '"Supported by" suggests an endorsement but not what was assessed. If it works as a seal, it needs a certification scheme behind it.',
      ['What the support consists of', 'Whether the alliance runs a certification scheme'],
      'Clarify the relationship, or stop presenting it as an endorsement of the product.',
    ],
    [
      "Sostegno di un'alleanza; non è chiaro se certifichi qualcosa",
      '"Sostenuto da" suggerisce un avallo ma non che cosa sia stato valutato. Se funziona come un sigillo, deve basarsi su un sistema di certificazione.',
      ['In che cosa consiste il sostegno', "Se l'alleanza gestisce un sistema di certificazione"],
      'Chiarire il rapporto, oppure smettere di presentarlo come avallo del prodotto.',
    ],
  ),

  // ---------- brand_eco_slogan ----------
  'Linea VerdeVivo: la natura in ogni gesto': r(
    IN,
    'red',
    [
      'Product-line slogan presenting every product as nature-friendly',
      'The line name and slogan attach an environmental image to every product in the line, with no qualification. It works as a generic claim repeated on each product.',
      ['Whether all products in the line share a documented environmental feature', 'Where the slogan appears'],
      'Tie the line to a specific feature, or drop the environmental slogan.',
    ],
    [
      'Slogan di linea che presenta ogni prodotto come rispettoso della natura',
      'Il nome della linea e lo slogan attribuiscono un\'immagine ambientale a ogni prodotto della linea, senza qualificazione. Funziona come un claim generico ripetuto su ciascun prodotto.',
      ['Se tutti i prodotti della linea hanno una caratteristica ambientale documentata', 'Dove compare lo slogan'],
      'Collegare la linea a una caratteristica specifica, oppure eliminare lo slogan ambientale.',
    ],
  ),
  'EcoPiù, la scelta naturale': r(
    IN,
    'red',
    [
      'Brand name with "eco" and an undefined "natural choice"',
      'Both the brand name ("Eco") and the tagline ("the natural choice") imply an environmental benefit that is never explained.',
      ['What makes the products "eco"', 'Whether "natural" is defined anywhere'],
      'Back the brand with a specific, documented benefit shown next to it.',
    ],
    [
      'Nome di marca con "eco" e una "scelta naturale" non definita',
      'Sia il nome di marca ("Eco") sia il payoff ("la scelta naturale") suggeriscono un beneficio ambientale che non viene mai spiegato.',
      ['Che cosa rende i prodotti "eco"', 'Se "naturale" viene definito da qualche parte'],
      'Sostenere il marchio con un beneficio specifico e documentato, mostrato accanto.',
    ],
  ),
  'Natura Pura – il gusto del rispetto': r(
    IN,
    'yellow',
    [
      'Brand line evoking nature; the environmental claim is mostly implied',
      '"Pure nature" evokes naturalness, but the tagline is about taste and respect rather than a stated environmental benefit. It is borderline, so it needs clarifying rather than urgent review.',
      ['Whether the line is marketed with environmental arguments elsewhere', 'What "rispetto" (respect) refers to'],
      'Avoid pairing the line name with environmental claims unless they are substantiated.',
    ],
    [
      'Linea che evoca la natura; il claim ambientale è per lo più implicito',
      '"Natura Pura" evoca naturalità, ma il payoff parla di gusto e rispetto più che di un beneficio ambientale dichiarato. È un caso limite, da chiarire più che da rivedere con urgenza.',
      ['Se la linea viene promossa altrove con argomenti ambientali', 'A che cosa si riferisce "rispetto"'],
      'Evitare di abbinare il nome della linea a claim ambientali non comprovati.',
    ],
  ),
  'Pensa Verde, vivi meglio': r(
    IN,
    'yellow',
    [
      'Lifestyle slogan; green wording but no product promise',
      'The slogan encourages a green lifestyle rather than describing a product. It still uses environmental wording, so it should not appear next to products as if it described them.',
      ['Where the slogan is used', 'Whether it is linked to specific products'],
      'Keep it in general brand communication, away from product pages.',
    ],
    [
      'Slogan di stile di vita; linguaggio green ma nessuna promessa di prodotto',
      'Lo slogan incoraggia uno stile di vita green più che descrivere un prodotto. Usa comunque un linguaggio ambientale, quindi non dovrebbe comparire accanto ai prodotti come se li descrivesse.',
      ['Dove viene usato lo slogan', 'Se è collegato a prodotti specifici'],
      'Mantenerlo nella comunicazione generale del marchio, lontano dalle pagine di prodotto.',
    ],
  ),
  'Gamma TerraAmica': r(
    IN,
    'yellow',
    [
      'Range name suggests an environmental benefit ("Earth-friendly")',
      '"TerraAmica" (Earth-friendly) is a name, not a sentence, but it implies that the products are good for the planet.',
      ['What distinguishes the range environmentally from other products', 'Whether that difference is documented'],
      'Explain on the range page, with evidence, what makes it Earth-friendly.',
    ],
    [
      'Il nome della gamma suggerisce un beneficio ambientale ("amica della Terra")',
      '"TerraAmica" è un nome, non una frase, ma suggerisce che i prodotti facciano bene al pianeta.',
      ['Che cosa distingue la gamma dagli altri prodotti dal punto di vista ambientale', 'Se quella differenza è documentata'],
      'Spiegare nella pagina della gamma, con prove, che cosa la rende amica della Terra.',
    ],
  ),
  'BioSorriso: buono per te, buono per il pianeta': r(
    IN,
    'red',
    [
      'Brand slogan claiming the product is "good for the planet"',
      '"Good for the planet" is an explicit, unqualified environmental benefit attached to the brand. It is a generic claim of the kind now banned without proof of excellent performance.',
      ['What the benefit for the planet is supposed to be', 'Whether "Bio" in the name refers to certified organic products'],
      'Remove "good for the planet", or replace it with a specific, proven benefit.',
    ],
    [
      'Slogan di marca che afferma che il prodotto è "buono per il pianeta"',
      '"Buono per il pianeta" è un beneficio ambientale esplicito e non qualificato associato al marchio. È un claim generico del tipo ora vietato senza prova di prestazioni eccellenti.',
      ['In che cosa dovrebbe consistere il beneficio per il pianeta', 'Se "Bio" nel nome si riferisce a prodotti biologici certificati'],
      'Eliminare "buono per il pianeta", oppure sostituirlo con un beneficio specifico e dimostrato.',
    ],
  ),
  'Collezione Respiro Verde': r(
    IN,
    'yellow',
    [
      'Collection name with green imagery only',
      '"Green breath" is evocative rather than a claim, but it frames the collection in environmental terms.',
      ['Whether the collection has any environmental feature', 'How it is described on product pages'],
      'Make sure product pages do not imply a benefit the collection lacks.',
    ],
    [
      'Nome di collezione con sola immagine green',
      '"Respiro Verde" è evocativo più che un claim, ma presenta la collezione in termini ambientali.',
      ['Se la collezione ha qualche caratteristica ambientale', 'Come viene descritta nelle pagine di prodotto'],
      'Assicurarsi che le pagine di prodotto non suggeriscano un beneficio che la collezione non ha.',
    ],
  ),
  "Linea Zero Pensieri per l'ambiente": r(
    IN,
    'red',
    [
      'Implies the products have no environmental impact to worry about',
      '"Zero worries for the environment" suggests the products carry no environmental burden at all, an absolute claim no product can support.',
      ["What the line's environmental impact actually is", 'Whether any part of it is documented'],
      'Drop the "zero worries" framing and state a concrete, measured feature instead.',
    ],
    [
      'Suggerisce che i prodotti non abbiano impatti ambientali di cui preoccuparsi',
      '"Zero pensieri per l\'ambiente" suggerisce che i prodotti non abbiano alcun peso ambientale, un claim assoluto che nessun prodotto può sostenere.',
      ['Quale sia effettivamente l\'impatto ambientale della linea', 'Se una parte di esso è documentata'],
      'Eliminare l\'idea di "zero pensieri" e indicare invece una caratteristica concreta e misurata.',
    ],
  ),

  // ---------- climate_neutral ----------
  'Carbon neutral grazie alla compensazione delle emissioni': r(
    IN,
    'red',
    [
      'Carbon neutrality explicitly based on offsetting',
      'The claim says outright that neutrality comes from offsetting. Claims of a neutral climate impact based on offsets are banned under the new EU rules.',
      ['Which emissions are reduced and which are offset', 'Which projects provide the offsets'],
      'Remove the neutrality claim; report actual reductions, and any offsetting separately as a contribution.',
    ],
    [
      'Neutralità carbonica basata esplicitamente sulla compensazione',
      'Il claim afferma apertamente che la neutralità deriva dalla compensazione. I claim di impatto climatico neutro basati sulla compensazione sono vietati dalle nuove norme UE.',
      ['Quali emissioni vengono ridotte e quali compensate', 'Quali progetti forniscono le compensazioni'],
      "Eliminare il claim di neutralità; comunicare le riduzioni effettive e, separatamente, l'eventuale compensazione come contributo.",
    ],
  ),
  'Emissioni compensate al 100%': r(
    IN,
    'red',
    [
      'Full offsetting presented as a product benefit',
      '"100% offset" implies the product has no net climate impact because of offsets. This is the offset-based claim the rules prohibit.',
      ['Whether the claim implies a neutral or reduced impact', 'The offsetting scheme and how it is verified'],
      'Stop presenting offsetting as a property of the product.',
    ],
    [
      'Compensazione totale presentata come beneficio di prodotto',
      '"Compensate al 100%" suggerisce che il prodotto non abbia un impatto climatico netto grazie alle compensazioni. È il claim basato sulla compensazione che le norme vietano.',
      ['Se il claim suggerisce un impatto neutro o ridotto', 'Lo schema di compensazione e come viene verificato'],
      'Smettere di presentare la compensazione come proprietà del prodotto.',
    ],
  ),
  'Impatto climatico zero': r(
    IN,
    'red',
    [
      'Absolute "zero climate impact" claim',
      'No product has zero climate impact. Unless every emission is eliminated, the claim relies on offsetting and is prohibited.',
      ['How the "zero" is calculated', 'Whether offsets are included'],
      'Remove the claim and describe measured reductions instead.',
    ],
    [
      'Claim assoluto di "impatto climatico zero"',
      'Nessun prodotto ha impatto climatico zero. Se non viene eliminata ogni emissione, il claim si basa sulla compensazione ed è vietato.',
      ['Come viene calcolato lo "zero"', 'Se sono incluse compensazioni'],
      'Eliminare il claim e descrivere invece le riduzioni misurate.',
    ],
  ),
  'Prodotto a impatto climatico neutro': r(
    IN,
    'red',
    [
      'Climate-neutral product claim, most likely based on offsetting',
      'A climate-neutral product claim almost always depends on offsetting part of the emissions, which the new rules ban as a basis for the claim.',
      ['Whether neutrality relies on offsets', 'Which life-cycle stages are included'],
      'Remove "climate neutral" and report the product\'s footprint and reductions.',
    ],
    [
      'Claim di prodotto a impatto climatico neutro, molto probabilmente basato sulla compensazione',
      'Un claim di prodotto a impatto climatico neutro dipende quasi sempre dalla compensazione di parte delle emissioni, che le nuove norme vietano come base del claim.',
      ['Se la neutralità si basa su compensazioni', 'Quali fasi del ciclo di vita sono incluse'],
      'Eliminare "impatto climatico neutro" e comunicare l\'impronta del prodotto e le riduzioni.',
    ],
  ),

  // ---------- risk_reduction ----------
  '-30% di emissioni di CO₂ rispetto al 2020': r(
    NV,
    'yellow',
    [
      'Quantified reduction with a baseline; check scope and method',
      'The claim gives a figure and a baseline year, which is good practice. It should be clear whether it refers to the product, a plant or the company, and how emissions were measured.',
      ['Whether the 30% is absolute or per unit produced', 'The emission scopes and the method used'],
      'Add the scope (product, site or company) and link to the data.',
    ],
    [
      'Riduzione quantificata con anno base; verificare perimetro e metodo',
      "Il claim indica un dato e un anno di riferimento, che è una buona pratica. Deve essere chiaro se si riferisce al prodotto, a uno stabilimento o all'azienda, e come sono state misurate le emissioni.",
      ['Se il 30% è assoluto o per unità prodotta', 'Gli ambiti di emissione e il metodo utilizzato'],
      'Aggiungere il perimetro (prodotto, stabilimento o azienda) e collegare i dati.',
    ],
  ),
  "Riduce il consumo d'acqua del 40%": r(
    IN,
    'yellow',
    [
      '40% water saving without a baseline',
      'The figure is specific, but compared with what? Without a baseline (a previous product, an average product, a year), the 40% cannot be checked.',
      ['The baseline for the comparison', 'Whether the saving is in production or in use'],
      'State what the 40% is compared with, and over which period.',
    ],
    [
      "Risparmio d'acqua del 40% senza base di riferimento",
      'Il dato è specifico, ma rispetto a che cosa? Senza una base (un prodotto precedente, un prodotto medio, un anno), il 40% non è verificabile.',
      ['La base di riferimento del confronto', "Se il risparmio riguarda la produzione o l'uso"],
      'Indicare rispetto a che cosa è calcolato il 40% e in quale periodo.',
    ],
  ),
  'Stabilimento alimentato per il 60% da pannelli solari': r(
    NV,
    'yellow',
    [
      "Could be read as 60% of all the plant's energy rather than of its electricity",
      '"Powered" can be read as all the energy the plant uses, including heating and fuel, while solar panels usually cover only part of the electricity.',
      ['Whether the 60% refers to electricity or to total energy', 'The measurement period'],
      'State the scope directly, for example "60% of the plant\'s electricity in 2025".',
    ],
    [
      "Potrebbe essere letto come il 60% di tutta l'energia dello stabilimento anziché dell'elettricità",
      '"Alimentato" può essere letto come tutta l\'energia usata dallo stabilimento, compresi riscaldamento e combustibili, mentre i pannelli solari coprono di solito solo parte dell\'elettricità.',
      ["Se il 60% si riferisce all'elettricità o all'energia totale", 'Il periodo di misurazione'],
      'Indicare direttamente il perimetro, ad esempio "60% dell\'elettricità dello stabilimento nel 2025".',
    ],
  ),
  'Ridotto del 25% il consumo energetico per unità prodotta': r(
    NV,
    'yellow',
    [
      'Specific reduction per unit; the baseline year is missing',
      '"Per unit produced" makes the claim precise, but no starting year is given, so the reduction cannot be placed in time.',
      ['The baseline year and the current year', 'How energy per unit is calculated'],
      'Add the reference period, e.g. "2019–2025".',
    ],
    [
      "Riduzione specifica per unità; manca l'anno di riferimento",
      '"Per unità prodotta" rende il claim preciso, ma non è indicato l\'anno di partenza, quindi la riduzione non può essere collocata nel tempo.',
      ["L'anno base e l'anno attuale", 'Come viene calcolato il consumo per unità'],
      'Aggiungere il periodo di riferimento, ad es. "2019–2025".',
    ],
  ),

  // ---------- vague_comparison ----------
  'A ridotto impatto ambientale': r(
    IN,
    'yellow',
    [
      'Reduced impact claimed with no baseline or figure',
      '"Reduced" implies a comparison, but not with what or by how much. "Environmental impact" is also very broad.',
      ['Which impact was reduced, and by how much', 'The baseline for the comparison'],
      'Name the impact, the figure and the baseline, e.g. "20% less plastic than our 2022 pack".',
    ],
    [
      'Impatto ridotto senza base di riferimento né dati',
      '"Ridotto" implica un confronto, ma non con che cosa né di quanto. Anche "impatto ambientale" è molto ampio.',
      ['Quale impatto è stato ridotto e di quanto', 'La base di riferimento del confronto'],
      'Indicare l\'impatto, il dato e la base, ad es. "20% di plastica in meno rispetto alla confezione 2022".',
    ],
  ),
  'Meno plastica, meno impatto': r(
    IN,
    'yellow',
    [
      'Less plastic is assumed to mean less impact',
      'The slogan assumes that less plastic means a lower impact overall, which is not always true if the replacement material has its own footprint.',
      ['How much plastic was removed, and compared with what', 'Whether the replacement material was assessed'],
      'Quantify the plastic reduction, and avoid the general "less impact" conclusion unless it has been assessed.',
    ],
    [
      'Si presume che meno plastica significhi meno impatto',
      'Lo slogan presume che meno plastica significhi un impatto complessivo minore, il che non è sempre vero se il materiale sostitutivo ha a sua volta un impatto.',
      ['Quanta plastica è stata eliminata e rispetto a che cosa', 'Se il materiale sostitutivo è stato valutato'],
      'Quantificare la riduzione di plastica ed evitare la conclusione generale "meno impatto" se non è stata valutata.',
    ],
  ),
  "Un'incredibile riduzione dei consumi energetici": r(
    IN,
    'yellow',
    [
      'Comparative result without a visible baseline, period or quantified reduction',
      '"Incredible" signals a large improvement, but no figure, baseline or period is given, so the reader cannot judge its size.',
      ['The actual reduction and how it was measured', 'The baseline and the period'],
      'Replace "incredible" with the measured figure and its reference period.',
    ],
    [
      'Risultato comparativo senza base di riferimento, periodo o riduzione quantificata visibili',
      '"Incredibile" segnala un grande miglioramento, ma non vengono indicati dato, base o periodo, quindi il lettore non può valutarne l\'entità.',
      ['La riduzione effettiva e come è stata misurata', 'La base di riferimento e il periodo'],
      'Sostituire "incredibile" con il dato misurato e il relativo periodo di riferimento.',
    ],
  ),
  'Più sostenibile rispetto alla versione precedente': r(
    IN,
    'yellow',
    [
      'Comparison with the previous version; "more sustainable" not defined',
      'The comparator is named, which helps, but "more sustainable" does not say in what respect the new version is better.',
      ['Which attribute improved (materials, energy, packaging)', 'The data comparing the two versions'],
      'Name the attribute and the improvement, e.g. "30% recycled plastic instead of 0%".',
    ],
    [
      'Confronto con la versione precedente; "più sostenibile" non definito',
      'Il termine di confronto è indicato, e questo aiuta, ma "più sostenibile" non dice sotto quale aspetto la nuova versione sia migliore.',
      ['Quale attributo è migliorato (materiali, energia, imballaggio)', 'I dati che confrontano le due versioni'],
      'Indicare l\'attributo e il miglioramento, ad es. "30% di plastica riciclata invece dello 0%".',
    ],
  ),

  // ---------- future_performance ----------
  'Neutrali per il clima entro il 2030': r(
    IN,
    'yellow',
    [
      'Climate-neutral target without a visible plan or verification',
      'A future target is allowed only with a detailed public plan and independent monitoring. If the target relies on offsetting, it also runs into the neutrality ban.',
      ['Whether a public implementation plan with interim targets exists', 'Whether the target relies on reductions or on offsets'],
      'Link the target to its public plan and its independent verifier.',
    ],
    [
      'Obiettivo di neutralità climatica senza piano o verifica visibili',
      "Un obiettivo futuro è ammesso solo con un piano pubblico dettagliato e un monitoraggio indipendente. Se l'obiettivo si basa sulla compensazione, incontra anche il divieto sulla neutralità.",
      ['Se esiste un piano di attuazione pubblico con obiettivi intermedi', "Se l'obiettivo si basa su riduzioni o su compensazioni"],
      "Collegare l'obiettivo al suo piano pubblico e al verificatore indipendente.",
    ],
  ),
  'Zero emissioni nette entro il 2040': r(
    IN,
    'yellow',
    [
      'Net-zero target; plan and interim milestones not shown',
      'Net zero by 2040 is a long-term commitment. Consumers need to see the plan, the interim targets and who checks progress.',
      ['The plan and interim targets (e.g. for 2030)', 'Whether progress is verified independently'],
      'Publish the transition plan and link to it next to the claim.',
    ],
    [
      'Obiettivo net zero; piano e tappe intermedie non visibili',
      'Zero emissioni nette entro il 2040 è un impegno di lungo periodo. Il consumatore deve poter vedere il piano, gli obiettivi intermedi e chi verifica i progressi.',
      ['Il piano e gli obiettivi intermedi (ad es. per il 2030)', 'Se i progressi sono verificati in modo indipendente'],
      'Pubblicare il piano di transizione e collegarlo accanto al claim.',
    ],
  ),
  'Entro il 2028 tutti i nostri imballaggi saranno riciclabili': r(
    IN,
    'yellow',
    [
      "Packaging target; today's status and the plan are not shown",
      'The target is concrete and near-term, which makes it credible, but neither the starting point nor the steps to reach it are shown.',
      ['The current share of recyclable packaging', 'The plan and milestones up to 2028'],
      "State today's share and link to the plan.",
    ],
    [
      'Obiettivo sugli imballaggi; situazione attuale e piano non indicati',
      "L'obiettivo è concreto e a breve termine, il che lo rende credibile, ma non sono indicati né il punto di partenza né i passi per raggiungerlo.",
      ['La quota attuale di imballaggi riciclabili', 'Il piano e le tappe fino al 2028'],
      'Indicare la quota attuale e collegare il piano.',
    ],
  ),
  "Dimezzeremo l'uso di plastica vergine entro il 2030": r(
    IN,
    'yellow',
    [
      'Reduction target without a baseline year',
      'Halving requires a starting point. Without the baseline year and progress so far, the commitment cannot be checked.',
      ['The baseline year and quantity', 'Progress so far, and who monitors it'],
      'Add the baseline and report progress regularly.',
    ],
    [
      'Obiettivo di riduzione senza anno di riferimento',
      "Dimezzare richiede un punto di partenza. Senza l'anno base e i progressi finora, l'impegno non è verificabile.",
      ["L'anno base e la quantità di partenza", 'I progressi finora e chi li monitora'],
      'Aggiungere la base di riferimento e comunicare regolarmente i progressi.',
    ],
  ),
}
