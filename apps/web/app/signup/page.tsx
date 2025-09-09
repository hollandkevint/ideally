'use client'

import { useState } from 'react'
import { useAuth } from '../../lib/auth/AuthContext'
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabase/client'
import Link from 'next/link'
import { Button } from '../../components/ui/button'

export default function SignUpPage() {
  const { signInWithGoogle } = useAuth()
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setMessage('')

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      setLoading(false)
      return
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long')
      setLoading(false)
      return
    }

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/dashboard`,
        }
      })

      if (error) {
        setError(error.message)
      } else {
        setMessage('Check your email for a confirmation link!')
      }
    } catch (_err) {
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSignUp = async () => {
    setGoogleLoading(true)
    setError('')
    
    try {
      await signInWithGoogle()
    } catch (err) {
      console.error('Google sign-up error:', err)
      setError('Google sign-up failed. Please try again.')
    } finally {
      setGoogleLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="max-w-md w-full space-y-8 p-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-primary">Thinkhaven</h1>
          <h2 className="mt-6 text-2xl font-semibold">Create your account</h2>
          <p className="mt-2 text-secondary">
            Join the AI-powered strategic thinking workspace
          </p>
        </div>

        <div className="mt-8 space-y-6">
          {/* Google OAuth Button */}
          <div>
            <Button
              type="button"
              onClick={handleGoogleSignUp}
              disabled={googleLoading || loading}
              className="w-full flex justify-center items-center gap-3 py-3 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50"
              variant="outline"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              {googleLoading ? 'Signing up with Google...' : 'Continue with Google'}
            </Button>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-background text-secondary">Or continue with email</span>
            </div>
          </div>

          <form className="space-y-6" onSubmit={handleSignUp}>
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
              Password (min 8 characters)
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-divider rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
            />
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-foreground">
              Confirm Password
            </label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-divider rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
            />
          </div>

          {error && (
            <div className="error-boundary">
              {error}
            </div>
          )}

          {message && (
            <div className="bg-success/10 border border-success text-success rounded-lg p-4">
              {message}
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50"
            >
              {loading ? 'Creating account...' : 'Sign up'}
            </button>
          </div>

          <div className="text-center">
            <p className="text-secondary">
              Already have an account?{' '}
              <Link href="/login" className="font-medium text-primary hover:text-primary-hover">
                Sign in here
              </Link>
            </p>
          </div>
          </form>
        </div>
      </div>
    </div>
  )
}