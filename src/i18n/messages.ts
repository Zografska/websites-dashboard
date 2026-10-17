import type { Confidence, Scope } from '@/lib/types'

export const LOCALES = ['en', 'it'] as const
export type Locale = (typeof LOCALES)[number]

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

  confidence: {
    heading: 'Confidence',
    label: { high: 'High', medium: 'Medium', low: 'Low' } satisfies Record<Confidence, string>,
    short: { high: 'H', medium: 'M', low: 'L' } satisfies Record<Confidence, string>,
    tooltip: 'Detector confidence, not legal severity',
    named: (level: string) => `${level} confidence`,
    summary: (counts: Record<Confidence, number>) => `Confidence: ${counts.high} high, ${counts.medium} medium, ${counts.low} low`,
    filter: 'Confidence filter',
  },
  scope: {
    heading: 'Scope',
    label: { IN_SCOPE: 'In scope', NEEDS_VERIFICATION: 'Needs verification' } satisfies Record<Scope, string>,
    filter: 'Scope filter',
  },

  home: {
    title: 'Firms',
    search: 'Search by firm ID or name',
    col: { id: 'Firm ID', name: 'Firm name', website: 'Website', claims: 'Claims', confidence: 'Confidence', crawls: 'Crawls', lastCrawled: 'Last crawled' },
    noMatch: (q: string) => `No firms match "${q}".`,
    showing: (from: number, to: number, total: number) => `Showing ${from}–${to} of ${total} firms`,
    previous: 'Previous',
    next: 'Next',
    previousPage: 'Go to previous page',
    nextPage: 'Go to next page',
  },

  firm: {
    allFirms: '← All firms',
    noCrawl: 'No successful crawl yet.',
    claimsAsOf: (date: string) => `Claims as of ${date} (latest successful crawl).`,
    partial: (pages: number) => `Latest crawl was partial (${pages} pages). Some claims may be missing.`,
    lastCrawled: (date: string, n: number) => `Last crawled ${date} · ${n} ${n === 1 ? 'crawl' : 'crawls'}`,
    detectionConfidence: 'Detection confidence',
    presentNote: 'Present claims in the latest crawl.',
  },

  filters: {
    category: 'Category',
    all: 'All',
    selected: (n: number) => `${n} selected`,
    clear: 'Clear filters',
  },

  strip: {
    heading: 'Claims',
    count: (total: number, present: number, removed: number) =>
      `${total} ${total === 1 ? 'claim' : 'claims'} (${present} present, ${removed} removed)`,
    legend: 'Dashed border = needs verification · Greyed = no longer found',
    none: 'No claims detected on this site yet.',
    noMatch: 'No claims match these filters.',
    removedLastSeen: (date: string) => `Removed · last seen ${date}`,
  },

  drawer: {
    details: 'Details for this claim',
    close: 'Close',
    removed: 'Removed',
    context: 'Context',
    source: 'Source',
    legalRef: 'Legal reference',
    legalNote: 'Indicative mapping, not a legal assessment.',
    grayZone: 'Gray zone',
    history: 'Crawl history',
    firstLastSeen: (first: string, last: string) => `First seen ${first} · Last seen ${last}`,
    crawlFailed: 'Crawl failed',
    seen: 'Seen',
    notSeen: 'Not seen',
    partialSuffix: ' (partial)',
  },

  timeline: {
    heading: 'Claims per crawl',
    split: 'Split by category',
    totalOnly: 'Show total only',
    allClaims: 'All claims',
    claims: 'Claims',
    crawlFailed: 'Crawl failed',
    partialCrawl: (pages: number) => `Partial crawl (${pages} pages)`,
    pages: (pages: number) => `${pages} ${pages === 1 ? 'page' : 'pages'}`,
    legend: 'Legend',
    oneCrawl: 'Only one crawl so far',
    note: 'Claims found at each crawl, after the current filters. Hollow dot = partial crawl.',
  },

  breakdown: {
    heading: 'Category breakdown',
    empty: 'No present claims in the latest crawl.',
    toggleHint: 'Click to toggle this category',
    note: "Present claims in the latest crawl. Category filter highlights; it doesn't hide.",
  },

  notFound: {
    title: 'Not found',
    body: "That page or firm doesn't exist.",
    back: 'Back to all firms',
  },
}

export type Messages = typeof en

