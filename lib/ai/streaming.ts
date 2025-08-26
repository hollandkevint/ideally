export interface StreamChunk {
  type: 'content' | 'complete' | 'error';
  content?: string;
  error?: string;
  usage?: {
    input_tokens: number;
    output_tokens: number;
  };
}

export class StreamEncoder {
  private encoder = new TextEncoder();

  encodeChunk(chunk: StreamChunk): Uint8Array {
    const data = JSON.stringify(chunk);
    return this.encoder.encode(`data: ${data}\n\n`);
  }

  encodeError(error: string): Uint8Array {
    const chunk: StreamChunk = { type: 'error', error };
    return this.encodeChunk(chunk);
  }

  encodeComplete(usage?: StreamChunk['usage']): Uint8Array {
    const chunk: StreamChunk = { type: 'complete', usage };
    return this.encodeChunk(chunk);
  }

  encodeContent(content: string): Uint8Array {
    const chunk: StreamChunk = { type: 'content', content };
    return this.encodeChunk(chunk);
  }
}

export class StreamDecoder {
  private decoder = new TextDecoder();
  private buffer = '';

  decode(value: Uint8Array): StreamChunk[] {
    this.buffer += this.decoder.decode(value, { stream: true });
    const lines = this.buffer.split('\n');
    this.buffer = lines.pop() || '';

    const chunks: StreamChunk[] = [];
    for (const line of lines) {
      if (line.startsWith('data: ')) {
        try {
          const chunk = JSON.parse(line.slice(6)) as StreamChunk;
          chunks.push(chunk);
        } catch (error) {
          console.error('Failed to parse stream chunk:', error);
        }
      }
    }
    return chunks;
  }
}

export function createStreamHeaders(): Record<string, string> {
  return {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}