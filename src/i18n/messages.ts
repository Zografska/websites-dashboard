import type { Area, AreaLight, Confidence, Scope } from '@/lib/types'

export const LOCALES = ['en', 'it'] as const
export type Locale = (typeof LOCALES)[number]

type AreaText = { title: string; subtitle: string; guidance: string }

/** UI text only. Claim text and snippets are evidence and are never translated (PLAN §5.4). */
const en = {
  appTitle: 'Firm Claims Dashboard',
  disclaimer: 'Research prototype. Automated detection, not a legal assessment.',
  loading: 'Loading',
  nav: { methodology: 'Methodology', lock: 'Lock', language: 'Language' },

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
    sample: 'Public website sample',
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
    verify: 'What to verify internally',
    action: 'Suggested first action',
    of: (i: number, n: number) => `${i} of ${n}`,
    previous: 'Previous example',
    next: 'Next example',
    seeAll: (n: number) => `See all ${n} claims in this area`,
    details: 'Open details',
    emptyArea: 'No relevant signal was detected in this area in the sampled pages.',
  },

  claims: {
    heading: 'Claim-level findings',
    count: (shown: number, total: number) => (shown === total ? `${total} ${total === 1 ? 'claim' : 'claims'}` : `${shown} of ${total} claims`),
    col: { status: 'Status', excerpt: 'Claim excerpt', reason: 'Reason for review', source: 'Source' },
    none: 'No claims detected in the sampled pages.',
    noMatch: 'No claims match these filters.',
    footnote: 'Each finding keeps its exact page URL, scrape date and surrounding text (open a row to see them). Page screenshots are not captured yet.',
  },

  how: {
    redBody: 'A public signal appears close to a prohibited or especially high-risk pattern, or the wording is so broad that rapid human review is advisable.',
    yellowBody: "The claim may be acceptable, but its scope, baseline, evidence or consumer-facing explanation is not sufficiently clear from the sampled page.",
    greenBody: 'No relevant risk signal was detected in the sampled material. Green is not certification of compliance and may change if other pages or offline materials are reviewed.',
    rule: 'How colours are assigned:',
    ruleBody:
      'a claim is red when it is in scope and falls under Generic or absolute claims or Labels and climate neutrality, the claim types the EU rules ban outright, unless the generic wording comes with a specific explanation next to it. Every other claim is yellow. An area takes the colour of its most serious claim and is green when nothing was found.',
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
}

export type Messages = typeof en

