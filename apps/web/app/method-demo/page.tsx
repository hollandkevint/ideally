'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'
import { Play, ArrowLeft } from 'lucide-react'

export default function MethodDemo() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                🎬 BMad Method Demo Video
              </h1>
              <p className="text-gray-600">
                Learn the systematic approach to strategic thinking
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => router.push('/')}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
          </div>
        </div>
      </div>

      {/* Video Demo Content */}
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">

          {/* Video Placeholder */}
          <Card className="mb-8">
            <CardContent className="p-0">
              <div className="relative aspect-video bg-gray-900 rounded-lg overflow-hidden">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center text-white">
                    <Play className="w-16 h-16 mx-auto mb-4 opacity-80" />
                    <h3 className="text-xl font-semibold mb-2">Method Demo Video</h3>
                    <p className="text-gray-300 mb-6">Coming Soon</p>
                    <Button
                      size="lg"
                      className="bg-blue-600 hover:bg-blue-700"
                      onClick={() => router.push('/demo')}
                    >
                      View Live Demo Instead
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Method Overview */}
          <div className="grid md:grid-cols-2 gap-8 mb-12">
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-3">What You'll Learn</h3>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li>• Structured brainstorming techniques</li>
                  <li>• Numbered options protocol</li>
                  <li>• Evidence-based analysis framework</li>
                  <li>• Strategic decision-making process</li>
                  <li>• Implementation planning methods</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-3">Video Highlights</h3>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li>• 15-minute comprehensive overview</li>
                  <li>• Real strategic analysis examples</li>
                  <li>• Mary's AI coaching in action</li>
                  <li>• Step-by-step method walkthrough</li>
                  <li>• Case study results</li>
                </ul>
              </CardContent>
            </Card>
          </div>

          {/* CTA Section */}
          <div className="text-center">
            <Card className="bg-gradient-to-r from-blue-600 to-indigo-600 border-0">
              <CardContent className="p-8 text-white">
                <h3 className="text-2xl font-bold mb-4">
                  Ready to Experience the Method?
                </h3>
                <p className="text-blue-100 mb-6 max-w-2xl mx-auto">
                  While our video demo is in production, you can experience the BMad Method
                  through our interactive live demo sessions.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                  <Button
                    size="lg"
                    variant="secondary"
                    className="px-8 py-4"
                    onClick={() => router.push('/demo')}
                  >
                    🎯 Try Live Demo
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    className="px-8 py-4 border-blue-300 text-white hover:bg-blue-700"
                    onClick={() => router.push('/login')}
                  >
                    🚀 Start Free Trial
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}