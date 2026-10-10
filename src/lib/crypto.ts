// Shared by the browser and scripts/encrypt.ts. Web Crypto only: no Buffer.
import { z } from 'zod'

export type EncFile = {
  v: 1
  kdf: 'PBKDF2-SHA256'
  iterations: number
  salt: string
  iv: string
  ciphertext: string
}

export const EncFileSchema: z.ZodType<EncFile> = z.object({
  v: z.literal(1),
  kdf: z.literal('PBKDF2-SHA256'),
  iterations: z.number().int().min(100_000),
  salt: z.string().min(1),
  iv: z.string().min(1),
  ciphertext: z.string().min(1),
})

export const DEFAULT_ITERATIONS = 600_000

export class WrongPasscodeError extends Error {
  constructor(message = 'Incorrect passcode') {
    super(message)
    this.name = 'WrongPasscodeError'
  }
}

const CHUNK = 0x8000

export function bytesToBase64(bytes: Uint8Array): string {
  let bin = ''
  for (let i = 0; i < bytes.length; i += CHUNK) {
    bin += String.fromCharCode(...bytes.subarray(i, i + CHUNK))
  }
  return btoa(bin)
}

export function base64ToBytes(b64: string): Uint8Array<ArrayBuffer> {
  const bin = atob(b64)
  const out = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i)
  return out
}

async function deriveKey(passcode: string, salt: Uint8Array<ArrayBuffer>, iterations: number): Promise<CryptoKey> {
  const subtle = globalThis.crypto.subtle
  const material = await subtle.importKey('raw', new TextEncoder().encode(passcode.normalize('NFC')), 'PBKDF2', false, [
    'deriveKey',
  ])
  return subtle.deriveKey(
    { name: 'PBKDF2', hash: 'SHA-256', salt, iterations },
    material,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  )
}

export async function encryptString(
  plaintext: string,
  passcode: string,
  opts?: { iterations?: number },
): Promise<EncFile> {
  const iterations = opts?.iterations ?? DEFAULT_ITERATIONS
  const salt = globalThis.crypto.getRandomValues(new Uint8Array(16))
  const iv = globalThis.crypto.getRandomValues(new Uint8Array(12))
  const key = await deriveKey(passcode, salt, iterations)
  const ct = await globalThis.crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, new TextEncoder().encode(plaintext))
  return {
    v: 1,
    kdf: 'PBKDF2-SHA256',
    iterations,
    salt: bytesToBase64(salt),
    iv: bytesToBase64(iv),
    ciphertext: bytesToBase64(new Uint8Array(ct)),
  }
}

/** Throws WrongPasscodeError when GCM authentication fails (wrong passcode or tampered data). */
export async function decryptToString(enc: EncFile, passcode: string): Promise<string> {
  const key = await deriveKey(passcode, base64ToBytes(enc.salt), enc.iterations)
  let pt: ArrayBuffer
  try {
    pt = await globalThis.crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: base64ToBytes(enc.iv) },
      key,
      base64ToBytes(enc.ciphertext),
    )
  } catch {
    throw new WrongPasscodeError()
  }
  return new TextDecoder().decode(pt)
}
