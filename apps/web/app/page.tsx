'use client'

import { useAuth } from '../lib/auth/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export default function Home() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && user) {
      router.push('/dashboard')
    }
  }, [user, loading, router])

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
      {/* Hero Section - Frustration Hook */}
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-5xl mx-auto text-center">
          <Badge variant="secondary" className="px-4 py-2 text-sm font-semibold mb-6">
            🎯 Free Strategic Thinking Assessment • 5 Minutes
          </Badge>

          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
            Feeling frustrated that strategic decisions feel like <span className="text-red-600">guesswork</span>
            <br />
            <span className="text-primary">even though you have data?</span>
          </h1>

          <p className="text-2xl text-gray-700 mb-8 max-w-3xl mx-auto font-medium">
            Answer 15 questions to find out <strong>why</strong> your strategic thinking isn't systematic—and what to do about it
          </p>

          {/* Primary CTA */}
          <Button
            size="lg"
            className="px-12 py-6 text-xl font-bold mb-4 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all"
            onClick={() => router.push('/assessment')}
          >
            🧠 Take the Free Assessment Now
          </Button>

          <p className="text-sm text-gray-600 mb-12">
            ✓ Takes 5 minutes • ✓ Instant results • ✓ Completely free • ✓ No signup required
          </p>

          {/* Value Proposition - 3 Key Areas */}
          <div className="bg-white rounded-2xl shadow-xl p-8 mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">
              This assessment will measure and improve three key areas:
            </h2>

            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-left">
                <div className="w-16 h-16 bg-blue-100 rounded-xl flex items-center justify-center mb-4 mx-auto md:mx-0">
                  <span className="text-3xl">📊</span>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Evidence-Based Decision Making</h3>
                <p className="text-gray-600">
                  Stop relying on gut feeling. Learn how to ground every strategic choice in verifiable data and research.
                </p>
              </div>

              <div className="text-left">
                <div className="w-16 h-16 bg-green-100 rounded-xl flex items-center justify-center mb-4 mx-auto md:mx-0">
                  <span className="text-3xl">🎯</span>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Systematic Framework Mastery</h3>
                <p className="text-gray-600">
                  Transform analysis from art into science using proven methodologies like the bMAD Method.
                </p>
              </div>

              <div className="text-left">
                <div className="w-16 h-16 bg-purple-100 rounded-xl flex items-center justify-center mb-4 mx-auto md:mx-0">
                  <span className="text-3xl">🚀</span>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Actionable Strategic Outputs</h3>
                <p className="text-gray-600">
                  Generate professional documents and roadmaps that stakeholders understand and executives approve.
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
              Ready to discover your strategic thinking gaps?
            </h2>
            <p className="text-xl text-blue-100 mb-8">
              Take the 5-minute assessment now and get your personalized strategic thinking scorecard with specific recommendations.
            </p>

            <Button
              size="lg"
              variant="secondary"
              className="px-12 py-6 text-xl font-bold mb-6 shadow-2xl hover:shadow-3xl transform hover:scale-105 transition-all"
              onClick={() => router.push('/assessment')}
            >
              🧠 Start Your Free Assessment
            </Button>

            <p className="text-blue-200 text-sm">
              ✓ Takes 5 minutes • ✓ Instant personalized results • ✓ Completely free<br />
              ✓ No credit card • ✓ No signup required • ✓ Privacy protected
            </p>

            <div className="mt-8 pt-8 border-t border-blue-400">
              <p className="text-blue-100 text-sm">
                After your assessment, you'll get 2 free strategic coaching sessions with Mary AI
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
                <p className="text-sm text-gray-400">📧 kevin@thinkhaven.co</p>
                <p className="text-sm text-gray-400">📍 San Francisco, CA</p>
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
