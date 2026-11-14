// Hand-written per-claim assessments for the demo sentences in pools.ts (PLAN_V2 §3–4).
// They stand in for the pipeline's AI assessment step: colour by judgement, one reason per claim.
// Every POOL text must have an entry (checked by generate-fixtures.test.ts).
import type { ClaimReview, Light, Scope } from '../../src/lib/types'

export type DemoReview = { scope: Scope; review: ClaimReview }

const r = (scope: Scope, light: Light, en: string, it: string): DemoReview => ({ scope, review: { light, en: { reason: en }, it: { reason: it } } })
const IN = 'IN_SCOPE'
const NV = 'NEEDS_VERIFICATION'

export const REVIEWS: Record<string, DemoReview> = {
  // ---------- generic_green ----------
  'Prodotto eco-friendly': r(
    IN,
    'red',
    'Generic "eco-friendly" with no stated benefit or evidence',
    '"Eco-friendly" generico, senza beneficio dichiarato né prove',
  ),
  'Packaging 100% sostenibile': r(
    IN,
    'red',
    'Absolute "100% sustainable" with no definition of sustainability',
    '"100% sostenibile" assoluto, senza definire la sostenibilità',
  ),
  "Rispettiamo l'ambiente in ogni fase della produzione": r(
    IN,
    'red',
    'Absolute, company-wide wording covering every production stage; no evidence beside the claim',
    'Formulazione assoluta, riferita a tutta l\'azienda e a ogni fase produttiva; nessuna prova accanto al claim',
  ),
  'Una scelta green per il pianeta': r(
    IN,
    'red',
    'Broad "green choice for the planet" with no specific benefit',
    '"Scelta green per il pianeta" generica, senza un beneficio specifico',
  ),
  'Azienda sostenibile dal 1985': r(
    IN,
    'yellow',
    'Company-level "sustainable" with a date but no content',
    '"Sostenibile" riferito all\'azienda, con una data ma senza contenuto',
  ),
  'Energia 100% rinnovabile nei nostri stabilimenti': r(
    NV,
    'yellow',
    'Specific renewable-energy share; check the source and which plants are covered',
    'Quota specifica di energia rinnovabile; verificare la fonte e quali stabilimenti sono coperti',
  ),
  "Amici dell'ambiente, ogni giorno": r(
    IN,
    'red',
    'Slogan-like generic claim with no content',
    'Claim generico in forma di slogan, privo di contenuto',
  ),
  'Prodotti naturali e sostenibili': r(
    IN,
    'red',
    '"Natural" and "sustainable" together, neither defined',
    '"Naturali" e "sostenibili" insieme, nessuno dei due definito',
  ),

  // ---------- certification ----------
  'Carta certificata FSC®': r(
    NV,
    'yellow',
    'Named third-party scheme; check the certificate and what it covers',
    'Schema di terza parte nominato; verificare il certificato e che cosa copre',
  ),
  'Prodotto con marchio Ecolabel UE': r(
    NV,
    'yellow',
    'Official EU label; check that the licence covers this product',
    'Marchio ufficiale UE; verificare che la licenza copra questo prodotto',
  ),
  'Ingredienti da agricoltura biologica certificata': r(
    NV,
    'yellow',
    'Organic certification; check which ingredients and which control body',
    'Certificazione biologica; verificare quali ingredienti e quale organismo di controllo',
  ),
  'Stabilimento certificato ISO 14001': r(
    NV,
    'yellow',
    'Site management certificate; check it is not read as a product benefit',
    'Certificato di gestione dello stabilimento; verificare che non venga letto come beneficio di prodotto',
  ),
  "Siamo un'azienda certificata B Corp": r(
    NV,
    'yellow',
    'Company-level certification; check its status and how it is presented',
    'Certificazione a livello aziendale; verificare lo stato e come viene presentata',
  ),
  'Marchio VerdeGaranzia per la sostenibilità': r(
    IN,
    'red',
    'Sustainability label with no visible certification scheme behind it',
    'Marchio di sostenibilità senza un sistema di certificazione visibile',
  ),
  'Certificazione ambientale di filiera': r(
    IN,
    'red',
    '"Environmental certification" with no named scheme or certifier',
    '"Certificazione ambientale" senza schema o ente certificatore indicati',
  ),
  'Etichetta Eco Qualità 2026': r(
    IN,
    'red',
    'Label that looks self-awarded; no certification scheme named',
    "Etichetta che sembra autoattribuita; nessuno schema di certificazione indicato",
  ),

  // ---------- recycled_recyclable ----------
  'Packaging 100% riciclato': r(
    NV,
    'yellow',
    'Specific recycled share; check that it covers every component',
    'Quota di riciclato specifica; verificare che copra ogni componente',
  ),
  'Bottiglia in plastica riciclata al 50%': r(
    NV,
    'yellow',
    'Clear recycled share and component; check how it is measured',
    'Quota e componente chiari; verificare come viene misurata la quota',
  ),
  'Confezione completamente riciclabile': r(
    IN,
    'yellow',
    '"Fully recyclable" depends on local collection and on every component',
    '"Completamente riciclabile" dipende dalla raccolta locale e da ogni componente',
  ),
  'Vaschetta in bioplastica compostabile': r(
    NV,
    'yellow',
    'Compostable claim; check the standard and where it can be composted',
    'Claim di compostabilità; verificare lo standard e dove può essere compostata',
  ),
  'Carta riciclata post-consumo': r(
    NV,
    'yellow',
    'Type of recycled paper stated; the share is missing',
    'Tipo di carta riciclata indicato; manca la quota',
  ),
  'Imballaggi riciclabili nella raccolta della carta': r(
    NV,
    'yellow',
    'Recyclability with a disposal route; check every component',
    'Riciclabilità con modalità di smaltimento indicata; verificare ogni componente',
  ),
  'Tappo in materiale di origine vegetale': r(
    IN,
    'yellow',
    'Plant-based cap: the environmental benefit is implied, not stated',
    'Tappo di origine vegetale: il beneficio ambientale è suggerito, non dichiarato',
  ),
  'Etichetta stampata su carta riciclata': r(
    NV,
    'yellow',
    'Claim about one minor component; check it is not read as product-wide',
    "Claim su un componente secondario; verificare che non venga letto come riferito all'intero prodotto",
  ),

  // ---------- vague_supply_chain ----------
  'Benessere animale garantito': r(
    IN,
    'red',
    'Absolute "guaranteed" animal welfare with no standard named',
    'Benessere animale "garantito" in modo assoluto, senza standard indicato',
  ),
  'Filiera controllata e responsabile': r(
    IN,
    'yellow',
    '"Controlled and responsible" supply chain with no criteria',
    'Filiera "controllata e responsabile" senza criteri',
  ),
  'Materie prime da fonti responsabili': r(
    IN,
    'yellow',
    '"Responsible sources" not defined; share of materials unclear',
    '"Fonti responsabili" non definite; quota delle materie prime poco chiara',
  ),
  'Coltivato nel rispetto della natura': r(
    IN,
    'yellow',
    'Farming practice described only in general terms',
    'Pratica agricola descritta solo in termini generali',
  ),
  'Fornitori selezionati per il loro impegno ambientale': r(
    IN,
    'yellow',
    'Supplier selection criteria not stated',
    'Criteri di selezione dei fornitori non indicati',
  ),
  'Pesca responsabile': r(
    IN,
    'yellow',
    '"Responsible fishing" without a named scheme (e.g. MSC)',
    '"Pesca responsabile" senza uno schema indicato (ad es. MSC)',
  ),
  "Allevamenti attenti all'ambiente": r(
    IN,
    'yellow',
    'Farms described as "environmentally attentive" with no measures named',
    'Allevamenti "attenti all\'ambiente" senza misure indicate',
  ),
  'Produzione etica e trasparente': r(
    IN,
    'yellow',
    'Broad ethical claim; environmental content unclear',
    'Claim etico ampio; contenuto ambientale poco chiaro',
  ),

  // ---------- named_endorsement ----------
  "Raccomandato dall'Associazione Consumatori Consapevoli": r(
    IN,
    'yellow',
    'Recommendation by a named association; its basis is not shown',
    "Raccomandazione di un'associazione nominata; non è indicato su che cosa si basi",
  ),
  'Approvato da Rete Ambiente Italia': r(
    IN,
    'red',
    '"Approved by" a body that works like an unofficial label',
    '"Approvato da" un ente che funziona come un marchio non ufficiale',
  ),
  "Selezionato dall'Osservatorio Prodotti Verdi": r(
    IN,
    'yellow',
    'Selection by an observatory; criteria not visible',
    'Selezione da parte di un osservatorio; criteri non visibili',
  ),
  'Partner ufficiale di Mare Pulito Onlus': r(
    NV,
    'yellow',
    'Partnership with a charity; it says nothing about the product',
    'Partnership con una onlus; non dice nulla sul prodotto',
  ),
  'Premiato da Green Award Italia 2025': r(
    NV,
    'yellow',
    'Award; check what it rewarded and who granted it',
    'Premio; verificare che cosa ha premiato e chi lo ha assegnato',
  ),
  'Con il patrocinio del Comitato Clima Sostenibile': r(
    IN,
    'yellow',
    'Patronage presented as an environmental endorsement',
    'Patrocinio presentato come avallo ambientale',
  ),
  'Consigliato dalla Fondazione Terra Viva': r(
    IN,
    'yellow',
    'Recommendation by a foundation; its basis is not shown',
    'Raccomandazione di una fondazione; la base non è indicata',
  ),
  'Sostenuto da Alleanza per le Foreste': r(
    IN,
    'yellow',
    'Support from an alliance; unclear whether it certifies anything',
    "Sostegno di un'alleanza; non è chiaro se certifichi qualcosa",
  ),

  // ---------- brand_eco_slogan ----------
  'Linea VerdeVivo: la natura in ogni gesto': r(
    IN,
    'red',
    'Product-line slogan presenting every product as nature-friendly',
    'Slogan di linea che presenta ogni prodotto come rispettoso della natura',
  ),
  'EcoPiù, la scelta naturale': r(
    IN,
    'red',
    'Brand name with "eco" and an undefined "natural choice"',
    'Nome di marca con "eco" e una "scelta naturale" non definita',
  ),
  'Natura Pura – il gusto del rispetto': r(
    IN,
    'yellow',
    'Brand line evoking nature; the environmental claim is mostly implied',
    'Linea che evoca la natura; il claim ambientale è per lo più implicito',
  ),
  'Pensa Verde, vivi meglio': r(
    IN,
    'yellow',
    'Lifestyle slogan; green wording but no product promise',
    'Slogan di stile di vita; linguaggio green ma nessuna promessa di prodotto',
  ),
  'Gamma TerraAmica': r(
    IN,
    'yellow',
    'Range name suggests an environmental benefit ("Earth-friendly")',
    'Il nome della gamma suggerisce un beneficio ambientale ("amica della Terra")',
  ),
  'BioSorriso: buono per te, buono per il pianeta': r(
    IN,
    'red',
    'Brand slogan claiming the product is "good for the planet"',
    'Slogan di marca che afferma che il prodotto è "buono per il pianeta"',
  ),
  'Collezione Respiro Verde': r(
    IN,
    'yellow',
    'Collection name with green imagery only',
    'Nome di collezione con sola immagine green',
  ),
  "Linea Zero Pensieri per l'ambiente": r(
    IN,
    'red',
    'Implies the products have no environmental impact to worry about',
    'Suggerisce che i prodotti non abbiano impatti ambientali di cui preoccuparsi',
  ),

  // ---------- climate_neutral ----------
  'Carbon neutral grazie alla compensazione delle emissioni': r(
    IN,
    'red',
    'Carbon neutrality explicitly based on offsetting',
    'Neutralità carbonica basata esplicitamente sulla compensazione',
  ),
  'Emissioni compensate al 100%': r(
    IN,
    'red',
    'Full offsetting presented as a product benefit',
    'Compensazione totale presentata come beneficio di prodotto',
  ),
  'Impatto climatico zero': r(
    IN,
    'red',
    'Absolute "zero climate impact" claim',
    'Claim assoluto di "impatto climatico zero"',
  ),
  'Prodotto a impatto climatico neutro': r(
    IN,
    'red',
    'Climate-neutral product claim, most likely based on offsetting',
    'Claim di prodotto a impatto climatico neutro, molto probabilmente basato sulla compensazione',
  ),

  // ---------- risk_reduction ----------
  '-30% di emissioni di CO₂ rispetto al 2020': r(
    NV,
    'yellow',
    'Quantified reduction with a baseline; check scope and method',
    'Riduzione quantificata con anno base; verificare perimetro e metodo',
  ),
  "Riduce il consumo d'acqua del 40%": r(
    IN,
    'yellow',
    '40% water saving without a baseline',
    "Risparmio d'acqua del 40% senza base di riferimento",
  ),
  'Stabilimento alimentato per il 60% da pannelli solari': r(
    NV,
    'yellow',
    "Could be read as 60% of all the plant's energy rather than of its electricity",
    "Potrebbe essere letto come il 60% di tutta l'energia dello stabilimento anziché dell'elettricità",
  ),
  'Ridotto del 25% il consumo energetico per unità prodotta': r(
    NV,
    'yellow',
    'Specific reduction per unit; the baseline year is missing',
    "Riduzione specifica per unità; manca l'anno di riferimento",
  ),

  // ---------- vague_comparison ----------
  'A ridotto impatto ambientale': r(
    IN,
    'yellow',
    'Reduced impact claimed with no baseline or figure',
    'Impatto ridotto senza base di riferimento né dati',
  ),
  'Meno plastica, meno impatto': r(
    IN,
    'yellow',
    'Less plastic is assumed to mean less impact',
    'Si presume che meno plastica significhi meno impatto',
  ),
  "Un'incredibile riduzione dei consumi energetici": r(
    IN,
    'yellow',
    'Comparative result without a visible baseline, period or quantified reduction',
    'Risultato comparativo senza base di riferimento, periodo o riduzione quantificata visibili',
  ),
  'Più sostenibile rispetto alla versione precedente': r(
    IN,
    'yellow',
    'Comparison with the previous version; "more sustainable" not defined',
    'Confronto con la versione precedente; "più sostenibile" non definito',
  ),

  // ---------- future_performance ----------
  'Neutrali per il clima entro il 2030': r(
    IN,
    'yellow',
    'Climate-neutral target without a visible plan or verification',
    'Obiettivo di neutralità climatica senza piano o verifica visibili',
  ),
  'Zero emissioni nette entro il 2040': r(
    IN,
    'yellow',
    'Net-zero target; plan and interim milestones not shown',
    'Obiettivo net zero; piano e tappe intermedie non visibili',
  ),
  'Entro il 2028 tutti i nostri imballaggi saranno riciclabili': r(
    IN,
    'yellow',
    "Packaging target; today's status and the plan are not shown",
    'Obiettivo sugli imballaggi; situazione attuale e piano non indicati',
  ),
  "Dimezzeremo l'uso di plastica vergine entro il 2030": r(
    IN,
    'yellow',
    'Reduction target without a baseline year',
    'Obiettivo di riduzione senza anno di riferimento',
  ),
}
