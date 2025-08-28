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
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Strategic Workspace
            <span className="block text-primary">for Modern Leaders</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Transform your strategic thinking with our revolutionary dual-pane interface. 
            AI-powered coaching meets visual ideation in one integrated workspace.
          </p>
          
          {/* Value Proposition Cards */}
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">AI Strategic Coach</h3>
              <p className="text-gray-600 text-sm">
                Chat with Mary, your AI strategic advisor, trained on proven business methodologies
              </p>
            </div>
            
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Visual Ideation</h3>
              <p className="text-gray-600 text-sm">
                Sketch, diagram, and wireframe your ideas while maintaining context with your conversation
              </p>
            </div>
            
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">30-Min Sessions</h3>
              <p className="text-gray-600 text-sm">
                From raw idea to validated business concept in structured, time-bounded coaching sessions
              </p>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <a
              href="/signup"
              className="px-8 py-4 bg-primary text-white font-semibold rounded-lg hover:bg-primary-hover transition-colors shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              Start Your Strategic Session
            </a>
            <a
              href="/login"
              className="px-8 py-4 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
            >
              Sign In
            </a>
          </div>

          <p className="text-sm text-gray-500 mt-4">
            Free strategic thinking workspace • No credit card required
          </p>
        </div>
      </div>

      {/* Demo Preview */}
      <div className="container mx-auto px-4 pb-16">
        <div className="max-w-6xl mx-auto">
          <div className="bg-white rounded-2xl shadow-2xl p-8 border border-gray-100">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Experience the Dual-Pane Interface</h2>
              <p className="text-gray-600">Strategic conversation + Visual ideation, seamlessly integrated</p>
            </div>
            
            {/* Demo Interface Preview */}
            <div className="grid lg:grid-cols-5 gap-6 h-96">
              <div className="lg:col-span-3 bg-gray-50 rounded-lg p-4 border border-gray-200">
                <div className="flex items-center mb-4">
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center mr-3">
                    <span className="text-white font-semibold text-sm">M</span>
                  </div>
                  <span className="font-medium text-gray-700">Strategic Chat with Mary</span>
                </div>
                <div className="space-y-3">
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <p className="text-sm text-gray-700">
                      <strong>You:</strong> I have an idea for a B2B productivity app but I&apos;m not sure about the market fit.
                    </p>
                  </div>
                  <div className="bg-blue-100 p-3 rounded-lg">
                    <p className="text-sm text-gray-700">
                      <strong>Mary:</strong> Let&apos;s explore this systematically. What specific productivity problem does your app solve? Start by sketching your user workflow on the canvas →
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="lg:col-span-2 bg-gray-50 rounded-lg p-4 border border-gray-200">
                <div className="flex items-center mb-4">
                  <svg className="w-5 h-5 text-gray-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                  <span className="font-medium text-gray-700">Visual Canvas</span>
                </div>
                <div className="h-48 bg-white rounded border-2 border-dashed border-gray-300 flex items-center justify-center">
                  <div className="text-center text-gray-500">
                    <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
                    </svg>
                    <p className="text-sm">Sketch your ideas here</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-gray-900 text-white py-8">
        <div className="container mx-auto px-4 text-center">
          <p className="text-gray-400">
            Built with bMAD Method • Powered by AI • Designed for Strategic Thinkers
          </p>
        </div>
      </div>
    </div>
  )
}