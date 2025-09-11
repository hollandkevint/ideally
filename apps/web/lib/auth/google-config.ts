import type { GoogleOneTapConfig, GoogleCredentialResponse } from '@/types/google'

// Generate a secure nonce for Google signin
export function generateNonce(): string {
  const array = new Uint8Array(32)
  crypto.getRandomValues(array)
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('')
}

// Hash nonce using SHA-256
export async function hashNonce(nonce: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(nonce)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(byte => byte.toString(16).padStart(2, '0')).join('')
}

// Get Google Client ID from environment
export function getGoogleClientId(): string {
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID
  if (!clientId) {
    throw new Error('NEXT_PUBLIC_GOOGLE_CLIENT_ID environment variable is not set')
  }
  return clientId
}

// Check if Google Identity Services is available
export function isGoogleLoaded(): boolean {
  return typeof window !== 'undefined' && !!window.google?.accounts?.id
}

// Load Google Identity Services script
export function loadGoogleScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (isGoogleLoaded()) {
      resolve()
      return
    }

    const script = document.createElement('script')
    script.src = 'https://accounts.google.com/gsi/client'
    script.async = true
    script.defer = true
    
    script.onload = () => {
      // Wait for Google library to be fully initialized
      const checkGoogleReady = () => {
        if (isGoogleLoaded()) {
          resolve()
        } else {
          setTimeout(checkGoogleReady, 100)
        }
      }
      checkGoogleReady()
    }
    
    script.onerror = () => {
      reject(new Error('Failed to load Google Identity Services'))
    }

    document.head.appendChild(script)
  })
}

// Create Google One-Tap configuration
export async function createGoogleConfig(
  callback: (response: GoogleCredentialResponse) => void,
  nonce?: string
): Promise<GoogleOneTapConfig> {
  const clientId = getGoogleClientId()
  const actualNonce = nonce || await hashNonce(generateNonce())
  
  return {
    client_id: clientId,
    callback,
    auto_select: false,
    cancel_on_tap_outside: true,
    context: 'signin',
    nonce: actualNonce,
    use_fedcm_for_prompt: true
  }
}