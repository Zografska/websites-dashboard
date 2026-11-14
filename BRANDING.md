# UniMi visual identity: research for the dashboard

**Status:** research, 14 Nov 2026. The proposed tokens in §5.1, Roboto and the navy header band are applied in the app (`src/index.css`, `AppShell.tsx`), ahead of the professors' review (ANALYTICS_SPEC §13, P11). Not applied: the logo, the institution line and footer contacts, and square corners. The values are observed, not official, and must be re-checked against the manual.
**Scope:** `unimi.it` and its own sub-sites. Step 3 of §13.2 (`www.2d4d.eu`) was **not done** in this pass.

Two kinds of statement appear below and are kept apart:

- **Official**: stated on a UniMi page, quoted or paraphrased with its URL.
- **Observed**: read from the computed styles of public pages on the access date. These show what the web team does today. They are not rules.

---

## 1. What to take from this

- **An official identity system exists, but its manuals are staff-only.** The logo files, clear-space rules, minimum sizes, official colour values and fonts are in PDF manuals behind university login. A member of UniMi staff (one of the professors) has to download them. Everything about colours and fonts in this file is therefore observed, not official.
- **The logo needs permission.** Use of the mark is reserved to the university and its structures. A department can use it for its institutional activities and is responsible for correct use. Use together with external parties needs the Rector's prior authorisation.
- **The observed brand colour is a navy blue, `#003366`**, with white. It is far from the dashboard's red and yellow review colours, so there is no confusion risk from the brand colour itself.
- **The observed font is Roboto**, a free font (Apache 2.0). No licensed web font is in use, so no substitute is needed.
- **Every official site carries the logo top-left, linked to `www.unimi.it`.** This is an official web guideline, and it applies to "sites of initiatives or activities promoted by the university and all its structures".

## 2. Sources

All accessed 14 Nov 2026.

| # | Page | URL |
|---|---|---|
| S1 | Identità visiva di Ateneo (public) | https://www.unimi.it/it/ateneo/la-statale/comunicazione-e-media/identita-visiva-di-ateneo |
| S2 | Sistema di Identità Visiva (staff portal, page public) | https://work.unimi.it/servizi/comunicare/12902.htm |
| S3 | Norme per l'uso del marchio | https://work.unimi.it/servizi/comunicare/37091.htm |
| S4 | Linee guida per siti web | https://work.unimi.it/servizi/comunicare/88539.htm |
| S5 | Manuali Ateneo e Amministrazione (index public, files protected) | https://work.unimi.it/servizi/comunicare/37102.htm |
| S6 | Loghi per la tesi | https://www.unimi.it/it/studiare/frequentare-un-corso-di-laurea/laurearsi/loghi-la-tesi |
| P1 | Home | https://www.unimi.it/it |
| P2 | Research section | https://www.unimi.it/it/ricerca |
| P3 | Department: Economia, Management e Metodi Quantitativi (DEMM) | https://demm.unimi.it/ |
| P4 | News article, La Statale News | https://lastatalenews.unimi.it/brevetti-europei-statale-istituti-ricerca-italiani-piu-attivi |

On each site the cookie banner was answered with "Rifiuta tutti".

## 3. Official rules

### 3.1 The mark (S1, S3)

- The mark (the Minerva) and the logotype (the words "Università degli Studi di Milano") are **inseparable**. Together they are "the marchio".
- The shape and colour of the Minerva, the typeface and size of the lettering, the relation between the two, and between them and other wording or marks, are set out in the manuals and **cannot be altered**.
- Use of the mark is the **exclusive and reserved competence of the university**, its governing bodies and its scientific, teaching, administrative and service structures, in relation to their institutional activities.
- All university staff may use the files in the manuals, following the manuals' rules. A structure may pass the manual and files to external professionals, and is then responsible for correct use.
- **Rector's prior authorisation** is needed for cultural and scientific events organised by public or private bodies, and for initiatives organised by university structures together with external parties outside university premises. The request goes through an online form; contact `manifestazioni@unimi.it`.
- Use by external parties for commercial or advertising purposes needs a resolution of the Consiglio di Amministrazione.
- Use is always subject to the condition that it does not harm the university's name and image.
- Reference text: article 57 of the Regolamento generale d'Ateneo.

