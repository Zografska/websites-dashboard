import path from 'node:path'

export const TEST_PASSCODE = 'correct horse battery staple e2e'
export const TMP_DIR = path.resolve(import.meta.dirname, '.tmp')
export const FIXTURE_JSON = path.join(TMP_DIR, 'firms.json')
export const FIXTURE_ENC = path.join(TMP_DIR, 'firms.enc')
export const INVALID_ENC = path.join(TMP_DIR, 'invalid.enc')
/** One firm with a `subject_id`: the per-firm file that engagement tracking needs. */
export const TRACKED_ENC = path.join(TMP_DIR, 'tracked.enc')
export const TRACKED_FIRM_ID = 'F001'
export const TEST_SUBJECT_ID = 'E2ESUBJECT23'
