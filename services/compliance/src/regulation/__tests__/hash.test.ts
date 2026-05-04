import { sha256Hex } from '../hash'

describe('sha256Hex', () => {
  it('returns stable hex for same input', () => {
    expect(sha256Hex('hello')).toBe(sha256Hex('hello'))
    expect(sha256Hex('hello')).not.toBe(sha256Hex('world'))
  })
})
