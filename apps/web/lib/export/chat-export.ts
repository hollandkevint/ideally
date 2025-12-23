/**
 * Chat Export Service
 * Phase 5: Export chat conversations to various formats
 */

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  metadata?: {
    strategic_tags?: string[];
  };
}

export interface ChatExportOptions {
  workspaceName?: string;
  includeMetadata?: boolean;
  includeTimestamps?: boolean;
  format?: 'markdown' | 'text' | 'json';
}

export interface ChatExportResult {
  success: boolean;
  content?: string;
  fileName: string;
  format: string;
  error?: string;
}

/**
 * Export chat conversation to Markdown format
 */
export function exportChatToMarkdown(
  messages: ChatMessage[],
  options: ChatExportOptions = {}
): ChatExportResult {
  try {
    const {
      workspaceName = 'Strategic Session',
      includeMetadata = true,
      includeTimestamps = true,
    } = options;

    let markdown = '';

    // Header
    markdown += `# ${workspaceName}\n\n`;
    markdown += `**Export Date:** ${new Date().toLocaleString()}\n`;
    markdown += `**Total Messages:** ${messages.length}\n\n`;
    markdown += '---\n\n';

    // Messages
    messages.forEach((message, index) => {
      const roleLabel = getRoleLabel(message.role);
      const timestamp = includeTimestamps
        ? ` (${new Date(message.timestamp).toLocaleString()})`
        : '';

      markdown += `## ${roleLabel}${timestamp}\n\n`;
      markdown += `${message.content}\n\n`;

      // Strategic tags if available
      if (
        includeMetadata &&
        message.metadata?.strategic_tags &&
        message.metadata.strategic_tags.length > 0
      ) {
        markdown += `**Tags:** ${message.metadata.strategic_tags.join(', ')}\n\n`;
      }

      // Add separator between messages (except last)
      if (index < messages.length - 1) {
        markdown += '---\n\n';
      }
    });

    // Footer
    markdown += '\n---\n\n';
    markdown += `*Exported from ThinkHaven - AI-powered strategic thinking workspace*\n`;

    const fileName = generateFileName(workspaceName, 'md');

    return {
      success: true,
      content: markdown,
      fileName,
      format: 'markdown',
    };
  } catch (error) {
    console.error('Markdown export error:', error);
    return {
      success: false,
      fileName: 'chat-export.md',
      format: 'markdown',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Export chat conversation to plain text format
 */
export function exportChatToText(
  messages: ChatMessage[],
  options: ChatExportOptions = {}
): ChatExportResult {
  try {
    const {
      workspaceName = 'Strategic Session',
      includeMetadata = true,
      includeTimestamps = true,
    } = options;

    let text = '';

    // Header
    text += `${workspaceName}\n`;
    text += `${'='.repeat(workspaceName.length)}\n\n`;
    text += `Export Date: ${new Date().toLocaleString()}\n`;
    text += `Total Messages: ${messages.length}\n\n`;
    text += `${'-'.repeat(80)}\n\n`;

    // Messages
    messages.forEach((message, index) => {
      const roleLabel = getRoleLabel(message.role);
      const timestamp = includeTimestamps
        ? ` (${new Date(message.timestamp).toLocaleString()})`
        : '';

      text += `${roleLabel}${timestamp}\n\n`;

      // Remove markdown formatting for plain text
      const plainContent = stripMarkdown(message.content);
      text += `${plainContent}\n\n`;

      // Strategic tags if available
      if (
        includeMetadata &&
        message.metadata?.strategic_tags &&
        message.metadata.strategic_tags.length > 0
      ) {
        text += `Tags: ${message.metadata.strategic_tags.join(', ')}\n\n`;
      }

      // Add separator between messages (except last)
      if (index < messages.length - 1) {
        text += `${'-'.repeat(80)}\n\n`;
      }
    });

    // Footer
    text += `\n${'-'.repeat(80)}\n\n`;
    text += `Exported from ThinkHaven - AI-powered strategic thinking workspace\n`;

    const fileName = generateFileName(workspaceName, 'txt');

    return {
      success: true,
      content: text,
      fileName,
      format: 'text',
    };
  } catch (error) {
    console.error('Text export error:', error);
    return {
      success: false,
      fileName: 'chat-export.txt',
      format: 'text',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Export chat conversation to JSON format
 */
export function exportChatToJSON(
  messages: ChatMessage[],
  options: ChatExportOptions = {}
): ChatExportResult {
  try {
    const { workspaceName = 'Strategic Session' } = options;

    const exportData = {
      workspace: workspaceName,
      exportDate: new Date().toISOString(),
      totalMessages: messages.length,
      messages: messages.map((msg) => ({
        id: msg.id,
        role: msg.role,
        content: msg.content,
        timestamp: msg.timestamp,
        metadata: msg.metadata,
      })),
    };

    const content = JSON.stringify(exportData, null, 2);
    const fileName = generateFileName(workspaceName, 'json');

    return {
      success: true,
      content,
      fileName,
      format: 'json',
    };
  } catch (error) {
    console.error('JSON export error:', error);
    return {
      success: false,
      fileName: 'chat-export.json',
      format: 'json',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Format chat for clipboard (optimized for pasting)
 */
export function formatChatForClipboard(messages: ChatMessage[]): string {
  let text = '';

  messages.forEach((message, index) => {
    const roleLabel = getRoleLabel(message.role);
    text += `${roleLabel}:\n`;
    text += `${message.content}\n`;

    if (index < messages.length - 1) {
      text += '\n---\n\n';
    }
  });

  return text;
}

/**
 * Copy chat to clipboard
 */
export async function copyChatToClipboard(
  messages: ChatMessage[]
): Promise<{ success: boolean; error?: string }> {
  try {
    const text = formatChatForClipboard(messages);

    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
      return { success: true };
    } else {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      document.body.appendChild(textArea);
      textArea.select();

      try {
        document.execCommand('copy');
        document.body.removeChild(textArea);
        return { success: true };
      } catch (err) {
        document.body.removeChild(textArea);
        throw err;
      }
    }
  } catch (error) {
    console.error('Clipboard copy error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to copy to clipboard',
    };
  }
}

/**
 * Download chat export file
 */
export function downloadChatExport(
  content: string,
  fileName: string,
  mimeType: string
): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();

  // Cleanup
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Helper: Get user-friendly role label
 */
function getRoleLabel(role: string): string {
  switch (role) {
    case 'user':
      return 'You';
    case 'assistant':
      return 'Mary (AI Advisor)';
    case 'system':
      return 'System';
    default:
      return role.charAt(0).toUpperCase() + role.slice(1);
  }
}

/**
 * Helper: Generate file name with timestamp
 */
function generateFileName(workspaceName: string, extension: string): string {
  const sanitized = workspaceName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

  const timestamp = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  return `${sanitized}-chat-${timestamp}.${extension}`;
}

/**
 * Helper: Strip markdown formatting for plain text
 */
function stripMarkdown(text: string): string {
  return text
    // Remove headers
    .replace(/^#{1,6}\s+/gm, '')
    // Remove bold/italic
    .replace(/(\*\*|__)(.*?)\1/g, '$2')
    .replace(/(\*|_)(.*?)\1/g, '$2')
    // Remove links but keep text
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    // Remove inline code
    .replace(/`([^`]+)`/g, '$1')
    // Remove code blocks
    .replace(/```[\s\S]*?```/g, '[Code Block]')
    // Remove horizontal rules
    .replace(/^[-*_]{3,}$/gm, '')
    // Clean up extra whitespace
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/**
 * Get MIME type for format
 */
export function getMimeType(format: 'markdown' | 'text' | 'json'): string {
  switch (format) {
    case 'markdown':
      return 'text/markdown';
    case 'text':
      return 'text/plain';
    case 'json':
      return 'application/json';
    default:
      return 'text/plain';
  }
}

/**
 * Validate messages before export
 */
export function validateMessages(messages: ChatMessage[]): {
  valid: boolean;
  error?: string;
} {
  if (!messages || !Array.isArray(messages)) {
    return { valid: false, error: 'Messages must be an array' };
  }

  if (messages.length === 0) {
    return { valid: false, error: 'No messages to export' };
  }

  // Check that all messages have required fields
  for (const msg of messages) {
    if (!msg.id || !msg.role || !msg.content || !msg.timestamp) {
      return {
        valid: false,
        error: 'Invalid message format: missing required fields',
      };
    }
  }

  return { valid: true };
}

/**
 * Get export statistics
 */
export function getExportStats(messages: ChatMessage[]): {
  totalMessages: number;
  userMessages: number;
  assistantMessages: number;
  systemMessages: number;
  totalCharacters: number;
  estimatedReadTime: number; // in minutes
} {
  const userMessages = messages.filter((m) => m.role === 'user').length;
  const assistantMessages = messages.filter((m) => m.role === 'assistant').length;
  const systemMessages = messages.filter((m) => m.role === 'system').length;

  const totalCharacters = messages.reduce(
    (sum, msg) => sum + msg.content.length,
    0
  );

  // Estimate reading time: ~200 words per minute, ~5 chars per word
  const estimatedReadTime = Math.ceil(totalCharacters / (200 * 5));

  return {
    totalMessages: messages.length,
    userMessages,
    assistantMessages,
    systemMessages,
    totalCharacters,
    estimatedReadTime,
  };
}
