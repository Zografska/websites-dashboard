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
- **Cadence:** each firm's website is scraped **once**. The dashboard shows the claims found in that scrape, after ECGT began to apply on 27 Sept 2026.
- **Scrape status:** a scrape can be `ok`, `partial` or `failed`. A partial scrape is flagged on the firm page, because some claims may be missing. A firm whose scrape failed has no results.

## Claim detection

<!-- TODO: describe the detector (model, prompting / RAG over the UCPD + ECGT corpus, how candidate sentences are extracted from pages) -->

Each detected claim gets a **category**, a **scope status** and a **confidence level**.

**Scope status**
- **IN_SCOPE:** an environmental claim covered by the rules above.
- **NEEDS_VERIFICATION:** a specific, checkable claim (a named certification, a stated percentage, a defined term) whose substance needs checking against the firm's evidence.

Claims judged out of scope (for example nutrition or health claims, or mandatory organic control-body codes) are discarded before they reach the dashboard.

**Confidence:** *high*, *medium* or *low*. This is how sure the detector is about the claim and its category. **It is not a measure of legal severity**, so it is shown only in a claim's details and never decides its colour.

## Review areas and traffic light

Each claim's detector category is mapped to one of five review areas. A category the dashboard doesn't know yet is listed under *Other claims*.

| category | review area | meaning | example |
|---|---|---|---|
| `generic_green` | Generic or absolute claims | Broad environmental wording with no specific substantiation | «eco-friendly», «sostenibile», «green» |
| `undefined_natural` | Generic or absolute claims | "Natural" with no definition | «prodotti naturali» |
| `brand_eco_slogan` | Generic or absolute claims | Eco wording built into a brand line or slogan | a "green" product-line name |
| `vague_supply_chain` | Scope and claim precision | Unspecific claims about sourcing or production practices | «filiera responsabile» with no named scheme |
| `recycled_recyclable` | Scope and claim precision | Recycled content or recyclability | «packaging 100% riciclato» |
| `vague_comparison` | Evidence and comparisons | A comparison with no baseline or figure | «a ridotto impatto ambientale» |
| `risk_reduction` | Evidence and comparisons | A quantified reduction in impact | «-30% di emissioni rispetto al 2020» |
| `certification` | Labels and climate neutrality | A certification or sustainability label | organic logo, named eco-label |
| `named_endorsement` | Labels and climate neutrality | Endorsement by a named organisation | a named association's seal |
| `climate_neutral` | Labels and climate neutrality | Neutral or reduced climate impact through offsetting | «emissioni compensate al 100%» |
| `future_performance` | Future environmental performance | A future environmental target | «zero emissioni nette entro il 2040» |

**Traffic light.** Each claim is assessed in the context of its page. It is **red (review first)** when the wording is close to a practice that ECGT bans outright in UCPD Annex I (generic claims, labels not based on a certification scheme, offset-based neutrality), or so broad that a quick human review is advisable. It is **yellow (clarify or document)** when it may be acceptable but its scope, baseline or evidence is not clear from the page. An area takes the colour of its most serious claim, and is **green (no signal found)** when nothing was found. Green is not a certification of compliance.

The assessment, its colour and its advice (why the claim was flagged, what to verify, a suggested first action) are written for each claim individually. In the demo they were written by hand. For real data they will come from an AI step in the detection pipeline, checked against expert judgement. A claim that has not been assessed individually falls back to a simple rule based on its type: red when it is IN_SCOPE in *Generic or absolute claims* or *Labels and climate neutrality*, yellow otherwise, with advice written per category.

Each firm's summary reads *"n of 5 areas merit review"*. There is deliberately no High/Medium/Low rating, because one automated finding shouldn't make a firm look accused.


## How to read the firm page

- **Overview:** how many of the five areas merit review, the colour of each area, and for the selected area an example claim with the advice for it.
- **Claim examples:** every claim with its colour, a short reason for review and its source page. Filter by area, colour or scope status, and open a claim for its surrounding text, full URL, scrape date and legal reference.
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
