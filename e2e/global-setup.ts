// Builds the throwaway encrypted fixtures every spec serves via request interception (D18).
import { mkdirSync, writeFileSync } from 'node:fs'
import { encryptString } from '../src/lib/crypto'
import { generateFixtures, serialize } from '../scripts/generate-fixtures'
import { FIXTURE_ENC, FIXTURE_JSON, INVALID_ENC, TEST_PASSCODE, TMP_DIR } from './paths'

export default async function globalSetup() {
  mkdirSync(TMP_DIR, { recursive: true })
  const data = await generateFixtures()
  const json = serialize(data)
  writeFileSync(FIXTURE_JSON, json)
  writeFileSync(FIXTURE_ENC, JSON.stringify(await encryptString(json, TEST_PASSCODE)))

  // A structurally invalid file, to exercise the validation error screen.
  const invalid = structuredClone(data)
  invalid.firms[2].claims[0].category = 'not_a_category'
  writeFileSync(INVALID_ENC, JSON.stringify(await encryptString(JSON.stringify(invalid), TEST_PASSCODE)))
}
