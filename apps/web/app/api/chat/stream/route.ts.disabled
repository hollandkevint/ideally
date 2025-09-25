import { NextRequest } from 'next/server';
import { claudeClient } from '@/lib/ai/claude-client';
import { StreamEncoder, createStreamHeaders } from '@/lib/ai/streaming';
import { createClient } from '@/lib/supabase/server';
import { CoachingContext } from '@/lib/ai/mary-persona';
import { WorkspaceContextBuilder } from '@/lib/ai/workspace-context';

export async function POST(request: NextRequest) {
  try {
    const { message, workspaceId, conversationHistory, coachingContext } = await request.json();
    
    // Validate request
    if (!message || !workspaceId) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Get user context
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized', details: authError?.message }), { 
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Verify workspace access
    const { data: workspace, error: workspaceError } = await supabase
      .from('workspaces')
      .select('id')
      .eq('id', workspaceId)
      .eq('user_id', user.id)
      .single();

    if (workspaceError || !workspace) {
      return new Response(JSON.stringify({ error: 'Workspace not found' }), { 
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

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
    const managedHistory = WorkspaceContextBuilder.pruneConversationHistory(
      historyWithContext,
      6000 // Leave room for response
    );

    const encoder = new StreamEncoder();
    
    // Create streaming response
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Send initial metadata
          controller.enqueue(encoder.encodeMetadata({
            coachingContext: finalCoachingContext,
            messageId: `msg-${Date.now()}`,
            timestamp: new Date().toISOString()
          }));

          // Get Claude streaming response with coaching context
          const claudeResponse = await claudeClient.sendMessage(
            message,
            managedHistory,
            finalCoachingContext
          );
          
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

          // Store conversation in database
          try {
            await supabase
              .from('conversations')
              .upsert({
                workspace_id: workspaceId,
                user_id: user.id,
                messages: [
                  ...managedHistory,
                  { role: 'user', content: message, timestamp: new Date().toISOString() },
                  { role: 'assistant', content: fullContent, timestamp: new Date().toISOString() }
                ],
                coaching_context: finalCoachingContext,
                last_activity: new Date().toISOString()
              }, { onConflict: 'workspace_id,user_id' });
          } catch (dbError) {
            console.warn('Failed to store conversation:', dbError);
            // Don't fail the request for database issues
          }
          
          // Send completion signal with usage data
          controller.enqueue(encoder.encodeComplete(claudeResponse.usage));
          controller.enqueue(encoder.encodeDone());
          controller.close();
          
        } catch (error) {
          console.error('Streaming error:', error);
          const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
          
          // Send error with retry suggestion
          controller.enqueue(encoder.encodeError(errorMessage, {
            retryable: !error?.message?.includes('auth'),
            suggestion: 'Please try again. If the issue persists, refresh the page.'
          }));
          controller.close();
        }
      },
      
      cancel() {
        console.log('Stream cancelled by client');
      }
    });

    return new Response(stream, {
      headers: createStreamHeaders()
    });
    
  } catch (error) {
    console.error('API Route Error:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal Server Error',
      details: error instanceof Error ? error.message : 'Unknown error'
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