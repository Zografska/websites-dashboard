import type { Claim, ClaimAdvice } from '@/lib/types'
import type { Locale } from './messages'

/**
 * Fallback advice per category (PLAN_V2 §4), used when a claim has no `review` of its own.
 * `reason` is the one line in the Claim examples table.
 */
export type Advice = ClaimAdvice

type AdviceSet = Record<string, Advice> & { _fallback: Advice }

const en: AdviceSet = {
  generic_green: {
    reason: 'Broad environmental wording; the specific benefit and evidence are not visible beside the claim',
    why: 'Words such as "sustainable", "green" or "eco-friendly" suggest an overall environmental benefit without saying what it is. Under the amended UCPD, a generic claim is only allowed when the firm can show recognised excellent environmental performance.',
    verify: [
      'Which concrete environmental benefit the wording is meant to express',
      'Whether that benefit is documented, and for which products or activities',
      'Whether a recognised scheme (e.g. EU Ecolabel) supports an excellence claim',
    ],
    action: 'Replace the generic word with the specific benefit, its scope and where the evidence can be found, or remove it.',
  },
  undefined_natural: {
    reason: '"Natural" used without a definition of what it covers',
    why: 'An undefined "natural" claim can be read as an environmental benefit. Without a definition, the consumer cannot tell which ingredients or processes it refers to.',
    verify: [
      'Which ingredients or processes the word refers to',
      'Whether a definition or footnote appears next to the claim',
    ],
    action: 'Define the term beside the claim (for example the share of ingredients of natural origin) or remove it.',
  },
  brand_eco_slogan: {
    reason: 'Eco wording in a brand line or slogan implies a general environmental benefit',
    why: 'A brand or product-line name with green wording works like a generic environmental claim on every product it appears on, but usually comes with no qualification.',
    verify: [
      'Whether the slogan appears next to products that lack the implied benefit',
      'Whether a qualification or explanation accompanies the slogan',
    ],
    action: 'Check that the line name is backed by a specific, documented benefit, or keep it away from environmental framing.',
  },
  vague_supply_chain: {
    reason: 'Sourcing or production practice described without a scheme, standard or scope',
    why: 'Phrases such as "responsible supply chain" or "selected suppliers" describe a practice but not what it consists of, who checks it or which share of the supply chain it covers.',
    verify: [
      'Which standard or criteria the practice follows, and who verifies it',
      'Which share of the products or suppliers it covers',
    ],
    action: 'Name the standard or scheme and the share of the supply chain covered, or narrow the wording to what can be documented.',
  },
  recycled_recyclable: {
    reason: 'Recycled or recyclable claim; which part of the product it covers may be unclear',
    why: 'Claims about recycled content or recyclability are checkable, but must say whether they cover the product, the packaging or one component, and recyclability depends on local collection.',
    verify: [
      'Whether the claim covers the whole product or only the packaging or a component',
      'The recycled-content share and how it is measured',
      'Whether recyclability holds in Italian collection systems',
    ],
    action: 'State the component and the percentage directly beside the claim, and keep the supporting documentation ready.',
  },
  vague_comparison: {
    reason: 'Comparative result without a visible baseline, period or quantified change',
    why: 'Words such as "less", "better" or "reduced" imply a comparison, but the consumer cannot tell compared with what, over which period or by how much.',
    verify: [
      'The baseline (earlier product, year or competitor) behind the comparison',
      'The measured change, the period and the method',
    ],
    action: 'State the baseline, the period and the size of the change, and make the underlying data available.',
  },
  risk_reduction: {
    reason: 'Reduced-impact claim; measurement and reference period are not visible',
    why: 'A claim of reduced emissions, water or energy use is specific in direction, but the size of the reduction, its scope and how it was measured need to be clear.',
    verify: [
      'How the reduction was measured and over which period',
      'Whether it refers to the product, a site or the whole company',
    ],
    action: 'Add the measured figure, the reference period and the scope, and link to the study or report.',
  },
  certification: {
    reason: 'Certification or label: check that it is a recognised scheme and that the claim matches its scope',
    why: 'Since the ECGT amendments, sustainability labels must rest on a certification scheme or be set up by a public authority. A named, recognised scheme is a strong signal, but its scope must match what the claim says.',
    verify: [
      'Whether the label belongs to a third-party certification scheme or a public authority',
      'Whether the certificate is valid and covers this product or site',
      'Whether the claim wording goes beyond what the certificate covers',
    ],
    action: 'Keep the certificate reference at hand and link to the scheme, or drop self-made labels.',
  },
  named_endorsement: {
    reason: 'Endorsement by a named organisation; the basis of the endorsement is not visible',
    why: 'An endorsement or award can look like a sustainability label. If it is not based on a certification scheme or public authority, it may fall under the label ban.',
    verify: [
      'What the endorsement is based on, and whether it involved independent checks',
      'Whether it is still current and applies to this product',
    ],
    action: 'Explain what the endorsement certifies and who granted it, or stop presenting it as a sustainability label.',
  },
  climate_neutral: {
    reason: 'Climate-neutral or reduced-impact claim that may rely on offsetting',
    why: 'Claims that a product has a neutral, reduced or positive climate impact because emissions are offset are banned under UCPD Annex I (point 4c).',
    verify: [
      'Whether the claim relies on offsets rather than reductions in the value chain',
      'Which emissions scopes the claim covers',
    ],
    action: 'Remove offset-based neutrality claims; describe actual reductions and any offsetting separately.',
  },
  future_performance: {
    reason: 'Future environmental target without a visible plan or verification',
    why: 'Claims about future performance are only allowed with clear, verifiable commitments, a detailed public implementation plan and regular independent monitoring.',
    verify: [
      'Whether a detailed, public implementation plan with interim targets exists',
      'Whether an independent expert monitors progress',
    ],
    action: 'Link the target to its public plan and its independent verification, or rephrase it as an intention.',
  },
  _fallback: {
    reason: 'Category not yet mapped to a review area',
    why: 'The detector assigned a category that the dashboard does not map to an area yet, so no specific guidance is available.',
    verify: ['What the claim states, and whether it is documented'],
    action: 'Review the claim manually against the full methodology.',
  },
}

