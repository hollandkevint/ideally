'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { User } from '@supabase/supabase-js'
import { supabase } from '../supabase/client'

interface AuthContextType {
  user: User | null
  loading: boolean
  signOut: () => Promise<void>
  signInWithGoogle: (idToken: string) => Promise<void>
  signInWithEmail: (email: string, password: string) => Promise<{ error: any }>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('AuthContext: Initial session:', session?.user?.email || 'No user')
      setUser(session?.user ?? null)
      setLoading(false)
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('AuthContext: Auth state change:', {
        event,
        user: session?.user?.email || 'No user',
        provider: session?.user?.app_metadata?.provider,
        timestamp: new Date().toISOString()
      })
      
      setUser(session?.user ?? null)
      setLoading(false)
      
      // Handle authentication events with detailed logging
      if (event === 'SIGNED_IN' && session) {
        console.log('AuthContext: User signed in successfully:', {
          provider: session.user.app_metadata?.provider || 'email',
          email: session.user.email,
          id: session.user.id,
          timestamp: new Date().toISOString()
        })
      } else if (event === 'SIGNED_OUT') {
        console.log('AuthContext: User signed out:', {
          timestamp: new Date().toISOString()
        })
      } else if (event === 'TOKEN_REFRESHED') {
        console.log('AuthContext: Token refreshed for user:', {
          email: session?.user?.email,
          timestamp: new Date().toISOString()
        })
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const signOut = async () => {
    await supabase.auth.signOut()
  }

  const signInWithGoogle = async (idToken: string) => {
    try {
      console.log('AuthContext: Starting Google ID token signin flow')
      
      const { data, error } = await supabase.auth.signInWithIdToken({
        provider: 'google',
        token: idToken
      })
      
      if (error) {
        console.error('AuthContext: Google ID token signin error:', {
          message: error.message,
          status: error.status,
          name: error.name,
          timestamp: new Date().toISOString()
        })
        
        // Provide specific error messages based on error type
        let userMessage = 'Google signin failed'
        if (error.message?.includes('Invalid token')) {
          userMessage = 'Google signin token is invalid or expired'
        } else if (error.message?.includes('Network')) {
          userMessage = 'Network error during Google signin. Please try again.'
        } else if (error.message?.includes('Provider')) {
          userMessage = 'Google signin is not properly configured'
        }
        
        throw new Error(userMessage)
      }
      
      if (!data.user) {
        console.error('AuthContext: No user data received from Google signin')
        throw new Error('No user information received from Google')
      }
      
      console.log('AuthContext: Google signin successful:', {
        email: data.user.email,
        id: data.user.id,
        provider: data.user.app_metadata?.provider,
        timestamp: new Date().toISOString()
      })
      
    } catch (err) {
      console.error('AuthContext: Unexpected error during Google signin:', {
        error: err,
        timestamp: new Date().toISOString()
      })
      throw err
    }
  }

  const signInWithEmail = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    })
    return { error }
  }

  const value = {
    user,
    loading,
    signOut,
    signInWithGoogle,
    signInWithEmail,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}