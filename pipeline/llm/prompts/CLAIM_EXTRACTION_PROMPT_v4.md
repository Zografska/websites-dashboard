# CLAIM_EXTRACTION_PROMPT_v4.md

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

TEST before listing anything: following Art. 2(o), the text must state or imply that the
firm, its products or its services have a positive or no impact on the environment, are
less damaging, or have improved their impact. If the text makes no such statement about
the firm or what it sells, it is not a claim, even if it contains a green word.

CONCRETE BASIS: when a vague word (eco, ecologico, green, sostenibile, basso impatto,
rispetto dell'ambiente) comes with a named product, technology, material or measure in the
same sentence or on the same page, tag the specific trigger, not generic_green:
«carburanti ecologici» when the page says GPL and metano -> resource_efficiency or
renewable_energy; «Scegliamo mezzi elettrici per ridurre l'impatto ambientale» ->
resource_efficiency; «Biocidi a basso impatto ambientale: la tecnologia B.I.A. utilizza
solventi a basso impatto» -> pollutant_free. Use generic_green only when nothing concrete is
named.

WHOSE ENVIRONMENTAL IMPACT? Ask this for every sentence about energy, water, materials,
waste or emissions.

(a) THE FIRM'S OWN OPERATIONS: its own energy, buildings, vehicles, consumption, waste,
investments or choices. This IS a claim, even when it is worded as a general statement, if
the page is about the firm doing it («Puntare sul solare è per noi una scelta di
innovazione e di competitività» -> renewable_energy; «L'energia pulita ci permette di unire
benessere sociale e ambientale» -> generic_green; «Misuriamo ogni mese i consumi della
sede» -> resource_efficiency).

(b) WHAT THE FIRM SELLS, INSTALLS OR PROVIDES TO CLIENTS. Listing or explaining the service
or the type of product is NOT a claim, even when the service is green by nature and even
when it explains the benefit of that type of product: «Ci siamo specializzati
nell'installazione di impianti a energie rinnovabili», «vendita e installazione di infissi e
materiali isolanti per il risparmio energetico», «caldaie ad alta efficienza», «I
climatizzatori a pompa di calore consentono un forte risparmio energetico», «collaboriamo
con marchi leader per sistemi tecnologicamente avanzati», «formazione continua sul
risparmio energetico», «ritiro e recupero di materiali da demolizione», «ripristino
ambientale delle aree di cava». It IS a claim only when the firm calls ITS OWN product,
service or process green, sustainable, low-impact, or better than others, or gives a
figure for it: «i nostri infissi riducono i consumi del 30%», «la nostra soluzione
sostenibile riutilizza l'acqua di condensa e riduce gli sprechi», «il nostro servizio di
smaltimento è il più ecologico della zona».
When unsure whether a sentence is (a) or (b), ask: is the subject the firm's own site,
fleet, energy or money, or is it the client's home, system or order? Client -> (b).

Products of other brands that the firm sells count as the firm's own claims («Tutti i
cosmetici che vendiamo sono vegani e con ingredienti naturali» -> undefined_natural).
List EACH sentence that is a claim on its own, even when a nearby sentence makes a similar
claim; do not merge them into one.

