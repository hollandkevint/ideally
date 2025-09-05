import { NextRequest, NextResponse } from 'next/server'
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { createConversationSearchService, SearchOptions } from '@/lib/ai/conversation-search'

interface SearchRequest {
  query: string
  filters?: {
    workspaceId?: string
    dateRange?: {
      start: string
      end: string
    }
    messageRole?: 'user' | 'assistant' | 'both'
    conversationIds?: string[]
    includeContext?: boolean
    resultTypes?: Array<'message' | 'conversation' | 'context'>
  }
  limit?: number
  fuzzySearch?: boolean
  highlightMatches?: boolean
}

interface ConversationSearchRequest {
  conversationId: string
  query: string
  limit?: number
}

interface SuggestionsRequest {
  query: string
  limit?: number
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerComponentClient({ cookies })
    
    // Verify authentication
    const { data: { session }, error: authError } = await supabase.auth.getSession()
    if (authError || !session) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const userId = session.user.id
    const body = await request.json()
    const searchType = request.nextUrl.searchParams.get('type') || 'general'

    switch (searchType) {
      case 'general': {
        const {
          query,
          filters = {},
          limit = 20,
          fuzzySearch = false,
          highlightMatches = true
        }: SearchRequest = body

        if (!query || query.trim().length < 2) {
          return NextResponse.json(
            { error: 'Query must be at least 2 characters long' },
            { status: 400 }
          )
        }

        // Convert date strings to Date objects
        const searchFilters = {
          ...filters,
          dateRange: filters.dateRange ? {
            start: new Date(filters.dateRange.start),
            end: new Date(filters.dateRange.end)
          } : undefined
        }

        const searchService = createConversationSearchService(userId, filters.workspaceId)
        
        const searchOptions: SearchOptions = {
          query,
          filters: searchFilters,
          limit,
          fuzzySearch,
          highlightMatches
        }

        const results = await searchService.search(searchOptions)

        return NextResponse.json({
          success: true,
          data: results
        })
      }

      case 'conversation': {
        const { conversationId, query, limit = 10 }: ConversationSearchRequest = body

        if (!conversationId || !query || query.trim().length < 2) {
          return NextResponse.json(
            { error: 'Conversation ID and query are required' },
            { status: 400 }
          )
        }

        const searchService = createConversationSearchService(userId)
        const results = await searchService.searchInConversation(conversationId, query, limit)

        return NextResponse.json({
          success: true,
          data: {
            results,
            totalCount: results.length,
            searchTime: 0
          }
        })
      }

      case 'suggestions': {
        const { query, limit = 5 }: SuggestionsRequest = body

        if (!query || query.trim().length < 1) {
          return NextResponse.json({
            success: true,
            data: { suggestions: [] }
          })
        }

        const searchService = createConversationSearchService(userId)
        const suggestions = await searchService.getSuggestions(query, limit)

        return NextResponse.json({
          success: true,
          data: { suggestions }
        })
      }

      default: {
        return NextResponse.json(
          { error: 'Invalid search type' },
          { status: 400 }
        )
      }
    }

  } catch (error: any) {
    console.error('Search API error:', error)
    
    return NextResponse.json(
      { 
        success: false,
        error: error.message || 'Internal server error' 
      },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerComponentClient({ cookies })
    
    // Verify authentication
    const { data: { session }, error: authError } = await supabase.auth.getSession()
    if (authError || !session) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const userId = session.user.id
    const searchParams = request.nextUrl.searchParams
    const action = searchParams.get('action')

    switch (action) {
      case 'suggestions': {
        const query = searchParams.get('query') || ''
        const limit = parseInt(searchParams.get('limit') || '5')
        const workspaceId = searchParams.get('workspaceId') || undefined

        if (query.length < 1) {
          return NextResponse.json({
            success: true,
            data: { suggestions: [] }
          })
        }

        const searchService = createConversationSearchService(userId, workspaceId)
        const suggestions = await searchService.getSuggestions(query, limit)

        return NextResponse.json({
          success: true,
          data: { suggestions }
        })
      }

      case 'quick-search': {
        const query = searchParams.get('query') || ''
        const workspaceId = searchParams.get('workspaceId') || undefined
        const limit = parseInt(searchParams.get('limit') || '5')

        if (query.length < 2) {
          return NextResponse.json({
            success: true,
            data: { results: [], totalCount: 0, searchTime: 0 }
          })
        }

        const searchService = createConversationSearchService(userId, workspaceId)
        
        const results = await searchService.search({
          query,
          filters: { 
            workspaceId,
            resultTypes: ['conversation', 'message'] // Quick search excludes context
          },
          limit,
          highlightMatches: false // Skip highlighting for quick search
        })

        return NextResponse.json({
          success: true,
          data: results
        })
      }

      default: {
        return NextResponse.json(
          { error: 'Invalid action parameter' },
          { status: 400 }
        )
      }
    }

  } catch (error: any) {
    console.error('Search GET API error:', error)
    
    return NextResponse.json(
      { 
        success: false,
        error: error.message || 'Internal server error' 
      },
      { status: 500 }
    )
  }
}