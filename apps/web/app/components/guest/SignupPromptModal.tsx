'use client'

import { useState } from 'react'
import { SessionMigration } from '@/lib/guest/session-migration'
import { useRouter } from 'next/navigation'

interface SignupPromptModalProps {
  isOpen: boolean
  onClose: () => void
  sessionSummary?: string
}

export default function SignupPromptModal({
  isOpen,
  onClose,
  sessionSummary
}: SignupPromptModalProps) {
  const router = useRouter()
  const [showSummary, setShowSummary] = useState(false)

  if (!isOpen) return null

  const handleSignup = () => {
    // Redirect to signup page
    // Session will be migrated after successful authentication
    router.push('/auth?mode=signup&from=guest')
  }

  const handleViewSummary = () => {
    setShowSummary(true)
  }

  const summary = sessionSummary || SessionMigration.generateSessionSummary()

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-8 relative">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
          aria-label="Close"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {!showSummary ? (
          <>
            {/* Main Content */}
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Ready for more?
              </h2>
              <p className="text-gray-600">
                You've reached your 5 free messages. Sign up to continue your conversation with Mary and unlock unlimited strategic insights.
              </p>
            </div>

            {/* Benefits */}
            <div className="space-y-3 mb-6">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <div>
                  <p className="font-medium text-gray-900">Your conversation will be saved</p>
                  <p className="text-sm text-gray-600">Pick up right where you left off</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <div>
                  <p className="font-medium text-gray-900">Unlimited conversations</p>
                  <p className="text-sm text-gray-600">No more message limits</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <div>
                  <p className="font-medium text-gray-900">Access to all features</p>
                  <p className="text-sm text-gray-600">Canvas workspace, exports, and more</p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-3">
              <button
                onClick={handleSignup}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium py-3 px-6 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                Sign up to continue
              </button>

              <button
                onClick={handleViewSummary}
                className="w-full bg-gray-100 text-gray-700 font-medium py-3 px-6 rounded-lg hover:bg-gray-200 transition-colors"
              >
                View conversation summary
              </button>
            </div>

            {/* Fine print */}
            <p className="text-xs text-gray-500 text-center mt-4">
              Free to sign up. No credit card required.
            </p>
          </>
        ) : (
          <>
            {/* Summary View */}
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Your conversation summary
              </h2>
              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <p className="text-gray-700 whitespace-pre-line text-sm">
                  {summary}
                </p>
              </div>
              <p className="text-sm text-gray-600">
                Sign up to save this conversation and continue where you left off.
              </p>
            </div>

            {/* Actions */}
            <div className="space-y-3">
              <button
                onClick={handleSignup}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium py-3 px-6 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                Sign up to save
              </button>

              <button
                onClick={() => setShowSummary(false)}
                className="w-full bg-gray-100 text-gray-700 font-medium py-3 px-6 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Back
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
