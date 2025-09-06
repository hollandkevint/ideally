import { NextRequest, NextResponse } from 'next/server'
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { createBookmarkReferenceManager, BookmarkCreateData } from '@/lib/ai/bookmark-reference-manager'

interface BookmarkRequest {
  messageId: string
  title: string
  description?: string
  tags?: string[]
  color?: 'blue' | 'green' | 'yellow' | 'red' | 'purple' | 'pink' | 'indigo'
}

interface BookmarkUpdateRequest {
  title?: string
  description?: string
  tags?: string[]
  color?: 'blue' | 'green' | 'yellow' | 'red' | 'purple' | 'pink' | 'indigo'
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
    const body: BookmarkRequest = await request.json()

    const { messageId, title, description, tags, color } = body

    if (!messageId || !title) {
      return NextResponse.json(
        { error: 'Message ID and title are required' },
        { status: 400 }
      )
    }

    const manager = createBookmarkReferenceManager(userId)
    
    const bookmarkData: BookmarkCreateData = {
      messageId,
      title: title.trim(),
      description: description?.trim(),
      tags: tags?.map(tag => tag.trim()).filter(tag => tag.length > 0) || [],
      color: color || 'blue'
    }

    const bookmark = await manager.createBookmark(bookmarkData)

    return NextResponse.json({
      success: true,
      data: bookmark
    })

  } catch (error: unknown) {
    console.error('Create bookmark error:', error)
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create bookmark' 
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
    
    const workspaceId = searchParams.get('workspaceId') || undefined
    const messageId = searchParams.get('messageId')
    const action = searchParams.get('action')
    const limit = parseInt(searchParams.get('limit') || '50')
    const query = searchParams.get('query') || ''
    const tags = searchParams.get('tags')?.split(',').filter(Boolean) || []

    const manager = createBookmarkReferenceManager(userId)

    switch (action) {
      case 'message': {
        if (!messageId) {
          return NextResponse.json(
            { error: 'Message ID is required for message bookmarks' },
            { status: 400 }
          )
        }

        const bookmarks = await manager.getMessageBookmarks(messageId)
        return NextResponse.json({
          success: true,
          data: { bookmarks }
        })
      }

      case 'search': {
        const bookmarks = await manager.searchBookmarks(query, tags, limit)
        return NextResponse.json({
          success: true,
          data: { bookmarks }
        })
      }

      case 'tags': {
        const tagStats = await manager.getBookmarkTags(workspaceId)
        return NextResponse.json({
          success: true,
          data: { tags: tagStats }
        })
      }

      case 'stats': {
        const stats = await manager.getBookmarkStats(workspaceId)
        return NextResponse.json({
          success: true,
          data: stats
        })
      }

      case 'export': {
        const exportData = await manager.exportBookmarks(workspaceId)
        return NextResponse.json({
          success: true,
          data: exportData
        })
      }

      case 'suggest': {
        if (!messageId) {
          return NextResponse.json(
            { error: 'Message ID is required for suggestions' },
            { status: 400 }
          )
        }

        const messageContent = searchParams.get('content') || ''
        const suggestions = await manager.suggestBookmarkData(messageId, messageContent)
        
        return NextResponse.json({
          success: true,
          data: suggestions
        })
      }

      default: {
        // Default: get all bookmarks
        const bookmarks = await manager.getBookmarks(workspaceId, limit)
        return NextResponse.json({
          success: true,
          data: { bookmarks }
        })
      }
    }

  } catch (error: unknown) {
    console.error('Get bookmarks error:', error)
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get bookmarks' 
      },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
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
    const bookmarkId = request.nextUrl.searchParams.get('id')
    
    if (!bookmarkId) {
      return NextResponse.json(
        { error: 'Bookmark ID is required' },
        { status: 400 }
      )
    }

    const body: BookmarkUpdateRequest = await request.json()
    const manager = createBookmarkReferenceManager(userId)
    
    const updates = {
      title: body.title?.trim(),
      description: body.description?.trim(),
      tags: body.tags?.map(tag => tag.trim()).filter(tag => tag.length > 0),
      color: body.color
    }

    const bookmark = await manager.updateBookmark(bookmarkId, updates)

    return NextResponse.json({
      success: true,
      data: bookmark
    })

  } catch (error: unknown) {
    console.error('Update bookmark error:', error)
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update bookmark' 
      },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
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
    const bookmarkId = request.nextUrl.searchParams.get('id')
    
    if (!bookmarkId) {
      return NextResponse.json(
        { error: 'Bookmark ID is required' },
        { status: 400 }
      )
    }

    const manager = createBookmarkReferenceManager(userId)
    await manager.deleteBookmark(bookmarkId)

    return NextResponse.json({
      success: true,
      message: 'Bookmark deleted successfully'
    })

  } catch (error: unknown) {
    console.error('Delete bookmark error:', error)
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete bookmark' 
      },
      { status: 500 }
    )
  }
}