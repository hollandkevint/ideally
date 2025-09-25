'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useRouter } from 'next/navigation'
import { useAuth } from '../../lib/auth/AuthContext'
import { demoScenarios } from '../../lib/demo/demoData'
import { Clock, MessageCircle, Target } from 'lucide-react'

export default function DemoHub() {
  const router = useRouter()
  const { user, loading } = useAuth()

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Demo Header */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Strategic Analysis Demo
              </h1>
              <p className="text-gray-600">
                Experience Mary's BMad Method in action{user ? ' - Welcome back!' : ' - No signup required'}
              </p>
            </div>
            <Button 
              variant="outline" 
              onClick={() => router.push('/')}
            >
              ← Back to Home
            </Button>
          </div>
        </div>
      </div>

      {/* Demo Hub Content */}
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-6xl mx-auto">
          
          {/* Introduction */}
          <div className="text-center mb-12">
            <Badge className="mb-4 px-6 py-2">
              🎯 Live Strategic Analysis Sessions
            </Badge>
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Choose Your Strategic Challenge
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Each demo shows a complete strategic thinking session using the BMad Method. 
              Select a scenario that matches your interests and see Mary's systematic approach in action.
            </p>
          </div>

          {/* Demo Scenario Grid */}
          <div className="grid lg:grid-cols-3 gap-8 mb-12">
            {demoScenarios.map((scenario, index) => (
              <Card 
                key={index} 
                className="hover:shadow-lg transition-shadow cursor-pointer border-2 hover:border-blue-300"
                onClick={() => router.push(`/demo/${index}`)}
              >
                <CardHeader>
                  <div className="flex items-start justify-between mb-2">
                    <Badge variant="outline" className="text-xs">
                      Demo {index + 1}
                    </Badge>
                    <Target className="w-5 h-5 text-blue-600" />
                  </div>
                  <CardTitle className="text-lg leading-tight">
                    {scenario.name}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 text-sm mb-4 leading-relaxed">
                    {scenario.description}
                  </p>
                  
                  {/* Demo Stats */}
                  <div className="flex items-center gap-4 mb-4 text-xs text-gray-500">
                    <div className="flex items-center gap-1">
                      <MessageCircle className="w-3 h-3" />
                      <span>{scenario.chat_context.length} messages</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span>~5 min read</span>
                    </div>
                  </div>

                  {/* Strategic Tags */}
                  <div className="flex flex-wrap gap-1 mb-4">
                    {scenario.chat_context
                      .filter(msg => msg.metadata?.strategic_tags)
                      .slice(0, 1)
                      .map(msg => 
                        msg.metadata!.strategic_tags!.slice(0, 2).map(tag => (
                          <Badge key={tag} variant="secondary" className="text-xs px-2 py-0">
                            {tag}
                          </Badge>
                        ))
                      )}
                  </div>

                  <Button className="w-full" variant="outline">
                    View Strategic Session
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Method Explanation */}
          <div className="bg-white rounded-xl p-8 border border-gray-200 shadow-sm">
            <div className="text-center mb-6">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                The BMad Method in Action
              </h3>
              <p className="text-gray-600">
                Each demo demonstrates core BMad Method principles for systematic strategic thinking
              </p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <span className="text-blue-600 font-bold">1</span>
                </div>
                <h4 className="font-semibold text-gray-900 mb-2">Structured Inquiry</h4>
                <p className="text-sm text-gray-600">
                  Numbered options protocol guides systematic exploration of strategic alternatives
                </p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <span className="text-green-600 font-bold">2</span>
                </div>
                <h4 className="font-semibold text-gray-900 mb-2">Evidence-Based</h4>
                <p className="text-sm text-gray-600">
                  All insights grounded in research, data, and verifiable strategic frameworks
                </p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <span className="text-purple-600 font-bold">3</span>
                </div>
                <h4 className="font-semibold text-gray-900 mb-2">Actionable Output</h4>
                <p className="text-sm text-gray-600">
                  Strategic sessions produce concrete next steps and implementation guidance
                </p>
              </div>
            </div>
          </div>

          {/* Conversion CTA */}
          <div className="text-center mt-12">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl p-8 text-white">
              <h3 className="text-2xl font-bold mb-4">
                Ready to Start Your Strategic Analysis?
              </h3>
              <p className="text-blue-100 mb-6 max-w-2xl mx-auto">
                These demos show real strategic thinking sessions. Experience Mary's systematic approach 
                to unlock insights for your own business challenges.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                {user ? (
                  <Button size="lg" variant="secondary" className="px-8 py-4" onClick={() => router.push('/dashboard')}>
                    🚀 Access Your Dashboard
                  </Button>
                ) : (
                  <Button size="lg" variant="secondary" className="px-8 py-4" onClick={() => router.push('/signup')}>
                    🚀 Start Free Strategic Session
                  </Button>
                )}
                <Button size="lg" variant="outline" className="px-8 py-4 border-blue-300 text-white hover:bg-blue-700" onClick={() => window.open('mailto:kevin@kevintholland.com', '_blank')}>
                  💬 Talk to Our Team
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}