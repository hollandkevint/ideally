import { NextRequest, NextResponse } from 'next/server'
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { createBookmarkReferenceManager, ReferenceCreateData } from '@/lib/ai/bookmark-reference-manager'

interface ReferenceRequest {
  fromMessageId: string
  toMessageId: string
  referenceType: 'follow_up' | 'related' | 'contradiction' | 'builds_on' | 'question' | 'answer'
  description?: string
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
    const body: ReferenceRequest = await request.json()

    const { fromMessageId, toMessageId, referenceType, description } = body

    if (!fromMessageId || !toMessageId || !referenceType) {
      return NextResponse.json(
        { error: 'From message ID, to message ID, and reference type are required' },
        { status: 400 }
      )
    }

    if (fromMessageId === toMessageId) {
      return NextResponse.json(
        { error: 'Cannot create reference to the same message' },
        { status: 400 }
      )
    }

    const manager = createBookmarkReferenceManager(userId)
    
    const referenceData: ReferenceCreateData = {
      fromMessageId,
      toMessageId,
      referenceType,
      description: description?.trim()
    }

    const reference = await manager.createReference(referenceData)

    return NextResponse.json({
      success: true,
      data: reference
    })

  } catch (error: any) {
    console.error('Create reference error:', error)
    return NextResponse.json(
      { 
        success: false,
        error: error.message || 'Failed to create reference' 
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
    
    const messageId = searchParams.get('messageId')
    const conversationId = searchParams.get('conversationId')
    const direction = searchParams.get('direction') as 'from' | 'to' | 'both' || 'both'
    const action = searchParams.get('action')

    const manager = createBookmarkReferenceManager(userId)

    switch (action) {
      case 'message': {
        if (!messageId) {
          return NextResponse.json(
            { error: 'Message ID is required for message references' },
            { status: 400 }
          )
        }

        const references = await manager.getMessageReferences(messageId, direction)
        return NextResponse.json({
          success: true,
          data: { references }
        })
      }

      case 'conversation': {
        if (!conversationId) {
          return NextResponse.json(
            { error: 'Conversation ID is required for conversation references' },
            { status: 400 }
          )
        }

        const references = await manager.getConversationReferences(conversationId)
        return NextResponse.json({
          success: true,
          data: { references }
        })
      }

      case 'related': {
        if (!messageId) {
          return NextResponse.json(
            { error: 'Message ID is required for related messages' },
            { status: 400 }
          )
        }

        const relatedData = await manager.getRelatedMessages(messageId)
        return NextResponse.json({
          success: true,
          data: relatedData
        })
      }

      default: {
        if (messageId) {
          const references = await manager.getMessageReferences(messageId, direction)
          return NextResponse.json({
            success: true,
            data: { references }
          })
        } else {
          return NextResponse.json(
            { error: 'Message ID or specific action is required' },
            { status: 400 }
          )
        }
      }
    }

  } catch (error: any) {
    console.error('Get references error:', error)
    return NextResponse.json(
      { 
        success: false,
        error: error.message || 'Failed to get references' 
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
    const referenceId = request.nextUrl.searchParams.get('id')
    
    if (!referenceId) {
      return NextResponse.json(
        { error: 'Reference ID is required' },
        { status: 400 }
      )
    }

    const manager = createBookmarkReferenceManager(userId)
    await manager.deleteReference(referenceId)

    return NextResponse.json({
      success: true,
      message: 'Reference deleted successfully'
    })

  } catch (error: any) {
    console.error('Delete reference error:', error)
    return NextResponse.json(
      { 
        success: false,
        error: error.message || 'Failed to delete reference' 
      },
      { status: 500 }
    )
  }
}