// "Confidenza", never "rischio" or "gravità" as a confidence label: confidence is not risk (PLAN §1).
const it: Messages = {
  appTitle: 'Dashboard dei claim aziendali',
  disclaimer: 'Prototipo di ricerca. Rilevamento automatico, non una valutazione legale.',
  loading: 'Caricamento',
  nav: { methodology: 'Metodologia', lock: 'Blocca', language: 'Lingua' },

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
    notFound: 'File dei dati non trovato (data/firms.enc).',
    invalidFile: 'Il file dei dati non è un file cifrato valido.',
    invalidJson: 'I dati decifrati non sono un JSON valido.',
    validation: 'Il file dei dati non ha superato la convalida.',
    more: (n) => `…e altri ${n}`,
    tryAgain: 'Riprova',
  },

  areas: {
    generic: {
      title: 'Claim generici o assoluti',
      subtitle: 'Formulazioni ampie senza una qualificazione chiara',
      guidance: 'Un claim ambientale dovrebbe indicare a quale beneficio si riferisce, e le prove dovrebbero essere facili da trovare per il consumatore.',
    },
    scope: {
      title: 'Ambito e precisione del claim',
      subtitle: 'Che cosa è coperto esattamente?',
      guidance: "Un claim specifico dovrebbe chiarire al consumatore il prodotto, il processo, lo stabilimento e il perimetro ambientale a cui si riferisce.",
    },
    evidence: {
      title: 'Prove e confronti',
      subtitle: 'Base di riferimento, metodo e prove accessibili',
      guidance: 'Un confronto o un risultato quantificato dovrebbe indicare base di riferimento, periodo e metodo, e le prove dovrebbero essere accessibili.',
    },
    labels: {
      title: 'Marchi e neutralità climatica',
      subtitle: 'Certificazioni e claim basati sulla compensazione',
      guidance: "Un marchio di sostenibilità dovrebbe basarsi su un sistema di certificazione o su un'autorità pubblica. I claim di neutralità climatica basati sulla compensazione non sono consentiti.",
    },
    future: {
      title: 'Prestazioni ambientali future',
      subtitle: 'Obiettivi, piani e verifica',
      guidance: 'Un obiettivo futuro dovrebbe essere accompagnato da un piano di attuazione dettagliato e pubblico e da verifiche indipendenti periodiche.',
    },
    other: {
      title: 'Altri claim',
      subtitle: "Categorie non ancora associate a un'area",
      guidance: "Questi claim usano una categoria che la dashboard non associa ancora a un'area. Vanno esaminati manualmente.",
    },
  },

  light: {
    label: { red: 'Rosso', yellow: 'Giallo', green: 'Verde' },
    action: { red: 'Da rivedere per primo', yellow: 'Da chiarire o documentare', green: 'Nessun segnale rilevato' },
    tag: { red: 'Rosso · rivedere per primo', yellow: 'Giallo · chiarire', green: 'Verde · nessun segnale' },
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
    col: { id: 'ID azienda', name: 'Nome azienda', website: 'Sito web', claims: 'Claim', review: 'Aree da rivedere', scraped: 'Scansione' },
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
    eyebrow: 'Screening dei claim ambientali',
    sample: 'Campione del sito pubblico',
    noCrawl: 'Nessuna scansione riuscita finora.',
    partial: (pages) => `La scansione è stata parziale (${pages} pagine). Alcuni claim potrebbero mancare.`,
    banner: 'Screening preliminare:',
    bannerBody: 'i colori indicano dove può essere utile una revisione umana. Non stabiliscono la conformità o la non conformità legale.',
    tabs: { overview: 'Panoramica', claims: 'Esempi di claim', how: 'Come leggerlo' },
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
    why: 'Perché è stato segnalato',
    verify: 'Cosa verificare internamente',
    action: 'Prima azione suggerita',
    of: (i, n) => `${i} di ${n}`,
    previous: 'Esempio precedente',
    next: 'Esempio successivo',
    seeAll: (n) => `Vedi tutti i ${n} claim di quest'area`,
    details: 'Apri i dettagli',
    emptyArea: "Nelle pagine campionate non è stato rilevato alcun segnale rilevante in quest'area.",
  },

  claims: {
    heading: 'Risultati per singolo claim',
    count: (shown, total) => (shown === total ? `${total} claim` : `${shown} claim su ${total}`),
    col: { status: 'Stato', excerpt: 'Estratto del claim', reason: 'Motivo della revisione', source: 'Fonte' },
    none: 'Nessun claim rilevato nelle pagine campionate.',
    noMatch: 'Nessun claim corrisponde a questi filtri.',
    footnote: "Per ogni risultato si conservano l'URL esatto della pagina, la data della scansione e il testo circostante (apri una riga per vederli). Le schermate delle pagine non sono ancora acquisite.",
  },

  how: {
    redBody: 'Un segnale pubblico appare vicino a una pratica vietata o particolarmente a rischio, oppure la formulazione è così ampia che è consigliabile una rapida revisione umana.',
    yellowBody: "Il claim può essere accettabile, ma il suo ambito, la base di riferimento, le prove o la spiegazione rivolta al consumatore non sono sufficientemente chiari dalla pagina campionata.",
    greenBody: 'Nel materiale campionato non è stato rilevato alcun segnale di rischio rilevante. Il verde non certifica la conformità e può cambiare se si esaminano altre pagine o materiali offline.',
    rule: 'Come vengono assegnati i colori:',
    ruleBody:
      "un claim è rosso quando è in ambito e rientra nei claim generici o assoluti o nei marchi e neutralità climatica, i tipi di claim che le norme UE vietano in assoluto, a meno che la formulazione generica non sia accompagnata da una spiegazione specifica. Ogni altro claim è giallo. Un'area prende il colore del suo claim più serio ed è verde quando non è stato trovato nulla.",
    scope: 'Ambito di questo screening:',
    scopeBody: (date) =>
      `pagine pubbliche in italiano del sito web, acquisite il ${date}; non una scansione completa. Lo screening riguarda i claim commerciali rivolti ai consumatori; il contesto e le prove in possesso dell'azienda non erano disponibili.`,
    scopeNoDate: "pagine pubbliche in italiano del sito web. Lo screening riguarda i claim commerciali rivolti ai consumatori; il contesto e le prove in possesso dell'azienda non erano disponibili.",
    future: "Le prestazioni ambientali future non vengono ancora rilevate in modo affidabile, quindi \"Nessuno trovato\" in quell'area può solo significare che nessun claim di questo tipo è stato individuato.",
    methodology: 'Metodologia completa',
  },

  filters: {
    area: 'Area',
    all: 'Tutte',
    selected: (n) => `${n} selezionate`,
    clear: 'Azzera filtri',
  },

  drawer: {
    details: 'Dettagli del claim',
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
}

export const MESSAGES: Record<Locale, Messages> = { en, it }
