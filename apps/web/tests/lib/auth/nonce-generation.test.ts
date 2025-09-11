import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { generateNonce, hashNonce, createGoogleConfig, getGoogleClientId } from '../../../lib/auth/google-config'

// Mock crypto for testing
const mockCrypto = {
  getRandomValues: vi.fn(),
  subtle: {
    digest: vi.fn()
  }
}

Object.defineProperty(global, 'crypto', {
  value: mockCrypto,
  writable: true
})

// Mock environment variables
const originalEnv = process.env

beforeEach(() => {
  vi.clearAllMocks()
  process.env = { ...originalEnv }
  process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID = 'test-google-client-id'
})

afterEach(() => {
  process.env = originalEnv
  vi.clearAllMocks()
})

describe('Nonce Generation and Credential Handling', () => {
  describe('generateNonce', () => {
    it('generates a unique nonce each time', () => {
      const mockArray1 = new Uint8Array([0x12, 0x34, 0x56, 0x78, 0x9a, 0xbc, 0xde, 0xf0])
      const mockArray2 = new Uint8Array([0xa1, 0xb2, 0xc3, 0xd4, 0xe5, 0xf6, 0x07, 0x18])
      
      mockCrypto.getRandomValues
        .mockReturnValueOnce(mockArray1)
        .mockReturnValueOnce(mockArray2)

      const nonce1 = generateNonce()
      const nonce2 = generateNonce()
      
      expect(nonce1).not.toBe(nonce2)
      expect(nonce1).toBeDefined()
      expect(nonce2).toBeDefined()
      expect(typeof nonce1).toBe('string')
      expect(typeof nonce2).toBe('string')
    })

    it('generates nonce with correct format', () => {
      const mockArray = new Uint8Array(32).fill(0).map((_, i) => i % 256)
      mockCrypto.getRandomValues.mockReturnValue(mockArray)

      const nonce = generateNonce()
      
      expect(nonce).toMatch(/^[a-f0-9]{64}$/) // 32 bytes = 64 hex chars
      expect(nonce.length).toBe(64)
    })

    it('uses crypto.getRandomValues for secure randomness', () => {
      const mockArray = new Uint8Array(32)
      mockCrypto.getRandomValues.mockReturnValue(mockArray)

      generateNonce()
      
      expect(mockCrypto.getRandomValues).toHaveBeenCalledWith(expect.any(Uint8Array))
      expect(mockCrypto.getRandomValues.mock.calls[0][0]).toHaveLength(32)
    })

    it('handles different random values correctly', () => {
      const testCases = [
        new Uint8Array([0x00, 0xff, 0x0f, 0xf0]),
        new Uint8Array([0xaa, 0xbb, 0xcc, 0xdd]),
        new Uint8Array([0x12, 0x34, 0x56, 0x78])
      ]

      testCases.forEach((mockArray, index) => {
        mockCrypto.getRandomValues.mockReturnValueOnce(mockArray)
        const nonce = generateNonce()
        
        expect(nonce).toBeDefined()
        expect(typeof nonce).toBe('string')
        expect(nonce.length).toBeGreaterThan(0)
      })
    })
  })

  describe('hashNonce', () => {
    it('hashes nonce using SHA-256', async () => {
      const testNonce = 'test-nonce-123'
      const mockHashBuffer = new ArrayBuffer(32)
      const mockHashArray = new Uint8Array(mockHashBuffer)
      mockHashArray.fill(0x42) // Fill with test data

      mockCrypto.subtle.digest.mockResolvedValue(mockHashBuffer)

      const hashedNonce = await hashNonce(testNonce)
      
      expect(mockCrypto.subtle.digest).toHaveBeenCalledWith('SHA-256', expect.any(Uint8Array))
      expect(typeof hashedNonce).toBe('string')
      expect(hashedNonce).toMatch(/^[a-f0-9]{64}$/) // 32 bytes = 64 hex chars
    })

    it('produces consistent hashes for same input', async () => {
      const testNonce = 'consistent-test-nonce'
      const mockHashBuffer = new ArrayBuffer(32)
      const mockHashArray = new Uint8Array(mockHashBuffer)
      mockHashArray.fill(0x55)

      mockCrypto.subtle.digest.mockResolvedValue(mockHashBuffer)

      const hash1 = await hashNonce(testNonce)
      
      // Reset mock to return same value
      mockCrypto.subtle.digest.mockResolvedValue(mockHashBuffer)
      const hash2 = await hashNonce(testNonce)
      
      expect(hash1).toBe(hash2)
    })

    it('produces different hashes for different inputs', async () => {
      const mockHashBuffer1 = new ArrayBuffer(32)
      const mockHashArray1 = new Uint8Array(mockHashBuffer1)
      mockHashArray1.fill(0x11)

      const mockHashBuffer2 = new ArrayBuffer(32)
      const mockHashArray2 = new Uint8Array(mockHashBuffer2)
      mockHashArray2.fill(0x22)

      mockCrypto.subtle.digest
        .mockResolvedValueOnce(mockHashBuffer1)
        .mockResolvedValueOnce(mockHashBuffer2)

      const hash1 = await hashNonce('nonce1')
      const hash2 = await hashNonce('nonce2')
      
      expect(hash1).not.toBe(hash2)
    })

    it('handles empty nonce input', async () => {
      const mockHashBuffer = new ArrayBuffer(32)
      mockCrypto.subtle.digest.mockResolvedValue(mockHashBuffer)

      const hashedNonce = await hashNonce('')
      
      expect(typeof hashedNonce).toBe('string')
      expect(mockCrypto.subtle.digest).toHaveBeenCalledWith('SHA-256', expect.any(Uint8Array))
    })

    it('handles special characters in nonce', async () => {
      const specialNonce = 'nonce-with-special-chars-!@#$%^&*()'
      const mockHashBuffer = new ArrayBuffer(32)
      mockCrypto.subtle.digest.mockResolvedValue(mockHashBuffer)

      const hashedNonce = await hashNonce(specialNonce)
      
      expect(typeof hashedNonce).toBe('string')
      expect(hashedNonce.length).toBe(64)
    })
  })

  describe('getGoogleClientId', () => {
    it('returns client ID from environment variable', () => {
      const testClientId = 'test-google-client-id-12345'
      process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID = testClientId

      const clientId = getGoogleClientId()
      
      expect(clientId).toBe(testClientId)
    })

    it('throws error when client ID is not set', () => {
      delete process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID

      expect(() => {
        getGoogleClientId()
      }).toThrow('NEXT_PUBLIC_GOOGLE_CLIENT_ID environment variable is not set')
    })

    it('throws error when client ID is empty string', () => {
      process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID = ''

      expect(() => {
        getGoogleClientId()
      }).toThrow('NEXT_PUBLIC_GOOGLE_CLIENT_ID environment variable is not set')
    })

    it('handles whitespace-only client ID', () => {
      process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID = '   '

      const clientId = getGoogleClientId()
      
      expect(clientId).toBe('   ') // Should return as-is, validation is caller's responsibility
    })
  })

  describe('createGoogleConfig', () => {
    it('creates config with generated nonce when none provided', async () => {
      const mockArray = new Uint8Array(32).fill(0x42)
      const mockHashBuffer = new ArrayBuffer(32)
      const mockHashArray = new Uint8Array(mockHashBuffer)
      mockHashArray.fill(0x84)
      
      mockCrypto.getRandomValues.mockReturnValue(mockArray)
      mockCrypto.subtle.digest.mockResolvedValue(mockHashBuffer)
      
      const mockCallback = vi.fn()
      const config = await createGoogleConfig(mockCallback)
      
      expect(config.client_id).toBe('test-google-client-id')
      expect(config.callback).toBe(mockCallback)
      expect(config.nonce).toBeDefined()
      expect(typeof config.nonce).toBe('string')
      expect(config.nonce!.length).toBe(64)
    })

    it('uses provided nonce when given', async () => {
      const mockCallback = vi.fn()
      const providedNonce = 'custom-nonce-12345'
      
      const config = await createGoogleConfig(mockCallback, providedNonce)
      
      expect(config.nonce).toBe(providedNonce)
      expect(config.callback).toBe(mockCallback)
      expect(config.client_id).toBe('test-google-client-id')
    })

    it('creates config with all required Google properties', async () => {
      const mockArray = new Uint8Array(32)
      const mockHashBuffer = new ArrayBuffer(32)
      
      mockCrypto.getRandomValues.mockReturnValue(mockArray)
      mockCrypto.subtle.digest.mockResolvedValue(mockHashBuffer)
      
      const mockCallback = vi.fn()
      const config = await createGoogleConfig(mockCallback)
      
      expect(config).toEqual({
        client_id: 'test-google-client-id',
        callback: mockCallback,
        auto_select: false,
        cancel_on_tap_outside: true,
        context: 'signin',
        nonce: expect.any(String),
        use_fedcm_for_prompt: true
      })
    })

    it('handles missing environment variable', async () => {
      delete process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID
      
      const mockCallback = vi.fn()
      
      await expect(
        createGoogleConfig(mockCallback)
      ).rejects.toThrow('NEXT_PUBLIC_GOOGLE_CLIENT_ID environment variable is not set')
    })

    it('creates unique nonces for multiple configs', async () => {
      const mockArray1 = new Uint8Array(32).fill(0x11)
      const mockArray2 = new Uint8Array(32).fill(0x22)
      
      const mockHashBuffer1 = new ArrayBuffer(32)
      const mockHashArray1 = new Uint8Array(mockHashBuffer1)
      mockHashArray1.fill(0x33)
      
      const mockHashBuffer2 = new ArrayBuffer(32)
      const mockHashArray2 = new Uint8Array(mockHashBuffer2)
      mockHashArray2.fill(0x44)
      
      mockCrypto.getRandomValues
        .mockReturnValueOnce(mockArray1)
        .mockReturnValueOnce(mockArray2)
      
      mockCrypto.subtle.digest
        .mockResolvedValueOnce(mockHashBuffer1)
        .mockResolvedValueOnce(mockHashBuffer2)
      
      const mockCallback1 = vi.fn()
      const mockCallback2 = vi.fn()
      
      const config1 = await createGoogleConfig(mockCallback1)
      const config2 = await createGoogleConfig(mockCallback2)
      
      expect(config1.nonce).not.toBe(config2.nonce)
      expect(config1.callback).toBe(mockCallback1)
      expect(config2.callback).toBe(mockCallback2)
    })
  })

  describe('Credential Handling Integration', () => {
    it('maintains nonce consistency throughout authentication flow', async () => {
      const mockArray = new Uint8Array(32).fill(0x55)
      const mockHashBuffer = new ArrayBuffer(32)
      const mockHashArray = new Uint8Array(mockHashBuffer)
      mockHashArray.fill(0xaa)
      
      mockCrypto.getRandomValues.mockReturnValue(mockArray)
      mockCrypto.subtle.digest.mockResolvedValue(mockHashBuffer)
      
      const mockCallback = vi.fn()
      const config = await createGoogleConfig(mockCallback)
      
      // Simulate callback being called with credential
      const mockCredentialResponse = {
        credential: 'mock-jwt-token'
      }
      
      config.callback(mockCredentialResponse)
      
      expect(mockCallback).toHaveBeenCalledWith(mockCredentialResponse)
      expect(config.nonce).toBeDefined()
    })

    it('validates nonce format for Google requirements', async () => {
      const mockArray = new Uint8Array(32)
      const mockHashBuffer = new ArrayBuffer(32)
      
      mockCrypto.getRandomValues.mockReturnValue(mockArray)
      mockCrypto.subtle.digest.mockResolvedValue(mockHashBuffer)
      
      const mockCallback = vi.fn()
      const config = await createGoogleConfig(mockCallback)
      
      // Google expects base64url encoded nonce, but we're using hex
      // This test ensures our format is consistent
      expect(config.nonce).toMatch(/^[a-f0-9]+$/)
      expect(config.nonce!.length).toBe(64) // 32 bytes as hex
    })

    it('handles nonce in production-like scenarios', async () => {
      // Simulate production environment
      process.env.NODE_ENV = 'production'
      process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID = 'prod-google-client-id.googleusercontent.com'
      
      const mockArray = new Uint8Array(32)
      // Fill with realistic random data
      mockArray.forEach((_, i) => mockArray[i] = Math.floor(Math.random() * 256))
      
      const mockHashBuffer = new ArrayBuffer(32)
      const mockHashArray = new Uint8Array(mockHashBuffer)
      mockHashArray.forEach((_, i) => mockHashArray[i] = Math.floor(Math.random() * 256))
      
      mockCrypto.getRandomValues.mockReturnValue(mockArray)
      mockCrypto.subtle.digest.mockResolvedValue(mockHashBuffer)
      
      const mockCallback = vi.fn()
      const config = await createGoogleConfig(mockCallback)
      
      expect(config.client_id).toBe('prod-google-client-id.googleusercontent.com')
      expect(config.nonce).toBeDefined()
      expect(config.use_fedcm_for_prompt).toBe(true)
    })
  })

  describe('Security Considerations', () => {
    it('uses cryptographically secure random number generation', () => {
      const mockArray = new Uint8Array(32)
      mockCrypto.getRandomValues.mockReturnValue(mockArray)
      
      generateNonce()
      
      expect(mockCrypto.getRandomValues).toHaveBeenCalledWith(expect.any(Uint8Array))
      // Verify we're using a sufficient length for security
      expect(mockCrypto.getRandomValues.mock.calls[0][0].length).toBe(32)
    })

    it('uses SHA-256 for nonce hashing', async () => {
      const mockHashBuffer = new ArrayBuffer(32)
      mockCrypto.subtle.digest.mockResolvedValue(mockHashBuffer)
      
      await hashNonce('test-nonce')
      
      expect(mockCrypto.subtle.digest).toHaveBeenCalledWith('SHA-256', expect.any(Uint8Array))
    })

    it('prevents nonce reuse across sessions', async () => {
      const mockArray1 = new Uint8Array(32).fill(0x11)
      const mockArray2 = new Uint8Array(32).fill(0x22)
      
      mockCrypto.getRandomValues
        .mockReturnValueOnce(mockArray1)
        .mockReturnValueOnce(mockArray2)
      
      const mockHashBuffer1 = new ArrayBuffer(32)
      const mockHashBuffer2 = new ArrayBuffer(32)
      
      mockCrypto.subtle.digest
        .mockResolvedValueOnce(mockHashBuffer1)
        .mockResolvedValueOnce(mockHashBuffer2)
      
      const nonce1 = generateNonce()
      const nonce2 = generateNonce()
      
      expect(nonce1).not.toBe(nonce2)
    })
  })
})