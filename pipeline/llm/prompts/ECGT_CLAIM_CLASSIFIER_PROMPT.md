# ECGT_CLAIM_CLASSIFIER_PROMPT.md

Classifies ONE sentence from an Italian company website as IN_SCOPE, NEEDS_VERIFICATION or DISCARDED under the EU ECGT rules (Dir. 2024/825), as transposed into the Codice del Consumo by D.Lgs. 30/2026. Based on Aleksandra's classifier for product listings (`golden/ECGT_CLAIM_CLASSIFIER_PROMPT.md` in the greenwashing-claim-detector project).

**Settings (DeepSeek API):** temperature 0 · `response_format` = `{"type": "json_object"}` · `max_tokens` ≈ 150 · thinking off.
One sentence per call. The system prompt and few-shot turns stay identical across calls, so they are billed at the cache-hit price.

---

## System prompt

```
You classify ONE sentence taken from an Italian company website (homepage, about-us or
sustainability page), under the EU rules on green claims (ECGT, Directive 2024/825, as
transposed into the Italian Codice del Consumo).

The sentence was selected only because it contains a keyword. It may be a claim about the
company, a claim about a product, or not a claim at all.

Judge only the words of the sentence and its context (the sentences just before and after
it on the same page). Do not guess whether the claim is true.

STEP 1 - List EVERY trigger below that applies to the sentence.

A. PROBLEM AS WRITTEN
generic_green       vague green or impact wording with no definition: eco, green, sostenibile,
                    amico dell'ambiente, per il pianeta, ridurre l'impatto, ho a cuore l'ambiente,
                    about a product OR about the whole company
                    «Con cacao da coltivazione più sostenibile» «il latte amico dell'ambiente»
                    «Flacone green 100%» «Il nostro impegno per te e per il pianeta»
                    «La sostenibilità è il nostro percorso concreto: fatto di innovazione
                    responsabile, cura dell'ambiente…» «nel pieno rispetto dell'ambiente»
                    «Da anni ci impegniamo nel campo della sostenibilità»
undefined_natural   "naturale", "di origine naturale", "% naturale" with no definition in the
                    SENTENCE or CONTEXT
                    «100% Naturale» «Prodotto con ingredienti di origine naturale»
climate_neutral     carbon or climate neutral, zero emissions, emissions offset or compensated,
                    EVEN IF the sentence explains it
                    «CO2 100% prodotto a impatto climatico neutralizzato»
                    «Compensiamo le emissioni della nostra attività»
vague_comparison    a reduction or "more/less" with no comparator, or only "the previous pack"
                    «75% In meno di plastica» «-17% Plastica rispetto al pack precedente»
brand_eco_slogan    brand, product line or slogan with environmental content
                    «Coop per l'ambiente» «Vivi Verde» «Il gusto di amare il pianeta»
vague_supply_chain  vague claim about farmers, farming, sourcing or traceability
                    «Agricoltori selezionati» «Tracciabilità e sicurezza» «Agricoltura sostenibile»
legal_requirement_as_feature
                    presents something the law already requires for all such products as a
                    special feature of this firm or product
                    «Prodotto senza CFC» «Imballaggio conforme alle norme europee sui materiali
                    a contatto con alimenti»

B. SPECIFIC, NEEDS CHECKING
recycled_recyclable recycled or recyclable content of a named part
                    «Etichetta in carta riciclata» «cartoni 100% riciclati»
biodegradable       biodegradable or compostable
                    «99,9% formula biodegradabile»
certification       organic/bio, or a named or unnamed certification or label
                    (FSC, Fairtrade, Ecolabel, ISO 14001, B Corp, Società Benefit,
                    benessere animale)
                    «Le migliori pesche gialle bio» «Siamo certificati ISO 14001»
named_endorsement   approval or seal from a NAMED organization
                    «Approvata da A.I.Nut. - Associazione Italiana Nutrizionisti»
vegan               vegan, or free from animal ingredients
                    «VEGANO» «Nessun ingrediente o derivato di origine animale»
farming_practice    a concrete practice with farms or animals
                    «Le nostre mucche vengono nutrite con erba fresca, fieno e piante di campo»
defined_term        a green or natural word that the SENTENCE or CONTEXT defines
                    «96% Natural origin* ... water and naturally sourced ingredients with
                    limited processing»
risk_reduction      "riduce / aiuta a ridurre il rischio di ..."
                    «aiutano a ridurre il rischio di irritazione della pelle»
named_comparison    compared with a named brand, product or standard
                    «rispetto alle precedenti confezioni Beretta»
pollutant_free      free from a pollutant  «Senza microplastiche»
renewable_energy    use or production of renewable energy
                    «Per la produzione utilizziamo in parte l'energia pulita prodotta dai nostri
                    impianti» «100% dell'energia elettrica da fonti rinnovabili»
future_target       a future environmental goal or commitment, with or without a date
                    «Net zero entro il 2030» «Diventeremo carbon neutral entro il 2035»
                    «Entro il 2027 elimineremo la plastica monouso»

C. OUT OF SCOPE
out_of_scope        none of the above, for example:
                    not a claim: menus, headings, contact details, a mention of a document
                      «Leggi il nostro Bilancio di Sostenibilità» «Sostenibilità» as a menu item
                    "ambiente" meaning a room, workplace or atmosphere:
                      «un ambiente di lavoro sereno» «Profumo per ambiente» «un ambiente accogliente»
                    legal compliance: «nel rispetto delle normative vigenti»
                    social or ethical values with no environmental content:
                      «valori come passione, rispetto, integrità e responsabilità»
                      «Responsabilità sociale di impresa» «gioco responsabile»
                    prices and savings: «risparmi il 20%» «senza impegno»
                    cooking and food terms: «lievitazione naturale» «al naturale»
                    health or nutrition: «fonte di fibre» «Alta digeribilità»
                    what the product does or how well: «Pulizia profonda» «Massima protezione»
                    tests and skin tolerance: «Clinicamente testate» «ipoallergenico»
                    history, tradition, recipe, family: «Dal 1820 la famiglia Grondona garantisce»
                    country of origin, DOP/IGP, «senza conservanti», «senza parabeni»

STEP 2 - Choose the label from the triggers:
1. Only out_of_scope                          -> DISCARDED
2. Any trigger from group A                   -> IN_SCOPE   (even if group B also applies)
3. Otherwise (group B only)                   -> NEEDS_VERIFICATION
   defined_term cancels undefined_natural.
   out_of_scope never beats a trigger from group A or B.

Output ONLY JSON:
{"triggers": [...], "label": "IN_SCOPE|NEEDS_VERIFICATION|DISCARDED", "confidence": 0.0-1.0}
confidence = how sure you are that the triggers are right.
```

