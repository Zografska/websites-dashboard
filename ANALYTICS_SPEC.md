# Engagement Tracking: Spec

**Status:** draft, 14 Nov 2026. Waiting on the professors and the DPO for the items in §12. The client code, tests and export scripts are implemented (§14, "Implementation notes"); tracking stays off until the `POSTHOG_KEY` variable is set. Not implemented: per-firm access (§3) and branding (§13).
**Site:** `https://greenclaims.2d4d.eu` (GitHub Pages, Vite + React, `HashRouter`).
**Tool:** PostHog, EU cloud (Frankfurt), free tier.

Paragraphs marked **For the professors** need a decision or a check from the professors (and, through them, the DPO). §0 lists them all.

---

## 0. For the professors: what to check

| # | Point | Why it matters | Section |
|---|---|---|---|
| P1 | **Ethics approval and the consent prompt** | Tracking needs consent on the page. Telling firms they are observed may change how they behave, and firms that decline produce no data. Does the ethics approval cover this? | §5 |
| P2 | **Primary indicators and pre-registration** | Indicators chosen after seeing the data are weak evidence. Which ones are primary, and is there a composite index? | §8 |
| P3 | **How engagement is used in the analysis** | Engagement happens after treatment, so it isn't randomly assigned. The main analysis should be by assignment, with "opened" as take-up. | §8 |
| P4 | **Limitations of the data** | Ad blockers and company firewalls hide some visits (counts are a lower bound). Several employees count as one firm. Forwarded links count for the firm. | §8 |
| P5 | **Data controller, DPO and PostHog approval** | The university (or department) is most likely the controller. PostHog is a US company hosting data in the EU, so it needs a processing agreement and transfer safeguards. | §10, §12 |
| P6 | **Retention period and access** | How long the event data is kept, and who can see it. The free plan keeps data for at most 1 year. | §9, §10 |
| P7 | **Privacy notice text and table** | The consent text and the privacy table (in Italian) need the controller's name and the DPO's approval. | §5, §10.1 |
| P8 | **Counting declines** | Should we send one anonymous event when someone declines, to know the consent rate? | §5 |
| P9 | **Per-firm access is a prerequisite** | Each firm must see only its own report, through a personal link. The data pipeline needs one new field (`subject_id`). | §3 |
| P10 | **Preview in the invitation email** | If the email shows a preview of the result (in the body, or as a PDF attachment), some firms will act on it without opening the report. They are treated but unmeasured, so "opened" no longer equals take-up. Decided separately; this spec assumes **no preview** until then. | §8 |
| P11 | **University branding** | A page that clearly belongs to UniMi is easier to trust. Needs permission for the logo, the department/project name, a contact person and a public study page. | §13 |

---

## 1. Purpose

The firm page is the **treatment** in a field experiment: each treated firm gets a personal link to the screening of its own website, and the outcome is whether it later fixes its claims. We need evidence of **how much each firm engaged** with the page: whether it opened it, which tabs it viewed, which claims it looked at, whether it clicked through to its own pages, and how long it actively spent.

This is **outcome measurement per firm**, not product analytics. Two consequences follow:

- The unit of analysis is the **firm**. We don't try to tell apart several people at the same firm.
- The event data must be **exportable at event level**, so indicators can be computed offline (§9).

## 2. Decisions

| ID | Topic | Decision |
|---|---|---|
| A1 | Tool | PostHog EU cloud (`https://eu.i.posthog.com`), `posthog-js` from npm. No backend of our own. |
| A2 | Identity | Each event carries a pseudonymous **`subject_id`** that stands for the firm. No IP, no names, no person profiles, no cross-device ID. |
| A3 | Source of `subject_id` | It sits **inside the encrypted firm data**, so it only exists after a successful unlock. It is **not** the key in the personal link (§3). |
| A4 | When tracking starts | Only after (1) a successful unlock **and** (2) consent (§5). Nothing is loaded or sent before that. |
| A5 | Loading | `posthog-js` is **lazy-loaded** with a dynamic `import()` after consent. A visitor who declines never downloads it. |
| A6 | Events | A fixed allowlist of hand-written events (§6). Autocapture, automatic pageviews, session recording, surveys and heatmaps are off. |
| A7 | URLs | Never sent. A `before_send` hook drops every property not on the allowlist, including `$current_url`, `$pathname`, `$referrer` and `$initial_*` (§4). |
| A8 | Claim IDs | Only the 6-hex suffix is sent (`F012-a1b2c3` → `a1b2c3`), because the prefix contains the real firm ID. |
| A9 | Active time | A heartbeat every 60 s of **active** time: tab visible, window focused and an interaction in the last 60 s (§7). |
| A10 | Environments | Tracking runs only in the production build. The key comes from `VITE_POSTHOG_KEY`, which is set only in the deploy job. Without a key the analytics module does nothing. |
| A11 | Schema | Every event has `schema_v`. The schema is frozen before the first treatment link is sent. Changes after launch bump `schema_v` and are logged in §14. |
| A12 | Indicators | Computed offline from exported raw events (§8, §9). The main ones are pre-registered. |
| A13 | Consent storage | The consent choice is stored for **6 months**, then asked again, in line with the Garante's 2021 cookie guidelines. |

