'use client'

import { useState } from 'react'
import { FeatureBrief, ExportFormat } from '@/lib/bmad/types'
import { downloadFile, copyToClipboard } from '@/lib/bmad/exports/brief-formatters'

interface ExportOptionsProps {
  brief: FeatureBrief
  sessionId: string
  onExport?: (format: ExportFormat) => void
  className?: string
}

export default function ExportOptions({
  brief,
  sessionId,
  onExport,
  className = ''
}: ExportOptionsProps) {
  const [isExporting, setIsExporting] = useState(false)
  const [exportingFormat, setExportingFormat] = useState<string | null>(null)
  const [copySuccess, setCopySuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleExport = async (format: 'markdown' | 'text' | 'pdf') => {
    setIsExporting(true)
    setExportingFormat(format)
    setError(null)

    try {
      const response = await fetch('/api/bmad', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'export_feature_brief',
          sessionId,
          briefId: brief.id,
          format
        })
      })

      if (!response.ok) {
        throw new Error(`Failed to export as ${format}`)
      }

      const data = await response.json()
      const exportData: ExportFormat = data.export

      // Download the file
      downloadFile(exportData.content, exportData.filename, format)

      // Notify parent
      onExport?.(exportData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Export failed')
    } finally {
      setIsExporting(false)
      setExportingFormat(null)
    }
  }

  const handleCopyToClipboard = async () => {
    try {
      const response = await fetch('/api/bmad', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'export_feature_brief',
          sessionId,
          briefId: brief.id,
          format: 'markdown'
        })
      })

      if (!response.ok) {
        throw new Error('Failed to generate markdown')
      }

      const data = await response.json()
      const success = await copyToClipboard(data.export.content)

      if (success) {
        setCopySuccess(true)
        setTimeout(() => setCopySuccess(false), 3000)
      } else {
        throw new Error('Failed to copy to clipboard')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Copy failed')
    }
  }

  const handleEmailShare = async () => {
    try {
      const response = await fetch('/api/bmad', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'export_feature_brief',
          sessionId,
          briefId: brief.id,
          format: 'text'
        })
      })

      if (!response.ok) {
        throw new Error('Failed to generate email content')
      }

      const data = await response.json()
      const subject = encodeURIComponent(`Feature Brief: ${brief.title}`)
      const body = encodeURIComponent(data.export.content)

      window.location.href = `mailto:?subject=${subject}&body=${body}`
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Email share failed')
    }
  }

  return (
    <div className={`export-options ${className}`}>
      <div className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-lg border border-gray-200 p-6">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Export & Share Options
          </h3>
          <p className="text-sm text-gray-600">
            Download your feature brief in multiple formats or share with your team
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Download Options */}
        <div className="space-y-3 mb-6">
          <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">
            Download
          </h4>

          <div className="grid md:grid-cols-3 gap-3">
            {/* Markdown Download */}
            <button
              onClick={() => handleExport('markdown')}
              disabled={isExporting}
              className="flex flex-col items-center p-4 bg-white border-2 border-blue-200 rounded-lg hover:border-blue-400 hover:shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="text-3xl mb-2">📄</span>
              <span className="text-sm font-semibold text-gray-900">Markdown</span>
              <span className="text-xs text-gray-500 text-center mt-1">
                For documentation & wikis
              </span>
              {isExporting && exportingFormat === 'markdown' && (
                <span className="text-xs text-blue-600 mt-2">Exporting...</span>
              )}
            </button>

            {/* Text Download */}
            <button
              onClick={() => handleExport('text')}
              disabled={isExporting}
              className="flex flex-col items-center p-4 bg-white border-2 border-green-200 rounded-lg hover:border-green-400 hover:shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="text-3xl mb-2">📝</span>
              <span className="text-sm font-semibold text-gray-900">Plain Text</span>
              <span className="text-xs text-gray-500 text-center mt-1">
                For emails & basic docs
              </span>
              {isExporting && exportingFormat === 'text' && (
                <span className="text-xs text-green-600 mt-2">Exporting...</span>
              )}
            </button>

            {/* PDF Download */}
            <button
              onClick={() => handleExport('pdf')}
              disabled={isExporting}
              className="flex flex-col items-center p-4 bg-white border-2 border-purple-200 rounded-lg hover:border-purple-400 hover:shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="text-3xl mb-2">📑</span>
              <span className="text-sm font-semibold text-gray-900">PDF</span>
              <span className="text-xs text-gray-500 text-center mt-1">
                For professional sharing
              </span>
              {isExporting && exportingFormat === 'pdf' && (
                <span className="text-xs text-purple-600 mt-2">Exporting...</span>
              )}
            </button>
          </div>
        </div>

        {/* Share Options */}
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">
            Share
          </h4>

          <div className="flex flex-wrap gap-3">
            {/* Copy to Clipboard */}
            <button
              onClick={handleCopyToClipboard}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <span className="text-lg">📋</span>
              <span className="text-sm font-medium text-gray-700">
                {copySuccess ? '✓ Copied!' : 'Copy to Clipboard'}
              </span>
            </button>

            {/* Email Share */}
            <button
              onClick={handleEmailShare}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <span className="text-lg">📧</span>
              <span className="text-sm font-medium text-gray-700">
                Share via Email
              </span>
            </button>
          </div>
        </div>

        {/* Format Guide */}
        <div className="mt-6 pt-4 border-t border-gray-200">
          <details className="text-sm">
            <summary className="font-medium text-gray-700 cursor-pointer hover:text-gray-900">
              Format Guide
            </summary>
            <div className="mt-3 space-y-2 text-gray-600">
              <div>
                <span className="font-semibold">Markdown:</span> Best for GitHub, Notion, Confluence, and other documentation platforms. Preserves formatting and links.
              </div>
              <div>
                <span className="font-semibold">Plain Text:</span> Universal format for email, Slack, or any basic text editor. Simple and widely compatible.
              </div>
              <div>
                <span className="font-semibold">PDF:</span> Professional format for presentations, formal sharing, or archiving. Maintains exact layout and styling.
              </div>
            </div>
          </details>
        </div>

        {/* Integration Note */}
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-xs text-blue-800">
            <span className="font-semibold">💡 Tip:</span> Use Markdown format to import directly into Jira, Linear, or Asana. Copy the content and paste into your issue tracker.
          </p>
        </div>
      </div>
    </div>
  )
}