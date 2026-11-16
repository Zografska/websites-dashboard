# Methodology

> **Research prototype.** Every claim on this dashboard was detected automatically. A flagged claim is not a legal finding that the firm has broken any law.

## What this dashboard shows

For each firm, the dashboard lists the **environmental and sustainability claims** found in a sample of its public website. It groups them into five **review areas** and gives each claim a **traffic light** showing where a human review may be useful first. It's a preliminary screen: the colours do not establish legal compliance or non-compliance.

## Legal background

**The Unfair Commercial Practices Directive (UCPD, Directive 2005/29/EC)** is the EU's general law against unfair business-to-consumer practices. It has four main parts:
- a general ban on unfair practices (Art. 5)
- misleading actions (Art. 6)
- misleading omissions (Art. 7)
- a blacklist of practices considered unfair in all circumstances (Annex I)

**Directive (EU) 2024/825, "Empowering Consumers for the Green Transition" (ECGT)**, amends the UCPD to target greenwashing. It:
- adds definitions such as *environmental claim*, *generic environmental claim* and *sustainability label*
- adds new misleading-action grounds, for example unsubstantiated claims about future environmental performance
- adds new blacklist items, including:
  - generic environmental claims without recognised excellent performance
  - claims about a whole product when they only apply to part of it
  - neutral or reduced-impact claims based on offsetting
  - sustainability labels not based on a certification scheme or set up by public authorities
  - presenting legal requirements as a distinctive feature

ECGT **applies from 27 September 2026**. The proposed Green Claims Directive was withdrawn in June 2025, so the UCPD as amended by ECGT is the operative EU framework.

**Italy** transposed ECGT with **D.Lgs. 20 febbraio 2026, n. 30**, which amends the **Codice del Consumo** (D.Lgs. 206/2005). The corresponding articles are:

| UCPD (EU) | Codice del Consumo (IT) | content |
|---|---|---|
| Art. 2 | Art. 18 | definitions |
| Art. 6 | Art. 21 | misleading actions |
| Art. 7 | Art. 22 | misleading omissions |
| Annex I | Art. 23 | blacklist |

Each claim's legal reference is shown in both numberings, for example *"UCPD Annex I 4a / Cod. Cons. Art. 23"*. References are indicative mappings of the claim's category to a provision. They are not an assessment of whether the specific claim is unlawful.

## Data collection

- **Firms:** <!-- TODO: how the firm list was chosen and how many firms -->
- **Scraping:** <!-- TODO: which pages are crawled (whole site vs sustainability sections), crawl depth, tooling, robots.txt policy -->
- **Cadence:** each firm's website was scraped **once**, on 11 November 2026. The dashboard shows the claims found in that scrape, after ECGT began to apply on 27 Sept 2026.
- **Scrape status:** a scrape can be `ok`, `partial` or `failed`. A partial scrape is flagged on the firm page, because some claims may be missing. A firm whose scrape failed has no results.

## Claim detection

<!-- TODO: describe the detector (model, prompting / RAG over the UCPD + ECGT corpus, how candidate sentences are extracted from pages) -->

Each detected claim gets a **category** and a **confidence level**.

Claims judged out of scope (for example nutrition or health claims, or mandatory organic control-body codes) are discarded before they reach the dashboard.

**Confidence:** *high*, *medium* or *low*. This is how sure the detector is about the claim and its category. **It is not a measure of legal severity**, so it is shown only in a claim's details and never decides its colour.

## Review areas and traffic light

Each claim's detector category is mapped to one of five review areas. A category the dashboard doesn't know yet is listed under *Other claims*.