## 3. Prerequisite: per-firm access

Tracking depends on the per-firm access change (surrogate key), which is specified separately. This spec assumes:

- Each treated firm receives **a personal link plus a passphrase**. The link contains a random, unguessable surrogate key.
- After unlock the app holds **only that firm's data**, and the list of all firms (Home) isn't reachable in treatment mode.
- The firm's data includes a field `subject_id`: a random ID (for example 12 characters of base32) generated by the pipeline, **different from the link key and from `firm_id`**.
- The table that maps `subject_id` and the link key to the real firm is kept **offline**, never in the repo or in PostHog.
- **Size:** GitHub Pages sites can be at most **1 GB**, on any plan. On the demo data a firm's JSON is about 16 KB (median), or about 5 KB gzipped. So 40K firms need **gzip before encryption** (about 7 KB per encrypted file, about 300 MB in total). Check this on real data before launch, and avoid re-committing the files often, since each version stays in the git history.

Why `subject_id` is separate from the link key: if the PostHog data ever leaks, it contains neither the link keys nor firm IDs. And because `subject_id` is only available after decryption, every event necessarily comes from someone who entered the passphrase. Email security scanners can't, so they produce no events.

> **For the professors (P9):** today one passphrase opens the report of every firm. Before any link is sent, the dashboard must change so that each firm sees only its own report. The pipeline also needs to generate `subject_id` for each firm.

## 4. PostHog setup

### 4.1 Project settings (PostHog UI)

