import Anthropic from '@anthropic-ai/sdk';
import { maryPersona, type CoachingContext } from './mary-persona';

// Validate API key on module load
if (!process.env.ANTHROPIC_API_KEY) {
  console.error('[Claude Client] FATAL: ANTHROPIC_API_KEY environment variable is not set');
  throw new Error('ANTHROPIC_API_KEY environment variable is required');
}

console.log('[Claude Client] Initializing with API key:', process.env.ANTHROPIC_API_KEY?.substring(0, 10) + '...');

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export interface TokenUsage {
  input_tokens: number;
  output_tokens: number;
  total_tokens: number;
  cost_estimate_usd?: number;
}

export interface StreamingResponse {
  id: string;
  content: AsyncIterable<string>;
  usage?: TokenUsage;
}

export interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
}

export class ClaudeClient {
  private tokenUsageCallback?: (usage: TokenUsage) => void;
  
  setTokenUsageCallback(callback: (usage: TokenUsage) => void) {
    this.tokenUsageCallback = callback;
  }

  async sendMessage(
    message: string,
    conversationHistory: ConversationMessage[] = [],
    coachingContext?: CoachingContext
  ): Promise<StreamingResponse> {
    try {
      // Filter conversation history to only include role and content
      const cleanHistory = conversationHistory.map(msg => ({
        role: msg.role,
        content: msg.content
      }));
      
      const messages = [
        ...cleanHistory,
        { role: 'user' as const, content: message }
      ];

      const stream = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514', // Claude Sonnet 4 - upgraded per API docs
        max_tokens: 4096,
        temperature: 0.7,
        system: maryPersona.generateSystemPrompt(coachingContext),
        messages: messages,
        stream: true,
      });

      const { content, usage } = await this.processStreamWithUsage(stream);
      
      if (usage && this.tokenUsageCallback) {
        this.tokenUsageCallback(usage);
      }

      return {
        id: crypto.randomUUID(),
        content,
        usage
      };
    } catch (error) {
      console.error('Claude API Error:', error);
      throw new ClaudeApiError(`Failed to send message: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async processStreamWithUsage(stream: AsyncIterable<unknown>): Promise<{
    content: AsyncIterable<string>,
    usage?: TokenUsage
  }> {
    const chunks: string[] = [];
    let usage: TokenUsage | undefined;

    const processedStream = async function* () {
      for await (const chunk of stream) {
        if (
          typeof chunk === 'object' && 
          chunk !== null && 
          'type' in chunk
        ) {
          // Handle content deltas
          if (
            chunk.type === 'content_block_delta' && 
            'delta' in chunk &&
            typeof chunk.delta === 'object' &&
            chunk.delta !== null &&
            'text' in chunk.delta &&
            typeof chunk.delta.text === 'string'
          ) {
            chunks.push(chunk.delta.text);
            yield chunk.delta.text;
          }
          // Handle usage information
          else if (chunk.type === 'message_delta' && 'usage' in chunk) {
            const chunkUsage = chunk.usage;
            if (typeof chunkUsage === 'object' && chunkUsage !== null) {
              usage = {
                input_tokens: 'input_tokens' in chunkUsage ? Number(chunkUsage.input_tokens) : 0,
                output_tokens: 'output_tokens' in chunkUsage ? Number(chunkUsage.output_tokens) : 0,
                total_tokens: 0,
                cost_estimate_usd: 0
              };
              usage.total_tokens = usage.input_tokens + usage.output_tokens;
              // Rough cost estimate for Claude 3.5 Sonnet (input: $3/1M tokens, output: $15/1M tokens)
              usage.cost_estimate_usd = (usage.input_tokens * 0.000003) + (usage.output_tokens * 0.000015);
            }
          }
        }
      }
    };

    return {
      content: processedStream(),
      usage
    };
  }

  private async *processStream(stream: AsyncIterable<unknown>): AsyncIterable<string> {
    try {
      for await (const chunk of stream) {
        if (
          typeof chunk === 'object' && 
          chunk !== null && 
          'type' in chunk &&
          chunk.type === 'content_block_delta' && 
          'delta' in chunk &&
          typeof chunk.delta === 'object' &&
          chunk.delta !== null &&
          'text' in chunk.delta &&
          typeof chunk.delta.text === 'string'
        ) {
          yield chunk.delta.text;
        }
      }
    } catch (error) {
      console.error('Stream processing error:', error);
      throw new ClaudeApiError(`Stream processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      const response = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514', // Claude Sonnet 4 - upgraded per API docs
        max_tokens: 10,
        messages: [{ role: 'user', content: 'test' }],
      });
      return !!response;
    } catch (error) {
      console.error('Claude connection test failed:', error);
      return false;
    }
  }
}

export class ClaudeApiError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ClaudeApiError';
  }
}

// Singleton instance
export const claudeClient = new ClaudeClient();