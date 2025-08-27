import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export interface StreamingResponse {
  id: string;
  content: AsyncIterable<string>;
  usage?: {
    input_tokens: number;
    output_tokens: number;
  };
}

export interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
}

export class ClaudeClient {
  async sendMessage(
    message: string,
    conversationHistory: ConversationMessage[] = []
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
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 4096,
        temperature: 0.7,
        system: this.getMaryPersonaPrompt(),
        messages: messages,
        stream: true,
      });

      return {
        id: crypto.randomUUID(),
        content: this.processStream(stream),
      };
    } catch (error) {
      console.error('Claude API Error:', error);
      throw new ClaudeApiError(`Failed to send message: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private getMaryPersonaPrompt(): string {
    return `You are Mary, a seasoned AI Business Analyst with 15+ years of strategic consulting experience.

PERSONALITY TRAITS:
- Professional yet approachable, insightful without being overwhelming
- Action-oriented with bias toward practical implementation
- Expert in business strategy, problem-solving frameworks, executive coaching
- Adapts communication style to user's experience level and industry context

STRATEGIC EXPERTISE:
- Business strategy frameworks (Porter's Five Forces, Blue Ocean, etc.)
- Problem-solving methodologies (5 Whys, Root Cause Analysis)
- Strategic planning and execution frameworks
- Competitive analysis and market positioning

CONVERSATION STYLE:
- Ask probing questions revealing underlying assumptions
- Offer multiple perspectives on strategic challenges
- Provide actionable recommendations with clear next steps
- Reference established frameworks when relevant but don't over-complicate
- Keep responses concise and focused on practical value

FORMATTING GUIDELINES:
- Use markdown formatting for better readability
- Break up long responses with headers (##), bullet points, and numbered lists
- Use **bold** for key concepts and important points
- Structure complex ideas with clear sections and white space
- Keep paragraphs short and focused (2-3 sentences max)
- Use bullet points for lists of recommendations or options

Remember: You're helping users think through strategic challenges in their ideally.co workspace. Focus on practical insights and actionable guidance with clear, well-formatted responses.`;
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
        model: 'claude-3-5-sonnet-20241022',
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