- Region: **EU**.
- IP data capture: **off** (it's off by default for EU projects; check anyway).
- Session replay, surveys, heatmaps, web vitals, exception autocapture: **off**.
- Data retention: 1 year on the free plan. Snapshots per §9 cover longer needs.
- **Volume:** the free plan includes 1M events per month, and events over the limit are **dropped**, not queued. With up to 40K invited firms, a launch month could get close (with the first 15 s heartbeat, 10K firms × 5 active minutes came to roughly 400K events). The heartbeat is now 60 s, which cuts heartbeat volume to a quarter. If the launch month still looks close to the limit, switch to pay-as-you-go with a **billing limit** (about $50 per extra million events). Decide with P6.
- Members: named researchers only, all with two-factor login.

### 4.2 Client config

Lazy-loaded in `src/lib/analytics.ts`:

```ts
const { default: posthog } = await import('posthog-js')
posthog.init(import.meta.env.VITE_POSTHOG_KEY, {
  api_host: 'https://eu.i.posthog.com',
  persistence: 'memory',              // no cookies, no localStorage
  person_profiles: 'never',           // events only, no person records
  autocapture: false,
  capture_pageview: false,            // we send our own events
  capture_pageleave: false,
  disable_session_recording: true,
  disable_surveys: true,
  disable_external_dependency_loading: true,
  save_referrer: false,
  before_send: allowlistProperties,   // A7: drop everything not in §6
})
```

Check every option name against the installed `posthog-js` version when implementing. If one doesn't exist, find its equivalent and note it in §14.

`allowlistProperties` keeps only the common properties (§6.1), the event's own properties (§6.2) and the PostHog internals needed for ingestion (`token`, `distinct_id`, `$lib`, `$lib_version`, `timestamp`/`$time`, `uuid`). Everything else is deleted.

### 4.3 Keys

| Key | Where it lives | Can |
|---|---|---|
| Project API key `phc_…` | GitHub Actions variable `POSTHOG_KEY` → `VITE_POSTHOG_KEY` in the **deploy** job only | Send events only. Public by design. |
| Personal API key `phx_…` | Researcher's machine, `.env` (gitignored) | Read data (Query Read scope only). Never in the repo or the app. |

```yaml
# .github/workflows/deploy.yml, deploy job
- run: npm run build
  env:
    VITE_POSTHOG_KEY: ${{ vars.POSTHOG_KEY }}
```

## 5. Consent and notice

### 5.1 Banner

A small banner fixed to the **bottom of the page**. It doesn't block the page: the visitor can read the report while it is open. It follows the Garante's 2021 cookie guidelines.

- **When:** from the first page load, including the passphrase screen, until a choice is made. Tracking still starts only once both conditions of A4 are met (unlocked **and** accepted).
- **Text** (`it` / `en`, draft):
  > Questa pagina fa parte di uno studio di ricerca di [istituzione]. Con il tuo consenso misuriamo quali parti del report vengono aperte e per quanto tempo, in modo collegato all'impresa e non alla persona. Non usiamo cookie e non registriamo l'indirizzo IP. [Informativa privacy]
  >
  > **[Accetta]** **[Rifiuta]** **[×]**
- **Accetta / Rifiuta** have the same size, style and weight. No colour nudging towards Accept.
- **× closes the banner and counts as Rifiuta.** No tracking until Accept is clicked.
- **Scrolling, clicking or navigating is not consent.**
- **No cookie wall:** the report works the same whatever the choice (the treatment must not depend on consent).
- **Layout:** at most about 25% of the viewport height on a 375px phone, and it must not cover the passphrase field or the Unlock button. Keyboard-accessible, with focus moving to the banner when it appears. Uses the app's colour tokens, in light and dark mode.
- **No "I accept the privacy policy" checkbox.** A privacy notice is information, not a contract. The only thing the visitor agrees to is the optional measurement.

### 5.2 Storing the choice

- `localStorage` key `fcd.consent` = `{ "choice": "granted" | "denied", "policy_v": 1, "at": "<ISO date>" }`.
- The banner is shown again when the choice is **older than 6 months** (A13), or when `policy_v` is lower than the current policy version (a material change to the notice).
- Storing the choice is strictly necessary and needs no consent itself. If storage throws, show the banner on every visit.

### 5.3 Privacy notice page

- A footer link **"Privacy e tracciamento"** on every page, including the passphrase screen, opens `#/privacy`.
- `#/privacy` must render **without the passphrase**. Today `AppShell` shows the passphrase screen for every route, so this route needs to bypass it.
- Content: the full notice (GDPR Art. 13) from `src/content/PRIVACY.it.md` and `PRIVACY.en.md`, rendered like the methodology page. It covers: controller and DPO contacts, purpose, what is recorded (§6) and what isn't (§10), legal basis, processor (PostHog, EU), hosting (GitHub), retention, rights, the right to complain to the Garante, and the table in §10.1. The version and date are shown at the top.
- At the bottom, the current choice and a control to change it. Withdrawing stops tracking immediately (`posthog.opt_out_capturing()`, then no further events).
- The final text needs DPO approval (§12).

### 5.4 Proof of consent

- GDPR requires that consent can be demonstrated, but no identities are stored. The first event sent after Accept is `consent_granted` (§6.2), with `policy_v` and its timestamp. Together with the versioned notice in git, this shows what was agreed to and when.
- Whether to count declines at all is open (§12). By default, nothing is sent on decline.

> **For the professors (P1):** the consent prompt is the legally safe option, because the tracking identifies the firm, so the Garante's exemption for anonymous analytics doesn't apply. It has two research costs: firms that know they are observed may behave differently, and firms that decline give no engagement data. Please confirm that the ethics approval covers this.
>
> **For the professors (P7, P8):** the banner text above is a draft. It needs the controller's name and the DPO's approval. Also decide whether declines should be counted (one anonymous event, with no `subject_id`).

## 6. Events

### 6.1 Common properties (on every event)

| Property | Type | Value |
|---|---|---|
| `subject_id` | string | From the decrypted firm data (A3) |
| `visit_id` | string | Random UUID made at page load, kept in memory only. A reload is a new visit. |
| `seq` | int | Event counter within the visit, from 1 |
| `schema_v` | int | `1` |
| `app_version` | string | Short git SHA, set at build time |
| `locale` | `it` \| `en` | Current UI language |
| `viewport` | `narrow` \| `wide` | Below or at/above 700px (the app's `tab:` breakpoint) |
| `is_test` | bool | `true` for the team's own test subjects, set in their firm data |

PostHog's `distinct_id` is set to `visit_id`, so no ID survives across visits on the PostHog side. Return visits are linked through `subject_id` only.

### 6.2 Event catalogue

| Event | When | Properties |
|---|---|---|
| `visit_started` | Tracking starts (after unlock + consent, or after a silent re-unlock with stored consent) | `entry_tab`, `deeplink_claim` (bool), `unlock` (`typed` \| `silent`) |
| `tab_viewed` | A firm tab becomes visible, including the initial one | `tab` (`overview` \| `claims` \| `how`), `trigger` (`initial` \| `click` \| `see_all`) |
| `area_selected` | An area is picked in the Overview list | `area` |
| `example_stepped` | Previous/next in the Overview example | `area`, `direction` (`prev` \| `next`), `index` |
| `see_all_clicked` | "See all" in the Overview | `area` |
| `claim_opened` | The claim drawer opens | `claim` (suffix, A8), `from` (`table` \| `overview` \| `deeplink`), `area`, `light` |
| `claim_closed` | The drawer closes | `claim`, `open_active_ms` |
| `source_clicked` | A link to the claim's source page on the firm's own website | `claim`, `from` (`table` \| `drawer` \| `overview`) |
| `website_clicked` | The website link in the firm header | none |
| `share_used` | The Share button in the firm header (schema_v 2) | `method` (`native` \| `copy`), `outcome` (`shared` \| `cancelled` \| `copied` \| `failed`) |
| `filter_changed` | The area, light or scope filter changes | `filter` (`area` \| `light` \| `scope`), `n_selected` |
| `filters_cleared` | "Clear filters" | none |
| `methodology_viewed` | The methodology page is opened | none |
| `language_changed` | The language toggle is used | `to` |
| `heartbeat` | Every 60 s of active time (§7) | `tab`, `drawer_open` (bool), `active_ms` (≤ 60000) |
| `visit_ended` | `pagehide`, or the tab hidden for more than 30 min | `total_active_ms`, `n_events` |
| `locked` | The Lock button | none |
| `consent_granted` | Accept is clicked (banner or `#/privacy`). Sent first, before `visit_started` | `policy_v`, `where` (`banner` \| `privacy_page`) |
| `consent_changed` | The choice is changed on `#/privacy` | `to` (`granted` \| `denied`); the last event sent when withdrawing |

Rules:

- No free text, no claim text, no URLs, no firm name, no `firm_id` in any property.
- Event and property names are `snake_case`. Enum values are fixed lists. Any new value is a schema change (A11).
- Use `sendBeacon` transport for `visit_ended` and for the last heartbeat on hide.
- Hook the events into the existing handlers: `setTab` and `seeAll` in `pages/Firm.tsx`, `onFocus` and the prev/next buttons in `OverviewTab.tsx`, `useOpenClaim`, the source `<a>` in `ClaimTable.tsx`, `ClaimDrawer.tsx` and `OverviewTab.tsx`, the website link in `FirmHeader.tsx`, `FilterBar.tsx`, `LanguageToggle.tsx` and `lock` in `AppShell.tsx`. Keep all PostHog calls behind one small `track(event, props)` function in `src/lib/analytics.ts`.

## 7. Active time

- **Active** means `document.visibilityState === 'visible'`, `document.hasFocus()` is true, and at least one of `pointerdown`, `pointermove`, `keydown`, `wheel`, `scroll` or `touchstart` in the last **60 s**.
- A 1 s tick adds elapsed time to an `active_ms` counter while active. When the counter reaches 60 000 ms, send a `heartbeat` and reset it.
- **Why focus:** a tab stays "visible" when the visitor moves to another window or app, so without the focus check up to 60 s of absence counted as active after every departure (seen in the first live test). Requiring focus matches how Google Analytics defines engagement time. The cost: reading the report in one window while typing in another is not counted.
- **Why 60 s:** the interval doesn't change accuracy, because each heartbeat carries exact milliseconds and a partial one is flushed whenever the tab hides. It only bounds what is lost if the page dies without warning (at most one interval).
- On `visibilitychange` to hidden and on `pagehide`, flush the partial counter as a final `heartbeat` (if > 0), then send `visit_ended`.
- The drawer's `open_active_ms` uses the same active clock, counted while the drawer is open.
- Throttle the interaction listeners: `pointermove` and `scroll` only refresh a "last active" timestamp, at most once per second.
- No timers run before tracking starts or after consent is withdrawn.

## 8. Indicators (computed offline)

Definitions, from the exported events of one `subject_id` (excluding `is_test`):

| Indicator | Definition |
|---|---|
| `opened` | At least one `visit_started` |
| `days_to_first_open` | First `visit_started` minus the date the link was sent (from the offline send log) |
| `n_sessions` | Visits merged when the gap between them is under 30 min |
| `n_active_days` | Distinct calendar days (Europe/Rome) with a `visit_started` |
| `tabs_viewed` | Distinct `tab` values in `tab_viewed` (0–3) |
| `claims_opened_share` | Distinct `claim` in `claim_opened` ÷ number of claims in the firm's data |
| `active_minutes` | Sum of `heartbeat.active_ms` ÷ 60 000 |
| `source_clicks` | Count of `source_clicked` |
| `methodology_viewed` | At least one `methodology_viewed` |
| `last_seen` | Latest event timestamp |

- Which indicators are primary, and whether to build a composite engagement index, is decided with the professors and pre-registered (§12).
- Engagement is a post-treatment variable. The main analysis is by assignment (intent-to-treat), with `opened` as the take-up measure.
- A visit with `visit_started` but no other interaction is reported as "opened, no interaction".

> **For the professors (P2, P3):** please choose the primary indicators before the first link is sent, and decide whether to pre-register them (AEA RCT Registry or OSF). Engagement is not randomly assigned: firms that engage more may differ from the start. So "engaged firms fixed more claims" is descriptive. The causal estimate compares treated and control firms by assignment, and can use `opened` as take-up for a treatment-on-the-treated estimate.
>
> **For the professors (P4):** limitations to state in the paper:
> - Ad blockers and company firewalls can block PostHog. Blocked visits are invisible, so all counts are a **lower bound**.
> - Several employees of the same firm are counted together. An external consultant who receives the forwarded link counts for the firm too.
> - Firms that decline tracking produce no data (P1).

## 9. Getting the data out

- A script `scripts/export_engagement.py` queries the PostHog Query API (`POST https://eu.posthog.com/api/projects/<id>/query/`, HogQL) with the personal API key from the environment.
  - It selects `timestamp, event, properties.*` for `schema_v >= 1`.
  - It pages by timestamp (keyset, `LIMIT 50000`), because OFFSET isn't allowed with personal keys.
  - It writes `analytics_exports/<YYYY-MM-DD>/events.parquet` and a `manifest.json` (row count, time range, query, export time).
- `analytics_exports/` is gitignored. Snapshots go to storage the DPO approves.
- Run it weekly during the study and once at the end. Free-plan retention is 1 year (§4.1).
- A second script joins `subject_id` to the offline mapping and computes §8. This join happens only on the approved storage.

## 10. Privacy and security

**Not collected:** IP addresses, names, emails, firm IDs or names, URLs, claim text, cookies or persistent identifiers, session recordings, data from other sites.

- The data is still **pseudonymous personal data** (the visitors are employees, and `subject_id` can be linked back to a firm). Treat it accordingly.
- The `subject_id` → firm mapping and the link keys stay offline, separate from the event data.
- Access: named researchers only, with two-factor login on PostHog. The personal API key is read-only and revoked at the end of the study.
- Retention: [to decide] (§12). Afterwards, delete the PostHog project, or keep only aggregated indicators.
- A public project key in the bundle can be abused to send fake events. Analysis ignores events whose `subject_id` isn't in the mapping.
- **Hosting:** GitHub Pages (GitHub Inc.) logs visitors' IP addresses for security purposes, for every Pages site. Nothing is stored on the device by GitHub, and the research team has no access to these logs. The privacy notice should mention GitHub as the hosting provider.

> **For the professors (P5, P6):** please confirm the data controller and the DPO contact, whether PostHog is acceptable (or whether the university prefers another tool), the retention period, and who has access to the data.

### 10.1 Privacy notice table (Italian)

For the website's privacy notice. Text in [brackets] still has to be filled in (P5, P6, P7).

La tabella indica chi fornisce gli strumenti, a cosa servono e per quanto tempo rimangono attivi o memorizzati sul dispositivo.

| Fornitore | Nome dello strumento | Finalità | Durata |
|---|---|---|---|
| [Titolare del trattamento, es. Università / Dipartimento] (strumento proprio del sito) | `fcd.passcode` (sessionStorage) | Funzionamento: mantiene il report sbloccato durante la sessione, senza dover reinserire la passphrase | Fino alla chiusura della scheda del browser |
| [Titolare del trattamento] (strumento proprio del sito) | `fcd.lang` (localStorage) | Memorizzazione della scelta: ricorda la lingua selezionata (italiano/inglese) | Finché l'utente non cancella i dati del sito dal browser |
| [Titolare del trattamento] (strumento proprio del sito) | `fcd.consent` (localStorage) | Memorizzazione della scelta: ricorda se l'utente ha accettato o rifiutato la misurazione facoltativa | 6 mesi, poi la scelta viene richiesta di nuovo |
| PostHog Inc., piattaforma cloud UE (Francoforte), in qualità di responsabile del trattamento | PostHog (libreria `posthog-js`) | Misurazione facoltativa dell'uso del report: sezioni aperte, claim consultati, clic verso le pagine di origine, tempo di utilizzo attivo. I dati sono collegati all'impresa tramite un codice pseudonimo, non alla persona. Attiva solo previo consenso | Sul dispositivo: nessun cookie e nessun dato memorizzato; l'identificativo della visita resta in memoria solo fino alla chiusura o al ricaricamento della pagina. Sui server di PostHog: [periodo di conservazione da definire, massimo 12 mesi] |

GitHub (hosting) isn't in the table because it stores nothing on the device. It belongs in the notice's section on hosting and recipients.

## 11. Testing

**Unit tests (Vitest)**

- With no `VITE_POSTHOG_KEY`, `track()` does nothing and `posthog-js` is never imported.
- `allowlistProperties` removes `$current_url`, `$pathname`, `$referrer`, `$initial_*` and any unknown key.
- The claim ID suffix: `F012-a1b2c3` → `a1b2c3`.
- The active clock (fake timers): no time while hidden or idle for more than 60 s; no time while the window lacks focus; a heartbeat at 60 s; a flush on hide.
- Nothing is sent before consent, and nothing after withdrawal.

**E2E (Playwright)**

- The e2e build uses a dummy key (`VITE_POSTHOG_KEY=phc_test_dummy`), and specs intercept `**/eu.i.posthog.com/**` with `page.route`, so nothing leaves the machine.
- No request before unlock, and none before consent.
- No request at all after "No thanks".
- After "Agree": one `visit_started`, then the expected events for tab switch, drawer open/close and source click. No payload contains a URL, `#/`, a `firm_id`, or claim text.
- The page works the same with consent denied (the existing specs run with denied consent).

The deploy job never sees the dummy key, and the test job never sees the real one.

## 12. Open questions

These are the same points as §0, phrased as questions.

For the professors:

1. Primary indicators, and whether to pre-register a composite engagement index (§8).
2. Does the ethics approval cover engagement tracking, and is a consent prompt acceptable? (It may change behaviour, and declines become missing data.)
3. Should declines be counted, as one anonymous `consent_declined` event without `subject_id`?
4. Retention period, and who has access.
4a. Free plan or pay-as-you-go with a billing limit for the launch month (§4.1)?
4b. Will the invitation email show a preview of the result (in the body or as a PDF)? This changes what "opened" means (P10).
4c. Logo permission, department and project name, contact person, study page, and UniMi vs 2d4d branding (P11, §13).

For the DPO (via the professors):

5. Who is the controller, and is PostHog (US parent company, EU hosting) approved? Data processing agreement and transfer safeguards.
6. Approval of the consent text and the privacy notice (§5).
7. Record of processing entry, and whether a DPIA is needed.

## 13. Trust and university branding

Recipients are more likely to open the link, and to accept the measurement, when the page clearly belongs to the university running the study. Today the dashboard has neutral styling and no institution name.

### 13.1 What changes

- **Logo:** the official Università degli Studi di Milano (UniMi) logo in the header, on the passphrase screen and on the privacy page. Use the official file supplied by the university's communication office (SVG, with the variant for dark backgrounds). Don't copy it from the website.
- **Institution line:** under the logo or in the footer, for example "Università degli Studi di Milano · [Dipartimento] · Progetto di ricerca [nome]".
- **Colours and typography:** the brand colours replace the neutral primary, accent, header and link colours in the app's colour tokens (IMPLEMENTATION_PLAN.md §2.5), for both light and dark mode. The red/yellow review colours **don't change**: they carry meaning, not branding.
- **Footer:** contact person (name and institutional email), a link to the study's page on the university or project website, and the "Privacy e tracciamento" link (§5.3).
- **Study page:** a public page on the university or project website that describes the study and names the dashboard's address (`greenclaims.2d4d.eu`). Recipients can then check that the link is genuine. The invitation email and the dashboard footer both link to it.
- **Consistency with 2d4d.eu:** the dashboard lives on a 2d4d.eu subdomain, so also check the 2d4d project's own branding. Agree with the professors whether the page carries UniMi branding, 2d4d branding, or both.

> **For the professors (P11):** please confirm (1) permission to use the UniMi logo, and who supplies the official file; university brand rules usually require approval from the communication office. (2) Which department and project name to show. (3) The contact person. (4) Whether a study page exists, or who can publish one. (5) UniMi branding, 2d4d branding, or both.

### 13.2 Research task: UniMi visual identity

A task for the implementer, done **before** changing any styling. Use a browser to go through the official sites. Record facts and sources only; don't copy code, images or stylesheets.

1. **Brand guidelines.** Look on `unimi.it` for an official visual identity page or manual ("identità visiva", "manuale d'uso del marchio", "logo", "brand"). If one exists, record its URL, the logo usage rules (clear space, minimum size, allowed backgrounds, forbidden uses), the official colours and the fonts. These rules override anything inferred in step 2.
2. **Observed styling.** Click through several representative pages: home, a department page, a research or project page, and a news article. For each, note:
   - primary and secondary colours (hex), and where they are used (header, links, buttons, footer)
   - fonts (family, weights, and whether it is a licensed font or a free one, e.g. from Google Fonts)
   - header and footer layout: logo position, institution line, footer content
   - button and link styles, corner radius, spacing
   Take a screenshot of each page for reference.
3. **2d4d.eu.** Repeat step 2 briefly for `www.2d4d.eu`.
4. **Fit with the dashboard.** Map the findings onto the app's colour tokens (§2.5 of IMPLEMENTATION_PLAN.md):
   - Check the contrast of every text/background pair in light and dark mode (WCAG AA: 4.5:1 for normal text).
   - Check that brand colours can't be confused with the red/yellow review colours. If a brand colour is red-like, use it only for chrome (header, logo area), never next to review lights.
   - If the brand font is licensed and not available for the web, choose the closest free font and record why.
5. **Deliverable:** `BRANDING.md` in the repo root, with the sources (URLs, access date), the proposed tokens (light and dark), the font choice, logo placement and the contrast results, plus the screenshots in `docs/branding/`. The professors review it before any implementation (P11).

### 13.3 Implementation, after approval

- Update the colour tokens and fonts. Add the logo (from the official file) and the footer.
- Re-run the dataviz/contrast check from IMPLEMENTATION_PLAN.md Phase 6 on the new tokens.
- E2E: update any check that depends on the old colours or header. Add checks that the logo, institution line, contact and study link appear on the passphrase screen, firm page and privacy page, in light and dark mode, at 375px and 1280px.

## 14. Change log

| Date | `schema_v` | Change |
|---|---|---|
| 2026-11-14 | 1 | First draft |
| 2026-11-14 | 1 | Added §0 and "For the professors" notes, consent expiry after 6 months (A13), GitHub hosting note, Italian privacy table (§10.1) |
| 2026-11-14 | 1 | Consent banner design, choice storage, privacy page and proof of consent (§5); `consent_granted` event; P10 (email preview); event volume and site size at 40K firms (§3, §4.1) |
| 2026-11-14 | 1 | Trust and university branding (§13), with the UniMi visual identity research task; P11 |
| 2026-11-14 | 1 | First implementation. Differences from the text above are listed in "Implementation notes" below |
| 2026-11-14 | 1 | After the first live test, before any link was sent: heartbeat every 60 s instead of 15 s, and active time also requires window focus (A9, §6.2, §7). Schema not yet frozen, so `schema_v` stays 1 |
| 2026-11-17 | 2 | Share button in the firm header and the `share_used` event (privacy notice v2 promises to measure "l'uso della funzione di condivisione"). The link shared is the firm's report link; neither it nor the access code is sent |

### Implementation notes (2026-11-14, `posthog-js` 1.449.2)

Where the code differs from, or adds to, the sections above. Review these before the schema is frozen (A11).

**Config (§4.2).** Every option name in §4.2 exists in 1.449.2. Added: `bootstrap: { distinctID: visit_id }`, `advanced_disable_flags: true` (no `/flags` call and no remote config), and `capture_exceptions`, `capture_performance`, `capture_heatmaps`, `capture_dead_clicks`, `rageclick`, `save_campaign_params` all `false`.

**Allowlist (§4.2).** Two more internals are kept or set by `before_send`:
- `$process_person_profile` is kept. It is how `person_profiles: 'never'` reaches the server; without it PostHog creates a person record per visit.
- `$geoip_disable: true` is added to every event. Without it PostHog derives country and city from the request IP before discarding it.
- `distinct_id` is overwritten with `visit_id` in the hook, so it also holds for a second visit in the same page load.
- Events that are not in §6.2 are dropped entirely, and only string, number and boolean values pass.

**Withdrawal (§5.3).** `posthog.opt_out_capturing()` is **not** called: it writes a `__ph_opt_in_out_*` entry to localStorage, which would be a stored item missing from the table in §10.1. The app stops sending instead (every call goes through `track()`), and the E2E suite checks that localStorage holds only `fcd.*` keys.

**Consent storage (§5.2).** `fcd.consent` has one optional extra field, `unreported` (`banner` \| `privacy_page`). It is set when Accept is clicked and removed once `consent_granted` has been sent, so the proof-of-consent event is not lost when the visitor accepts on the passphrase screen and reloads before unlocking. The 6 months are counted in UTC.

**Banner (§5.1).** While the banner is open, the passphrase field does not auto-focus (the banner holds the focus, as §5.1 asks). The banner, the footer link and `#/privacy` exist only in builds that have a key, so the live site is unchanged until the key is set.

**Events (§6).**
- `entry_tab` and `heartbeat.tab` can be `none`, when the visit starts or time passes outside the firm page (methodology, privacy).
- `example_stepped.index` is 1-based, the number shown on screen ("2 of 5").
- `visit_ended.n_events` counts the events before `visit_ended` itself.
- `consent_changed { to: 'granted' }` is sent, after `consent_granted`, when a visitor who had declined accepts on the privacy page.
- `filter_changed.n_selected` is the number of values selected in that filter after the change (all values when nothing is filtered).
- A visit that starts late (consent given after the page rendered) also sends `tab_viewed { trigger: 'initial' }`, `claim_opened` and `methodology_viewed` for what is already on screen.
- Lock sends a last `heartbeat`, then `locked`, and no `visit_ended`. A new unlock is a new `visit_id`.
- After a `visit_ended` (pagehide, or hidden for 30 min), if the page comes back (tab shown again, back/forward cache) a new visit starts with a new `visit_id` and `unlock: 'silent'`.
- Events are sent one request each, not batched: `posthog-js` skips its batch queue whenever a capture carries options, and every event carries its own timestamp.

**Active time (§7).** On `visibilitychange` to hidden only the partial `heartbeat` is flushed; `visit_ended` follows on `pagehide` or after 30 min hidden, as in §6.2 (§7 says both on hide).

**Test mode (A10).** A build with `VITE_ANALYTICS_TEST=1` (as well as a key) is in test mode: any data file is tracked, under the fixed subject `TESTMODE` if the file has no `subject_id`, and every event has `is_test: true`. The footer shows "Tracking: test mode". The deploy job never sets it, so the study site cannot be in test mode. It is for local builds and any non-study deployment.

**Subject (§3).** Until per-firm access exists, tracking runs only when the unlocked file holds exactly one firm with a `subject_id`. `subject_id` (8–64 letters or digits, unique, must not contain the `firm_id`) and `is_test` are optional fields of a firm in the data schema.

**Testing (§11).** `posthog-js` drops events from automated browsers, so the E2E helper masks `navigator.webdriver`, `userAgentData` and the user agent. Playwright does not report requests made while a page unloads, so the reload spec counts accepted `sendBeacon` calls in the page and a second spec reads the payloads after a synthetic `pagehide`.

**Export (§9).** `scripts/export_engagement.py` selects `uuid, timestamp, event, properties` and pages with `timestamp >= <last>` plus de-duplication by `uuid`. It has offline tests but **has not been run against the live Query API**. `scripts/engagement_indicators.py` expects a mapping CSV with `subject_id, firm_id, sent_at, n_claims`; it adds `opened_no_interaction`.
