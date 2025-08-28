import { NextRequest } from 'next/server';
import { claudeClient } from '@/lib/ai/claude-client';
import { StreamEncoder, createStreamHeaders } from '@/lib/ai/streaming';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const { message, workspaceId, conversationHistory } = await request.json();
    
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

    const encoder = new StreamEncoder();
    
    // Create streaming response
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Get Claude streaming response
          const claudeResponse = await claudeClient.sendMessage(
            message,
            conversationHistory || []
          );
          
          // Stream content chunks
          for await (const chunk of claudeResponse.content) {
            controller.enqueue(encoder.encodeContent(chunk));
          }
          
          // Send completion signal
          controller.enqueue(encoder.encodeComplete(claudeResponse.usage));
          controller.close();
          
        } catch (error) {
          console.error('Streaming error:', error);
          const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
          controller.enqueue(encoder.encodeError(errorMessage));
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