### 3.2 Websites (S4)

- Sites of initiatives or activities promoted by the university and its structures must be clearly recognisable and fit the university web system, following the identity manuals.
- Such sites must carry, **on every page, the university mark linked to the home page of `www.unimi.it`**. The mark generally sits on the **left of the header** and can sit next to other marks, respecting proportion and spacing.
- Clear-space rules, official marks and the **colour scheme specific to each faculty, school and department** are in the manuals, available to permanent staff only, after login.
- A site not hosted by the university must be reported to `redazione.web@unimi.it` with: URL, site name, person responsible for content, structure, type of site, publication date.
- Sites must respect copyright, privacy, accessibility, liability and affiliation rules. Stock images are discouraged; the university has its own photo archive.

### 3.3 Who to ask (S1, S2)

- Identity system and manuals: Ufficio Eventi Istituzionali e Cerimoniale, `manifestazioni@unimi.it`.
- Cases the manuals don't cover: Settore Comunicazione istituzionale e digitale, `uni.comunicazione@unimi.it`, tel. 02 503 12103 / 12066.

### 3.4 Not available to us

The manuals are at `work.unimi.it/aree_protette/…` (S5 lists "Identità visiva dell'Ateneo", a 13.5 MB PDF, plus one for Divisioni, Centri e Uffici, and one per department and faculty). Access is restricted to university staff, so they were not opened. Until someone with access reads them, these are **unknown**:

- the official colour values (Pantone, CMYK, RGB or hex)
- the official typeface(s)
- clear space, minimum size, allowed backgrounds, forbidden uses
- which logo variants exist (S5 mentions "blue only", "epigraph" and JPEG versions)
- the department's own colour scheme

## 4. Observed styling

Viewport 1024 px wide. Colours are computed values converted to hex.

### 4.1 Colours across the four pages

| Colour | Where it is used | Seen on |
|---|---|---|
| `#003366` navy | Links, headings (news), footer links, department header and footer bands, named `--main-text` (portal) and `--blue` (department) in the sites' own CSS variables | P1–P4 |
| `#004082` blue | Portal header band, named `--main-color` | P1, P2 |
| `#225d8e` mid blue | Focus colour (`--focus-color`), bold links in side cards | P1, P2 |
| `#0278a7` teal blue | Full-width link bars with white text | P1 section pages, S1 |
| `#ebf0f6` pale blue | Tinted panels, news footer | P1, P2, P4 |
| `#333333` / `#262626` / `#4a4a4a` | Body text (portal / department / news) | P1–P4 |
| `#dddddd` | Portal footer background | P1, P2 |
| `#fde19d` with a `#fcc22d` left bar | Contact card | S1 |
| `#008bd0`, `#006191`, `#eff8fc` | DEMM's accent blue, its dark and its lightest tint | P3 |

The department template defines a full palette as CSS variables, one family per area, each with dark, light and lighter steps: orange `#ec7405`, red `#e3211a`, purple `#b80229`, blue `#015ea8`, "spes" blue `#008bd0`, olive `#a4c403`, green `#009932`, sea green `#43b49d`, slate `#d1d0cc`, yellow `#fcc400`. DEMM's pages use the "spes" blue family. This matches S4's statement that each department has its own colour scheme, but the mapping of colour to department is in the protected manuals.

### 4.2 Fonts

- **Roboto** on all four pages, weights 300, 400, 500, 700, 900. Fallbacks: `sans-serif` (portal, department), `Helvetica, Arial, sans-serif` (news).
- The portal serves Roboto from its own domain. The department and news sites load it from Google Fonts.
- Roboto is free (Apache License 2.0). No licensed font was found.
- Icons: Font Awesome on the portal.
- The logotype inside the logo is a serif face that is part of the artwork, not a web font.

### 4.3 Per page

