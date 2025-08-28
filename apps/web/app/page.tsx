'use client'

import { useAuth } from '../lib/auth/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function Home() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading) {
      if (user) {
        router.push('/dashboard')
      }
      // If no user, stay on landing page
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="loading-shimmer h-8 w-48 rounded mb-4"></div>
          <p className="text-secondary">Loading Strategic Workspace...</p>
        </div>
      </div>
    )
  }

  if (user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="loading-shimmer h-8 w-48 rounded mb-4"></div>
          <p className="text-secondary">Redirecting to your dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto text-center">
          <div className="mb-4">
            <span className="inline-flex items-center px-4 py-2 bg-blue-100 text-blue-800 text-sm font-semibold rounded-full">
              🧠 Meet Mary: Your AI Business Analyst
            </span>
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
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Curiosity-Driven Inquiry</h3>
              <p className="text-gray-600 text-sm">
                Mary asks probing "why" questions to uncover underlying truths and challenge assumptions systematically
              </p>
            </div>
            
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Evidence-Based Analysis</h3>
              <p className="text-gray-600 text-sm">
                Ground all findings in verifiable data and credible sources with structured research methodologies
              </p>
            </div>
            
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                </svg>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Numbered Options Protocol</h3>
              <p className="text-gray-600 text-sm">
                Navigate complex decisions through clear, structured choices that maintain analytical rigor
              </p>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <a
              href="/signup"
              className="px-8 py-4 bg-primary text-white font-semibold rounded-lg hover:bg-primary-hover transition-colors shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              🧠 Meet Mary Today
            </a>
            <a
              href="/login"
              className="px-8 py-4 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
            >
              🎬 Watch Method Demo
            </a>
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
              <div className="bg-white p-6 rounded-xl shadow-sm">
                <p className="text-gray-700 mb-4 italic">
                  &quot;Mary&apos;s structured brainstorming techniques helped me discover insights I never would have found through traditional approaches. The numbered options keep everything organized.&quot;
                </p>
                <p className="text-gray-600 font-medium">- Senior Business Analyst</p>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-sm">
                <p className="text-gray-700 mb-4 italic">
                  &quot;The bMAD Method brings scientific rigor to strategic thinking. My analysis is more thorough and my recommendations are better supported.&quot;
                </p>
                <p className="text-gray-600 font-medium">- Strategy Consultant</p>
              </div>
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
              <a
                href="/signup"
                className="px-8 py-4 bg-white text-blue-600 font-semibold rounded-lg hover:bg-gray-50 transition-colors shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                🧠 Meet Mary Today
              </a>
              <a
                href="/login"
                className="px-8 py-4 border-2 border-blue-300 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
              >
                🎬 Watch Method Demo
              </a>
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
              <h3 className="text-xl font-bold mb-4">Strategic Thinking Workspace</h3>
              <p className="text-gray-400 mb-4">
                Built with bMAD Method • Powered by AI • Designed for Strategic Thinkers
              </p>
              <div className="space-y-2">
                <p className="text-sm text-gray-400">📧 kevin@ideally.co</p>
                <p className="text-sm text-gray-400">📍 San Francisco, CA</p>
              </div>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Resources</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Method Demo</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Strategic Templates</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Weekly Insights</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Success Stories</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Security</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Compliance</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400 text-sm">
            <p>&copy; 2025 Strategic Thinking Workspace. All rights reserved.</p>
          </div>
        </div>
      </div>
    </div>
  )
}