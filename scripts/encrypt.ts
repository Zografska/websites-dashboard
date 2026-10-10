// Encrypts the plaintext data file for publishing (IMPLEMENTATION_PLAN §9.1).
// Usage: npm run encrypt -- [--in data/firms.json] [--out public/data/firms.enc] [--iterations 600000] [--allow-weak]
// Never prints the passcode or the plaintext.
import { mkdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { createInterface } from 'node:readline'
import { Writable } from 'node:stream'
import { pathToFileURL } from 'node:url'
import { decryptToString, DEFAULT_ITERATIONS, encryptString } from '../src/lib/crypto'
import { parseDataFile } from '../src/lib/schema'

export type EncryptArgs = { in: string; out: string; iterations: number; allowWeak: boolean }

export function parseArgs(argv: string[]): EncryptArgs {
  const args: EncryptArgs = { in: 'data/firms.json', out: 'public/data/firms.enc', iterations: DEFAULT_ITERATIONS, allowWeak: false }
  for (let i = 0; i < argv.length; i++) {
    const flag = argv[i]
    const value = () => {
      const v = argv[++i]
      if (v === undefined) throw new Error(`${flag} needs a value`)
      return v
    }
    if (flag === '--in') args.in = value()
    else if (flag === '--out') args.out = value()
    else if (flag === '--iterations') args.iterations = Number(value())
    else if (flag === '--allow-weak') args.allowWeak = true
    else throw new Error(`unknown argument ${flag}`)
  }
  if (!Number.isInteger(args.iterations) || args.iterations < 100_000) throw new Error('--iterations must be an integer >= 100000')
  return args
}

/** At least 20 characters and at least 4 words (split on whitespace or `-`). */
export function isStrongPasscode(passcode: string): boolean {
  const words = passcode.split(/[\s-]+/).filter(Boolean)
  return passcode.length >= 20 && words.length >= 4
}

function promptHidden(question: string): Promise<string> {
  let muted = false
  const output = new Writable({
    write(chunk, _enc, cb) {
      if (!muted) process.stdout.write(chunk)
      cb()
    },
  })
  const rl = createInterface({ input: process.stdin, output, terminal: true })
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close()
      process.stdout.write('\n')
      resolve(answer)
    })
    muted = true
  })
}

async function getPasscode(): Promise<string> {
  const fromEnv = process.env.DASHBOARD_PASSCODE
  if (fromEnv) return fromEnv
  if (!process.stdin.isTTY) {
    throw new Error('No TTY for the passcode prompt. Run in a terminal or set DASHBOARD_PASSCODE.')
  }
  const first = await promptHidden('Passcode: ')
  const second = await promptHidden('Confirm passcode: ')
  if (first !== second) throw new Error('Passcodes do not match.')
  return first
}

async function main() {
  const args = parseArgs(process.argv.slice(2))

  const input = readFileSync(args.in, 'utf8')
  let json: unknown
  try {
    json = JSON.parse(input)
  } catch {
    throw new Error(`${args.in} is not valid JSON.`)
  }
  const parsed = parseDataFile(json)
  if (!parsed.ok) {
    console.error(`${args.in} failed validation:`)
    for (const issue of parsed.issues) console.error(`  ${issue.path}: ${issue.message}`)
    process.exit(1)
  }

  const passcode = await getPasscode()
  if (!isStrongPasscode(passcode) && !args.allowWeak) {
    throw new Error('Passcode too weak: use at least 20 characters and 4 words (or pass --allow-weak).')
  }

  const enc = await encryptString(input, passcode, { iterations: args.iterations })
  mkdirSync(path.dirname(path.resolve(args.out)), { recursive: true })
  writeFileSync(args.out, JSON.stringify(enc, null, 2) + '\n')

  const check = await decryptToString(JSON.parse(readFileSync(args.out, 'utf8')), passcode).catch(() => null)
  if (check !== input) {
    rmSync(args.out, { force: true })
    throw new Error('Verification failed: decrypting the output did not reproduce the input. Output deleted.')
  }

  const firms = parsed.data.firms.length
  const claims = parsed.data.firms.reduce((n, f) => n + f.claims.length, 0)
  const kb = Math.round(statSync(args.out).size / 1024)
  console.log(`Encrypted ${firms} firms, ${claims} claims → ${args.out} (${kb} KB)`)
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((err: unknown) => {
    console.error(err instanceof Error ? err.message : err)
    process.exit(1)
  })
}