**P1 Home**
- Header: a `#004082` band about 50 px high with white 14 px utility links (Unimia, Segreterie, Ariel, Biblioteche, Chi e dove, Webmail), language switch ITA / ENG on the right. Below it the logo, white on the photo, top-left (about 193 × 113 px), with the main menu in white 18 px (Corsi, Studiare, Ricerca, Terza missione, Ateneo, Internazionale).
- Body: Roboto 18 px, `#333333` on white. `h1` 32 px weight 500.
- Buttons and boxes: square corners (radius 0) throughout.
- Footer: `#dddddd` background, padding 36 px 18 px. Four columns of `#003366` links under 21.6 px weight-600 headings (Strutture, Servizi, Concorsi selezioni e gare), plus outlined buttons (Orientarsi e scegliere, Contattare l'Università, Fai sentire la tua voce, Fundraising, Unimi Store). A row of legal links (Amministrazione trasparente, Dichiarazione di accessibilità, Privacy e cookie, Cookie settings, Note legali, Mappa del sito). Then the institution block: name, address (Via Festa del Perdono 7, 20122 Milano), phone, PEC, tax codes, copyright, social links.

**P2 Research section**
- Header collapses to a solid `#004082` band 110 px high with the white logo top-left (about 154 × 90 px).
- Breadcrumb in `#003366`, 16 px. Body 18 px `#333333`, line height 22.5 px. Text column about 612 px with a side column.
- Section tiles: `#003366` at 60% opacity over images, 18 px weight 500.
- Side cards on `#ebf0f6`.

**P3 Department (DEMM)**
- Header: `#003366` band with a thin top line of white utility links, then the white logo top-left (about 116 × 66 px) followed by the short name "DEMM" and the full department name in white. Language switch and search on the right.
- Navigation: a white bar under the header, 18 px `#262626` items with 21 px vertical padding.
- Body `#262626` on white. `h1` 40 px weight 900, section titles 44 px weight 300.
- Buttons: outlined, 1 px `#262626` border, padding 16 px 24 px, square corners.
- Footer: a `#006191` band ("Segui il dipartimento su") above a `#003366` band with white 14 px text: department name and links, then the university name, address, PEC, social links and tax codes.

**P4 News article**
- Header: white, section menu on top, the "La Statale news" wordmark on the left and the **blue logo on white** on the right (about 185 × 62 px).
- `h1` 32 px weight 700 in `#003366`, centred. Body 16 px `#4a4a4a`, line height 24 px. Inline links `#003366`, underlined.
- Footer: `#ebf0f6` background with `#003366` text, the blue logo on the left, institution name in capitals, address, PEC, tax codes, legal links.

### 4.4 Patterns common to all four

- Logo top-left (portal, department) or in the header (news), always linked to the university.
- White logo on navy, or blue logo on white or pale blue. No other backgrounds were seen.
- Square corners everywhere.
- Navy for chrome and links, dark grey for body text, white page background.
- Footer always ends with the institution name, address, PEC and tax codes, plus accessibility, privacy and legal links.

### 4.5 Screenshots

In `docs/branding/`, low-resolution reference captures:

| File | Page |
|---|---|
| `01-home.jpg` | P1, with the cookie banner still open |
| `02-identita-visiva.jpg` | S1 |
| `03-footer.jpg` | Portal footer |
| `04-ricerca.jpg` | P2 |
| `05-dipartimento-demm.jpg` | P3 |
| `06-news-article.jpg` | P4 |

They show UniMi's logo and photographs. The repository is on GitHub, so decide before committing whether they should be kept out of it.

## 5. Fit with the dashboard

Current state: `src/index.css` uses neutral greys for every chrome token, Inter as the font, and a 10 px base radius. The review colours (`--light-*`) and the amber `--banner` are separate tokens.

### 5.1 Proposed tokens

These are a proposal built from the observed colours. Replace the values with the official ones once the manual has been read.

**Light**

| Token | Now | Proposed | Note |
|---|---|---|---|
| `--brand` (new) | — | `#003366` | Header and logo area background |
| `--brand-foreground` (new) | — | `#ffffff` | Text and white logo on the header |
| `--primary` | near-black | `#003366` | Filled buttons, pressed filter segments |
| `--primary-foreground` | near-white | `#ffffff` | |
| `--link` (new) | inherits text | `#003366` | Links in body text |
| `--ring` | mid grey | `#225d8e` | Focus ring, the site's own focus colour |
| `--accent`, `--secondary` | `#f5f5f5` | `#ebf0f6` | Hover and soft panels |
| `--accent-foreground`, `--secondary-foreground` | near-black | `#003366` | |
| `--muted` | `#f5f5f5` | **unchanged** | See 5.3 |
| `--muted-foreground` | `#737373` | **unchanged** | |
| `--background`, `--foreground`, `--border` | | unchanged | |

**Dark**

The site has no dark mode, so these are derived tints, not UniMi colours.

| Token | Now | Proposed | Note |
|---|---|---|---|
| `--brand` | — | `#003366` | Same navy; needs a bottom border against the page |
| `--brand-foreground` | — | `#ffffff` | |
| `--primary` | light grey | `#9ec5ea` | Navy itself is too dark on a dark page |
| `--primary-foreground` | near-black | `#002244` | |
| `--link` | inherits text | `#9ec5ea` | |
| `--ring` | mid grey | `#6fa3d3` | |
| `--accent`, `--secondary` | `#262626` | `#12283f` | |
| `--accent-foreground`, `--secondary-foreground` | near-white | `#dbe7f3` | |
| `--muted`, `--muted-foreground` | | unchanged | |

**Not proposed for use:** the site's yellow contact card (`#fde19d`, `#fcc22d`), and the department palette's yellow `#fcc400`, red `#e3211a`, orange `#ec7405` and greens. They sit too close to the review lights.

### 5.2 Contrast results (WCAG 2.1, AA = 4.5:1 for normal text, 3:1 for UI parts)

**Light**

| Pair | Text | Background | Ratio | Result |
|---|---|---|---|---|
| Header text on brand | `#ffffff` | `#003366` | 12.61 | AA |
| Button text on primary | `#ffffff` | `#003366` | 12.61 | AA |
| Link on page | `#003366` | `#ffffff` | 12.61 | AA |
| Focus ring on page | `#225d8e` | `#ffffff` | 6.94 | passes 3:1 |
| Accent text on accent | `#003366` | `#ebf0f6` | 11.00 | AA |
| Body text on accent | `#0a0a0a` | `#ebf0f6` | 17.28 | AA |
| Muted text on page (unchanged) | `#737373` | `#ffffff` | 4.74 | AA |
| Muted text on accent | `#737373` | `#ebf0f6` | 4.14 | **fails** |
| Red label on page | `#b91c1c` | `#ffffff` | 6.47 | AA |
| Red label on accent | `#b91c1c` | `#ebf0f6` | 5.65 | AA |
| Yellow label on page | `#a16207` | `#ffffff` | 4.92 | AA |
| Yellow label on accent | `#a16207` | `#ebf0f6` | 4.30 | **fails** |
| Green label on accent | `#15803d` | `#ebf0f6` | 4.38 | **fails** |
| Preliminary banner (unchanged) | `#451a03` | `#fef3c7` | 13.45 | AA |

**Dark**

| Pair | Text | Background | Ratio | Result |
|---|---|---|---|---|
| Header text on brand | `#ffffff` | `#003366` | 12.61 | AA |
| Header edge against page | `#003366` | `#0a0a0a` | 1.57 | needs a border |
| Button text on primary | `#002244` | `#9ec5ea` | 8.86 | AA |
| Link on page | `#9ec5ea` | `#0a0a0a` | 10.96 | AA |
| Link on card | `#9ec5ea` | `#171717` | 9.93 | AA |
| Accent text on accent | `#dbe7f3` | `#12283f` | 11.95 | AA |
| Body text on accent | `#fafafa` | `#12283f` | 14.36 | AA |
| Focus ring on page | `#6fa3d3` | `#0a0a0a` | 7.41 | passes 3:1 |
| Red label on accent | `#fca5a5` | `#12283f` | 7.90 | AA |
| Yellow label on accent | `#fde047` | `#12283f` | 11.37 | AA |
| Green label on accent | `#86efac` | `#12283f` | 10.68 | AA |

### 5.3 What the results mean

- **Keep `--muted` neutral.** The dashboard puts review labels and muted text on `bg-muted` surfaces. On the pale blue tint the yellow label, the green label and muted text all drop below 4.5:1 in light mode. So the tint goes only on `--accent` and `--secondary`, and no review label or muted text should sit on those.
- **No review lights in the header.** A red dot on the navy header has only 2.61:1 contrast. The header should hold the logo, the title and navigation only.
- **Dark mode header needs a visible bottom border**, since navy on near-black is 1.57:1.

### 5.4 Confusion with the review colours

- The brand colour is blue (hue about 210°). The review colours are red (about 0°), yellow (about 45°) and green (about 140°). They are far apart in hue and stay distinguishable under the common colour-vision deficiencies, since blue against red or yellow is the axis those preserve.
- The brand is not red-like, so the "chrome only" restriction in §13.2 doesn't apply to it.
- The risk is in the secondary colours listed under "Not proposed for use" above. Leaving them out avoids it.
- The dashboard's amber `--banner` happens to resemble UniMi's yellow contact card. It is unchanged and carries a warning meaning in both places.

### 5.5 Font

- **Recommendation: switch from Inter to Roboto**, self-hosted through `@fontsource-variable/roboto` or `@fontsource/roboto`, the same way Inter is bundled now. It is the font UniMi's own sites use, it is free, and self-hosting keeps the privacy notice true (no request to Google Fonts).
- Weights needed: 400, 500, 700. The dashboard uses nothing lighter or heavier today.
- Roboto is slightly narrower than Inter. Tables and the 375 px layout should be re-checked after the switch.
- If the manual names a different official typeface for print, that doesn't change the web choice unless it also says so for web.

### 5.6 Logo placement

Following S4 and the pattern in 4.4:

- **Header, left:** the white version on the navy `--brand` band, linked to `https://www.unimi.it`, followed by the dashboard title. On the department site the logo is about 66 px high in a 100 px band; the dashboard's header is 56 px, so the size must be checked against the manual's minimum.
- **Passphrase screen and privacy page:** the same header, so no separate placement is needed.
- **Footer:** the institution line (name, department, project), contact, study page link and "Privacy e tracciamento". The news site shows that a blue logo on a pale background in the footer is an accepted pattern, but one logo per page is enough.
- **Dark mode:** the same white-on-navy header works unchanged, which avoids needing a logo variant for dark backgrounds.
- **File:** an official SVG from the manual, supplied by the professors. Nothing was taken from the site.
- **Corners:** UniMi's sites use square corners; the dashboard uses rounded ones. Squaring the header band alone would be enough to match. Changing the radius of cards and buttons is a larger visual change and is left as a question.

## 6. Open points for the professors (P11)

1. **Get the manuals.** Someone with UniMi staff login downloads "Identità visiva dell'Ateneo" and the department's manual from S5, and passes on: official colour values, typeface, clear space, minimum size, allowed backgrounds, and the logo files (white and blue, SVG).
2. **Which department and colour scheme.** The department's own manual defines its colours. Which department is the dashboard published under, and should the dashboard use the department accent or only the university navy?
3. **Is authorisation needed?** The dashboard is a research output of a UniMi structure, sent to external firms and hosted outside the university (`greenclaims.2d4d.eu`, on GitHub Pages). Does that fall under the department's own institutional use, or does it need the Rector's authorisation (S3)? `uni.comunicazione@unimi.it` handles cases the manuals don't cover.
4. **Report the site.** S4 asks that sites not hosted by the university be reported to `redazione.web@unimi.it` with the details listed in 3.2. Who does this?
5. **Institution line, contact person, study page.** Still needed for the footer (§13.1).
6. **UniMi, 2d4d, or both.** Not researched here: `www.2d4d.eu` still has to be looked at (§13.2 step 3), and S4 allows the university mark to sit next to other marks.
7. **Rounded or square corners**, and whether to switch the font to Roboto (5.5, 5.6).
8. **Screenshots in the repository.** Keep `docs/branding/` out of the public repo or not (4.5).
