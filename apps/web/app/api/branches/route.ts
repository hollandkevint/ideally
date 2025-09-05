import { NextRequest, NextResponse } from 'next/server'
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { ConversationBranchManager, BranchOptions } from '@/lib/ai/conversation-branch'

interface CreateBranchRequest {
  sourceConversationId: string
  startFromMessageId: string
  title?: string
  description?: string
  alternativeDirection?: string
  preserveContext?: boolean
}

interface MergeBranchRequest {
  branchId: string
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
    const action = request.nextUrl.searchParams.get('action') || 'create'
    const workspaceId = request.nextUrl.searchParams.get('workspaceId') || undefined
    
    const branchManager = await ConversationBranchManager.create(userId, workspaceId)

    if (action === 'create') {
      const body: CreateBranchRequest = await request.json()

      // Validate required fields
      if (!body.sourceConversationId || !body.startFromMessageId) {
        return NextResponse.json(
          { error: 'Source conversation ID and start message ID are required' },
          { status: 400 }
        )
      }

      const options: BranchOptions = {
        title: body.title,
        description: body.description,
        startFromMessageId: body.startFromMessageId,
        alternativeDirection: body.alternativeDirection,
        preserveContext: body.preserveContext ?? true
      }

      const result = await branchManager.createBranch(body.sourceConversationId, options)

      if (!result.success) {
        return NextResponse.json(
          { 
            success: false,
            error: result.error || 'Failed to create branch' 
          },
          { status: 400 }
        )
      }

      return NextResponse.json({
        success: true,
        data: {
          branchId: result.branchId,
          newConversationId: result.newConversationId,
          branchPoint: result.branchPoint
        }
      })
    }

    if (action === 'merge') {
      const body: MergeBranchRequest = await request.json()

      if (!body.branchId) {
        return NextResponse.json(
          { error: 'Branch ID is required' },
          { status: 400 }
        )
      }

      const success = await branchManager.mergeBranch(body.branchId)

      if (!success) {
        return NextResponse.json(
          { 
            success: false,
            error: 'Failed to merge branch' 
          },
          { status: 400 }
        )
      }

      return NextResponse.json({
        success: true,
        data: { merged: true }
      })
    }

    return NextResponse.json(
      { error: 'Invalid action parameter' },
      { status: 400 }
    )

  } catch (error: any) {
    console.error('Branch API error:', error)
    
    return NextResponse.json(
      { 
        success: false,
        error: error.message || 'Branch operation failed' 
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
    
    const conversationId = searchParams.get('conversationId')
    const action = searchParams.get('action') || 'list'
    const workspaceId = searchParams.get('workspaceId') || undefined

    if (!conversationId) {
      return NextResponse.json(
        { error: 'Conversation ID is required' },
        { status: 400 }
      )
    }

    const branchManager = await ConversationBranchManager.create(userId, workspaceId)

    if (action === 'list') {
      const branches = await branchManager.getBranches(conversationId)

      return NextResponse.json({
        success: true,
        data: { branches }
      })
    }

    if (action === 'source') {
      const sourceBranches = await branchManager.getSourceBranches(conversationId)

      return NextResponse.json({
        success: true,
        data: { branches: sourceBranches }
      })
    }

    if (action === 'stats') {
      const stats = await branchManager.getBranchStats(conversationId)

      return NextResponse.json({
        success: true,
        data: stats
      })
    }

    return NextResponse.json(
      { error: 'Invalid action parameter' },
      { status: 400 }
    )

  } catch (error: any) {
    console.error('Branch GET API error:', error)
    
    return NextResponse.json(
      { 
        success: false,
        error: error.message || 'Failed to retrieve branches' 
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
    const searchParams = request.nextUrl.searchParams
    
    const branchId = searchParams.get('branchId')
    const deleteConversation = searchParams.get('deleteConversation') === 'true'
    const workspaceId = searchParams.get('workspaceId') || undefined

    if (!branchId) {
      return NextResponse.json(
        { error: 'Branch ID is required' },
        { status: 400 }
      )
    }

    const branchManager = await ConversationBranchManager.create(userId, workspaceId)
    const success = await branchManager.deleteBranch(branchId, deleteConversation)

    if (!success) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Failed to delete branch' 
        },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      data: { deleted: true }
    })

  } catch (error: any) {
    console.error('Branch DELETE API error:', error)
    
    return NextResponse.json(
      { 
        success: false,
        error: error.message || 'Failed to delete branch' 
      },
      { status: 500 }
    )
  }
}