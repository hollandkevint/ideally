'use client'

import { useState } from 'react'
import { SessionMigration } from '@/lib/guest/session-migration'
import { useRouter } from 'next/navigation'
import type { PartialOutput } from '@/lib/guest/partial-output'
import { TRIAL_CONFIG } from '@/lib/guest/session-store'

interface SignupPromptModalProps {
  isOpen: boolean
  onClose: () => void
  sessionSummary?: string
  // Story 6.5: New props for trial gate
  gateType?: 'soft' | 'hard'
  partialOutput?: PartialOutput | null
  onDismiss?: () => void // For "2 more messages" at soft gate
}

export default function SignupPromptModal({
  isOpen,
  onClose,
  sessionSummary,
  gateType = 'hard',
  partialOutput,
  onDismiss
}: SignupPromptModalProps) {
  const router = useRouter()
  const [view, setView] = useState<'main' | 'summary' | 'preview'>('main')

  if (!isOpen) return null

  const handleSignup = () => {
    router.push('/auth?mode=signup&from=guest')
  }

  const handleDismiss = () => {
    if (onDismiss) {
      onDismiss()
    }
    onClose()
  }

  const summary = sessionSummary || SessionMigration.generateSessionSummary()
  const isSoftGate = gateType === 'soft'
  const remainingAfterDismiss = TRIAL_CONFIG.hardGate - TRIAL_CONFIG.softGate

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-8 relative max-h-[90vh] overflow-y-auto">
        {/* Close button - only show if soft gate */}
        {isSoftGate && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Close"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}

        {view === 'main' && (
          <>
            {/* Viability Score Teaser - Story 6.5 */}
            {partialOutput?.viabilityTeaser && (
              <div className="mb-6 p-4 rounded-xl" style={{ backgroundColor: 'var(--cream)' }}>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium" style={{ color: 'var(--slate-blue)' }}>
                    Your Viability Score
                  </span>
                  <div className="flex items-center gap-1">
                    <span className="text-3xl font-bold" style={{ color: 'var(--terracotta)' }}>
                      {partialOutput.viabilityTeaser.score}
                    </span>
                    <span className="text-lg" style={{ color: 'var(--slate-blue)' }}>/10</span>
                  </div>
                </div>
                <p className="text-sm mb-2" style={{ color: 'var(--ink)' }}>
                  {partialOutput.viabilityTeaser.message}
                </p>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="flex items-start gap-1">
                    <span style={{ color: 'var(--forest)' }}>+</span>
                    <span style={{ color: 'var(--slate-blue)' }}>{partialOutput.viabilityTeaser.topStrength}</span>
                  </div>
                  <div className="flex items-start gap-1">
                    <span style={{ color: 'var(--rust)' }}>-</span>
                    <span style={{ color: 'var(--slate-blue)' }}>{partialOutput.viabilityTeaser.topIssue}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Header */}
            <div className="text-center mb-6">
              <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: 'var(--terracotta)' }}>
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: 'var(--cream)' }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold mb-2" style={{ color: 'var(--ink)' }}>
                {isSoftGate ? "You're building something interesting" : "Ready for more?"}
              </h2>
              <p style={{ color: 'var(--slate-blue)' }}>
                {isSoftGate
                  ? "You've reached 10 messages. Sign up now to save your progress and unlock the full analysis."
                  : "You've reached the trial limit. Sign up to continue your strategic session with Mary."
                }
              </p>
            </div>

            {/* Lean Canvas Preview - Story 6.5 */}
            {partialOutput?.leanCanvasPreview && (
              <div className="mb-6 border rounded-lg p-4" style={{ borderColor: 'var(--parchment)' }}>
                <h3 className="font-semibold text-sm mb-3" style={{ color: 'var(--ink)' }}>
                  Your Lean Canvas (Preview)
                </h3>
                <div className="space-y-2 text-sm">
                  {partialOutput.leanCanvasPreview.problem && (
                    <div>
                      <span className="font-medium" style={{ color: 'var(--forest)' }}>Problem: </span>
                      <span style={{ color: 'var(--slate-blue)' }}>{partialOutput.leanCanvasPreview.problem}</span>
                    </div>
                  )}
                  {partialOutput.leanCanvasPreview.solution && (
                    <div>
                      <span className="font-medium" style={{ color: 'var(--forest)' }}>Solution: </span>
                      <span style={{ color: 'var(--slate-blue)' }}>{partialOutput.leanCanvasPreview.solution}</span>
                    </div>
                  )}
                  {partialOutput.leanCanvasPreview.uniqueValueProposition && (
                    <div>
                      <span className="font-medium" style={{ color: 'var(--forest)' }}>UVP: </span>
                      <span style={{ color: 'var(--slate-blue)' }}>{partialOutput.leanCanvasPreview.uniqueValueProposition}</span>
                    </div>
                  )}
                  {partialOutput.leanCanvasPreview.additionalSectionsCount > 0 && (
                    <p className="text-xs italic mt-2" style={{ color: 'var(--slate-blue)' }}>
                      +{partialOutput.leanCanvasPreview.additionalSectionsCount} more sections available after signup
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Benefits - condensed */}
            <div className="space-y-2 mb-6">
              {[
                { text: 'Save your conversation & progress', icon: 'save' },
                { text: 'Full Lean Canvas & Product Brief', icon: 'doc' },
                { text: 'Unlimited strategic sessions', icon: 'infinite' }
              ].map((benefit, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20" style={{ color: 'var(--forest)' }}>
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="text-sm" style={{ color: 'var(--ink)' }}>{benefit.text}</span>
                </div>
              ))}
            </div>

            {/* Actions */}
            <div className="space-y-3">
              <button
                onClick={handleSignup}
                className="w-full font-medium py-3 px-6 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl"
                style={{ backgroundColor: 'var(--terracotta)', color: 'var(--cream)' }}
              >
                Save My Work
              </button>

              {/* Story 6.5: "2 more messages" option at soft gate */}
              {isSoftGate && onDismiss && (
                <button
                  onClick={handleDismiss}
                  className="w-full font-medium py-3 px-6 rounded-lg transition-colors"
                  style={{ backgroundColor: 'var(--parchment)', color: 'var(--ink)' }}
                >
                  {remainingAfterDismiss} more messages
                </button>
              )}

              <button
                onClick={() => setView('summary')}
                className="w-full text-sm py-2 px-6 rounded-lg hover:bg-gray-100 transition-colors"
                style={{ color: 'var(--slate-blue)' }}
              >
                View conversation summary
              </button>
            </div>

            <p className="text-xs text-center mt-4" style={{ color: 'var(--slate-blue)' }}>
              Free to sign up. No credit card required.
            </p>
          </>
        )}

        {view === 'summary' && (
          <>
            <h2 className="text-2xl font-bold mb-4" style={{ color: 'var(--ink)' }}>
              Your conversation summary
            </h2>

            {/* Highlights from partial output */}
            {partialOutput?.conversationHighlights && partialOutput.conversationHighlights.length > 0 && (
              <div className="mb-4 p-3 rounded-lg" style={{ backgroundColor: 'var(--cream)' }}>
                <h3 className="font-medium text-sm mb-2" style={{ color: 'var(--forest)' }}>Topics Covered</h3>
                <div className="space-y-1">
                  {partialOutput.conversationHighlights.map((highlight, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-sm">
                      <span style={{ color: 'var(--terracotta)' }}>-</span>
                      <span style={{ color: 'var(--ink)' }}>{highlight}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <p className="text-gray-700 whitespace-pre-line text-sm">
                {summary}
              </p>
            </div>

            {/* PRD Outline Preview */}
            {partialOutput?.prdOutline && partialOutput.prdOutline.length > 0 && (
              <div className="mb-4 p-3 rounded-lg border" style={{ borderColor: 'var(--parchment)' }}>
                <h3 className="font-medium text-sm mb-2" style={{ color: 'var(--forest)' }}>
                  Product Brief Sections (Preview)
                </h3>
                <div className="flex flex-wrap gap-2">
                  {partialOutput.prdOutline.map((section, idx) => (
                    <span
                      key={idx}
                      className="text-xs px-2 py-1 rounded"
                      style={{ backgroundColor: 'var(--parchment)', color: 'var(--slate-blue)' }}
                    >
                      {section}
                    </span>
                  ))}
                </div>
                <p className="text-xs italic mt-2" style={{ color: 'var(--slate-blue)' }}>
                  Sign up to generate the full document
                </p>
              </div>
            )}

            <p className="text-sm mb-4" style={{ color: 'var(--slate-blue)' }}>
              Sign up to save this conversation and continue where you left off.
            </p>

            <div className="space-y-3">
              <button
                onClick={handleSignup}
                className="w-full font-medium py-3 px-6 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl"
                style={{ backgroundColor: 'var(--terracotta)', color: 'var(--cream)' }}
              >
                Sign up to save
              </button>

              <button
                onClick={() => setView('main')}
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
