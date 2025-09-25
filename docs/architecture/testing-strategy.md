# Testing Strategy

## Testing Pyramid

```text
        E2E Tests
       /          \
   Integration Tests
  /                 \
Frontend Unit    Backend Unit
```

## Test Organization

### Frontend Tests
```text
tests/
├── components/              # Component unit tests
│   ├── chat/
│   │   ├── ChatInterface.test.tsx
│   │   └── MessageList.test.tsx
│   └── workspace/
├── hooks/                   # Custom hook tests
│   └── useConversationStreaming.test.ts
├── services/               # Frontend service tests
│   └── apiClient.test.ts
└── utils/                  # Utility function tests
```

### Backend Tests
```text
tests/
├── api/                    # API endpoint tests
│   ├── chat/
│   │   ├── stream.test.ts
│   │   └── summarize.test.ts
│   └── workspaces.test.ts
├── lib/                    # Library tests
│   ├── ai/
│   │   ├── claude-client.test.ts
│   │   └── mary-persona.test.ts
│   └── bmad/
└── integration/            # Cross-system tests
    └── conversation-flow.test.ts
```

### E2E Tests
```text
tests/e2e/
├── auth-flow.test.ts       # Login/logout flows
├── workspace-creation.test.ts
├── ai-conversation.test.ts # Full coaching conversation
└── bmad-integration.test.ts
```

## Test Examples

### Frontend Component Test
```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { ChatInterface } from '@/app/components/chat/ChatInterface'
import { mockWorkspace } from '@/tests/mocks'

describe('ChatInterface', () => {
  it('sends message and displays streaming response', async () => {
    const onMessage = jest.fn()
    
    render(
      <ChatInterface 
        workspace={mockWorkspace} 
        onMessage={onMessage}
      />
    )
    
    const input = screen.getByPlaceholderText('Type your message...')
    const sendButton = screen.getByRole('button', { name: 'Send' })
    
    fireEvent.change(input, { target: { value: 'Hello Mary' } })
    fireEvent.click(sendButton)
    
    await waitFor(() => {
      expect(onMessage).toHaveBeenCalledWith('Hello Mary')
    })
    
    expect(screen.getByText(/Hello Mary/)).toBeInTheDocument()
  })
})
```

### Backend API Test
```typescript
import { POST } from '@/app/api/chat/stream/route'
import { NextRequest } from 'next/server'
import { createMockUser } from '@/tests/mocks'

describe('/api/chat/stream', () => {
  it('streams AI response for authenticated user', async () => {
    const mockUser = createMockUser()
    const request = new NextRequest('http://localhost:3000/api/chat/stream', {
      method: 'POST',
      body: JSON.stringify({
        message: 'Hello',
        workspaceId: 'test-workspace-id'
      })
    })

    // Mock auth
    jest.spyOn(require('@/lib/supabase/server'), 'createClient')
      .mockReturnValue({
        auth: { getUser: () => ({ data: { user: mockUser } }) }
      })

    const response = await POST(request)
    
    expect(response.headers.get('content-type')).toBe('text/event-stream')
    expect(response.status).toBe(200)
  })
})
```

### E2E Test
```typescript
import { test, expect } from '@playwright/test'

test('complete AI coaching conversation flow', async ({ page }) => {
  // Login
  await page.goto('/login')
  await page.fill('[data-testid=email]', 'test@example.com')
  await page.fill('[data-testid=password]', 'password123')
  await page.click('[data-testid=login-button]')
  
  // Create workspace
  await page.goto('/dashboard')
  await page.click('[data-testid=create-workspace]')
  await page.fill('[data-testid=workspace-name]', 'Test Strategy Session')
  await page.click('[data-testid=create-button]')
  
  // Start conversation
  await page.waitForSelector('[data-testid=chat-interface]')
  await page.fill('[data-testid=message-input]', 'Help me develop a new product idea')
  await page.click('[data-testid=send-button]')
  
  // Verify AI response streaming
  await expect(page.locator('[data-testid=message-list]')).toContainText('I\'d be happy to help')
  
  // Verify conversation persistence
  await page.reload()
  await expect(page.locator('[data-testid=message-list]')).toContainText('Help me develop a new product idea')
})
```
