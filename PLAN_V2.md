# Firm Claims Dashboard: v2 plan (review areas and traffic light)

Status: agreed 2026-10-17 and implemented. Overrides the parts of `PLAN.md` listed in its header note. Implementation decisions are in `IMPLEMENTATION_PLAN.md` ("Post-v1, v2 review areas").

## Why

The PO's feedback (2026-10-17): v1 isn't actionable from a firm's point of view. Detector confidence doesn't say whether a claim is risky. The PO's own mock-up groups claims into five review areas. Each area shows example claims and a traffic light that sets review priority, which is closer to "risk" than to "confidence". v2 adopts that design.

Decisions taken (2026-10-17):
- The dashboard moves to the PO's five areas now. The classifier taxonomy (golden set, Pass 2 triggers) is aligned in a later, separate task.
- All surviving claims are shown, both IN_SCOPE and NEEDS_VERIFICATION. The colour carries the difference.
- The traffic light is computed by a fixed rule. Advice text is templated per category. No extra LLM call.
- **One scrape per firm.** The timeline goes, along with everything else that only makes sense across several crawls (crawl history, removed claims, crawl counts). The v1 multi-crawl version is kept at git tag `v1-weekly-scrapes` (`b909293`) as the base for a future weekly-scrape dashboard. It isn't kept as dead code in the tree.

## 1. Data contract: unchanged

`schema_version` stays `1.0` and existing files stay valid. `crawls` keeps its shape, so the same pipeline output also fits the future weekly dashboard. v2 reads only the latest successful crawl. With one scrape, `seen_in_crawls` always lists that crawl. Area and light are **derived in the app** from `category` and `scope_status`. `confidence` stays in the file but leaves the main UI. It's shown only in the drawer, as "Detector confidence".

## 2. Category → area

