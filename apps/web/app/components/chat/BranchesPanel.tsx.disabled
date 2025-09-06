'use client'

import { useState, useEffect } from 'react'
import { BranchInfo } from '@/lib/ai/conversation-branch'

interface BranchesPanelProps {
  conversationId: string
  workspaceId: string
  onNavigateToBranch: (conversationId: string) => void
  onMergeBranch: (branchId: string) => void
  onDeleteBranch: (branchId: string, deleteConversation: boolean) => void
  className?: string
}

interface BranchStats {
  totalBranches: number
  activeBranches: number
  mergedBranches: number
  totalMessages: number
}

export default function BranchesPanel({
  conversationId,
  workspaceId,
  onNavigateToBranch,
  onMergeBranch,
  onDeleteBranch,
  className = ''
}: BranchesPanelProps) {
  const [branches, setBranches] = useState<BranchInfo[]>([])
  const [sourceBranches, setSourceBranches] = useState<BranchInfo[]>([])
  const [stats, setStats] = useState<BranchStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'branches' | 'source'>('branches')
  const [expandedBranch, setExpandedBranch] = useState<string | null>(null)

  // Load branches
  const loadBranches = async () => {
    try {
      setLoading(true)
      
      // Load branches from this conversation
      const branchesResponse = await fetch(`/api/branches?conversationId=${conversationId}&workspaceId=${workspaceId}&action=list`)
      const branchesData = await branchesResponse.json()

      if (branchesData.success) {
        setBranches(branchesData.data.branches || [])
      }

      // Load source branches (if this is a branch itself)
      const sourceResponse = await fetch(`/api/branches?conversationId=${conversationId}&workspaceId=${workspaceId}&action=source`)
      const sourceData = await sourceResponse.json()

      if (sourceData.success) {
        setSourceBranches(sourceData.data.branches || [])
      }

      // Load stats
      const statsResponse = await fetch(`/api/branches?conversationId=${conversationId}&workspaceId=${workspaceId}&action=stats`)
      const statsData = await statsResponse.json()

      if (statsData.success) {
        setStats(statsData.data)
      }

    } catch (error) {
      console.error('Failed to load branches:', error)
    } finally {
      setLoading(false)
    }
  }

  // Delete branch
  const handleDeleteBranch = async (branchId: string, deleteConversation: boolean) => {
    try {
      const response = await fetch(`/api/branches?branchId=${branchId}&deleteConversation=${deleteConversation}&workspaceId=${workspaceId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        onDeleteBranch(branchId, deleteConversation)
        loadBranches() // Refresh
      }
    } catch (error) {
      console.error('Failed to delete branch:', error)
    }
  }

  // Merge branch
  const handleMergeBranch = async (branchId: string) => {
    try {
      const response = await fetch(`/api/branches?workspaceId=${workspaceId}&action=merge`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ branchId })
      })

      if (response.ok) {
        onMergeBranch(branchId)
        loadBranches() // Refresh
      }
    } catch (error) {
      console.error('Failed to merge branch:', error)
    }
  }

  // Format timestamp
  const formatTimestamp = (date: Date | string): string => {
    const now = new Date()
    const target = new Date(date)
    const diff = now.getTime() - target.getTime()
    const minutes = Math.floor(diff / (1000 * 60))
    
    if (minutes < 1) return 'Just now'
    if (minutes < 60) return `${minutes}m ago`
    if (minutes < 1440) return `${Math.floor(minutes / 60)}h ago`
    if (minutes < 10080) return `${Math.floor(minutes / 1440)}d ago`
    return target.toLocaleDateString()
  }

  // Get direction badge
  const getDirectionBadge = (direction?: string) => {
    const directionMap: Record<string, { label: string; color: string }> = {
      different_approach: { label: 'Different Approach', color: 'bg-purple-100 text-purple-800' },
      deeper_analysis: { label: 'Deeper Analysis', color: 'bg-blue-100 text-blue-800' },
      alternative_solution: { label: 'Alternative Solution', color: 'bg-green-100 text-green-800' },
      what_if_scenario: { label: 'What-If Scenario', color: 'bg-orange-100 text-orange-800' },
      different_perspective: { label: 'Different Perspective', color: 'bg-pink-100 text-pink-800' },
      simplified_approach: { label: 'Simplified Approach', color: 'bg-teal-100 text-teal-800' }
    }

    if (!direction || !directionMap[direction]) return null

    return (
      <span className={`px-2 py-1 text-xs rounded ${directionMap[direction].color}`}>
        {directionMap[direction].label}
      </span>
    )
  }

  useEffect(() => {
    loadBranches()
  }, [conversationId, workspaceId])

  const hasBranches = branches.length > 0
  const hasSourceBranches = sourceBranches.length > 0

  return (
    <div className={`branches-panel flex flex-col h-full bg-white ${className}`}>
      {/* Header */}
      <div className="flex-shrink-0 p-4 border-b border-divider">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-primary">Conversation Branches</h2>
          {stats && (
            <div className="text-xs text-secondary">
              {stats.totalBranches} total • {stats.activeBranches} active
            </div>
          )}
        </div>

        {/* Tabs */}
        {(hasBranches || hasSourceBranches) && (
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setActiveTab('branches')}
              className={`px-3 py-2 text-sm font-medium border-b-2 ${
                activeTab === 'branches'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              From Here ({branches.length})
            </button>
            {hasSourceBranches && (
              <button
                onClick={() => setActiveTab('source')}
                className={`px-3 py-2 text-sm font-medium border-b-2 ml-4 ${
                  activeTab === 'source'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Source ({sourceBranches.length})
              </button>
            )}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="p-4">
            <div className="animate-pulse space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="border border-gray-200 rounded-lg p-3">
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    <div className="h-3 bg-gray-200 rounded w-full"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : activeTab === 'branches' ? (
          // Branches created from this conversation
          branches.length === 0 ? (
            <div className="p-4 text-center">
              <div className="text-secondary text-sm">
                <div className="mb-2">
                  <svg className="w-12 h-12 mx-auto text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 16l2.879-2.879m0 0a3 3 0 104.243-4.242 3 3 0 00-4.243 4.242zM21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p>No branches created yet</p>
                <p className="text-xs mt-1">
                  Use the branch icon on any message to explore alternative directions
                </p>
              </div>
            </div>
          ) : (
            <div className="p-2 space-y-2">
              {branches.map((branch) => (
                <div
                  key={branch.id}
                  className="border border-gray-200 rounded-lg p-3 hover:bg-gray-50 transition-colors"
                >
                  {/* Branch Header */}
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1 min-w-0">
                      <button
                        onClick={() => onNavigateToBranch(branch.branch_conversation_id)}
                        className="text-left"
                      >
                        <h3 className="font-medium text-primary text-sm truncate hover:underline">
                          {branch.title}
                        </h3>
                      </button>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <span className="text-xs text-secondary">
                          {branch.messageCount} messages
                        </span>
                        <span className="text-xs text-secondary">
                          {formatTimestamp(branch.lastActivity)}
                        </span>
                        {getDirectionBadge(branch.alternative_direction)}
                      </div>
                    </div>
                    
                    {/* Actions */}
                    <div className="flex items-center gap-1 ml-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setExpandedBranch(expandedBranch === branch.id ? null : branch.id)
                        }}
                        className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                        title="More options"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  {/* Description */}
                  {branch.description && (
                    <p className="text-sm text-secondary mb-2 leading-relaxed">
                      {branch.description}
                    </p>
                  )}

                  {/* Preview */}
                  {branch.preview && (
                    <div className="text-sm text-secondary bg-gray-50 rounded p-2 mb-2 border-l-2 border-gray-300">
                      {branch.preview}
                    </div>
                  )}

                  {/* Expanded Actions */}
                  {expandedBranch === branch.id && (
                    <div className="mt-3 pt-3 border-t border-gray-200 flex gap-2 flex-wrap">
                      <button
                        onClick={() => onNavigateToBranch(branch.branch_conversation_id)}
                        className="px-3 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                      >
                        Open Branch
                      </button>
                      
                      {!branch.metadata?.merged && (
                        <button
                          onClick={() => handleMergeBranch(branch.id)}
                          className="px-3 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
                        >
                          Merge Back
                        </button>
                      )}
                      
                      <button
                        onClick={() => handleDeleteBranch(branch.id, false)}
                        className="px-3 py-1 text-xs bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
                      >
                        Remove Branch Link
                      </button>
                      
                      <button
                        onClick={() => handleDeleteBranch(branch.id, true)}
                        className="px-3 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                      >
                        Delete Conversation
                      </button>
                    </div>
                  )}

                  {/* Merge Status */}
                  {branch.metadata?.merged && (
                    <div className="mt-2 text-xs text-green-600 bg-green-50 rounded px-2 py-1">
                      ✓ Merged back on {new Date(branch.metadata.merged_at).toLocaleDateString()}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )
        ) : (
          // Source branches (if this conversation is a branch)
          sourceBranches.length === 0 ? (
            <div className="p-4 text-center">
              <div className="text-secondary text-sm">
                <p>This conversation is not a branch</p>
              </div>
            </div>
          ) : (
            <div className="p-2 space-y-2">
              {sourceBranches.map((source) => (
                <div
                  key={source.id}
                  className="border border-blue-200 bg-blue-50 rounded-lg p-3 hover:bg-blue-100 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <button
                        onClick={() => onNavigateToBranch(source.source_conversation_id)}
                        className="text-left"
                      >
                        <h3 className="font-medium text-blue-900 text-sm truncate hover:underline">
                          Original: {source.conversation?.title || 'Untitled'}
                        </h3>
                      </button>
                      <p className="text-xs text-blue-700 mt-1">
                        This conversation was branched from the original
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )
        )}
      </div>

      {/* Footer Stats */}
      {stats && stats.totalBranches > 0 && (
        <div className="flex-shrink-0 p-3 border-t border-divider bg-gray-50 text-xs text-secondary">
          <div className="flex justify-between">
            <span>Active: {stats.activeBranches}</span>
            <span>Merged: {stats.mergedBranches}</span>
            <span>Messages: {stats.totalMessages}</span>
          </div>
        </div>
      )}
    </div>
  )
}