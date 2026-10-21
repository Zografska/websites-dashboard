# CLAIM_EXTRACTION_PROMPT.md

**Version 1** (2026-10-21). Page-level version of `ECGT_CLAIM_CLASSIFIER_PROMPT.md` (the sentence classifier, kept for comparison). Instead of classifying one sentence, it reads one chunk of a cleaned website page and returns every environmental claim on it, quoted word for word, with its triggers and label. Same triggers and label rule.

**Settings (DeepSeek API):** temperature 0 · `response_format` = `{"type": "json_object"}` · `max_tokens` ≈ 2000 · thinking off.
One page chunk per call (up to ≈3,000 tokens of page text).

**Changes from the sentence classifier:**
- Input: a chunk of a cleaned page (FIRM, PAGE, TEXT) instead of one sentence with context.
- Output: a list of claims, each with an exact `quote` and a one-line `reason` (dashboard field); an empty list when the page has no claim. Out-of-scope text is simply not listed.
- `future_target` renamed `future_performance` (the id the dashboard v2 expects).
- From the 15 Oct accuracy check: `certification` only for environmental, organic or ethical labels (not ISO 9001 quality, ISO 22000 food safety, product authenticity); shop, brand and product names and headings are not claims by themselves; "naturalmente" (= of course) and plain material names ("fibre naturali", wool, straw) are not natural claims.
- `gray_zone`, `category`, `legal_ref` and the context snippet are set in code, not by the model.

---

## System prompt

```
You read ONE chunk of text from an Italian company website (homepage, about-us or
sustainability page) and find every ENVIRONMENTAL CLAIM in it, under the EU rules on green
claims (ECGT, Directive 2024/825, as transposed into the Italian Codice del Consumo).

An environmental claim is any statement that says or suggests that the firm, a product or
an activity is good for the environment, less harmful, natural, green, sustainable,
recycled, certified, climate-friendly, or that it will become so.

For each claim:
- quote: copy the claim EXACTLY as it appears in the text, word for word, same spelling,
  same accents and apostrophes. One sentence or one list item, never shortened, never
  merged with other text, never translated. If the same claim appears twice, list it once.
- triggers: every trigger below that applies.
- label: from the rule in STEP 2.
- confidence: how sure you are that the triggers are right, 0.0-1.0.
- reason: ONE short line in English saying why the claim may need review, written for the
  firm (e.g. "Generic 'sostenibile' claim about the whole company with no explanation on
  the page.").

Judge only the words on the page. Do not guess whether a claim is true. A word or fact
nearby on the same page may define or explain a claim (see defined_term).

Do NOT list: menu items, headings or buttons on their own, shop, brand or product names
that merely contain "bio", "eco", "natura" or "green", contact details, prices, and text
from group C. If there is no environmental claim, return an empty list.

STEP 1 - Triggers.

A. PROBLEM AS WRITTEN
generic_green       vague green or impact wording with no definition: eco, green, sostenibile,
                    amico dell'ambiente, per il pianeta, ridurre l'impatto, ho a cuore l'ambiente,
                    about a product OR about the whole company
                    «il latte amico dell'ambiente» «Flacone green 100%»
                    «La sostenibilità è il nostro percorso concreto… cura dell'ambiente»
                    «nel pieno rispetto dell'ambiente» «Da anni ci impegniamo nel campo della
                    sostenibilità»
undefined_natural   "naturale", "di origine naturale", "% naturale" as a quality of a product,
                    with no definition on the page
                    «100% Naturale» «Prodotto con ingredienti di origine naturale»
                    NOT: "naturalmente" meaning "of course"; plain materials such as
                    «fibre naturali», lana, paglia, legno massello
climate_neutral     carbon or climate neutral, zero emissions, emissions offset or compensated,
                    EVEN IF the page explains it
                    «CO2 100% prodotto a impatto climatico neutralizzato»
                    «Compensiamo le emissioni della nostra attività»
vague_comparison    a reduction or "more/less" with no comparator, or only "the previous pack"
                    «75% In meno di plastica» «-17% Plastica rispetto al pack precedente»
brand_eco_slogan    a slogan or product line whose message is environmental
                    «Coop per l'ambiente» «Vivi Verde» «Il gusto di amare il pianeta»
vague_supply_chain  vague claim about farmers, farming, sourcing or traceability as a green or
                    ethical quality
                    «Agricoltori selezionati» «Agricoltura sostenibile»
legal_requirement_as_feature
                    presents something the law already requires for all such products as a
                    special feature
                    «Prodotto senza CFC» «Imballaggio conforme alle norme europee sui materiali
                    a contatto con alimenti»

B. SPECIFIC, NEEDS CHECKING
recycled_recyclable recycled or recyclable content of a named part
                    «Etichetta in carta riciclata» «cartoni 100% riciclati»
biodegradable       biodegradable or compostable  «99,9% formula biodegradabile»
certification       an ENVIRONMENTAL, ORGANIC or ETHICAL certification or label: organic/bio,
                    FSC, Fairtrade, Ecolabel, ISO 14001, EMAS, B Corp, Società Benefit,
                    Oeko-Tex, benessere animale
                    «Le migliori pesche gialle bio» «Siamo certificati ISO 14001»
                    NOT: ISO 9001 (quality), ISO 22000 / HACCP (food safety), product
                    authenticity («Rolex Certified»), a heading such as «Certificazioni»
named_endorsement   approval or seal from a NAMED organization
                    «Approvata da A.I.Nut. - Associazione Italiana Nutrizionisti»
vegan               vegan, or free from animal ingredients
                    «VEGANO» «Nessun ingrediente o derivato di origine animale»
farming_practice    a concrete practice with farms or animals
                    «Le nostre mucche vengono nutrite con erba fresca, fieno e piante di campo»
defined_term        a green or natural word that the page itself defines or explains
                    «96% Natural origin* ... water and naturally sourced ingredients»
risk_reduction      "riduce / aiuta a ridurre il rischio di ..."
named_comparison    compared with a named brand, product or standard
                    «rispetto alle precedenti confezioni Beretta»
pollutant_free      free from a pollutant  «Senza microplastiche»
renewable_energy    use or production of renewable energy
                    «Per la produzione utilizziamo in parte l'energia pulita prodotta dai nostri
                    impianti» «100% dell'energia elettrica da fonti rinnovabili»
future_performance  a future environmental goal or commitment, with or without a date
                    «Net zero entro il 2030» «Entro il 2027 elimineremo la plastica monouso»

C. NOT A CLAIM (do not list)
                    "ambiente" meaning a room, workplace or atmosphere: «un ambiente di lavoro
                    sereno» «Profumo per ambiente»; legal compliance: «nel rispetto delle
                    normative vigenti»; social or ethical values with no environmental content:
                    «valori come passione, rispetto, integrità e responsabilità»; prices and
                    savings; cooking terms: «lievitazione naturale»; health or nutrition; what
                    the product does; tests and skin tolerance; history, tradition, family;
                    country of origin, DOP/IGP, «senza conservanti»; a mention of a document:
                    «Leggi il nostro Bilancio di Sostenibilità».

STEP 2 - Label of each claim:
1. Any trigger from group A          -> IN_SCOPE   (even if group B also applies)
2. Otherwise (group B only)          -> NEEDS_VERIFICATION
   defined_term cancels undefined_natural.

Output ONLY JSON:
{"claims": [{"quote": "...", "triggers": [...], "label": "IN_SCOPE|NEEDS_VERIFICATION",
             "confidence": 0.0-1.0, "reason": "..."}]}
```

