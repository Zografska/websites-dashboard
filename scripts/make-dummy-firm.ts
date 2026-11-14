// Writes the dummy firm used for sanity checks: id FDUMMY, passphrase "sanity-check".
// Its data is the fictional demo firm F001 under another name, without its "future" claims,
// so that one area is green (no signal) next to the red and yellow ones. The passphrase is deliberately
// simple and public: the firm holds no real data. Never use this passphrase for a real firm.
// Usage: npm run dummy-firm -- [--out data/firms_enc]
import { mkdirSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { decryptToString, encryptStringGz } from '../src/lib/crypto'
import { generateFixtures } from './generate-fixtures'
import { areaOf } from '../src/lib/areas'
import type { DataFile, Firm } from '../src/lib/types'

export const DUMMY_ID = 'FDUMMY'
export const DUMMY_PASSPHRASE = 'sanity-check'

/** The fictional F001 renamed FDUMMY; claim ids keep their hash suffix under the new prefix. */
export function dummyFirm(source: Firm): Firm {
  const renamed = JSON.parse(JSON.stringify(source).replaceAll(source.firm_id, DUMMY_ID)) as Firm
  return {
    ...renamed,
    claims: renamed.claims.filter((c) => areaOf(c.category) !== 'future'),
    firm_name: 'Dummy S.r.l. (sanity check)',
    // Marks it as a test subject, so any engagement events are excluded from the analysis.
    subject_id: 'dummysanity0001',
    is_test: true,
  }
}

async function main() {
  const args = process.argv.slice(2)
  const outIdx = args.indexOf('--out')
  const out = outIdx >= 0 ? args[outIdx + 1] : 'data/firms_enc'
  if (!out) throw new Error('--out needs a path')
  const data = await generateFixtures()
  const source = data.firms.find((f) => f.firm_id === 'F001')
  if (!source) throw new Error('F001 missing from the fixtures')
  const file: DataFile = { ...data, firms: [dummyFirm(source)] }
  const enc = await encryptStringGz(JSON.stringify(file), DUMMY_PASSPHRASE)
  mkdirSync(out, { recursive: true })
  const target = path.join(out, `${DUMMY_ID}.enc`)
  writeFileSync(target, JSON.stringify(enc))
  const back = JSON.parse(await decryptToString(enc, DUMMY_PASSPHRASE)) as DataFile
  if (back.firms.length !== 1 || back.firms[0].firm_id !== DUMMY_ID) throw new Error('verification failed')
  console.log(`Wrote ${target} (${back.firms[0].claims.length} claims)`)
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((err: unknown) => {
    console.error(err instanceof Error ? err.message : err)
    process.exit(1)
  })
}
