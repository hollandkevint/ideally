import { NextRequest } from 'next/server';
import { claudeClient } from '@/lib/ai/claude-client';
import { StreamEncoder, createStreamHeaders } from '@/lib/ai/streaming';
import {
  createSubPersonaState,
  updateSubPersonaState,
  type SubPersonaMode,
  type SubPersonaSessionState,
  type CoachingContext,
} from '@/lib/ai/mary-persona';

/**
 * Guest Chat Stream API
 *
 * Simplified streaming endpoint for guest users (no auth required)
 * Limitations:
 * - No database persistence
 * - Limited conversation history (client manages via localStorage)
 * - Basic Mary persona without workspace context
 */

export async function POST(request: NextRequest) {
  try {
    const { message, conversationHistory } = await request.json();

    // Validate request
    if (!message) {
      return new Response(JSON.stringify({ error: 'Message is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Limit conversation history to prevent abuse
    const limitedHistory = (conversationHistory || []).slice(-10);

    // Story 6.1: Initialize sub-persona state for guest (default: new-idea pathway)
    const guestPathway = 'new-idea';
    let subPersonaState: SubPersonaSessionState;
    let currentMode: SubPersonaMode;

    // Check if we have existing state in the request (optional enhancement)
    const messageIndex = limitedHistory.length;

    // Initialize or update sub-persona state
    if (messageIndex === 0) {
      subPersonaState = createSubPersonaState(guestPathway);
    } else {
      // Create fresh state and update based on conversation
      subPersonaState = createSubPersonaState(guestPathway);
      subPersonaState = updateSubPersonaState(
        subPersonaState,
        message,
        limitedHistory
      );
      // Manually set exchange count based on history
      subPersonaState.exchangeCount = Math.floor(messageIndex / 2);
    }

    currentMode = subPersonaState.currentMode;

    console.log('[Guest Chat] Request:', {
      messageLength: message.length,
      historyLength: limitedHistory.length,
      timestamp: new Date().toISOString(),
      subPersonaMode: currentMode,
    });

    const encoder = new StreamEncoder();

    // Create streaming response
    const stream = new ReadableStream({
      async start(controller) {
        try {
          console.log('[Guest Chat] Stream started');

          // Send initial metadata (Story 6.1: include mode in response)
          controller.enqueue(encoder.encodeMetadata({
            messageId: `guest-msg-${Date.now()}`,
            timestamp: new Date().toISOString(),
            isGuest: true,
            // Story 6.1: Include sub-persona mode in metadata
            subPersona: {
              mode: currentMode,
              exchangeCount: subPersonaState.exchangeCount,
              userControlEnabled: subPersonaState.userControlEnabled,
            },
          }));

          console.log('[Guest Chat] Calling Claude API...');

          // Story 6.1: Build full coaching context with sub-persona state
          const guestCoachingContext: CoachingContext = {
            currentBmadSession: {
              pathway: guestPathway,
              phase: 'discovery',
              progress: 0,
            },
            subPersonaState,
            recentMessages: limitedHistory.slice(-5),
          };

          // Get Claude streaming response
          const claudeResponse = await claudeClient.sendMessage(
            message,
            limitedHistory,
            guestCoachingContext
          );

          console.log('[Guest Chat] Claude API responded, streaming content');

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

                // Small delay for smooth streaming
                await new Promise(resolve => setTimeout(resolve, 10));
              }
            }
          } else {
            // Fallback: Send full content with simulated streaming
            fullContent = claudeResponse.content as string;

            const words = fullContent.split(' ');

            for (let i = 0; i < words.length; i++) {
              controller.enqueue(encoder.encodeContent(words[i] + (i < words.length - 1 ? ' ' : '')));

              const delay = Math.max(20, Math.min(100, words[i].length * 10));
              await new Promise(resolve => setTimeout(resolve, delay));
            }
          }

          console.log('[Guest Chat] Stream complete:', {
            contentLength: fullContent.length,
            usage: claudeResponse.usage
          });

          // Send completion signal (no usage data for guests to prevent API exposure)
          controller.enqueue(encoder.encodeComplete());
          controller.enqueue(encoder.encodeDone());
          controller.close();

        } catch (error) {
          console.error('[Guest Chat] Streaming error:', {
            error: error instanceof Error ? error.message : 'Unknown error',
            stack: error instanceof Error ? error.stack : undefined,
            timestamp: new Date().toISOString()
          });

          const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';

          controller.enqueue(encoder.encodeError(errorMessage, {
            retryable: true,
            suggestion: 'Please try again. If the issue persists, try refreshing the page.'
          }));
          controller.close();
        }
      },

      cancel() {
        console.log('[Guest Chat] Stream cancelled by client');
      }
    });

    return new Response(stream, {
      headers: createStreamHeaders()
    });

  } catch (error) {
    console.error('[Guest Chat] API Route Error:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString()
    });

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
    message: 'Guest chat endpoint ready',
    timestamp: new Date().toISOString()
  }), {
    headers: { 'Content-Type': 'application/json' }
  });
}
