import type { Area, AreaLight, Confidence, Scope } from '@/lib/types'

export const LOCALES = ['en', 'it'] as const
export type Locale = (typeof LOCALES)[number]

type AreaText = { title: string; subtitle: string; guidance: string }

/** UI text only. Claim text and snippets are evidence and are never translated (PLAN §5.4). */
const en = {
  appTitle: 'Firm Claims Dashboard',
  disclaimer: 'Research prototype. Automated detection, not a legal assessment.',
  footer: {
    contacts: 'Contacts',
  },
  loading: 'Loading',
  nav: { home: 'Home', university: 'Centro Euro-Mediterraneo sui Cambiamenti Climatici (CMCC), website', methodology: 'Methodology', lock: 'Lock', language: 'Language', privacy: 'Measurement preferences', testMode: 'Tracking: test mode' },

  gate: {
    prompt: 'Enter the passcode to view the data.',
    label: 'Passcode',
    unlock: 'Unlock',
    unlocking: 'Unlocking…',
    wrongPasscode: 'Incorrect passcode',
  },
  errors: {
    fileTitle: "Couldn't load the data",
    dataTitle: "The data can't be displayed",
    noFirmTitle: 'Open your personal link',
    noFirm: 'This report is opened with the personal link sent to each firm. Open that link, then enter the passphrase you received.',
    notFound: 'Data file not found (data/firms.enc).',
    invalidFile: 'Data file is not a valid encrypted file.',
    invalidJson: 'Decrypted data is not valid JSON.',
    validation: 'The data file failed validation.',
    more: (n: number) => `…and ${n} more`,
    tryAgain: 'Try again',
  },

  areas: {
    generic: {
      title: 'Generic or absolute claims',
      subtitle: 'Broad wording without a clear qualification',
      guidance: 'An environmental claim should say which benefit it refers to, and the evidence should be easy for the consumer to find.',
    },
    scope: {
      title: 'Scope and claim precision',
      subtitle: 'What exactly is covered?',
      guidance: 'A specific claim should make its product, process, facility and environmental boundary clear to the consumer.',
    },
    evidence: {
      title: 'Evidence and comparisons',
      subtitle: 'Baseline, method and accessible proof',
      guidance: 'A comparison or quantified result should state its baseline, period and method, and the proof should be accessible.',
    },
    labels: {
      title: 'Labels and climate neutrality',
      subtitle: 'Certification and offset-based claims',
      guidance: 'A sustainability label should rest on a certification scheme or a public authority. Climate-neutral claims based on offsetting are not allowed.',
    },
    future: {
      title: 'Future environmental performance',
      subtitle: 'Targets, plans and verification',
      guidance: 'A future target should come with a detailed, public implementation plan and regular independent verification.',
    },
    other: {
      title: 'Other claims',
      subtitle: 'Categories not yet mapped to an area',
      guidance: 'These claims use a category the dashboard does not map to an area yet. Review them manually.',
    },
  } satisfies Record<Area, AreaText>,

  light: {
    label: { red: 'Red', yellow: 'Yellow', green: 'Green' } satisfies Record<AreaLight, string>,
    action: { red: 'Review first', yellow: 'Clarify or document', green: 'No signal detected' } satisfies Record<AreaLight, string>,
    tag: { red: 'Red · review first', yellow: 'Yellow · clarify', green: 'Green · no signal found' } satisfies Record<AreaLight, string>,
    filter: 'Status filter',
    heading: 'Status',
  },

  confidence: {
    heading: 'Detector confidence',
    label: { high: 'High', medium: 'Medium', low: 'Low' } satisfies Record<Confidence, string>,
    tooltip: 'Detector confidence, not legal severity',
  },
  scope: {
    heading: 'Scope',
    label: { IN_SCOPE: 'In scope', NEEDS_VERIFICATION: 'Needs verification' } satisfies Record<Scope, string>,
    filter: 'Scope filter',
  },

  review: {
    merit: (n: number, total: number) => `${n} of ${total} areas merit review`,
    short: (n: number, total: number) => `${n} of ${total}`,
    detail: (red: number, yellow: number) => `${red} red, ${yellow} yellow`,
    noScrape: 'No successful scrape',
  },

  home: {
    title: 'Firms',
    search: 'Search by firm ID or name',
    col: { id: 'Firm ID', name: 'Firm name', website: 'Website', claims: 'Claims', review: 'Areas to review', scraped: 'Scraped' },
    noMatch: (q: string) => `No firms match "${q}".`,
    showing: (from: number, to: number, total: number) => `Showing ${from}–${to} of ${total} firms`,
    sortNote: 'Sorted by red areas, then yellow areas.',
    previous: 'Previous',
    next: 'Next',
    previousPage: 'Go to previous page',
    nextPage: 'Go to next page',
  },

  firm: {
    allFirms: '← All firms',
    eyebrow: 'Green claims screening',
    sample: 'Pages analysed from the public website',
    noCrawl: 'No successful scrape yet.',
    partial: (pages: number) => `The scrape was partial (${pages} pages). Some claims may be missing.`,
    banner: 'Preliminary screen:',
    bannerBody: 'colours indicate where a human review may be useful. They do not establish legal compliance or non-compliance.',
    tabs: { overview: 'Overview', claims: 'Claim examples', how: 'How to read it' },
  },

  overview: {
    areasHeading: (n: number) => `${n === 5 ? 'Five' : n} areas requiring attention`,
    areasHeadingAll: 'Review areas',
    redAreas: 'Red areas',
    yellowAreas: 'Yellow areas',
    greenAreas: 'Green areas',
    examples: (n: number) => `${n} ${n === 1 ? 'example' : 'examples'}`,
    noneFound: 'None found',
    exampleDetected: 'Example detected',
    why: 'Why it was flagged',
    advice: 'General advice',
    of: (i: number, n: number) => `${i} of ${n}`,
    previous: 'Previous example',
    next: 'Next example',
    seeAll: (n: number) => `See all ${n} claims in this area`,
    details: 'Open details',
    emptyArea: 'No relevant signal was detected in this area in the analysed pages.',
  },

  claims: {
    heading: 'Claim-level findings',
    count: (shown: number, total: number) => (shown === total ? `${total} ${total === 1 ? 'claim' : 'claims'}` : `${shown} of ${total} claims`),
    col: { status: 'Status', excerpt: 'Claim excerpt', reason: 'Reason for review', source: 'Source' },
    none: 'No claims detected in the analysed pages.',
    noMatch: 'No claims match these filters.',
    footnote: 'Each finding keeps its exact page URL, scrape date and surrounding text (open a row to see them). Page screenshots are not captured yet.',
  },

  how: {
    redBody: 'A public signal appears close to a prohibited or especially high-risk pattern, or the wording is so broad that rapid human review is advisable.',
    yellowBody: "The claim may be acceptable, but its scope, baseline, evidence or consumer-facing explanation is not sufficiently clear from the analysed page.",
    greenBody: 'No relevant risk signal was detected in the analysed pages. Green is not certification of compliance and may change if other pages or offline materials are reviewed.',
    rule: 'How colours are assigned:',
    ruleBody:
      'each claim is assessed in the context of its page. It is red when the wording is close to a practice the EU rules ban outright or so broad that a quick review is advisable (generic or absolute claims, "natural" without a definition, brand eco-slogans, vague supply-chain wording, offset-based climate neutrality, a whole product presented as green for one part, a legal requirement presented as a feature), and yellow when it may be fine but needs clarifying or documenting. An area takes the colour of its most serious claim and is green when nothing was found. A claim that has not been assessed individually gets a simpler colour based on its type.',
    scope: 'Scope of this screen:',
    scopeBody: (date: string) =>
      `public Italian-language website pages scraped on ${date}, not a complete crawl. The screen concerns consumer-facing commercial claims; context and evidence held internally by the firm were not available.`,
    scopeNoDate: 'public Italian-language website pages. The screen concerns consumer-facing commercial claims; context and evidence held internally by the firm were not available.',
    future: 'Future environmental performance is not reliably detected yet, so "None found" in that area may only mean that no such claim was picked up.',
    methodology: 'Full methodology',
  },

  filters: {
    area: 'Area',
    all: 'All',
    selected: (n: number) => `${n} selected`,
    clear: 'Clear filters',
  },

  drawer: {
    details: 'Details for this claim',
    close: 'Close',
    context: 'Context',
    source: 'Source',
    scraped: (date: string) => `Scraped ${date}`,
    legalRef: 'Legal reference',
    legalNote: 'Indicative mapping, not a legal assessment.',
    grayZone: 'Gray zone',
    category: 'Category',
  },

  notFound: {
    title: 'Not found',
    body: "That page or firm doesn't exist.",
    back: 'Back to all firms',
  },

  // The wording follows the notice drafted for the project (src/content/PRIVACY.it.md).
  consent: {
    label: 'Measurement notice',
    body: 'With your consent we measure how the report is used, for the 2D4D research. We associate data such as accesses and length of visit with the report and, when authorised, link them to the interview and company data. You can read the report without measurement too, and change your choice from “Measurement preferences”. If you close this notice, you continue without measurement.',
    notice: 'Privacy notice',
    accept: 'I consent to measurement',
    decline: 'Continue without measurement',
    close: 'Close (continue without measurement)',
  },

  privacy: {
    version: (v: number, date: string) => `Version ${v} · ${date}`,
    choiceHeading: 'Measurement preferences',
    choice: {
      granted: 'You consented to the optional measurement.',
      denied: 'You continue without measurement.',
      none: 'You have not chosen yet.',
    },
    choiceNote: 'You can change this at any time. The report works the same either way.',
  },
}

