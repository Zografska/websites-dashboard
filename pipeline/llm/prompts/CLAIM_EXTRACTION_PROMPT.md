# CLAIM_EXTRACTION_PROMPT.md

Reads one chunk of a cleaned company website page and returns every environmental claim on it, quoted word for word, with its triggers, label, confidence and a one-line reason. Pages with no claim return an empty list. `category`, `gray_zone`, `legal_ref` and the context snippet are set in code, not by the model. The trigger rules are adapted from Aleksandra's claim classifier for product listings (greenwashing-claim-detector project).

**Settings (DeepSeek API):** temperature 0 · `response_format` = `{"type": "json_object"}` · `max_tokens` ≈ 4000 · thinking off.
One page chunk per call (up to ≈3,000 tokens of page text).

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

LEGAL TEXT (Directive 2005/29/EC as amended by Directive (EU) 2024/825, consolidated text of
27.9.2026; in Italy: Codice del Consumo art. 18, 21 and 23 as amended by D.Lgs. 30/2026).
Use it to understand the triggers below; the triggers decide the answer.

Art. 2(o) 'environmental claim' means any message or representation which is not mandatory
under Union or national law, in any form, including text, pictorial, graphic or symbolic
representation, such as labels, brand names, company names or product names, in the context
of a commercial communication, and which states or implies that a product, product category,
brand or trader has a positive or zero impact on the environment or is less damaging to the
environment than other products, product categories, brands or traders, or has improved its
impact over time;
Art. 2(p) 'generic environmental claim' means any environmental claim made in written or
oral form, including through audiovisual media, that is not included on a sustainability
label and where the specification of the claim is not provided in clear and prominent terms
on the same medium;
Art. 2(q) 'sustainability label' means any voluntary trust mark, quality mark or equivalent,
either public or private, that aims to set apart and promote a product, a process or a
business by reference to its environmental or social characteristics, or both, and excludes
any mandatory label required under Union or national law;
Art. 2(s) 'recognised excellent environmental performance' means environmental performance
compliant with Regulation (EC) No 66/2010 or with national or regional EN ISO 14024 type I
ecolabelling schemes officially recognised in the Member States, or top environmental
performance in accordance with other applicable Union law;
Art. 6(2)(d) [misleading] making an environmental claim related to future environmental
performance without clear, objective, publicly available and verifiable commitments set out
in a detailed and realistic implementation plan that includes measurable and time-bound
targets and other relevant elements necessary to support its implementation, such as
allocation of resources, and that is regularly verified by an independent third party
expert, whose findings are made available to consumers;
Annex I [always unfair]
2a. Displaying a sustainability label that is not based on a certification scheme or not
established by public authorities.
4a. Making a generic environmental claim for which the trader is not able to demonstrate
recognised excellent environmental performance relevant to the claim.
4b. Making an environmental claim about the entire product or the trader's entire business
when it concerns only a certain aspect of the product or a specific activity of the
trader's business.
4c. Claiming, based on the offsetting of greenhouse gas emissions, that a product has a
neutral, reduced or positive impact on the environment in terms of greenhouse gas emissions.
10a. Presenting requirements imposed by law on all products within the relevant product
category on the Union market as a distinctive feature of the trader's offer.

Judge only the words on the page. Do not guess whether a claim is true. A word or fact
nearby on the same page may define or explain a claim (see defined_term).

Do NOT list: menu items, headings or buttons on their own, the name of the firm, shop or
brand when it merely contains "bio", "eco", "natura" or "green" («Bio Bio», «Bio Card»,
«Negozio Biologico a Savona»), contact details, prices, and text from group C. If there is
no environmental claim, return an empty list.
A PRODUCT offered or sold as organic IS a claim, even when it is only a product name in a
list: «GOMASIO BIO 150G», «Miso di riso integrale biologico» -> certification. List each
such product once.

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
                    NOT: "naturalmente" meaning "of course", also at the end of a slogan
                    («Fai la tua spesa da noi, ogni giorno… Naturalmente!»); a plain material
                    named as what the product is made of: «valorizziamo le fibre naturali»,
                    «cappelli in paglia e lana», legno massello
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
                    NOT: «senza OGM» / «non usa prodotti OGM»: GMO ingredients are legal in
                    the EU if labelled, so being GMO-free is not a legal requirement

B. SPECIFIC, NEEDS CHECKING
recycled_recyclable recycled or recyclable content of a named part
                    «Etichetta in carta riciclata» «cartoni 100% riciclati»
biodegradable       biodegradable or compostable  «99,9% formula biodegradabile»
certification       an ENVIRONMENTAL, ORGANIC or ETHICAL certification or label: organic/bio,
                    FSC, Fairtrade, Ecolabel, ISO 14001, EMAS, B Corp, Società Benefit,
                    Oeko-Tex, benessere animale
                    «Le migliori pesche gialle bio» «Siamo certificati ISO 14001»
                    «GOMASIO BIO 150G» (a product sold as organic)
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
                    country of origin, DOP/IGP, «senza conservanti», «senza OGM»; a mention of
                    a document:
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