const it: AdviceSet = {
  generic_green: {
    reason: 'Formulazione ambientale ampia; il beneficio specifico e le prove non sono visibili accanto al claim',
    why: 'Parole come "sostenibile", "green" o "eco-friendly" suggeriscono un beneficio ambientale complessivo senza dire quale. Con la direttiva UCPD modificata, un claim generico è ammesso solo se l\'azienda può dimostrare un\'eccellenza riconosciuta delle prestazioni ambientali.',
    verify: [
      'Quale beneficio ambientale concreto vuole esprimere la formulazione',
      'Se quel beneficio è documentato, e per quali prodotti o attività',
      'Se un sistema riconosciuto (ad es. Ecolabel UE) sostiene un claim di eccellenza',
    ],
    action: 'Sostituire la parola generica con il beneficio specifico, il suo ambito e dove trovare le prove, oppure eliminarla.',
  },
  undefined_natural: {
    reason: '"Naturale" usato senza definire a che cosa si riferisce',
    why: 'Un claim "naturale" non definito può essere letto come un beneficio ambientale. Senza una definizione il consumatore non sa a quali ingredienti o processi si riferisca.',
    verify: [
      'A quali ingredienti o processi si riferisce la parola',
      'Se accanto al claim compaiono una definizione o una nota',
    ],
    action: 'Definire il termine accanto al claim (ad esempio la quota di ingredienti di origine naturale) oppure eliminarlo.',
  },
  brand_eco_slogan: {
    reason: 'Linguaggio ecologico in uno slogan o nome di linea che suggerisce un beneficio ambientale generale',
    why: 'Un nome di marchio o di linea con un linguaggio green funziona come un claim ambientale generico su ogni prodotto su cui compare, ma di solito non ha alcuna qualificazione.',
    verify: [
      'Se lo slogan compare accanto a prodotti privi del beneficio suggerito',
      'Se lo slogan è accompagnato da una qualificazione o spiegazione',
    ],
    action: 'Verificare che il nome della linea sia sostenuto da un beneficio specifico e documentato, oppure evitare di associarlo a temi ambientali.',
  },
  vague_supply_chain: {
    reason: 'Pratica di approvvigionamento o produzione descritta senza schema, standard o ambito',
    why: 'Espressioni come "filiera responsabile" o "fornitori selezionati" descrivono una pratica ma non in che cosa consiste, chi la controlla o quale parte della filiera copre.',
    verify: [
      'Quale standard o quali criteri segue la pratica, e chi li verifica',
      'Quale quota di prodotti o fornitori copre',
    ],
    action: 'Indicare lo standard o lo schema e la quota di filiera coperta, oppure limitare la formulazione a ciò che è documentabile.',
  },
  recycled_recyclable: {
    reason: 'Claim su riciclato o riciclabilità; può non essere chiaro a quale parte del prodotto si riferisca',
    why: 'I claim sul contenuto riciclato o sulla riciclabilità sono verificabili, ma devono dire se riguardano il prodotto, la confezione o un componente, e la riciclabilità dipende dalla raccolta locale.',
    verify: [
      "Se il claim riguarda l'intero prodotto o solo la confezione o un componente",
      'La quota di contenuto riciclato e come viene misurata',
      'Se la riciclabilità vale nei sistemi di raccolta italiani',
    ],
    action: 'Indicare il componente e la percentuale direttamente accanto al claim e tenere pronta la documentazione di supporto.',
  },
  vague_comparison: {
    reason: 'Risultato comparativo senza base di riferimento, periodo o variazione quantificata visibili',
    why: 'Parole come "meno", "migliore" o "ridotto" implicano un confronto, ma il consumatore non sa rispetto a che cosa, in quale periodo o di quanto.',
    verify: [
      'La base di riferimento (prodotto precedente, anno o concorrente) del confronto',
      'La variazione misurata, il periodo e il metodo',
    ],
    action: "Indicare la base di riferimento, il periodo e l'entità della variazione, e rendere disponibili i dati.",
  },
  risk_reduction: {
    reason: "Claim di riduzione dell'impatto; misurazione e periodo di riferimento non visibili",
    why: "Un claim di riduzione di emissioni, acqua o energia è specifico nella direzione, ma l'entità della riduzione, il suo ambito e il modo in cui è stata misurata devono essere chiari.",
    verify: [
      'Come è stata misurata la riduzione e su quale periodo',
      "Se si riferisce al prodotto, a uno stabilimento o all'intera azienda",
    ],
    action: "Aggiungere il dato misurato, il periodo di riferimento e l'ambito, e collegare lo studio o il rapporto.",
  },
  certification: {
    reason: 'Certificazione o marchio: verificare che sia uno schema riconosciuto e che il claim ne rispetti il perimetro',
    why: "Con le modifiche ECGT, i marchi di sostenibilità devono basarsi su un sistema di certificazione o essere istituiti da un'autorità pubblica. Uno schema riconosciuto e nominato è un segnale forte, ma il suo perimetro deve corrispondere a ciò che dice il claim.",
    verify: [
      "Se il marchio appartiene a un sistema di certificazione di terza parte o a un'autorità pubblica",
      'Se il certificato è valido e copre questo prodotto o stabilimento',
      'Se il claim va oltre ciò che il certificato copre',
    ],
    action: 'Tenere a portata di mano il riferimento del certificato e collegare lo schema, oppure eliminare i marchi autoprodotti.',
  },
  named_endorsement: {
    reason: "Avallo di un ente nominato; la base dell'avallo non è visibile",
    why: "Un avallo o un premio può sembrare un marchio di sostenibilità. Se non si basa su un sistema di certificazione o su un'autorità pubblica, può rientrare nel divieto sui marchi.",
    verify: [
      "Su che cosa si basa l'avallo, e se ha comportato controlli indipendenti",
      'Se è ancora valido e si applica a questo prodotto',
    ],
    action: "Spiegare che cosa certifica l'avallo e chi lo ha concesso, oppure smettere di presentarlo come marchio di sostenibilità.",
  },
  climate_neutral: {
    reason: 'Claim di neutralità climatica o di impatto ridotto che può basarsi sulla compensazione',
    why: "I claim secondo cui un prodotto ha un impatto climatico neutro, ridotto o positivo grazie alla compensazione delle emissioni sono vietati dall'Allegato I della UCPD (punto 4c).",
    verify: [
      'Se il claim si basa su compensazioni anziché su riduzioni nella catena del valore',
      'Quali ambiti di emissione copre il claim',
    ],
    action: 'Eliminare i claim di neutralità basati sulla compensazione; descrivere separatamente le riduzioni effettive e l\'eventuale compensazione.',
  },
  future_performance: {
    reason: 'Obiettivo ambientale futuro senza piano o verifica visibili',
    why: 'I claim sulle prestazioni future sono ammessi solo con impegni chiari e verificabili, un piano di attuazione dettagliato e pubblico e un monitoraggio indipendente periodico.',
    verify: [
      'Se esiste un piano di attuazione dettagliato e pubblico con obiettivi intermedi',
      'Se un esperto indipendente monitora i progressi',
    ],
    action: "Collegare l'obiettivo al suo piano pubblico e alla verifica indipendente, oppure riformularlo come intenzione.",
  },
  _fallback: {
    reason: "Categoria non ancora associata a un'area di revisione",
    why: "Il rilevatore ha assegnato una categoria che la dashboard non associa ancora a un'area, quindi non sono disponibili indicazioni specifiche.",
    verify: ['Che cosa afferma il claim, e se è documentato'],
    action: 'Esaminare il claim manualmente alla luce della metodologia completa.',
  },
}

export const ADVICE: Record<Locale, AdviceSet> = { en, it }

/** The claim's own advice when the data has it, else the category template. */
export function claimAdvice(claim: Claim, locale: Locale): Advice {
  return claim.review?.[locale] ?? adviceFor(claim.category, locale)
}

export function adviceFor(category: string, locale: Locale): Advice {
  const set = ADVICE[locale]
  return category !== '_fallback' && Object.hasOwn(set, category) ? set[category] : set._fallback
}
