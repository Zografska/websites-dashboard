import type { Claim } from '@/lib/types'
import type { Locale } from './messages'

/**
 * Texts per category: `why` explains the category, `advice` is general advice for it.
 * `reason` is only the fallback for a claim whose data carries no reason of its own.
 */
export type CategoryAdvice = { reason: string; why: string; advice: string }

type AdviceSet = Record<string, CategoryAdvice> & { _fallback: CategoryAdvice }

const en: AdviceSet = {
  generic_green: {
    reason: 'Broad environmental wording; the specific benefit and evidence are not visible beside the claim',
    why: 'Words such as "sustainable", "green" or "eco-friendly" suggest an overall environmental benefit without saying what it is. Under the amended UCPD, a generic claim is only allowed when the firm can show recognised excellent environmental performance.',
    advice: 'Replace the generic word with the specific benefit, its scope and where the evidence can be found, or remove it.',
  },
  undefined_natural: {
    reason: '"Natural" used without a definition of what it covers',
    why: 'An undefined "natural" claim can be read as an environmental benefit. Without a definition, the consumer cannot tell which ingredients or processes it refers to.',
    advice: 'Define the term beside the claim (for example the share of ingredients of natural origin) or remove it.',
  },
  brand_eco_slogan: {
    reason: 'Eco wording in a brand line or slogan implies a general environmental benefit',
    why: 'A brand or product-line name with green wording works like a generic environmental claim on every product it appears on, but usually comes with no qualification.',
    advice: 'Check that the line name is backed by a specific, documented benefit, or keep it away from environmental framing.',
  },
  vague_supply_chain: {
    reason: 'Sourcing or production practice described without a scheme, standard or scope',
    why: 'Phrases such as "responsible supply chain" or "selected suppliers" describe a practice but not what it consists of, who checks it or which share of the supply chain it covers.',
    advice: 'Name the standard or scheme and the share of the supply chain covered, or narrow the wording to what can be documented.',
  },
  recycled_recyclable: {
    reason: 'Recycled or recyclable claim; which part of the product it covers may be unclear',
    why: 'Claims about recycled content or recyclability are checkable, but must say whether they cover the product, the packaging or one component, and recyclability depends on local collection.',
    advice: 'State the component and the percentage directly beside the claim, and keep the supporting documentation ready.',
  },
  vague_comparison: {
    reason: 'Comparative result without a visible baseline, period or quantified change',
    why: 'Words such as "less", "better" or "reduced" imply a comparison, but the consumer cannot tell compared with what, over which period or by how much.',
    advice: 'State the baseline, the period and the size of the change, and make the underlying data available.',
  },
  risk_reduction: {
    reason: 'Reduced-impact claim; measurement and reference period are not visible',
    why: 'A claim of reduced emissions, water or energy use is specific in direction, but the size of the reduction, its scope and how it was measured need to be clear.',
    advice: 'Add the measured figure, the reference period and the scope, and link to the study or report.',
  },
  certification: {
    reason: 'Certification or label: check that it is a recognised scheme and that the claim matches its scope',
    why: 'Since the ECGT amendments, sustainability labels must rest on a certification scheme or be set up by a public authority. A named, recognised scheme is a strong signal, but its scope must match what the claim says.',
    advice: 'Keep the certificate reference at hand and link to the scheme, or drop self-made labels.',
  },
  named_endorsement: {
    reason: 'Endorsement by a named organisation; the basis of the endorsement is not visible',
    why: 'An endorsement or award can look like a sustainability label. If it is not based on a certification scheme or public authority, it may fall under the label ban.',
    advice: 'Explain what the endorsement certifies and who granted it, or stop presenting it as a sustainability label.',
  },
  climate_neutral: {
    reason: 'Climate-neutral or reduced-impact claim that may rely on offsetting',
    why: 'Claims that a product has a neutral, reduced or positive climate impact because emissions are offset are banned under UCPD Annex I (point 4c).',
    advice: 'Remove offset-based neutrality claims; describe actual reductions and any offsetting separately.',
  },
  future_performance: {
    reason: 'Future environmental target without a visible plan or verification',
    why: 'Claims about future performance are only allowed with clear, verifiable commitments, a detailed public implementation plan and regular independent monitoring.',
    advice: 'Link the target to its public plan and its independent verification, or rephrase it as an intention.',
  },
  part_for_whole: {
    reason: 'The claim presents the whole company or product as environmentally friendly on the basis of a single measure or component.',
    why: 'The claim presents the whole company or product as environmentally friendly on the basis of a single measure or component. Under the amended UCPD, presenting a claim about the entire product or business when it concerns only one aspect is banned.',
    advice: 'State exactly which component, process or activity the claim covers, right beside the claim, or remove the whole-product wording.',
  },
  legal_requirement_as_feature: {
    reason: 'A legal obligation is presented as a special feature.',
    why: 'The claim presents as a special feature something the law already requires of all products or firms in the sector (for example the ban on animal testing for cosmetics, or mandatory waste handling). Under the amended UCPD this is a banned practice.',
    advice: 'Remove the claim, or check that what it describes really goes beyond what the law requires.',
  },
  resource_efficiency: {
    reason: 'Efficiency or lower-consumption claim without a visible size, baseline or conditions.',
    why: 'Claims about lower consumption or efficiency are checkable, but the consumer needs to know how large the saving is, compared with what, and under which conditions.',
    advice: 'State the size of the saving, the baseline and the test conditions beside the claim, and keep the data available.',
  },
  renewable_energy: {
    reason: 'Renewable energy claim without a visible share, source or scope.',
    why: 'Renewable energy claims are checkable, but they should say how much of the energy is renewable, where it comes from (own installation or certified supply) and which activities it covers.',
    advice: 'State the renewable share, the source (own installation or certified supply) and the activities covered.',
  },
  biodegradable: {
    reason: 'Biodegradable or compostable claim without the conditions or standard.',
    why: 'Biodegradability depends on the conditions (industrial or home composting, soil, water) and on the standard used to test it. Without this, the consumer may expect the product to break down anywhere.',
    advice: 'Name the conditions and the test standard, and say how to dispose of the product.',
  },
  pollutant_free: {
    reason: 'Free-from or low-emission claim without named substances, limits or tests.',
    why: 'Claims that a product contains no harmful substances or has low emissions are checkable, but they should name the substances, the limits and how they were tested. A free-from claim is also misleading if those substances are banned anyway.',
    advice: 'Name the substances, the limits and the test method, and avoid presenting as a feature what is banned anyway.',
  },
  farming_practice: {
    reason: 'Farming practice named without what it involves, where it applies or who checks it.',
    why: 'Practices such as integrated pest management, cover crops or biodiversity measures can support an environmental claim, but the consumer needs to know what they consist of, where they apply and who checks them.',
    advice: 'Describe the practice, the area it applies to and who verifies it.',
  },
  vegan: {
    reason: 'Vegan or animal-free claim that may imply an environmental benefit.',
    why: 'Vegan or animal-free products are often understood as more environmentally friendly. The claim itself is about composition; if an environmental benefit is implied, it should be stated and supported.',
    advice: 'Keep the claim to composition, or state and document any environmental benefit it implies.',
  },
  named_comparison: {
    reason: 'Comparison with a named alternative; basis and method should be visible.',
    why: 'A comparison with a named alternative is checkable, but it should state what is compared, by how much, over which period and with which method, so the consumer can judge it.',
    advice: 'State what is compared, by how much, over which period and with which method.',
  },
  defined_term: {
    reason: 'Specific term used; its environmental benefit should be clear and correct.',
    why: 'The claim uses a specific term (for example a natural refrigerant such as R290, or water-based paints). This is more precise than a generic claim, but the environmental benefit of that substance or technology should be clear and correct.',
    advice: 'Check that the environmental benefit of the term is accurate, and explain it briefly beside the claim.',
  },
  _fallback: {
    reason: 'Category not yet mapped to a review area',
    why: 'The detector assigned a category that the dashboard does not map to an area yet, so no specific guidance is available.',
    advice: 'Review the claim manually against the full methodology.',
  },
}

