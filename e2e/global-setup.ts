// Builds the throwaway encrypted fixtures every spec serves via request interception (D18).
import { mkdirSync, writeFileSync } from 'node:fs'
import { encryptString } from '../src/lib/crypto'
import { generateFixtures, serialize } from '../scripts/generate-fixtures'
import { FIXTURE_ENC, FIXTURE_JSON, INVALID_ENC, TEST_PASSCODE, TEST_SUBJECT_ID, TMP_DIR, TRACKED_ENC, TRACKED_FIRM_ID } from './paths'

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

  // A per-firm file, as a treated firm would receive it.
  const firm = data.firms.find((f) => f.firm_id === TRACKED_FIRM_ID)!
  const tracked = { ...data, firms: [{ ...firm, subject_id: TEST_SUBJECT_ID, is_test: true }] }
  writeFileSync(TRACKED_ENC, JSON.stringify(await encryptString(JSON.stringify(tracked), TEST_PASSCODE)))
}
