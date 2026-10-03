import CryptoJS from 'crypto-js'
import { decryptConversation, encryptConversation } from '../security'

const VALID_KEY = '12345678901234567890123456789012'
const LEGACY_INSECURE_KEY = 'default-key-change-in-production'

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
    expect(encrypted.startsWith('v2:')).toBe(true)
    expect(decryptConversation(encrypted)).toBe(plaintext)
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

  it('round-trips in the v2 format with the primary key', () => {
    process.env.ENCRYPTION_KEY = VALID_KEY
    delete process.env.AI_ENCRYPTION_KEY

    const encrypted = encryptConversation('v2 content')

    expect(encrypted.startsWith('v2:')).toBe(true)
    expect(decryptConversation(encrypted)).toBe('v2 content')
  })

  it('decrypts unprefixed rows with the legacy default key only', () => {
    process.env.ENCRYPTION_KEY = VALID_KEY
    delete process.env.AI_ENCRYPTION_KEY

    const legacyCiphertext = CryptoJS.AES.encrypt(
      'legacy chat content',
      LEGACY_INSECURE_KEY
    ).toString()

    expect(legacyCiphertext.startsWith('v2:')).toBe(false)
    expect(decryptConversation(legacyCiphertext)).toBe('legacy chat content')
  })
})
