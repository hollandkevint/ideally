# Coding Standards

## Critical Fullstack Rules

- **Type Sharing:** Always define shared types in `types/` directory and import consistently
- **API Calls:** Never make direct fetch calls - use the `apiClient` service layer
- **Environment Variables:** Access only through config objects, never `process.env` directly in components
- **Error Handling:** All API routes must use the standard error format and logging
- **State Updates:** Never mutate Zustand state directly - use store actions
- **Authentication:** Always verify user context in API routes before processing requests
- **Database Queries:** Use repository pattern with proper error handling and type safety
- **AI Integration:** Include token usage tracking and proper streaming error handling

## Naming Conventions

| Element           | Frontend        | Backend         | Example              |
| ----------------- | --------------- | --------------- | -------------------- |
| Components        | PascalCase      | -               | `ChatInterface.tsx`  |
| Hooks             | camelCase with 'use' | -          | `useConversationStreaming.ts` |
| API Routes        | -               | kebab-case      | `/api/chat/stream`   |
| Database Tables   | -               | snake_case      | `conversation_messages` |
| Store Actions     | camelCase       | -               | `setActiveWorkspace` |
| Service Methods   | camelCase       | camelCase       | `streamConversation` |
| Type Interfaces   | PascalCase      | PascalCase      | `ConversationMessage` |
