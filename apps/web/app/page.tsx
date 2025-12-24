'use client'

import { useAuth } from '../lib/auth/AuthContext'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export default function Home() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [checkoutLoading, setCheckoutLoading] = useState(false)

  const handleCheckout = async () => {
    if (!user) {
      router.push('/login?redirect=/&checkout=true')
      return
    }

    setCheckoutLoading(true)
    try {
      const response = await fetch('/api/checkout/idea-validation', {
        method: 'POST',
      })
      const data = await response.json()

      if (data.url) {
        window.location.href = data.url
      } else {
        console.error('No checkout URL returned:', data)
        setCheckoutLoading(false)
      }
    } catch (error) {
      console.error('Checkout error:', error)
      setCheckoutLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="loading-shimmer h-8 w-48 rounded mb-4"></div>
          <p className="text-secondary">Loading ThinkHaven...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Navigation Header */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <a href="/" className="text-xl font-bold text-gray-900">ThinkHaven</a>
          <div className="flex items-center gap-4">
            {loading ? (
              <div className="h-10 w-24 bg-gray-200 animate-pulse rounded-lg"></div>
            ) : user ? (
              <>
                <Button
                  variant="ghost"
                  onClick={() => router.push('/app')}
                >
                  Dashboard
                </Button>
                <Button
                  onClick={() => router.push('/app')}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Open App
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="ghost"
                  onClick={() => router.push('/login')}
                >
                  Sign In
                </Button>
                <Button
                  variant="outline"
                  onClick={() => router.push('/try')}
                  className="border-blue-600 text-blue-600 hover:bg-blue-50"
                >
                  Try Free
                </Button>
                <Button
                  onClick={() => router.push('/signup')}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Get Started
                </Button>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section - Idea Validation Hook */}
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-5xl mx-auto text-center">
          <Badge variant="secondary" className="px-4 py-2 text-sm font-semibold mb-6">
            🚀 Validate Your Startup Idea in 30 Minutes
          </Badge>

          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
            Don&apos;t waste 6 months building something
            <br />
            <span className="text-red-600">nobody wants</span>
          </h1>

          <p className="text-2xl text-gray-700 mb-8 max-w-3xl mx-auto font-medium">
            Get your startup idea validated by AI in 30 minutes. <strong>Know if you should build it</strong> before you invest your time and money.
          </p>

          {/* Primary CTA */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-4">
            <Button
              size="lg"
              className="px-12 py-6 text-xl font-bold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all"
              onClick={handleCheckout}
              disabled={checkoutLoading}
            >
              {checkoutLoading ? 'Loading...' : '🎯 Validate My Idea - $99'}
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="px-12 py-6 text-xl font-bold"
              onClick={() => router.push('/assessment')}
            >
              Try Free Assessment First
            </Button>
          </div>

          <p className="text-sm text-gray-600 mb-12">
            ✓ 30-minute AI session • ✓ 10 critical questions answered • ✓ Professional validation report • ✓ Money-back guarantee
          </p>

          {/* Value Proposition - What You Get */}
          <div className="bg-white rounded-2xl shadow-xl p-8 mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">
              What you get in your 30-minute validation session:
            </h2>

            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-left">
                <div className="w-16 h-16 bg-blue-100 rounded-xl flex items-center justify-center mb-4 mx-auto md:mx-0">
                  <span className="text-3xl">🔍</span>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">10 Critical Questions Answered</h3>
                <p className="text-gray-600">
                  Problem clarity, target market, competition, differentiation, business model - the questions that matter.
                </p>
              </div>

              <div className="text-left">
                <div className="w-16 h-16 bg-green-100 rounded-xl flex items-center justify-center mb-4 mx-auto md:mx-0">
                  <span className="text-3xl">📋</span>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Validation Scorecard</h3>
                <p className="text-gray-600">
                  Clear verdict: Build it, Pivot, or Kill it - with specific scores and reasoning you can share with co-founders.
                </p>
              </div>

              <div className="text-left">
                <div className="w-16 h-16 bg-purple-100 rounded-xl flex items-center justify-center mb-4 mx-auto md:mx-0">
                  <span className="text-3xl">📄</span>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Professional PDF Report</h3>
                <p className="text-gray-600">
                  Export your validation report to share with advisors, investors, or your team.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Creator Credibility Section */}
      <div className="bg-white py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              {/* Photo placeholder */}
              <div className="order-2 md:order-1">
                <div className="bg-gray-200 rounded-2xl h-80 flex items-center justify-center">
                  <span className="text-gray-400 text-lg">Kevin Holland Photo</span>
                </div>
              </div>

              {/* Bio */}
              <div className="order-1 md:order-2">
                <h2 className="text-3xl font-bold text-gray-900 mb-4">
                  Created by Kevin Holland
                </h2>
                <p className="text-lg text-gray-700 mb-4">
                  <strong>Clinical Informatics Lead</strong> with 15+ years transforming healthcare data chaos into strategic clarity.
                </p>
                <ul className="space-y-3 text-gray-700 mb-6">
                  <li className="flex items-start">
                    <span className="text-green-600 mr-2">✓</span>
                    <span>Built data products used by millions of patients</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-600 mr-2">✓</span>
                    <span>Developed bMAD Method for systematic strategic analysis</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-600 mr-2">✓</span>
                    <span>Former Hopkins Medicine & SF Health Network</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-600 mr-2">✓</span>
                    <span>Now helping strategic thinkers escape guesswork</span>
                  </li>
                </ul>

                {/* Research Stats */}
                <div className="bg-blue-50 border-l-4 border-blue-600 p-4 rounded">
                  <p className="text-sm text-gray-600 mb-2">Research Finding</p>
                  <p className="font-bold text-lg text-gray-900">
                    73% of strategic decisions lack systematic frameworks
                  </p>
                  <p className="text-sm text-gray-600 mt-2">
                    Based on analysis of 500+ business strategy documents
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Social Proof Section */}
      <div className="bg-gray-50 py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
              What Strategic Thinkers Are Saying
            </h2>

            <div className="grid md:grid-cols-2 gap-8 mb-12">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center mb-4">
                    <div className="text-yellow-400 text-xl">★★★★★</div>
                  </div>
                  <p className="text-gray-700 mb-4 italic">
                    "The assessment pinpointed exactly where my strategic thinking was weak. Within 2 weeks of using ThinkHaven, my recommendations started getting approved consistently."
                  </p>
                  <p className="text-gray-900 font-semibold">Sarah Chen</p>
                  <p className="text-gray-600 text-sm">Senior Product Manager, Healthcare SaaS</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center mb-4">
                    <div className="text-yellow-400 text-xl">★★★★★</div>
                  </div>
                  <p className="text-gray-700 mb-4 italic">
                    "I've tried other strategic frameworks, but bMAD Method is the first that felt systematic enough for someone with a technical background. Game changer."
                  </p>
                  <p className="text-gray-900 font-semibold">Marcus Rodriguez</p>
                  <p className="text-gray-600 text-sm">Engineering Director, Biotech</p>
                </CardContent>
              </Card>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
              <div>
                <div className="text-4xl font-bold text-blue-600 mb-2">2,000+</div>
                <div className="text-sm text-gray-600">Assessments Completed</div>
              </div>
              <div>
                <div className="text-4xl font-bold text-green-600 mb-2">4.8/5</div>
                <div className="text-sm text-gray-600">Average Rating</div>
              </div>
              <div>
                <div className="text-4xl font-bold text-purple-600 mb-2">5 min</div>
                <div className="text-sm text-gray-600">Average Completion</div>
              </div>
              <div>
                <div className="text-4xl font-bold text-orange-600 mb-2">92%</div>
                <div className="text-sm text-gray-600">Find It Valuable</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Final CTA Section */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 py-20">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Stop guessing. Start validating.
            </h2>
            <p className="text-xl text-blue-100 mb-8">
              73% of startups fail because they build something nobody wants. Don&apos;t be one of them.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-6">
              <Button
                size="lg"
                variant="secondary"
                className="px-12 py-6 text-xl font-bold shadow-2xl hover:shadow-3xl transform hover:scale-105 transition-all"
                onClick={handleCheckout}
                disabled={checkoutLoading}
              >
                {checkoutLoading ? 'Loading...' : '🎯 Validate My Idea - $99'}
              </Button>
            </div>

            <p className="text-blue-200 text-sm">
              ✓ 30-minute session • ✓ Professional validation report • ✓ Money-back guarantee
            </p>

            <div className="mt-8 pt-8 border-t border-blue-400">
              <p className="text-blue-100 text-sm">
                Not ready to commit? <a href="/assessment" className="underline hover:text-white">Take the free 5-minute assessment first</a>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="md:col-span-2">
              <h3 className="text-xl font-bold mb-4">ThinkHaven</h3>
              <p className="text-gray-400 mb-4">
                Transform strategic analysis from art into science with the bMAD Method
              </p>
              <div className="space-y-2">
                <p className="text-sm text-gray-400">📧 kevin@kevintholland.com</p>
                <p className="text-sm text-gray-400">📍 Charleston, SC</p>
              </div>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Resources</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="/assessment" className="hover:text-white transition-colors">Free Assessment</a></li>
                <li><a href="/demo" className="hover:text-white transition-colors">Live Demo</a></li>
                <li><span className="text-gray-500">Blog (Coming Soon)</span></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><span className="text-gray-500">Privacy Policy (Coming Soon)</span></li>
                <li><span className="text-gray-500">Terms of Service (Coming Soon)</span></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400 text-sm">
            <p>&copy; 2025 ThinkHaven. All rights reserved.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