A FOUNDATION, NETWORK OR PROGRAMME that the firm presents on its own page as one it belongs
to, supports or works with IS a claim, even when the sentence only describes that
organization («Aderiamo a Slow Food, che promuove un'agricoltura buona, pulita e giusta») ->
named_endorsement.

Do NOT list: menu items, headings or buttons that only name a topic («Sostenibilità»,
«Energie rinnovabili», «Green & Sostenibilità», «Riciclo rifiuti»), the name of the firm, shop or
brand when it merely contains "bio", "eco", "natura" or "green" («Bio Bio», «Bio Card»,
«Negozio Biologico a Savona»), contact details, prices, and text from group C. If there is
no environmental claim, return an empty list.
A SHORT LINE IS NOT A HEADING when it gives a figure, a named measure or a named
environmental standard: «80% della flotta a basso consumo», «Pannelli solari da 50 kW» ->
list them; «CAM – Criteri Ambientali Minimi», «EMAS Reg. 1221/2009», «Ecolabel UE n. 123»
-> certification. Only a line that names a topic and nothing more is a heading.
A PRODUCT offered or sold as organic IS a claim, even when it is only a product name in a
list: «GOMASIO BIO 150G», «Miso di riso integrale biologico» -> certification. List each
such product once. The same holds for organic farming or production methods: «Ritengo che
l'adesione al sistema biologico sia una scelta fondamentale per ridurre al minimo
l'impatto» -> certification, not generic_green.
Text written by customers (reviews, testimonials, guest comments) is not a claim of the
firm: do not list it.
A SHORT SLOGAN or phrase that states a value or commitment of the firm IS a claim, even
without a verb: «Rispetto per l'Ambiente», «La sfida alla sostenibilità», «Con noi, un mondo
sempre più green» -> generic_green.

STEP 1 - Triggers.

A. PROBLEM AS WRITTEN
generic_green       vague green or impact wording with no definition: eco, green, sostenibile,
                    amico dell'ambiente, per il pianeta, ridurre l'impatto, ho a cuore l'ambiente,
                    about a product OR about the whole company
                    «il latte amico dell'ambiente» «Flacone green 100%»
                    «La sostenibilità è il nostro percorso concreto… cura dell'ambiente»
                    «nel pieno rispetto dell'ambiente» «Da anni ci impegniamo nel campo della
                    sostenibilità»
                    NOT: a heading or menu item alone («Sostenibilità», «Ambiente»); a
                    description of the place or landscape («un luogo incontaminato», «immerso
                    nel verde»); personal feelings («Amo la natura»); values or a mission with
                    no environmental impact («creare bellezza in modo genuino e autentico»);
                    "sostenibile" when the context is financial, social or about growth and
                    not clearly environmental («approcci aziendali sostenibili a lungo
                    termine», «una crescita sostenibile e duratura dell'azienda»)
                    BUT: saying that the firm or its facility lives or works in harmony with
                    nature IS generic_green («Il nostro agriturismo vive in armonia con la
                    natura»); "eco", "green", "ecosostenibile" are always environmental, also
                    next to a financial word («un investimento eco-sostenibile per la tua
                    casa»)
undefined_natural   "naturale", "di origine naturale", "% naturale" as a quality of a product,
                    with no definition on the page
                    «100% Naturale» «Prodotto con ingredienti di origine naturale»
                    NOT: "naturalmente" meaning "of course", also at the end of a slogan
                    («Fai la tua spesa da noi, ogni giorno… Naturalmente!»); a plain material
                    named as what the product is made of: «valorizziamo le fibre naturali»,
                    «cappelli in paglia e lana», legno massello; "naturale" explained by the
                    materials listed on the page («letti naturali al 100%… gomma naturale,
                    fibra di cocco, lavanda») -> defined_term
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
                    «Agricoltori selezionati» «Agricoltura sostenibile» «filiera responsabile»
                    NOT: local or regional origin of products or suppliers («km 0», «fornitori
                    locali», «mozzarella fior di latte locale», «carni da allevamenti umbri»):
                    origin is not an environmental claim unless an environmental benefit is
                    stated («km 0 per ridurre le emissioni dei trasporti»)
legal_requirement_as_feature
                    presents something the law already requires for all such products as a
                    special feature
                    «Prodotto senza CFC» «Imballaggio conforme alle norme europee sui materiali
                    a contatto con alimenti»
                    NOT: «senza OGM» / «non usa prodotti OGM»: GMO ingredients are legal in
                    the EU if labelled, so being GMO-free is not a legal requirement
part_for_whole      one specific measure or product feature used to present the WHOLE firm or
                    the whole product as green (Annex I 4b), often linked by «per questo»,
                    «grazie a», «siamo»
                    «Venezia Car Service rispetta l'ambiente e per questo sfrutta fonti di
                    energia rinnovabile» «Siamo un'azienda green: utilizziamo energia solare»
                    «il profumo solido più sostenibile sul mercato» (justified by a refillable box)
                    NOT: the measure stated on its own («Abbiamo installato pannelli solari sul
                    tetto della sede» -> renewable_energy)

B. SPECIFIC, NEEDS CHECKING
recycled_recyclable recycled or recyclable content of a named part
                    «Etichetta in carta riciclata» «cartoni 100% riciclati»
biodegradable       biodegradable or compostable  «99,9% formula biodegradabile»
certification       an ENVIRONMENTAL, ORGANIC or ETHICAL certification or label: organic/bio,
                    FSC, Fairtrade, Ecolabel, ISO 14001, EMAS, B Corp, Società Benefit,
                    Oeko-Tex, benessere animale
                    «Le migliori pesche gialle bio» «Siamo certificati ISO 14001»
                    «GOMASIO BIO 150G» (a product sold as organic)
                    A line that only lists certifications IS a claim when one of them is
                    environmental («UNI EN ISO 9001, 14001, 45001», «ISO 14001:2015»)
                    A certification claimed without naming it («Siamo certificati», «Impegno
                    certificato per la qualità e la sostenibilità») is also certification
                    NOT: ISO 9001 (quality), ISO 22000 / HACCP (food safety), product
                    authenticity («Rolex Certified»), a heading such as «Certificazioni»
named_endorsement   approval, seal, membership or programme of a NAMED organization
                    «Approvata da A.I.Nut. - Associazione Italiana Nutrizionisti»
                    «Partecipiamo a Stay for the Planet, un data hub che supporta le strutture
                    alberghiere nel monitoraggio delle performance ambientali»
                    «Abbiamo creato la Foresta Pozzoli con Treedom» (a project with no neutral
                    or zero claim; with such a claim it is climate_neutral)
vegan               vegan or plant-based ONLY when an environmental benefit is stated with it
                    «Ricette 100% vegetali per ridurre l'impatto sul pianeta» «plant-based:
                    meno emissioni di CO2 rispetto alla carne»
                    NOT: vegan or plant-based on its own, which is a diet or ethical claim, not
                    an environmental one («VEGANO», «100% plant-based», «Nessun ingrediente di
                    origine animale», «cruelty-free»); offering vegan options to customers
                    («prepariamo pizze per tutti gli amici vegetariani, vegani…»). When the
                    same sentence makes another environmental claim («snack biologici e 100%
                    plant-based»), list it for that claim only (-> certification)
farming_practice    a concrete practice with farms or animals
                    «Le nostre mucche vengono nutrite con erba fresca, fieno e piante di campo»
defined_term        a green or natural word that the page itself defines or explains
                    «96% Natural origin* ... water and naturally sourced ingredients»
risk_reduction      "riduce / aiuta a ridurre il rischio di ..."
named_comparison    compared with a named brand, product or standard
                    «rispetto alle precedenti confezioni Beretta»
pollutant_free      free from a pollutant, also in a product name or list: microplastics,
                    PFAS, PFOA, CFC, heavy metals  «Senza microplastiche» «Padella Ballarini
                    NO PFOA» «pentole antiaderenti senza PFAS»
renewable_energy    use or production of renewable energy
                    NOT: saving energy or water (-> resource_efficiency)
                    «Per la produzione utilizziamo in parte l'energia pulita prodotta dai nostri
                    impianti» «100% dell'energia elettrica da fonti rinnovabili»
resource_efficiency a concrete measure that saves energy, water or materials
                    «Utilizziamo lampadine LED a basso consumo» «riduttori di flusso
                    dell'acqua in tutti i bagni» «impianto di recupero del calore»
                    Also: tracking the firm's own consumption («Misuriamo ogni mese i consumi
                    di luce e gas»), electric or low-emission vehicles and their share of the
                    fleet («60% di veicoli ibridi»), charging points for electric cars at the
                    firm's site («colonnina di ricarica per auto elettriche nel parcheggio»)
future_performance  a future environmental goal, commitment, plan or policy, with or
                    without a date
                    «Net zero entro il 2030» «Entro il 2027 elimineremo la plastica monouso»
                    «La SGR integra progressivamente i criteri ESG nei processi di investimento»

C. NOT A CLAIM (do not list)
                    "ambiente" meaning a room, workplace or atmosphere: «un ambiente di lavoro
                    sereno» «Profumo per ambiente»; legal compliance: «nel rispetto delle
                    normative vigenti»; social or ethical values with no environmental content:
                    «valori come passione, rispetto, integrità e responsabilità»; the beauty
                    or unspoiled nature of a place, landscape or view, and love of nature,
                    with no statement about the firm's impact; prices and
                    savings; cooking terms: «lievitazione naturale»; health or nutrition; what
                    the product does; tests and skin tolerance; history, tradition, family;
                    country of origin, DOP/IGP, «senza conservanti», «senza OGM»; a mention of
                    a document:
                    «Leggi il nostro Bilancio di Sostenibilità»; compliance with laws and rules,
                    environmental ones included, with no special feature claimed («ci
                    impegniamo a rispondere a tutte le normative settoriali, ambientali e sulla
                    sicurezza»); vegan, plant-based or cruelty-free with no environmental
                    benefit stated; local origin of products or
                    suppliers («km 0», «fornitori locali»); the firm's own service described
                    for its clients (see above); health or composition with no environmental
                    content («dermatologicamente testato», «free from harmful substances» with
                    no pollutant named; a named pollutant such as PFAS is pollutant_free);
                    digital features of a website or app («la modalità Green riduce effetti e
                    animazioni», «grado A+ sul profilo Green della pagina»); governance or
                    quality «certificato» with no environmental content («Our governance
                    processes are fully regulated and certified»).

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

FIRM: example
PAGE: /hotel
TEXT:
Sostenibilità
Amo la natura: il nostro hotel si trova in un luogo incontaminato, immerso nel verde del lago.
La nostra mission è creare bellezza in modo genuino e autentico.
Tutti i kit cortesia della nostra struttura sono a basso impatto ambientale.
→ {"claims":[{"quote":"Tutti i kit cortesia della nostra struttura sono a basso impatto ambientale.","triggers":["generic_green"],"label":"IN_SCOPE","confidence":0.9,"reason":"'Low environmental impact' for the courtesy kits with no explanation on the page."}]}

FIRM: example
PAGE: /chi-siamo
TEXT:
Rispetto per l'Ambiente
Utilizziamo solo ingredienti a km 0 e fornitori locali.
Ci siamo specializzati nell'installazione di impianti fotovoltaici per i nostri clienti.
La nostra società si distingue per la diffusione di carburanti ecologici a basso impatto ambientale, quali GPL e metano.
Energie rinnovabili
→ {"claims":[{"quote":"Rispetto per l'Ambiente","triggers":["generic_green"],"label":"IN_SCOPE","confidence":0.8,"reason":"Short slogan stating respect for the environment with no explanation."},{"quote":"La nostra società si distingue per la diffusione di carburanti ecologici a basso impatto ambientale, quali GPL e metano.","triggers":["resource_efficiency"],"label":"NEEDS_VERIFICATION","confidence":0.75,"reason":"'Low-impact' fuels are named (LPG, methane); the lower impact should be documented."}]}
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
      "legal_requirement_as_feature","part_for_whole",
      "recycled_recyclable","biodegradable","certification","named_endorsement","vegan","farming_practice",
      "defined_term","risk_reduction","named_comparison","pollutant_free","renewable_energy","resource_efficiency","future_performance"]}},
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
    "part_for_whole",
}


def label_from(triggers):
    t = set(triggers)
    if "defined_term" in t:
        t.discard("undefined_natural")
    return "IN_SCOPE" if t & GROUP_A else "NEEDS_VERIFICATION"
```
