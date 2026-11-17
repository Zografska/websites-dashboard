# Engagement tracking: what is recorded

A short guide to what the dashboard sends to PostHog and when. The full design, with the reasons behind each choice, is in [ANALYTICS_SPEC.md](ANALYTICS_SPEC.md). The code is in [src/lib/analytics.ts](src/lib/analytics.ts).

## When anything is sent at all

Nothing is sent, and the PostHog library is not even downloaded, unless all of these hold:

1. The site was built with a PostHog key (the deployed site, once the `POSTHOG_KEY` variable is set).
2. The visitor unlocked the report with the passphrase.
3. The unlocked data is for exactly one firm and carries a `subject_id`.
4. The visitor clicked **Accept** on the banner (or on the privacy page).

If the visitor declines, closes the banner, or later withdraws consent, nothing is sent.

### Test mode

A build made with `VITE_ANALYTICS_TEST=1` next to the key is in test mode. It is meant for local builds and anything that is not the study site.

- Condition 3 is dropped: any data file is tracked, including the 40-firm demo file. If the file has no `subject_id`, events carry the fixed subject `TESTMODE`.
- Every event has `is_test: true`, so the analysis ignores it.
- The page footer shows "Tracking: test mode".
- Consent still applies: nothing is sent before Accept.

Put both settings in `.env.production.local` (gitignored). The deploy workflow never sets the test flag.

## The events

There are 18 events. This list is fixed: the app cannot send anything that is not on it.

### The visit

| Event | When it happens | Extra details sent |
|---|---|---|
| `visit_started` | Tracking begins: right after unlock and Accept, or on a return visit where both are already in place. Also when the page comes back after a visit ended. | Which tab the visitor landed on; whether the link pointed at a specific claim; whether the passphrase was typed or remembered |
| `heartbeat` | After every 60 seconds of active time. A shorter one is sent whenever the tab is hidden, so no time is lost. | Active milliseconds since the last heartbeat; current tab; whether a claim is open |
| `visit_ended` | The page is closed, reloaded or navigated away from, or the tab stays hidden for 30 minutes. | Total active time in the visit; number of events sent |
| `locked` | The visitor clicks **Lock**. Tracking stops until the next unlock. | — |

"Active time" counts only while the tab is visible, its window is the one in front, and the visitor clicked, typed, scrolled or moved the pointer in the last 60 seconds.

### Moving around the report

| Event | When it happens | Extra details sent |
|---|---|---|
| `tab_viewed` | A tab of the firm page is shown: the first one on arrival, and each one the visitor switches to (Overview, Claim examples, How to read it). | Which tab; whether it was the first view, a click, or reached through "See all" |
| `area_selected` | The visitor picks a review area in the Overview list. | Which area |
| `example_stepped` | The visitor presses previous or next on the example in the Overview. | Area; direction; which example number |
| `see_all_clicked` | The visitor clicks "See all claims in this area" in the Overview. | Which area |
| `methodology_viewed` | The Methodology page is opened. | — |
| `language_changed` | The visitor switches between English and Italian. | The new language |

### Claims

| Event | When it happens | Extra details sent |
|---|---|---|
| `claim_opened` | The detail panel for a claim opens. | The claim's 6-character code; where it was opened from (table, overview, or a direct link); its area; red or yellow |
| `claim_closed` | The detail panel closes. | The claim's code; how long it was open, in active time |

### Links to the firm's own website

| Event | When it happens | Extra details sent |
|---|---|---|
| `source_clicked` | The visitor clicks the link to the page where a claim was found. | The claim's code; where the link was (table, detail panel, or overview) |
| `website_clicked` | The visitor clicks the firm's website link in the page header. | — |

Only the click is recorded, never the address.

### Sharing the report

| Event | When it happens | Extra details sent |
|---|---|---|
| `share_used` | The visitor uses the Share button in the page header. | How: the device's share menu, or copying the link; and the result: shared, cancelled, copied, or failed |

The shared link is the firm's report link, without the access code. The link itself is never sent to PostHog.

### Filters

| Event | When it happens | Extra details sent |
|---|---|---|
| `filter_changed` | The visitor changes the area, status or scope filter on the Claim examples tab. | Which filter; how many values are selected afterwards |
| `filters_cleared` | The visitor clicks "Clear filters". | — |

### Consent

| Event | When it happens | Extra details sent |
|---|---|---|
| `consent_granted` | The visitor clicks Accept. It is always the first event sent. If Accept was clicked before unlocking, it is sent right after the unlock. | Version of the privacy notice; whether it was the banner or the privacy page |
| `consent_changed` | The visitor changes their choice on the privacy page. When withdrawing, this is the last event sent. | The new choice |

## Sent with every event

| Detail | What it is |
|---|---|
| `subject_id` | The pseudonymous code that stands for the firm |
| `visit_id` | A random ID made when the page loads; a reload gives a new one |
| `seq` | A counter within the visit (1, 2, 3 …), useful for spotting lost events |
| `schema_v` | Version of this event list |
| `app_version` | Which build of the dashboard sent it |
| `locale` | Interface language, `en` or `it` |
| `viewport` | `narrow` (phone) or `wide` |
| `is_test` | `true` for the team's own test firms, so they can be excluded |

## Never sent

IP addresses, page addresses, the firm's name or ID, claim text, names or emails, cookies, screen recordings, or automatic click and page-view capture. A filter in the app removes anything that is not on the lists above before it leaves the browser.
