import { NextRequest } from 'next/server';
import { claudeClient } from '@/lib/ai/claude-client';
import { StreamEncoder, createStreamHeaders } from '@/lib/ai/streaming';
import { createClient } from '@/lib/supabase/server';
import { CoachingContext } from '@/lib/ai/mary-persona';
import { WorkspaceContextBuilder, ConversationContextManager } from '@/lib/ai/workspace-context';

export async function POST(request: NextRequest) {
  try {
    const { message, workspaceId, conversationHistory, coachingContext } = await request.json();

    // Log incoming request (sanitized)
    console.log('[Chat Stream] Incoming request:', {
      messageLength: message?.length || 0,
      workspaceId,
      historyLength: conversationHistory?.length || 0,
      hasCoachingContext: !!coachingContext,
      timestamp: new Date().toISOString()
    });

    // Validate request
    if (!message || !workspaceId) {
      console.error('[Chat Stream] Validation failed:', { hasMessage: !!message, hasWorkspaceId: !!workspaceId });
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Get user context
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      console.error('[Chat Stream] Authentication failed:', {
        error: authError?.message || 'No user',
        timestamp: new Date().toISOString()
      });
      return new Response(JSON.stringify({ error: 'Unauthorized', details: authError?.message }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    console.log('[Chat Stream] User authenticated:', {
      userId: user.id,
      userEmail: user.email
    });

    // Verify workspace access - using user_workspace table
    console.log('[Chat Stream] Looking up workspace:', {
      queryUserId: user.id,
      requestWorkspaceId: workspaceId
    });

    const { data: workspace, error: workspaceError } = await supabase
      .from('user_workspace')
      .select('user_id, workspace_state')
      .eq('user_id', user.id)
      .single();

    if (workspaceError || !workspace) {
      console.error('[Chat Stream] Workspace lookup error:', {
        error: workspaceError?.message || 'No workspace found',
        code: workspaceError?.code,
        details: workspaceError?.details,
        hint: workspaceError?.hint,
        userId: user.id
      });
      return new Response(JSON.stringify({
        error: 'Workspace not found',
        details: workspaceError?.message,
        hint: 'Make sure you have created a workspace. Try signing out and back in.'
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    console.log('[Chat Stream] Workspace found:', {
      workspaceUserId: workspace.user_id,
      hasState: !!workspace.workspace_state
    });

    // Build or use provided coaching context
    let finalCoachingContext: CoachingContext | undefined = coachingContext;
    
    if (!finalCoachingContext) {
      try {
        // Try to get current BMad session data
        const { data: bmadSession } = await supabase
          .from('bmad_sessions')
          .select('*')
          .eq('workspace_id', workspaceId)
          .eq('status', 'active')
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        finalCoachingContext = await WorkspaceContextBuilder.buildCoachingContext(
          workspaceId,
          user.id,
          bmadSession
        );
      } catch (error) {
        console.warn('Could not build coaching context:', error);
        // Continue without context
      }
    }

    // Prepare conversation context management
    const historyWithContext = conversationHistory || [];
    const managedHistory = ConversationContextManager.pruneConversationHistory(
      historyWithContext,
      6000 // Leave room for response
    );

    console.log('[Chat Stream] Preparing to call Claude:', {
      messageLength: message.length,
      historyMessages: managedHistory.length,
      hasCoachingContext: !!finalCoachingContext
    });

    const encoder = new StreamEncoder();

    // Create streaming response
    const stream = new ReadableStream({
      async start(controller) {
        try {
          console.log('[Chat Stream] Stream started, sending metadata');

          // Send initial metadata
          controller.enqueue(encoder.encodeMetadata({
            coachingContext: finalCoachingContext,
            messageId: `msg-${Date.now()}`,
            timestamp: new Date().toISOString()
          }));

          console.log('[Chat Stream] Calling Claude API...');

          // Get Claude streaming response with coaching context
          const claudeResponse = await claudeClient.sendMessage(
            message,
            managedHistory,
            finalCoachingContext
          );

          console.log('[Chat Stream] Claude API responded, starting to stream content');
          
          // Stream the response
          let fullContent = '';
          const reader = claudeResponse.content[Symbol.asyncIterator] ? 
            claudeResponse.content[Symbol.asyncIterator]() : null;
          
          if (reader) {
            // Stream chunks from async iterator
            while (true) {
              const { done, value } = await reader.next();
              if (done) break;
              
              if (value) {
                fullContent += value;
                controller.enqueue(encoder.encodeContent(value));
                
                // Add small delay for better visual effect
                await new Promise(resolve => setTimeout(resolve, 10));
              }
            }
          } else {
            // Fallback: Send full content at once
            fullContent = claudeResponse.content as string;
            
            // Simulate streaming for better UX
            const words = fullContent.split(' ');
            
            for (let i = 0; i < words.length; i++) {
              controller.enqueue(encoder.encodeContent(words[i] + (i < words.length - 1 ? ' ' : '')));
              
              // Variable delay based on word length for natural feel
              const delay = Math.max(20, Math.min(100, words[i].length * 10));
              await new Promise(resolve => setTimeout(resolve, delay));
            }
          }

          // Note: Conversation storage is handled by the workspace page
          // which updates user_workspace.workspace_state.chat_context
          // No additional database storage needed here

          console.log('[Chat Stream] Stream complete:', {
            contentLength: fullContent.length,
            usage: claudeResponse.usage
          });

          // Send completion signal with usage data
          controller.enqueue(encoder.encodeComplete(claudeResponse.usage));
          controller.enqueue(encoder.encodeDone());
          controller.close();

        } catch (error) {
          console.error('[Chat Stream] Streaming error:', {
            error: error instanceof Error ? error.message : 'Unknown error',
            stack: error instanceof Error ? error.stack : undefined,
            timestamp: new Date().toISOString()
          });
          const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';

          // Send error with retry suggestion
          controller.enqueue(encoder.encodeError(errorMessage, {
            retryable: !errorMessage.includes('auth'),
            suggestion: 'Please try again. If the issue persists, refresh the page.'
          }));
          controller.close();
        }
      },

      cancel() {
        console.log('[Chat Stream] Stream cancelled by client');
      }
    });

    return new Response(stream, {
      headers: createStreamHeaders()
    });

  } catch (error) {
    console.error('[Chat Stream] API Route Error:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString()
    });
    return new Response(JSON.stringify({
      error: 'Internal Server Error',
      details: error instanceof Error ? error.message : 'Unknown error',
      hint: 'Check server logs for more details. Try refreshing the page.'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

export async function GET() {
  return new Response(JSON.stringify({ 
    message: 'Claude streaming endpoint ready',
    timestamp: new Date().toISOString()
  }), {
    headers: { 'Content-Type': 'application/json' }
  });
}