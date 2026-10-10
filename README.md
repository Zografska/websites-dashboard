# Firm Claims Dashboard

A static, passcode-protected dashboard that shows environmental claims found on firm websites, one firm at a time. For each firm it shows which claims were found, how that changed from crawl to crawl, and how the claims split by category and detector confidence. The claims are relevant to the EU's ECGT rules (Directive 2024/825, amending the UCPD) and Italy's Codice del Consumo.

It's a research prototype. Detection is automated and is not a legal assessment. Confidence is the detector's confidence, not legal severity.

- Design: [PLAN.md](PLAN.md)
- Build plan, decisions and implementation notes: [IMPLEMENTATION_PLAN.md](IMPLEMENTATION_PLAN.md)
- Methodology page source: [src/content/METHODOLOGY.md](src/content/METHODOLOGY.md)

Stack: Vite, React, TypeScript, Tailwind v4, shadcn/ui, Recharts, react-router (hash routing) and zod. It's deployed to GitHub Pages.

## Local development

Requires Node 22 (see `.nvmrc`).

```bash
npm ci
npm run fixtures                       # writes data/firms.json (synthetic demo data, git-ignored)
DASHBOARD_PASSCODE='some local dev passphrase' npm run encrypt   # writes public/data/firms.enc
npm run dev                            # http://localhost:5173/websites-dashboard/
```

Don't commit a `public/data/firms.enc` encrypted with a throwaway local passphrase.

| command | what it does |
|---|---|
| `npm run dev` | Vite dev server |
| `npm run build` / `npm run preview` | Production build and local preview |
| `npm run lint` | ESLint, then a check that no plaintext data (`data/`, `*.csv`, `public/**/*.json`) is tracked by git |
| `npm run typecheck` | `tsc -b` |
| `npm test` | Vitest unit tests (`src/lib`, `scripts`) |
| `npm run test:e2e` | Playwright end-to-end tests (Chromium). Install the browser once with `npx playwright install chromium`. |
| `npm run fixtures` | Regenerates the deterministic demo data |
| `npm run encrypt` | Encrypts `data/firms.json` into `public/data/firms.enc` |

The e2e tests never need the real passcode. They generate and encrypt their own throwaway fixture in `e2e/.tmp/` and serve it in place of `firms.enc`. To capture review screenshots of every page at 375 and 1280px, in light and dark, run `SCREENSHOTS=1 npx playwright test e2e/screens.spec.ts`. They're written to `test-results/screens/`.

## Data workflow

1. Put the pipeline output (or the demo fixtures) in `data/firms.json`. The whole `data/` folder is git-ignored.
2. Run `npm run encrypt`. It validates the file, prompts for the passcode twice (input hidden), encrypts the file and verifies the result.
3. Commit `public/data/firms.enc` and push to `main`. The push runs the tests and deploys.

Only ciphertext is ever committed. The repo is public, so anyone can download `firms.enc`. The passcode is its only protection.

### Passphrase guidance

Use a passphrase of **four or more random words**, for example from a diceware list. Don't use a short password. Anyone can download the encrypted file and try guesses offline, so the passphrase's length is what protects it. The encrypt script refuses passcodes shorter than 20 characters or fewer than 4 words. It never prints the passcode or the plaintext.

To change the passcode, re-run `npm run encrypt` and push. Readers enter the passcode once per browser session. The "Lock" button in the header forgets it.

### Encryption

PBKDF2-SHA256 with 600,000 iterations and a 16-byte random salt derives an AES-GCM-256 key, used with a 12-byte random IV. The browser and the encrypt script share one Web Crypto module ([src/lib/crypto.ts](src/lib/crypto.ts)).

## Data contract

The pipeline produces one JSON file, described in [PLAN.md §2](PLAN.md#2-data-contract) and enforced by the zod schema in [src/lib/schema.ts](src/lib/schema.ts). The app validates the file after decrypting it. If the file is invalid, the app lists every issue with its path (for example `firms[3].claims[12].category`) and renders no partial data.

**Claim IDs** are `<firm_id>-<first 6 hex chars of sha256(normalized text)>`. The text is normalized with NFKC, lowercased, stripped of all Unicode punctuation and symbols, with whitespace collapsed. The pipeline must use exactly the Python function in [IMPLEMENTATION_PLAN.md, Appendix A](IMPLEMENTATION_PLAN.md#appendix-a-claim-id-in-python-for-the-scraping-pipeline). The test vectors are in [src/lib/claimId.test.ts](src/lib/claimId.test.ts). The pipeline must also check that IDs are unique within each firm. The app treats IDs as opaque and never recomputes them.

## Deployment

- The GitHub repo is `websites-dashboard`. It's public, which free GitHub Pages requires. Vite's `base` is `/websites-dashboard/`.
- In **Settings → Pages**, set the source to **GitHub Actions**.
- [.github/workflows/deploy.yml](.github/workflows/deploy.yml) runs lint, typecheck, unit tests and Playwright on every push and pull request. On `main` it then builds and publishes `dist/` to Pages. It fails if `public/data/firms.enc` is missing.
- Hash routing (`#/firm/F001?claim=…`) means deep links work on Pages without a 404 workaround. A deep link survives the passcode gate.
- The live site is at `https://<owner>.github.io/websites-dashboard/`.

## Repository notes

- `ORBIS_Italia_allsectors.csv` (the firm list, 210 MB) and anything under `data/` are git-ignored and must never be committed.
- `count_websites.py` is a research helper that counts ORBIS firms with a website. It scans folders recursively, so run it with an explicit path, not from the repo root (where `node_modules/` exists).
- The demo data uses fictional firms on the reserved `.example` domain only.
