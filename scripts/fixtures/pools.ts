// Synthetic Italian text pools for the demo fixtures (IMPLEMENTATION_PLAN §9.3).
// All firm, scheme-owner and brand-line names are fictional; legal_ref values are indicative only.

export type LegalRef = { ucpd: string | null; codice_consumo: string | null }
export type PoolEntry = { category: string; text: string; legal_ref: LegalRef }

export const CATEGORIES = [
  'generic_green',
  'certification',
  'recycled_recyclable',
  'vague_supply_chain',
  'named_endorsement',
  'brand_eco_slogan',
  'risk_reduction',
  'vague_comparison',
  'climate_neutral',
  'future_performance',
] as const

const ref = (ucpd: string, codice_consumo: string): LegalRef => ({ ucpd, codice_consumo })

const group = (category: string, legal_ref: LegalRef, texts: string[]): PoolEntry[] =>
  texts.map((text) => ({ category, text, legal_ref }))

const OFFSET = ref('Annex I 4c', 'Art. 23')
const FUTURE = ref('Art. 6(2)(d)', 'Art. 21')

export const POOL: readonly PoolEntry[] = [
  ...group('generic_green', ref('Annex I 4a', 'Art. 23'), [
    'Prodotto eco-friendly',
    'Packaging 100% sostenibile',
    "Rispettiamo l'ambiente in ogni fase della produzione",
    'Una scelta green per il pianeta',
    'Azienda sostenibile dal 1985',
    'Energia 100% rinnovabile nei nostri stabilimenti',
    "Amici dell'ambiente, ogni giorno",
    'Prodotti naturali e sostenibili',
  ]),
  ...group('certification', ref('Annex I 2a', 'Art. 23'), [
    'Carta certificata FSC®',
    'Prodotto con marchio Ecolabel UE',
    'Ingredienti da agricoltura biologica certificata',
    'Stabilimento certificato ISO 14001',
    "Siamo un'azienda certificata B Corp",
    'Marchio VerdeGaranzia per la sostenibilità',
    'Certificazione ambientale di filiera',
    'Etichetta Eco Qualità 2026',
  ]),
  ...group('recycled_recyclable', ref('Art. 6(1)', 'Art. 21'), [
    'Packaging 100% riciclato',
    'Bottiglia in plastica riciclata al 50%',
    'Confezione completamente riciclabile',
    'Vaschetta in bioplastica compostabile',
    'Carta riciclata post-consumo',
    'Imballaggi riciclabili nella raccolta della carta',
    'Tappo in materiale di origine vegetale',
    'Etichetta stampata su carta riciclata',
  ]),
  ...group('vague_supply_chain', ref('Art. 7', 'Art. 22'), [
    'Benessere animale garantito',
    'Filiera controllata e responsabile',
    'Materie prime da fonti responsabili',
    'Coltivato nel rispetto della natura',
    'Fornitori selezionati per il loro impegno ambientale',
    'Pesca responsabile',
    "Allevamenti attenti all'ambiente",
    'Produzione etica e trasparente',
  ]),
  ...group('named_endorsement', ref('Annex I 4', 'Art. 23'), [
    "Raccomandato dall'Associazione Consumatori Consapevoli",
    'Approvato da Rete Ambiente Italia',
    "Selezionato dall'Osservatorio Prodotti Verdi",
    'Partner ufficiale di Mare Pulito Onlus',
    'Premiato da Green Award Italia 2025',
    'Con il patrocinio del Comitato Clima Sostenibile',
    'Consigliato dalla Fondazione Terra Viva',
    'Sostenuto da Alleanza per le Foreste',
  ]),
  ...group('brand_eco_slogan', ref('Annex I 4a', 'Art. 23'), [
    'Linea VerdeVivo: la natura in ogni gesto',
    'EcoPiù, la scelta naturale',
    'Natura Pura – il gusto del rispetto',
    'Pensa Verde, vivi meglio',
    'Gamma TerraAmica',
    'BioSorriso: buono per te, buono per il pianeta',
    'Collezione Respiro Verde',
    "Linea Zero Pensieri per l'ambiente",
  ]),
  ...group('climate_neutral', OFFSET, [
    'Carbon neutral grazie alla compensazione delle emissioni',
    'Emissioni compensate al 100%',
    'Impatto climatico zero',
    'Prodotto a impatto climatico neutro',
  ]),
  ...group('risk_reduction', ref('Art. 6(1)', 'Art. 21'), [
    '-30% di emissioni di CO₂ rispetto al 2020',
    "Riduce il consumo d'acqua del 40%",
    'Stabilimento alimentato per il 60% da pannelli solari',
    'Ridotto del 25% il consumo energetico per unità prodotta',
  ]),
  ...group('vague_comparison', ref('Art. 6(1)', 'Art. 21'), [
    'A ridotto impatto ambientale',
    'Meno plastica, meno impatto',
    "Un'incredibile riduzione dei consumi energetici",
    'Più sostenibile rispetto alla versione precedente',
  ]),
  ...group('future_performance', FUTURE, [
    'Neutrali per il clima entro il 2030',
    'Zero emissioni nette entro il 2040',
    'Entro il 2028 tutti i nostri imballaggi saranno riciclabili',
    "Dimezzeremo l'uso di plastica vergine entro il 2030",
  ]),
]

export const PRE = [
  'Da sempre crediamo che',
  'Per questo motivo',
  'La nostra nuova gamma offre:',
  'Scopri di più:',
  'Nel 2025 abbiamo introdotto',
  'Come dichiarato nel nostro report,',
]

export const POST = [
  'per un futuro migliore.',
  'in tutti i nostri punti vendita.',
  'Scopri i dettagli nella pagina dedicata.',
  'perché il pianeta ci sta a cuore.',
  'su tutta la gamma.',
  '(vedi note).',
]

export const NAME_A = [
  'Verde', 'Terra', 'Aqua', 'Sole', 'Bosco', 'Fiore', 'Monte', 'Lago', 'Campo', 'Vigna',
  'Olmo', 'Riva', 'Prato', 'Valle', 'Selva', 'Brezza', 'Rocca', 'Pietra', 'Fonte', 'Gelso',
]
export const NAME_B = ['luce', 'nova', 'viva', 'mare', 'sana', 'bella', 'pura', 'chiara', 'forte', 'dolce']
export const LEGAL_FORMS = ['S.r.l.', 'S.p.A.', 'S.r.l.s.']

export const SOURCE_PATHS = ['/', '/chi-siamo', '/sostenibilita', '/ambiente', '/prodotti', '/blog/impegno-green']
export const GRAY_ZONES = ['natural_footnote', 'generic_plus_specific', 'renewable_energy', 'bio_based_packaging']