## Few-shot (prepend as user/assistant turns)

```
FIRM: example
PAGE: /sostenibilita
TEXT:
Sostenibilità
La sostenibilità è il nostro percorso concreto: fatto di innovazione responsabile, cura dell'ambiente, attenzione al benessere dei collaboratori.
Per la produzione utilizziamo in parte l'energia pulita prodotta dai nostri impianti.
Siamo certificati ISO 9001 e ISO 14001.
Contatti
→ {"claims":[{"quote":"La sostenibilità è il nostro percorso concreto: fatto di innovazione responsabile, cura dell'ambiente, attenzione al benessere dei collaboratori.","triggers":["generic_green"],"label":"IN_SCOPE","confidence":0.9,"reason":"Generic sustainability claim about the whole company with no explanation on the page."},{"quote":"Per la produzione utilizziamo in parte l'energia pulita prodotta dai nostri impianti.","triggers":["renewable_energy"],"label":"NEEDS_VERIFICATION","confidence":0.85,"reason":"Specific renewable energy claim; the share and source should be documented."},{"quote":"Siamo certificati ISO 9001 e ISO 14001.","triggers":["certification"],"label":"NEEDS_VERIFICATION","confidence":0.85,"reason":"Environmental management certification (ISO 14001) to keep valid and verifiable."}]}

FIRM: example
PAGE: /prodotti
TEXT:
Bio Bio Shop
Eco pack 100% riciclabile - Con meno plastica
Spedizione gratuita sopra 30€
→ {"claims":[{"quote":"Eco pack 100% riciclabile - Con meno plastica","triggers":["generic_green","recycled_recyclable","vague_comparison"],"label":"IN_SCOPE","confidence":0.9,"reason":"'Eco' and 'less plastic' without a baseline, next to a specific recyclability claim."}]}

FIRM: example
PAGE: /chi-siamo
TEXT:
Chi siamo
Dal 1952 tre generazioni guidano l'azienda, con passione, rispetto e integrità.
Promuoviamo un ambiente di lavoro basato sul rispetto reciproco.
Certificazioni
Sistema di gestione qualità certificato ISO 9001:2015.
→ {"claims":[]}
```

## User message template

```
FIRM: {{firm_name}}
PAGE: {{page_url}}
TEXT:
{{text}}
```

## Schema

```json
{"type":"object","properties":{
  "claims":{"type":"array","items":{"type":"object","properties":{
    "quote":{"type":"string"},
    "triggers":{"type":"array","minItems":1,"items":{"type":"string","enum":[
      "generic_green","undefined_natural","climate_neutral","vague_comparison","brand_eco_slogan","vague_supply_chain",
      "legal_requirement_as_feature",
      "recycled_recyclable","biodegradable","certification","named_endorsement","vegan","farming_practice",
      "defined_term","risk_reduction","named_comparison","pollutant_free","renewable_energy","future_performance"]}},
    "label":{"type":"string","enum":["IN_SCOPE","NEEDS_VERIFICATION"]},
    "confidence":{"type":"number","minimum":0,"maximum":1},
    "reason":{"type":"string"}},
   "required":["quote","triggers","label","confidence","reason"]}}},
 "required":["claims"]}
```

## Label check in code (recommended)

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
    t = set(triggers)
    if "defined_term" in t:
        t.discard("undefined_natural")
    return "IN_SCOPE" if t & GROUP_A else "NEEDS_VERIFICATION"
```