| Area (id) | Shown as | Categories |
|---|---|---|
| `generic` | Generic or absolute claims (*Broad wording without a clear qualification*) | `generic_green`, `undefined_natural`, `brand_eco_slogan` |
| `scope` | Scope and claim precision (*What exactly is covered?*) | `vague_supply_chain`, `recycled_recyclable` |
| `evidence` | Evidence and comparisons (*Baseline, method and accessible proof*) | `vague_comparison`, `risk_reduction` |
| `labels` | Labels and climate neutrality (*Certification and offset-based claims*) | `certification`, `named_endorsement`, `climate_neutral` |
| `future` | Future environmental performance (*Targets, plans and verification*) | `future_performance` (new id; the classifier doesn't emit it yet) |

A category the app doesn't know goes to an **Other** group. That group appears only when it has claims and is never red.

## 3. Traffic light

Per claim:
- **Red (review first):** `IN_SCOPE` in `generic` or `labels`. These are the claim types ECGT bans outright in UCPD Annex I: 4a generic claims, 2a labels not based on a certification scheme, and 4c offset-based neutrality. **Exception:** a `generic` claim with `gray_zone: generic_plus_specific` (generic wording next to a specific explanation) is yellow. This matches the PO's mock-up, where "design sostenibile" is yellow (*"some nearby explanation, but environmental dimension remains broad"*) and the absolute, company-wide "prevengono ogni forma d'inquinamento" is red.
- **Yellow (clarify or document):** every other claim, i.e. any NEEDS_VERIFICATION claim, or IN_SCOPE in `scope`, `evidence`, `future` or Other.

Claims are only ever red or yellow. **Green is an area-level state:** no signal was found in the sampled material.

Per area: red if any claim is red, yellow if there's any claim at all, green ("None found") otherwise.

Per firm: there is **no High/Medium/Low label**. The PO's reviewer found "High" accusatory when it can come from one automated finding. The summary is the neutral **"n of 5 areas merit review"**, where n counts red and yellow areas, followed by the 5-segment colour bar. The firm has no summary if it has no successful crawl.

Only claims seen in the latest successful crawl are shown. With one scrape that's every claim, so there's no "removed" state in the UI.

## 4. Advice templates

For each category there is a short `reason` (one line, for the Claim examples table, e.g. *"Comparative result without a visible baseline, period or quantified reduction"*), a `why` paragraph, two or three `verify` bullets and one `action`, in both `en` and `it`, stored in `src/i18n/advice.ts`. The text is **generic per category, not per claim**. The PO's mock-up has claim-specific text, which we can't produce without an LLM. Every area also gets a one-line guidance sentence, e.g. *"A specific claim should make its product, process, facility and environmental boundary clear to the consumer."*

**The PO should review the template text**, because it is the closest thing to advice that the dashboard gives.

## 5. Pages

### Home
- The H/M/L column is replaced by **Areas to review**: "n of 5" plus the small 5-segment colour bar. The "Crawls" column is removed, and "Last crawled" becomes "Scraped".
- The default sort becomes red areas (most first), then yellow areas, then `firm_id`. *(Open question: or keep `firm_id`?)*

### Firm page
- **Header** (mock-up): an initial avatar, the eyebrow "Green claims screening", the firm name, and on the right "Public website sample" with the scrape date. The website link goes below the name. It's followed by a permanent banner: *"Preliminary screen: colours indicate where a human review may be useful. They do not establish legal compliance or non-compliance."*
- **Tabs**, stored in the URL as `?tab=`: **Overview** · **Claim examples** · **How to read it**, the same as the mock-up.

**Overview** (the mock-up's layout):
1. Four stat cards:
   - "n of 5 areas merit review", with a 5-segment bar in area order (red, yellow or grey).
   - Red areas, "Review first".
   - Yellow areas, "Clarify or document".
   - Green areas, "No signal detected".
2. On the left, the five areas (plus Other if it's non-empty). Each shows a dot, a title, a subtitle and "n examples" or "None found". Clicking an area selects it (`?area=`). The default is the first red area, then the first yellow one.
3. On the right, the panel for the selected area:
   - the light label and the area guidance;
   - the **example detected**, i.e. the area's highest-priority present claim (red before yellow, then by text), with its source page;
   - the template text: why it was flagged, what to verify internally, suggested first action;
   - "‹ 1 of n ›" to step through the area's claims, and "See all n claims in this area", which opens Claim examples filtered to the area.

**Claim examples** (mock-up: *"Illustrative claim-level findings"*): a table with the columns **Status** (dot + Red/Yellow) · **Claim excerpt** (verbatim Italian, in quotes) · **Reason for review** (the category's `reason` template) · **Source** (the page path, linked). Unlike the mock-up it lists **every** claim, not a selection. Clicking a row opens the drawer with the snippet, full URL and advice. Below 700px the rows become stacked cards. The filters are Area · Light · Scope, so the confidence filter goes away. URL params are `area`, `light` and `scope`, and old `conf`/`cat` params are ignored. Sorting: red before yellow, then area order, then text. The mock-up's footnote is adapted: the URL, scrape date and surrounding text are kept for every finding, but screenshots aren't (not yet captured).

**How to read it** (mock-up): three cards, using the PO's wording in en and translated to it:
- **Red · review first:** *A public signal appears close to a prohibited or especially high-risk pattern, or the wording is so broad that rapid human review is advisable.*
- **Yellow · clarify:** *The claim may be acceptable, but its scope, baseline, evidence or consumer-facing explanation is not sufficiently clear from the sampled page.*
- **Green · no signal found:** *No relevant risk signal was detected in the sampled material. Green is not certification of compliance and may change if other pages or offline materials are reviewed.*

Below the cards comes a "Scope of this pilot" note. Ours is generic ("public Italian-language website pages scraped on <date>; consumer-facing commercial claims; evidence held internally by the firm was not available") plus one line saying that Future environmental performance isn't detected yet. The methodology page links here.

**Removed from v1:** the timeline (and Recharts, if nothing else uses it), the category breakdown chart (the Overview's area list replaces it), the claim strip, crawl history, removed-claim states and the partial/stale-crawl notes. They're all preserved at tag `v1-weekly-scrapes`.

### Drawer
The drawer gains the light, the area and the template text above the context snippet. Confidence moves down, next to the legal reference. The crawl history section is removed.

## 6. Out of scope for v2
- Claim-specific advice generated by an LLM (possible later as a Pass 3).
- Changing the golden set or the classifier triggers.
- A `future_performance` detector. Until there is one, this area is always "None found", which may read as a clean result. The How to read it tab says so.

## 7. Open questions for the PO
1. Are the area titles, subtitles and card texts final? Do they want Italian versions of their own?
2. The red rule (§3) is decided by category and scope, plus the `generic_plus_specific` exception. The mock-up's red/yellow calls are judgement-based, so ours will sometimes differ. Is that acceptable for a preliminary screen?
