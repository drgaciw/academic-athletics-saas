import CryptoJS from 'crypto-js'
import { decryptConversation, encryptConversation } from '../security'

const VALID_KEY = '12345678901234567890123456789012'
const LEGACY_INSECURE_KEY = 'default-key-change-in-production'

/** Wrong-key decrypts can throw in CryptoJS; normalise to '' like the implementation does. */
function decryptWithKeyOrEmpty(encrypted: string, key: string): string {
  try {
    return CryptoJS.AES.decrypt(encrypted, key).toString(CryptoJS.enc.Utf8)
  } catch {
    return ''
  }
}

describe('conversation encryption key binding', () => {
  const originalEncryptionKey = process.env.ENCRYPTION_KEY
  const originalAiEncryptionKey = process.env.AI_ENCRYPTION_KEY

  afterEach(() => {
    if (originalEncryptionKey === undefined) {
      delete process.env.ENCRYPTION_KEY
    } else {
      process.env.ENCRYPTION_KEY = originalEncryptionKey
    }

    if (originalAiEncryptionKey === undefined) {
      delete process.env.AI_ENCRYPTION_KEY
    } else {
      process.env.AI_ENCRYPTION_KEY = originalAiEncryptionKey
    }
  })

  it('round-trips with validated ENCRYPTION_KEY and ignores AI_ENCRYPTION_KEY default', () => {
    process.env.ENCRYPTION_KEY = VALID_KEY
    process.env.AI_ENCRYPTION_KEY = LEGACY_INSECURE_KEY

    const plaintext = 'student asked about GPA eligibility'
    const encrypted = encryptConversation(plaintext)

    expect(encrypted).not.toEqual(plaintext)
    expect(decryptConversation(encrypted)).toBe(plaintext)

    // Ciphertext must not be readable with the public default passphrase.
    // (Unauthenticated AES can yield '' or a few garbage bytes for a wrong key,
    // so assert "not the plaintext" rather than a specific empty value.)
    expect(decryptWithKeyOrEmpty(encrypted, LEGACY_INSECURE_KEY)).not.toBe(plaintext)
  })

  it('treats a wrong-key decrypt as a controlled miss (never throws) across many ciphertexts', () => {
    process.env.ENCRYPTION_KEY = VALID_KEY
    delete process.env.AI_ENCRYPTION_KEY

    // Encryption salts are random, so a wrong key sometimes makes CryptoJS throw
    // "Malformed UTF-8 data" (and occasionally yields a few garbage bytes) instead
    // of returning ''. Exercise enough ciphertexts to hit the throwing path on
    // every run and prove decryptConversation stays controlled: it never throws
    // and never surfaces the real plaintext.
    for (let i = 0; i < 200; i++) {
      const plaintext = `message-${i}`
      const sealedWithOtherKey = CryptoJS.AES.encrypt(
        plaintext,
        `wrong-key-${i}-abcdefghijklmnopqrstuvwxyz`
      ).toString()
      let result = ''
      expect(() => {
        result = decryptConversation(sealedWithOtherKey)
      }).not.toThrow()
      expect(typeof result).toBe('string')
      expect(result).not.toBe(plaintext)
    }
  })

  it('returns an empty string for malformed ciphertext input', () => {
    process.env.ENCRYPTION_KEY = VALID_KEY
    delete process.env.AI_ENCRYPTION_KEY

    expect(decryptConversation('not-a-real-ciphertext')).toBe('')
    expect(decryptConversation('')).toBe('')
  })

  it('throws when ENCRYPTION_KEY is missing and AI_ENCRYPTION_KEY is unset', () => {
    delete process.env.ENCRYPTION_KEY
    delete process.env.AI_ENCRYPTION_KEY

    expect(() => encryptConversation('secret')).toThrow(/ENCRYPTION_KEY is required/)
  })

  it('rejects the legacy insecure AI_ENCRYPTION_KEY default as the only key', () => {
    delete process.env.ENCRYPTION_KEY
    process.env.AI_ENCRYPTION_KEY = LEGACY_INSECURE_KEY

    expect(() => encryptConversation('secret')).toThrow(/ENCRYPTION_KEY is required/)
  })

  it('accepts a non-default AI_ENCRYPTION_KEY alias when ENCRYPTION_KEY is unset', () => {
    delete process.env.ENCRYPTION_KEY
    process.env.AI_ENCRYPTION_KEY = 'legacy-alias-key-not-the-default!!'

    const encrypted = encryptConversation('alias-ok')
    expect(decryptConversation(encrypted)).toBe('alias-ok')
  })

  it('decrypts rows previously sealed with the hard-coded default key', () => {
    process.env.ENCRYPTION_KEY = VALID_KEY
    delete process.env.AI_ENCRYPTION_KEY

    const legacyCiphertext = CryptoJS.AES.encrypt(
      'legacy chat content',
      LEGACY_INSECURE_KEY
    ).toString()

    expect(decryptConversation(legacyCiphertext)).toBe('legacy chat content')
  })
})