| category | review area | example |
|---|---|---|
| Broad environmental wording with no specific substantiation | Generic or absolute claims | «eco-friendly», «sostenibile», «green» |
| "Natural" with no definition | Generic or absolute claims | «prodotti naturali» |
| Eco wording built into a brand line or slogan | Generic or absolute claims | a "green" product-line name |
| Unspecific claims about sourcing or production practices | Scope and claim precision | «filiera responsabile» with no named scheme |
| Recycled content or recyclability | Scope and claim precision | «packaging 100% riciclato» |
| A comparison with no baseline or figure | Evidence and comparisons | «a ridotto impatto ambientale» |
| A quantified reduction in impact | Evidence and comparisons | «-30% di emissioni rispetto al 2020» |
| A certification or sustainability label | Labels and climate neutrality | organic logo, named eco-label |
| Endorsement by a named organisation | Labels and climate neutrality | a named association's seal |
| Neutral or reduced climate impact through offsetting | Labels and climate neutrality | «emissioni compensate al 100%» |
| A legal requirement presented as a special feature | Generic or absolute claims | «non testato sugli animali» on a cosmetic |
| The whole product or company presented as green because of one aspect | Scope and claim precision | «azienda green» for one eco measure |
| Renewable energy use | Scope and claim precision | «energia 100% rinnovabile» |
| Biodegradable or compostable | Scope and claim precision | «biodegradabile» |
| Free from harmful substances or low emissions | Scope and claim precision | «senza sostanze nocive» |
| A named farming practice | Scope and claim precision | «lotta integrata» |
| Vegan or animal-free | Scope and claim precision | «vegano» |
| A specific, defined term | Scope and claim precision | «gas refrigerante R290» |
| A comparison with a named alternative | Evidence and comparisons | «consuma il 20% in meno del modello precedente» |
| Lower consumption or efficiency | Evidence and comparisons | «risparmio idrico» |
| A future environmental target | Future environmental performance | «zero emissioni nette entro il 2040» |

**Traffic light.** Each claim is assessed in the context of its page. It is **red (review first)** when the wording is close to a practice that ECGT bans outright in UCPD Annex I (generic claims, "natural" without a definition, brand eco-slogans, vague supply chain, offset-based neutrality, part-for-whole, a legal requirement presented as a feature), or so broad that a quick human review is advisable. It is **yellow (clarify or document)** when it may be acceptable but its scope, baseline or evidence is not clear from the page. An area takes the colour of its most serious claim, and is **green (no signal found)** when nothing was found. Green is not a certification of compliance.

Each claim gets its own assessment: a colour and a short reason. The explanation of why a category is flagged and the general advice for it are written once per category. In the demo they were written by hand. For real data they will come from an AI step in the detection pipeline, checked against expert judgement. A claim that has not been assessed individually falls back to a simple rule based on its type: red for generic green, undefined "natural", brand eco-slogans, vague supply chain, climate neutrality, part-for-whole and legal-requirement-as-feature claims, yellow otherwise.

Each firm's summary reads *"n of 5 areas merit review"*. There is deliberately no High/Medium/Low rating, because one automated finding shouldn't make a firm look accused.


## How to read the firm page

- **Overview:** how many of the five areas merit review, the colour of each area, and for the selected area an example claim with its reason and the general advice for its category.
- **Claim examples:** every claim with its colour, a short reason for review and its source page. Filter by area or colour, and open a claim for its surrounding text, full URL, scrape date and legal reference.
- **How to read it:** what each colour means and what the screen covers.

Claim text is shown in the original Italian and not translated, because the exact wording is what matters.

## Limitations

- **Automated detection makes mistakes.** It produces false positives and false negatives, and claims are not yet human-reviewed.
- **Only website text is analysed.** Images, PDFs, product labels and ads are not covered unless stated above.
- **The colours and advice are an assessment, not a legal opinion.** An automated assessment can misread a claim's context, so it should be checked before acting on it.
- **Future environmental performance is not reliably detected yet,** so "None found" in that area may only mean that no such claim was picked up.
- **Each firm is scraped once,** from a sample of pages. Claims on other pages, or added later, are not covered.
- **Legal references are indicative,** based on the EU directive text and its Italian counterpart. They are not legal advice.
- **The public demo uses synthetic data.** <!-- update when real data is loaded -->

## Sources

- Directive 2005/29/EC (UCPD) and Directive (EU) 2024/825 (ECGT), Official Journal of the EU.
- D.Lgs. 20 febbraio 2026, n. 30: https://www.normattiva.it/eli/id/2026/03/09/26G00047/ORIGINAL
- Commission withdrawal of the Green Claims Directive proposal, June 2025.