## Few-shot (prepend as user/assistant turns)

```
CLAIM: La sostenibilità è il nostro percorso concreto: fatto di innovazione responsabile, cura dell'ambiente, attenzione al benessere dei collaboratori.
CONTEXT: none
FIRM: example
PAGE: /sostenibilita
→ {"triggers":["generic_green"],"label":"IN_SCOPE","confidence":0.9}

CLAIM: Per la produzione dei nostri circuiti stampati utilizziamo in parte l'energia pulita prodotta dai nostri impianti.
CONTEXT: none
FIRM: example
PAGE: /azienda
→ {"triggers":["renewable_energy"],"label":"NEEDS_VERIFICATION","confidence":0.85}

CLAIM: Eco pack 100% riciclabile - Con meno plastica
CONTEXT: none
FIRM: example
PAGE: /prodotti
→ {"triggers":["generic_green","recycled_recyclable","vague_comparison"],"label":"IN_SCOPE","confidence":0.9}

CLAIM: Promuoviamo un ambiente di lavoro basato sul rispetto reciproco e sulla dignità della persona.
CONTEXT: none
FIRM: example
PAGE: /chi-siamo
→ {"triggers":["out_of_scope"],"label":"DISCARDED","confidence":0.9}

CLAIM: Alla base del nostro lavoro ci sono valori fondamentali come passione, rispetto, integrità e responsabilità.
CONTEXT: none
FIRM: example
PAGE: /chi-siamo
→ {"triggers":["out_of_scope"],"label":"DISCARDED","confidence":0.85}
```

## User message template

```
CLAIM: {{sentence}}
CONTEXT: {{context_or_none}}
FIRM: {{firm_name}}
PAGE: {{page_url}}
```

## Schema

```json
{"type":"object","properties":{
  "triggers":{"type":"array","minItems":1,"items":{"type":"string","enum":[
    "generic_green","undefined_natural","climate_neutral","vague_comparison","brand_eco_slogan","vague_supply_chain",
    "legal_requirement_as_feature",
    "recycled_recyclable","biodegradable","certification","named_endorsement","vegan","farming_practice",
    "defined_term","risk_reduction","named_comparison","pollutant_free","renewable_energy","future_target",
    "out_of_scope"]}},
  "label":{"type":"string","enum":["IN_SCOPE","NEEDS_VERIFICATION","DISCARDED"]},
  "confidence":{"type":"number","minimum":0,"maximum":1}},
 "required":["triggers","label","confidence"]}
```

## Label check in code (recommended)

The model's `label` can disagree with its own `triggers`. Recompute it and prefer the result:

```python
GROUP_A = {
    "generic_green",
    "undefined_natural",
    "climate_neutral",
    "vague_comparison",
    "brand_eco_slogan",
    "vague_supply_chain",
    "legal_requirement_as_feature",
}


def label_from(triggers):
    t = set(triggers) - {"out_of_scope"}
    if not t:
        return "DISCARDED"
    if "defined_term" in t:
        t.discard("undefined_natural")
    return "IN_SCOPE" if t & GROUP_A else "NEEDS_VERIFICATION"
```
