// @vitest-environment node
import { readdirSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

// Dark mode follows prefers-color-scheme only (IMPLEMENTATION_PLAN §2.3): no `.dark` class anywhere in src/.
function sourceFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(dir, e.name)
    if (e.isDirectory()) return sourceFiles(p)
    return /\.(ts|tsx|css)$/.test(e.name) ? [p] : []
  })
}

describe('no .dark class', () => {
  it('does not appear in src/**/*.{ts,tsx,css}', () => {
    const srcDir = path.resolve(import.meta.dirname)
    const self = path.resolve(import.meta.filename)
    const offenders = sourceFiles(srcDir)
      .filter((f) => f !== self)
      .filter((f) => /\.dark\b/.test(readFileSync(f, 'utf8')))
    expect(offenders).toEqual([])
  })
})
