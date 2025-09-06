import { NextRequest, NextResponse } from 'next/server'
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { createConversationExporter, ExportOptions, ExportFormat } from '@/lib/ai/conversation-export'

interface ExportRequest {
  format: ExportFormat
  includeMetadata?: boolean
  includeBookmarks?: boolean
  includeReferences?: boolean
  includeContext?: boolean
  includeSummaries?: boolean
  dateRange?: {
    start: string
    end: string
  }
  conversationIds?: string[]
  maxMessages?: number
}

interface PreviewRequest {
  format: ExportFormat
  dateRange?: {
    start: string
    end: string
  }
  conversationIds?: string[]
  maxMessages?: number
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
    const action = request.nextUrl.searchParams.get('action') || 'export'
    const workspaceId = request.nextUrl.searchParams.get('workspaceId') || undefined
    
    const exporter = createConversationExporter(userId, workspaceId)

    if (action === 'preview') {
      const body: PreviewRequest = await request.json()
      
      const options: ExportOptions = {
        format: body.format,
        dateRange: body.dateRange ? {
          start: new Date(body.dateRange.start),
          end: new Date(body.dateRange.end)
        } : undefined,
        conversationIds: body.conversationIds,
        maxMessages: body.maxMessages
      }

      const preview = await exporter.getExportPreview(options)

      return NextResponse.json({
        success: true,
        data: preview
      })
    }

    if (action === 'export') {
      const body: ExportRequest = await request.json()

      // Validate format
      const validFormats: ExportFormat[] = ['json', 'csv', 'markdown', 'pdf', 'txt']
      if (!validFormats.includes(body.format)) {
        return NextResponse.json(
          { error: 'Invalid export format. Supported formats: json, csv, markdown, pdf, txt' },
          { status: 400 }
        )
      }

      const options: ExportOptions = {
        format: body.format,
        includeMetadata: body.includeMetadata ?? true,
        includeBookmarks: body.includeBookmarks ?? false,
        includeReferences: body.includeReferences ?? false,
        includeContext: body.includeContext ?? false,
        includeSummaries: body.includeSummaries ?? false,
        dateRange: body.dateRange ? {
          start: new Date(body.dateRange.start),
          end: new Date(body.dateRange.end)
        } : undefined,
        conversationIds: body.conversationIds,
        maxMessages: body.maxMessages
      }

      const result = await exporter.exportConversations(options)

      // For text-based formats, return as JSON with content
      if (['json', 'csv', 'markdown', 'txt'].includes(body.format)) {
        return NextResponse.json({
          success: true,
          data: {
            filename: result.filename,
            content: result.content,
            size: result.size,
            format: result.format,
            metadata: result.metadata
          }
        })
      }

      // For PDF (HTML), return as downloadable response
      if (body.format === 'pdf') {
        const headers = new Headers()
        headers.set('Content-Type', 'text/html')
        headers.set('Content-Disposition', `attachment; filename="${result.filename}"`)
        
        return new NextResponse(result.content as string, {
          status: 200,
          headers
        })
      }
    }

    return NextResponse.json(
      { error: 'Invalid action parameter' },
      { status: 400 }
    )

  } catch (error: any) {
    console.error('Export API error:', error)
    
    return NextResponse.json(
      { 
        success: false,
        error: error.message || 'Export failed' 
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
    const workspaceId = searchParams.get('workspaceId') || undefined
    const conversationId = searchParams.get('conversationId')
    const format = searchParams.get('format') as ExportFormat || 'json'

    const exporter = createConversationExporter(userId, workspaceId)

    if (action === 'single' && conversationId) {
      // Quick export of single conversation
      const options: ExportOptions = {
        format,
        includeMetadata: true,
        includeBookmarks: true,
        includeReferences: true,
        includeContext: true
      }

      const result = await exporter.exportConversation(conversationId, options)

      if (['json', 'csv', 'markdown', 'txt'].includes(format)) {
        const headers = new Headers()
        
        // Set appropriate content type
        switch (format) {
          case 'json':
            headers.set('Content-Type', 'application/json')
            break
          case 'csv':
            headers.set('Content-Type', 'text/csv')
            break
          case 'markdown':
            headers.set('Content-Type', 'text/markdown')
            break
          case 'txt':
            headers.set('Content-Type', 'text/plain')
            break
        }
        
        headers.set('Content-Disposition', `attachment; filename="${result.filename}"`)
        
        return new NextResponse(result.content as string, {
          status: 200,
          headers
        })
      }
    }

    if (action === 'formats') {
      // Return available export formats with descriptions
      const formats = {
        json: {
          name: 'JSON',
          description: 'Complete structured data with all metadata',
          extension: '.json',
          supports: ['metadata', 'bookmarks', 'references', 'context']
        },
        csv: {
          name: 'CSV',
          description: 'Tabular format for spreadsheet analysis',
          extension: '.csv',
          supports: ['metadata', 'bookmarks']
        },
        markdown: {
          name: 'Markdown',
          description: 'Human-readable format with formatting',
          extension: '.md',
          supports: ['metadata', 'bookmarks', 'references', 'context']
        },
        txt: {
          name: 'Plain Text',
          description: 'Simple text format for basic reading',
          extension: '.txt',
          supports: ['metadata']
        },
        pdf: {
          name: 'PDF',
          description: 'Print-ready format with rich formatting',
          extension: '.html',
          supports: ['metadata', 'bookmarks', 'context'],
          note: 'Returns HTML that can be converted to PDF'
        }
      }

      return NextResponse.json({
        success: true,
        data: { formats }
      })
    }

    return NextResponse.json(
      { error: 'Invalid action or missing parameters' },
      { status: 400 }
    )

  } catch (error: any) {
    console.error('Export GET API error:', error)
    
    return NextResponse.json(
      { 
        success: false,
        error: error.message || 'Export failed' 
      },
      { status: 500 }
    )
  }
}