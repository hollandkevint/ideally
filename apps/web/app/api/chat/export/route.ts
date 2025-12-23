import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  exportChatToMarkdown,
  exportChatToText,
  exportChatToJSON,
  validateMessages,
  type ChatMessage,
} from '@/lib/export/chat-export';

export async function POST(request: NextRequest) {
  try {
    const { workspaceId, format = 'markdown' } = await request.json();

    // Validate request
    if (!workspaceId) {
      return NextResponse.json(
        { error: 'Missing workspaceId' },
        { status: 400 }
      );
    }

    if (!['markdown', 'text', 'json'].includes(format)) {
      return NextResponse.json(
        { error: 'Invalid format. Must be markdown, text, or json' },
        { status: 400 }
      );
    }

    // Get user context
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get workspace data
    const { data: workspace, error: workspaceError } = await supabase
      .from('user_workspace')
      .select('user_id, workspace_state')
      .eq('user_id', user.id)
      .single();

    if (workspaceError || !workspace) {
      return NextResponse.json(
        { error: 'Workspace not found' },
        { status: 404 }
      );
    }

    // Extract chat messages
    const chatContext = workspace.workspace_state?.chat_context || [];

    // Validate messages
    const validation = validateMessages(chatContext);
    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.error || 'Invalid messages' },
        { status: 400 }
      );
    }

    // Get workspace name
    const workspaceName =
      workspace.workspace_state?.name || 'Strategic Session';

    // Export based on format
    let result;
    switch (format) {
      case 'markdown':
        result = exportChatToMarkdown(chatContext, {
          workspaceName,
          includeMetadata: true,
          includeTimestamps: true,
        });
        break;
      case 'text':
        result = exportChatToText(chatContext, {
          workspaceName,
          includeMetadata: true,
          includeTimestamps: true,
        });
        break;
      case 'json':
        result = exportChatToJSON(chatContext, { workspaceName });
        break;
      default:
        return NextResponse.json(
          { error: 'Invalid format' },
          { status: 400 }
        );
    }

    if (!result.success || !result.content) {
      return NextResponse.json(
        { error: result.error || 'Export failed' },
        { status: 500 }
      );
    }

    // Return export data
    return NextResponse.json({
      success: true,
      content: result.content,
      fileName: result.fileName,
      format: result.format,
    });
  } catch (error) {
    console.error('Chat export API error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Chat export endpoint ready',
    supportedFormats: ['markdown', 'text', 'json'],
    timestamp: new Date().toISOString(),
  });
}
