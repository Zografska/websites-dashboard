import { describe, expect, it } from 'vitest'
import { claimHash, makeClaimId, normalizeClaimText } from './claimId'

// Test vectors from IMPLEMENTATION_PLAN §4.3 (checked against the Python in Appendix A).
const VECTORS: [string, string, string][] = [
  ['Packaging 100% sostenibile', 'packaging 100 sostenibile', '91ba7d'],
  ['  PACKAGING   100 % sostenibile! ', 'packaging 100 sostenibile', '91ba7d'],
  ['«Benessere animale garantito»', 'benessere animale garantito', '79969e'],
  ['-30% di emissioni di CO₂ rispetto al 2020', '30 di emissioni di co2 rispetto al 2020', 'f95687'],
  ['Certificato FSC®', 'certificato fsc', 'f35c4c'],
]

describe('claimId', () => {
  it.each(VECTORS)('%j', async (input, normalized, hash) => {
    expect(normalizeClaimText(input)).toBe(normalized)
    expect(await claimHash(input)).toBe(hash)
    expect(await makeClaimId('F017', input)).toBe(`F017-${hash}`)
  })
})
