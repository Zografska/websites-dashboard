// Claim ID contract shared with the scraping pipeline (IMPLEMENTATION_PLAN §4.3, Appendix A).
// The app never recomputes IDs from real data; it treats them as opaque.

export function normalizeClaimText(text: string): string {
  return text
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[\p{P}\p{S}]/gu, '') // strip all Unicode punctuation and symbols (incl. « » % ® € -)
    .replace(/\s+/gu, ' ')
    .trim()
}

/** sha256(UTF-8(normalizeClaimText(text))) → hex → first 6 chars */
export async function claimHash(text: string): Promise<string> {
  const digest = await globalThis.crypto.subtle.digest('SHA-256', new TextEncoder().encode(normalizeClaimText(text)))
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, '0'))
    .join('')
    .slice(0, 6)
}

export async function makeClaimId(firmId: string, text: string): Promise<string> {
  return `${firmId}-${await claimHash(text)}`
}
