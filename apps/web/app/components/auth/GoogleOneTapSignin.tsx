'use client'

import { useEffect, useRef } from 'react'
import { useAuth } from '../../../lib/auth/AuthContext'

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: any) => void
          prompt: () => void
          renderButton: (parent: Element, options: any) => void
        }
      }
    }
  }
}

interface GoogleOneTapSigninProps {
  onSuccess?: () => void
  onError?: (error: string) => void
}

export default function GoogleOneTapSignin({ onSuccess, onError }: GoogleOneTapSigninProps) {
  const { signInWithGoogleIdToken } = useAuth()
  const buttonRef = useRef<HTMLDivElement>(null)
  const initialized = useRef(false)

  const generateNonce = () => {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
  }

  const handleCredentialResponse = async (response: { credential: string }) => {
    try {
      console.log('GoogleOneTapSignin: Received credential from Google One-Tap')
      await signInWithGoogleIdToken(response.credential)
      console.log('GoogleOneTapSignin: Successfully signed in with Google')
      onSuccess?.()
    } catch (error) {
      console.error('GoogleOneTapSignin: Authentication error:', error)
      onError?.(error instanceof Error ? error.message : 'Authentication failed')
    }
  }

  useEffect(() => {
    if (initialized.current) return

    const initializeGoogleSignin = () => {
      if (window.google?.accounts?.id && !initialized.current) {
        const nonce = generateNonce()

        window.google.accounts.id.initialize({
          client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
          callback: handleCredentialResponse,
          nonce: nonce,
          use_fedcm_for_prompt: true, // Support for FedCM
          auto_select: false,
          cancel_on_tap_outside: true
        })

        // Render the button if container exists
        if (buttonRef.current) {
          window.google.accounts.id.renderButton(buttonRef.current, {
            theme: 'outline',
            size: 'large',
            text: 'signin_with',
            shape: 'rectangular',
            width: '100%'
          })
        }

        // Show One-Tap prompt
        window.google.accounts.id.prompt()
        initialized.current = true
      }
    }

    // Load Google One-Tap script if not already loaded
    if (!window.google?.accounts?.id) {
      const script = document.createElement('script')
      script.src = 'https://accounts.google.com/gsi/client'
      script.async = true
      script.defer = true
      script.onload = initializeGoogleSignin
      document.head.appendChild(script)

      return () => {
        document.head.removeChild(script)
      }
    } else {
      initializeGoogleSignin()
    }
  }, [])

  return (
    <div className="google-signin-container">
      <div ref={buttonRef} className="google-signin-button" />
    </div>
  )
}