const it: AdviceSet = {
  generic_green: {
    reason: 'Formulazione ambientale ampia; il beneficio specifico e le prove non sono visibili accanto all\'affermazione',
    why: 'Parole come "sostenibile", "green" o "eco-friendly" suggeriscono un beneficio ambientale complessivo senza dire quale. Con la direttiva UCPD modificata, un\'affermazione generica è ammessa solo se l\'azienda può dimostrare un\'eccellenza riconosciuta delle prestazioni ambientali.',
    advice: 'Sostituire la parola generica con il beneficio specifico, il suo ambito e dove trovare le prove, oppure eliminarla.',
  },
  undefined_natural: {
    reason: '"Naturale" usato senza definire a che cosa si riferisce',
    why: 'Un\'affermazione "naturale" non definita può essere letta come un beneficio ambientale. Senza una definizione il consumatore non sa a quali ingredienti o processi si riferisca.',
    advice: 'Definire il termine accanto all\'affermazione (ad esempio la quota di ingredienti di origine naturale) oppure eliminarlo.',
  },
  brand_eco_slogan: {
    reason: 'Linguaggio ecologico in uno slogan o nome di linea che suggerisce un beneficio ambientale generale',
    why: 'Un nome di marchio o di linea con un linguaggio green funziona come un\'affermazione ambientale generica su ogni prodotto su cui compare, ma di solito non ha alcuna qualificazione.',
    advice: 'Verificare che il nome della linea sia sostenuto da un beneficio specifico e documentato, oppure evitare di associarlo a temi ambientali.',
  },
  vague_supply_chain: {
    reason: 'Pratica di approvvigionamento o produzione descritta senza schema, standard o ambito',
    why: 'Espressioni come "filiera responsabile" o "fornitori selezionati" descrivono una pratica ma non in che cosa consiste, chi la controlla o quale parte della filiera copre.',
    advice: 'Indicare lo standard o lo schema e la quota di filiera coperta, oppure limitare la formulazione a ciò che è documentabile.',
  },
  recycled_recyclable: {
    reason: 'Affermazione su riciclato o riciclabilità; può non essere chiaro a quale parte del prodotto si riferisca',
    why: 'Le affermazioni sul contenuto riciclato o sulla riciclabilità sono verificabili, ma devono dire se riguardano il prodotto, la confezione o un componente, e la riciclabilità dipende dalla raccolta locale.',
    advice: 'Indicare il componente e la percentuale direttamente accanto all\'affermazione e tenere pronta la documentazione di supporto.',
  },
  vague_comparison: {
    reason: 'Risultato comparativo senza base di riferimento, periodo o variazione quantificata visibili',
    why: 'Parole come "meno", "migliore" o "ridotto" implicano un confronto, ma il consumatore non sa rispetto a che cosa, in quale periodo o di quanto.',
    advice: "Indicare la base di riferimento, il periodo e l'entità della variazione, e rendere disponibili i dati.",
  },
  risk_reduction: {
    reason: "Affermazione di riduzione dell'impatto; misurazione e periodo di riferimento non visibili",
    why: "Un'affermazione di riduzione di emissioni, acqua o energia è specifica nella direzione, ma l'entità della riduzione, il suo ambito e il modo in cui è stata misurata devono essere chiari.",
    advice: "Aggiungere il dato misurato, il periodo di riferimento e l'ambito, e collegare lo studio o il rapporto.",
  },
  certification: {
    reason: 'Certificazione o marchio: verificare che sia uno schema riconosciuto e che l\'affermazione ne rispetti il perimetro',
    why: "Con le modifiche ECGT, i marchi di sostenibilità devono basarsi su un sistema di certificazione o essere istituiti da un'autorità pubblica. Uno schema riconosciuto e nominato è un segnale forte, ma il suo perimetro deve corrispondere a ciò che dice l'affermazione.",
    advice: 'Tenere a portata di mano il riferimento del certificato e collegare lo schema, oppure eliminare i marchi autoprodotti.',
  },
  named_endorsement: {
    reason: "Avallo di un ente nominato; la base dell'avallo non è visibile",
    why: "Un avallo o un premio può sembrare un marchio di sostenibilità. Se non si basa su un sistema di certificazione o su un'autorità pubblica, può rientrare nel divieto sui marchi.",
    advice: "Spiegare che cosa certifica l'avallo e chi lo ha concesso, oppure smettere di presentarlo come marchio di sostenibilità.",
  },
  climate_neutral: {
    reason: 'Affermazione di neutralità climatica o di impatto ridotto che può basarsi sulla compensazione',
    why: "Le affermazioni secondo cui un prodotto ha un impatto climatico neutro, ridotto o positivo grazie alla compensazione delle emissioni sono vietate dall'Allegato I della UCPD (punto 4c).",
    advice: 'Eliminare le affermazioni di neutralità basate sulla compensazione; descrivere separatamente le riduzioni effettive e l\'eventuale compensazione.',
  },
  future_performance: {
    reason: 'Obiettivo ambientale futuro senza piano o verifica visibili',
    why: 'Le affermazioni sulle prestazioni future sono ammesse solo con impegni chiari e verificabili, un piano di attuazione dettagliato e pubblico e un monitoraggio indipendente periodico.',
    advice: "Collegare l'obiettivo al suo piano pubblico e alla verifica indipendente, oppure riformularlo come intenzione.",
  },
  part_for_whole: {
    reason: "L'intera impresa o il prodotto è presentato come ecologico sulla base di una sola misura.",
    why: "L'affermazione presenta l'intera impresa o l'intero prodotto come rispettoso dell'ambiente sulla base di una sola misura o componente. Con la direttiva UCPD modificata, presentare un'affermazione riferita all'intero prodotto o all'intera attività quando riguarda solo un aspetto è vietato.",
    advice: "Indicare esattamente quale componente, processo o attività l'affermazione riguarda, accanto all'affermazione, oppure eliminare la formulazione riferita all'intero prodotto.",
  },
  legal_requirement_as_feature: {
    reason: 'Un obbligo di legge è presentato come caratteristica particolare.',
    why: 'L\'affermazione presenta come caratteristica particolare qualcosa che la legge già impone a tutti i prodotti o a tutte le imprese del settore (ad esempio il divieto di test sugli animali per i cosmetici o la gestione obbligatoria dei rifiuti). Con la direttiva UCPD modificata si tratta di una pratica vietata.',
    advice: 'Eliminare l\'affermazione, oppure verificare che ciò che descrive vada davvero oltre quanto richiede la legge.',
  },
  resource_efficiency: {
    reason: 'Affermazione di efficienza o minor consumo senza entità, base di riferimento o condizioni visibili.',
    why: 'Le affermazioni su consumi ridotti o efficienza sono verificabili, ma il consumatore deve sapere quanto è grande il risparmio, rispetto a cosa e in quali condizioni.',
    advice: "Indicare accanto all'affermazione l'entità del risparmio, la base di riferimento e le condizioni di prova, e tenere i dati disponibili.",
  },
  renewable_energy: {
    reason: "Affermazione sull'energia rinnovabile senza quota, fonte o ambito visibili.",
    why: "Le affermazioni sull'energia rinnovabile sono verificabili, ma dovrebbero indicare quanta parte dell'energia è rinnovabile, da dove proviene (impianto proprio o fornitura certificata) e quali attività copre.",
    advice: 'Indicare la quota rinnovabile, la fonte (impianto proprio o fornitura certificata) e le attività coperte.',
  },
  biodegradable: {
    reason: 'Affermazione di biodegradabilità o compostabilità senza condizioni o norma.',
    why: 'La biodegradabilità dipende dalle condizioni (compostaggio industriale o domestico, suolo, acqua) e dalla norma con cui è verificata. Senza queste informazioni il consumatore può aspettarsi che il prodotto si degradi ovunque.',
    advice: 'Indicare le condizioni e la norma di prova, e come smaltire il prodotto.',
  },
  pollutant_free: {
    reason: 'Affermazione "senza" o a basse emissioni senza sostanze, limiti o prove indicati.',
    why: 'Le affermazioni secondo cui un prodotto non contiene sostanze nocive o ha basse emissioni sono verificabili, ma dovrebbero indicare le sostanze, i limiti e come sono stati verificati. Un\'affermazione "senza" è inoltre ingannevole se quelle sostanze sono comunque vietate.',
    advice: 'Indicare le sostanze, i limiti e il metodo di prova, ed evitare di presentare come pregio ciò che è comunque vietato.',
  },
  farming_practice: {
    reason: 'Pratica agricola indicata senza dire in cosa consiste, dove si applica e chi la controlla.',
    why: 'Pratiche come la lotta integrata, i sovesci o le misure per la biodiversità possono sostenere un\'affermazione ambientale, ma il consumatore deve sapere in cosa consistono, dove si applicano e chi le verifica.',
    advice: 'Descrivere la pratica, la superficie a cui si applica e chi la verifica.',
  },
  vegan: {
    reason: 'Affermazione vegana o senza ingredienti animali che può suggerire un beneficio ambientale.',
    why: "I prodotti vegani o senza ingredienti di origine animale sono spesso percepiti come più rispettosi dell'ambiente. L'affermazione riguarda la composizione; se suggerisce un beneficio ambientale, questo dovrebbe essere indicato e documentato.",
    advice: "Limitare l'affermazione alla composizione, oppure indicare e documentare l'eventuale beneficio ambientale suggerito.",
  },
  named_comparison: {
    reason: "Confronto con un'alternativa indicata; base e metodo dovrebbero essere visibili.",
    why: "Un confronto con un'alternativa indicata è verificabile, ma dovrebbe precisare cosa si confronta, di quanto, in quale periodo e con quale metodo, così che il consumatore possa valutarlo.",
    advice: 'Indicare cosa si confronta, di quanto, in quale periodo e con quale metodo.',
  },
  defined_term: {
    reason: 'Termine specifico usato; il suo beneficio ambientale dovrebbe essere chiaro e corretto.',
    why: "L'affermazione usa un termine specifico (ad esempio un refrigerante naturale come l'R290 o vernici all'acqua). È più precisa di un'affermazione generica, ma il beneficio ambientale di quella sostanza o tecnologia dovrebbe essere chiaro e corretto.",
    advice: 'Verificare che il beneficio ambientale del termine sia corretto e spiegarlo brevemente accanto all\'affermazione.',
  },
  _fallback: {
    reason: "Categoria non ancora associata a un'area di revisione",
    why: "Il rilevatore ha assegnato una categoria che la dashboard non associa ancora a un'area, quindi non sono disponibili indicazioni specifiche.",
    advice: 'Esaminare l\'affermazione manualmente alla luce della metodologia completa.',
  },
}

export const ADVICE: Record<Locale, AdviceSet> = { en, it }

/** The claim's reason from the data (fallback: the category's), plus the category's why and advice. */
export function claimAdvice(claim: Claim, locale: Locale): CategoryAdvice {
  const category = adviceFor(claim.category, locale)
  return { ...category, reason: claim.review?.[locale].reason ?? category.reason }
}

export function adviceFor(category: string, locale: Locale): CategoryAdvice {
  const set = ADVICE[locale]
  return category !== '_fallback' && Object.hasOwn(set, category) ? set[category] : set._fallback
}