export type Messages = typeof en

// "Confidenza", never "rischio" or "gravità" as a confidence label: confidence is not risk (PLAN §1).
const it: Messages = {
  appTitle: 'Dashboard delle affermazioni aziendali',
  disclaimer: 'Prototipo di ricerca. Rilevamento automatico, non una valutazione legale.',
  footer: {
    contacts: 'Contatti',
  },
  loading: 'Caricamento',
  nav: { home: 'Inizio', university: 'Centro Euro-Mediterraneo sui Cambiamenti Climatici (CMCC), sito web', methodology: 'Metodologia', lock: 'Blocca', language: 'Lingua', privacy: 'Preferenze di misurazione', testMode: 'Tracciamento: modalità test' },

  gate: {
    prompt: 'Inserisci il codice di accesso per visualizzare i dati.',
    label: 'Codice di accesso',
    unlock: 'Sblocca',
    unlocking: 'Sblocco in corso…',
    wrongPasscode: 'Codice di accesso errato',
  },
  errors: {
    fileTitle: 'Impossibile caricare i dati',
    dataTitle: 'Impossibile visualizzare i dati',
    noFirmTitle: 'Apri il tuo link personale',
    noFirm: 'Questo rapporto si apre con il link personale inviato a ciascuna impresa. Apri quel link e inserisci la passphrase ricevuta.',
    notFound: 'File dei dati non trovato (data/firms.enc).',
    invalidFile: 'Il file dei dati non è un file cifrato valido.',
    invalidJson: 'I dati decifrati non sono un JSON valido.',
    validation: 'Il file dei dati non ha superato la convalida.',
    more: (n) => `…e altri ${n}`,
    tryAgain: 'Riprova',
  },

  areas: {
    generic: {
      title: 'Affermazioni generiche o assolute',
      subtitle: 'Formulazioni ampie senza una qualificazione chiara',
      guidance: "Un'affermazione ambientale dovrebbe indicare a quale beneficio si riferisce, e le prove dovrebbero essere facili da trovare per il consumatore.",
    },
    scope: {
      title: "Ambito e precisione dell'affermazione",
      subtitle: 'Che cosa è coperto esattamente?',
      guidance: "Un'affermazione specifica dovrebbe chiarire al consumatore il prodotto, il processo, lo stabilimento e il perimetro ambientale a cui si riferisce.",
    },
    evidence: {
      title: 'Prove e confronti',
      subtitle: 'Base di riferimento, metodo e prove accessibili',
      guidance: 'Un confronto o un risultato quantificato dovrebbe indicare base di riferimento, periodo e metodo, e le prove dovrebbero essere accessibili.',
    },
    labels: {
      title: 'Marchi e neutralità climatica',
      subtitle: 'Certificazioni e affermazioni basate sulla compensazione',
      guidance: "Un marchio di sostenibilità dovrebbe basarsi su un sistema di certificazione o su un'autorità pubblica. Le affermazioni di neutralità climatica basate sulla compensazione non sono consentite.",
    },
    future: {
      title: 'Prestazioni ambientali future',
      subtitle: 'Obiettivi, piani e verifica',
      guidance: 'Un obiettivo futuro dovrebbe essere accompagnato da un piano di attuazione dettagliato e pubblico e da verifiche indipendenti periodiche.',
    },
    other: {
      title: 'Altre affermazioni',
      subtitle: "Categorie non ancora associate a un'area",
      guidance: "Queste affermazioni usano una categoria che la dashboard non associa ancora a un'area. Vanno esaminate manualmente.",
    },
  },

  light: {
    label: { red: 'Rosso', yellow: 'Giallo', green: 'Verde' },
    action: { red: 'Da rivedere per primo', yellow: 'Da chiarire o documentare', green: 'Nessuna affermazione rilevata' },
    tag: { red: 'Rosso · rivedere per primo', yellow: 'Giallo · chiarire', green: 'Verde · nessuna affermazione' },
    filter: 'Filtro stato',
    heading: 'Stato',
  },

  confidence: {
    heading: 'Confidenza del rilevatore',
    label: { high: 'Alta', medium: 'Media', low: 'Bassa' },
    tooltip: 'Confidenza del rilevatore, non gravità legale',
  },
  scope: {
    heading: 'Ambito',
    label: { IN_SCOPE: 'In ambito', NEEDS_VERIFICATION: 'Da verificare' },
    filter: 'Filtro ambito',
  },

  review: {
    merit: (n, total) => `${n} aree su ${total} meritano una revisione`,
    short: (n, total) => `${n} su ${total}`,
    detail: (red, yellow) => `${red} rosse, ${yellow} gialle`,
    noScrape: 'Nessuna scansione riuscita',
  },

  home: {
    title: 'Aziende',
    search: "Cerca per ID o nome dell'azienda",
    col: { id: 'ID azienda', name: 'Nome azienda', website: 'Sito web', claims: 'Affermazioni', review: 'Aree da rivedere', scraped: 'Scansione' },
    noMatch: (q) => `Nessuna azienda corrisponde a "${q}".`,
    showing: (from, to, total) => `Aziende ${from}–${to} di ${total}`,
    sortNote: 'Ordinate per aree rosse, poi per aree gialle.',
    previous: 'Precedente',
    next: 'Successiva',
    previousPage: 'Vai alla pagina precedente',
    nextPage: 'Vai alla pagina successiva',
  },

  firm: {
    allFirms: '← Tutte le aziende',
    eyebrow: 'Screening delle affermazioni ambientali',
    sample: 'Pagine analizzate dal sito pubblico',
    noCrawl: 'Nessuna scansione riuscita finora.',
    partial: (pages) => `La scansione è stata parziale (${pages} pagine). Alcune affermazioni potrebbero mancare.`,
    banner: 'Screening preliminare:',
    bannerBody: 'i colori indicano dove può essere utile una revisione umana. Non stabiliscono la conformità o la non conformità legale.',
    tabs: { overview: 'Panoramica', claims: 'Esempi di affermazioni', how: 'Come leggerlo' },
  },

  overview: {
    areasHeading: (n) => `${n === 5 ? 'Cinque' : n} aree che richiedono attenzione`,
    areasHeadingAll: 'Aree di revisione',
    redAreas: 'Aree rosse',
    yellowAreas: 'Aree gialle',
    greenAreas: 'Aree verdi',
    examples: (n) => `${n} ${n === 1 ? 'esempio' : 'esempi'}`,
    noneFound: 'Nessuno trovato',
    exampleDetected: 'Esempio rilevato',
    why: 'Perché è stata segnalata',
    advice: 'Consiglio generale',
    of: (i, n) => `${i} di ${n}`,
    previous: 'Esempio precedente',
    next: 'Esempio successivo',
    seeAll: (n) => `Vedi tutte le ${n} affermazioni di quest'area`,
    details: 'Apri i dettagli',
    emptyArea: "Nelle pagine analizzate non è stata rilevata alcuna affermazione rilevante in quest'area.",
  },

  claims: {
    heading: 'Risultati per singola affermazione',
    count: (shown, total) => (shown === total ? `${total} ${total === 1 ? 'affermazione' : 'affermazioni'}` : `${shown} affermazioni su ${total}`),
    col: { status: 'Stato', excerpt: "Estratto dell'affermazione", reason: 'Motivo della revisione', source: 'Fonte' },
    none: 'Nessuna affermazione rilevata nelle pagine analizzate.',
    noMatch: 'Nessuna affermazione corrisponde a questi filtri.',
    footnote: "Per ogni risultato si conservano l'URL esatto della pagina, la data della scansione e il testo circostante (apri una riga per vederli). Le schermate delle pagine non sono ancora acquisite.",
  },

  how: {
    redBody: "Un'affermazione pubblica appare vicina a una pratica vietata o particolarmente a rischio, oppure la formulazione è così ampia che è consigliabile una rapida revisione umana.",
    yellowBody: "L'affermazione può essere accettabile, ma il suo ambito, la base di riferimento, le prove o la spiegazione rivolta al consumatore non sono sufficientemente chiari dalla pagina analizzata.",
    greenBody: 'Nelle pagine analizzate non è stata rilevata alcuna affermazione con un rischio rilevante. Il verde non certifica la conformità e può cambiare se si esaminano altre pagine o materiali offline.',
    rule: 'Come vengono assegnati i colori:',
    ruleBody:
      "ogni affermazione viene valutata nel contesto della sua pagina. È rossa quando la formulazione è vicina a una pratica che le norme UE vietano in assoluto o così ampia che è consigliabile una rapida revisione (affermazioni generiche o assolute, «naturale» senza definizione, slogan eco del marchio, filiera vaga, neutralità climatica basata sulla compensazione, l'intero prodotto presentato come green per una sola parte, un obbligo di legge presentato come caratteristica), e gialla quando può essere accettabile ma va chiarita o documentata. Un'area prende il colore della sua affermazione più seria ed è verde quando non è stato trovato nulla. Un'affermazione non ancora valutata singolarmente riceve un colore più semplice, basato sul suo tipo.",
    scope: 'Ambito di questo screening:',
    scopeBody: (date) =>
      `pagine pubbliche in italiano del sito web, acquisite il ${date}; non una scansione completa. Lo screening riguarda le affermazioni commerciali rivolte ai consumatori; il contesto e le prove in possesso dell'azienda non erano disponibili.`,
    scopeNoDate: "pagine pubbliche in italiano del sito web. Lo screening riguarda le affermazioni commerciali rivolte ai consumatori; il contesto e le prove in possesso dell'azienda non erano disponibili.",
    future: "Le prestazioni ambientali future non vengono ancora rilevate in modo affidabile, quindi \"Nessuno trovato\" in quell'area può solo significare che nessuna affermazione di questo tipo è stata individuata.",
    methodology: 'Metodologia completa',
  },

  filters: {
    area: 'Area',
    all: 'Tutte',
    selected: (n) => `${n} selezionate`,
    clear: 'Azzera filtri',
  },

  drawer: {
    details: "Dettagli dell'affermazione",
    close: 'Chiudi',
    context: 'Contesto',
    source: 'Fonte',
    scraped: (date) => `Acquisito il ${date}`,
    legalRef: 'Riferimento normativo',
    legalNote: 'Corrispondenza indicativa, non una valutazione legale.',
    grayZone: 'Zona grigia',
    category: 'Categoria',
  },

  notFound: {
    title: 'Pagina non trovata',
    body: 'Questa pagina o azienda non esiste.',
    back: 'Torna a tutte le aziende',
  },

  consent: {
    label: 'Avviso sulla misurazione',
    body: 'Con il Suo consenso misuriamo l’uso del report per la ricerca 2D4D. Associamo al report dati come accessi e durata della visita e, quando autorizzato, li colleghiamo ai dati dell’intervista e dell’impresa. Può consultare il report anche senza misurazione e cambiare scelta da «Preferenze di misurazione». Se chiude questo avviso, prosegue senza misurazione.',
    notice: 'Informativa privacy',
    accept: 'Acconsento alla misurazione',
    decline: 'Continua senza misurazione',
    close: 'Chiudi (prosegue senza misurazione)',
  },

  privacy: {
    version: (v, date) => `Versione ${v} · ${date}`,
    choiceHeading: 'Preferenze di misurazione',
    choice: {
      granted: 'Ha acconsentito alla misurazione facoltativa.',
      denied: 'Prosegue senza misurazione.',
      none: 'Non ha ancora scelto.',
    },
    choiceNote: 'Può cambiare la scelta in qualsiasi momento. Il report funziona allo stesso modo in entrambi i casi.',
  },
}

export const MESSAGES: Record<Locale, Messages> = { en, it }
