// Fails if plaintext data or the ORBIS CSV is tracked by git (IMPLEMENTATION_PLAN §3.2).
import { execFileSync } from 'node:child_process'

let files
try {
  files = execFileSync('git', ['ls-files', '-z'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] })
    .split('\0')
    .filter(Boolean)
} catch {
  console.warn('check-no-plaintext: not a git repository, skipping.')
  process.exit(0)
}

const bad = files.filter(
  (f) => f.startsWith('data/') || f.toLowerCase().endsWith('.csv') || (f.startsWith('public/') && f.toLowerCase().endsWith('.json')),
)
if (bad.length > 0) {
  console.error('check-no-plaintext: these tracked files must not be committed:')
  for (const f of bad) console.error(`  ${f}`)
  process.exit(1)
}
