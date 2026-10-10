// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { base64ToBytes, bytesToBase64, decryptToString, EncFileSchema, encryptString, WrongPasscodeError } from './crypto'

const opts = { iterations: 1000 }
const PASS = 'correct horse battery staple'

describe('crypto', () => {
  it('round-trips, including non-ASCII text', async () => {
    const text = JSON.stringify({ claim: '«Packaging 100% sostenibile» — CO₂' })
    const enc = await encryptString(text, PASS, opts)
    expect(await decryptToString(enc, PASS)).toBe(text)
  })

  it('throws WrongPasscodeError for a wrong passcode', async () => {
    const enc = await encryptString('secret', PASS, opts)
    await expect(decryptToString(enc, 'wrong passcode')).rejects.toBeInstanceOf(WrongPasscodeError)
  })

  it('throws on tampered ciphertext', async () => {
    const enc = await encryptString('secret data', PASS, opts)
    const bytes = base64ToBytes(enc.ciphertext)
    bytes[0] ^= 0xff
    await expect(decryptToString({ ...enc, ciphertext: bytesToBase64(bytes) }, PASS)).rejects.toBeInstanceOf(WrongPasscodeError)
  })

  it('treats NFC and NFD forms of the passcode as equal', async () => {
    const nfc = 'perché città così'.normalize('NFC')
    const nfd = nfc.normalize('NFD')
    expect(nfc).not.toBe(nfd)
    const enc = await encryptString('ok', nfc, opts)
    expect(await decryptToString(enc, nfd)).toBe('ok')
    const enc2 = await encryptString('ok', nfd, opts)
    expect(await decryptToString(enc2, nfc)).toBe('ok')
  })

  it('uses a fresh salt and IV each time', async () => {
    const a = await encryptString('same', PASS, opts)
    const b = await encryptString('same', PASS, opts)
    expect(a.salt).not.toBe(b.salt)
    expect(a.iv).not.toBe(b.iv)
    expect(base64ToBytes(a.salt)).toHaveLength(16)
    expect(base64ToBytes(a.iv)).toHaveLength(12)
  })

  it('produces output that passes EncFileSchema (default iterations)', async () => {
    const enc = await encryptString('x', PASS)
    expect(enc.iterations).toBe(600_000)
    expect(EncFileSchema.safeParse(enc).success).toBe(true)
    expect(EncFileSchema.safeParse({ ...enc, iterations: 1000 }).success).toBe(false)
    expect(EncFileSchema.safeParse({ ...enc, v: 2 }).success).toBe(false)
  })

  it('base64 handles buffers larger than the chunk size', () => {
    const big = new Uint8Array(200_000).map((_, i) => i % 256)
    expect(base64ToBytes(bytesToBase64(big))).toEqual(big)
  })
})