// "Confidenza", never "rischio" or "gravità" as a label: confidence is not risk (PLAN §1).
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

  confidence: {
    heading: 'Confidenza',
    label: { high: 'Alta', medium: 'Media', low: 'Bassa' },
    short: { high: 'A', medium: 'M', low: 'B' },
    tooltip: 'Confidenza del rilevatore, non gravità legale',
    named: (level) => `Confidenza ${level.toLowerCase()}`,
    summary: (counts) => `Confidenza: alta ${counts.high}, media ${counts.medium}, bassa ${counts.low}`,
    filter: 'Filtro confidenza',
  },
  scope: {
    heading: 'Ambito',
    label: { IN_SCOPE: 'In ambito', NEEDS_VERIFICATION: 'Da verificare' },
    filter: 'Filtro ambito',
  },

  home: {
    title: 'Aziende',
    search: "Cerca per ID o nome dell'azienda",
    col: { id: 'ID azienda', name: 'Nome azienda', website: 'Sito web', claims: 'Claim', confidence: 'Confidenza', crawls: 'Scansioni', lastCrawled: 'Ultima scansione' },
    noMatch: (q) => `Nessuna azienda corrisponde a "${q}".`,
    showing: (from, to, total) => `Aziende ${from}–${to} di ${total}`,
    previous: 'Precedente',
    next: 'Successiva',
    previousPage: 'Vai alla pagina precedente',
    nextPage: 'Vai alla pagina successiva',
  },

  firm: {
    allFirms: '← Tutte le aziende',
    noCrawl: 'Nessuna scansione riuscita finora.',
    claimsAsOf: (date) => `Claim al ${date} (ultima scansione riuscita).`,
    partial: (pages) => `L'ultima scansione è stata parziale (${pages} pagine). Alcuni claim potrebbero mancare.`,
    lastCrawled: (date, n) => `Ultima scansione ${date} · ${n} ${n === 1 ? 'scansione' : 'scansioni'}`,
    detectionConfidence: 'Confidenza del rilevamento',
    presentNote: "Claim presenti nell'ultima scansione.",
  },

  filters: {
    category: 'Categoria',
    all: 'Tutte',
    selected: (n) => `${n} selezionate`,
    clear: 'Azzera filtri',
  },

  strip: {
    heading: 'Claim',
    count: (total, present, removed) => `${total} claim (${present} ${present === 1 ? 'presente' : 'presenti'}, ${removed} ${removed === 1 ? 'rimosso' : 'rimossi'})`,
    legend: 'Bordo tratteggiato = da verificare · In grigio = non più trovato',
    none: 'Nessun claim rilevato finora su questo sito.',
    noMatch: 'Nessun claim corrisponde a questi filtri.',
    removedLastSeen: (date) => `Rimosso · visto l'ultima volta il ${date}`,
  },

  drawer: {
    details: 'Dettagli del claim',
    close: 'Chiudi',
    removed: 'Rimosso',
    context: 'Contesto',
    source: 'Fonte',
    legalRef: 'Riferimento normativo',
    legalNote: 'Corrispondenza indicativa, non una valutazione legale.',
    grayZone: 'Zona grigia',
    history: 'Cronologia delle scansioni',
    firstLastSeen: (first, last) => `Visto la prima volta il ${first} · l'ultima il ${last}`,
    crawlFailed: 'Scansione non riuscita',
    seen: 'Visto',
    notSeen: 'Non visto',
    partialSuffix: ' (parziale)',
  },

  timeline: {
    heading: 'Claim per scansione',
    split: 'Dividi per categoria',
    totalOnly: 'Mostra solo il totale',
    allClaims: 'Tutti i claim',
    claims: 'Claim',
    crawlFailed: 'Scansione non riuscita',
    partialCrawl: (pages) => `Scansione parziale (${pages} pagine)`,
    pages: (pages) => `${pages} ${pages === 1 ? 'pagina' : 'pagine'}`,
    legend: 'Legenda',
    oneCrawl: 'Finora una sola scansione',
    note: 'Claim trovati a ogni scansione, con i filtri attuali. Punto vuoto = scansione parziale.',
  },

  breakdown: {
    heading: 'Ripartizione per categoria',
    empty: "Nessun claim presente nell'ultima scansione.",
    toggleHint: 'Clicca per attivare o disattivare questa categoria',
    note: "Claim presenti nell'ultima scansione. Il filtro per categoria evidenzia, non nasconde.",
  },

  notFound: {
    title: 'Pagina non trovata',
    body: 'Questa pagina o azienda non esiste.',
    back: 'Torna a tutte le aziende',
  },
}

export const MESSAGES: Record<Locale, Messages> = { en, it }
