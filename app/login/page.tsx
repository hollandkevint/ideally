'use client'

import { useState } from 'react'
import { supabase } from '../../lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  // const router = useRouter() // Unused for now

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        // Provide helpful error messages
        if (error.message.includes('Email not confirmed') || error.message.includes('signup')) {
          setError('Your email needs to be confirmed. Please check your email and click the confirmation link, or resend a new one.')
        } else if (error.message.includes('Invalid login credentials')) {
          setError('Invalid email or password. Please check your credentials and try again.')
        } else if (error.message.includes('User not found')) {
          setError('No account found with this email address. Please sign up first.')
        } else {
          setError(`Login failed: ${error.message}`)
        }
      } else {
        // Set auth cookies for server-side access
        if (data?.session) {
          const expires = new Date(data.session.expires_at! * 1000)
          document.cookie = `sb-access-token=${data.session.access_token}; expires=${expires.toUTCString()}; path=/; secure; samesite=lax`
          document.cookie = `sb-refresh-token=${data.session.refresh_token}; expires=${expires.toUTCString()}; path=/; secure; samesite=lax`
          
          setTimeout(() => {
            window.location.replace('/dashboard')
          }, 500)
        } else {
          setTimeout(() => {
            window.location.href = '/dashboard'
          }, 500)
        }
      }
    } catch (err) {
      console.error('Login error:', err)
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="max-w-md w-full space-y-8 p-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-primary">Strategic Workspace</h1>
          <h2 className="mt-6 text-2xl font-semibold">Sign in to your account</h2>
          <p className="mt-2 text-secondary">
            Access your AI-powered strategic thinking workspace
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleLogin}>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-foreground">
              Email address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-divider rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-foreground">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-divider rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
            />
          </div>

          {error && (
            <div className="error-boundary">
              {error}
              {(error.includes('email') && error.includes('confirm')) && (
                <div className="mt-3">
                  <Link href="/resend-confirmation" className="text-sm font-medium text-primary hover:text-primary-hover underline">
                    → Resend confirmation email
                  </Link>
                </div>
              )}
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50"
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </div>

          <div className="text-center space-y-2">
            <p className="text-secondary">
              Don&apos;t have an account?{' '}
              <Link href="/signup" className="font-medium text-primary hover:text-primary-hover">
                Sign up here
              </Link>
            </p>
            <p className="text-secondary">
              Email not confirmed?{' '}
              <Link href="/resend-confirmation" className="font-medium text-primary hover:text-primary-hover">
                Resend confirmation email
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  )
}