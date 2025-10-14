'use client'

import { useAuth } from '../lib/auth/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'

export default function Home() {
  const { user, loading, signInWithGoogle } = useAuth()
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [isGoogleSigningIn, setIsGoogleSigningIn] = useState(false)
  const [googleError, setGoogleError] = useState<string | null>(null)
  const handleEmailCapture = async (e: React.FormEvent) => {
    e.preventDefault()
    // TODO: Integrate with Supabase to store email
    console.log('Email captured:', email)
    setIsSubmitted(true)
    // Reset after 3 seconds
    setTimeout(() => {
      setIsSubmitted(false)
      setEmail('')
    }, 3000)
  }

  const handleGoogleSignIn = async () => {
    try {
      setIsGoogleSigningIn(true)
      setGoogleError(null)
      console.log('Landing page: Starting Google OAuth signin')

      await signInWithGoogle()
      // signInWithGoogle handles the redirect, so we won't reach here normally

    } catch (error) {
      console.error('Landing page: Google signin error:', error)
      setGoogleError(error instanceof Error ? error.message : 'Google signin failed')
      setIsGoogleSigningIn(false)
    }
  }

  useEffect(() => {
    if (!loading && user) {
      console.log('Landing page: Authenticated user detected, redirecting to dashboard')
      router.push('/dashboard')
    } else if (!loading && !user) {
      console.log('Landing page: No authenticated user, staying on landing page')
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="loading-shimmer h-8 w-48 rounded mb-4"></div>
          <p className="text-secondary">Loading Thinkhaven...</p>
        </div>
      </div>
    )
  }

  // if (user) {
  //   return (
  //     <div className="min-h-screen flex items-center justify-center">
  //       <div className="text-center">
  //         <div className="loading-shimmer h-8 w-48 rounded mb-4"></div>
  //         <p className="text-secondary">Redirecting to your dashboard...</p>
  //       </div>
  //     </div>
  //   )
  // }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto text-center">
          <div className="mb-4">
            <Badge variant="secondary" className="px-4 py-2 text-sm font-semibold">
              🎯 Live Demo Available - No Signup Required
            </Badge>
          </div>
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Transform Strategic Analysis
            <span className="block text-primary">from Art into Science</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Partner with Mary for structured brainstorming, market research, and competitive analysis 
            that delivers evidence-based insights using the proven bMAD Method.
          </p>
          
          {/* Value Proposition Cards */}
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            <Card>
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Curiosity-Driven Inquiry</h3>
                <p className="text-gray-600 text-sm">
                  Mary asks probing &ldquo;why&rdquo; questions to uncover underlying truths and challenge assumptions systematically
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Evidence-Based Analysis</h3>
                <p className="text-gray-600 text-sm">
                  Ground all findings in verifiable data and credible sources with structured research methodologies
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                  </svg>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Numbered Options Protocol</h3>
                <p className="text-gray-600 text-sm">
                  Navigate complex decisions through clear, structured choices that maintain analytical rigor
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Google Signin */}
          {!user && (
            <Card className="max-w-md mx-auto mb-6">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-center mb-4">Sign in with Google</h3>
                <div className="flex flex-col items-center">
                  {/* Google OAuth button replacing One Tap */}
                  <Button
                    onClick={handleGoogleSignIn}
                    disabled={isGoogleSigningIn}
                    className="w-full mb-4 bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
                  >
                    {isGoogleSigningIn ? (
                      <div className="flex items-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600 mr-2"></div>
                        Signing in...
                      </div>
                    ) : (
                      <div className="flex items-center">
                        <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
                          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                        </svg>
                        Continue with Google
                      </div>
                    )}
                  </Button>

                  {googleError && (
                    <div className="w-full mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                      <p className="text-red-700 text-sm">{googleError}</p>
                    </div>
                  )}
                  <div className="flex items-center my-4 w-full">
                    <div className="flex-1 border-t border-gray-300"></div>
                    <span className="px-3 text-gray-500 text-sm">or</span>
                    <div className="flex-1 border-t border-gray-300"></div>
                  </div>
                  <Button
                    onClick={() => router.push('/login')}
                    variant="outline"
                    className="w-full"
                  >
                    Email & Password Login
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Interest Capture Form */}
          <Card className="max-w-md mx-auto mb-8">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-center mb-4">
                {user ? 'Welcome back!' : 'Get Early Access'}
              </h3>
              {!isSubmitted ? (
                <form onSubmit={handleEmailCapture} className="space-y-4">
                  <Input
                    type="email"
                    placeholder="Enter your email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full"
                  />
                  <Button type="submit" className="w-full" size="lg">
                    🧠 Get Notified When Available
                  </Button>
                </form>
              ) : (
                <div className="text-center" data-testid="success-message">
                  <div className="text-green-600 font-semibold mb-2">✅ Thank you!</div>
                  <p className="text-sm text-gray-600">We'll notify you when Mary is ready to transform your strategic analysis.</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            {user ? (
              <>
                <Button size="lg" className="px-8 py-4" onClick={() => router.push('/dashboard')}>
                  🚀 Go to Dashboard
                </Button>
                <Button variant="outline" size="lg" className="px-8 py-4" onClick={() => router.push('/demo')}>
                  🎯 View Demo
                </Button>
              </>
            ) : (
              <>
                <Button size="lg" className="px-8 py-4" onClick={() => router.push('/demo')}>
                  🎯 View Live Demo - No Signup Required
                </Button>
                <Button variant="outline" size="lg" className="px-8 py-4" onClick={() => router.push('/demo')}>
                  🎬 Watch Method Demo
                </Button>
              </>
            )}
          </div>

          <p className="text-sm text-gray-500 mt-4">
            Start structured strategic analysis in 2 minutes • Zero Risk: 14-day free trial
          </p>
        </div>
      </div>

      {/* Demo Preview */}
      <div className="container mx-auto px-4 pb-16">
        <div className="max-w-6xl mx-auto">
          <div className="bg-white rounded-2xl shadow-2xl p-8 border border-gray-100">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Mary&apos;s Systematic Strategic Analysis in Action</h2>
              <p className="text-gray-600">Experience evidence-based methodology with structured brainstorming techniques</p>
            </div>
            
            {/* Demo Interface Preview */}
            <div className="grid lg:grid-cols-5 gap-6 h-96">
              <div className="lg:col-span-3 bg-gray-50 rounded-lg p-4 border border-gray-200">
                <div className="flex items-center mb-4">
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center mr-3">
                    <span className="text-white font-semibold text-sm">M</span>
                  </div>
                  <span className="font-medium text-gray-700">Strategic Analysis with Mary</span>
                </div>
                <div className="space-y-3">
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <p className="text-sm text-gray-700">
                      <strong>You:</strong> I need to analyze the competitive landscape for our B2B SaaS product.
                    </p>
                  </div>
                  <div className="bg-blue-100 p-3 rounded-lg">
                    <p className="text-sm text-gray-700">
                      <strong>Mary:</strong> Let&apos;s use systematic competitive analysis. Choose your approach:<br/>
                      1. Market positioning matrix<br/>
                      2. Feature gap analysis<br/>
                      3. Pricing strategy comparison<br/>
                      4. Customer perception audit<br/>
                      Which resonates with your strategic priorities?
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="lg:col-span-2 bg-gray-50 rounded-lg p-4 border border-gray-200">
                <div className="flex items-center mb-4">
                  <svg className="w-5 h-5 text-gray-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  <span className="font-medium text-gray-700">Evidence Framework</span>
                </div>
                <div className="h-48 bg-white rounded p-3 border border-gray-300">
                  <div className="text-xs text-gray-600 space-y-2">
                    <div className="bg-green-50 p-2 rounded">
                      ✓ Market size: $47B TAM
                    </div>
                    <div className="bg-yellow-50 p-2 rounded">
                      ⚠ 15 direct competitors identified
                    </div>
                    <div className="bg-blue-50 p-2 rounded">
                      📊 Price range: $29-299/mo
                    </div>
                    <div className="bg-purple-50 p-2 rounded">
                      🎯 3 differentiation opportunities
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Social Proof Section */}
      <div className="bg-gray-50 py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-8">
              Trusted by Strategic Thinkers Who Value Methodology
            </h2>
            <div className="grid md:grid-cols-2 gap-8">
              <Card>
                <CardContent className="p-6">
                  <p className="text-gray-700 mb-4 italic">
                    &quot;Mary&apos;s structured brainstorming techniques helped me discover insights I never would have found through traditional approaches. The numbered options keep everything organized.&quot;
                  </p>
                  <p className="text-gray-600 font-medium">- Senior Business Analyst</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <p className="text-gray-700 mb-4 italic">
                    &quot;The bMAD Method brings scientific rigor to strategic thinking. My analysis is more thorough and my recommendations are better supported.&quot;
                  </p>
                  <p className="text-gray-600 font-medium">- Strategy Consultant</p>
                </CardContent>
              </Card>
            </div>
            
            <div className="grid md:grid-cols-4 gap-4 mt-12">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">20+</div>
                <div className="text-sm text-gray-600">Brainstorming Techniques</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">100%</div>
                <div className="text-sm text-gray-600">Evidence-Based</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">2 min</div>
                <div className="text-sm text-gray-600">Setup Time</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">14 days</div>
                <div className="text-sm text-gray-600">Free Trial</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Final CTA Section */}
      <div className="bg-blue-600 py-16">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold text-white mb-4">
              Ready to Transform Your Strategic Analysis Process?
            </h2>
            <p className="text-blue-100 text-lg mb-8">
              Join strategic thinkers who have discovered systematic approaches to complex problem-solving with Mary&apos;s analytical partnership.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              {user ? (
                <>
                  <Button size="lg" variant="secondary" className="px-8 py-4" onClick={() => router.push('/dashboard')}>
                    🚀 Start Strategic Analysis
                  </Button>
                  <Button size="lg" variant="outline" className="px-8 py-4 border-blue-300 text-white hover:bg-blue-700" onClick={() => router.push('/demo')}>
                    🎯 View Demo
                  </Button>
                </>
              ) : (
                <>
                  <Button size="lg" variant="secondary" className="px-8 py-4" onClick={() => router.push('/demo')}>
                    🎯 Try Before You Buy - View Demo
                  </Button>
                  <Button size="lg" variant="outline" className="px-8 py-4 border-blue-300 text-white hover:bg-blue-700" onClick={() => router.push('/demo')}>
                    🎬 Watch Method Demo
                  </Button>
                </>
              )}
            </div>
            <p className="text-blue-200 text-sm mt-4">
              Zero Risk: 14-day free trial • 30-day money-back guarantee • Cancel anytime
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="md:col-span-2">
              <h3 className="text-xl font-bold mb-4">Thinkhaven</h3>
              <p className="text-gray-400 mb-4">
                Built with bMAD Method • Powered by AI • Designed for Strategic Thinkers
              </p>
              <div className="space-y-2">
                <p className="text-sm text-gray-400">📧 kevin@kevintholland.com</p>
                <p className="text-sm text-gray-400">📍 San Francisco, CA</p>
              </div>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Resources</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="/demo" className="hover:text-white transition-colors">Live Demo</a></li>
                <li><span className="text-gray-500">Strategic Templates (Coming Soon)</span></li>
                <li><span className="text-gray-500">Weekly Insights (Coming Soon)</span></li>
                <li><span className="text-gray-500">Success Stories (Coming Soon)</span></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><span className="text-gray-500">Privacy Policy (Coming Soon)</span></li>
                <li><span className="text-gray-500">Terms of Service (Coming Soon)</span></li>
                <li><a href="https://vercel.com/security" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">Security</a></li>
                <li><span className="text-gray-500">Compliance (Coming Soon)</span></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400 text-sm">
            <p>&copy; 2025 Thinkhaven. All rights reserved.</p>
          </div>
        </div>
      </div>
    </div>
  )
}