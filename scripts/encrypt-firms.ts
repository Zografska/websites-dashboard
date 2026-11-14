// Per-firm encryption: one gzipped, encrypted file per firm, each opened with that firm's own passphrase.
// Usage: npm run encrypt:firms -- --in firms.json --passphrases analytics_exports/firm_passphrases.csv \
//          [--out data/firms_enc] [--iterations 600000] [--concurrency 8] [--only F00126,F00127] [--verify 200]
// Writes <out>/<firm_id>.enc. Never prints a passphrase or any plaintext.
// The key derivation is the slow part (600k PBKDF2 rounds per file), so files are made in parallel.
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { decryptToString, DEFAULT_ITERATIONS, encryptStringGz } from '../src/lib/crypto'
import { parseDataFile } from '../src/lib/schema'
import type { DataFile, Firm } from '../src/lib/types'

export type Args = { in: string; passphrases: string; out: string; iterations: number; concurrency: number; only: string[] | null; verify: number }

export function parseArgs(argv: string[]): Args {
  const args: Args = { in: '', passphrases: '', out: 'data/firms_enc', iterations: DEFAULT_ITERATIONS, concurrency: 8, only: null, verify: 200 }
  for (let i = 0; i < argv.length; i++) {
    const flag = argv[i]
    const value = () => {
      const v = argv[++i]
      if (v === undefined) throw new Error(`${flag} needs a value`)
      return v
    }
    if (flag === '--in') args.in = value()
    else if (flag === '--passphrases') args.passphrases = value()
    else if (flag === '--out') args.out = value()
    else if (flag === '--iterations') args.iterations = Number(value())
    else if (flag === '--concurrency') args.concurrency = Number(value())
    else if (flag === '--only') args.only = value().split(',').filter(Boolean)
    else if (flag === '--verify') args.verify = Number(value())
    else throw new Error(`unknown argument ${flag}`)
  }
  if (!args.in || !args.passphrases) throw new Error('--in and --passphrases are required')
  if (!Number.isInteger(args.iterations) || args.iterations < 100_000) throw new Error('--iterations must be an integer >= 100000')
  if (!Number.isInteger(args.concurrency) || args.concurrency < 1) throw new Error('--concurrency must be a positive integer')
  return args
}

/** `firm_id,passphrase` rows (header optional) → firm_id → passphrase. */
export function parsePassphrases(csv: string): Map<string, string> {
  const map = new Map<string, string>()
  for (const line of csv.split(/\r?\n/)) {
    const [id, pass] = line.split(',')
    if (!id || !pass || id === 'firm_id') continue
    if (map.has(id)) throw new Error(`duplicate firm_id ${id} in the passphrase file`)
    map.set(id, pass.trim())
  }
  return map
}

/** The data file a single firm receives: its own record only, same envelope. */
export function firmFile(data: DataFile, firm: Firm): DataFile {
  return { schema_version: data.schema_version, generated_at: data.generated_at, categories: data.categories, firms: [firm] }
}

async function pool<T>(items: T[], size: number, fn: (item: T, index: number) => Promise<void>) {
  let next = 0
  await Promise.all(
    Array.from({ length: Math.min(size, items.length) }, async () => {
      while (next < items.length) {
        const i = next++
        await fn(items[i], i)
      }
    }),
  )
}

async function main() {
  const args = parseArgs(process.argv.slice(2))
  const json: unknown = JSON.parse(readFileSync(args.in, 'utf8'))
  const parsed = parseDataFile(json)
  if (!parsed.ok) {
    console.error(`${args.in} failed validation:`)
    for (const issue of parsed.issues.slice(0, 20)) console.error(`  ${issue.path}: ${issue.message}`)
    process.exit(1)
  }
  const passphrases = parsePassphrases(readFileSync(args.passphrases, 'utf8'))
  const firms = parsed.data.firms.filter((f) => args.only === null || args.only.includes(f.firm_id))
  if (args.only !== null && firms.length !== args.only.length) throw new Error('--only names a firm that is not in the data file')
  const missing = firms.filter((f) => !passphrases.has(f.firm_id)).map((f) => f.firm_id)
  if (missing.length > 0) throw new Error(`no passphrase for ${missing.length} firms, e.g. ${missing.slice(0, 3).join(', ')}`)
  // Passphrases must be distinct, or one firm's passphrase would open another's file.
  const used = new Set(firms.map((f) => passphrases.get(f.firm_id)!))
  if (used.size !== firms.length) throw new Error('two firms share a passphrase')

  mkdirSync(args.out, { recursive: true })
  const started = Date.now()
  let done = 0
  await pool(firms, args.concurrency, async (firm) => {
    const text = JSON.stringify(firmFile(parsed.data, firm))
    const enc = await encryptStringGz(text, passphrases.get(firm.firm_id)!, { iterations: args.iterations })
    writeFileSync(path.join(args.out, `${firm.firm_id}.enc`), JSON.stringify(enc))
    done++
    if (done % 500 === 0 || done === firms.length) {
      const rate = done / ((Date.now() - started) / 1000)
      console.log(`${done}/${firms.length} files (${rate.toFixed(1)}/s)`)
    }
  })

  // Spot check: each sampled file opens with its own passphrase and holds exactly its own firm.
  const step = Math.max(1, Math.floor(firms.length / Math.max(1, args.verify)))
  const sample = firms.filter((_, i) => i % step === 0)
  for (const firm of sample) {
    const enc = JSON.parse(readFileSync(path.join(args.out, `${firm.firm_id}.enc`), 'utf8'))
    const back = JSON.parse(await decryptToString(enc, passphrases.get(firm.firm_id)!)) as DataFile
    if (back.firms.length !== 1 || back.firms[0].firm_id !== firm.firm_id) throw new Error(`verification failed for ${firm.firm_id}`)
  }
  console.log(`Encrypted ${firms.length} firms → ${args.out}/ (${sample.length} spot-checked)`)
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((err: unknown) => {
    console.error(err instanceof Error ? err.message : err)
    process.exit(1)
  })
}
