# External APIs

## Anthropic Claude API

- **Purpose:** AI-powered strategic coaching with streaming responses
- **Documentation:** https://docs.anthropic.com/claude/reference
- **Base URL(s):** https://api.anthropic.com/v1
- **Authentication:** API Key with Bearer token
- **Rate Limits:** Based on subscription tier, token-based pricing

**Key Endpoints Used:**
- `POST /messages` - Create streaming conversation with Claude Sonnet 4.0
- `POST /messages/stream` - Server-sent events for real-time responses

**Integration Notes:** Uses streaming for real-time coaching experience, implements token usage tracking, includes Mary coaching persona in system prompt
