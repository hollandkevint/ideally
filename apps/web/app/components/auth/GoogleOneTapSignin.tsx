'use client'

import { useEffect, useState, useCallback } from 'react'
import Script from 'next/script'
import { useAuth } from '@/lib/auth/AuthContext'
import { loadGoogleScript, createGoogleConfig, isGoogleLoaded } from '@/lib/auth/google-config'
import type { GoogleCredentialResponse } from '@/types/google'

interface GoogleOneTapSigninProps {
  onSuccess?: () => void
  onError?: (error: string) => void
  className?: string
}

export default function GoogleOneTapSignin({ 
  onSuccess, 
  onError,
  className = ''
}: GoogleOneTapSigninProps) {
  const { signInWithGoogle, user, loading } = useAuth()
  const [isInitialized, setIsInitialized] = useState(false)
  const [isSigningIn, setIsSigningIn] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleCredentialResponse = useCallback(async (response: GoogleCredentialResponse) => {
    if (!response.credential) {
      const errorMsg = 'No credential received from Google'
      setError(errorMsg)
      onError?.(errorMsg)
      return
    }

    setIsSigningIn(true)
    setError(null)

    try {
      await signInWithGoogle(response.credential)
      onSuccess?.()
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Google signin failed'
      setError(errorMsg)
      onError?.(errorMsg)
      console.error('Google signin error:', err)
    } finally {
      setIsSigningIn(false)
    }
  }, [signInWithGoogle, onSuccess, onError])

  const initializeGoogleSignin = useCallback(async () => {
    try {
      await loadGoogleScript()
      
      if (!isGoogleLoaded()) {
        throw new Error('Google Identity Services not available')
      }

      const config = await createGoogleConfig(handleCredentialResponse)
      window.google!.accounts.id.initialize(config)
      
      // Render the One-Tap prompt
      window.google!.accounts.id.prompt((notification) => {
        if (notification.isNotDisplayed()) {
          const reason = notification.getNotDisplayedReason()
          console.log('Google One-Tap not displayed:', reason)
          if (reason === 'browser_not_supported') {
            setError('Your browser does not support Google One-Tap signin')
          }
        }
      })

      setIsInitialized(true)
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to initialize Google signin'
      setError(errorMsg)
      onError?.(errorMsg)
      console.error('Google signin initialization error:', err)
    }
  }, [handleCredentialResponse, onError])

  useEffect(() => {
    // Don't initialize if user is already signed in or still loading
    if (user || loading || isInitialized) {
      return
    }

    initializeGoogleSignin()
  }, [user, loading, isInitialized, initializeGoogleSignin])

  // Clean up Google signin on unmount
  useEffect(() => {
    return () => {
      if (isGoogleLoaded()) {
        window.google!.accounts.id.cancel()
      }
    }
  }, [])

  // Don't render anything if user is already signed in
  if (user) {
    return null
  }

  return (
    <>
      <Script
        src="https://accounts.google.com/gsi/client"
        strategy="afterInteractive"
        onLoad={() => {
          console.log('Google Identity Services script loaded')
        }}
        onError={() => {
          setError('Failed to load Google signin')
        }}
      />
      
      <div className={`google-signin-container ${className}`} data-testid="google-signin-container">
        {isSigningIn && (
          <div className="flex items-center justify-center p-4" role="status" aria-live="polite">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-sm text-gray-600">Signing in with Google...</span>
          </div>
        )}
        
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-3 mb-4">
            <div className="flex">
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">
                  Google Sign-in Error
                </h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>{error}</p>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Google One-Tap will render automatically when initialized */}
        <div id="google-signin-button" className="flex justify-center"></div>
      </div>
    </>
  )
}