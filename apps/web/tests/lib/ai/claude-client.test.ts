import { ClaudeClient, claudeClient } from '@/lib/ai/claude-client';
import { type CoachingContext } from '@/lib/ai/mary-persona';

// Mock Anthropic SDK
jest.mock('@anthropic-ai/sdk', () => {
  return {
    __esModule: true,
    default: jest.fn().mockImplementation(() => ({
      messages: {
        create: jest.fn()
      }
    }))
  };
});

// Mock the mary-persona module
jest.mock('@/lib/ai/mary-persona', () => ({
  maryPersona: {
    generateSystemPrompt: jest.fn().mockReturnValue('Mock system prompt')
  }
}));

import Anthropic from '@anthropic-ai/sdk';
import { maryPersona } from '@/lib/ai/mary-persona';

const mockAnthropic = Anthropic as jest.MockedClass<typeof Anthropic>;
const mockCreate = jest.fn();
const mockGenerateSystemPrompt = maryPersona.generateSystemPrompt as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
  mockAnthropic.mockImplementation(() => ({
    messages: {
      create: mockCreate
    }
  }) as any);
});

describe('ClaudeClient', () => {
  describe('sendMessage', () => {
    it('should send message with basic parameters', async () => {
      const mockStream = {
        [Symbol.asyncIterator]: async function* () {
          yield { type: 'content_block_delta', delta: { text: 'Hello' } };
          yield { type: 'content_block_delta', delta: { text: ' world' } };
        }
      };

      mockCreate.mockResolvedValue(mockStream);

      const response = await claudeClient.sendMessage('Test message');

      expect(mockCreate).toHaveBeenCalledWith({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 4096,
        temperature: 0.7,
        system: 'Mock system prompt',
        messages: [{ role: 'user', content: 'Test message' }],
        stream: true
      });

      expect(response).toHaveProperty('id');
      expect(response).toHaveProperty('content');
    });

    it('should include conversation history', async () => {
      const mockStream = {
        [Symbol.asyncIterator]: async function* () {
          yield { type: 'content_block_delta', delta: { text: 'Response' } };
        }
      };

      mockCreate.mockResolvedValue(mockStream);

      const conversationHistory = [
        { role: 'user' as const, content: 'Previous user message' },
        { role: 'assistant' as const, content: 'Previous assistant response' }
      ];

      await claudeClient.sendMessage('New message', conversationHistory);

      expect(mockCreate).toHaveBeenCalledWith({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 4096,
        temperature: 0.7,
        system: 'Mock system prompt',
        messages: [
          { role: 'user', content: 'Previous user message' },
          { role: 'assistant', content: 'Previous assistant response' },
          { role: 'user', content: 'New message' }
        ],
        stream: true
      });
    });

    it('should use coaching context when provided', async () => {
      const mockStream = {
        [Symbol.asyncIterator]: async function* () {
          yield { type: 'content_block_delta', delta: { text: 'Response' } };
        }
      };

      mockCreate.mockResolvedValue(mockStream);

      const coachingContext: CoachingContext = {
        workspaceId: 'workspace-123',
        userProfile: { experienceLevel: 'intermediate' }
      };

      await claudeClient.sendMessage('Test message', [], coachingContext);

      expect(mockGenerateSystemPrompt).toHaveBeenCalledWith(coachingContext);
    });

    it('should handle API errors gracefully', async () => {
      mockCreate.mockRejectedValue(new Error('API Error'));

      await expect(claudeClient.sendMessage('Test message')).rejects.toThrow('Failed to send message: API Error');
    });

    it('should process token usage when available', async () => {
      const mockStream = {
        [Symbol.asyncIterator]: async function* () {
          yield { type: 'content_block_delta', delta: { text: 'Hello' } };
          yield { 
            type: 'message_delta', 
            usage: { input_tokens: 100, output_tokens: 50 }
          };
        }
      };

      mockCreate.mockResolvedValue(mockStream);

      const response = await claudeClient.sendMessage('Test message');
      
      expect(response.usage).toBeDefined();
      expect(response.usage?.input_tokens).toBe(100);
      expect(response.usage?.output_tokens).toBe(50);
      expect(response.usage?.total_tokens).toBe(150);
      expect(response.usage?.cost_estimate_usd).toBeGreaterThan(0);
    });

    it('should call token usage callback when set', async () => {
      const mockStream = {
        [Symbol.asyncIterator]: async function* () {
          yield { type: 'content_block_delta', delta: { text: 'Hello' } };
          yield { 
            type: 'message_delta', 
            usage: { input_tokens: 100, output_tokens: 50 }
          };
        }
      };

      mockCreate.mockResolvedValue(mockStream);

      const usageCallback = jest.fn();
      claudeClient.setTokenUsageCallback(usageCallback);

      await claudeClient.sendMessage('Test message');

      expect(usageCallback).toHaveBeenCalledWith({
        input_tokens: 100,
        output_tokens: 50,
        total_tokens: 150,
        cost_estimate_usd: expect.any(Number)
      });
    });
  });

  describe('testConnection', () => {
    it('should return true for successful connection', async () => {
      mockCreate.mockResolvedValue({ id: 'test-response' });

      const result = await claudeClient.testConnection();

      expect(result).toBe(true);
      expect(mockCreate).toHaveBeenCalledWith({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 10,
        messages: [{ role: 'user', content: 'test' }]
      });
    });

    it('should return false for connection failure', async () => {
      mockCreate.mockRejectedValue(new Error('Connection failed'));

      const result = await claudeClient.testConnection();

      expect(result).toBe(false);
    });
  });

  describe('stream processing', () => {
    it('should handle malformed chunks gracefully', async () => {
      const mockStream = {
        [Symbol.asyncIterator]: async function* () {
          yield { type: 'invalid_chunk' };
          yield { type: 'content_block_delta', delta: { text: 'Valid text' } };
          yield { malformed: 'chunk' };
        }
      };

      mockCreate.mockResolvedValue(mockStream);

      const response = await claudeClient.sendMessage('Test message');
      
      // Should still work despite malformed chunks
      expect(response).toHaveProperty('content');
      expect(response).toHaveProperty('id');
    });
  });
});